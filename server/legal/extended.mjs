// Independent drafting playbooks. No proprietary Legora template is reproduced.
export function extendedTemplates({ field, commonFields, version }) {
  const f = (id, label, group, type = "textarea", extra = {}) =>
    field(id, label, group, type, extra);
  const dates = [
    f("startDate", "Date de début", "Calendrier", "date"),
    f("endDate", "Date de fin", "Calendrier", "date"),
  ];
  const reference = [
    f(
      "contractTitle",
      "Titre et référence du contrat concerné",
      "Contrat initial",
      "text",
    ),
    f("contractDate", "Date du contrat initial", "Contrat initial", "date"),
  ];
  const price = [
    f("price", "Prix HT en euros", "Conditions financières", "money"),
    f(
      "taxTerms",
      "TVA : taux et montant, ou fondement de l’exonération",
      "Conditions financières",
    ),
    f(
      "paymentTerms",
      "Facturation et échéances de paiement conformes au régime applicable",
      "Conditions financières",
    ),
  ];
  const definitions = [
    {
      id: "fr-dpa",
      title: "Accord de sous-traitance RGPD",
      family: "Données & numérique",
      tag: "DPA · article 28",
      description:
        "Décrire le traitement, les instructions, la sécurité et les obligations de chaque intervenant.",
      roles: ["Responsable de traitement", "Sous-traitant"],
      sources: ["privacy"],
      fields: [
        ...dates,
        f(
          "service",
          "Service principal et objet des traitements",
          "Traitements",
        ),
        f(
          "operations",
          "Nature des opérations et finalités documentées",
          "Traitements",
        ),
        f(
          "dataCategories",
          "Catégories de données et niveau de sensibilité",
          "Traitements",
        ),
        f("subjects", "Catégories de personnes concernées", "Traitements"),
        f(
          "instructions",
          "Instructions documentées et personnes habilitées à les émettre",
          "Instructions",
        ),
        f(
          "locations",
          "Pays et sites d’hébergement et d’accès distant, exclusivement dans l’EEE",
          "Sécurité",
        ),
        f(
          "security",
          "Mesures techniques et organisationnelles concrètes : accès, chiffrement, sauvegardes, journalisation, tests",
          "Sécurité",
        ),
        f(
          "subprocessors",
          "Sous-traitants ultérieurs : identité, prestation, localisation ; indiquer « aucun » si applicable",
          "Sous-traitants ultérieurs",
        ),
        f(
          "authorization",
          "Autorisation des sous-traitants ultérieurs",
          "Sous-traitants ultérieurs",
          "select",
          {
            options: [
              ["specific", "Autorisation écrite spécifique préalable"],
              [
                "general",
                "Autorisation générale avec information et objection",
              ],
            ],
          },
        ),
        f(
          "objectionDays",
          "Délai préalable d’information et d’objection en jours",
          "Sous-traitants ultérieurs",
          "integer",
          { min: 1, max: 90 },
        ),
        f(
          "incidentContact",
          "Contacts et canal de notification des violations",
          "Incidents & assistance",
        ),
        f(
          "assistance",
          "Organisation de l’assistance : droits, sécurité, AIPD et consultation préalable",
          "Incidents & assistance",
        ),
        f(
          "audit",
          "Modalités de preuve et d’audit, accès aux informations et coopération",
          "Audit & sortie",
        ),
        f("returnChoice", "Sortie des données", "Audit & sortie", "select", {
          options: [
            ["return", "Restitution puis suppression"],
            ["delete", "Suppression documentée"],
          ],
        }),
        f(
          "returnDays",
          "Délai de restitution / suppression en jours",
          "Audit & sortie",
          "integer",
          { min: 1, max: 90 },
        ),
      ],
      checks: [
        "Rôles réels et instructions vérifiés, traitement correctement qualifié.",
        "Annexes de sécurité, données, personnes, sous-traitants et localisations complétées sur pièces.",
        "Aucun accès ou transfert hors EEE ; toute dérogation nécessite une analyse et un instrument distincts.",
      ],
    },
    {
      id: "fr-saas",
      title: "Contrat d’abonnement SaaS",
      family: "Données & numérique",
      tag: "Accès · SLA · réversibilité",
      description:
        "Encadrer un service hébergé, ses niveaux de service, les données et les conditions de sortie.",
      roles: ["Fournisseur", "Client"],
      sources: ["essential", "privacy", "payment"],
      fields: [
        ...dates,
        ...price,
        f(
          "service",
          "Application, fonctionnalités et documentation contractuelle",
          "Service",
        ),
        f(
          "users",
          "Utilisateurs autorisés, capacité et limites d’usage",
          "Service",
        ),
        f(
          "availability",
          "Disponibilité, méthode de calcul, exclusions justifiées et maintenance annoncée",
          "Niveaux de service",
        ),
        f(
          "support",
          "Horaires de support et délais de prise en charge par criticité",
          "Niveaux de service",
        ),
        f(
          "remedies",
          "Mesures correctives, éventuels crédits et conditions de résiliation en cas de défaillance",
          "Niveaux de service",
        ),
        f(
          "hosting",
          "Sites d’hébergement et mesures de sécurité",
          "Données & sortie",
        ),
        f(
          "dpaText",
          "Annexe article 28 adaptée, ou explication factuelle de l’absence de sous-traitance de données",
          "Données & sortie",
        ),
        f(
          "exitPlan",
          "Formats d’export, assistance, délai de récupération, frais et effacement",
          "Données & sortie",
        ),
        f(
          "liabilityCap",
          "Plafond de responsabilité proposé en euros",
          "Responsabilité",
          "money",
        ),
      ],
      checks: [
        "SLA et exclusions mesurables, recours et continuité cohérents avec les besoins réels.",
        "Annexe RGPD et réversibilité adaptées, exigences impératives relatives aux services de traitement de données examinées.",
        "Prix, TVA, responsabilité et absence de clause vidant une obligation essentielle de sa substance revus.",
      ],
    },
    {
      id: "fr-maintenance",
      title: "Contrat de maintenance informatique",
      family: "Données & numérique",
      tag: "Correctif · préventif · support",
      description:
        "Définir les équipements, les interventions, les exclusions et les engagements de support.",
      roles: ["Mainteneur", "Client"],
      sources: ["essential", "payment", "privacy"],
      fields: [
        ...dates,
        ...price,
        f(
          "assets",
          "Équipements, logiciels, versions et sites couverts",
          "Périmètre",
        ),
        f(
          "services",
          "Maintenance préventive et corrective incluse, limites et exclusions",
          "Périmètre",
        ),
        f(
          "support",
          "Canaux, horaires, sévérités et délais de prise en charge et de rétablissement",
          "Interventions",
        ),
        f(
          "access",
          "Accès autorisés, sauvegarde avant intervention et coopération du client",
          "Interventions",
        ),
        f(
          "changes",
          "Validation des changements, tests et retour arrière",
          "Interventions",
        ),
        f(
          "security",
          "Confidentialité, accès privilégiés et annexe RGPD si nécessaire",
          "Sécurité",
        ),
        f(
          "exitPlan",
          "Transmission des tickets, documentation et réversibilité",
          "Sortie",
        ),
      ],
      checks: [
        "Inventaire et exclusions validés, compatibilité des versions examinée.",
        "Délais distinguant prise en charge, contournement et rétablissement négociés.",
        "Sauvegardes, accès privilégiés et données personnelles encadrés avant intervention.",
      ],
    },
    {
      id: "fr-subcontracting",
      title: "Contrat de sous-traitance de prestations",
      family: "Affaires & opérations",
      tag: "Entreprise privée · hors BTP",
      description:
        "Organiser une prestation déléguée, les validations du client final et les garanties de paiement.",
      roles: ["Entrepreneur principal", "Sous-traitant"],
      sources: ["subcontract", "payment", "essential"],
      fields: [
        ...dates,
        ...price,
        f(
          "mainContract",
          "Contrat principal, client final et stipulations pertinentes communiquées",
          "Opération",
        ),
        f(
          "mission",
          "Prestations déléguées et livrables, hors construction et régimes spéciaux",
          "Opération",
        ),
        f(
          "acceptance",
          "Validation du sous-traitant et agrément de ses conditions de paiement par le maître d’ouvrage",
          "Garanties",
        ),
        f(
          "paymentSecurity",
          "Caution ou délégation de paiement et justificatifs, ou analyse motivée d’inapplicabilité",
          "Garanties",
        ),
        f(
          "approvalConfirmed",
          "Formalités et garanties requises réalisées et vérifiées ?",
          "Garanties",
          "select",
          {
            options: [
              ["yes", "Oui, justificatifs vérifiés"],
              ["no", "Non / à vérifier"],
            ],
          },
        ),
        f(
          "delivery",
          "Recette, calendrier, réserves et correction",
          "Exécution",
        ),
        f(
          "independence",
          "Organisation autonome, interlocuteurs et obligations de vigilance",
          "Exécution",
        ),
        f(
          "rights",
          "Droits sur les livrables, confidentialité et traitement des données",
          "Exécution",
        ),
      ],
      checks: [
        "Champ de la loi de 1975 et exclusions de la trame examinés.",
        "Acceptation, agrément et garantie de paiement requis effectivement obtenus sur justificatifs.",
        "Obligations de vigilance, autonomie et absence de prêt illicite de main-d’œuvre examinées.",
      ],
    },
    {
      id: "fr-license",
      title: "Licence de logiciel professionnel",
      family: "Propriété intellectuelle",
      tag: "Licence non exclusive · usages définis",
      description:
        "Délimiter le droit d’utilisation d’un logiciel, les utilisateurs et la durée de licence.",
      roles: ["Concédant", "Licencié"],
      sources: ["software", "essential", "payment"],
      fields: [
        ...dates,
        ...price,
        f(
          "software",
          "Logiciel, version, documentation et composants tiers",
          "Licence",
        ),
        f(
          "uses",
          "Actes et usages autorisés, postes, utilisateurs, environnements et finalité",
          "Licence",
        ),
        f("territory", "Territoire autorisé", "Licence", "text"),
        f(
          "delivery",
          "Livraison, activation et prérequis techniques",
          "Livraison",
        ),
        f("support", "Mises à jour et support inclus ou exclus", "Support"),
        f(
          "warranty",
          "Conformité promise, procédure de réclamation et remèdes",
          "Garanties",
        ),
        f(
          "rightsChain",
          "Titularité et droits concédés, licences tierces et preuves vérifiées",
          "Garanties",
        ),
        f(
          "exitPlan",
          "Arrêt de l’usage, récupération des données et conservation légitime",
          "Sortie",
        ),
      ],
      checks: [
        "Chaîne des droits, dépendances et licences tierces vérifiées.",
        "Périmètre d’utilisation et durée précis, exceptions légales du logiciel préservées.",
        "Conformité, remèdes, support et fin de licence cohérents avec l’usage prévu.",
      ],
    },
    {
      id: "fr-ip-assignment",
      title: "Cession de droits sur une création identifiée",
      family: "Propriété intellectuelle",
      tag: "Droits patrimoniaux · périmètre distinct",
      description:
        "Individualiser l’œuvre et chaque droit cédé, avec ses destinations, son territoire et sa durée.",
      roles: ["Cédant titulaire des droits", "Cessionnaire"],
      sources: ["ipAssignment"],
      fields: [
        f(
          "work",
          "Œuvre existante précisément identifiée, version et éléments remis",
          "Création",
        ),
        f(
          "rightsChain",
          "Chaîne de titularité, auteurs et autorisations obtenues sur pièces",
          "Création",
        ),
        f(
          "chainConfirmed",
          "La chaîne des droits est-elle établie et vérifiée ?",
          "Création",
          "select",
          {
            options: [
              ["yes", "Oui"],
              ["no", "Non / à vérifier"],
            ],
          },
        ),
        f(
          "rights",
          "Énumération distincte de chaque droit patrimonial cédé",
          "Étendue",
        ),
        f(
          "uses",
          "Destination et modes d’exploitation autorisés pour chaque droit",
          "Étendue",
        ),
        f("territory", "Étendue géographique de chaque droit", "Étendue"),
        f(
          "term",
          "Durée de la cession de chaque droit et point de départ",
          "Étendue",
        ),
        f(
          "remuneration",
          "Rémunération : assiette, taux, reddition et paiement ; si forfait, fondement précis de son admissibilité",
          "Rémunération",
        ),
        f(
          "delivery",
          "Remise des fichiers et éléments nécessaires, calendrier et formats",
          "Livraison",
        ),
        f(
          "thirdParty",
          "Éléments exclus, droits des tiers et mentions de crédit",
          "Livraison",
        ),
      ],
      checks: [
        "Chaque droit, destination, étendue, lieu et durée individualisés.",
        "Titularité et autorisations établies ; aucun transfert du droit moral ni cession globale d’œuvres futures.",
        "Rémunération et régime légal applicable, notamment proportionnalité ou exception au forfait, examinés par un professionnel.",
      ],
    },
    {
      id: "fr-loi",
      title: "Lettre d’intention de négociation",
      family: "Affaires & opérations",
      tag: "Projet non engageant · clauses identifiées",
      description:
        "Fixer le cadre des discussions en distinguant les intentions des engagements expressément consentis.",
      roles: ["Participant 1", "Participant 2"],
      sources: ["negotiations", "confidentiality"],
      fields: [
        ...dates,
        f("project", "Projet envisagé et objectifs des négociations", "Projet"),
        f(
          "outline",
          "Principales conditions indicatives envisagées, sans engagement de conclure",
          "Projet",
        ),
        f(
          "conditions",
          "Audits, autorisations et conditions restant à satisfaire",
          "Projet",
        ),
        f(
          "process",
          "Calendrier indicatif et interlocuteurs des négociations",
          "Négociation",
        ),
        f(
          "information",
          "Informations confidentielles couvertes et accès autorisés",
          "Négociation",
        ),
        f(
          "confidentialYears",
          "Durée de confidentialité après la fin des échanges en années",
          "Négociation",
          "integer",
          { min: 1, max: 10 },
        ),
        f(
          "costs",
          "Répartition des frais de négociation et d’audit",
          "Négociation",
        ),
      ],
      checks: [
        "Aucune offre ferme, promesse de cession ou obligation involontaire de conclure.",
        "Engagements expressément obligatoires isolés des intentions indicatives.",
        "Liberté de négociation, bonne foi et information précontractuelle préservées.",
      ],
    },
    {
      id: "fr-termination",
      title: "Accord de résiliation amiable",
      family: "Fin de contrat",
      tag: "Fin convenue · sans transaction générale",
      description:
        "Convenir de la fin d’un contrat, du solde et des obligations qui continuent après la sortie.",
      roles: ["Partie au contrat 1", "Partie au contrat 2"],
      sources: ["amendment"],
      fields: [
        ...reference,
        f("effectiveDate", "Date convenue de fin du contrat", "Sortie", "date"),
        f("reason", "Contexte de la décision commune", "Sortie"),
        f(
          "settlement",
          "Décompte contradictoire : prestations, acomptes, factures, avoirs et échéances",
          "Solde",
        ),
        f(
          "handover",
          "Restitutions, données, documents et assistance de sortie",
          "Solde",
        ),
        f(
          "survival",
          "Clauses précisément identifiées survivant à la fin du contrat et leur durée",
          "Après-contrat",
        ),
        f(
          "reserved",
          "Différends, créances ou droits expressément réservés",
          "Après-contrat",
        ),
      ],
      checks: [
        "Accord de toutes les parties et droits des tiers vérifiés.",
        "Solde, restitutions et clauses survivantes chiffrés et identifiés.",
        "Le document n’est pas utilisé comme transaction avec renonciation générale ou règlement d’un litige sans adaptation.",
      ],
    },
    {
      id: "fr-notice-termination",
      title: "Notification de non-renouvellement",
      family: "Fin de contrat",
      tag: "Échéance · préavis documenté",
      description:
        "Préparer une notification de fin à l’échéance, fondée sur une clause et un calendrier vérifiés.",
      roles: ["Expéditeur", "Destinataire"],
      sources: ["commercialTermination"],
      fields: [
        ...reference,
        f(
          "effectiveDate",
          "Échéance contractuelle visée",
          "Notification",
          "date",
        ),
        f(
          "clause",
          "Clause autorisant le non-renouvellement, reproduction et référence exactes",
          "Notification",
        ),
        f(
          "noticeDays",
          "Préavis contractuel en jours calendaires pour ce dossier",
          "Notification",
          "integer",
          { min: 1, max: 1095 },
        ),
        f(
          "receiptDate",
          "Date cible de réception démontrable",
          "Notification",
          "date",
        ),
        f(
          "delivery",
          "Mode d’envoi requis par le contrat et preuve de réception",
          "Notification",
        ),
        f(
          "relationship",
          "Ancienneté, dépendance et contexte de la relation commerciale",
          "Vérifications",
        ),
        f(
          "noticeReviewed",
          "Suffisance du préavis et régime juridique examinés ?",
          "Vérifications",
          "select",
          {
            options: [
              ["yes", "Oui, examen effectué"],
              ["no", "Non / à vérifier"],
            ],
          },
        ),
        f(
          "handover",
          "Modalités de poursuite pendant le préavis et de restitution à l’échéance",
          "Sortie",
        ),
      ],
      checks: [
        "Clause, échéance et date de réception compatibles avec le délai contractuel.",
        "Rupture brutale, ancienneté, dépendance et régime spécial examinés ; le délai contractuel seul ne suffit pas.",
        "La lettre n’est pas utilisée pour une résiliation anticipée pour faute ou un régime protégé.",
      ],
    },
    {
      id: "fr-payment-plan",
      title: "Accord d’échelonnement d’une dette échue",
      family: "Affaires & opérations",
      tag: "Principal établi · échéancier exact",
      description:
        "Échelonner un principal déjà exigible, avec un calendrier calculé au centime.",
      roles: ["Créancier", "Débiteur"],
      sources: ["amendment", "notice"],
      fields: [
        f(
          "debtBasis",
          "Origine, références des factures et justificatifs de la créance échue",
          "Créance",
        ),
        f("dueDate", "Date initiale d’exigibilité", "Créance", "date"),
        f(
          "principal",
          "Principal restant dû après paiements et avoirs, en euros",
          "Créance",
          "money",
        ),
        f("installments", "Nombre de mensualités", "Échéancier", "integer", {
          min: 2,
          max: 36,
        }),
        f(
          "firstPaymentDate",
          "Première date de paiement",
          "Échéancier",
          "date",
        ),
        f(
          "paymentMethod",
          "Mode de paiement et coordonnées sécurisées de règlement",
          "Échéancier",
        ),
        f(
          "accessories",
          "Sort des intérêts, pénalités et frais existants : montants ou réserves précises",
          "Créance",
        ),
        f(
          "defaultDays",
          "Délai de régularisation après mise en demeure d’une échéance impayée",
          "Défaillance",
          "integer",
          { min: 8, max: 90 },
        ),
        f(
          "dispute",
          "Principal non contesté et absence de procédure collective vérifiés ?",
          "Créance",
          "select",
          {
            options: [
              ["yes", "Oui"],
              ["no", "Non / à vérifier"],
            ],
          },
        ),
      ],
      checks: [
        "Créance certaine, échue et décompte contradictoire vérifiés.",
        "Échéancier et éventuels accessoires compatibles avec les règles impératives, notamment de paiement entre professionnels.",
        "Absence de procédure collective et effets des sûretés examinés ; aucune novation ni renonciation implicite.",
      ],
    },
    {
      id: "fr-acceptance",
      title: "Procès-verbal de recette de livrables",
      family: "Affaires & opérations",
      tag: "Recette expresse · réserves",
      description:
        "Tracer les livrables présentés, les tests, la décision et le traitement des réserves.",
      roles: ["Prestataire", "Client"],
      sources: ["amendment"],
      fields: [
        ...reference,
        f("deliveryDate", "Date de remise des livrables", "Recette", "date"),
        f("tested", "Livrables, versions et tests exécutés", "Recette"),
        f(
          "criteria",
          "Critères contractuels et résultats constatés, avec preuves",
          "Recette",
        ),
        f("decision", "Décision de recette", "Recette", "select", {
          options: [
            ["accepted", "Acceptation sans réserve"],
            ["reserved", "Acceptation avec réserves"],
            ["rejected", "Refus motivé"],
          ],
        }),
        f(
          "reservations",
          "Réserves ou motifs de refus précisément décrits ; indiquer « aucune » si sans réserve",
          "Réserves",
        ),
        f(
          "remediation",
          "Actions, responsables, échéances et contre-tests ; indiquer « sans objet » si applicable",
          "Réserves",
        ),
        f(
          "financialEffects",
          "Effets prévus au contrat sur la facturation, les garanties et le démarrage du service",
          "Effets",
        ),
      ],
      checks: [
        "Versions, critères et résultats vérifiables annexés.",
        "Réserves cohérentes avec la décision et plan de levée défini.",
        "Effets de la recette limités au contrat ; pas de renonciation générale aux garanties.",
      ],
    },
    {
      id: "fr-loan-equipment",
      title: "Convention de prêt gratuit de matériel",
      family: "Affaires & opérations",
      tag: "Prêt à usage · restitution",
      description:
        "Identifier les biens prêtés gratuitement, leurs usages et les conditions de restitution.",
      roles: ["Prêteur", "Emprunteur"],
      sources: ["equipmentLoan"],
      fields: [
        ...dates,
        f(
          "equipment",
          "Inventaire, numéros de série, accessoires et état contradictoire",
          "Matériel",
        ),
        f(
          "use",
          "Usage autorisé, utilisateurs et lieu d’utilisation",
          "Matériel",
        ),
        f(
          "handover",
          "Remise, transport, état des lieux et preuves",
          "Remise & restitution",
        ),
        f(
          "maintenance",
          "Entretien courant, frais d’usage et réparations exceptionnelles",
          "Entretien",
        ),
        f(
          "insurance",
          "Assurance adaptée, attestations et risques couverts",
          "Entretien",
        ),
        f(
          "return",
          "Lieu et modalités de restitution, contrôle de l’état et accessoires",
          "Remise & restitution",
        ),
      ],
      checks: [
        "Prêt effectivement gratuit et matériel identifié, hors immobilier et biens réglementés.",
        "Durée et usage déterminés, règles de restitution et de besoin anticipé examinées.",
        "Assurance et prise en charge des frais adaptées ; aucun transfert de propriété.",
      ],
    },
  ];
  return definitions.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.family,
    family: d.family,
    tag: d.tag,
    description: d.description,
    partyRoles: d.roles,
    version,
    jurisdiction: "FR",
    origin: "atelier",
    sourceIds: d.sources,
    fields: [...commonFields, ...d.fields],
    reviewItems: [
      {
        id: "authority",
        label: "Identité, pouvoirs et contexte professionnel vérifiés.",
      },
      ...d.checks.map((label, i) => ({ id: `specific-${i + 1}`, label })),
    ],
  }));
}

export function extendedClauses(
  template,
  {
    answers: a,
    value: v,
    when: d,
    amount: m,
    section: s,
    issue,
    cents,
    euro,
    validDate,
  },
) {
  if (!template.partyRoles) return;
  s(
    "roles",
    "Rôles et périmètre",
    `La Partie 1 intervient en qualité de ${template.partyRoles[0]}. La Partie 2 intervient en qualité de ${template.partyRoles[1]}. Le présent document vise exclusivement l’opération décrite ci-après ; ses annexes doivent être identifiées et remises aux parties.`,
  );
  const terms = () =>
    s(
      "term",
      "Durée et modifications",
      `Le contrat prend effet le ${d("startDate")} et s’achève le ${d("endDate")}, sans renouvellement automatique. Toute prolongation ou modification de périmètre ou de prix nécessite un accord écrit des parties. Les obligations qui, par leur objet, doivent survivre restent applicables pour leur durée propre.`,
      ["amendment"],
    );
  const price = () => {
    s(
      "price",
      "Prix, facturation et paiement",
      `Prix HT : ${m("price")}. Régime fiscal et TVA : ${v("taxTerms")}. Modalités de facturation et échéances : ${v("paymentTerms")}. Les délais et mentions des factures doivent respecter les règles impératives applicables ; le présent document n’autorise pas leur dépassement. Aucun intérêt ni indemnité n’est calculé automatiquement.`,
      ["payment"],
    );
    issue(
      "payment-manual",
      "warning",
      "Les délais, mentions, TVA, pénalités et indemnités doivent être vérifiés dans les conditions financières ; ce champ libre ne réalise pas un contrôle chiffré.",
      "paymentTerms",
      ["payment"],
    );
  };
  const confidentiality = () =>
    s(
      "confidentiality",
      "Confidentialité et données",
      `Chaque partie réserve les informations non publiques reçues à l’exécution du contrat et en limite l’accès aux personnes habilitées soumises à confidentialité. Les divulgations légalement obligatoires sont limitées au nécessaire. Aucune cession de données personnelles n’est autorisée par cette clause ; les rôles et, si nécessaire, l’encadrement de l’article 28 du RGPD sont à formaliser avant tout accès.`,
      ["confidentiality", "privacy"],
    );
  const initial = () =>
    s(
      "initial",
      "Contrat concerné",
      `Les présentes concernent le contrat « ${v("contractTitle")} », conclu le ${d("contractDate")}. Ses stipulations non expressément modifiées demeurent applicables.`,
      ["amendment"],
    );
  switch (template.id) {
    case "fr-dpa":
      s(
        "processing",
        "Objet, durée et annexe des traitements",
        `Le responsable confie au sous-traitant : ${v("service")}. Opérations et finalités : ${v("operations")}. Données concernées : ${v("dataCategories")}. Personnes concernées : ${v("subjects")}. Durée du traitement : du ${d("startDate")} au ${d("endDate")}. Le responsable détermine les finalités et la licéité des instructions.`,
        ["privacy"],
      );
      s(
        "instructions",
        "Instructions, confidentialité et licéité",
        `Le sous-traitant intervient uniquement sur les instructions documentées suivantes : ${v("instructions")}. Toute instruction supplémentaire est tracée. Il alerte immédiatement le responsable lorsqu’une instruction lui paraît contraire aux règles de protection des données et coopère à sa clarification. Les personnes habilitées sont soumises à une obligation de confidentialité et n’accèdent qu’aux données nécessaires.`,
      );
      s(
        "security",
        "Sécurité et localisation",
        `Mesures applicables et vérifiables : ${v("security")}. Sites de stockage et accès distants : ${v("locations")}. Aucun transfert ni accès depuis un pays hors EEE n’est autorisé par cet accord. Une telle évolution requiert une instruction écrite et un encadrement distinct approprié, avant sa mise en œuvre.`,
        ["privacy"],
      );
      s(
        "subprocessors",
        "Sous-traitants ultérieurs",
        `Intervenants autorisés et prestations : ${v("subprocessors")}. ${a.authorization === "general" ? `L’autorisation est générale pour les intervenants listés. Le sous-traitant informe le responsable de tout ajout ou remplacement au moins ${v("objectionDays")} jours avant intervention, afin de permettre une objection motivée. Tant qu’une objection n’est pas résolue, le nouvel intervenant n’accède pas aux données.` : "Tout ajout ou remplacement requiert l’autorisation écrite spécifique préalable du responsable."} Des obligations équivalentes sont imposées par écrit à chaque intervenant. Le sous-traitant demeure responsable envers le responsable du respect de ces obligations.`,
      );
      s(
        "incidents",
        "Violations et assistance",
        `Toute violation connue est notifiée au responsable sans délai injustifié via : ${v("incidentContact")}. La notification décrit les faits connus, les catégories et volumes concernés, les conséquences probables et les mesures prises ; les informations manquantes sont complétées progressivement. L’assistance pour les droits des personnes, la sécurité, les notifications, les analyses d’impact et la consultation préalable est organisée ainsi : ${v("assistance")}. Le sous-traitant transmet les demandes reçues sans décider seul de leur suite.`,
      );
      s(
        "audit",
        "Information et audit",
        `Le sous-traitant fournit les informations démontrant le respect de ses obligations et permet les audits et inspections selon : ${v("audit")}. Ces modalités ne peuvent supprimer le droit de contrôle du responsable ni les pouvoirs d’une autorité compétente.`,
      );
      s(
        "exit",
        "Sortie et sort des copies",
        `${a.returnChoice === "return" ? "Le sous-traitant restitue les données au responsable puis supprime les copies restantes" : "Le sous-traitant supprime les données et leurs copies"}, dans les ${v("returnDays")} jours suivant la fin de sa mission, selon l’instruction du responsable. Il documente l’exécution ; toute conservation légalement imposée est identifiée, limitée et protégée. Les sauvegardes résiduelles sont isolées et effacées selon un cycle documenté, sans réutilisation.`,
      );
      issue(
        "dpa-assessment",
        "warning",
        "Vérifier les rôles réels, les annexes et chaque accès distant. Cette trame originale n’est ni une certification RGPD ni une reproduction des clauses types de la Commission.",
      );
      break;
    case "fr-saas":
      s(
        "service",
        "Service et accès",
        `Le fournisseur met à disposition : ${v("service")}. Le droit d’accès est non exclusif, limité aux utilisateurs et capacités suivants : ${v("users")}. Il n’emporte aucun transfert du logiciel. Les restrictions d’usage ne neutralisent pas les droits impératifs applicables.`,
      );
      terms();
      price();
      s(
        "sla",
        "Niveaux de service et recours",
        `Disponibilité et calcul : ${v("availability")}. Support : ${v("support")}. Correctifs et recours : ${v("remedies")}. Les exclusions de calcul doivent être identifiables et proportionnées. L’existence d’un crédit de service ne supprime pas les recours impératifs ni les mesures urgentes.`,
      );
      s(
        "data",
        "Données, sécurité et annexe RGPD",
        `Hébergement et protection : ${v("hosting")}. Encadrement des données personnelles :\n${v("dpaText")}\nLe client conserve ses droits sur ses données ; aucune utilisation pour entraîner un modèle ou pour une finalité propre au fournisseur n’est autorisée par défaut.`,
        ["privacy"],
      );
      s(
        "exit",
        "Réversibilité et fin du service",
        `Conditions de récupération et de sortie : ${v("exitPlan")}. Le fournisseur facilite la récupération dans les formats convenus et n’efface pas les données avant l’expiration du délai prévu, sauf instruction licite différente. Les exigences impératives applicables au changement de fournisseur prévalent.`,
      );
      s(
        "liability",
        "Responsabilité",
        `Le plafond contractuel proposé est de ${m("liabilityCap")}, sous réserve de son opposabilité et des règles impératives. Il ne limite pas les dommages corporels, le dol ou la faute lourde et ne peut priver une obligation essentielle de sa substance. Les risques liés aux données et à la continuité doivent être expressément évalués.`,
        ["essential"],
      );
      confidentiality();
      if ((a.dpaText || "").length < 120)
        issue(
          "dpa-detail",
          "blocking",
          "Décrire précisément l’annexe RGPD ou le motif d’absence de traitement ; une mention courte ne suffit pas.",
          "dpaText",
          ["privacy"],
        );
      issue(
        "data-act",
        "warning",
        "Vérifier séparément le règlement européen sur les données et les règles de changement de fournisseur applicables au service SaaS. La trame ne certifie pas leur conformité.",
      );
      break;
    case "fr-maintenance":
      s(
        "assets",
        "Parc et prestations couverts",
        `Parc et versions : ${v("assets")}. Services inclus, maintenance préventive, corrective et exclusions : ${v("services")}. Une prestation hors périmètre nécessite un devis accepté avant intervention.`,
      );
      terms();
      price();
      s(
        "support",
        "Support et délais",
        `${v("support")}. Chaque demande fait l’objet d’un ticket horodaté, d’une qualification et d’un suivi. Prise en charge et rétablissement sont distingués ; les exclusions et dépendances sont documentées.`,
      );
      s(
        "access",
        "Accès et continuité",
        `${v("access")}. Les accès sont nominatifs et limités à la mission. Les opérations susceptibles d’affecter les données ou la disponibilité sont précédées des protections convenues ; le mainteneur ne peut présumer qu’une sauvegarde a été réalisée sans confirmation.`,
      );
      s(
        "changes",
        "Gestion des changements",
        `${v("changes")}. Les changements significatifs sont documentés et soumis à validation ; une intervention d’urgence est tracée et expliquée au client sans délai injustifié.`,
      );
      s("security", "Protection des informations", v("security"), ["privacy"]);
      s("exit", "Fin de maintenance", v("exitPlan"));
      confidentiality();
      break;
    case "fr-subcontracting":
      s(
        "mission",
        "Opération et mission confiée",
        `Contrat principal et client final : ${v("mainContract")}. Prestations déléguées : ${v("mission")}. Les seules obligations du contrat principal opposables au sous-traitant sont celles identifiées, communiquées et acceptées, sous réserve des dispositions impératives.`,
      );
      terms();
      price();
      s(
        "approval",
        "Acceptation et garanties de paiement",
        `Acceptation et agrément des conditions de paiement : ${v("acceptance")}. Garanties et justificatifs : ${v("paymentSecurity")}. Les formalités et garanties légalement requises sont réalisées avant l’exécution ; aucune stipulation n’écarte les protections légales du sous-traitant.`,
        ["subcontract"],
      );
      s("delivery", "Livrables et recette", v("delivery"));
      s(
        "independence",
        "Autonomie et vigilance",
        `${v("independence")}. Le sous-traitant organise lui-même ses moyens et conserve l’autorité sur ses équipes. Les justificatifs requis sont demandés et actualisés selon le régime applicable.`,
      );
      s("rights", "Droits, confidentialité et données", v("rights"));
      confidentiality();
      if (a.approvalConfirmed !== "yes")
        issue(
          "subcontract-approval",
          "blocking",
          "Les formalités et garanties requises ne sont pas confirmées sur pièces.",
          "approvalConfirmed",
          ["subcontract"],
        );
      break;
    case "fr-license":
      s(
        "software",
        "Logiciel et licence",
        `Logiciel concédé : ${v("software")}. La licence est non exclusive et sans droit de sous-licence. Usages autorisés : ${v("uses")}. Territoire : ${v("territory")}. Aucune cession de propriété du logiciel n’est consentie. Les exceptions légales, notamment celles applicables à l’utilisation et à l’interopérabilité, restent réservées.`,
        ["software"],
      );
      terms();
      price();
      s("delivery", "Remise et activation", v("delivery"));
      s("support", "Support et évolutions", v("support"));
      s(
        "warranty",
        "Droits et garanties",
        `Chaîne des droits et licences tierces : ${v("rightsChain")}. Engagements de conformité et remèdes : ${v("warranty")}. Les restrictions des composants tiers sont communiquées avant l’engagement du licencié.`,
      );
      s("exit", "Expiration et restitution", v("exitPlan"));
      confidentiality();
      break;
    case "fr-ip-assignment":
      s(
        "work",
        "Création et titularité",
        `La cession porte exclusivement sur l’œuvre existante suivante : ${v("work")}. Chaîne de titularité et autorisations : ${v("rightsChain")}. Toute œuvre future, toute création non identifiée et tout élément tiers non expressément inclus sont exclus.`,
      );
      s(
        "rights",
        "Droits cédés et destination",
        `Les droits patrimoniaux cédés sont individuellement définis ainsi : ${v("rights")}. Pour chaque droit, les destinations et modes d’exploitation sont : ${v("uses")}. Aucun mode non expressément visé n’est transféré.`,
        ["ipAssignment"],
      );
      s(
        "scope",
        "Étendue, lieu et durée",
        `Territoire de chaque droit : ${v("territory")}. Durée et point de départ de chaque droit : ${v("term")}. Une extension nécessite un écrit distinct et une rémunération adaptée.`,
      );
      s(
        "remuneration",
        "Rémunération et reddition",
        `${v("remuneration")}. Le régime légal de rémunération applicable à la création prime ; aucune rémunération forfaitaire n’est présumée admissible par le seul présent modèle.`,
      );
      s(
        "delivery",
        "Remise et éléments exclus",
        `Remise : ${v("delivery")}. Exclusions et droits des tiers : ${v("thirdParty")}. Le droit moral des auteurs demeure réservé ; aucune renonciation générale à ce droit n’est stipulée.`,
      );
      s(
        "claims",
        "Coopération et réclamations",
        `Le cédant transmet les justificatifs nécessaires à la vérification des droits et informe le cessionnaire de toute réclamation connue. Les parties coopèrent pour limiter les conséquences d’une réclamation sans étendre la cession au-delà de son périmètre.`,
      );
      if (a.chainConfirmed !== "yes")
        issue(
          "ip-chain",
          "blocking",
          "La chaîne de titularité doit être établie avant toute relecture finale.",
          "chainConfirmed",
          ["ipAssignment"],
        );
      break;
    case "fr-loi":
      s(
        "project",
        "Intentions indicatives",
        `Les parties souhaitent étudier le projet suivant : ${v("project")}. Conditions envisagées à titre indicatif : ${v("outline")}. Cette partie de la lettre ne constitue ni une offre ferme ni une promesse ni une obligation de réaliser l’opération.`,
      );
      s(
        "conditions",
        "Vérifications et processus",
        `Conditions restant à satisfaire : ${v("conditions")}. Organisation indicative : ${v("process")}. La période de discussion envisagée court du ${d("startDate")} au ${d("endDate")}. Chaque partie reste libre de ne pas conclure, dans le respect de la bonne foi et des obligations précontractuelles.`,
        ["negotiations"],
      );
      s(
        "binding",
        "Engagements expressément obligatoires",
        `Seuls les engagements de confidentialité, de répartition des frais et de droit applicable de la présente lettre ont force obligatoire. Aucune exclusivité de négociation n’est consentie. Une opération éventuelle nécessitera un contrat définitif signé et les autorisations requises.`,
      );
      s(
        "confidentiality",
        "Confidentialité obligatoire",
        `Informations couvertes et personnes habilitées : ${v("information")}. L’usage est limité à l’étude du projet ; les informations publiques, déjà licitement détenues ou obtenues indépendamment sont exclues sur justification. La confidentialité survit ${v("confidentialYears")} année(s) après la fin des échanges, sous réserve des obligations légales de divulgation.`,
        ["confidentiality"],
      );
      s(
        "costs",
        "Frais et fin des discussions",
        `Frais : ${v("costs")}. La fin des discussions n’emporte aucun transfert de droit sur les documents remis. Les obligations légales d’information et la responsabilité pour conduite fautive des négociations restent réservées.`,
        ["negotiations"],
      );
      break;
    case "fr-termination":
      initial();
      s(
        "termination",
        "Fin convenue",
        `Contexte : ${v("reason")}. Les parties conviennent de mettre fin au contrat à compter du ${d("effectiveDate")}. Elles organisent jusqu’à cette date l’exécution des obligations existantes, sous réserve des seules adaptations expresses du présent accord.`,
        ["amendment"],
      );
      s("settlement", "Décompte et paiement", v("settlement"));
      s("handover", "Restitutions et transition", v("handover"));
      s("survival", "Obligations survivantes", v("survival"));
      s(
        "reserved",
        "Droits réservés et absence de transaction",
        `Droits ou différends réservés : ${v("reserved")}. L’accord ne contient ni quittance générale ni renonciation globale ni transaction au sens du Code civil ; un règlement transactionnel éventuel exige une rédaction et une analyse distinctes.`,
      );
      break;
    case "fr-notice-termination":
      initial();
      s(
        "notification",
        "Notification de non-renouvellement",
        `Nous vous notifions notre décision de ne pas renouveler le contrat à son échéance du ${d("effectiveDate")}, sur le fondement de la clause suivante : ${v("clause")}. Cette notification vise la fin à l’échéance et ne prétend pas mettre fin par anticipation au contrat.`,
      );
      s(
        "delivery",
        "Préavis et preuve de réception",
        `Préavis contractuel déclaré : ${v("noticeDays")} jours calendaires. Date cible de réception : ${d("receiptDate")}. Envoi et preuve : ${v("delivery")}. L’expéditeur doit vérifier la réception effective ; la date cible n’est pas une preuve de remise.`,
      );
      s(
        "relationship",
        "Contexte de la relation",
        `Éléments à prendre en compte pour le préavis : ${v("relationship")}. Le préavis contractuel ne dispense pas d’examiner les règles impératives relatives à la rupture d’une relation commerciale établie ou un régime spécial.`,
        ["commercialTermination"],
      );
      s(
        "handover",
        "Exécution du préavis et sortie",
        `${v("handover")}. Sauf accord contraire ou cause légale distincte, les obligations contractuelles continuent pendant le préavis. Les comptes et restitutions feront l’objet d’un relevé documenté.`,
      );
      if (a.noticeReviewed !== "yes")
        issue(
          "notice-review",
          "blocking",
          "La suffisance du préavis doit être examinée au regard de la relation et du régime applicable.",
          "noticeReviewed",
          ["commercialTermination"],
        );
      if (
        validDate(a.receiptDate) &&
        validDate(a.effectiveDate) &&
        Number.isInteger(Number(a.noticeDays)) &&
        (Date.parse(a.effectiveDate) - Date.parse(a.receiptDate)) / 86400000 <
          Number(a.noticeDays)
      )
        issue(
          "notice-short",
          "blocking",
          "Le délai entre réception cible et échéance est inférieur au préavis déclaré.",
          "receiptDate",
        );
      break;
    case "fr-payment-plan": {
      s(
        "debt",
        "Créance et décompte",
        `Origine et pièces : ${v("debtBasis")}. Créance échue le ${d("dueDate")}. Principal restant dû convenu : ${m("principal")}. Accessoires : ${v("accessories")}. Les parties vérifient contradictoirement les paiements et avoirs déjà imputés.`,
      );
      const principal = cents(a.principal),
        n = Number(a.installments),
        schedule = [];
      if (
        principal !== null &&
        n >= 2 &&
        n <= 36 &&
        Number.isInteger(n) &&
        validDate(a.firstPaymentDate)
      ) {
        const start = new Date(a.firstPaymentDate + "T12:00:00Z");
        const base = Math.floor(principal / n);
        if (base === 0)
          issue(
            "installment-small",
            "blocking",
            "Le principal ne permet pas une échéance positive au centime.",
            "installments",
          );
        for (let i = 0; i < n; i++) {
          const month = new Date(
            Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1),
          );
          const lastDay = new Date(
            Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
          ).getUTCDate();
          month.setUTCDate(Math.min(start.getUTCDate(), lastDay));
          schedule.push(
            `${month.toISOString().slice(0, 10)} : ${euro(i === n - 1 ? principal - base * (n - 1) : base)}`,
          );
        }
      }
      s(
        "schedule",
        "Échéancier du principal",
        schedule.length
          ? schedule.join("\n")
          : "⟦À compléter : montant, mensualités et première date valides⟧",
      );
      s(
        "payment",
        "Paiement et imputation",
        `Modalités : ${v("paymentMethod")}. Les paiements sont enregistrés et imputés selon l’accord et les règles applicables. Les échéances ci-dessus concernent le principal ; le traitement des accessoires est celui expressément décrit à l’article précédent.`,
      );
      s(
        "default",
        "Échéance impayée",
        `En cas d’échéance non réglée, le créancier adresse une mise en demeure précisant les sommes concernées et accordant ${v("defaultDays")} jours à compter de sa réception pour régulariser. À défaut, il peut demander le solde exigible selon les stipulations opposables et les règles applicables, sans pénalité nouvelle inventée par cet accord.`,
      );
      s(
        "reservation",
        "Portée de l’accord",
        `L’échelonnement ne constitue ni un nouveau prêt ni une novation, ni une remise de dette ni une renonciation aux droits et accessoires non expressément abandonnés. Il ne peut déroger aux règles impératives, notamment de paiement ou de procédure collective. Aucun maintien d’une sûreté ne peut être présumé sans examen de son régime et des consentements requis.`,
        ["amendment"],
      );
      if (a.dispute !== "yes")
        issue(
          "debt-disputed",
          "blocking",
          "Créance ou situation du débiteur non vérifiée.",
          "dispute",
        );
      if (
        validDate(a.dueDate) &&
        validDate(a.signDate) &&
        a.dueDate >= a.signDate
      )
        issue(
          "debt-not-due",
          "blocking",
          "Ce modèle vise une dette déjà échue à la signature.",
          "dueDate",
        );
      if (
        validDate(a.firstPaymentDate) &&
        validDate(a.signDate) &&
        a.firstPaymentDate < a.signDate
      )
        issue(
          "payment-before-sign",
          "blocking",
          "La première échéance précède la signature.",
          "firstPaymentDate",
        );
      break;
    }
    case "fr-acceptance":
      initial();
      s(
        "delivery",
        "Présentation et vérifications",
        `Remise le ${d("deliveryDate")}. Livrables et versions : ${v("tested")}. Critères et résultats : ${v("criteria")}. Le présent constat s’appuie sur les vérifications et pièces effectivement identifiées.`,
      );
      s(
        "decision",
        "Décision de recette",
        `Le client prononce : ${a.decision === "accepted" ? "l’acceptation sans réserve" : a.decision === "reserved" ? "l’acceptation avec les réserves ci-dessous" : "le refus motivé de recette"}. La décision porte uniquement sur le périmètre vérifié.`,
      );
      s("reservations", "Réserves ou motifs", v("reservations"));
      s("remediation", "Actions et contre-tests", v("remediation"));
      s(
        "effects",
        "Effets contractuels",
        `${v("financialEffects")}. La décision n’emporte aucune renonciation générale aux garanties et recours qui subsistent en vertu du contrat ou de la loi.`,
        ["amendment"],
      );
      if (
        a.decision === "accepted" &&
        !/^(aucune|sans réserve|sans objet)[.!\s]*$/i.test(a.reservations || "")
      )
        issue(
          "acceptance-conflict",
          "blocking",
          "Une acceptation sans réserve est incompatible avec des réserves décrites.",
          "reservations",
        );
      if (
        ["reserved", "rejected"].includes(a.decision) &&
        (/^(aucune|sans objet)[.!\s]*$/i.test(a.reservations || "") ||
          (a.reservations || "").length < 20)
      )
        issue(
          "acceptance-reasons",
          "blocking",
          "Décrire précisément les réserves ou motifs de refus.",
          "reservations",
        );
      break;
    case "fr-loan-equipment":
      s(
        "equipment",
        "Matériel et gratuité",
        `Le prêteur remet gratuitement à l’emprunteur les biens suivants : ${v("equipment")}. Le prêteur conserve leur propriété. Le prêt ne concerne ni un immeuble ni des biens soumis à un régime spécial.`,
        ["equipmentLoan"],
      );
      terms();
      s(
        "use",
        "Usage et garde",
        `Usage, utilisateurs et lieu autorisés : ${v("use")}. L’emprunteur prend soin du matériel, respecte les consignes et n’en transfère ni la garde ni l’usage à un tiers sans accord écrit du prêteur.`,
      );
      s("handover", "Remise contradictoire", v("handover"));
      s(
        "maintenance",
        "Entretien, frais et assurance",
        `Entretien et frais : ${v("maintenance")}. Assurance : ${v("insurance")}. Les règles légales relatives aux dépenses extraordinaires nécessaires et aux risques restent réservées.`,
      );
      s(
        "return",
        "Restitution",
        `À l’échéance, l’emprunteur restitue le matériel selon : ${v("return")}. Les parties documentent l’état et les accessoires. Le prêteur ne dispose pas d’un droit discrétionnaire de reprise avant le terme convenu ; tout besoin anticipé est traité selon le droit applicable ou un accord écrit.`,
        ["equipmentLoan"],
      );
      break;
  }
  if (
    a.contractDate &&
    a.signDate &&
    validDate(a.contractDate) &&
    validDate(a.signDate) &&
    a.contractDate > a.signDate
  )
    issue(
      "initial-date",
      "blocking",
      "Le contrat initial est postérieur au présent document.",
      "contractDate",
    );
  if (
    a.effectiveDate &&
    a.contractDate &&
    validDate(a.effectiveDate) &&
    validDate(a.contractDate) &&
    a.effectiveDate < a.contractDate
  )
    issue(
      "effective-initial",
      "blocking",
      "La prise d’effet est antérieure au contrat initial.",
      "effectiveDate",
    );
  if (
    template.id === "fr-acceptance" &&
    validDate(a.deliveryDate) &&
    validDate(a.signDate) &&
    a.deliveryDate > a.signDate
  )
    issue(
      "delivery-future",
      "blocking",
      "Un procès-verbal ne peut constater une remise future.",
      "deliveryDate",
    );
  if (template.id !== "fr-notice-termination")
    s(
      "law",
      "Droit applicable et différends",
      "Le présent document est soumis au droit français. Les parties recherchent une solution amiable sans suspendre les délais impératifs ni les mesures urgentes. À défaut, les juridictions compétentes sont déterminées selon les règles de droit commun. Aucune compétence territoriale exclusive n’est stipulée.",
    );
}
