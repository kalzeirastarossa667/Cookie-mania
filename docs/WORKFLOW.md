# Organisation et outils GitHub

Checkpoint du 30 septembre 2026 UTC. Version candidate : Foundation 2.8 Quality, dérivée de Foundation 2.7.2 Feedback validée en usage réel. Save schema v7 inchangé. Foundation 2.8 ne change ni balance, ni progression, ni structure de sauvegarde ; elle durcit le parseur HugeNumber et les gates de qualité. Le snapshot de release 2.8 reste byte-identique à `index.html`.

## Rangement

index.html reste à la racine et ne change pas pendant ce rangement. scripts/ contient les vérifications utiles. docs/ conserve le Master courant et les rapports actuels ; docs/archive/ classe les anciens Masters et rapports. archive/releases/ conserve le prototype 0.7. Le rapport 0.7 en double à la racine est retiré : son blob était identique à celui conservé dans les archives.

## Outils configurés

- GitHub Actions : npm ci et npm test, cache npm fondé sur package-lock.json, limite de dix minutes, annulation des anciennes exécutions du même événement et de la même branche. Les feature branches sont vérifiées par pull_request ; les push déclenchent les suites sur main afin d’éviter les doublons de CI. Les changements purement documentaires ne déclenchent pas la suite ; lancement manuel disponible.
- Dependabot : contrôle mensuel de npm et des actions GitHub, mises à jour routinières regroupées, limites de PR ouvertes réduites. Aucune fusion automatique ; les mécanismes de sécurité ne sont pas volontairement désactivés.
- .nvmrc : Node 24. .editorconfig : encodage et fins de ligne cohérents. .gitignore : dépendances et fichiers temporaires hors dépôt.
- fast-check : propriétés génératives déterministes de HugeNumber et de l’économie, uniquement en développement.
- @axe-core/playwright : contrôle automatique des violations d’accessibilité sérieuses/critiques, uniquement en développement.
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

Le workflow Browser checks exécute Playwright dans Chromium sur GitHub Actions, avec un écran ordinateur et une émulation Pixel 5. Commande : npm run test:browser après npx playwright install --with-deps chromium. Huit scénarios par format couvrent clics, achat de curseur, sauvegarde/rechargement, navigation, filtres, thème, prestige, branches permanentes, absence de débordement horizontal, feedback Formspree et scans axe en thèmes sombre et clair. La soumission Formspree est interceptée en test navigateur : aucun faux e-mail n’est envoyé. Les captures et traces sont conservées sept jours dans l’artefact browser-report. L’émulation ne constitue pas un test sur un téléphone physique ni un audit manuel au lecteur d’écran. Aucun navigateur n’est lancé dans l’environnement local restreint.


Foundation 2.7.2 a validé **12/12 scénarios Playwright** en 16,4 s sur la branche de fonctionnalité : 6 desktop Chromium et 6 sous émulation Pixel 5. L’émulation mobile n’est pas un test sur téléphone physique.


Foundation 2.8 a validé sur le commit de release `c8f382c3d2b3a1ef8a09981812014ceca6069b14` : **220/220 Foundation**, propriétés génératives PASS, interface ciblée PASS, **56/56 Constellation/Horizons DOM** et **16/16 Playwright** (8 desktop + 8 Pixel 5), avec axe vert en thèmes sombre et clair. `npm ci` a audité 45 paquets et signalé 0 vulnérabilité.
