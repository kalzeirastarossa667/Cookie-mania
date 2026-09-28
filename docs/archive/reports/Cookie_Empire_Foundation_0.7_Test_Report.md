# Cookie Empire — Foundation 0.7 : progression de l’atelier

Date : 2026-09-27. Base : dernière livraison 0.6.4, Master v2.2 intégralement relu.
Livraison : candidate 0.7 et Master v2.3. La confiance exprimée autorise la poursuite ; elle n’est pas
comptabilisée comme une nouvelle validation navigateur. Dernière confirmation explicite : 0.6.2.

## Ce qui change

Une carte « Votre empire » apparaît au-dessus des générateurs. Elle montre un titre d’atelier,
le nombre d’étapes franchies, l’objectif suivant et une barre de progression. « Voir les 8 étapes »
déplie la liste complète. Les titres sont cosmétiques et les étapes n’accordent pas de bonus.

| Étape | Condition |
|---|---|
| Première fournée | 25 cookies produits au total |
| Un coup de main | 1 curseur possédé |
| Une recette de famille | 1 grand-mère possédée |
| Le goût du progrès | 1 amélioration acquise |
| Une équipe au travail | 10 curseurs possédés |
| Mille douceurs | 1 000 cookies produits au total |
| Le carnet de recettes | 4 améliorations acquises |
| Un empire en devenir | 10 000 cookies produits au total |

Les étapes sont indépendantes : elles peuvent être franchies dans un autre ordre. L’objectif proposé
est le premier incomplet dans cette liste. Les achats restent régis par les règles existantes.
Les titres évoluent à 0, 2, 4, 6 et 8 étapes : Les débuts gourmands, Petit atelier, Boulangerie en essor,
Fabrique reconnue, Empire en devenir. Une fois les huit étapes franchies, le jeu continue normalement.

## Sources de vérité et architecture

Content définit les étapes et les titres. Le module Progression calcule les résultats sans mutation,
à partir de totalProduced, generators et ownedUpgrades. La réserve dépensable ne sert pas à mesurer
la production cumulée : un achat ne fait donc pas perdre une étape déjà atteinte.

GameState, HugeNumber, Economy, achats, multiplicateurs, moteur, temps et sauvegardes restent identiques
à la 0.6.4. Aucun nouveau champ persistant ; schéma de jeu v4 et migrations existantes conservés.
Les objectifs, titres et pourcentages sont reconstruits après chargement/import/restauration.

La comparaison au seuil utilise HugeNumber. Le pourcentage n’est qu’un affichage : il n’atteint 100
qu’une fois la condition remplie. Les grands totaux ne sont pas convertis en Number pour décider.
Les lignes DOM restent en place ; ouvrir les détails ou garder le focus survit aux rafraîchissements.
Les annonces d’étapes disposent de leur propre zone accessible, indépendante des erreurs de sauvegarde.

## Vérification

| Contrôle | Résultat |
|---|---|
| Base 0.6.4 relancée | 131/131 core et 46/46 DOM |
| Core final | **146/146**, dont 15 nouveaux cas |
| Interface simulée finale | **58/58**, dont 12 nouveaux scénarios |
| Anciennes assertions | Inchangées |
| Syntaxe JavaScript | PASS, Node 24.19.0 |
| Comparaison des fondations | Identiques, preuves dans le paquet |
| Vrai navigateur et rendu mobile | À valider |

Les tests couvrent les seuils exacts et fractionnaires, les nombres énormes, l’indépendance des étapes,
les achats groupés, les dépenses, le hors-ligne, les titres, la fin du parcours, l’absence de mutation,
les définitions invalides, les anciennes sauvegardes, le reset et les faux champs dérivés sauvegardés.
L’interface est testée pour les clics, achats, détails/focus stables, annonces uniques, erreurs de
stockage, recharge, import, restauration, production simulée et clavier.

Deux tests ont d’abord échoué : le validateur acceptait un identifiant de générateur fourni dans
un tableau ; le libellé « prochaine étape » restait visible à la fin du parcours. Les corrections
passent les tests. Les fixtures et résultats avant correction sont fournis pour reproduction.

jsdom 30.1.1 simule le DOM. Il ne prouve ni la disposition réelle sur Android, ni les annonces d’un
lecteur d’écran natif. Aucun contournement de la restriction navigateur précédemment rencontrée.
Aucune sauvegarde utilisateur réelle n’a servi aux injections de panne ou aux essais de reset.

## Limites et essai utilisateur

Ces étapes reflètent la partie actuellement chargée ; elles ne constituent pas un historique de succès
indépendant. Recommencer ou importer/restaurer une ancienne partie peut faire baisser le compteur.
Les limites existantes de précision, stockage, concurrence entre onglets et horloge restent applicables.

À vérifier sur l’appareil : la carte reste lisible ; déplier/replier les huit étapes ; produire 25
cookies puis acheter un curseur ; sauvegarder et recharger ; diagnostic attendu **146/146**.
Pour transférer la partie depuis un autre fichier, utiliser l’export JSON puis le menu Importer.
Ne pas effacer une partie importante uniquement pour tester : les resets sont couverts automatiquement.
