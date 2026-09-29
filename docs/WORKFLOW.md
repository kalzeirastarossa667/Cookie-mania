# Organisation et outils GitHub

Audit du 28 septembre 2026 UTC. Version jouable : Foundation 2.2 Rayonnement.

## Rangement

index.html reste à la racine et ne change pas pendant ce rangement. scripts/ contient les vérifications utiles. docs/ conserve le Master courant et les rapports actuels ; docs/archive/ classe les anciens Masters et rapports. archive/releases/ conserve le prototype 0.7. Le rapport 0.7 en double à la racine est retiré : son blob était identique à celui conservé dans les archives.

## Outils configurés

- GitHub Actions : npm ci et npm test, cache npm fondé sur package-lock.json, limite de dix minutes, annulation des anciennes exécutions du même événement et de la même branche. Les changements purement documentaires ne déclenchent pas la suite ; lancement manuel disponible.
- Dependabot : contrôle hebdomadaire de npm et des actions GitHub, propositions limitées et mises à jour mineures/correctives npm regroupées. Aucune fusion automatique.
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

Le workflow Browser checks exécute Playwright dans Chromium sur GitHub Actions, avec un écran ordinateur et une émulation Pixel 5. Commande : npm run test:browser après npx playwright install --with-deps chromium. Deux scénarios par format couvrent clics, achat de curseur, sauvegarde/rechargement, navigation, filtres, thème et absence de débordement horizontal. Les captures et traces sont conservées sept jours dans l’artefact browser-report. L’émulation ne constitue pas un test sur un téléphone physique. Aucun navigateur n’est lancé dans l’environnement local restreint.
