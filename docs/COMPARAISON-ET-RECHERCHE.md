# Comparaison et recherche juridique — 18 octobre 2026

## Fonctions livrées

Deux espaces sont accessibles dans la navigation locale. Ils utilisent SQLite et les pièces du dossier actif. Ils ne nécessitent aucun service externe.

**Comparer** : sélection de deux pièces, comparaison de paragraphes avec ancres textuelles exactes, différences de mots surlignées, ajouts/suppressions/modifications, filtres, signaux sur les chiffres et la portée des clauses, accès aux sources, décision et commentaire par écart, historique et export Word. Chaque comparaison conserve les empreintes SHA-256 des originaux. Les mises à jour utilisent une révision pour refuser les écrasements concurrents.

Les signaux sont des heuristiques à examiner. Ils ne prouvent ni une contradiction juridique, ni la validité d’une clause. Les paragraphes sans ancre sont appariés par position. Les déplacements peuvent produire des ajouts et suppressions. La mise en page, les images et signatures ne sont pas comparées ; l’OCR n’est pas ajouté. Limite : un million de paires de paragraphes. Au-delà de 160 000 paires de tokens dans un paragraphe, celui-ci est marqué intégralement modifié pour borner la mémoire.

**Recherche juridique** : deux corpus explicitement séparés, pièces du dossier et textes de références importés par l’utilisateur. Classement BM25, normalisation des accents, correspondance de termes entiers, expressions entre guillemets, exclusions `-mot`, modes tous les termes/un terme ou synonyme, périmètre documentaire, juridiction, nature et date déclarée. Les synonymes couvrent quelques notions contractuelles, sans représentation sémantique générale. Chaque résultat reproduit un passage exact, sa provenance et les termes correspondants. Les recherches et passages sélectionnés sont conservés et exportables en Word.

Les références sont importées sous forme de texte autorisé, avec titre, URL HTTPS, nature, juridiction et dates facultatives. Les métadonnées et le texte restent déclaratifs. Un filtre de date ne constitue pas une certification de vigueur ; sans date renseignée, la référence reste dans les résultats. La fin de vigueur est exclusive. Les repères du générateur sont affichés séparément comme notes éditoriales : ils ne remplacent pas les textes normatifs et ne sont pas insérés artificiellement dans les résultats.

La suppression d’une pièce retire les comparaisons et recherches qui en reproduisent le contenu. La suppression d’une référence retire les recherches contenant ses extraits. Les exports déjà téléchargés restent sous la responsabilité de leur détenteur. Les recherches sont des instantanés : une nouvelle source nécessite une nouvelle exécution.

## Accès aux bases officielles

Les liens vers Légifrance, Judilibre et EUR-Lex ouvrent leurs sites officiels. **Aucune requête API vers ces bases n’est exécutée par cette version.** Aucune pièce client n’est envoyée à un moteur externe. L’interface précise l’absence de connexion configurée.

Observé : le [service web EUR-Lex](https://eur-lex.europa.eu/content/help/data-reuse/webservice.html?locale=fr), consulté le 18 octobre 2026, utilise SOAP et nécessite un accès accordé après inscription ; les recherches renvoient des métadonnées et le téléchargement des documents est séparé. Les pages officielles [Légifrance Open Data/API](https://www.legifrance.gouv.fr/contenu/pied-de-page/open-data-et-api) et [Cour de cassation Open Data/API](https://www.courdecassation.fr/acces-rapide-judilibre/donnees-ouvertes-open-data-et-api) sont les points d’entrée pour leurs modalités. Leur relecture automatisée directe a rencontré respectivement un refus HTTP 403 et un contrôle JavaScript/cookies lors du dernier contrôle : aucun accès API opérationnel n’en est déduit.

Inconnu : droits, quotas et contrats effectivement accordés à l’utilisateur. Vérification : obtenir les accès officiels, relever la version de leur documentation puis tester les requêtes, filtres et citations sur leur environnement autorisé. Les connecteurs, une veille automatique, un index juridique exhaustif, la recherche vectorielle et la synthèse de jurisprudence externe restent à implémenter. L’assistant local existant conserve son mode extractif et son option Ollama ; la nouvelle recherche fournit des extraits classés, sans prétendre générer une analyse juridique.

## API et données

- `GET /api/matters/:id/research` : bibliothèque, historique et accès officiels.
- `POST /api/matters/:id/research` : rechercher et enregistrer un instantané.
- `POST /api/matters/:id/references`, `DELETE /api/references/:id` : corpus de références.
- `PATCH /api/research/:id/bookmarks` : sélectionner les passages à exporter.
- `POST /api/matters/:id/comparisons` : comparaison de deux pièces du dossier.
- `PATCH /api/comparisons/:id` : décision, commentaire et révision optimiste.
- `GET /api/research/:id/evidence.docx`, `GET /api/comparisons/:id/evidence.docx` : livrables sourcés.

Tables ajoutées : `comparisons`, `legal_references`, `research_sessions`, rattachées aux dossiers par clé étrangère. Protection locale identique aux autres API : écoute loopback, validation Host/Origin et en-tête de mutation. Ce mode mono-utilisateur ne fournit pas une isolation multi-utilisateur avec authentification.

## Validation

Tests dédiés : termes entiers, expressions, exclusions, synonymes, documents distincts, citations et empreintes, annotations persistantes, conflit de révision, filtrage temporel, périmètre du dossier, favoris, relecture du DOCX et suppression des résultats dérivés. Parcours React/JSDOM sur les vraies API : comparaison, annotation, recherche et sélection d’un passage, en plus des parcours existants. Le rendu visuel Chromium reste non vérifié dans cet environnement Windows.
