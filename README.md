# Cookie Empire

Jeu idle/clicker jouable dans le navigateur. Version de référence actuelle : **Foundation 0.7**, candidate en attente de validation sur appareil réel.

Ouvrir `index.html` dans un navigateur pour jouer. Les données sont sauvegardées localement par le navigateur ; pour transférer une partie entre fichiers ou appareils, utiliser l'export JSON puis l'import depuis le menu du jeu.

## Développement

- Source de vérité : [`docs/Cookie_Empire_Master_Dev_File_v2.3.md`](docs/Cookie_Empire_Master_Dev_File_v2.3.md).
- Rapport de la version : [`docs/Cookie_Empire_Foundation_0.7_Test_Report.md`](docs/Cookie_Empire_Foundation_0.7_Test_Report.md).
- Tests intégrés et contrôle de syntaxe : `node scripts/check-foundation.mjs` (Node 20 ou plus récent).

La suite Node teste les règles du jeu et la persistance, mais ne remplace pas les tests d'interface dans un vrai navigateur. La version 0.7 annonce 146 tests core et 58 scénarios DOM simulés dans son rapport ; le script de ce dépôt relance uniquement les 146 tests intégrés.

Avant d'ajouter une mécanique, lire le Master Dev File, vérifier la version courante et conserver la compatibilité des sauvegardes.
