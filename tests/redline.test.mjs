import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { JSDOM } from "jsdom";
import { Document, Packer, Paragraph } from "docx";
import mammoth from "mammoth";
import { compareDocuments } from "../server/research.mjs";
import { comparisonWord } from "../server/redline.mjs";
import { createApplication } from "../server/app.mjs";

const left = [
  "CONTRAT FICTIF",
  "Article 1 : paiement sous 30 jours & confidentialité.",
  "Article 2 : clause supprimée.",
  "Article 3 : texte commun.\nDeuxième ligne préservée.",
  "Signature supprimée.",
];
const right = [
  "Préambule ajouté : version <révisée>.",
  "CONTRAT FICTIF",
  "Article 1 : paiement sous 60 jours & confidentialité.",
  "Article 3 : texte commun.\nDeuxième ligne préservée.",
];
function doc(id, paragraphs) {
  return {
    id,
    name: `${id}.txt`,
    hash: createHash("sha256").update(paragraphs.join("\n\n")).digest("hex"),
    pages: [
      {
        number: 1,
        label: "Texte",
        blocks: paragraphs.map((text, i) => ({ id: `b-${i}`, text })),
      },
    ],
    sourceType: "primary",
    warnings: [],
  };
}
const comparison = () => ({
  id: "test",
  leftName: "original.txt",
  rightName: "revised.txt",
  leftHash: doc("left", left).hash,
  rightHash: doc("right", right).hash,
  createdAt: "2026-10-18T12:00:00.000Z",
  changes: compareDocuments(doc("left", left), doc("right", right)),
});
const xmlDocument = (xml) =>
  new JSDOM(xml, { contentType: "application/xml" }).window.document;
function project(xml, accept) {
  const document = xmlDocument(xml),
    body = document.getElementsByTagName("w:body")[0];
  function text(node) {
    if (node.nodeType !== 1) return "";
    if (
      (node.nodeName === "w:ins" && !accept) ||
      (node.nodeName === "w:del" && accept)
    )
      return "";
    if (["w:t", "w:delText"].includes(node.nodeName)) return node.textContent;
    if (node.nodeName === "w:br") return "\n";
    if (node.nodeName === "w:tab") return "\t";
    if (node.nodeName === "w:pPr") return "";
    return [...node.childNodes].map(text).join("");
  }
  return [...body.children]
    .filter((n) => n.nodeName === "w:p")
    .filter((p) => {
      const props = [...p.children].find((n) => n.nodeName === "w:pPr");
      return !props?.getElementsByTagName(accept ? "w:del" : "w:ins").length;
    })
    .map(text)
    .join("\n\n");
}
test("Word redline : vraies révisions, acceptation = révisé, rejet = original, exports propres", async () => {
  const c = comparison(),
    buffer = await comparisonWord(c),
    zip = await JSZip.loadAsync(buffer),
    xml = await zip.file("word/document.xml").async("string"),
    settings = await zip.file("word/settings.xml").async("string");
  assert.match(xml, /<w:ins /);
  assert.match(xml, /<w:del /);
  assert.match(xml, /<w:delText/);
  assert.match(settings, /<w:trackRevisions/);
  assert.equal(project(xml, true), right.join("\n\n"));
  assert.equal(project(xml, false), left.join("\n\n"));
  const parsed = xmlDocument(xml);
  // XML qualified names are inspected directly: revision ids must be unique.
  const revisions = [
    ...parsed.getElementsByTagName("w:ins"),
    ...parsed.getElementsByTagName("w:del"),
  ].map((n) => n.getAttribute("w:id"));
  assert.ok(revisions.length >= 5);
  assert.equal(new Set(revisions).size, revisions.length);
  for (const [mode, expected] of [
    ["original", left],
    ["revised", right],
  ]) {
    const clean = await comparisonWord(c, mode),
      cleanZip = await JSZip.loadAsync(clean),
      cleanXML = await cleanZip.file("word/document.xml").async("string");
    assert.doesNotMatch(cleanXML, /<w:(ins|del) /);
    assert.equal(project(cleanXML, true), expected.join("\n\n"));
    assert.ok(
      (await mammoth.extractRawText({ buffer: clean })).value.includes(
        "CONTRAT FICTIF",
      ),
    );
  }
});
test("Import direct de deux DOCX, comparaison, export redline et refus des pièces hors dossier", async () => {
  const directory = await mkdtemp(join(tmpdir(), "atelier-redline-")),
    instance = createApplication({ dataDir: directory, demo: false }),
    server = instance.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, body, method = "POST") => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "X-Atelier-Request": "local",
        ...(!(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  };
  try {
    const matter = (await request("/matters", { title: "Redline fictif" }))
        .data,
      other = (await request("/matters", { title: "Autre dossier" })).data;
    const documents = [];
    for (const [name, paragraphs] of [
      ["original.docx", left],
      ["revised.docx", right],
    ]) {
      const buffer = await Packer.toBuffer(
        new Document({
          sections: [
            { children: paragraphs.map((text) => new Paragraph(text)) },
          ],
        }),
      );
      const form = new FormData();
      form.append("files", new Blob([buffer]), name);
      const result = await request(
        `/matters/${matter.id}/documents?reuse=true`,
        form,
      );
      assert.equal(result.status, 201);
      documents.push(result.data.documents[0]);
      if (documents.length === 1) {
        const duplicate = new FormData();
        duplicate.append("files", new Blob([buffer]), name);
        assert.equal(
          (
            await request(
              `/matters/${matter.id}/documents?reuse=true`,
              duplicate,
            )
          ).data.documents[0].id,
          documents[0].id,
        );
      }
    }
    const result = await request(`/matters/${matter.id}/comparisons`, {
      leftId: documents[0].id,
      rightId: documents[1].id,
    });
    assert.equal(result.status, 201);
    const response = await fetch(
      base + `/comparisons/${result.data.id}/word?mode=redline`,
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-disposition"), /redline\.docx/);
    const zip = await JSZip.loadAsync(
        Buffer.from(await response.arrayBuffer()),
      ),
      xml = await zip.file("word/document.xml").async("string");
    assert.equal(project(xml, true), right.join("\n\n"));
    assert.equal(project(xml, false), left.join("\n\n"));
    assert.equal(
      (
        await request(`/matters/${other.id}/comparisons`, {
          leftId: documents[0].id,
          rightId: documents[1].id,
        })
      ).status,
      422,
    );
    const same = await request(`/matters/${matter.id}/comparisons`, {
      leftId: documents[0].id,
      rightId: documents[0].id,
    });
    assert.equal(same.status, 201);
    assert.ok(same.data.changes.every((c) => c.status === "unchanged"));
    assert.equal(
      (await fetch(base + `/comparisons/${result.data.id}/word?mode=unsafe`))
        .status,
      422,
    );
  } finally {
    await new Promise((r) => server.close(r));
    await instance.close();
    await rm(directory, { recursive: true, force: true });
  }
});
