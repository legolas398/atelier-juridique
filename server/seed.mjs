import { uid, now } from "./store.mjs";
import { createHash } from "node:crypto";
import { makePages } from "./documents.mjs";
import { DEFAULT_COLUMNS, extractCell } from "./analysis.mjs";

export function seed(store) {
  for (const document of store.all("documents")) {
    if (document.hash === "demo") {
      store.put(
        "documents",
        {
          ...document,
          hash: createHash("sha256").update(document.text).digest("hex"),
        },
        { matter_id: document.matterId },
      );
    }
  }
  if (store.all("matters").length) return;
  const matter = {
    id: uid(),
    title: "Acquisition · Maison Rivage",
    client: "Maison Rivage",
    description:
      "Revue des contrats fournisseurs avant acquisition. Dossier de démonstration entièrement fictif.",
    practice: "M&A · Due diligence",
    color: "sage",
    demo: true,
    createdAt: now(),
  };
  store.put("matters", matter);
  const content = [
    [
      "Accord de confidentialité — Aster.txt",
      `DOCUMENT FICTIF — DÉMONSTRATION ATELIER\nACCORD DE CONFIDENTIALITÉ · ASTER / MAISON RIVAGE\n\n1. Parties\nLa société Aster Conseil et la société Maison Rivage concluent un accord de confidentialité réciproque.\n\n2. Durée\nLe présent accord est conclu pour une durée de trois (3) ans à compter du 1er janvier 2026. Les obligations de confidentialité survivent pendant deux ans à sa cessation.\n\n3. Préavis\nChaque partie peut résilier l’accord avec un préavis écrit de trente (30) jours.\n\n4. Droit applicable\nLe présent accord est régi par le droit français. Les tribunaux de Paris sont compétents.\n\n5. Responsabilité\nLa responsabilité totale de chaque partie est plafonnée à 100 000 euros. Ce plafond ne s’applique pas en cas de faute lourde ou de violation des obligations de confidentialité.\n\n6. Renouvellement\nL’accord ne fait l’objet d’aucun renouvellement automatique.`,
    ],
    [
      "Contrat de services — Horizon.txt",
      `DOCUMENT FICTIF — DÉMONSTRATION ATELIER\nCONTRAT DE SERVICES · HORIZON / MAISON RIVAGE\n\n1. Objet\nHorizon fournit à Maison Rivage des services de maintenance et d’assistance informatique.\n\n2. Durée\nLe contrat est conclu pour une durée de vingt-quatre (24) mois à compter du 1er mars 2026.\n\n3. Résiliation et préavis\nLa résiliation doit être notifiée par lettre recommandée au moins soixante (60) jours avant l’échéance.\n\n4. Droit applicable\nLe contrat est soumis au droit français et à la compétence exclusive des tribunaux de Lyon.\n\n5. Limitation de responsabilité\nLa responsabilité du prestataire est limitée au montant des honoraires versés au cours des douze derniers mois. Les dommages corporels et la faute intentionnelle sont exclus de cette limitation.\n\n6. Reconduction\nLe contrat est renouvelé automatiquement pour des périodes successives de douze mois, sauf dénonciation dans le délai de préavis.`,
    ],
    [
      "Bail commercial — Les Ateliers.txt",
      `DOCUMENT FICTIF — DÉMONSTRATION ATELIER\nBAIL COMMERCIAL · LES ATELIERS / MAISON RIVAGE\n\n1. Parties et locaux\nLa SCI Les Ateliers donne à bail à Maison Rivage des locaux commerciaux situés à Nantes.\n\n2. Durée\nLe bail est consenti pour une durée de neuf (9) ans à compter du 1er avril 2026.\n\n3. Préavis\nLe preneur peut donner congé à l’expiration de chaque période triennale, avec un préavis de six (6) mois.\n\n4. Droit applicable\nLe présent bail est régi par le droit français.\n\n5. Renouvellement\nLe renouvellement du bail est soumis à une demande expresse dans les conditions prévues au contrat.`,
    ],
  ];
  const docs = content.map(([name, text]) => {
    const doc = {
      id: uid(),
      matterId: matter.id,
      name,
      type: "text",
      size: Buffer.byteLength(text),
      pages: makePages(text),
      text,
      hash: createHash("sha256").update(text).digest("hex"),
      status: "ready",
      sourceType: "primary",
      warnings: [],
      createdAt: now(),
    };
    store.addDocument(doc, Buffer.from(text));
    return doc;
  });
  const review = {
    id: uid(),
    matterId: matter.id,
    title: "Revue des points essentiels",
    columns: DEFAULT_COLUMNS,
    documentIds: docs.map((d) => d.id),
    createdAt: now(),
  };
  store.put("reviews", review, { matter_id: matter.id });
  for (const doc of docs)
    for (const col of review.columns)
      store.put(
        "cells",
        {
          id: uid(),
          reviewId: review.id,
          documentId: doc.id,
          columnId: col.id,
          ...extractCell(doc, col),
          revision: 1,
          locked: false,
          decision: "pending",
          comments: [],
          history: [],
          engine: "extractive",
          updatedAt: now(),
        },
        { review_id: review.id, document_id: doc.id },
      );
  store.put(
    "notes",
    {
      id: uid(),
      matterId: matter.id,
      title: "Note de revue",
      content:
        "Dossier fictif de démonstration.\n\nPoints à vérifier :\n• Comparer les durées de confidentialité et de survie.\n• Examiner les exceptions aux plafonds de responsabilité.\n• Confirmer les préavis avant chaque échéance.\n\nLes extraits sont des pistes de revue, à confirmer dans les documents.",
      updatedAt: now(),
    },
    { matter_id: matter.id },
  );
}
