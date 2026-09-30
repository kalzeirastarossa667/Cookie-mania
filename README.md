# Cookie Empire

**Foundation 2.7.1 — Stable** : clicker autonome avec **16 générateurs**, **22 recherches**, **44 objectifs** et un système de **prestige permanent à branches** avec Rayonnement total et portefeuille d’Éclats séparés.

## Jouer

Télécharger `index.html` puis l'ouvrir dans un navigateur. La page de fichiers GitHub n'est pas un jeu hébergé.

- **Empire** : cookie central, prochain objectif et destinations.
- **Atelier** : seize générateurs dans quatre régions ; filtres ; achats ×1 / ×10 / Max ; gains effectifs par clic ; estimation du temps avant achat sans clic manuel.
- **Recherche** : bonus permanents et huit spécialisations des anciens générateurs, accessibles à dix unités possédées. Une spécialisation double les CPS et la contribution aux clics du générateur concerné. Quatre synergies combinent les spécialisations par paires et renforcent automatiquement production et clic. Le Parcours contient aussi un arbre permanent de cinq améliorations : racine commune, voies Clic et Production, puis convergence. Les voies restent non exclusives.
- **Parcours** : quarante-quatre objectifs et prestige à partir de 1 billion de cookies produits dans la partie.

Mode galaxie par défaut, thème clair disponible, ressources persistantes et clic accessible depuis les autres vues. Pas de dépendance réseau. Les tests de développement ne sont plus embarqués dans le jeu.

Pour reprendre une partie dans un nouveau fichier téléchargé, **Exporter les données** depuis l'ancien jeu, puis **Importer une partie** dans le nouveau. Les sauvegardes v6 migrent vers le schéma v7 avec une boutique permanente vide. Les sauvegardes v5 initialisent toujours le portefeuille d’Éclats depuis le Rayonnement total ; les sauvegardes v1 à v4 migrent avec Rayonnement et Éclats à zéro. Les nouveaux générateurs commencent à zéro. Les synergies sont dérivées des recherches possédées et n’ajoutent aucun champ sauvegardé. Le retour à une ancienne version après des achats nouveaux n'est pas pris en charge.

## Développer

- [Master Dev File v3.0](docs/Cookie_Empire_Master_Dev_File_v3.0.md), source de vérité.
- [Rapport de stabilisation Foundation 2.7.1](docs/Cookie_Empire_Foundation_2.7.1_Stability_Report.md).
- [Rapport Foundation 2.4](docs/Cookie_Empire_Foundation_2.4_Test_Report.md).
- [Clickers GitHub étudiés et décisions retenues](docs/Cookie_Empire_GitHub_Research_2.1.md).
- Node 24 : `npm ci`, puis `npm test`. `npm run analyze:balance` rejoue séparément l’observatoire déterministe de pacing.

La suite exécute **220/220** cas de règles/persistance, les vérifications d'interface ciblées et **56/56** assertions Constellation/Horizons. Le checkpoint 2.7.1 a également validé **10/10 scénarios Playwright** : 5 sur Chromium desktop et 5 sous émulation Pixel 5, dont le parcours des deux branches de Rayonnement jusqu’à leur convergence. Le fichier `scripts/foundation-cases.js` est réservé au développement. Les anciens tests par générateur ont été regroupés ; les doubles exécutions au démarrage ont été supprimées.

Ces résultats Node/jsdom ne certifient pas le rendu sur un téléphone réel. Lire le Master, spécifier chaque mécanique puis vérifier ses effets avant de poursuivre. Les références externes ont inspiré des principes de conception ; aucun de leurs assets ou codes n'est embarqué.

## Organisation du dépôt

- [Documentation actuelle](docs/README.md) et [méthode de travail](docs/WORKFLOW.md).
- `index.html` : jeu courant ; `scripts/` : vérifications ; `docs/archive/` : historique documentaire ; `archive/releases/` : anciens prototypes.
- GitHub Actions vérifie le code ; Dependabot regroupe les mises à jour routinières sur une cadence mensuelle. Les dépendances de développement ne sont pas embarquées dans le jeu.
