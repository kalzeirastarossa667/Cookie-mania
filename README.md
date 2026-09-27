# Cookie Empire

Jeu idle/clicker jouable dans le navigateur. Version de référence actuelle : **Foundation 0.7.1**, candidate en attente de validation sur appareil réel.

Ouvrir `index.html` dans un navigateur pour jouer. Les données sont sauvegardées localement par le navigateur ; pour transférer une partie entre fichiers ou appareils, utiliser l'export JSON puis l'import depuis le menu du jeu.

## Développement

- Source de vérité : [`docs/Cookie_Empire_Master_Dev_File_v2.4.md`](docs/Cookie_Empire_Master_Dev_File_v2.4.md).
- Rapport de la version : [`docs/Cookie_Empire_Foundation_0.7.1_Test_Report.md`](docs/Cookie_Empire_Foundation_0.7.1_Test_Report.md).
- Vérifications automatiques : `npm ci` puis `npm test` (Node 24).

La suite relance 151 tests de règles et de persistance, puis 22 assertions d'interface avec jsdom. Elle ne remplace pas un essai dans un vrai navigateur. Le rapport historique 0.7 annonce également 58 scénarios DOM simulés, dont le programme de test autonome n'est pas dans ce dépôt.

Avant d'ajouter une mécanique, lire le Master Dev File, vérifier la version courante et conserver la compatibilité des sauvegardes.
