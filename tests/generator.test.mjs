import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mammoth from "mammoth";
import { BUILTIN_TEMPLATES } from "../server/legal/catalog.mjs";
import {
  generateDocument,
  cents,
  validDate,
} from "../server/legal/generator.mjs";
import { createApplication } from "../server/app.mjs";

export const baseAnswers = {
  jurisdiction: "FR",
  scope: "b2b",
  p1name: "Aster Test",
  p1form: "SAS fictive",
  p1siren: "123456789",
  p1address: "1 rue Fictive, Paris",
  p1representative: "Alice Exemple",
  p1capacity: "Présidente",
  p2name: "Rivage Test",
  p2form: "SARL fictive",
  p2siren: "987654321",
  p2address: "2 rue Fictive, Lyon",
  p2representative: "Paul Exemple",
  p2capacity: "Gérant",
  signDate: "2026-10-18",
  signCity: "Paris",
};
export const ndaAnswers = {
  ...baseAnswers,
  ndaType: "mutual",
  purpose: "Évaluer une collaboration commerciale fictive sur le projet Atlas.",
  information:
    "Plans techniques identifiés CONFIDENTIEL et comptes rendus écrits des réunions désignées.",
  recipients:
    "Équipe projet nommément autorisée et conseils tenus au secret professionnel.",
  startDate: "2026-11-01",
  endDate: "2026-12-31",
  survivalYears: "3",
  returnDays: "15",
};
const serviceAnswers = {
  ...baseAnswers,
  mission: "Audit technique fictif de la plateforme Atlas.",
  deliverables: "Rapport PDF et atelier de restitution au 15 décembre 2026.",
  acceptance:
    "Couverture des dix modules listés et présence des résultats de tests.",
  acceptanceDays: "15",
  obligation: "means",
  cooperation: "Accès de test et documentation à jour fournis avant le début.",
  startDate: "2026-11-01",
  endDate: "2026-12-15",
  price: "12000,50",
  taxRegime: "vat",
  vatRate: "20",
  paymentDays: "30",
  invoiceType: "single",
  liabilityCap: "24000",
  insurance: "Assureur fictif, police TEST-001, garantie 100 000 euros.",
  cureDays: "15",
  personalData: "no",
  usage:
    "Consultation du rapport et diffusion aux salariés chargés de la sécurité.",
  licenseYears: "5",
};
const amendmentAnswers = {
  ...baseAnswers,
  contractTitle: "Prestation fictive ATLAS-001",
  contractDate: "2026-01-01",
  priorAmendments: "Aucun.",
  reason: "Prolongation de la mission.",
  replacedArticles: "Article 3 — Durée",
  replacementText: "Article 3. La mission se termine le 31 décembre 2026.",
  effectiveDate: "2026-11-01",
  impacts:
    "Calendrier actualisé ; aucun changement de prix après vérification.",
};
const demandAnswers = {
  ...baseAnswers,
  invoiceRef: "FA-TEST-2026-001",
  invoiceDate: "2026-08-01",
  dueDate: "2026-09-01",
  principal: "1200,50",
  paid: "200,25",
  basis: "Prestation fictive livrée et acceptée le 31 juillet 2026.",
  evidence: "Facture, bon de commande et procès-verbal de recette fictifs.",
  deadlineDays: "15",
  paymentMethod: "Virement sur le compte indiqué sur la facture jointe.",
  delivery: "registered",
  dispute: "no",
};
const template = (id) => BUILTIN_TEMPLATES.find((t) => t.id === id);
test("Génération déterministe des quatre documents, références et montants exacts", () => {
  for (const [id, answers] of [
    ["fr-nda", ndaAnswers],
    ["fr-services", serviceAnswers],
    ["fr-amendment", amendmentAnswers],
    ["fr-demand", demandAnswers],
  ]) {
    const output = generateDocument(template(id), answers, {}, "2026-10-18");
    assert.equal(
      output.legal.blockingCount,
      0,
      JSON.stringify(output.legal.issues),
    );
    assert.ok(output.content.sections.length >= 5);
    assert.ok(output.legal.sources.length);
    assert.ok(output.content.sections.every((s) => !s.body.includes("⟦")));
    assert.equal(
      output.contentHash,
      generateDocument(template(id), answers, {}, "2026-10-18").contentHash,
    );
  }
  const demand = generateDocument(template("fr-demand"), demandAnswers);
  assert.match(
    demand.content.sections.find((s) => s.id === "demand").body,
    /1.?000,25/,
  );
  assert.equal(cents("1200,50") - cents("200,25"), 100025);
  assert.equal(cents("1.005"), null);
  assert.equal(cents("-5"), null);
  assert.equal(validDate("2026-02-30"), false);
});
test("Contrôles des incompatibilités, champs vides et références à actualiser", () => {
  const issues = (id, answers, asOf = "2026-10-18") =>
    generateDocument(template(id), answers, {}, asOf)
      .legal.issues.filter((i) => i.severity === "blocking")
      .map((i) => i.id);
  assert.ok(issues("fr-nda", {}).includes("missing-p1name"));
  assert.ok(
    issues("fr-nda", { ...ndaAnswers, jurisdiction: "OTHER" }).includes(
      "jurisdiction",
    ),
  );
  assert.ok(
    issues("fr-nda", { ...ndaAnswers, scope: "consumer" }).includes("scope"),
  );
  assert.ok(
    issues("fr-nda", { ...ndaAnswers, endDate: "2026-01-01" }).includes(
      "date-order",
    ),
  );
  assert.ok(
    issues("fr-nda", {
      ...ndaAnswers,
      forumCity: "Paris",
      bothCommercial: "no",
    }).includes("venue-condition"),
  );
  const exclusive = generateDocument(template("fr-nda"), {
    ...ndaAnswers,
    forumCity: "Paris",
    bothCommercial: "yes",
  });
  assert.equal(
    exclusive.content.sections.find((s) => s.id === "disputes").emphasis,
    true,
  );
  assert.ok(
    issues("fr-services", { ...serviceAnswers, paymentDays: "61" }).includes(
      "invalid-paymentDays",
    ),
  );
  assert.ok(
    issues("fr-services", {
      ...serviceAnswers,
      invoiceType: "periodic",
      paymentDays: "60",
      schedule: "Mensuel.",
    }).includes("periodic-payment"),
  );
  assert.ok(
    issues("fr-services", {
      ...serviceAnswers,
      personalData: "yes",
      dpaText: "RGPD applicable.",
    }).includes("dpa-short"),
  );
  assert.ok(
    issues("fr-services", {
      ...serviceAnswers,
      signDate: "2027-01-01",
    }).includes("expired-payment"),
  );
  assert.ok(
    issues("fr-services", serviceAnswers, "2027-01-01").includes(
      "expired-payment",
    ),
  );
  assert.ok(
    issues("fr-amendment", {
      ...amendmentAnswers,
      contractDate: "2027-01-01",
    }).includes("contract-after-amendment"),
  );
  assert.ok(
    issues("fr-demand", { ...demandAnswers, dueDate: "2026-11-01" }).includes(
      "not-due",
    ),
  );
  assert.ok(
    issues("fr-demand", { ...demandAnswers, paid: "1200,50" }).includes(
      "paid-claim",
    ),
  );
  assert.ok(
    issues("fr-demand", { ...demandAnswers, dispute: "unknown" }).includes(
      "disputed-claim",
    ),
  );
  assert.throws(
    () => generateDocument(template("fr-nda"), { ...ndaAnswers, unknown: "x" }),
    /inconnu/,
  );
  assert.ok(
    generateDocument(template("fr-nda"), ndaAnswers, { purpose: "{{oubli}}" })
      .legal.blockingCount > 0,
  );
});
test("Parcours générateur HTTP : sauvegarde, relecture liée à une empreinte, export et réinitialisation", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "atelier-generator-"));
  const instance = createApplication({
    dataDir: dir,
    demo: false,
    legalClock: () => "2026-10-18",
  });
  const server = instance.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await instance.close();
    await rm(dir, { recursive: true, force: true });
  });
  const req = async (path, method = "GET", body) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Atelier-Request": "local",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  };
  const { data: matter } = await req("/matters", "POST", {
    title: "Générateur fictif",
  });
  const prefix = `/matters/${matter.id}/generator`;
  assert.equal((await req(prefix + "/templates")).data.length, 24);
  const payload = {
    templateId: "fr-nda",
    title: "NDA de test",
    answers: ndaAnswers,
  };
  const incomplete = await req(prefix + "/drafts", "POST", {
    ...payload,
    answers: { jurisdiction: "FR" },
  });
  assert.equal(incomplete.status, 201);
  assert.ok(incomplete.data.legal.blockingCount);
  assert.equal(
    (
      await fetch(
        base + `/generator/drafts/${incomplete.data.id}/export?mode=reviewed`,
      )
    ).status,
    422,
  );
  const { data: preview } = await req(prefix + "/preview", "POST", payload);
  let { data: draft } = await req(prefix + "/drafts", "POST", payload);
  assert.equal(draft.contentHash, preview.contentHash);
  assert.equal(draft.status, "draft");
  const reviewBody = () => ({
    revision: draft.revision,
    contentHash: draft.contentHash,
    reviewer: "Relecteur fictif",
    capacity: "legal",
    acknowledgements: [
      ...draft.content.sections.map((s) => "clause:" + s.id),
      ...draft.legal.requiredReviewItems.map((i) => "check:" + i.id),
      "check:limits",
    ],
  });
  assert.equal(
    (
      await req(`/generator/drafts/${draft.id}/review`, "POST", {
        ...reviewBody(),
        acknowledgements: [],
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await req(`/generator/drafts/${draft.id}/review`, "POST", {
        ...reviewBody(),
        contentHash: "incorrect",
      })
    ).status,
    409,
  );
  const checked = await req(
    `/generator/drafts/${draft.id}/review`,
    "POST",
    reviewBody(),
  );
  assert.equal(checked.status, 200);
  draft = checked.data;
  assert.equal(draft.status, "reviewed");
  assert.equal(draft.review.identityVerified, false);
  const exported = await fetch(
    base + `/generator/drafts/${draft.id}/export?mode=reviewed`,
  );
  assert.equal(exported.status, 200);
  const docx = Buffer.from(await exported.arrayBuffer());
  assert.equal(docx.subarray(0, 2).toString(), "PK");
  const extracted = await mammoth.extractRawText({ buffer: docx });
  assert.match(extracted.value, /RELECTURE ENREGISTRÉE/);
  assert.match(extracted.value, /Aster Test/);
  assert.match(extracted.value, /1112-2/);
  assert.match(extracted.value, /SANS CERTIFICATION/);
  const modified = await req(`/generator/drafts/${draft.id}`, "PUT", {
    ...payload,
    revision: draft.revision,
    overrides: {
      purpose: "Périmètre relu et modifié manuellement par le test.",
    },
  });
  assert.equal(modified.status, 200);
  assert.equal(modified.data.review, null);
  assert.equal(modified.data.status, "draft");
  assert.equal(modified.data.history.length, 1);
  assert.ok(modified.data.history[0].review);
  assert.ok(modified.data.legal.issues.some((i) => i.id === "edited-purpose"));
  assert.equal(
    (
      await req(`/generator/drafts/${draft.id}`, "PUT", {
        ...payload,
        revision: draft.revision,
      })
    ).status,
    409,
  );
  assert.equal(
    (await fetch(base + `/generator/drafts/${draft.id}/export?mode=reviewed`))
      .status,
    422,
  );
  const custom = await req(prefix + "/templates", "POST", {
    title: "Lettre de cabinet fictive",
    body: "Objet : {{objet}}\nDestinataire : {{destinataire}}\nNotre analyse : {{analyse}}.",
  });
  assert.equal(custom.status, 201);
  assert.equal(custom.data.origin, "cabinet");
  const letter = await req(prefix + "/preview", "POST", {
    templateId: custom.data.id,
    answers: {
      jurisdiction: "FR",
      scope: "b2b",
      objet: "Analyse fictive",
      destinataire: "Société Test",
      analyse: "Aucun fait réel.",
    },
  });
  assert.equal(letter.status, 200);
  assert.equal(letter.data.legal.blockingCount, 0);
  assert.ok(letter.data.legal.issues.some((i) => i.id === "custom-review"));
  assert.match(letter.data.content.sections[0].body, /Analyse fictive/);
  assert.equal(
    (
      await req(prefix + "/templates", "POST", {
        title: "Variable invalide",
        body: "Une tentative {{constructor.bad()}} qui ne doit pas être interprétée.",
      })
    ).status,
    400,
  );
});
