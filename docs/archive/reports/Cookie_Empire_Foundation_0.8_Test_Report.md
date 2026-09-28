# Cookie Empire — Foundation 0.8 : l’atelier renforce les clics

Base : Foundation 0.7.1, validée par le joueur en usage ordinaire ; Master Dev File v2.4.
Statut de la 0.8 : candidate, à essayer dans un vrai navigateur.

## Règle

Chaque générateur acheté ajoute à chaque clic sa production **de base** par seconde :

| Générateur | Bonus par exemplaire et par clic |
|---|---:|
| Curseur | +0,1 cookie |
| Grand-mère | +1 cookie |
| Four artisanal | +8 cookies |

Le gain par clic vaut `(puissance de base + somme des bonus des générateurs) × multiplicateur de clic`.
« Clic renforcé » multiplie le résultat ; les améliorations de CPS ne modifient pas les clics.
Exemples : un four donne 9 cookies/clic au départ ; onze fours donnent 89 cookies/clic.

La possession des générateurs reste la source de vérité. Le gain par clic est recalculé après achats,
chargement, import et restauration. Le schéma de sauvegarde reste v4 : une ancienne partie reçoit
immédiatement la nouvelle règle en rechargeant, sans perte de possessions.

## Vérifications

| Contrôle | Résultat |
|---|---|
| Nouveaux tests de synergie | 5 observés échouer avant implémentation, puis réussir |
| Tests de règles et de régression | **157/157** |
| Vérifications d’interface simulée | **28/28** |
| Cadence simulée sur 5 s | 20 rendus, une sauvegarde |
| Syntaxe JavaScript et installation propre des dépendances | PASS, Node 24.19.0 |
| Véritable navigateur et rendu mobile de la 0.8 | Non vérifiés |

Onze assertions historiques portant directement sur la valeur de l’ancien gain par clic ont été
actualisées. Leurs contrôles de CPS, sauvegarde, import et protection des données restent présents.
Les 58 scénarios DOM historiques de la 0.7 ne sont pas fournis en suite autonome et ne sont pas
annoncés comme relancés. Le navigateur de test disponible bloque l’ouverture des fichiers locaux
`file:` ; aucun contournement n’a été tenté.

## Limites et prochaine étape

Le gain manuel devient volontairement plus important par rapport à la production passive. Il faudra
observer le rythme de jeu avant de fixer l’équilibrage final. Les limites antérieures de précision,
horloge, stockage et multi-onglet restent applicables. Sur appareil réel : acheter un curseur,
une grand-mère puis un four ; vérifier le gain affiché, cliquer, sauvegarder et recharger.
