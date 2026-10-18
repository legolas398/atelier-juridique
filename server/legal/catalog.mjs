import { extendedTemplates } from "./extended.mjs";
export const LEGAL_CHECKED_AT = "2026-10-18";
export const TEMPLATE_VERSION = "2026.10.18.2";
export const LEGAL_SOURCES = {
  subcontract: {
    id: "subcontract",
    title: "Loi du 31 décembre 1975 relative à la sous-traitance",
    url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000889241/",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Examiner le champ de la loi, l’acceptation, l’agrément des conditions de paiement et les garanties requises ; la trame exclut les marchés publics et la construction.",
  },
  software: {
    id: "software",
    title: "Code de la propriété intellectuelle · article L122-6",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278919",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Les actes d’exploitation du logiciel doivent être autorisés sous réserve des exceptions légales, notamment celles de l’article L122-6-1.",
  },
  ipAssignment: {
    id: "ipAssignment",
    title: "Code de la propriété intellectuelle · article L131-3",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Délimiter distinctement les droits et leur exploitation. La chaîne des droits, le droit moral et le régime de rémunération exigent un examen séparé.",
  },
  negotiations: {
    id: "negotiations",
    title: "Code civil · article 1112",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036829818",
    checkedAt: LEGAL_CHECKED_AT,
    note: "La liberté des négociations reste soumise à la bonne foi ; distinguer les intentions des engagements obligatoires.",
  },
  commercialTermination: {
    id: "commercialTermination",
    title: "Code de commerce · article L442-1",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047381704",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Le préavis contractuel ne suffit pas à apprécier une éventuelle rupture brutale d’une relation commerciale établie. Aucun délai universel n’est déduit de cette trame.",
  },
  equipmentLoan: {
    id: "equipmentLoan",
    title: "Code civil · prêt à usage, articles 1875 et suivants",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000020616173",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Prêt gratuit avec restitution ; examiner les dispositions de tout le chapitre, notamment sur les frais et le terme. La trame vise uniquement du matériel ordinaire.",
  },
  confidentiality: {
    id: "confidentiality",
    title: "Code civil · article 1112-2",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032007140",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Responsabilité liée à l’utilisation ou la divulgation non autorisée d’informations confidentielles obtenues pendant les négociations. Le contenu précis du NDA reste contractuel.",
  },
  essential: {
    id: "essential",
    title: "Code civil · article 1170",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041115",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Une limitation ne peut vider l’obligation essentielle de sa substance ; l’efficacité d’un plafond dépend du contrat et du contexte.",
  },
  amendment: {
    id: "amendment",
    title: "Code civil · article 1193",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041314",
    checkedAt: LEGAL_CHECKED_AT,
    note: "La modification conventionnelle repose sur l’accord des parties ; vérifier les formalités et les tiers concernés.",
  },
  payment: {
    id: "payment",
    title: "Code de commerce · article L441-10",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392/2026-07-01",
    checkedAt: LEGAL_CHECKED_AT,
    validUntil: "2027-01-01",
    note: "Délais et pénalités entre professionnels sous réserve des régimes spéciaux. La version consultée a une fin de vigueur annoncée au 1er janvier 2027.",
  },
  recovery: {
    id: "recovery",
    title: "Code de commerce · article D441-5",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043197457",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Montant forfaitaire de recouvrement : 40 euros lorsque le régime correspondant est applicable.",
  },
  notice: {
    id: "notice",
    title: "Code civil · article 1344",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032042162/2026-07-14",
    checkedAt: LEGAL_CHECKED_AT,
    note: "La demande doit constituer une interpellation suffisante. Le générateur ne prouve ni l’exigibilité de la créance ni la réception du courrier.",
  },
  force: {
    id: "force",
    title: "Code civil · article 1218",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Conditions et effets de la force majeure ; aucune liste d’événements n’est réputée automatiquement exonératoire.",
  },
  venue: {
    id: "venue",
    title: "Code de procédure civile · article 48",
    url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006410147",
    checkedAt: LEGAL_CHECKED_AT,
    note: "La dérogation territoriale suppose notamment la qualité de commerçant de toutes les parties et une stipulation très apparente. Ne règle pas la compétence matérielle.",
  },
  privacy: {
    id: "privacy",
    title: "CNIL · contrat responsable / sous-traitant",
    url: "https://www.cnil.fr/fr/clauses-contractuelles-types-entre-responsable-de-traitement-et-sous-traitant",
    checkedAt: LEGAL_CHECKED_AT,
    note: "Le contrat de sous-traitance doit traiter les exigences de l’article 28 du RGPD. Les transferts internationaux appellent une analyse distincte.",
  },
};

const yesNo = [
  ["yes", "Oui"],
  ["no", "Non"],
];
export const field = (id, label, group, type = "text", extra = {}) => ({
  id,
  label,
  group,
  type,
  required: true,
  ...extra,
});
export const commonFields = [
  field("jurisdiction", "Droit applicable", "Périmètre", "select", {
    options: [
      ["FR", "France · droit français"],
      ["OTHER", "Autre droit — adaptation nécessaire"],
    ],
  }),
  field("scope", "Contexte des parties", "Périmètre", "select", {
    options: [
      ["b2b", "Professionnels privés · opération ordinaire"],
      ["consumer", "Une partie est consommateur"],
      ["public", "Marché / personne publique"],
      ["regulated", "Opération ou secteur à régime spécial"],
      ["international", "Opération internationale"],
    ],
  }),
  ...["p1", "p2"].flatMap((p, i) => [
    field(
      `${p}name`,
      i
        ? "Dénomination de la seconde partie"
        : "Dénomination de la première partie",
      i ? "Partie 2" : "Partie 1",
    ),
    field(`${p}form`, "Forme juridique", i ? "Partie 2" : "Partie 1"),
    field(
      `${p}siren`,
      "SIREN (9 chiffres)",
      i ? "Partie 2" : "Partie 1",
      "siren",
    ),
    field(
      `${p}address`,
      "Adresse du siège",
      i ? "Partie 2" : "Partie 1",
      "textarea",
    ),
    field(
      `${p}representative`,
      "Nom du représentant",
      i ? "Partie 2" : "Partie 1",
    ),
    field(
      `${p}capacity`,
      "Fonction / qualité du signataire",
      i ? "Partie 2" : "Partie 1",
    ),
  ]),
  field("signDate", "Date du document / de signature", "Formalisation", "date"),
  field("signCity", "Lieu de signature / d’émission", "Formalisation"),
];
const disputes = [
  field(
    "forumCity",
    "Ville d’une éventuelle compétence exclusive",
    "Litiges",
    "text",
    {
      required: false,
      help: "Laisser vide pour appliquer les règles de compétence de droit commun.",
    },
  ),
  field(
    "bothCommercial",
    "Les deux parties contractent-elles en qualité de commerçant ?",
    "Litiges",
    "select",
    { required: false, options: [...yesNo, ["unknown", "À vérifier"]] },
  ),
];
export const BUILTIN_TEMPLATES = [
  {
    id: "fr-nda",
    title: "Accord de confidentialité",
    category: "Contrat",
    tag: "NDA · unilatéral ou réciproque",
    description:
      "Délimiter les informations, les destinataires et la durée de protection.",
    version: TEMPLATE_VERSION,
    jurisdiction: "FR",
    origin: "atelier",
    sourceIds: ["confidentiality", "venue"],
    fields: [
      ...commonFields,
      field("ndaType", "Sens des échanges", "Confidentialité", "select", {
        options: [
          ["mutual", "Réciproque : les deux parties divulguent"],
          ["unilateral", "Unilatéral : la première partie divulgue"],
        ],
      }),
      field(
        "purpose",
        "Finalité autorisée des échanges",
        "Confidentialité",
        "textarea",
        {
          help: "Décrire précisément le projet. Exemple : évaluer une collaboration commerciale sur la gamme Atlas.",
        },
      ),
      field(
        "information",
        "Informations couvertes et mode d’identification",
        "Confidentialité",
        "textarea",
      ),
      field(
        "recipients",
        "Personnes autorisées à accéder aux informations",
        "Confidentialité",
        "textarea",
        {
          help: "Fonctions ou catégories précises ; pas de diffusion générale au groupe par défaut.",
        },
      ),
      field(
        "startDate",
        "Date de début des échanges couverts",
        "Durées",
        "date",
      ),
      field(
        "endDate",
        "Fin de la période d’échanges couverte",
        "Durées",
        "date",
      ),
      field(
        "survivalYears",
        "Protection après la fin des échanges (années)",
        "Durées",
        "integer",
        { min: 1, max: 30 },
      ),
      field(
        "returnDays",
        "Délai de restitution / suppression (jours)",
        "Confidentialité",
        "integer",
        { min: 1, max: 90 },
      ),
      ...disputes,
    ],
    reviewItems: [
      {
        id: "authority",
        label: "Identité des parties et pouvoir des signataires vérifiés.",
      },
      {
        id: "purpose",
        label:
          "Périmètre des informations, destinataires et durées adaptés aux échanges réels.",
      },
    ],
  },
  {
    id: "fr-services",
    title: "Contrat de prestations de services",
    category: "Contrat",
    tag: "Professionnels · mission définie",
    description:
      "Encadrer mission, livrables, paiement, propriété intellectuelle et responsabilité.",
    version: TEMPLATE_VERSION,
    jurisdiction: "FR",
    origin: "atelier",
    sourceIds: [
      "payment",
      "recovery",
      "essential",
      "force",
      "privacy",
      "venue",
    ],
    fields: [
      ...commonFields,
      field(
        "mission",
        "Mission du prestataire (partie 1)",
        "Mission",
        "textarea",
      ),
      field(
        "deliverables",
        "Livrables, formats et calendrier détaillé",
        "Mission",
        "textarea",
      ),
      field(
        "acceptance",
        "Critères objectifs de recette / conformité",
        "Mission",
        "textarea",
      ),
      field(
        "acceptanceDays",
        "Délai de vérification des livrables (jours)",
        "Mission",
        "integer",
        { min: 1, max: 30 },
      ),
      field("obligation", "Niveau d’engagement retenu", "Mission", "select", {
        options: [
          ["means", "Obligation de moyens"],
          ["result", "Résultat défini par les critères de recette"],
        ],
      }),
      field(
        "cooperation",
        "Informations et moyens fournis par le client",
        "Mission",
        "textarea",
      ),
      field("startDate", "Début d’exécution", "Durées", "date"),
      field(
        "endDate",
        "Fin de la mission (pas de reconduction tacite)",
        "Durées",
        "date",
      ),
      field(
        "price",
        "Prix forfaitaire hors taxes (€)",
        "Conditions financières",
        "money",
      ),
      field(
        "taxRegime",
        "Traitement de la TVA",
        "Conditions financières",
        "select",
        {
          options: [
            ["vat", "TVA applicable"],
            ["exempt", "TVA non facturée : fondement à préciser"],
          ],
        },
      ),
      field("vatRate", "Taux de TVA (%)", "Conditions financières", "decimal", {
        required: false,
        min: 0,
        max: 30,
      }),
      field(
        "taxBasis",
        "Fondement de non-facturation de la TVA",
        "Conditions financières",
        "text",
        { required: false },
      ),
      field(
        "paymentDays",
        "Paiement à compter de l’émission de facture (jours)",
        "Conditions financières",
        "integer",
        { min: 1, max: 60 },
      ),
      field("invoiceType", "Facturation", "Conditions financières", "select", {
        options: [
          ["single", "Facture non périodique à la recette"],
          ["periodic", "Factures périodiques selon échéancier"],
        ],
      }),
      field(
        "schedule",
        "Échéancier / détail des factures périodiques",
        "Conditions financières",
        "textarea",
        { required: false },
      ),
      field(
        "liabilityCap",
        "Plafond de responsabilité contractuelle (€)",
        "Responsabilité",
        "money",
      ),
      field(
        "insurance",
        "Assurance professionnelle : assureur, police et garanties",
        "Responsabilité",
        "textarea",
      ),
      field(
        "cureDays",
        "Délai de remède après notification d’un manquement (jours)",
        "Responsabilité",
        "integer",
        { min: 1, max: 90 },
      ),
      field(
        "personalData",
        "Traitement de données personnelles pour le compte du client ?",
        "Données personnelles",
        "select",
        { options: yesNo },
      ),
      field(
        "dpaText",
        "Annexe données personnelles complète, à relire",
        "Données personnelles",
        "textarea",
        {
          required: false,
          maxLength: 45000,
          help: "Si oui, fournir le texte contractuel adapté : art. 28, sécurité, sous-traitants ultérieurs, instructions et transferts. Une simple référence ne suffit pas.",
        },
      ),
      field(
        "usage",
        "Usage interne autorisé des livrables",
        "Propriété intellectuelle",
        "textarea",
        {
          help: "Licence non exclusive uniquement. Une cession exclusive demande un modèle spécifique.",
        },
      ),
      field(
        "licenseYears",
        "Durée de la licence non exclusive (années)",
        "Propriété intellectuelle",
        "integer",
        { min: 1, max: 30 },
      ),
      ...disputes,
    ],
    reviewItems: [
      {
        id: "authority",
        label:
          "Identités, pouvoirs des signataires et absence de régime spécial vérifiés.",
      },
      {
        id: "mission",
        label:
          "Livrables, critères de recette et obligation de moyens/résultat concordants.",
      },
      {
        id: "price",
        label:
          "Prix, TVA, échéancier et régime de retard de paiement vérifiés.",
      },
      {
        id: "liability",
        label:
          "Plafond, exceptions, assurance et portée des obligations essentielles relus.",
      },
      {
        id: "rights",
        label:
          "Chaîne des droits et licence correspondant à l’usage réel des livrables vérifiées.",
      },
      {
        id: "privacy",
        label:
          "Traitements de données qualifiés et, si nécessaire, annexe RGPD et transferts vérifiés.",
      },
    ],
  },
  {
    id: "fr-amendment",
    title: "Avenant à un contrat",
    category: "Contrat",
    tag: "Modification ciblée",
    description:
      "Identifier le contrat initial et remplacer précisément les stipulations concernées.",
    version: TEMPLATE_VERSION,
    jurisdiction: "FR",
    origin: "atelier",
    sourceIds: ["amendment"],
    fields: [
      ...commonFields,
      field(
        "contractTitle",
        "Titre et référence du contrat initial",
        "Contrat initial",
      ),
      field(
        "contractDate",
        "Date de signature du contrat initial",
        "Contrat initial",
        "date",
      ),
      field(
        "priorAmendments",
        "Avenants antérieurs / indiquer « aucun »",
        "Contrat initial",
        "textarea",
      ),
      field("reason", "Objet de la modification", "Modification", "textarea"),
      field(
        "replacedArticles",
        "Numéros et intitulés exacts des articles remplacés",
        "Modification",
        "textarea",
      ),
      field(
        "replacementText",
        "Nouvelle rédaction intégrale des articles remplacés",
        "Modification",
        "textarea",
        { maxLength: 30000 },
      ),
      field(
        "effectiveDate",
        "Date de prise d’effet de l’avenant",
        "Modification",
        "date",
      ),
      field(
        "impacts",
        "Incidences sur annexes, prix, calendrier et autres clauses",
        "Modification",
        "textarea",
        {
          help: "Indiquer « aucune » uniquement après vérification du contrat et de ses annexes.",
        },
      ),
    ],
    reviewItems: [
      {
        id: "authority",
        label:
          "Toutes les parties requises et leurs pouvoirs de modification sont identifiés.",
      },
      {
        id: "original",
        label:
          "Contrat initial, avenants et annexes réellement comparés à la nouvelle rédaction.",
      },
      {
        id: "impacts",
        label:
          "Formalités particulières, effet rétroactif éventuel et droits des tiers vérifiés.",
      },
    ],
  },
  {
    id: "fr-demand",
    title: "Mise en demeure de payer",
    category: "Courrier",
    tag: "Créance professionnelle · principal seul",
    description:
      "Formuler une demande précise sans inventer de montant, de pénalité ni de preuve.",
    version: TEMPLATE_VERSION,
    jurisdiction: "FR",
    origin: "atelier",
    sourceIds: ["notice"],
    fields: [
      ...commonFields,
      field("invoiceRef", "Référence de facture / titre de créance", "Créance"),
      field("invoiceDate", "Date de la facture", "Créance", "date"),
      field("dueDate", "Échéance contractuelle de paiement", "Créance", "date"),
      field(
        "principal",
        "Montant initial TTC de la créance (€)",
        "Créance",
        "money",
      ),
      field(
        "paid",
        "Paiements et avoirs déjà imputés (€)",
        "Créance",
        "money",
        { min: 0 },
      ),
      field(
        "basis",
        "Origine précise de la créance et exécution de la prestation",
        "Créance",
        "textarea",
      ),
      field(
        "evidence",
        "Pièces justificatives à joindre / références",
        "Créance",
        "textarea",
      ),
      field(
        "deadlineDays",
        "Délai supplémentaire à compter de réception (jours)",
        "Demande",
        "integer",
        { min: 1, max: 90 },
      ),
      field(
        "paymentMethod",
        "Coordonnées / modalité de paiement",
        "Demande",
        "textarea",
      ),
      field(
        "delivery",
        "Mode d’envoi avec preuve à conserver",
        "Demande",
        "select",
        {
          options: [
            ["registered", "Lettre recommandée avec accusé de réception"],
            ["bailiff", "Remise par commissaire de justice"],
          ],
        },
      ),
      field(
        "dispute",
        "Créance contestée ou procédure collective connue ?",
        "Demande",
        "select",
        {
          options: [
            ["no", "Non, après vérification"],
            ["yes", "Oui"],
            ["unknown", "À vérifier"],
          ],
        },
      ),
    ],
    reviewItems: [
      {
        id: "authority",
        label:
          "Identité du créancier/débiteur et pouvoir du signataire vérifiés.",
      },
      {
        id: "claim",
        label:
          "Créance certaine, montant exact, exigibilité, paiements et avoirs contrôlés sur pièces.",
      },
      {
        id: "procedure",
        label:
          "Contestations, prescription et éventuelle procédure collective examinées.",
      },
      {
        id: "delivery",
        label:
          "Pièces jointes réunies et modalité d’envoi permettant de prouver contenu et réception préparée.",
      },
    ],
  },
  ...extendedTemplates({ field, commonFields, version: TEMPLATE_VERSION }),
];
