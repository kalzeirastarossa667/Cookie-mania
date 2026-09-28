# Cookie Empire

**Foundation 2.0 — Constellation** : jeu idle/clicker autonome, avec une nouvelle interface mobile galaxie.

## Jouer

Télécharger `index.html` et l’ouvrir dans un navigateur. Le dépôt GitHub contient le code ; sa page de fichiers n’est pas une page de jeu hébergée.

- **Empire** : cookie central, prochain objectif et destinations spatiales.
- **Atelier** : huit générateurs, achats ×1 / ×10 / Max et gains par clic effectifs.
- **Recherche** : quatorze bonus permanents, trois branches, prérequis et filtres.
- **Parcours** : vingt-huit objectifs jusqu’aux forges stellaires.

Réserve et gains toujours accessibles ; bouton de clic disponible depuis les autres vues. Mode nuit par défaut, mode clair conservé. Fonctionnement sans dépendance réseau.

Pour reprendre une partie dans un nouveau fichier téléchargé, utiliser **Exporter les données** dans l’ancien jeu puis **Importer une partie** dans le nouveau. Les sauvegardes v4 antérieures sont acceptées ; les nouveaux générateurs commencent à zéro. Ne pas revenir à une ancienne version après des achats propres à 2.0.

## Développer

- Source de vérité : [Master Dev File v2.9](docs/Cookie_Empire_Master_Dev_File_v2.9.md).
- Résultats : [Rapport Foundation 2.0](docs/Cookie_Empire_Foundation_2.0_Test_Report.md).
- Installer les outils : `npm ci` (Node 24).
- Vérifier : `npm test`.

175 tests intégrés et les suites DOM passent, dont 40 nouvelles assertions pour Constellation. Les tests jsdom ne remplacent pas une validation visuelle sur un appareil réel. La nouvelle interface reste une candidate ; la vidéo du joueur valide la version 1.1 précédente.

Avant toute mécanique, lire le Master, spécifier les règles et conserver la compatibilité des sauvegardes. Cell to Singularity a servi de référence d’organisation de l’interface ; aucun de ses assets n’est embarqué dans le jeu.
