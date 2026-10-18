# Sauvegarde du projet sur GitHub

Le dépôt versionne le code source, les tests synthétiques, les scripts et la documentation, y compris l’analyse fonctionnelle dans `docs/analyse/`.

Les données locales ne sont pas versionnées : base SQLite et documents importés dans `data/`, exports, sauvegardes, captures réseau, fichiers `.env`, clés, dépendances, runtime et résultats de tests. Le dépôt GitHub ne remplace donc pas une sauvegarde distincte de `data/` réalisée après arrêt propre de l’application.

Installation après clonage : installer Node.js 24.11 ou plus récent, exécuter `npm ci`, `npm run build`, puis `npm start`. Le runtime `.runtime/` fourni sur la machine d’origine n’est pas inclus. Le dossier fictif est créé automatiquement au premier démarrage sur une base vide, sauf si `ATELIER_DEMO=0`.

Pour enregistrer les modifications suivantes, depuis le dossier du projet :

```sh
git add .
git diff --cached --stat
git commit -m "Description des modifications"
git push
```

Vérifier avant chaque envoi les fichiers ajoutés et conserver la visibilité **Private** du dépôt sur GitHub. Les collaborateurs explicitement autorisés sur ce dépôt pourront accéder au code.
