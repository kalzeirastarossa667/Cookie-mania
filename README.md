# Cookie Empire

Jeu idle/clicker jouable dans le navigateur. Version de référence actuelle : **Foundation 1.1**, candidate en attente de validation visuelle sur appareil réel. Le mode nuit galaxie est activé par défaut ; le bouton ☾/☀ permet de retrouver le thème clair. La mine de cacao augmente la production et les cookies par clic. La progression compte seize étapes, avec un laboratoire chocolatier et deux nouvelles recettes. La production reprend quand un onglet mis en arrière-plan redevient visible.

Ouvrir `index.html` dans un navigateur pour jouer. Les données sont sauvegardées localement par le navigateur ; pour transférer une partie entre fichiers ou appareils, utiliser l'export JSON puis l'import depuis le menu du jeu.

## Développement

- Source de vérité : [`docs/Cookie_Empire_Master_Dev_File_v2.8.md`](docs/Cookie_Empire_Master_Dev_File_v2.8.md).
- Rapport de la version : [`docs/Cookie_Empire_Foundation_1.1_Test_Report.md`](docs/Cookie_Empire_Foundation_1.1_Test_Report.md).
- Vérifications automatiques : `npm ci` puis `npm test` (Node 24).

La suite relance 163 tests de règles et de persistance, puis les vérifications ciblées d'interface avec jsdom. Elle ne remplace pas un essai dans un vrai navigateur. Le rapport historique 0.7 annonce également 58 scénarios DOM simulés, dont le programme de test autonome n'est pas dans ce dépôt.

Avant d'ajouter une mécanique, lire le Master Dev File, vérifier la version courante et conserver la compatibilité des sauvegardes.
