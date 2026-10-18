# Atelier — application juridique locale

Application indépendante inspirée des **capacités publiquement documentées** de Legora : dossier, documents, contexte explicite, revue tabulaire, sources, corrections et livrables. Aucun code, compte ou endpoint privé Legora utilisé. Le dossier de départ et tous ses contrats sont fictifs.

## Ouvrir l’application

Sur cet ordinateur, double-cliquez **Lancer-Atelier.cmd**, ou ouvrez **http://127.0.0.1:4310** si le serveur est déjà démarré. **Arreter-Atelier.cmd** arrête proprement l’instance sur ce port.

Le runtime Node Windows est fourni dans `.runtime` sur cette machine, avec sa licence. L’application est compilée et ses dépendances sont installées. Le lanceur ne nécessite donc pas npm pour l’utilisation quotidienne.

Pour installer sur une autre machine : Node.js 24.11 ou plus récent, puis :

```sh
npm ci
npm run build
npm start
```

En développement : `npm run dev`. Le serveur écoute uniquement sur `127.0.0.1:4310`. Variable `PORT` pour un autre port ; le lanceur Windows et son arrêt ciblent le port par défaut. `ATELIER_DATA_DIR` permet un autre dossier de données ; `ATELIER_DEMO=0` désactive la création initiale du dossier fictif sur une base vide.

## Ce qui fonctionne

- **Comparer** : import direct des deux versions, lecture redline ou côte à côte, filtres, recherche, annotations et export DOCX avec de vraies révisions Word acceptables ou rejetables. Exports propres de chaque version et rapport sourcé disponibles. La mise en page d’origine n’est pas conservée.
- **Recherche juridique** : recherche classée dans les pièces ou les références importées, expressions exactes, exclusions, synonymes limités, filtres, historique et passages conservés. Voir [le périmètre détaillé](docs/COMPARAISON-ET-RECHERCHE.md). Les liens vers les bases officielles ne constituent pas des connexions API actives.

- Dossiers distincts avec nom, description et client.
- Import réel PDF texte, Word DOCX, TXT UTF-8 et Markdown ; détection des doublons par empreinte.
- Qualification : pièce primaire, déclaration, cadrage ou analyse. Une requalification remet les résultats à vérifier.
- Assistant documentaire avec choix des pièces consultées, citations exactes et ouverture du passage source.
- Revues paramétrables : documents sélectionnés, cinq questions de départ et questions personnalisées, jusqu’à dix colonnes.
- Progression, arrêt et relance des revues ; résultats partiels conservés ; redémarrage signalé comme interruption.
- Correction des cellules, révisions antérieures, validation, signalement, verrouillage et commentaires.
- Export XLSX avec feuille de sources/décisions ; rapport Word avec extraits. Un export incomplet porte la mention brouillon.
- Notes libres sauvegardées avant navigation, détection de conflits de version et export Word.
- Générateur juridique : **16 modèles** avec bibliothèque filtrable, questionnaires spécialisés, clauses éditables, contrôles sourcés, historique et relecture enregistrée. NDA, services, avenant, mise en demeure, RGPD, SaaS, maintenance, sous-traitance, licence, cession de droits, lettre d’intention, résiliation amiable, non-renouvellement, échéancier, recette et prêt de matériel. Import de modèles de cabinet à variables. Voir [le guide du générateur](docs/GENERATEUR-JURIDIQUE.md).
- Journal local d’activité, téléchargement des originaux, suppression des pièces et dérivés de l’assistant.
- Interface adaptée aux petits écrans et navigation au clavier dans les dialogues principaux.

## Deux modes d’analyse

### Extraits sourcés — disponible immédiatement

Ce mode **n’est pas un modèle génératif**. Il recherche des termes dans les blocs de texte et expose les passages trouvés. Les colonnes habituelles comportent des termes français et anglais. Une question personnalisée dépend de ses mots-clés.

« Information non trouvée » indique un résultat lexical vide, **pas une preuve d’absence dans le document**. Le mode ne comprend pas toutes les formulations, ne résout pas les contradictions et peut retenir une clause secondaire : relire les passages et exceptions. Les cellules restent à vérifier jusqu’à votre décision.

### Ollama — synthèse générative optionnelle

1. Installez et démarrez [Ollama](https://ollama.com/) séparément.
2. Installez un modèle **local** compatible avec votre matériel et les sorties JSON. Aucun modèle n’est téléchargé automatiquement.
3. Ouvrez les paramètres, sélectionnez **Ollama**, actualisez la détection et choisissez le modèle.

L’application communique uniquement avec `http://127.0.0.1:11434`. Elle utilise le protocole documenté de [génération](https://docs.ollama.com/api/generate) et les [sorties structurées](https://docs.ollama.com/capabilities/structured-outputs). Les modèles portant « cloud » dans leur nom sont refusés. Il vous appartient de configurer Ollama pour une exécution locale : l’application ne peut auditer la configuration interne d’un service tiers installé sur votre machine.

Le modèle reçoit des passages sélectionnés, pas nécessairement l’intégralité du corpus. Les extraits cités sont vérifiés par correspondance exacte côté serveur ; une citation inventée fait rejeter la réponse. Cette vérification ne garantit pas que toutes les affirmations sont juridiquement étayées. Aucune recherche web, source juridique externe ou action autonome n’est effectuée.

**L’intégration Ollama a été testée avec des réponses simulées pour la validation du protocole et des citations ; aucune génération sur un modèle réellement installé n’a été vérifiée dans cet environnement.**

Le **générateur juridique** constitue un module distinct : il assemble des clauses à partir des réponses et fonctionne sans Ollama. Il ne certifie pas la validité juridique du résultat. Sa portée, les sources datées et les contrôles sont explicités dans [son guide](docs/GENERATEUR-JURIDIQUE.md).

## Données et limites

Les données sont enregistrées dans `data/atelier.sqlite` : originaux, texte extrait, revues, notes et historique. Aucun service cloud de stockage ni clé API n’est requis. Les fichiers téléchargés et les notes rédigées manuellement constituent des copies autonomes ; supprimer une pièce ne peut les effacer à distance.

**Usage personnel local**, sous l’identité unique « Utilisateur local ». Cette version ne fournit pas d’authentification multi-utilisateur, de rôles d’équipe, de chiffrement applicatif au repos ni d’isolation multi-organisation de production. Ne pas exposer le port sur Internet. Les contrôles Host/Origin et l’en-tête de mutation limitent les requêtes provenant de pages tierces ; ils ne protègent pas contre un programme local ayant accès à votre session Windows. Utilisez les protections du compte et du disque de votre ordinateur.

Limites : **25 Mo par fichier, 30 fichiers par transfert, 100 documents par dossier, 100 pages par PDF et 800 000 caractères extraits par document**. Les imports s’exécutent dans le processus local ; les fichiers très complexes peuvent demander du temps. L’OCR, la restitution visuelle PDF avec coordonnées de surlignage, la pagination Word, les compléments Office, les connecteurs DMS, les portails clients et la recherche juridique externe ne sont pas inclus. Les PDF partiellement scannés sont signalés comme incomplets. Les sources sont affichées en blocs de texte avec un surlignage du bloc, et l’original est téléchargeable.

Les versions de documents sont immuables : pour un avenant, importer une nouvelle pièce. Aucun lien automatique contrat/avenant ni consolidation de leurs effets n’est promis. Les commentaires et validations sont des décisions de l’utilisateur local, sans signature numérique ni contrôle d’un second relecteur indépendant.

### Sauvegarde

Arrêtez l’application avec `Arreter-Atelier.cmd`, puis copiez le dossier `data` vers votre support de sauvegarde. Arrêter le serveur permet à SQLite de fermer ses fichiers WAL. Pour restaurer, serveur arrêté, conserver une copie de l’état courant puis remettre le dossier sauvegardé à l’emplacement `data`. Aucune sauvegarde externe automatique n’est activée.

## Architecture et sources

- React + Vite pour l’interface ; CSS local, sans police ou asset distant.
- Express et validation Zod pour les API ; SQLite natif de Node avec clés étrangères et journal WAL.
- PDF.js pour les PDF, Mammoth pour DOCX, ExcelJS et docx pour les exports.
- Passerelle Ollama locale optionnelle ; aucune dépendance de production à REA.

Les dépendances directes sont épinglées et `package-lock.json` est fourni. Les modules restent séparés : `store.mjs`, `documents.mjs`, `analysis.mjs`, `app.mjs`, composants et styles.

L’analyse de départ est dans [le dossier d’étude](../legora-analyse/ANALYSE-ET-CAHIER-DES-CHARGES.md). Les observations publiques ne sont pas présentées comme l’architecture interne de Legora. Voir [la traçabilité d’implémentation](docs/PROVENANCE.md) pour les choix et l’usage tenté de REA.

## Vérification

```sh
npm test
npm run build:ui
npm run test:ui
npm run build
```

`npm test` couvre les vraies API, SQLite, import PDF/DOCX, revue, citations, corrections, verrous, conflit de révision, exports, reprise, suppression, protections Host/Origin et validation d’Ollama avec réponses simulées.

`test:ui` utilise React et JSDOM contre les vraies API et une base temporaire. Les méthodes natives de dialogue et le défilement sont simulés ; ce test **ne vérifie pas le rendu visuel ou le comportement natif d’un navigateur**.

Un scénario Playwright est fourni : démarrez l’application puis `npm run test:browser`. Chrome doit être disponible et son lancement autorisé. Ce test crée un dossier de vérification et des documents fictifs dans l’instance ciblée. Il peut aussi utiliser un endpoint CDP explicite via `ATELIER_CDP`. Le rendu Chromium est resté bloqué par les permissions Windows de l’environnement de construction ; ne pas le considérer comme validé ici.
