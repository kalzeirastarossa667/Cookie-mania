# Clickers étudiés pour Horizons 2.1

Étude du 28 septembre 2026 UTC. Les sources consultées sont les dépôts des projets. Il s'agit d'une adaptation d'idées générales : aucun code, asset ou paquet de ces jeux n'est incorporé dans Cookie Empire.

| Projet et source | Observation vérifiée | Décision pour Cookie Empire |
| --- | --- | --- |
| [Kittens Game](https://github.com/nuclear-unicorn/kittensgame), README, section General Design Principles | Préférence pour la réutilisation des bâtiments existants ; jeu actif encouragé ; attention à la croissance en fin de partie. | Huit spécialisations donnent une nouvelle utilité aux premiers générateurs. Leurs bonus s'appliquent aussi aux clics, conformément à l'orientation demandée. |
| [Kittens Game, buildings.js](https://github.com/nuclear-unicorn/kittensgame/blob/master/js/buildings.js), lignes 30–100 | Le cache de métadonnées est invalidé quand le stade du bâtiment change. | Cache d'affichage par signature des recherches acquises ; invalidation testée après changement. Les prix restent mis en cache par quantité possédée. |
| [The Modding Tree, temp.js](https://github.com/Acamaeda/The-Modding-Tree/blob/master/js/technical/temp.js), lignes 1–170 | Données calculées temporaires séparées, fonctions d'action exclues des évaluations automatiques, certains contenus de vue actualisés à la demande. | Conserver l'autorité du moteur ; ne mettre en cache que des valeurs de présentation. Ne jamais appeler un achat depuis un calcul de rendu. |
| [Evolve](https://github.com/pmotschmann/Evolve), README | Progression d'une civilisation vers l'espace, combinaison clicker/idle et importance des compromis de conception. | Quatre régions de catalogue et une progression spatiale continue. Les nouvelles unités ont un coût croissant ; pas de bonus gratuit rétroactif ni de nouvelle monnaie. |

## Sources de code effectivement inspectées

- Kittens Game `js/buildings.js` : blob SHA `96b914db51a302a94aa1e96b5b7b927fb06a2814`.
- The Modding Tree `js/technical/temp.js` : blob SHA `eab66e28ce64d4fd5f63b714aabc31db4f9df44c`.
- Les liens de branche peuvent évoluer ; les empreintes identifient les contenus lus. Le README de Kittens Game et celui d'Evolve ont également été lus.

## Catalogue nouveau

Toutes les unités suivent la croissance de prix existante ×1,15. La colonne contribution au clic est avant les multiplicateurs de clic.

| Générateur | Prix initial en cookies | CPS et contribution au clic par unité |
| --- | ---: | ---: |
| Raffinerie de nébuleuse | 40 000 000 000 | 600 000 |
| Caravane de comètes | 800 000 000 000 | 9 000 000 |
| Four quantique | 16 000 000 000 000 | 140 000 000 |
| Confiserie temporelle | 320 000 000 000 000 | 2 200 000 000 |
| Batteur antimatière | 6 400 000 000 000 000 | 35 000 000 000 |
| Fonderie galactique | 128 000 000 000 000 000 | 560 000 000 000 |
| Cuisine du multivers | 2 560 000 000 000 000 000 | 9 000 000 000 000 |
| Creuset des origines | 51 200 000 000 000 000 000 | 145 000 000 000 000 |

Le rapport prix/production de base augmente graduellement (environ ×1,25 par palier). Cela évite une hausse de prix ×20 accompagnée d'une production seulement ×6. Cette observation arithmétique ne remplace pas l'observation de parties longues.

## Idées volontairement différées

Prestige, automation d'achats, plusieurs monnaies et arbres de resets : ces systèmes nécessitent des règles et migrations dédiées. La priorité de cette version est le catalogue de seize générateurs, la compréhension des achats et la robustesse de la partie existante.
