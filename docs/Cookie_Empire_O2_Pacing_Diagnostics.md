# O2 — diagnostics du rythme de progression

Contrat **v1**, 22 octobre 2026. Base : `ef81233cde248161926c942ab7aafd9f2432b8ad`,
O1 fusionné via PR #36. Le jeu reste Foundation 2.9, sauvegarde v7.
O2 ne modifie ni `index.html`, ni les règles économiques, ni les cinq politiques O1.

## Exécuter et lire

```sh
npm ci
npm test
npm run analyze:pacing
node scripts/analyze-balance.mjs --pacing --json
```

`--pacing` implique les seules simulations de progression O1, pas le long
observatoire historique `analyze:balance`. Chaque politique est exécutée deux
fois ; l'égalité exacte inclut les nouvelles observations d'achats. La CI lance
`analyze:pacing` à la place d'`analyze:progression` : mêmes contrôles O1, aucune
deuxième exécution redondante. Les petits contrats O2 font partie de `npm test`.

Le JSON conserve `contractVersion:1` et les `timelines` O1 inchangées ; il ajoute
`pacing`, avec son propre `contractVersion`, SHA-256 du runtime, version Node et
rapports associés aux noms des politiques. Paramètres, horizons et descriptions
restent dans les timelines correspondantes. Ne pas comparer deux mesures sans
vérifier ces identités. Le JSON direct est un seul document valide ; l'en-tête npm
n'est pas du JSON, utiliser la commande `node` pour une redirection vers un fichier.

## Critères précis

| Mesure | Définition et limite |
| --- | --- |
| Transactions | Chaque achat générateur ou recherche réussi sur le vrai moteur, y compris les achats répétés sans nouveau jalon O1. Un ×10 compte pour une transaction et dix unités. |
| Unités générateurs | Somme des quantités réellement retournées par le moteur. Les recherches sont comptées séparément. |
| Achats simultanés | Transaction à la même seconde que la transaction précédente de cette fenêtre ; le premier achat à t=0 n'est pas compté comme simultané. |
| Intervalle sans achat | Début de fenêtre → achat, achat → achat suivant, puis dernier achat → fin d'observation. Les clics hypothétiques et la production continuent. Ce n'est pas une mesure d'inactivité humaine. |
| Cinq plus longs intervalles | Durées strictement positives, tri décroissant ; égalités par ordre chronologique. Temps locaux à la fenêtre, `startSeconds` permettant de retrouver le temps global. Aucun journal de tous les achats conservé. |
| Fin de fenêtre | `endedBy:window-end`, `toAction:null` : observation terminée, pas achat futur inventé. La raison d'arrêt distingue cible, horizon, limite d'itérations et revenu nul. Une durée observée nulle donne maximum `null`. |
| Transitions d'ères | Écart entre premières acquisitions d'ères voisines dans l'ordre Content, seulement dans un même cycle et dans cet ordre temporel. Sinon `null` avec statut. |
| Spécialisations | Première accessibilité → premier achat de la recherche, seulement si les deux événements appartiennent au même cycle. Accessible ne signifie pas abordable. Aucun délai fictif si l'achat n'a pas été observé. |
| Accélération prestige | Durée actuelle / durée précédente terminée ; réduction = (1 − ratio) × 100. Un ralentissement donne une réduction négative. Pas de ratio si cycle incomplet, précédent nul ou absent. Une sonde continue ne produit pas de cycle prestige. |
| Jalons absents | Non observés sous cette politique et cet horizon ; ne signifie ni impossibles, ni contenu obsolète. |

Les fenêtres non commencées n'ont pas de relevé d'achats ; elles restent visibles
dans les cycles O1 et les diagnostics prestige. Chaque fenêtre commencée vérifie
que le nombre de transactions égale `run.purchases` et que la somme de ses
intervalles égale la durée effectivement simulée.

## Mesure locale sur Foundation 2.9

Node **24.19.0**, runtime SHA-256 :
`361d36d1bf2fdbaca88e629feae1aacc1657e6799f3c91e0909c3763c6d9f6c3`.
Les nombres ci-dessous sont des secondes simulées, pas des durées de test.

| Politique, première fenêtre | Transactions | Unités générateurs | Plus long intervalle sans achat | Fin observée |
| --- | ---: | ---: | ---: | ---: |
| Unitaire, 2 clics/s | 719 | 699 | 149 s | Prestige à 25 141 s |
| ×10 puis Max, 2 clics/s | 709 | 699 | 153 s | Prestige à 25 218 s |
| Max puis ×10, 2 clics/s | 709 | 699 | 155 s | Prestige à 25 210 s |
| Late-run, 5 clics/s | 25 | 25 | 889 135 s | Creuset à 3 638 763 s |
| Sentinelle sans clic | 0 | 0 | Non mesurable | Arrêt `no-income` à 0 s |

La politique unitaire passe de **25 141 à 22 828 puis 20 923 s** par prestige :
réductions successives d'environ **9,20 %** et **8,35 %**. Les plus longs
intervalles sans achat passent de **149 à 135 puis 124 s**.

Pour cette politique, l'accès à Gestes experts précède son achat de **262 s** ;
celui de Moisson de cristal précède son achat de **11 939 s**. Ce dernier délai
n'est pas une attente sans achats : d'autres achats continuent entre-temps.
La spécialisation Cœur de fournaise devient accessible mais n'est pas achetée
dans les fenêtres observées. Cosmos et Infini ne sont pas atteints avant les
prestiges de ces stratégies ; ne pas en déduire qu'ils sont inaccessibles.

Late-run atteint les quatre ères. Les intervalles Atelier → Orbite → Cosmos →
Infini sont **1 016 / 172 543 / 1 290 620 s**. Son plus long intervalle avant
le Creuset vaut environ **10,29 jours simulés**. Cette sonde impose dix Curseurs,
puis une seule unité de chaque autre générateur, sans recherche ni prestige :
ce chiffre expose les limites de cette politique, pas une durée optimale ni
une preuve suffisante d'un mur de progression pour les joueurs.

## Vérifications

- Tests de contrats O2 écrits avant le module : échec attendu `ERR_MODULE_NOT_FOUND`,
  puis PASS après implémentation. C'est une preuve de fonctionnalité manquante,
  pas la reproduction d'un bug dans le jeu.
- `npm test` : **224/224 Foundation**, propriétés HugeNumber/coûts PASS,
  interface ciblée PASS, **169 contrôles DOM jsdom**, contrats O1 et O2 PASS.
- Cas O2 : achats répétés, refus, ×10/Max, achats simultanés, intervalles bornés,
  départ à t=0, observations nulles, arrêt horizon/step-limit/no-income, retours
  temporels et NaN/Infinity refusés, cycles incomplets/non commencés, ralentissement,
  séparation des cycles, données d'entrée non mutées.
- Cinq politiques complètes répétées à l'identique sous Node ; nombres d'achats
  et durées d'observation recoupés avec les cycles du vrai analyseur.
- Sortie JSON O1 sans instrumentation **byte-identique avant/après** ; les champs
  O1 de la sortie instrumentée sont également identiques à la base.
- Syntaxe Node et `git diff --check` PASS. `index.html` et `package-lock.json`
  byte-identiques au main de départ ; aucune dépendance ajoutée.
- Pas de nouvelle validation sur téléphone physique. Les preuves navigateur
  de la base sont les runs post-fusion O1 ; les éventuels runs de la PR O2 sont
  consignés séparément dans cette PR avec leur SHA.

## Limites et prochaine étape

Les cinq politiques gardent les limites O1 : revenu de clic continu hypothétique,
secondes entières, choix myopes, précision HugeNumber d'environ 15 chiffres,
observation prestige pouvant dépasser le seuil, absence de simulation UI/offline
et de commit de sauvegarde. Les maxima d'intervalles ne mesurent pas l'ennui réel.

O2 ne déclare automatiquement ni mur, ni emballement, ni générateur obsolète.
Les contrôles numériques O1/propriétés restent en place ; l'évolution détaillée
des exposants et une recherche de stratégie optimale ne sont pas implémentées.

Après revue de cette étape, **O3** pourra figer une référence comparative avec
les identités de runtime, contrats et politiques. **E1/E2** viennent ensuite.
Aucune nouvelle mécanique ni modification de prix n'est incluse ici.
