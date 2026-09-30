# Organisation et outils GitHub

Checkpoint final Foundation 2.9 du 30 septembre 2026 UTC. **Foundation 2.9 Visual & Guidance est fusionnée et déployée.** La PR #32 a été fusionnée dans `main`; le commit d’intégration runtime est `5c4ee2eaa4fb3cae1b6ebc32be127da43898bd41`. Foundation checks post-merge, Browser checks post-merge et GitHub Pages sont **SUCCESS** sur ce commit. Save schema v7 et clé de stockage inchangés. La 2.9 ajoute clarté des générateurs, guidage joueur et polish visuel sans modifier les règles économiques ou temporelles validées.

## Rangement

index.html reste à la racine et ne change pas pendant ce rangement. scripts/ contient les vérifications utiles. docs/ conserve le Master courant et les rapports actuels ; docs/archive/ classe les anciens Masters et rapports. archive/releases/ conserve le prototype 0.7. Le rapport 0.7 en double à la racine est retiré : son blob était identique à celui conservé dans les archives.

## Outils configurés

- GitHub Actions : npm ci et npm test, cache npm fondé sur package-lock.json, limite de dix minutes, annulation des anciennes exécutions du même événement et de la même branche. Les feature branches sont vérifiées par pull_request ; les push déclenchent les suites sur main afin d’éviter les doublons de CI. Les changements purement documentaires ne déclenchent pas la suite ; lancement manuel disponible.
- Dependabot : contrôle mensuel de npm et des actions GitHub, mises à jour routinières regroupées, limites de PR ouvertes réduites. Aucune fusion automatique ; les mécanismes de sécurité ne sont pas volontairement désactivés.
- .nvmrc : Node 24. .editorconfig : encodage et fins de ligne cohérents. .gitignore : dépendances et fichiers temporaires hors dépôt.
- AGENTS.md : orientation immédiate vers les sources actuelles et règles de travail.
- API Git tree/commit/ref : publication groupée en un commit, avec vérification de la branche et mise à jour sans force.

## Usage

Installer avec npm ci ; vérifier avec npm test. Lors d'un échec GitHub Actions, lire d'abord le journal du job concerné. Réexécuter seulement le job défaillant si la panne est transitoire. Les simulations jsdom ne remplacent pas un navigateur réel.

Les réglages de protection de branche, CodeQL et les outils payants ne sont pas activés par ce rangement. Aucun outil supplémentaire n'est nécessaire dans le jeu téléchargé. L'exécution effective des services dépend des permissions et quotas GitHub du dépôt.

## Sources consultées

- https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md — cache npm.
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency — annulation des exécutions remplacées.
- https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference — configuration des mises à jour.

## Vérification navigateur

Le workflow Browser checks exécute Playwright dans Chromium sur GitHub Actions, avec un projet desktop et une émulation Pixel 5. Commande : `npm run test:browser` après `npx playwright install --with-deps chromium`. La suite actuelle couvre clics, achats, sauvegarde/rechargement, navigation, filtres, thème, prestige, branches permanentes, feedback Formspree, accessibilité axe, coexistence clic intensif + production automatique, contrats Foundation 2.9 et régressions mobiles. Les captures et traces sont conservées sept jours dans l’artefact browser-report. L’émulation Pixel 5 reste distincte d’un test sur téléphone physique.


Foundation 2.7.2 a validé **12/12 scénarios Playwright** en 16,4 s sur la branche de fonctionnalité : 6 desktop Chromium et 6 sous émulation Pixel 5. L’émulation mobile n’est pas un test sur téléphone physique.


Foundation 2.8.1 : **18/18 Playwright PASS en 44,7 s** sur la branche de correction, soit 9 desktop Chromium + 9 Pixel 5 émulé. Le test timing occupe volontairement le thread ~1,2 s tout en cliquant et vérifie que le CPS continue d’être crédité.


Foundation 2.8.2 : 20 cas Playwright déclarés, **19 PASS + 1 skip attendu** sur la branche de correction. Le cas mobile-only vérifie que les éléments de fin d’Empire, Atelier, Recherche et Parcours restent au-dessus de la navigation fixe sous émulation Pixel 5. Foundation reste **220/220**, propriétés PASS, interface PASS et Constellation **56/56**.


Foundation 2.8.3 : la régression Pixel 5 ouvre le menu `…` et vérifie par hit-testing que `Exporter les données`, `Importer une partie` et `Nouvelle partie` restent les éléments interactifs au premier plan. La preuve rouge a identifié `.wallet` devant `#exportSaveButton`; le correctif porte `.settings-menu` de `z-index: 5` à `z-index: 40`. Pré-packaging : Foundation **220/220**, propriétés PASS, interface PASS, Constellation **56/56**, Playwright **20 PASS + 2 skips desktop attendus**.


Foundation 2.9 RC — **historique pré-fusion** : implémentation séquencée A1 → A2 → A3 → B → C. Après resynchronisation avec le `main` de l’époque, le head `26e7c8a176b1b00f344d88d8271a3f0df33b422a` a validé Foundation **224/224**, propriétés PASS, interface PASS, Constellation **169/169**, et Browser **26 PASS + 2 skips de viewport attendus**. Les protections timing 2.8.1, navigation 2.8.2 et menu 2.8.3 restaient couvertes. Le packaging RC a ensuite ajouté un test navigateur explicite pour CPS nul et HugeNumber extrême. À ce checkpoint RC, la validation Android physique n’avait pas encore été effectuée.

Foundation 2.9 — **checkpoint final post-fusion** : la RC packagée au head `02c62e659c532f20fe6fb5925f30c0d4f5c227db` a été fusionnée via la PR #32. Le commit d’intégration sur `main` est `5c4ee2eaa4fb3cae1b6ebc32be127da43898bd41`. Sur ce commit : Foundation checks `36774955501` **SUCCESS** avec **224/224 Foundation**, propriétés PASS, interface PASS et Constellation **169/169** ; Browser checks `36774955560` **SUCCESS** avec **28 PASS + 2 skips de viewport attendus**, dont le test CPS nul / `1e1000` ; GitHub Pages `36774955023` **SUCCESS**. Après déploiement, le propriétaire a contrôlé la version GitHub Pages sur un téléphone Android physique et a indiqué que le jeu lui paraissait fonctionner correctement, notamment le menu `⋯` et son accessibilité. Cette validation utilisateur est limitée à l’appareil et au navigateur testés et ne vaut pas certification exhaustive de l’écosystème Android.
