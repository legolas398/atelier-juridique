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

`server/legal/catalog.mjs` contient les questionnaires, références et dates de consultation ; `generator.mjs` les rédactions et contrôles ; `routes.mjs` les révisions, relectures et exports. Toute évolution des règles ou des trames doit incrémenter leur version et s'accompagner d'une relecture juridique et de tests. Ne pas modifier une date de consultation sans revoir la source et ses conséquences.

Les tests backend vérifient les quatre trames, les montants, dates, cas hors périmètre, garde-fous, modèles personnalisés, DOCX réextrait, révisions et invalidation d'une relecture. Le test React/JSDOM suit un NDA complet, du questionnaire à la relecture puis à sa réinitialisation après une modification. L'horloge juridique est figée uniquement dans les tests ; la production utilise la date courante et ne permet pas de la fournir via l'API.

L'accès et le stockage restent ceux de l'application locale : une seule identité de session, sans collaboration d'équipe authentifiée. Les vérifications visuelles Chromium restent soumises aux restrictions Windows déjà documentées.
