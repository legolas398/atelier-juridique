# Vérification de la version locale

Vérifié le 18 octobre 2026 sur Windows, Node.js 24.21.0.

| Contrôle | Résultat | Portée |
| --- | --- | --- |
| Tests backend | **15 réussis, 0 échec** | Extraction PDF/DOCX, API et SQLite, revue, citations, corrections, concurrence, exports, permissions locales, suppression et persistance. |
| Catalogue de 16 modèles | Réussi | Douze nouveaux questionnaires complétés par des données synthétiques ; enregistrement HTTP et export DOCX réextrait pour chacun. Les quatre modèles initiaux restent testés. |
| Contrôles spécialisés | Réussi | Formalités de sous-traitance, chaîne des droits, clauses RGPD, préavis, recette, centimes et fins de mois d’un échéancier, dates et cas incomplets. |
| Révisions Word natives | Réussi sur OOXML | Insertions, suppressions, identifiants uniques, suivi actif et marques de paragraphes ; accepter les révisions restitue le texte révisé, les rejeter restitue l’original. Sauts de ligne, caractères spéciaux, exports propres et imports de deux vrais DOCX testés. |
| Interface React/JSDOM | Réussi | Deux imports dans Comparer, redline, côte à côte, téléchargement, annotation conservée après filtre et sauvegardée à la navigation ; catalogue filtrable ; parcours NDA, assistant, revue, sources, notes et paramètres. API réelles et base temporaire. |
| Compilation Vite | Réussie | JavaScript et CSS de production, puis compilation du module React pour le test DOM. |
| Navigateur Chromium | Non vérifié | Les essais précédents ont échoué sur les permissions Windows de processus/IPC ; aucun résultat visuel ni capture réussi revendiqué. |
| Ouverture manuelle Microsoft Word | Non vérifiée | La structure des révisions et leurs projections sont testées, pas le rendu dans une installation Word interactive. |
| Modèle Ollama installé | Non vérifié | Le contrat JSON et le rejet de citations fabriquées sont testés avec des réponses simulées. |
| Analyse privée de Legora | Non réalisée | Sources publiques uniquement ; l’inspection REA du HAR a rencontré une erreur EPERM, conservée localement. |

Les tests JSDOM ne prouvent ni la mise en page, ni l’affichage des contrôles natifs, ni l’accessibilité complète d’un navigateur. Les tests des modèles prouvent le fonctionnement de la génération et des contrôles identifiés ; ils ne constituent pas une validation juridique par un professionnel.

Rapports locaux : `test-results/dom-report.json`, `test-results/production-report.json` et `test-results/github-publication.json`. Ils ne sont pas versionnés car ils décrivent une machine et une exécution locales.

Commandes : `npm test`, `npm run build`, `npm run build:ui`, `npm run test:ui`. Les données des tests sont synthétiques et stockées dans des bases temporaires supprimées en fin de test.

Utilisation : ouvrir `http://127.0.0.1:4310`, ou lancer `Lancer-Atelier.cmd`. Arrêt propre avec `Arreter-Atelier.cmd` avant de sauvegarder le dossier `data/`.
