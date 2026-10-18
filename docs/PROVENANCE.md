# Traçabilité du produit et de l’implémentation

Date : 18 octobre 2026. Produit indépendant : **Atelier**.

L’extension du catalogue et le parcours redline s’inspirent des capacités publiques de rédaction et de travail dans Word présentées par [Legora Workflows](https://legora.com/product/workflows) et [Legora pour les opérations](https://legora.com/solutions/ma), consultées le 18 octobre 2026. Aucune bibliothèque privée de modèles Legora n’a été consultée ni reproduite. Les seize trames sont des rédactions indépendantes et ne revendiquent pas une validation par Legora ou un avocat.

Les nouvelles références publiques incluent les pages CNIL sur [l’encadrement responsable/sous-traitant](https://www.cnil.fr/fr/clauses-contractuelles-types-entre-responsable-de-traitement-et-sous-traitant), [les exemples de clauses](https://www.cnil.fr/fr/sous-traitance-exemple-de-clauses), les textes Légifrance identifiés dans le catalogue et la fiche officielle [Service Public sur la sous-traitance](https://entreprendre.service-public.gouv.fr/vosdroits/F36261). Les sources bornent le périmètre et les points à vérifier ; leur présence ne certifie pas l’exhaustivité de chaque contrat.

| Capacité publique étudiée                         | Preuve                                                                                                                           | Réalisation indépendante                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projet, documents et contexte explicite           | [Stanford — contexte, observations du 13/10/26](https://ailearninghub.law.stanford.edu/legora-at-sls/context-and-project-files/) | Dossiers SQLite ; contexte sélectionnable à la demande. L’interface ne cherche pas à reproduire le comportement de disparition des pièces jointes. |
| Matrice documents/questions                       | [Legora — Tabular Review](https://legora.com/product/tabular-review)                                                             | Revue paramétrable, un document par ligne, questions par colonne.                                                                                  |
| Corrections, verrouillage et décision par cellule | [Stanford — Tabular Review, 13/10/26](https://ailearninghub.law.stanford.edu/legora-at-sls/tabular-review/)                      | Révisions immuables en historique, contrôle de concurrence, décisions et commentaires de l’utilisateur local.                                      |
| Ouverture d’une citation                          | [Stanford — citation, 13/10/26](https://ailearninghub.law.stanford.edu/legora-at-sls/follow-the-citation/)                       | Identifiant de document et de bloc, extrait exact, surlignage textuel. Pas de promesse de force probante.                                          |
| Travail rédactionnel puis export Word             | [Legora — Editor](https://legora.com/product/editor)                                                                             | Notes textuelles avec sauvegarde et export DOCX ; aucune coédition ni redline avancée.                                                             |
| Modèles locaux structurés                         | [Ollama — génération](https://docs.ollama.com/api/generate)                                                                      | Protocole local, schéma Zod, contrôle d’ancrage des extraits ; intégration optionnelle.                                                            |

## Usage de REA

Le dépôt REA cloné est conservé intact. La CLI **rea-agents 6.7.0** a été acquise dans le cache de travail puis exécutée, sans modifier la configuration Codex :

- `rea doctor --client codex --json` a établi l’absence d’enregistrement MCP et de certains moteurs natifs. Ces moteurs ne sont pas nécessaires au développement du SaaS local.
- `scripts/collect-evidence.mjs` a téléchargé directement trois pages publiques de Legora dans `evidence/legora-public.har`. Le créateur du HAR indique explicitement qu’il s’agit d’une collecte HTTP, pas d’une capture de session navigateur.
- `rea inspect-web-network-capture … har --format json` a été tenté. Il a échoué lors de l’ouverture de `capture.snapshot` avec une erreur **EPERM**, y compris après déplacement du répertoire temporaire dans l’espace de travail. Le résultat brut est conservé dans `evidence/rea-public-inspection.json` ; **ce fichier contient un échec, pas une analyse REA réussie**.
- Le démarrage Chrome, directement puis via un outil navigateur installé, a également échoué sur les permissions IPC/processus Windows. Aucune inspection privée de Legora ni copie de ses scripts applicatifs n’a eu lieu.

Ces limites n’empêchent pas l’implémentation indépendante fondée sur l’étude publique déjà sourcée. Elles empêchent de revendiquer une capture REA complète ou une reproduction navigateur du produit. Aucune permission globale, configuration d’agent ni protection de l’environnement n’a été modifiée.

Le travail de vérification exécuté se distingue des preuves de reverse engineering : tests réels de notre API et de ses données ; contrôle React/JSDOM ; compilation ; contrôle HTTP du serveur local. Les tests JSDOM ne constituent pas une mesure visuelle du produit.
