import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILTIN_TEMPLATES } from "../server/legal/catalog.mjs";
import { generateDocument } from "../server/legal/generator.mjs";
import { common, fixtures } from "./fixtures/extended-answers.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mammoth from "mammoth";
import { createApplication } from "../server/app.mjs";
const generate = (id, extra = {}) =>
  generateDocument(
    BUILTIN_TEMPLATES.find((t) => t.id === id),
    { ...common, ...fixtures[id], ...extra },
    {},
    "2026-10-18",
  );

test("Les nouvelles trames sont enregistrables et exportables en Word par les vraies API", async () => {
  const directory = await mkdtemp(join(tmpdir(), "atelier-catalogue-")),
    instance = createApplication({
      dataDir: directory,
      demo: false,
      legalClock: () => "2026-10-18",
    }),
    server = instance.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const post = async (path, body) => {
    const r = await fetch(base + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Atelier-Request": "local",
      },
      body: JSON.stringify(body),
    });
    return { status: r.status, data: await r.json() };
  };
  try {
    const matter = (await post("/matters", { title: "Catalogue fictif" })).data;
    for (const [id, answers] of Object.entries(fixtures)) {
      const saved = await post(`/matters/${matter.id}/generator/drafts`, {
        templateId: id,
        answers: { ...common, ...answers },
      });
      assert.equal(saved.status, 201, `${id}: ${JSON.stringify(saved.data)}`);
      assert.equal(saved.data.legal.blockingCount, 0, id);
      const exported = await fetch(
        base + `/generator/drafts/${saved.data.id}/export`,
      );
      assert.equal(exported.status, 200, id);
      const text = (
        await mammoth.extractRawText({
          buffer: Buffer.from(await exported.arrayBuffer()),
        })
      ).value;
      assert.ok(text.includes(saved.data.content.title), id);
      assert.match(text, /PROJET/);
      assert.match(text, /Aster Fictif/);
      assert.match(text, /Dossier de contrôle/);
    }
  } finally {
    await new Promise((r) => server.close(r));
    await instance.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Catalogue : vingt-quatre modèles distincts, vingt nouveaux questionnaires complets et sourcés", () => {
  assert.equal(BUILTIN_TEMPLATES.length, 24);
  assert.equal(new Set(BUILTIN_TEMPLATES.map((t) => t.id)).size, 24);
  const signatures = new Set();
  for (const id of Object.keys(fixtures)) {
    const output = generate(id);
    assert.equal(
      output.legal.blockingCount,
      0,
      `${id}: ${JSON.stringify(output.legal.issues)}`,
    );
    assert.ok(output.content.sections.length >= 7, id);
    assert.ok(
      output.legal.sources.every((s) => s.id && s.url?.startsWith("https://")),
    );
    assert.ok(output.legal.requiredReviewItems.length >= 4);
    assert.ok(output.content.sections.every((s) => !s.body.includes("⟦")));
    signatures.add(output.content.sections.map((s) => s.body).join("\n"));
    const missing = generateDocument(
      BUILTIN_TEMPLATES.find((t) => t.id === id),
      common,
      {},
      "2026-10-18",
    );
    assert.ok(
      missing.legal.blockingCount > 0,
      `${id}: un questionnaire incomplet doit bloquer la relecture`,
    );
  }
  assert.equal(signatures.size, 20);
});
test("Contrôles de fond : RGPD, sous-traitance, droits, préavis et recette", () => {
  const dpa = generate("fr-dpa");
  for (const id of [
    "processing",
    "instructions",
    "security",
    "subprocessors",
    "incidents",
    "audit",
    "exit",
  ])
    assert.ok(dpa.content.sections.some((s) => s.id === id));
  assert.match(
    dpa.content.sections.find((s) => s.id === "subprocessors").body,
    /30 jours/,
  );
  assert.match(
    generate("fr-dpa", { authorization: "specific" }).content.sections.find(
      (s) => s.id === "subprocessors",
    ).body,
    /spécifique préalable/,
  );
  assert.ok(
    generate("fr-subcontracting", {
      approvalConfirmed: "no",
    }).legal.issues.some(
      (i) => i.id === "subcontract-approval" && i.severity === "blocking",
    ),
  );
  assert.ok(
    generate("fr-ip-assignment", { chainConfirmed: "no" }).legal.issues.some(
      (i) => i.id === "ip-chain" && i.severity === "blocking",
    ),
  );
  assert.ok(
    generate("fr-notice-termination", {
      receiptDate: "2026-12-20",
    }).legal.issues.some((i) => i.id === "notice-short"),
  );
  assert.ok(
    generate("fr-notice-termination", {
      noticeReviewed: "no",
    }).legal.issues.some((i) => i.id === "notice-review"),
  );
  assert.ok(
    generate("fr-acceptance", { decision: "accepted" }).legal.issues.some(
      (i) => i.id === "acceptance-conflict",
    ),
  );
  assert.ok(
    generate("fr-saas", { dpaText: "RGPD." }).legal.issues.some(
      (i) => i.id === "dpa-detail",
    ),
  );
  assert.ok(
    generate("fr-loan-equipment", { endDate: "2026-01-01" }).legal.issues.some(
      (i) => i.id === "date-order",
    ),
  );
});
test("Échéancier : centimes conservés, fins de mois, date et principal contrôlés", () => {
  const output = generate("fr-payment-plan");
  const schedule = output.content.sections.find(
    (s) => s.id === "schedule",
  ).body;
  assert.match(schedule, /2026-10-31 : 33,33/);
  assert.match(schedule, /2026-11-30 : 33,33/);
  assert.match(schedule, /2026-12-31 : 33,35/);
  assert.equal(
    [...schedule.matchAll(/: (\d+),(\d{2})/g)].reduce(
      (n, m) => n + Number(m[1]) * 100 + Number(m[2]),
      0,
    ),
    10001,
  );
  assert.ok(
    generate("fr-payment-plan", { dueDate: "2026-12-31" }).legal.issues.some(
      (i) => i.id === "debt-not-due",
    ),
  );
  assert.ok(
    generate("fr-payment-plan", {
      firstPaymentDate: "2026-09-01",
    }).legal.issues.some((i) => i.id === "payment-before-sign"),
  );
  assert.ok(
    generate("fr-payment-plan", { principal: "0,01" }).legal.issues.some(
      (i) => i.id === "installment-small",
    ),
  );
});
