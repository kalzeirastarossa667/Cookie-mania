# Cookie Empire

**Foundation 2.1 — Horizons** : clicker autonome avec **16 générateurs**, **22 recherches** et **44 objectifs**.

## Jouer

Télécharger `index.html` puis l'ouvrir dans un navigateur. La page de fichiers GitHub n'est pas un jeu hébergé.

- **Empire** : cookie central, prochain objectif et destinations.
- **Atelier** : seize générateurs dans quatre régions ; filtres ; achats ×1 / ×10 / Max ; gains effectifs par clic ; estimation du temps avant achat sans clic manuel.
- **Recherche** : bonus permanents et huit spécialisations des anciens générateurs, accessibles à dix unités possédées. Une spécialisation double les CPS et la contribution aux clics du générateur concerné.
- **Parcours** : quarante-quatre objectifs.

Mode galaxie par défaut, thème clair disponible, ressources persistantes et clic accessible depuis les autres vues. Pas de dépendance réseau. Les tests de développement ne sont plus embarqués dans le jeu.

Pour reprendre une partie dans un nouveau fichier téléchargé, **Exporter les données** depuis l'ancien jeu, puis **Importer une partie** dans le nouveau. Les anciennes sauvegardes v4 restent acceptées ; les nouveaux générateurs commencent à zéro. Le retour à une ancienne version après des achats nouveaux n'est pas pris en charge.

## Développer

- [Master Dev File v3.0](docs/Cookie_Empire_Master_Dev_File_v3.0.md), source de vérité.
- [Rapport Foundation 2.1](docs/Cookie_Empire_Foundation_2.1_Test_Report.md).
- [Clickers GitHub étudiés et décisions retenues](docs/Cookie_Empire_GitHub_Research_2.1.md).
- Node 24 : `npm ci`, puis `npm test`.

La suite exécute 181 cas de règles/persistance, les vérifications d'interface existantes et 56 assertions Constellation/Horizons. Le fichier `scripts/foundation-cases.js` est réservé au développement. Les anciens tests par générateur ont été regroupés ; les doubles exécutions au démarrage ont été supprimées.

Ces résultats Node/jsdom ne certifient pas le rendu sur un téléphone réel. Lire le Master, spécifier chaque mécanique puis vérifier ses effets avant de poursuivre. Les références externes ont inspiré des principes de conception ; aucun de leurs assets ou codes n'est embarqué.
