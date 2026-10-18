import { uid, now } from "./store.mjs";
import { createHash } from "node:crypto";
import { makePages } from "./documents.mjs";
import { DEFAULT_COLUMNS, extractCell } from "./analysis.mjs";
import { BUILTIN_TEMPLATES } from "./legal/catalog.mjs";
import { fingerprint, generateDocument } from "./legal/generator.mjs";

function seedDraftExamples(store, matter) {
  const examples = [
    {
      templateId: "fr-consortium-digital",
      title: "Projet Atlas · accord de consortium (exemple)",
      answers: {
        project: "Prototype Atlas de recherche documentaire",
        partners: "Aster Conseil pilote ; Boréal Recherche contribue à l’indexation ; pouvoirs à vérifier.",
        governance: "Comité mensuel ; décisions de périmètre et budget à l’unanimité ; compte rendu sous cinq jours ; escalade aux directions sous quinze jours.",
        workPackages: "Lot 1 cadrage par Aster ; lot 2 indexation par Boréal ; prototype commun au mois six selon les dépendances de données autorisées.",
        budget: "Aster 60 000 euros ; Boréal 40 000 euros ; apports en nature détaillés en annexe ; versements trimestriels sur justificatifs.",
        backgroundIp: "Aster apporte ses méthodes et corpus autorisés ; Boréal son moteur préexistant ; inventaire des droits et restrictions en annexe.",
        resultsIp: "Résultats inventoriés par livrable ; droits d’accès nécessaires au projet ; exploitation commerciale définie par écrit avant usage.",
        publication: "Revue préalable de trente jours pour protéger les informations confidentielles et déposer les titres utiles, sans veto indéfini.",
        confidentiality: "Informations non publiques identifiées ; accès limité aux équipes du projet ; exceptions pour informations publiques ou déjà connues.",
        dataSecurity: "Corpus synthétiques ; accès nominatif, chiffrement et journalisation ; rôles RGPD à confirmer avant tout changement de données.",
        liability: "Assurances professionnelles déclarées ; plafonds et exclusions à négocier en fonction des obligations et risques réels.",
        partnerExit: "Mise en demeure et délai de remède de trente jours ; plan de continuité, retrait des accès et maintien des droits nécessaires à l’achèvement.",
        dispute: "Escalade entre responsables de lots puis dirigeants ; médiation à convenir avant action au fond, sans empêcher les mesures urgentes.",
        startDate: "2026-11-01", endDate: "2027-10-31",
      },
    },
    {
      templateId: "fr-poc-services",
      title: "Pilote Atlas · preuve de concept (exemple)",
      answers: {
        pocSolution: "Version 0.9 du module de recherche, en environnement isolé ; fonctions hors périmètre listées à l’annexe technique.",
        pocUseCase: "Cinq utilisateurs nommés testent deux scénarios sur 200 fichiers synthétiques, sans connexion à la production.",
        pocDeliverables: "Accès de test pour six semaines, guide utilisateur, journal d’incidents et rapport de résultats.",
        pocSuccess: "Mesurer le rappel des 30 documents étalons, latence médiane sous cinq secondes et absence de défaut critique sur les scénarios convenus.",
        pocClientDuties: "Le client nomme un responsable, fournit les comptes, exécute les scénarios et transmet les incidents reproductibles sous deux jours ouvrés.",
        pocData: "Corpus synthétique sans donnée personnelle ni secret d’affaires ; comptes individuels, chiffrement en transit et journalisation activée.",
        pocPrice: "Forfait de 3 000 euros HT facturé à l’ouverture ; frais de déplacement uniquement sur devis préalable accepté.",
        pocIp: "Chaque partie conserve ses éléments antérieurs ; retours utilisables pour améliorer le service sans divulguer d’informations confidentielles ; développements spécifiques exclus.",
        pocSupport: "Support jours ouvrés sous un jour ouvré pour incident bloquant et trois jours pour les autres ; aucune disponibilité de production promise.",
        pocProduction: "Déploiement, abonnement et SLA feront l’objet d’une offre et d’un contrat distincts ; aucune commande ou reconduction automatique.",
        pocExit: "À la fin, accès désactivés sous deux jours, corpus supprimé sous trente jours et rapport remis aux deux parties.",
        pocLiability: "Assurances professionnelles maintenues ; limites de responsabilité à négocier après analyse du contrat, des dommages et des règles impératives.",
        startDate: "2026-11-02", endDate: "2026-12-14",
      },
    },
    {
      templateId: "fr-data-sharing",
      title: "Indicateurs Atlas · accord de partage de données (exemple)",
      answers: {
        sharingPurpose: "Analyser des indicateurs agrégés de disponibilité afin d’améliorer la planification ; aucune décision individuelle automatisée.",
        sharingData: "Comptages hebdomadaires agrégés et code de service pseudonymisé, transmis par API sécurisée ; provenance et contrôles qualité en annexe.",
        sharingSubjects: "Aucune donnée directement identifiante ; exclure les coordonnées, données sensibles et champs permettant une réidentification raisonnable.",
        sharingRoles: "Chaque organisme détermine séparément les finalités de ses traitements ; vérifier toute décision commune des finalités ou moyens avant activation.",
        sharingLawfulBasis: "Chaque partie documente la base légale, la compatibilité, l’information des personnes, les droits et la pseudonymisation avant transmission.",
        sharingAccess: "Accès nominatif aux analystes désignés, authentification forte et interdiction de réidentifier ou rapprocher les données.",
        sharingSecurity: "Chiffrement en transit et au repos, journalisation, sauvegarde chiffrée et revue périodique des habilitations.",
        sharingIncidents: "Alerte réciproque sans délai injustifié, description des données et impacts, mesures prises et coopération à l’analyse.",
        sharingRetention: "Données brutes supprimées à la fin du projet ou douze mois après collecte ; agrégats anonymes vérifiés conservés trois ans.",
        sharingSubsequentUse: "Nouvelle finalité, publication ou communication externe soumise à une analyse de licéité et un accord écrit préalable.",
        sharingCosts: "Chaque partie supporte ses coûts internes ; évolutions d’API chiffrées puis acceptées par écrit.",
        sharingEnd: "À la fin, désactivation des accès, suppression des données brutes et certificat d’effacement.",
        startDate: "2026-11-01", endDate: "2027-04-30",
      },
    },
  ];
  const existing = new Set(
    store.all("legal_drafts")
      .filter((draft) => draft.matterId === matter.id)
      .map((draft) => draft.templateId),
  );
  const common = {
    jurisdiction: "FR", scope: "b2b",
    p1name: "Aster Conseil", p1form: "SAS", p1siren: "123456789",
    p1address: "10 rue des Archives, 75004 Paris",
    p1representative: "Camille Martin", p1capacity: "Présidente",
    p2name: "Boréal Recherche", p2form: "SAS", p2siren: "987654321",
    p2address: "22 avenue des Sciences, 69007 Lyon",
    p2representative: "Alex Rivière", p2capacity: "Directeur général",
    signDate: new Date().toISOString().slice(0, 10), signCity: "Paris",
  };
  for (const example of examples) {
    if (existing.has(example.templateId)) continue;
    const template = BUILTIN_TEMPLATES.find((item) => item.id === example.templateId);
    if (!template) continue;
    const result = generateDocument(template, { ...common, ...example.answers });
    result.content.title = example.title;
    result.contentHash = fingerprint({ ...result, contentHash: undefined });
    const timestamp = now();
    store.put("legal_drafts", {
      id: uid(), matterId: matter.id, templateId: template.id,
      templateSnapshot: template, ...result, overrides: {}, revision: 1,
      status: "draft", review: null, history: [], createdAt: timestamp,
      updatedAt: timestamp,
    }, { matter_id: matter.id });
  }
}

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
  if (store.all("matters").length) {
    const demoMatter = store.all("matters").find((item) => item.demo);
    if (demoMatter) seedDraftExamples(store, demoMatter);
    return;
  }
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
  seedDraftExamples(store, matter);
}
