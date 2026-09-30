# Cookie Empire — démarrage du travail

Lire README.md puis docs/README.md et PROJECT_MEMORY.md. Avant toute modification du jeu, lire intégralement le Master Dev File actuel indiqué dans docs/README.md et analyser index.html. PROJECT_MEMORY.md complète le Master avec l’intention produit durable et la continuité du projet, mais ne remplace jamais le HEAD courant, le Master, le code ou les tests comme sources techniques de vérité. Les archives ne sont pas une base de développement.

- index.html est le jeu autonome et la seule source jouable courante.
- Préserver HugeNumber, les sauvegardes, le temps et les règles validées.
- Spécifier toute nouvelle mécanique dans le Master avant son implémentation.
- npm ci puis npm test avec Node 24. Conserver les tests utiles ; regrouper les doublons. Aucun test de développement dans le fichier jouable.
- Rapporter séparément résultats automatisés et validation réelle sur mobile.
- Ne pas committer node_modules, analyses temporaires, captures ou copies de livraison.
- Préférer un commit cohérent pour plusieurs fichiers. Avec le connecteur GitHub, utiliser tree/commit/ref ; conserver les entrées non modifiées et refuser toute mise à jour forcée. Relire la branche avant publication et vérifier les SHA ensuite.
- Pour un changement important, privilégier une branche et une PR avec problème, changements et vérifications. Ne pas fusionner une mise à jour de dépendance sans examiner ses effets.
