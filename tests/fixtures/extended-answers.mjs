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
};
