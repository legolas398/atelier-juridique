export const common = {
  jurisdiction: "FR",
  scope: "b2b",
  p1name: "Aster Fictif",
  p1form: "SAS",
  p1siren: "123456789",
  p1address: "1 rue Exemple, Paris",
  p1representative: "Alice Exemple",
  p1capacity: "Présidente",
  p2name: "Rivage Fictif",
  p2form: "SARL",
  p2siren: "987654321",
  p2address: "2 rue Exemple, Lyon",
  p2representative: "Paul Exemple",
  p2capacity: "Gérant",
  signDate: "2026-10-18",
  signCity: "Paris",
};
const dates = { startDate: "2026-11-01", endDate: "2026-12-31" };
const price = {
  price: "1200,25",
  taxTerms: "TVA 20 %, 240,05 euros ; total TTC 1 440,30 euros.",
  paymentTerms:
    "Facture unique à la livraison, paiement à trente jours de son émission. Mentions légales et pénalités annexées au bon de commande fictif.",
};
const initial = {
  contractTitle: "Contrat fictif ATLAS-2026",
  contractDate: "2026-01-01",
};
export const fixtures = {
  "fr-dpa": {
    ...dates,
    service: "Hébergement du registre de contacts du projet fictif Atlas.",
    operations:
      "Stockage, consultation et suppression sur instruction pour le suivi du projet.",
    dataCategories:
      "Noms professionnels et coordonnées ; aucune donnée sensible.",
    subjects: "Salariés affectés au projet Atlas.",
    instructions:
      "Demandes écrites du DPO et du responsable de projet, consignées dans le registre.",
    locations: "Paris et Lyon, France ; aucun accès distant hors EEE.",
    security:
      "Accès nominatifs avec MFA, chiffrement au repos et en transit, sauvegardes quotidiennes, journalisation et tests trimestriels de restauration.",
    subprocessors: "Aucun sous-traitant ultérieur au démarrage.",
    authorization: "general",
    objectionDays: "30",
    incidentContact:
      "DPO du responsable, par le canal sécurisé prévu à l’annexe de contact.",
    assistance:
      "Transmission sécurisée des demandes au DPO, assistance aux extractions, AIPD et analyses de sécurité.",
    audit:
      "Rapport annuel et audit sur préavis raisonnable ; accès urgent préservé en cas d’incident.",
    returnChoice: "return",
    returnDays: "30",
  },
  "fr-saas": {
    ...dates,
    ...price,
    service:
      "Application fictive Atlas de suivi des dossiers, documentation v1 jointe.",
    users: "Dix comptes nominatifs, accès interne uniquement, espace de 10 Go.",
    availability:
      "99,5 % par mois, mesurée sur les sondes documentées ; maintenance annoncée 48 heures avant, hors indisponibilité imputable au client démontrée.",
    support:
      "Jours ouvrés 9 h–18 h ; incident critique pris en charge en une heure.",
    remedies:
      "Plan correctif écrit ; crédits contractuels à négocier selon le barème annexé ; résiliation si manquement persistant après mise en demeure.",
    hosting:
      "Paris et Lyon ; MFA, sauvegarde quotidienne, chiffrement des données.",
    dpaText:
      "Annexe article 28 spécifique au service Atlas : catégories de données, finalités, personnes, sécurité, instructions, lieux, sous-traitants, assistance, audit et sortie sont décrits dans l’accord fictif joint et vérifiés séparément.",
    exitPlan:
      "Export CSV et ZIP dans les trente jours de la fin, assistance de migration convenue par devis préalable et suppression documentée après restitution.",
    liabilityCap: "10000",
  },
  "fr-maintenance": {
    ...dates,
    ...price,
    assets: "Dix postes Atlas v1, inventaire et sites de Paris joints.",
    services:
      "Correctifs de sécurité et vérification mensuelle ; extensions fonctionnelles exclues.",
    support:
      "Canal tickets, jours ouvrés 9 h–18 h ; prise en charge critique en une heure et objectif de rétablissement à quatre heures.",
    access:
      "Accès nominatif validé ; sauvegarde confirmée par le client avant intervention.",
    changes:
      "Validation sur environnement de test puis accord écrit pour mise en production ; retour arrière documenté.",
    security:
      "Accès privilégiés tracés, engagements de confidentialité et DPA adapté joint avant accès aux données.",
    exitPlan:
      "Transmission sécurisée des tickets et procédures dans les quinze jours suivant la fin.",
  },
  "fr-subcontracting": {
    ...dates,
    ...price,
    mainContract:
      "Mission Atlas entre Aster et le client final fictif Cobalt ; annexes pertinentes communiquées.",
    mission:
      "Réalisation d’un audit informatique ; rapport version PDF, hors BTP et activité réglementée.",
    acceptance:
      "Acceptation et agrément des conditions de paiement obtenus du client final par écrit joint.",
    paymentSecurity:
      "Délégation de paiement nominative et acceptée, justificatif fictif joint.",
    approvalConfirmed: "yes",
    delivery:
      "Rapport remis au plus tard le 15 décembre, dix jours de vérification et correction des réserves motivées.",
    independence:
      "Équipe autonome du sous-traitant ; documents de vigilance vérifiés avant la mission et selon le régime applicable.",
    rights:
      "Licence interne sur le rapport uniquement ; aucune cession générale ; confidentialité et annexe RGPD jointes si nécessaire.",
  },
  "fr-license": {
    ...dates,
    ...price,
    software:
      "Logiciel fictif Atlas v1 et documentation, dépendances listées à l’annexe.",
    uses: "Installation sur dix postes et usage interne, sans distribution ni sous-licence.",
    territory: "France métropolitaine.",
    delivery:
      "Téléchargement sécurisé, clés nominatives et recette sur scénario documenté.",
    support:
      "Mises à jour correctives incluses pendant la durée ; support jours ouvrés.",
    warranty:
      "Conformité aux fonctions décrites ; notification écrite et correction dans le délai convenu selon criticité.",
    rightsChain:
      "Droits du concédant et autorisations des composants tiers établis par l’inventaire fictif annexé.",
    exitPlan:
      "Export des données avant expiration, suppression du logiciel et attestation ; copies légalement permises préservées.",
  },
  "fr-ip-assignment": {
    work: "Illustration existante Atlas 01, fichier atlas01.svg et aperçu daté joints.",
    rightsChain:
      "Chaîne des contrats avec l’auteur et autorisations des tiers vérifiées sur pièces fictives.",
    chainConfirmed: "yes",
    rights:
      "Droit de reproduction sur les brochures ; droit de représentation sur le seul site vitrine identifié.",
    uses: "Brochures institutionnelles imprimées et présentation du projet Atlas sur atlas.example.",
    territory:
      "France pour les brochures ; accès mondial au seul site institutionnel.",
    term: "Cinq années à compter de la signature pour chacun des droits énumérés.",
    remuneration:
      "Rémunération proportionnelle définie au bordereau : assiette, taux de 5 %, relevé semestriel et paiement sous trente jours ; régime et adéquation revus par le conseil fictif.",
    delivery: "Fichier SVG et PNG remis à la signature par canal sécurisé.",
    thirdParty:
      "Police de caractères exclue et sous licence distincte ; crédit auteur mentionné dans les conditions convenues.",
  },
  "fr-loi": {
    ...dates,
    project: "Étudier une coopération commerciale fictive Atlas.",
    outline:
      "Volume indicatif de cent unités ; prix et calendrier restant à négocier.",
    conditions:
      "Audit, validation budgétaire et autorisation des organes compétents.",
    process:
      "Atelier de cadrage et remise d’un projet contractuel avant fin novembre.",
    information:
      "Notes techniques identifiées confidentielles ; accès limité aux équipes du projet et conseils liés par confidentialité.",
    confidentialYears: "3",
    costs:
      "Chaque partie supporte ses propres frais de négociation et de conseil.",
  },
  "fr-termination": {
    ...initial,
    effectiveDate: "2026-12-31",
    reason: "Fin commune du projet pilote, sans différend déclaré.",
    settlement:
      "Facture finale de 600 euros HT ; acompte déduit de 100 euros ; TVA et date de paiement vérifiées sur facture jointe.",
    handover:
      "Restitution des équipements et export du dossier dans les quinze jours.",
    survival:
      "Confidentialité de l’article 7 pendant trois ans ; droits sur le rapport selon l’article 8.",
    reserved:
      "Les créances non listées et les droits des tiers sont réservés ; aucune quittance générale.",
  },
  "fr-notice-termination": {
    ...initial,
    effectiveDate: "2026-12-31",
    clause:
      "Article 6 : notification écrite reçue au moins trente jours calendaires avant l’échéance.",
    noticeDays: "30",
    receiptDate: "2026-10-25",
    delivery:
      "Lettre recommandée avec accusé de réception ; suivi de la remise effective.",
    relationship:
      "Relation de neuf mois, sans exclusivité ni dépendance identifiée après analyse fictive.",
    noticeReviewed: "yes",
    handover:
      "Exécution normale jusqu’à l’échéance, puis restitution des supports et apurement contradictoire.",
  },
  "fr-payment-plan": {
    debtBasis:
      "Facture fictive FA-01, prestation remise et acceptée, décompte contradictoire annexé.",
    dueDate: "2026-09-01",
    principal: "100,01",
    installments: "3",
    firstPaymentDate: "2026-10-31",
    paymentMethod:
      "Virement sur le compte validé par le canal indépendant convenu.",
    accessories:
      "Aucun accessoire n’est abandonné implicitement ; leur régime et décompte sont réservés à un relevé distinct.",
    defaultDays: "15",
    dispute: "yes",
  },
  "fr-acceptance": {
    ...initial,
    deliveryDate: "2026-10-15",
    tested: "Rapport Atlas v1 PDF, empreinte et liste de tests annexées.",
    criteria:
      "Conformité des dix scénarios au cahier des charges ; preuves et résultats joints.",
    decision: "reserved",
    reservations:
      "La page 12 doit être corrigée : légende de graphique manquante.",
    remediation:
      "Correction par Aster avant le 25 octobre ; contre-test du client le 26 octobre.",
    financialEffects:
      "Facturation selon l’article 5 du contrat ; réserves maintenues jusqu’à levée expresse.",
  },
  "fr-loan-equipment": {
    ...dates,
    equipment:
      "Ordinateur fictif Atlas-01, numéro de série TEST-001, chargeur et état joint.",
    use: "Démonstration interne du projet Atlas sur le site de Paris ; utilisateurs nominatifs.",
    handover:
      "Remise contre bordereau le premier jour, transport assuré par le prêteur.",
    maintenance:
      "Entretien ordinaire par l’emprunteur ; dépenses exceptionnelles soumises au régime légal et information préalable.",
    insurance:
      "Attestation couvrant garde, transport et dommages accidentels vérifiée avant remise.",
    return:
      "Retour au site de Paris au terme convenu, état contradictoire et contrôle des accessoires.",
  },
  "fr-training-agreement": {
    ...dates,
    trainingTitle: "Formation sécurité numérique Atlas",
    objectives: "Appliquer la procédure interne de signalement des incidents.",
    program: "Séquences sur les accès, les alertes et les exercices pratiques ; supports remis en annexe.",
    audience: "Douze salariés du service opérations ; inscription par l’entreprise après vérification des prérequis.",
    trainer: "Formatrice désignée par l’organisme ; remplacement après information du client.",
    delivery: "Présentiel à Lyon, salle accessible et matériel fourni par l’organisme.",
    schedule: "14 heures sur les 10 et 11 novembre 2026, de 9 h à 17 h.",
    assessment: "Quiz initial et final, feuille d’émargement et attestation individuelle de fin de formation.",
    price: "2400",
    expenses: "Déplacements inclus dans le prix ; aucun frais additionnel sans accord écrit.",
    paymentTerms: "Facture à la fin de l’action, paiement à trente jours.",
    cancellation: "Report convenu par écrit ; les conséquences financières sont déterminées selon le statut et le régime applicable.",
    funding: "Financement direct par l’entreprise ; aucun accord de prise en charge déclaré.",
  },
  "fr-training-subcontract": {
    contractTitle: "Contrat fictif Atlas Formation",
    contractDate: "2026-01-01",
    ...dates,
    trainingTitle: "Parcours sécurité numérique Atlas pour le client final Rivage",
    module: "Deux séquences sur les accès et la réponse aux incidents, avec exercices et supports remis.",
    audience: "Douze salariés du client final ayant suivi le module préalable.",
    trainer: "Camille Formatrice, qualification et CV transmis avant intervention ; remplacement après validation écrite.",
    delivery: "Présentiel à Lyon les 10 et 11 novembre ; salle et supports selon annexe.",
    attendance: "Émargements par demi-journée, évaluations et attestations transmises sous cinq jours ouvrés.",
    quality: "Revue des résultats avec le donneur d’ordre, remontée des incidents le jour même et traitement documenté des réclamations.",
    price: "1500",
    paymentTerms: "Facturation après remise des justificatifs, paiement à trente jours.",
    materials: "Supports fournis en licence d’usage interne pour les participants inscrits ; pas de redistribution externe.",
    data: "Liste de participants transmise par canal sécurisé, accès limité à l’équipe pédagogique et suppression après la période convenue.",
    statusChecks: "Numéro de déclaration d’activité et exigences du financeur transmis pour vérification avant la session.",
    termination: "En cas d’indisponibilité, remplacement proposé sous cinq jours ou report écrit ; justificatifs des séances déjà réalisées conservés.",
  },
  "fr-patent-license": {
    ...dates,
    patentTitle: "Brevet fictif FR-TEST-2026-01, dispositif Atlas ; statut et échéance à vérifier au registre.",
    ownership: "Extrait du registre, chaîne de cession, cotitulaires, sûretés et licences antérieures à vérifier avant signature.",
    licensedActs: "Fabriquer, utiliser, offrir et vendre les produits couverts ; importation limitée aux pays listés.",
    fieldOfUse: "Capteurs industriels de la gamme Atlas ; applications médicales exclues.",
    territory: "France et Belgique, sous réserve de la couverture et du statut du titre dans chaque pays.",
    exclusivity: "nonexclusive",
    sublicense: "Sous-licence au distributeur Rivage après notification écrite et engagement aux mêmes limites.",
    royalty: "4 % du chiffre d’affaires net des produits couverts, défini hors taxes et retours documentés.",
    minimums: "Avance de 5 000 euros imputable sur les redevances de la première année ; aucun minimum garanti ultérieur.",
    reporting: "État trimestriel par produit et pays, pièces conservées cinq ans et audit annuel par un expert indépendant tenu au secret.",
    improvements: "Chaque partie conserve ses développements ; toute copropriété ou licence croisée fera l’objet d’un accord séparé.",
    infringement: "Notification rapide, conservation des preuves et décision sur l’action après concertation écrite.",
    quality: "Contrôle selon le cahier qualité Atlas annexé et mention du brevet seulement tant que le titre demeure en vigueur.",
    registration: "Formalités d’inscription réparties par accord écrit ; taxes de maintien à la charge du titulaire sauf convention contraire.",
    termination: "Durée jusqu’au terme indiqué, résiliation après mise en demeure contractuelle et écoulement du délai convenu ; sort des stocks à préciser.",
  },
  "fr-cgv-b2b-services": {
    service: "Conseil et accompagnement technique de déploiement, hors fourniture de matériel.",
    orderProcess: "Devis signé par le client professionnel ; en cas de divergence, conditions particulières signées puis devis puis présentes CGV.",
    pricing: "Barème de 950 euros HT par journée, frais de déplacement sur justificatifs, prix valables trente jours.",
    delivery: "Démarrage sous dix jours après accès aux environnements ; réception selon le compte rendu de recette accepté.",
    invoiceType: "completion",
    paymentDays: "30",
    lateInterest: "Taux indiqué sur chaque facture et au moins égal au minimum prévu par les textes applicables à la date d’émission.",
    recoveryFee: "40 euros lorsque l’indemnité forfaitaire légale est applicable.",
    discount: "Aucun escompte pour paiement anticipé.",
    warranty: "Obligations et garanties déterminées par le contrat particulier et les textes applicables ; aucun résultat non défini n’est promis.",
    complaint: "Réclamation motivée par écrit avec les éléments de preuve ; réunion de suivi et plan correctif convenu selon le contrat.",
    personalData: "Si le prestataire traite des données pour le compte du client, conclure une annexe conforme au rôle et au traitement avant l’accès.",
    termination: "Contrat particulier à durée déterminée ; suspension ou résiliation selon ses stipulations et les règles impératives.",
  },
  "fr-consortium-digital": {
    project: "Prototype Atlas de recherche documentaire",
    partners: "Aster Fictif pilote ; Boréal Fictif fournit l’indexation ; les représentants et pouvoirs seront justifiés.",
    governance: "Comité mensuel, décisions budgétaires à l’unanimité, compte rendu sous cinq jours et escalade aux directions après blocage.",
    workPackages: "Lot 1 cadrage par Aster ; lot 2 index par Boréal ; démonstrateur commun au mois six, dépendant des jeux de données autorisés.",
    budget: "Aster 60 000 euros ; Boréal 40 000 euros ; apports en nature détaillés en annexe ; versements trimestriels sur justificatifs.",
    backgroundIp: "Aster apporte ses corpus autorisés et méthodes ; Boréal son moteur d’indexation préexistant ; aucune cession implicite.",
    resultsIp: "Chaque résultat est inventorié par livrable ; droits d’accès nécessaires au projet puis conditions d’exploitation commerciale à définir par écrit avant usage.",
    publication: "Revue par les partenaires avec préavis de trente jours pour protéger les informations confidentielles et déposer les titres utiles.",
    confidentiality: "Informations identifiées comme confidentielles, hors informations publiques ou déjà connues ; accès limité aux équipes du projet pendant cinq ans.",
    dataSecurity: "Données synthétiques au prototype ; accès nominatif, chiffrement au repos et journalisation ; rôles RGPD et éventuelle sous-traitance à formaliser selon les données réelles.",
    liability: "Assurance RC professionnelle déclarée par chaque partenaire ; plafond et exclusions à négocier en tenant compte des obligations essentielles et dommages concernés.",
    partnerExit: "Mise en demeure et délai de remède de trente jours ; continuité des lots critiques, restitution des accès et maintien des licences nécessaires à l’achèvement.",
    dispute: "Escalade entre responsables de lots, puis dirigeants ; médiation envisagée avant toute action judiciaire, sans renonciation aux mesures urgentes.",
  },
  "fr-research-collaboration": {
    researchSubject: "Évaluer la robustesse d’un index documentaire multilingue sur des corpus ouverts et synthétiques ; exclure toute donnée confidentielle de tiers.",
    researchPartners: "Équipe Aster Conseil pilotée par la directrice R&D ; laboratoire Boréal représenté par son directeur d’unité ; pouvoirs et procédures internes à joindre.",
    researchContributions: "Aster apporte 0,5 ETP d’ingénieur et un environnement de test ; Boréal apporte 0,3 ETP chercheur et méthodes d’évaluation ; financement réparti selon l’annexe budgétaire.",
    researchPlan: "Lot 1 protocole et jeux synthétiques ; lot 2 expérimentation ; lot 3 rapport reproductible ; jalons mensuels et dépôt des résultats versionnés.",
    researchGovernance: "Comité trimestriel avec responsables scientifiques ; décisions à l’unanimité sur périmètre et publication ; désaccord escaladé aux directions sous quinze jours.",
    priorKnowledge: "Aster conserve son code d’indexation antérieur ; Boréal son protocole expérimental et ses méthodes ; inventaire signé en annexe avant le début.",
    researchResults: "Résultats attribués aux auteurs et inventeurs selon leurs contributions ; résultats autonomes conservés par leur producteur ; résultats réellement communs documentés séparément.",
    researchLicenses: "Licence non exclusive nécessaire pour reproduire et vérifier les résultats ; exploitation commerciale ultérieure soumise à un accord spécifique et aux droits des tiers.",
    researchPublication: "Relecture sous trente jours ; délai supplémentaire uniquement pour déposer un titre ou retirer les informations confidentielles, sans veto scientifique permanent.",
    researchData: "Corpus synthétiques documentés, versionnés et conservés cinq ans ; accès restreint aux équipes nommées ; aucun corpus de tiers sans preuve de droits.",
    researchEthics: "Pas de participant ni de donnée personnelle prévu ; toute évolution soumise avant collecte aux autorisations et avis éthiques applicables.",
    researchFunding: "Budget plafonné à 120 000 euros HT en contributions déclarées ; versements trimestriels sur justificatifs ; financement externe conditionnel à un avenant.",
    researchExit: "Arrêt possible après comité et préavis de trente jours ; remise des livrables réalisés, clôture budgétaire et maintien des licences nécessaires à la vérification.",
  },
  "fr-data-sharing": {
    sharingPurpose: "Analyser des indicateurs agrégés de disponibilité de services pour améliorer leur planification ; aucune décision individuelle automatisée.",
    sharingData: "Comptages hebdomadaires agrégés et code de service pseudonymisé, transmis par API sécurisée chaque lundi ; source et contrôles de qualité décrits en annexe.",
    sharingSubjects: "Aucune donnée directement identifiante ; exclure coordonnées, données sensibles et tout champ permettant une réidentification raisonnable.",
    sharingRoles: "Chaque organisme détermine séparément les finalités de ses traitements ; vérifier en pratique toute décision commune des finalités ou moyens avant activation.",
    sharingLawfulBasis: "Chaque partie documente sa base légale, la compatibilité de la réutilisation, les notices, droits des personnes et éventuelle pseudonymisation avant transmission.",
    sharingAccess: "Accès nominatif aux deux analystes désignés ; authentification forte ; interdiction de réidentifier ou de rapprocher les données à d’autres fichiers.",
    sharingSecurity: "Chiffrement en transit et au repos, journaux d’accès revus mensuellement, sauvegarde chiffrée et revue annuelle des habilitations.",
    sharingIncidents: "Alerte réciproque sans délai injustifié au contact sécurité ; description des données, impacts, mesures et coopération à l’analyse.",
    sharingRetention: "Données brutes supprimées à la fin du projet ou au plus tard douze mois après collecte ; agrégats anonymes vérifiés conservés trois ans.",
    sharingSubsequentUse: "Toute nouvelle finalité, publication ou communication externe fait l’objet d’une analyse de licéité, d’une vérification de l’anonymisation et d’un accord écrit.",
    sharingCosts: "Chaque partie supporte ses coûts internes ; évolutions d’API et extractions supplémentaires chiffrées puis acceptées par écrit.",
    sharingEnd: "À la fin, désactivation des accès, suppression des données brutes, certificat d’effacement et conservation limitée des preuves d’audit.",
  },
  "fr-poc-services": {
    pocSolution: "Version 0.9 du module de recherche d’archives, hébergée dans un espace isolé de démonstration ; fonctionnalités exclues listées dans l’annexe technique.",
    pocUseCase: "Cinq utilisateurs nommés testent deux scénarios sur un corpus synthétique de 200 fichiers dans un environnement sans connexion au système de production.",
    pocDeliverables: "Accès de test pour six semaines, guide de prise en main, journal des incidents et rapport final des résultats.",
    pocSuccess: "Mesurer le taux de récupération des 30 documents étalons, latence médiane inférieure à cinq secondes et absence de défaut critique sur les scénarios convenus.",
    pocClientDuties: "Le client nomme un responsable, fournit les comptes de test, exécute les scénarios et transmet les incidents reproductibles sous deux jours ouvrés.",
    pocData: "Corpus synthétique sans données personnelles ni secrets d’affaires ; accès par comptes individuels, chiffrement en transit et journalisation activée.",
    pocPrice: "Forfait pilote de 3 000 euros HT, facturé à la mise à disposition ; déplacements éventuels sur devis accepté avant engagement.",
    pocIp: "Chaque partie conserve ses éléments préexistants ; les retours peuvent être utilisés pour améliorer le service sans divulguer d’informations confidentielles ; développements spécifiques exclus.",
    pocSupport: "Support jours ouvrés sous un jour ouvré pour défaut bloquant, sous trois jours pour autre incident ; disponibilité de démonstration sans garantie de production.",
    pocProduction: "Toute mise en production, licence, SLA, assistance continue ou achat ultérieur nécessite une proposition et un contrat distincts, sans renouvellement automatique.",
    pocExit: "À la fin des six semaines, accès désactivés sous deux jours, corpus supprimé sous trente jours et rapport remis aux deux parties.",
    pocLiability: "Chaque partie maintient son assurance professionnelle ; plafonds et exclusions restent à négocier selon les risques, la valeur du pilote et les règles impératives.",
  },
};
