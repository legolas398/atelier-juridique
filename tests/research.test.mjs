import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mammoth from "mammoth";
import { createApplication } from "../server/app.mjs";
import {
  compareDocuments,
  searchEvidence,
  tokenDiff,
} from "../server/research.mjs";

test("recherche : termes entiers, expressions exactes, exclusions et synonymes", () => {
  const diff = tokenDiff("Préavis : 30 jours.", "Préavis : 60 jours.");
  assert.equal(
    diff.left
      .filter((t) => t.changed)
      .map((t) => t.text)
      .join(""),
    "30",
  );
  assert.equal(
    diff.right
      .filter((t) => t.changed)
      .map((t) => t.text)
      .join(""),
    "60",
  );
  const items = [
    { quote: "La responsabilité est plafonnée à 100 euros sauf faute lourde." },
    { quote: "La faute lourde relève de la responsabilité et assurance." },
    { quote: "Le règlement de la facture intervient sous trente jours." },
    { quote: "La cybersécurité est une mesure technique." },
  ];
  assert.equal(
    searchEvidence(items, 'responsabilité "faute lourde" -assurance').length,
    1,
  );
  assert.equal(searchEvidence(items, "cyber").length, 0);
  assert.equal(
    searchEvidence(items, "paiement", { mode: "any" })[0].quote,
    items[2].quote,
  );
  assert.equal(searchEvidence(items, "inexistant").length, 0);
});
test("comparaison et recherche : API, droits de dossier, annotations, export et suppression", async () => {
  const dir = await mkdtemp(join(tmpdir(), "atelier-research-"));
  const instance = createApplication({ dataDir: dir });
  const server = instance.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, body, method = body ? "POST" : "GET") => {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "X-Atelier-Request": "local",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, data: await r.json() };
  };
  try {
    const matter = instance.store.all("matters")[0];
    const docs = instance.store
      .all("documents")
      .filter((d) => d.matterId === matter.id);
    const comparison = await request(`/matters/${matter.id}/comparisons`, {
      leftId: docs[0].id,
      rightId: docs[1].id,
    });
    assert.equal(comparison.status, 201);
    assert.ok(comparison.data.changes.length);
    const change = comparison.data.changes[0];
    const updated = await request(
      `/comparisons/${comparison.data.id}`,
      {
        revision: 1,
        changeId: change.id,
        decision: "flagged",
        comment: "Vérifier le plafond",
      },
      "PATCH",
    );
    assert.equal(updated.data.revision, 2);
    assert.equal(
      (
        await request(
          `/comparisons/${comparison.data.id}`,
          {
            revision: 1,
            changeId: change.id,
            decision: "accepted",
            comment: "",
          },
          "PATCH",
        )
      ).status,
      409,
    );
    const same = compareDocuments(docs[0], docs[0]);
    assert.ok(same.every((c) => c.status === "unchanged"));
    const reference = await request(`/matters/${matter.id}/references`, {
      title: "Source synthétique autorisée",
      text: "Le règlement de la facture est soumis à un délai de trente jours. Ceci est un texte de test fictif.",
      url: "https://example.org/source",
      jurisdiction: "FR",
      kind: "internal",
      date: "2026-01-01",
      validUntil: "2027-01-01",
    });
    assert.equal(reference.status, 201);
    const result = await request(`/matters/${matter.id}/research`, {
      query: "paiement",
      corpus: "references",
      mode: "any",
      asOf: "2026-10-18",
    });
    assert.equal(result.data.results.length, 1);
    assert.equal(result.data.results[0].referenceId, reference.data.id);
    assert.equal(
      (
        await request(`/matters/${matter.id}/research`, {
          query: "paiement",
          corpus: "references",
          mode: "any",
          asOf: "2027-01-01",
        })
      ).data.results.length,
      0,
    );
    assert.equal(
      (
        await request(`/matters/${matter.id}/research`, {
          query: "paiement",
          corpus: "documents",
          documentIds: ["invalid"],
        })
      ).status,
      422,
    );
    assert.equal(
      (
        await request(
          `/research/${result.data.id}/bookmarks`,
          { bookmarks: [0] },
          "PATCH",
        )
      ).data.bookmarks.length,
      1,
    );
    const exported = await fetch(
      base + `/api/research/${result.data.id}/evidence.docx`,
    );
    assert.equal(exported.status, 200);
    const text = await mammoth.extractRawText({
      buffer: Buffer.from(await exported.arrayBuffer()),
    });
    assert.match(text.value, /trente jours/);
    assert.match(text.value, /non vérifiés/);
    const docSearch = await request(`/matters/${matter.id}/research`, {
      query: "confidentialité",
      corpus: "documents",
      mode: "any",
      documentIds: [docs[0].id],
    });
    assert.ok(docSearch.data.results.length);
    await request(`/documents/${docs[0].id}`, null, "DELETE");
    assert.equal(instance.store.get("comparisons", comparison.data.id), null);
    assert.equal(
      instance.store.get("research_sessions", docSearch.data.id),
      null,
    );
    await request(`/references/${reference.data.id}`, null, "DELETE");
    assert.equal(instance.store.get("research_sessions", result.data.id), null);
  } finally {
    await new Promise((r) => server.close(r));
    await instance.close();
    await rm(dir, { recursive: true, force: true });
  }
});
