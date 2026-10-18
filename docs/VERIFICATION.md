# Vérification de la version locale

Vérification le 18 octobre 2026, Node.js 24.21.0, Windows. Mise à jour avec le générateur juridique.

Le module de génération ajoute trois suites backend aux quatre suites initiales : **7 réussies, 0 échec**. Elles couvrent les quatre trames, les montants en centimes, dates, cas hors périmètre, annexe de données, conditions de compétence territoriale, références à réexaminer, modèles de cabinet, relecture liée à une révision/empreinte, DOCX réextrait et invalidation après modification. Le scénario React/JSDOM couvre aussi le questionnaire complet d'un NDA, les références, les clauses relues, l'enregistrement d'une relecture et son invalidation. Voir [le guide du générateur](GENERATEUR-JURIDIQUE.md).

| Contrôle exécuté                  | Résultat                   | Périmètre                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests backend                     | 4 réussis, 0 échec         | Extraction sur un PDF réel et un DOCX généré, rejet des formats invalides, API HTTP, SQLite, sélection de dossiers, absence de réponse lexicale, revue, annulation effective, correction, conflit, verrou, citations, export XLSX relu, DOCX, notes, persistance, suppression, Host/Origin et en-tête de mutation |
| Tests d’interface React/JSDOM     | Réussis                    | Accueil, grille, panneau de cellule, correction, verrouillage, validation, source surlignée, création de dossier, import via le formulaire, exécution de revue, assistant sourcé, note sauvegardée à la navigation et paramètres                                                                                  |
| Compilation de production Vite    | Réussie                    | Bundle React/CSS ; environ 280 Ko de JavaScript avant compression                                                                                                                                                                                                                                                 |
| Serveur de production             | HTTP 200                   | Santé, page HTML et asset JavaScript ; rejet d’une mutation sans en-tête ; 3 documents, 1 revue, 15 cellules, empreintes SHA-256 complètes                                                                                                                                                                        |
| Scénario Chromium/Playwright      | Bloqué par l’environnement | `spawn EPERM` ; le lancement direct Chrome échoue aussi sur les permissions IPC Windows. Aucun résultat visuel ou capture d’écran réussi revendiqué                                                                                                                                                               |
| Modèle Ollama réellement installé | Non vérifié                | Contrat JSON et refus des citations inventées testés avec réponses simulées ; pas de modèle local disponible vérifié                                                                                                                                                                                              |
| Inspection REA du HAR public      | Échec conservé             | `EPERM` sur le snapshot temporaire ; voir PROVENANCE.md                                                                                                                                                                                                                                                           |

Les tests d’interface utilisent de vraies API et une base temporaire, mais des méthodes de dialogue et de défilement simulées. Ils ne prouvent ni la mise en page, ni le comportement des contrôles natifs, ni l’accessibilité complète d’un navigateur.

Rapports locaux : `test-results/dom-report.json` et `test-results/production-report.json`. Scripts reproductibles dans `tests/`. Aucun compte Legora ni document client réel utilisé. Le dépôt REA est resté inchangé.

## Utilisation immédiate

Mise à jour du 18 octobre 2026 : neuf tests backend passent, y compris comparaison, recherche, conflits de révision, filtres temporels, export et suppression des résultats dérivés. Le parcours React/JSDOM valide aussi les deux nouveaux espaces sur les vraies API et SQLite. Voir `COMPARAISON-ET-RECHERCHE.md` pour le périmètre fonctionnel. Aucun nouveau contrôle visuel Chromium n’est revendiqué.

- Ouvrir `http://127.0.0.1:4310` pendant que le serveur tourne.
- Double-cliquer `Lancer-Atelier.cmd` pour démarrer/réouvrir.
- Utiliser `Arreter-Atelier.cmd` pour arrêter proprement avant une sauvegarde du dossier `data`.
- Consulter README.md pour les limites, Ollama, l’installation et les tests.
