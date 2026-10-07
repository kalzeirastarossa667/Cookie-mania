# O1 — contrat d’observabilité de progression

Contrat **v1**, Foundation 2.9, checkpoint GitHub du 7 octobre 2026.
O1 est un outil de développement. Runtime, constantes économiques, contenu,
interface, modèle temporel, prestige et sauvegardes v7 sont inchangés.

## Checkpoint et consolidation

- main : `af0443a94909a34a1f207665244d6eb4b55aab74`.
- O1 officiel initial : `8b764e664788a602db06f66d79a1987a64a81de9`.
- verify : `0bec4c1552d7c5a1fbb76563ffef9af3da2f0793`.
- Les deux branches ont déjà le même analyseur (blob
  `1f7e5b441c28247f837fd8824c15882eafd08cf8`) et le même package
  (`deec8cfce0b217b8a212e724e171ebd49b043354`), correctif late-run inclus.
- Leur historique diverge : une comparaison GitHub à trois points part de leur
  ancêtre commun. La comparaison exacte des arbres finaux ne trouve que deux
  workflows temporaires supplémentaires sur verify :
  `o1-focused-verify.yml` et `o1-observatory-verify.yml`. Aucun n’est repris.
- Les runs historiques [focused](https://github.com/kalzeirastarossa667/Cookie-mania/actions/runs/36785258928)
  et [observatory](https://github.com/kalzeirastarossa667/Cookie-mania/actions/runs/36785258906)
  sont SUCCESS sur verify : npm ci, npm test, analyze:progression. Ces résultats
  ne remplacent pas une vérification du candidat consolidé.
- Dependabot #35 reste séparée ; versions et lockfile inchangés.

L’analyseur charge le vrai index.html dans une VM Node. GameState, HugeNumber,
Economy et GameEngine fournissent états, coûts, revenus dérivés, prérequis,
quantités Max et récompenses. Aucun catalogue économique dupliqué.
Les candidats sont évalués sur des clones ; seule l’action réussie sur l’état
simulé observé peut produire un événement d’achat.

## Commandes et comparaison

Avec Node 24 :

```sh
npm ci
npm test
npm run analyze:progression
node scripts/analyze-balance.mjs --progression-only --json
npm run analyze:balance
```

test:progression fait partie de npm test et vérifie les petits contrats isolés.
Le workflow Foundation existant lance ensuite les cinq politiques complètes,
chacune répétée pour vérifier le déterminisme. Le long analyze:balance historique
reste séparé de la CI courante (Master §§41/45).

Pour comparer deux versions, conserver les SHA runtime, la version du contrat,
l’identité et les paramètres des politiques, leurs horizons et le même Node.
La sortie JSON inclut événements, tous les jalons, cycles et raisons d’arrêt.
Economy.format arrondit les valeurs économiques finales affichées ; temps,
quantités et durées restent exacts dans la résolution du modèle.
Changer un critère ou une politique impose de changer le contrat ou son identité,
sans présenter ce changement méthodologique comme un effet économique.

## Temps, ordre et arrêts

Le modèle préexistant du Master §40.1 est conservé :
revenu continu = CPS réel + récompense réelle par clic × fréquence hypothétique.
totalClicks n’est pas incrémenté ; ce compteur ne participe pas à l’économie
actuelle. Réexaminer ce modèle si une mécanique future dépend de clics discrets
ou de leur compteur. Aucune fréquence n’est imposée au runtime joueur.

Les décisions arrivent aux secondes entières. L’attente jusqu’au coût sélectionné
est calculée avec Economy/HugeNumber, arrondie au supérieur et bornée.
Plusieurs achats peuvent réussir au même instant. Les égalités de score suivent
l’ordre Content, générateurs avant recherches. Le revenu reste constant entre
achats. Les soldes restent HugeNumber ; seules les secondes bornées et les
quantités sont des Number. Aucun RAF, gain hors ligne, sauvegarde ou UI n’est simulé.

Le point de comparaison prestige est 1e12 produits par cycle. Il est observé
après une attente jusqu’à un achat et peut être dépassé : ce n’est pas la recherche
du premier instant mathématique d’éligibilité. La récompense réelle vient de
prestigeCandidate(), sans formule recopiée.

Bornes : un an par cycle prestige, dix ans pour late-run, une heure pour la
sentinelle, 200 000 itérations maximum par fenêtre. Un revenu nul arrête
immédiatement le scénario ; zero-click-1h ne prétend pas simuler une heure.
stopReason distingue target-reached, no-income, horizon, step-limit et
not-started pour les cycles non commencés.

## Événements : critères stables

atSeconds est le temps cumulé depuis le début du scénario ; cycle commence à 1.
Chaque clé désigne sa première occurrence dans tout le scénario, même après
réinitialisation des possessions par prestige. Les événements simultanés conservent
l’ordre d’enregistrement.

| Clé | Définition |
| --- | --- |
| first-generator | Premier achat réussi faisant passer la possession totale de zéro à une quantité positive. |
| generator:ID | Premier achat réussi faisant passer ce générateur de zéro à une possession positive. |
| first-x10 | Appel réel buyGenerators(ID,10) retournant exactement 10. Jamais dix appels ×1. |
| first-max | Appel réel buyMaxGenerator(ID) retournant une quantité positive, même une unité. Les politiques bulk attendent volontairement au moins deux unités. |
| first-research / research:ID | buyUpgrade(ID) a réussi. Une recherche abordable ou visible seule ne compte pas. |
| era:ID | Première possession réelle d’un générateur de cette ère dans GENERATOR_ERAS. Ce n’est pas une nouvelle règle de déblocage. |
| first-advanced-generator / advanced-generator:ID | Première acquisition hors de workshop, puis première acquisition de chaque générateur concerné. |
| specialization:first-access / specialization:ID | Première observation d’une recherche avec requiresGenerator dont upgradeQuote n’est ni locked ni unknown. Les prérequis sont satisfaits ; insufficient signifie accès sans achat ni abordabilité. |
| first-prestige / prestige:N | Cible de fenêtre atteinte et prestigeCandidate() non nul à récompense positive accepté comme nouvel état en mémoire. Aucun commit de sauvegarde ni confirmation UI simulé. |

Après achat générateur : premier générateur, générateur précis, ère, avancé précis,
premier avancé, contrôle bulk, puis spécialisations.
Après recherche : recherche précise, première recherche, puis spécialisations.
Après prestige : prestige:N puis first-prestige s’il est absent.

Tous les jalons du catalogue sont préinitialisés avec
`{reached:false,atSeconds:null,cycle:null,detail:null}` et restent dans milestones
même s’ils n’apparaissent pas dans events. Les détails d’achat donnent API, mode,
ID, quantité et possession finale.
cycleDurationSeconds désigne uniquement une durée terminée par prestige.
Pour une fenêtre continue ou un cycle incomplet/non commencé, elle est null ;
observedSeconds indique la durée effectivement simulée.
Tous les cycles prestige demandés restent présents si le premier bloque.

## Politiques diagnostiques

Aucune ne représente le joueur optimal. Le classement coût/gain porte uniquement
sur le revenu immédiat, sans anticipation des futures synergies ou portes.

| Politique | Contrat |
| --- | --- |
| single-efficiency-2-clicks | 2 clics/s continus ; achats unitaires/recherches disponibles classés par coût/gain ; trois prestiges sans dépense d’Éclats. |
| x10-then-max-2-clicks | Réserve pour un vrai ×10, puis Max d’au moins deux unités ; ensuite classement unitaire/recherche ; un prestige. |
| max-then-x10-2-clicks | Même principe, Max puis ×10 ; un prestige. |
| late-run-5-clicks | 5 clics/s ; dix Curseurs d’abord, puis une unité de chaque autre générateur dans l’ordre Content ; aucune recherche ni prestige ; arrêt après acquisition du Creuset des origines. |
| zero-click-1h | État frais sans clic ni production ; tous jalons non atteints ; arrêt no-income à 0 s. |

La priorité des dix Curseurs permet de dater réellement l’accès à une
spécialisation avant d’acquérir les autres générateurs. Cette sonde instrumentale
n’est pas un rééquilibrage.
hold/sequential/click-priority/production-priority historiques restent dans
analyze:balance.

## Exemple Foundation 2.9

Secondes simulées, contrat v1. Ces dates ont été reproduites pendant consolidation
avec le vrai code dans l’isolate JavaScript V8 des outils ; ce n’est ni Node 24 ni
un navigateur. Les journaux CI de la PR officielle doivent confirmer la mesure
sous Node 24. Les dates communes concordent avec les logs historiques de 0bec4c1.

| Jalon | Unitaire 2 clics/s | ×10 puis Max | Max puis ×10 | Late-run 5 clics/s |
| --- | ---: | ---: | ---: | ---: |
| Premier générateur / Atelier | 8 | 153 | 17 | 3 |
| Premier ×10 | non atteint | 153 | 172 | non atteint |
| Premier Max | non atteint | 179 | 17 | non atteint |
| Première recherche | 88 | 188 | 181 | non atteinte |
| Accès spécialisation | 94 | 153 | 172 | 39 |
| Orbite / premier avancé | 1 399 | 1 491 | 1 483 | 1 019 |
| Cosmos | non atteint | non atteint | non atteint | 173 562 |
| Infini | non atteint | non atteint | non atteint | 1 464 182 |
| Premier prestige | 25 141 | 25 218 | 25 210 | non atteint |

Unitaire : cycles **25 141 / 22 828 / 20 923 s**, cumul **68 892 s**.
Late-run : Creuset acquis à **3 638 763 s**, 25 achats ; aucune durée prestige
attribuée à cette fenêtre continue. Sentinelle : tous jalons explicitement absents.

## Vérifications et limites

- Cinq politiques exécutées chacune deux fois, comparaison JSON exacte.
- Chronologie monotone, temps finis, jalons non atteints, cycles et arrêts explicites.
- Instrumentation d’une instance réelle GameEngine : ×10 appelle buyGenerators
  une fois avec 10 ; Max appelle buyMaxGenerator puis sa délégation interne, sans
  boucle ×1. Évaluer un candidat ne mute pas l’état observé.
- Régression reproduite avant correction : observeTimelineAction appelé directement
  avec un achat refusé enregistrait first-generator malgré quantity=0. La boucle
  principale bloquait déjà cette situation ; le point d’observation se protège
  désormais lui-même. Test également d’un Max réussi à une unité.
- Les dix premières acquisitions late-run sont des Curseurs ; spécialisation à la
  dixième, puis Grand-mère, avec un coût d’attente cohérent.
- Vérification des mantisses/exposants HugeNumber et compteurs avant formatage à
  chaque mutation observée ; round-trip, arithmétique fractionnaire et 1e1000 ;
  NaN/Infinity injectés sont refusés. Propriétés générales dans check-properties.
- Diff complet et blobs contrôlés contre main : index.html, constantes, schéma,
  package-lock et suites runtime existantes restent inchangés.
- Résultats exacts Node/CI et navigateur rapportés dans la PR, avec SHA.
  Les succès historiques ne remplacent pas les tests du candidat.

Limites : politique myope, clic continu hypothétique, résolution à la seconde,
dépassement possible du seuil prestige, environ 15 chiffres de précision
HugeNumber, horizons bornés, aucune estimation d’endurance humaine.
Accès à une spécialisation ne signifie pas achat ; les mesures ne certifient pas
l’équilibrage. Aucun test physique nouveau n’est effectué. Chromium et Pixel 5
émulé restent distincts des contrôles physiques historiques.
PR non fusionnée avant audit indépendant ; O2/O3/E1/E2 hors périmètre.
