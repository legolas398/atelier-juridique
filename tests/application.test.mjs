import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "../server/app.mjs";
import { createStore } from "../server/store.mjs";
import { parseDocument } from "../server/documents.mjs";
import { extractCell, ollamaAnswer } from "../server/analysis.mjs";
import { Document, Packer, Paragraph } from "docx";
import ExcelJS from "exceljs";
import { request as httpRequest } from "node:http";

function pdfFixture() {
  const stream =
    "BT /F1 12 Tf 40 750 Td (Duree du contrat : trois ans. Preavis : trente jours.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let out = "%PDF-1.4\n",
    offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const start = Buffer.byteLength(out);
  out += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(out);
}
test("Extraction réelle PDF et Word, rejet des formats invalides", async () => {
  const pdf = pdfFixture();
  const parsed = await parseDocument(
    { originalname: "contrat.pdf", buffer: pdf, size: pdf.length },
    "matter",
  );
  assert.equal(parsed.status, "ready");
  assert.match(parsed.text, /trois ans/);
  assert.equal(parsed.pages[0].number, 1);
  const docx = await Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            new Paragraph("Durée du contrat : vingt-quatre mois."),
            new Paragraph("Droit applicable : droit français."),
          ],
        },
      ],
    }),
  );
  const word = await parseDocument(
    { originalname: "contrat.docx", buffer: docx, size: docx.length },
    "matter",
  );
  assert.match(word.text, /vingt-quatre/);
  assert.match(word.pages[0].label, /pagination non conservée/);
  await assert.rejects(
    () =>
      parseDocument(
        {
          originalname: "faux.pdf",
          buffer: Buffer.from("pas un pdf"),
          size: 10,
        },
        "matter",
      ),
    /PDF valide/,
  );
  await assert.rejects(
    () =>
      parseDocument(
        { originalname: "malware.exe", buffer: Buffer.from("x"), size: 1 },
        "matter",
      ),
    /Formats acceptés/,
  );
});

test("Parcours API : import, revue, citation, correction, verrou, export, persistance et suppression", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "atelier-test-"));
  const instance = createApplication({ dataDir: dir, demo: false });
  const server = instance.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await instance.close();
    await rm(dir, { recursive: true, force: true });
  });
  const request = async (path, { body, headers = {}, ...options } = {}) => {
    const r = await fetch(base + "/api" + path, {
      ...options,
      headers: {
        "X-Atelier-Request": "local",
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...headers,
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    return { status: r.status, data: await r.json() };
  };
  assert.equal(
    (
      await fetch(base + "/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"title":"attack"}',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/state", {
        headers: { Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  const hostileHostStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(
      base + "/api/state",
      { headers: { Host: "evil.example" } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(hostileHostStatus, 403);
  const { data: matter } = await request("/matters", {
    method: "POST",
    body: { title: "Projet de test", client: "Fictif" },
  });
  assert.ok(matter.id);
  const content =
    "Contrat fictif de test\n\nDurée\nLa durée du contrat est de trois ans.\n\nPréavis\nLe préavis est de trente jours.\n\nDroit applicable\nLe contrat est régi par le droit français.";
  const upload = new FormData();
  upload.append("files", new Blob([content]), "contrat-test.txt");
  const imported = await request(`/matters/${matter.id}/documents`, {
    method: "POST",
    body: upload,
  });
  assert.equal(imported.status, 201);
  const doc = imported.data.documents[0];
  const duplicate = new FormData();
  duplicate.append("files", new Blob([content]), "copie.txt");
  assert.equal(
    (
      await request(`/matters/${matter.id}/documents`, {
        method: "POST",
        body: duplicate,
      })
    ).status,
    422,
  );
  const { data: other } = await request("/matters", {
    method: "POST",
    body: { title: "Autre dossier" },
  });
  assert.equal(
    (
      await request(`/matters/${other.id}/reviews`, {
        method: "POST",
        body: {
          title: "Interdit",
          documentIds: [doc.id],
          columns: [
            { id: "duration", title: "Durée", question: "Quelle durée ?" },
          ],
        },
      })
    ).status,
    400,
  );
  const { data: review } = await request(`/matters/${matter.id}/reviews`, {
    method: "POST",
    body: {
      title: "Revue test",
      documentIds: [doc.id],
      columns: [
        {
          id: "duration",
          title: "Durée",
          question: "Quelle est la durée du contrat ?",
          keywords: ["durée"],
        },
        {
          id: "insurance",
          title: "Assurance",
          question: "Quel est le montant de l’assurance ?",
          keywords: ["assurance"],
        },
      ],
    },
  });
  async function runReview() {
    assert.equal(
      (await request(`/reviews/${review.id}/run`, { method: "POST" })).status,
      202,
    );
    for (let i = 0; i < 100; i++) {
      const r = await request(`/reviews/${review.id}`);
      if (
        ["completed", "partial", "failed"].includes(r.data.runs.at(-1)?.status)
      )
        return r.data;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw Error("La revue ne termine pas");
  }
  let result = await runReview();
  let cell = result.cells.find((c) => c.columnId === "duration");
  assert.match(cell.value, /trois ans/);
  assert.equal(cell.citations[0].documentId, doc.id);
  assert.ok(doc.text.includes(cell.citations[0].quote));
  assert.equal(
    result.cells.find((c) => c.columnId === "insurance").status,
    "missing",
  );
  const { data: corrected } = await request(`/cells/${cell.id}`, {
    method: "PATCH",
    body: {
      revision: cell.revision,
      value: "Trois ans — vérifié manuellement",
    },
  });
  assert.equal(corrected.decision, "pending");
  assert.equal(corrected.history.length, 1);
  assert.equal(
    (
      await request(`/cells/${cell.id}`, {
        method: "PATCH",
        body: { revision: cell.revision, locked: true },
      })
    ).status,
    409,
  );
  const { data: locked } = await request(`/cells/${cell.id}`, {
    method: "PATCH",
    body: {
      revision: corrected.revision,
      locked: true,
      decision: "approved",
      comment: "Vérifié sur la clause Durée.",
    },
  });
  assert.equal(locked.comments.length, 1);
  assert.equal(
    (
      await request(`/cells/${cell.id}`, {
        method: "PATCH",
        body: { revision: locked.revision, value: "écrasement" },
      })
    ).status,
    409,
  );
  result = await runReview();
  cell = result.cells.find((c) => c.id === cell.id);
  assert.equal(cell.value, "Trois ans — vérifié manuellement");
  assert.equal(cell.locked, true);
  assert.equal(cell.decision, "approved");
  const started = await request(`/reviews/${review.id}/run`, {
    method: "POST",
  });
  await request(`/runs/${started.data.id}/cancel`, { method: "POST" });
  let cancelled;
  for (let i = 0; i < 100; i++) {
    cancelled = (await request(`/reviews/${review.id}`)).data.runs.at(-1);
    if (cancelled.status === "cancelled") break;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.equal(cancelled.status, "cancelled");
  assert.ok(cancelled.completed < cancelled.total);
  const xlsx = await fetch(
    `${base}/api/reviews/${review.id}/export?format=xlsx`,
  );
  assert.equal(xlsx.status, 200);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await xlsx.arrayBuffer()));
  assert.equal(workbook.worksheets.length, 2);
  assert.match(workbook.getWorksheet("Revue").getCell("B4").value, /Trois ans/);
  assert.match(workbook.getWorksheet("Revue").getCell("A2").value, /BROUILLON/);
  const word = await fetch(
    `${base}/api/reviews/${review.id}/export?format=docx`,
  );
  assert.equal(word.status, 200);
  assert.equal(
    Buffer.from(await word.arrayBuffer())
      .subarray(0, 2)
      .toString(),
    "PK",
  );
  const chat = await request(`/matters/${matter.id}/chat`, {
    method: "POST",
    body: { question: "Quelle est la durée du contrat ?" },
  });
  assert.equal(chat.status, 200);
  assert.ok(chat.data.message.citations.length > 0);
  const absent = await request(`/matters/${matter.id}/chat`, {
    method: "POST",
    body: { question: "Quelle assurance cyberrisque existe ?" },
  });
  assert.equal(absent.data.message.citations.length, 0);
  const { data: note } = await request(`/matters/${matter.id}/notes`, {
    method: "POST",
    body: { title: "Note", content: "Analyse humaine" },
  });
  assert.equal(
    (
      await request(`/notes/${note.id}`, {
        method: "PATCH",
        body: {
          title: "Note",
          content: "modifiée",
          updatedAt: "ancienne version",
        },
      })
    ).status,
    409,
  );
  const persisted = createStore(dir);
  assert.equal(persisted.get("cells", cell.id).locked, true);
  assert.equal(persisted.get("notes", note.id).content, "Analyse humaine");
  persisted.close();
  assert.equal(
    (await request(`/documents/${doc.id}`, { method: "DELETE" })).status,
    200,
  );
  assert.equal((await request(`/documents/${doc.id}`)).status, 404);
  assert.equal((await request(`/reviews/${review.id}`)).data.cells.length, 0);
  assert.ok(
    (await request(`/matters/${matter.id}/messages`)).data.every(
      (m) => m.role !== "assistant",
    ),
  );
  assert.equal(
    (
      await request("/settings", {
        method: "PUT",
        body: { engine: "ollama", model: "remote:cloud" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request(`/matters/${matter.id}/audit`)).data.some(
      (e) => e.action === "Document supprimé",
    ),
    true,
  );
});

test("Arrêt et reprise : résultats partiels préservés, statuts interrompus au redémarrage", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "atelier-recovery-"));
  const first = createApplication({ dataDir: dir });
  const review = first.store.all("reviews")[0];
  first.store.put(
    "runs",
    {
      id: "interrupted-run",
      reviewId: review.id,
      status: "running",
      completed: 2,
      total: 15,
    },
    { review_id: review.id },
  );
  await first.close();
  const second = createApplication({ dataDir: dir });
  assert.equal(
    second.store.get("runs", "interrupted-run").status,
    "interrupted",
  );
  assert.equal(second.store.all("cells").length, 15);
  await second.close();
  await rm(dir, { recursive: true, force: true });
});

test("Le mode lexical n’invente pas et Ollama rejette les citations fabriquées", async () => {
  assert.equal(
    extractCell({ status: "needs_ocr" }, { question: "Durée ?" }).status,
    "insufficient",
  );
  const actualFetch = globalThis.fetch;
  const sources = [
    {
      documentId: "doc",
      documentName: "fictif",
      quote: "Le contrat dure trois ans.",
      pageLabel: "Texte",
      blockId: "b1",
    },
  ];
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          answer: "Une invention.",
          citations: [{ source: 1, quote: "dix ans" }],
        }),
      }),
    });
    await assert.rejects(
      () => ollamaAnswer("test-local", "durée", sources),
      /non vérifiable/,
    );
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          answer: "Le contrat dure trois ans.",
          citations: [{ source: 1, quote: "trois ans" }],
        }),
        eval_count: 10,
      }),
    });
    const valid = await ollamaAnswer("test-local", "durée", sources);
    assert.equal(valid.citations[0].quote, "trois ans");
    assert.equal(valid.usage, 10);
  } finally {
    globalThis.fetch = actualFetch;
  }
});
