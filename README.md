# Cookie Empire

Jeu idle/clicker jouable dans le navigateur. Version de référence actuelle : **Foundation 1.0**, candidate en attente de validation visuelle sur appareil réel. Le mode nuit galaxie est activé par défaut ; le bouton ☾/☀ permet de retrouver le thème clair. La mine de cacao augmente la production et les cookies par clic. La progression compte maintenant douze étapes.

Ouvrir `index.html` dans un navigateur pour jouer. Les données sont sauvegardées localement par le navigateur ; pour transférer une partie entre fichiers ou appareils, utiliser l'export JSON puis l'import depuis le menu du jeu.

## Développement

- Source de vérité : [`docs/Cookie_Empire_Master_Dev_File_v2.7.md`](docs/Cookie_Empire_Master_Dev_File_v2.7.md).
- Rapport de la version : [`docs/Cookie_Empire_Foundation_1.0_Test_Report.md`](docs/Cookie_Empire_Foundation_1.0_Test_Report.md).
- Vérifications automatiques : `npm ci` puis `npm test` (Node 24).

La suite relance 157 tests de règles et de persistance, puis les vérifications ciblées d'interface avec jsdom. Elle ne remplace pas un essai dans un vrai navigateur. Le rapport historique 0.7 annonce également 58 scénarios DOM simulés, dont le programme de test autonome n'est pas dans ce dépôt.

Avant d'ajouter une mécanique, lire le Master Dev File, vérifier la version courante et conserver la compatibilité des sauvegardes.
