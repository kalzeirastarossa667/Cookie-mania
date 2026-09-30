# Organisation et outils GitHub

Checkpoint du 30 septembre 2026 UTC. Baseline candidate : Foundation 2.8.1 Timing, dérivée de Foundation 2.8 Quality. Save schema v7 inchangé. Le correctif ne touche qu’au temps actif visible : aucun temps monotone visible n’est jeté lorsqu’une frame est retardée. GameState, économie, contenu, persistence et Formspree restent inchangés.

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

Le workflow Browser checks exécute Playwright dans Chromium sur GitHub Actions, avec un écran ordinateur et une émulation Pixel 5. Commande : npm run test:browser après npx playwright install --with-deps chromium. Neuf scénarios par format couvrent clics, achats, sauvegarde/rechargement, navigation, filtres, thème, prestige, branches permanentes, feedback Formspree, accessibilité axe et la coexistence clic intensif + production automatique. Les captures et traces sont conservées sept jours dans l’artefact browser-report. L’émulation Pixel 5 ne constitue pas un test sur téléphone physique.


Foundation 2.7.2 a validé **12/12 scénarios Playwright** en 16,4 s sur la branche de fonctionnalité : 6 desktop Chromium et 6 sous émulation Pixel 5. L’émulation mobile n’est pas un test sur téléphone physique.


Foundation 2.8.1 : **18/18 Playwright PASS en 44,7 s** sur la branche de correction, soit 9 desktop Chromium + 9 Pixel 5 émulé. Le test timing occupe volontairement le thread ~1,2 s tout en cliquant et vérifie que le CPS continue d’être crédité.
