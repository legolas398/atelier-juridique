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
    {
      id: "fr-training-agreement",
      title: "Convention de formation professionnelle",
      family: "Formation & sous-traitance",
      tag: "Programme · durée · financement",
      description: "Formaliser une action de formation entre un organisme et une entreprise cliente, avec programme, calendrier, prix et suivi.",
      roles: ["Organisme de formation", "Entreprise cliente"],
      sources: ["trainingModels"],
      fields: [
        ...dates,
        f("trainingTitle", "Intitulé et finalité opérationnelle", "Action de formation", "text"),
        f("objectives", "Objectifs pédagogiques évaluables et compétences visées", "Action de formation"),
        f("program", "Programme détaillé, séquences, méthodes et moyens pédagogiques", "Action de formation"),
        f("audience", "Public visé, effectif, prérequis et modalités d’inscription", "Participants"),
        f("trainer", "Intervenants, qualifications et remplacements prévus", "Participants"),
        f("delivery", "Présentiel, distanciel ou mixte ; lieu, outils, assistance et accessibilité", "Modalités"),
        f("schedule", "Durée totale en heures, dates, horaires et séquencement", "Modalités"),
        f("assessment", "Évaluation des acquis, suivi d’assiduité et justificatifs remis", "Modalités"),
        f("price", "Prix HT, TVA ou fondement déclaré de l’exonération", "Conditions financières", "money"),
        f("expenses", "Frais annexes, déplacements et prise en charge", "Conditions financières"),
        f("paymentTerms", "Facturation, échéances et pièces justificatives", "Conditions financières"),
        f("cancellation", "Report, annulation, interruption et conséquences financières selon le régime applicable", "Annulation"),
        f("funding", "Financeur éventuel, accord préalable et traitement d’un refus de prise en charge", "Financement"),
      ],
      checks: [
        "Programme, public, durée, calendrier, modalités de suivi et prix cohérents entre eux.",
        "Le statut des parties, le financement, les règles applicables aux bénéficiaires et les modèles DREETS à jour sont vérifiés.",
        "Aucune prise en charge, exonération de TVA, certification ou conformité à un financeur n’est présumée par la trame.",
      ],
    },
    {
      id: "fr-training-subcontract",
      title: "Sous-traitance d’une action de formation",
      family: "Formation & sous-traitance",
      tag: "Mission · contrôle · justificatifs",
      description: "Décrire précisément le lot pédagogique confié, les obligations documentaires, le prix et le contrôle de réalisation.",
      roles: ["Donneur d’ordre", "Organisme sous-traitant"],
      sources: ["trainingModels", "subcontract"],
      fields: [
        ...reference,
        ...dates,
        f("trainingTitle", "Action, client final et référence de l’opération principale", "Périmètre"),
        f("module", "Module confié, objectifs, séquences et livrables pédagogiques", "Mission"),
        f("audience", "Public, effectif, prérequis et informations à transmettre", "Participants"),
        f("trainer", "Intervenants, qualifications, remplacement et validation préalable", "Réalisation"),
        f("delivery", "Lieu ou plateforme, calendrier, moyens et accessibilité", "Réalisation"),
        f("attendance", "Assiduité, feuilles de présence, évaluations et justificatifs à produire", "Suivi & preuves"),
        f("quality", "Contrôle qualité, réclamations, incidents et coopération avec le client final", "Suivi & preuves"),
        f("price", "Prix HT et régime de TVA déclaré", "Conditions financières", "money"),
        f("paymentTerms", "Facturation et échéances, sous réserve du régime applicable", "Conditions financières"),
        f("materials", "Supports, droits d’utilisation, documents remis et propriété intellectuelle", "Données & droits"),
        f("data", "Données des participants, accès, confidentialité et mesures de sécurité", "Données & droits"),
        f("statusChecks", "Numéro de déclaration d’activité, certifications et habilitations lorsqu’elles sont pertinentes", "Vérifications"),
        f("termination", "Suspension, remplacement ou arrêt de la mission et remise des justificatifs", "Fin de mission"),
      ],
      checks: [
        "Le lot sous-traité, le lien avec le contrat principal, les responsabilités et les preuves de réalisation sont délimités.",
        "Les déclarations d’activité, exigences du financeur, certifications et chaînes de sous-traitance sont contrôlées sur pièces.",
        "Les règles d’accès, de confidentialité, de données et de propriété des supports sont adaptées aux pratiques des parties.",
      ],
    },
    {
      id: "fr-patent-license",
      title: "Contrat de licence d’exploitation de brevet",
      family: "Propriété intellectuelle",
      tag: "Titre · territoire · redevances",
      description: "Structurer une négociation de licence de brevet autour du titre, des actes autorisés, du périmètre, des redevances et du suivi.",
      roles: ["Concédant", "Licencié"],
      sources: ["patentLicense"],
      fields: [
        ...dates,
        f("patentTitle", "Numéro, titre, pays, statut et échéance du brevet", "Titres concernés"),
        f("ownership", "Titularité, copropriété, sûretés, licences antérieures et justificatifs", "Titres concernés"),
        f("licensedActs", "Actes d’exploitation autorisés : fabriquer, utiliser, offrir, vendre, importer ou autres", "Droits concédés"),
        f("fieldOfUse", "Produits, procédés, applications et domaine d’utilisation", "Droits concédés"),
        f("territory", "Territoires et pays couverts, avec exclusions", "Périmètre"),
        f("exclusivity", "Licence exclusive, non exclusive ou sole ; réserves d’exploitation du concédant", "Périmètre", "select", { options: [["exclusive", "Exclusive"], ["sole", "Sole avec réserve explicite"], ["nonexclusive", "Non exclusive"]] }),
        f("sublicense", "Sous-licences, sociétés affiliées, distributeurs et autorisations requises", "Périmètre"),
        f("royalty", "Redevance, assiette, devise, taux et événements déclencheurs", "Redevances"),
        f("minimums", "Minimums garantis, avances, jalons et règles d’imputation", "Redevances"),
        f("reporting", "États de ventes, périodicité, pièces justificatives et audit contradictoire", "Redevances"),
        f("improvements", "Améliorations, perfectionnements, inventions et droits de chaque partie", "Développements"),
        f("infringement", "Notification des atteintes, coopération, coûts et conduite des actions", "Protection du titre"),
        f("quality", "Normes de qualité, conformité des produits et usage des mentions de brevet", "Exploitation"),
        f("registration", "Formalités, inscriptions, taxes et répartition des coûts", "Fin de licence"),
        f("termination", "Durée, renouvellement, résiliation et sort des stocks ou sous-licences", "Fin de licence"),
      ],
      checks: [
        "Le titre, les territoires, les actes autorisés, l’exclusivité et les éventuelles sous-licences sont précisément délimités.",
        "La titularité, la validité, les inscriptions, les cotitulaires, les droits antérieurs et les formalités sont examinés sur pièces.",
        "La redevance et l’audit sont vérifiables ; aucune garantie sur la validité ou la liberté d’exploitation du brevet n’est présumée.",
      ],
    },
    {
      id: "fr-cgv-b2b-services",
      title: "Conditions de vente B2B · prestations de services",
      family: "Vente & distribution",
      tag: "Prix · commande · paiement",
      description: "Préparer une base de conditions de vente destinée à une clientèle professionnelle, à articuler avec les commandes et conditions particulières.",
      roles: ["Prestataire / vendeur", "Client professionnel"],
      sources: ["cgv", "payment", "recovery"],
      fields: [
        f("service", "Nature, périmètre et limites des prestations proposées", "Offre", "textarea"),
        f("orderProcess", "Devis, commande, acceptation, durée de validité et priorité des documents", "Commande"),
        f("pricing", "Barème HT, unités, frais, remises et durée de validité", "Prix"),
        f("delivery", "Date ou délai d’exécution, dépendances client et modalités de réception", "Exécution"),
        f("invoiceType", "Rythme de facturation", "Paiement", "select", { options: [["completion", "À l’achèvement"], ["monthly", "Périodique / mensuelle"], ["milestone", "Par jalons définis"]] }),
        f("paymentDays", "Délai et point de départ ; respecter le plafond légal et le régime des factures périodiques", "Paiement", "integer", { min: 1, max: 60 }),
        f("lateInterest", "Taux de pénalités de retard et méthode de calcul, à vérifier au regard du minimum légal en vigueur", "Paiement"),
        f("recoveryFee", "Indemnité forfaitaire légale de recouvrement applicable aux opérations concernées", "Paiement"),
        f("discount", "Escompte pour paiement anticipé ou indiquer « aucun »", "Prix"),
        f("warranty", "Garanties contractuelles et garanties légales applicables au service", "Garanties"),
        f("complaint", "Réclamations, délai de signalement, coopération et corrections", "Exécution"),
        f("personalData", "Traitement éventuel de données personnelles et référence à l’accord de sous-traitance séparé", "Données"),
        f("termination", "Durée, renouvellement éventuel, suspension et résiliation", "Fin du contrat"),
      ],
      checks: [
        "La trame est limitée aux relations entre professionnels ; aucune clause consommateur, vente à distance B2C ou rétractation n’est présumée.",
        "Délais, taux de pénalité, indemnité de recouvrement, barème et escompte sont vérifiés selon le texte applicable et le type de facture.",
        "La hiérarchie entre CGV, devis, commande, contrat-cadre et conditions particulières est définie et portée à la connaissance du client.",
      ],
    },
    {
      id: "fr-consortium-digital",
      title: "Accord de consortium pour un projet numérique",
      family: "Innovation & partenariats",
      tag: "Projet commun · gouvernance · propriété intellectuelle",
      description: "Organiser un projet collaboratif entre partenaires : gouvernance, lots, financement, connaissances antérieures et résultats.",
      roles: ["Coordinateur du consortium", "Partenaire du projet"],
      sources: ["consortium", "ipAssignment", "confidentiality"],
      fields: [
        ...dates,
        f("project", "Nom, objectifs, périmètre et résultats attendus du projet", "Projet", "textarea"),
        f("partners", "Liste des partenaires, rôles, coordonnées et représentants habilités", "Partenaires", "textarea"),
        f("governance", "Comité, décisions, quorum, escalade et comptes rendus", "Gouvernance", "textarea"),
        f("workPackages", "Lots, responsable de lot, livrables, jalons et dépendances", "Réalisation", "textarea"),
        f("budget", "Budget par partenaire, contributions, versements et justificatifs", "Financement", "textarea"),
        f("backgroundIp", "Connaissances antérieures, logiciels, données et droits mis à disposition", "Propriété intellectuelle", "textarea"),
        f("resultsIp", "Régime d’attribution, copropriété, exploitation et licences sur les résultats", "Propriété intellectuelle", "textarea"),
        f("publication", "Règles de publication, revue préalable et protection des informations", "Diffusion", "textarea"),
        f("confidentiality", "Informations confidentielles, exceptions, durée et personnes autorisées", "Confidentialité", "textarea"),
        f("dataSecurity", "Données et mesures de sécurité ; rôles RGPD et accord séparé si nécessaire", "Données", "textarea"),
        f("liability", "Responsabilités, assurances, plafonds envisagés et exclusions à examiner", "Responsabilité", "textarea"),
        f("partnerExit", "Retrait, défaillance, remplacement, continuité et droits sur les résultats", "Sortie", "textarea"),
        f("dispute", "Procédure d’escalade et mode de règlement des différends", "Gouvernance", "textarea"),
      ],
      checks: [
        "La gouvernance, les décisions réservées, les lots et les apports de chaque partenaire sont cohérents avec le projet.",
        "Les connaissances antérieures sont identifiées séparément des résultats ; les droits d’accès et d’exploitation sont vérifiés par livrable.",
        "Le régime des aides, marchés publics, subventions, données personnelles, exportations et règles propres aux organismes publics est vérifié si pertinent.",
      ],
    },
    {
      id: "fr-research-collaboration",
      title: "Contrat de collaboration de recherche",
      family: "Innovation & partenariats",
      tag: "Apports · résultats · publications",
      description: "Cadrer une recherche collaborative : contributions, gouvernance, propriété des résultats, accès et publication.",
      roles: ["Partenaire académique", "Partenaire industriel"],
      sources: ["researchCollaboration", "consortium", "ipAssignment"],
      fields: [
        ...dates,
        f("researchSubject", "Question scientifique, objectifs, périmètre et exclusions", "Projet", "textarea"),
        f("researchPartners", "Équipes, responsables scientifiques, établissements et contacts", "Partenaires", "textarea"),
        f("researchContributions", "Personnel, équipements, données, financements et apports intellectuels de chaque partenaire", "Contributions", "textarea"),
        f("researchPlan", "Lots de travail, méthodes, calendrier, jalons et livrables", "Réalisation", "textarea"),
        f("researchGovernance", "Comité de pilotage, décisions, escalade et suivi scientifique", "Gouvernance", "textarea"),
        f("priorKnowledge", "Connaissances antérieures, titres, logiciels, savoir-faire et restrictions d’accès", "Propriété intellectuelle", "textarea"),
        f("researchResults", "Règle d’attribution selon les contributions et régime des résultats propres ou communs", "Résultats", "textarea"),
        f("researchLicenses", "Droits d’accès pour poursuivre les travaux et conditions d’exploitation des résultats", "Résultats", "textarea"),
        f("researchPublication", "Relecture des publications, délais, confidentialité et protection préalable des résultats", "Publication", "textarea"),
        f("researchData", "Jeux de données, provenance, droits, qualité, conservation et accès", "Données", "textarea"),
        f("researchEthics", "Éthique, autorisations, comité compétent, participants ou matériel réglementé le cas échéant", "Conformité", "textarea"),
        f("researchFunding", "Budget, appels à projets, aides, justificatifs et conséquences d’un financement refusé", "Financement", "textarea"),
        f("researchExit", "Arrêt, retrait, continuité, conservation des données et droits survivants", "Fin du projet", "textarea"),
      ],
      checks: [
        "Les apports et ressources sont attribués à chaque partenaire ; vérifier les règles internes et la capacité des organismes à contracter.",
        "Distinguer connaissances antérieures, résultats propres et résultats communs ; définir les droits d’accès et d’exploitation par catégorie.",
        "Vérifier les règles des financeurs, aides d’État, publications, éthique, données personnelles, sécurité et éventuels régimes sectoriels.",
      ],
    },
    {
      id: "fr-data-sharing",
      title: "Accord de partage de données entre organismes",
      family: "Données & numérique",
      tag: "Responsabilités · accès · réutilisation",
      description: "Documenter un partage de données entre organismes et répartir les tâches, contrôles, accès, durées et responsabilités.",
      roles: ["Organisme transmetteur", "Organisme destinataire"],
      sources: ["dataSharing", "privacy"],
      fields: [
        ...dates,
        f("sharingPurpose", "Finalité précise du partage et résultats attendus", "Objet du partage", "textarea"),
        f("sharingData", "Catégories de données, format, volume, fréquence et provenance", "Données", "textarea"),
        f("sharingSubjects", "Personnes concernées et données exclues du partage", "Données", "textarea"),
        f("sharingRoles", "Analyse des rôles de chaque organisme pour chaque opération : responsable distinct, conjoint ou sous-traitant", "Rôles et responsabilités", "textarea"),
        f("sharingLawfulBasis", "Base légale, compatibilité de la réutilisation, information et droits des personnes à vérifier", "Licéité et transparence", "textarea"),
        f("sharingAccess", "Utilisateurs habilités, authentification, finalités autorisées et interdiction de réidentification", "Accès et sécurité", "textarea"),
        f("sharingSecurity", "Mesures de sécurité, chiffrement, journalisation, sauvegarde et gestion des incidents", "Accès et sécurité", "textarea"),
        f("sharingIncidents", "Contacts, délai d’alerte, contenu des notifications et coopération", "Incidents", "textarea"),
        f("sharingRetention", "Durée d’accès, conservation, archivage, suppression et preuve d’effacement", "Cycle de vie", "textarea"),
        f("sharingSubsequentUse", "Réutilisations, communications ultérieures, publications et autorisations requises", "Réutilisation", "textarea"),
        f("sharingCosts", "Coûts de préparation, mise à jour, support et modalités financières", "Conditions opérationnelles", "textarea"),
        f("sharingEnd", "Suspension, retrait d’accès, restitution et continuité des traitements licites", "Fin du partage", "textarea"),
      ],
      checks: [
        "Qualifier les rôles traitement par traitement : ce document ne remplace pas un accord article 26 ou un contrat article 28 lorsqu’ils sont requis.",
        "Documenter la base légale, la compatibilité des finalités, l’information des personnes, les droits, la provenance et la qualité des données.",
        "Exclut données de santé, données pénales, transferts hors EEE et secteurs réglementés ; prévoir une analyse dédiée avant tout partage de ce type.",
      ],
    },
    {
      id: "fr-poc-services",
      title: "Contrat de pilote / preuve de concept",
      family: "Numérique & prestations",
      tag: "Périmètre limité · critères de test · sortie",
      description: "Encadrer un pilote court sans confondre évaluation, mise en production et engagement de déploiement ultérieur.",
      roles: ["Prestataire pilote", "Client testeur"],
      sources: ["cgv", "cloudClauses"],
      fields: [
        ...dates,
        f("pocSolution", "Solution, service et version testés ; éléments inclus et exclus", "Périmètre du pilote", "textarea"),
        f("pocUseCase", "Cas d’usage, utilisateurs, environnement et scénario d’évaluation", "Périmètre du pilote", "textarea"),
        f("pocDeliverables", "Livrables, accès, documentation et jalons de remise", "Réalisation", "textarea"),
        f("pocSuccess", "Critères mesurables de succès, protocole de test et modalités de constat", "Évaluation", "textarea"),
        f("pocClientDuties", "Données, accès, interlocuteurs, prérequis et coopération attendue du client", "Prérequis", "textarea"),
        f("pocData", "Données utilisées, autorisations, rôles RGPD, mesures de sécurité et environnement", "Données & sécurité", "textarea"),
        f("pocPrice", "Prix du pilote, frais, gratuité éventuelle et calendrier de facturation", "Conditions financières", "textarea"),
        f("pocIp", "Propriété des éléments préexistants, configurations, retours et développements spécifiques", "Droits", "textarea"),
        f("pocSupport", "Support, niveaux de service pendant le test, maintenance et incidents", "Exploitation", "textarea"),
        f("pocProduction", "Conditions séparées de production, renouvellement ou extension ; absence d’engagement automatique", "Après le pilote", "textarea"),
        f("pocExit", "Fin du test, désactivation des accès, restitution ou suppression des données et livrables conservés", "Après le pilote", "textarea"),
        f("pocLiability", "Assurances, responsabilités, limites envisagées et risques exclus à examiner", "Responsabilité", "textarea"),
      ],
      checks: [
        "Le pilote est borné par un objet, une durée, un environnement, des utilisateurs et des critères de sortie vérifiables.",
        "Ne pas utiliser de données réelles avant validation des droits, rôles RGPD, sécurité et obligations de confidentialité.",
        "Aucun engagement de disponibilité en production, de résultat commercial, d’achat ultérieur ou de transfert de droits n’est présumé.",
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
    case "fr-training-agreement":
      s("training-program", "Objet et programme de l’action", `L’organisme de formation réalise au bénéfice de l’entreprise l’action « ${v("trainingTitle")} ». Objectifs : ${v("objectives")}. Programme, séquences et moyens : ${v("program")}. Public et prérequis : ${v("audience")}.`, ["trainingModels"]);
      s("training-delivery", "Organisation, durée et suivi", `Période : du ${d("startDate")} au ${d("endDate")}. Modalités, lieu et accessibilité : ${v("delivery")}. Durée, dates et horaires : ${v("schedule")}. Intervenants : ${v("trainer")}. Évaluation des acquis et justificatifs d’assiduité remis : ${v("assessment")}.`);
      s("training-price", "Prix, facturation et financement", `Prix : ${m("price")} HT. Frais annexes : ${v("expenses")}. Facturation et paiement : ${v("paymentTerms")}. Financeur éventuel et conséquence d’un refus de prise en charge : ${v("funding")}. Les obligations fiscales et les règles du financeur restent à contrôler selon la situation réelle.`, ["trainingModels"]);
      s("training-cancellation", "Report, annulation et interruption", `Les parties appliquent les modalités suivantes, sous réserve des dispositions impératives et du statut du bénéficiaire : ${v("cancellation")}. Toute modification du calendrier ou du programme est documentée par écrit.`);
      break;
    case "fr-training-subcontract":
      s("training-subcontract-scope", "Périmètre pédagogique confié", `Dans le cadre de ${v("contractTitle")}, conclu le ${d("contractDate")}, le donneur d’ordre confie au sous-traitant le module suivant : ${v("module")}. Action et client final : ${v("trainingTitle")}. Période prévisionnelle : du ${d("startDate")} au ${d("endDate")}. Le sous-traitant n’excède pas ce périmètre sans accord écrit.` , ["trainingModels", "subcontract"]);
      s("training-subcontract-delivery", "Intervenants, réalisation et traçabilité", `Public et prérequis : ${v("audience")}. Intervenants : ${v("trainer")}. Modalités, lieu et calendrier : ${v("delivery")}. Le sous-traitant remet les justificatifs suivants : ${v("attendance")}. Contrôle qualité, incidents et coopération : ${v("quality")}. Les parties vérifient les exigences propres au financeur et au régime applicable.`);
      s("training-subcontract-price", "Prix et règlement", `Prix déclaré : ${m("price")} HT ; échéances et facturation : ${v("paymentTerms")}. Le traitement de la TVA, les éventuels frais et les pièces nécessaires au règlement sont vérifiés avant émission des factures.`);
      s("training-subcontract-rights", "Supports, données et exigences de statut", `Supports et droits d’utilisation : ${v("materials")}. Données des participants, confidentialité et sécurité : ${v("data")}. Vérifications déclarées : ${v("statusChecks")}. Chaque partie conserve la responsabilité de ses déclarations et justificatifs. Les obligations réglementaires ne sont pas certifiées par cette trame.`, ["trainingModels"]);
      s("training-subcontract-end", "Suspension et fin de mission", `En cas de difficulté, remplacement ou arrêt, les parties conviennent de : ${v("termination")}. Le sous-traitant remet les justificatifs et supports contractuellement prévus, sous réserve des droits applicables.`);
      break;
    case "fr-patent-license":
      s("patent-identification", "Brevet et chaîne de titularité", `Le titre visé est : ${v("patentTitle")}. Le concédant déclare la situation suivante, justificatifs à l’appui : ${v("ownership")}. Les parties vérifient les cotitulaires, sûretés, licences antérieures, annuités, inscriptions et territoire du titre. Aucune garantie de validité ou de liberté d’exploitation n’est créée par la présente trame.`, ["patentLicense"]);
      s("patent-grant", "Droits concédés et périmètre", `Le concédant autorise les actes suivants : ${v("licensedActs")}, pour le domaine : ${v("fieldOfUse")}, sur le territoire : ${v("territory")}, du ${d("startDate")} au ${d("endDate")}. Régime d’exclusivité convenu : ${v("exclusivity")}. Sous-licences et bénéficiaires autorisés : ${v("sublicense")}. Toute extension requiert un écrit.`);
      s("patent-royalties", "Redevances, comptes et vérification", `Redevance et assiette : ${v("royalty")}. Minimums garantis et avances : ${v("minimums")}. Le licencié remet les états de ventes et pièces selon les modalités suivantes : ${v("reporting")}. L’audit, la confidentialité des données commerciales et la régularisation d’écarts sont précisés avant signature.`, ["patentLicense"]);
      s("patent-operation", "Qualité, atteintes et développements", `Normes et contrôle qualité : ${v("quality")}. Notification et conduite en cas d’atteinte : ${v("infringement")}. Régime des améliorations et perfectionnements : ${v("improvements")}. Chaque partie documente les droits détenus sur ses contributions.`);
      s("patent-end", "Formalités et fin de licence", `Inscriptions, taxes et coûts : ${v("registration")}. Durée, renouvellement, résiliation et sort des stocks ou sous-licences : ${v("termination")}. Les parties vérifient les formalités d’inscription au registre compétent et les effets de la fin sur les tiers.`, ["patentLicense"]);
      break;
    case "fr-cgv-b2b-services":
      s("cgv-scope", "Champ d’application et hiérarchie contractuelle", `Ces conditions sont destinées à une relation entre professionnels pour les prestations suivantes : ${v("service")}. La commande, le devis et les conditions particulières s’articulent selon la règle suivante : ${v("orderProcess")}. Le client déclare contracter pour les besoins de son activité professionnelle.`, ["cgv"]);
      s("cgv-order", "Commande et prix", `Barème HT, unités, frais, remises et durée de validité : ${v("pricing")}. La commande est formée et acceptée selon : ${v("orderProcess")}. Toute dérogation aux présentes est identifiée par écrit dans les conditions particulières acceptées par les parties.`);
      s("cgv-execution", "Exécution et réclamations", `Délais, dépendances et réception : ${v("delivery")}. Les réclamations et corrections sont traitées selon : ${v("complaint")}. Les garanties applicables et leur portée sont décrites comme suit, sous réserve des garanties légales : ${v("warranty")}.`);
      s("cgv-payment", "Facturation et retard de paiement", `Rythme de facturation : ${v("invoiceType")}. Délai convenu : ${v("paymentDays")} jours, sous réserve des plafonds et régimes spéciaux applicables. Pénalités de retard : ${v("lateInterest")}. Indemnité forfaitaire de recouvrement : ${v("recoveryFee")}. Escompte : ${v("discount")}. Les taux, délais et montants sont à contrôler à la date de communication et selon la nature de chaque opération.`, ["payment", "recovery"]);
      s("cgv-data", "Données, durée et fin de la relation", `Traitements de données éventuels : ${v("personalData")}. Durée, renouvellement, suspension et résiliation : ${v("termination")}. Si un traitement est effectué pour le compte du client, une annexe dédiée doit préciser les obligations et instructions applicables.`, ["cgv", "privacy"]);
      break;
    case "fr-consortium-digital":
      s("consortium-project", "Projet et partenaires", `Les partenaires organisent le projet « ${v("project")} ». Les partenaires et leurs représentants sont décrits ainsi : ${v("partners")}. Le projet est prévu du ${d("startDate")} au ${d("endDate")}. Chaque partenaire confirme ses pouvoirs et ses engagements propres, à documenter avant signature.`, ["consortium"]);
      s("consortium-governance", "Gouvernance et décisions", `Le pilotage, les décisions, les règles de quorum, l’escalade et les comptes rendus sont organisés ainsi : ${v("governance")}. Les partenaires consignent les décisions qui modifient le périmètre, les coûts ou les livrables.`);
      s("consortium-work", "Lots, jalons et financement", `Lots, responsabilités, livrables et dépendances : ${v("workPackages")}. Budget, contributions, versements et justificatifs : ${v("budget")}. Les écarts au calendrier et au budget font l’objet d’une décision documentée des partenaires.`);
      s("consortium-ip", "Connaissances antérieures et résultats", `Connaissances antérieures et droits d’accès : ${v("backgroundIp")}. Attribution, copropriété et exploitation des résultats : ${v("resultsIp")}. Les parties établissent des annexes par actif ou livrable et vérifient les droits des salariés, auteurs, sous-traitants et financeurs avant toute exploitation.`, ["consortium", "ipAssignment"]);
      s("consortium-publication", "Publication et confidentialité", `Règles de revue préalable et de publication : ${v("publication")}. Informations protégées, exceptions, durée et personnes autorisées : ${v("confidentiality")}. Toute publication est coordonnée avec la protection préalable des résultats et les obligations des financeurs.`, ["consortium", "confidentiality"]);
      s("consortium-data", "Données, sécurité et responsabilité", `Données et mesures de sécurité convenues : ${v("dataSecurity")}. Les rôles de responsable et sous-traitant, les transferts et les accords requis sont déterminés séparément au regard des traitements réels. Responsabilités, assurances et plafonds envisagés : ${v("liability")}.`);
      s("consortium-exit", "Retrait, défaillance et différends", `Retrait, remplacement, continuité et droits sur les résultats : ${v("partnerExit")}. Escalade et règlement des différends : ${v("dispute")}. Les droits acquis, financements, matériels et obligations survivantes sont traités dans un plan de sortie adapté.`);
      break;
    case "fr-research-collaboration":
      s("research-object", "Objet scientifique, partenaires et durée", `Les partenaires conduisent le projet suivant : ${v("researchSubject")}. Équipes et responsables : ${v("researchPartners")}. La période envisagée court du ${d("startDate")} au ${d("endDate")}. Le périmètre, les exclusions et les autorisations nécessaires sont arrêtés avant le démarrage.`, ["researchCollaboration"]);
      s("research-inputs", "Contributions, plan de travail et gouvernance", `Apports en personnel, équipements, données, financements et savoir-faire : ${v("researchContributions")}. Lots, méthodes, calendrier et livrables : ${v("researchPlan")}. Pilotage, décisions et suivi : ${v("researchGovernance")}. Chaque partie suit ses coûts et signale les écarts affectant le projet.`);
      s("research-background", "Connaissances antérieures et accès", `Les connaissances, titres et restrictions apportés sont identifiés comme suit : ${v("priorKnowledge")}. Les droits d’accès sont limités aux besoins du projet et ne valent ni cession ni licence d’exploitation, sauf stipulation distincte et précise.`, ["researchCollaboration", "ipAssignment"]);
      s("research-results", "Résultats et droits d’exploitation", `L’attribution des résultats propres ou communs est organisée ainsi : ${v("researchResults")}. Les droits nécessaires à la poursuite des travaux et à l’exploitation sont définis par catégorie : ${v("researchLicenses")}. La contribution effective, les droits des personnels, les logiciels tiers et les obligations des financeurs doivent être documentés avant toute exploitation.`, ["researchCollaboration", "ipAssignment"]);
      s("research-publication", "Publications et protection", `Les règles de revue et de publication sont les suivantes : ${v("researchPublication")}. Elles doivent permettre la vérification des informations confidentielles et la protection des résultats sans créer de blocage indéfini à la publication scientifique.`, ["researchCollaboration", "confidentiality"]);
      s("research-data", "Données, éthique et financement", `Données, provenance, conservation et accès : ${v("researchData")}. Autorisations et exigences éthiques : ${v("researchEthics")}. Budget, aides et conséquences d’un financement refusé : ${v("researchFunding")}. Les bases légales, accords de données, règles de sécurité et autorisations réglementaires sont examinés séparément selon le projet.`, ["privacy"]);
      s("research-end", "Arrêt du projet et obligations survivantes", `Les modalités de retrait ou d’arrêt, la continuité et le sort des données sont : ${v("researchExit")}. Les droits acquis, obligations de confidentialité, règles d’archivage et engagements envers les financeurs survivent dans la mesure prévue par les accords applicables.`);
      break;
    case "fr-data-sharing":
      s("sharing-purpose", "Objet, périmètre et durée du partage", `Le partage poursuit la finalité suivante : ${v("sharingPurpose")}. Données, format, volume, fréquence et provenance : ${v("sharingData")}. Personnes concernées et exclusions : ${v("sharingSubjects")}. Le partage est limité à la période du ${d("startDate")} au ${d("endDate")} et aux usages convenus.`, ["dataSharing"]);
      s("sharing-roles", "Rôles, licéité et information", `Qualification des rôles pour chaque opération : ${v("sharingRoles")}. Base légale, compatibilité des finalités, information et exercice des droits à vérifier : ${v("sharingLawfulBasis")}. Les parties ne présument pas que la seule signature de cet accord rend le partage licite. Si elles déterminent conjointement les finalités et moyens, elles concluent et mettent à disposition l’accord requis ; si l’une agit sur instruction de l’autre, elles utilisent un encadrement de sous-traitance adapté.`, ["dataSharing", "privacy"]);
      s("sharing-access", "Accès, sécurité et incidents", `Accès et usages autorisés : ${v("sharingAccess")}. Mesures de sécurité : ${v("sharingSecurity")}. Procédure de signalement et coopération : ${v("sharingIncidents")}. Chaque organisme maintient les mesures relevant de son périmètre et conserve les traces utiles à l’audit et à la gestion des incidents.`);
      s("sharing-retention", "Conservation, réutilisation et coûts", `Conservation, archivage et effacement : ${v("sharingRetention")}. Réutilisations, communications et publications : ${v("sharingSubsequentUse")}. Coûts de préparation et de mise à jour : ${v("sharingCosts")}. Toute nouvelle finalité ou communication à un tiers exige une analyse et, le cas échéant, un accord documenté préalable.`);
      s("sharing-end", "Suspension, fin et responsabilités", `Suspension, retrait d’accès et restitution ou suppression : ${v("sharingEnd")}. Chaque partie vérifie les responsabilités, assurances, voies d’exercice des droits et obligations réglementaires qui lui sont applicables. Les données ne sont pas transférées hors EEE ni utilisées pour des catégories exclues par la présente trame.`);
      break;
    case "fr-poc-services":
      s("poc-scope", "Objet, environnement et durée du pilote", `Le pilote porte sur ${v("pocSolution")}. Cas d’usage, utilisateurs et environnement : ${v("pocUseCase")}. Il se déroule du ${d("startDate")} au ${d("endDate")}. Toute extension du périmètre ou accès à la production nécessite un accord écrit distinct.`, ["cgv"]);
      s("poc-delivery", "Livrables, prérequis et évaluation", `Livrables et jalons : ${v("pocDeliverables")}. Le client fournit les prérequis suivants : ${v("pocClientDuties")}. Les parties évaluent le pilote selon les critères et le protocole suivants : ${v("pocSuccess")}. Les résultats sont consignés dans un compte rendu contradictoire ; aucune recette ou acceptation non définie n’est présumée.`);
      s("poc-data", "Données et sécurité du test", `Données et conditions d’accès : ${v("pocData")}. Aucune donnée réelle n’est chargée avant validation des droits, de la sécurité, de l’information des personnes et de la qualification des rôles. Si un traitement pour compte d’autrui existe, un accord distinct conforme au régime applicable est requis.`, ["cloudClauses", "privacy"]);
      s("poc-commercial", "Prix, support et propriété intellectuelle", `Prix, frais et facturation : ${v("pocPrice")}. Support et incidents : ${v("pocSupport")}. Droits sur les éléments préexistants, retours et développements : ${v("pocIp")}. Chaque licence ou cession doit identifier ses droits, usages, durée, territoire et rémunération lorsqu’elle est nécessaire.`);
      s("poc-next-step", "Après le pilote, responsabilité et sortie", `Un déploiement, abonnement ou engagement d’achat fera l’objet d’un contrat ultérieur et de ses annexes : ${v("pocProduction")}. À la fin, les accès, données et livrables sont traités ainsi : ${v("pocExit")}. Responsabilités, assurances et limites envisagées : ${v("pocLiability")}. Les limitations restent soumises aux règles impératives et à une analyse du contrat complet.`, ["cgv", "essential"]);
      break;
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
