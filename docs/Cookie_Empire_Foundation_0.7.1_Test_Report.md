# Cookie Empire — Foundation 0.7.1

Base : Foundation 0.7 et Master Dev File v2.3. Statut : candidate, rendu sur appareil réel à vérifier.

## Modifications

- Nouveau générateur « Four artisanal » : 1 100 cookies au départ, prix multiplié par 1,15 par four possédé, production de 8 cookies/s par four.
- Le coût total de l'achat ×10 est affiché et mis à jour sur son bouton.
- Affichage rafraîchi toutes les 0,25 s, sauvegarde automatique toutes les 5 s de temps simulé actif, plus tentative de sauvegarde lors de la fermeture ou de la mise en arrière-plan de la page.

Aucune modification des quatre améliorations, des huit étapes, des anciennes règles d'achat ou du format de sauvegarde v4. Les sauvegardes v4 dépourvues du nouveau générateur lui attribuent zéro exemplaire ; une valeur présente invalide est refusée.

## Vérification

| Contrôle | Résultat |
|---|---|
| Tests intégrés précédents | 146 conservés |
| Nouveaux tests de générateur | 5, observés échouer avant ajout puis réussir |
| Tests intégrés totaux | **151/151** |
| Simulation de 5 s de boucle | 20 rendus, 1 sauvegarde |
| Scénarios d'interface jsdom ciblés | **21/21** |
| Syntaxe JavaScript | PASS, Node 24.19.0 |
| Vrai navigateur et rendu mobile | Non vérifiés : accès direct au fichier local refusé par la politique du navigateur de test (`file:` bloqué) |

La simulation d'interface vérifie le prix et son libellé accessible, les boutons ×1/×10, le CPS, l'ancien format v4 sans four, la progression, la sauvegarde à la fermeture, l'échec et la reprise d'une sauvegarde ainsi que le passage en arrière-plan. L'assertion de sauvegarde à la fermeture a échoué avant l'ajout du gestionnaire, puis réussi. Les 58 scénarios DOM historiques de la livraison 0.7 ne sont pas disponibles en tant que suite autonome dans ce dépôt et ne sont pas présentés comme relancés.

## Limites

Une fermeture brutale sans événement de cycle de vie peut perdre environ cinq secondes de progression. Les limites antérieures de stockage, concurrence entre onglets, horloge et précision numérique demeurent. Le prochain contrôle est un essai sur téléphone de la largeur des boutons, du prix ×10, de l'achat du four et de la sauvegarde/recharge.
