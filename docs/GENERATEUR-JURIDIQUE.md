# Générateur de contrats et de documents

Ajout du 18 octobre 2026. Accessible dans le menu **Générateur juridique** de chaque dossier. Les documents existants, notes et revues sont conservés.

## Parcours

1. Choisir un modèle ou importer un modèle de cabinet.
2. Renseigner le questionnaire par thèmes : parties, contexte, dates, mission et conditions spécifiques.
3. Générer un projet. Les champs manquants restent matérialisés ; les contrôles présentent les erreurs bloquantes et les points de vigilance.
4. Lire et, si nécessaire, modifier chaque clause. Vérifier et enregistrer pour recalculer les contrôles. Les modifications manuelles sont identifiées ; leur sens juridique n'est pas validé par un algorithme.
5. Consulter les références, puis cocher chaque clause relue et les points propres au modèle. Renseigner le nom et la qualité déclarés du relecteur.
6. Enregistrer la relecture de cette révision, puis exporter la version relue en Word. Un export de projet reste possible avant cela et porte la mention **PROJET — À COMPLÉTER ET RELIRE**.

Une modification remet le document au statut projet et conserve la révision précédente, y compris sa relecture. Les modifications non enregistrées sont sauvegardées lors d'une navigation interne ; fermer la fenêtre signale les changements non sauvegardés. Régénérer depuis les réponses demande une confirmation si des clauses ont été corrigées manuellement.

## Modèles proposés et portée

La bibliothèque comporte désormais **24 trames indépendantes**, recherchables par mot et filtrables par famille. Chaque trame dispose de champs et de contrôles propres. Les rôles des deux parties sont affichés dans le questionnaire.

| Nouvelle trame | Éléments spécifiques et contrôles |
| --- | --- |
| Accord de sous-traitance RGPD | Opérations, personnes, données, instructions, sécurité, lieux, sous-traitants, assistance, audit et sortie ; périmètre EEE déclaré, hors transferts internationaux. |
| Abonnement SaaS | Utilisateurs, SLA, support, remèdes, hébergement, annexe données, réversibilité et plafond ; annexe trop courte bloquante, examen distinct du règlement sur les données signalé. |
| Maintenance informatique | Inventaire, versions, prestations incluses/exclues, délais, sauvegardes, accès, changements et transfert des tickets. |
| Sous-traitance de prestations | Contrat principal, mission, acceptation et agrément, garantie de paiement, autonomie ; formalités non confirmées bloquantes. Hors construction et marchés publics. |
| Licence de logiciel | Version, usages et utilisateurs, territoire, durée, support, chaîne de droits et composants tiers ; licence non exclusive et exceptions légales réservées. |
| Cession d’une création identifiée | Œuvre existante, chaîne des droits, droits individualisés, destinations, lieu, durée, rémunération et exclusions ; titularité non confirmée bloquante, droit moral réservé. |
| Lettre d’intention | Intentions indicatives distinguées des engagements obligatoires de confidentialité, frais et droit applicable ; aucune exclusivité ni promesse automatique. |
| Résiliation amiable | Contrat initial, date, solde, transition, clauses survivantes et droits réservés ; aucune transaction ou quittance générale présumée. |
| Notification de non-renouvellement | Clause exacte, échéance, réception cible, préavis calendaire et contexte commercial ; délai insuffisant et examen non confirmé bloquants. Ne vise pas une rupture anticipée pour faute. |
| Échelonnement d’une dette échue | Origine, principal, accessoires, mensualités calculées au centime, fins de mois, impayés ; créance contestée/non vérifiée et dates incohérentes bloquantes. |
| Procès-verbal de recette | Livrables et versions, critères et tests, décision, réserves et levée ; décision sans réserve incompatible avec des réserves décrites. |
| Prêt gratuit de matériel | Inventaire, usage, remise, entretien, assurance, durée et restitution ; gratuité, propriété du prêteur et règles légales de reprise préservées. |
| Convention de formation professionnelle | Objectifs, programme, public, durée, intervenants, suivi, prix, financement et annulation ; modèle public DREETS utilisé comme repère, exigences du financeur à contrôler. |
| Sous-traitance d’une action de formation | Lot pédagogique, contrat principal, intervenants, assiduité, justificatifs, prix, données et vérification du statut. |
| Licence de brevet | Titre, droits concédés, territoire, exclusivité, sous-licences, redevances, audit, améliorations, atteintes et formalités ; validité du titre non vérifiée automatiquement. |
| Conditions B2B de prestations de services | Commande, hiérarchie documentaire, barème, exécution, réclamations et paiement ; exclut les consommateurs et requiert une vérification des seuils en vigueur. |
| Accord de consortium numérique | Projet commun, partenaires, gouvernance, lots, financement, connaissances antérieures, résultats, publications, données et sortie ; modèle INPI à adapter au montage réel. |
| Collaboration de recherche | Apports, méthodes, gouvernance scientifique, connaissances antérieures, résultats propres/communs, accès, publications, données, éthique et financement. |
| Partage de données entre organismes | Finalités, données, rôles, licéité, accès, sécurité, incidents, conservation et réutilisation ; exclut les catégories sensibles et transferts non couverts. |
| Pilote / preuve de concept | Périmètre court, environnement, critères mesurables, prérequis, données, droits, support, passage éventuel en production et sortie. |

Les quatre trames de base et l’import de modèles de cabinet restent disponibles :

| Modèle                    | Contenu                                                                                                                                                                      | Limites explicites                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Accord de confidentialité | Unilatéral ou réciproque, finalité, exclusions, accès, divulgation imposée, période et survie, restitution, absence de cession                                               | Pas d'exclusivité ni de montant de pénalité inventé ; informations et durées à adapter                                            |
| Prestations de services   | Mission, livrables, critères de recette, moyens/résultat, durée fixe, prix/TVA, paiement, responsabilité, assurance, licence interne non exclusive, données et force majeure | Ni cession exclusive de droits, ni reconduction tacite, ni régime sectoriel spécial ; annexe de données à fournir si nécessaire   |
| Avenant                   | Contrat et avenants antérieurs, articles remplacés, nouvelle rédaction intégrale, coordination, date d'effet                                                                 | Pas d'analyse automatique du contrat initial ni de garanties sur les droits des tiers                                             |
| Mise en demeure de payer  | Créance professionnelle, principal, paiements/avoirs, échéance, pièces et demande précise                                                                                    | Pas d'intérêts, de frais ou d'indemnités calculés sans régime vérifié ; pas d'envoi automatique ; preuve de réception à conserver |
| Modèle de cabinet         | Texte collé ou repris d'un document autorisé du dossier ; variables `{{nom_du_champ}}`                                                                                       | La trame n'est pas validée par Atelier. Aucun code ou expression n'est exécuté                                                    |

Les modèles Atelier couvrent **le droit français et les relations ordinaires entre professionnels privés**. Le questionnaire bloque l'enregistrement d'une relecture finale pour un contexte consommateur, public, international ou à régime spécial. Un modèle approprié et une analyse spécifique restent nécessaires dans ces situations.

## Moteur et contrôles

La génération est **déterministe, sans modèle IA ni clé API**. Les clauses sont des rédactions indépendantes d'Atelier assemblées selon les réponses ; elles n'ont pas été validées par un avocat dans le cadre de ce développement. Le module ne promet pas la précision juridique de Legora ni une équivalence de ses fonctionnalités.

Contrôles réellement implémentés :

- Valeurs requises, types, options, dates réelles, ordre des dates et numéros SIREN au format de neuf chiffres. Les registres et pouvoirs réels ne sont pas interrogés.
- Montants décimaux transformés en centimes entiers et solde de créance exact ; pas de taux de pénalité variable inventé.
- Délai de facture ordinaire limité par la trame à 60 jours, facture périodique à 45 jours ; prise en compte du régime déclaré.
- Conditions déclarées pour une compétence territoriale exclusive ; clause visuellement renforcée, sans garantir son efficacité juridique.
- Nécessité d'une annexe de données suffisamment développée si la prestation traite des données pour le client. Le contrôle de longueur n'est **pas** une validation de l'article 28 du RGPD.
- Avenant daté de manière cohérente ; créance échue et solde positif pour une mise en demeure.
- Détection de variables non résolues et de clauses vides après modification.
- Relecture refusée si les erreurs bloquantes subsistent ou si l'empreinte/révision a changé.
- Actualité documentaire : réexamen imposé après 180 jours de la consultation des sources ; échéance connue de version également prise en compte. Les sources ne se mettent pas à jour automatiquement.

Le dossier Word comporte le corps du document, puis une annexe de contrôle distincte des stipulations : références, date de consultation, points de vigilance, version et empreinte. La relecture enregistrée est déclarative, sans authentification d'identité ou de qualification, sans signature électronique et sans certification juridique. Une case cochée atteste d'une action dans l'application ; elle ne prouve pas que la clause est correcte.

## Sources juridiques consultées

Consultation publique le **18/10/2026**, via les résultats indexés des sites officiels et, lorsque possible, la page publiée. Certaines requêtes directes Légifrance ont renvoyé 403 : cette étude n'est pas un audit de consolidation législative ou jurisprudentielle. Les règles codées sont bornées par cette collecte ; une vérification professionnelle des textes applicables au dossier reste nécessaire.

| Référence officielle                                                                                                                             | Utilisation dans la trame                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Code civil, art. 1112-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032007140/2026-06-09)                                       | Cadre de confidentialité pendant les négociations ; les clauses du NDA sont des choix contractuels, pas un modèle légal obligatoire                               |
| [Code civil, art. 1170](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041115)                                                    | Vigilance sur la portée d'une limitation de responsabilité et l'obligation essentielle                                                                            |
| [Code civil, art. 1193](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041314/2026-04-28)                                         | Accord modificatif entre parties ; les formalités particulières restent à vérifier                                                                                |
| [Code civil, art. 1344](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032042162/2026-07-14)                                         | Formulation d'une interpellation suffisante pour payer                                                                                                            |
| [Code civil, art. 1218](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431/2021-08-28)                                         | Force majeure appréciée selon les conditions légales, sans présomption fondée sur une liste d'événements                                                          |
| [Code de commerce, art. L441-10](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392/2026-07-01)                                | Délais, pénalités et hypothèses de facturation. La version consultée mentionne une fin de vigueur au **01/01/2027** : la trame exige un réexamen à cette échéance |
| [Code de commerce, art. D441-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043197457)                                            | Montant de l'indemnité forfaitaire lorsque son régime est applicable ; pas de calcul automatique dans la mise en demeure proposée                                 |
| [Code de procédure civile, art. 48](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006410147/2026-06-01)                             | Conditions particulières de la clause dérogatoire de compétence territoriale                                                                                      |
| [CNIL — contrat responsable/sous-traitant](https://www.cnil.fr/fr/clauses-contractuelles-types-entre-responsable-de-traitement-et-sous-traitant) | Annexe adaptée aux traitements ; distinguer encadrement de sous-traitance et transferts internationaux                                                            |

## Maintenance et tests

Sources ajoutées à la version 2026.10.18.5 : [Service Public Entreprendre sur les CGV](https://entreprendre.service-public.gouv.fr/vosdroits/F33527) (vérifié le 1er juillet 2026), [DREETS Bretagne sur les contrats et conventions de formation](https://bretagne.dreets.gouv.fr/Vos-documents-utiles-pour-une-declaration-d-activite) (page mise à jour le 16 avril 2025), [INPI sur les licences de brevet](https://www.inpi.fr/ressources/propriete-intellectuelle/guide-de-preparation-negociation) et [INPI sur les accords de consortium numérique](https://www.inpi.fr/ressources/propriete-intellectuelle/guide-du-consortium-dans-numerique), [INPI sur les accords de collaboration de recherche](https://www.inpi.fr/inpi-block/download-document?id=20605) (repère historique, modèle CNRS cité de 2004), [CNIL sur la répartition des responsabilités](https://www.cnil.fr/fr/droit-dacces-guichet-unique-violation-de-donnees-le-cepd-publie-de-nouvelles-lignes-directrices) et [CNIL sur les clauses cloud](https://www.cnil.fr/sites/cnil/files/typo/document/Recommandations_pour_les_entreprises_qui_envisagent_de_souscrire_a_des_services_de_Cloud.pdf). Ces sources servent de repères de contenu et de présentation ; elles ne certifient ni chaque cas d’usage ni la conformité des projets exportés.

`server/legal/catalog.mjs` contient les questionnaires, références et dates de consultation ; `generator.mjs` les rédactions et contrôles ; `routes.mjs` les révisions, relectures et exports. Toute évolution des règles ou des trames doit incrémenter leur version et s'accompagner d'une relecture juridique et de tests. Ne pas modifier une date de consultation sans revoir la source et ses conséquences.

Les tests backend vérifient les vingt-quatre trames, l’enregistrement et le DOCX réextrait de chaque nouvelle trame, les montants, dates, cas hors périmètre, garde-fous, modèles personnalisés, révisions et invalidation d’une relecture. L’échéancier est testé avec des centimes non divisibles et des fins de mois. Le test React/JSDOM couvre le catalogue, son filtre et un NDA complet jusqu’à l’invalidation de la relecture. L’horloge juridique est figée uniquement dans les tests ; la production utilise la date courante et ne permet pas de la fournir via l’API.

L'accès et le stockage restent ceux de l'application locale : une seule identité de session, sans collaboration d'équipe authentifiée. Les vérifications visuelles Chromium restent soumises aux restrictions Windows déjà documentées.
