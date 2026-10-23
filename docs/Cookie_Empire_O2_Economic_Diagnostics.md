# O2 — complément économique descriptif

Contrat spécifié dans Master §55.7 avant implémentation, 22 octobre 2026 (date
locale). Base auditée : `8e9a75e888bc6d38bb4378ced7d0d9536d3f184c` de la PR #37.
Les trois compléments autorisés sont implémentés ; leur acceptation reste soumise
au nouvel audit indépendant. Aucune fusion, aucun O3/E1/E2, aucun rééquilibrage.

## Compatibilité et accès

Commande inchangée : `node scripts/analyze-balance.mjs --pacing --json`.
Le seul ajout au schéma public est `pacing.economics`, avec son propre
`contractVersion:1` et `reports:[{name,windows}]`. Chaque rapport rejoint sa
timeline O1 par `name` ; fréquence de clic, politique et horizon restent dans
O1. Provenance runtime SHA-256 et version Node restent dans `pacing`.

Tous les anciens champs, versions et valeurs de `timelines` et de `pacing`
(notamment `pacing.reports`) restent identiques. Un consommateur qui impose un
schéma fermé doit autoriser ce nouvel attribut facultatif. Sans `--pacing`, le
JSON O1 reste identique. Le texte ajoute un résumé économique après les anciennes
tables ; le JSON est la sortie détaillée de référence, pas les tables abrégées.

Chaque fenêtre économique comporte `cycle`, `startSeconds`, `observedSeconds`,
`stopReason`, `transactions`, `waits`, `purchaseContribution`,
`generatorRelevance` et `numericGrowth`. Les temps internes sont locaux à la
fenêtre ; ajouter `startSeconds` pour obtenir le temps global. Une fenêtre non
commencée n'a pas de relevé ; une fenêtre de revenu nul a un relevé explicite.

## Nombres et précision

Toutes les grandeurs économiques et les ratios sont des paires HugeNumber
canoniques `{m,e}` : valeur = m × 10^e, sans effectuer cette conversion en Number.
Pour une valeur positive, 1 ≤ m < 10 et `e` est son ordre décimal entier.
Le zéro `{m:0,e:0}` n'a **pas** d'ordre logarithmique. Les ratios de dénominateur
nul valent `null` ; les rapports supérieurs à 1 ne sont pas plafonnés. Un ratio
positif très petit reste une paire, sans sous-flux de conversion vers Number.

Les variations sont `{sign,magnitude}` : signe −1, 0 ou 1 et magnitude positive
ou nulle. Le runtime arrondit à environ 15 chiffres significatifs : un petit
gain ou une petite dépense peut devenir nul par soustraction de valeurs proches.
Cela signifie « non résolu à cette précision », pas « mathématiquement gratuit
ou sans effet ». Les agrégats conservent cette même arithmétique. Les tests à
exposants ±1000 construisent des HugeNumber directement ; ils ne changent ni ne
certifient l'analyseur de chaînes du runtime.

## Contribution marginale des achats

L'instrumentation encadre chaque **achat réellement réussi** par le GameEngine,
avant et après, sans acheter sur un moteur de substitution. `Economy.deriveValues`
fournit CPS et récompense de clic ; le revenu modélisé vaut CPS + récompense de
clic × fréquence hypothétique de la politique, comme dans l'observatoire O1.
Le coût est la diminution réelle du solde retournée par `executeAction`, avec
les limites de précision ci-dessus. ×10 et Max restent des transactions uniques.

Une ligne d'agrégat par `(kind,id,mode)` et par cycle contient :

| Champ | Sens |
| --- | --- |
| `transactions`, `units` | Nombre d'achats réussis et somme des quantités réelles ; une recherche compte pour une unité. |
| `totalCost` | Somme des coûts réels, distincte d'un devis théorique. |
| `changes.{cps,clickReward,modeledIncome}` | Sommes séparées `increases` et `decreases` des deltas mesurés à chaque achat. |
| `first`, `last` | Premier et dernier exemples du groupe : seconde, quantité, coût, taux avant/après et deltas signés. Un groupe d'un achat répète le même exemple. |
| `relativeIncomeChange` dans l'exemple | Signe du delta et magnitude / revenu avant achat ; magnitude `null` si ce revenu est nul. |
| `paybackSeconds` dans l'exemple | Coût / gain de revenu immédiat positif ; `null` si gain nul ou négatif. Heuristique locale, sans projection des futurs achats. |

Les groupes suivent l'ordre de première observation. Pas de journal illimité :
au plus 3 × nombre de générateurs + nombre de recherches, soit **70 groupes**
par fenêtre avec le catalogue actuel, et deux exemples par groupe.
Une recherche déclenchant une synergie porte l'ensemble de son effet immédiat.
Les sommes ne constituent pas une attribution causale de la production future.
Les refus n'entrent pas dans ce collecteur de succès ; un appel direct avec
`ok:false` est rejeté. Le collecteur historique garde son contrat des refus.

## Pertinence des générateurs

Snapshots au début, à la première possession d'un générateur de chaque ère dans
le cycle, puis à la fin. Une ère déjà possédée au début ne crée pas de fausse
acquisition. Même ordre Content pour les acquisitions simultanées. Le début et
la fin restent deux observations distinctes, même à la seconde zéro.

Pour chacun des 16 générateurs : possession ; production et bonus clic de la
pile via `generatorStackCps`/`generatorStackClick` ; contribution au revenu
modélisé ; parts CPS, clic et revenu. Le clic de base reste hors de ces piles :
les parts de clic des générateurs ne totalisent donc pas nécessairement 100 %.

`nextUnit` utilise `generatorUnitCps`, `generatorUnitClick` et `generatorCost` :
gain d'une unité sous les multiplicateurs actuels, coût, gain/revenu actuel,
gain/coût et état `available`, `insufficient` ou `quantity-limit`. Cette métrique
d'unité calculée par Economy est distincte d'un delta avant/après arrondi.

`dominatedBy` liste, dans l'ordre du catalogue, les autres unités actuellement
abordables qui coûtent au plus autant et produisent au moins autant de revenu
modélisé, avec au moins une inégalité stricte. La comparaison exige que l'unité
examinée soit elle-même abordable. `signal` vaut :

- `unowned` : générateur non possédé ; pas de verdict d'obsolescence ;
- `not-assessed-unavailable` : prochaine unité non achetable actuellement ;
- `potential-next-unit-obsolescence` : générateur possédé et unité dominée ;
- `no-local-dominance` : aucun concurrent répondant à ce critère dans ce snapshot.

C'est un signal conservateur à examiner, sans seuil arbitraire de « petite part ».
Il ne considère ni spécialisations futures, ni synergies à débloquer, ni lots,
ni choix humain optimal. L'absence de signal ne prouve pas qu'un générateur est
toujours pertinent. Une part faible ne suffit pas non plus à conclure à un défaut.

## Croissance numérique et prestige

`numericGrowth.samples` conserve les sept grandeurs cookies, totalProduced,
CPS, clickReward, modeledIncome, prestigePoints et prestigeCurrency aux mêmes
points que la pertinence. Au plus **6 snapshots par fenêtre**, chacun contenant
les 16 générateurs pour la pertinence ; le stockage ne dépend pas du nombre de
transactions ou du nombre de secondes simulées.

`numericGrowth.maxima` est mis à jour au début, après **chaque attente simulée**,
après **chaque achat réussi**, puis à la fin. Chaque maximum conserve la valeur,
la seconde et la phase de sa première occurrence. Ainsi, un solde juste avant
une dépense n'est pas perdu. Il s'agit des états visités par le simulateur, sans
échantillonnage artificiel à chaque seconde ni extrapolation très long terme.

`numericGrowth.resetAfter` est `null` hors prestige terminé. Sinon, il contient
la seconde de fin, la phase `prestige-reset` et les valeurs du véritable candidat
de prestige. Ces valeurs sont séparées des maxima pré-reset et correspondent
exactement au début du cycle suivant, s'il existe. Le dernier prestige est lui
aussi représenté, même sans cycle suivant. Zéro, baisse du solde après achat et
remise à zéro ne sont pas assimilés à des anomalies numériques.

## Vérifications et premières observations

Les contrôles d'intégration recoupent cycles, durée, motif d'arrêt, transactions,
unités générateurs et recherches avec O1/O2 existants. Le compte des attentes
est recoupé avec les étapes de simulation ; un hook d'attente manquant échoue.
Les snapshots avant achat doivent correspondre au dernier état observé ; les
coûts sont recoupés avec le solde. Les transitions de prestige sont contrôlées.

Une copie temporaire du vrai analyseur sans le hook `observeWait` échoue avec
le code 1 et `O2 economics: wait coverage`, dès les contrats de simulation.
La copie et les sorties de travail ne font pas partie du dépôt.

Neuf groupes de tests déterministes sur les vraies API couvrent achats simples/
bulk/Max, recherche et synergie, gains nuls et signes, dénominateurs nuls,
domination locale et indisponibilité, exposants ±1000, pics avant dépense,
200 achats pour la borne mémoire, vrai reset, observateurs incomplets et données
invalides. Les 7 groupes O2 historiques, leurs 200 traces générées, les tests
Foundation et les contrats O1 sont conservés.

Mesures Node 24.19.0 des cinq politiques répétées :

| Politique, première fenêtre | Transactions | Groupes | Snapshots | Maximum CPS (m × 10^e) |
| --- | ---: | ---: | ---: | --- |
| Unitaire, 2 clics/s | 719 | 28 | 4 | 1,3950195336 × 10^7 |
| ×10 puis Max | 709 | 30 | 4 | 1,3950195336 × 10^7 |
| Max puis ×10 | 709 | 30 | 4 | 1,3950195336 × 10^7 |
| Late-run, 5 clics/s | 25 | 16 | 6 | 1,54597349653487 × 10^14 |
| Sans clic | 0 | 0 | 2 | 0 |

Exemple unitaire : premier Curseur à 8 s, coût 15 ; gain CPS 0,1 et gain clic
0,1 ; gain de revenu modélisé 0,3/s à 2 clics/s, soit 15 % et retour local 50 s.
Tradition vivante (`expert_grandma`) à 603 s déclenche Atelier complice :
gain CPS 134,7 et gain clic 101,2, tous effets immédiats inclus.

Aucun signal de domination locale n'est observé aux snapshots des cinq politiques
actuelles ; un cas contrôlé avec le vrai moteur prouve que le signal est produit
lorsqu'un Curseur possédé est localement dominé par une Grand-mère abordable.
Ces points espacés ne couvrent pas tous les états intermédiaires.

La sortie O1 et la projection sur tous les anciens champs O2 sont comparées à
`8e9a75e` ; seules les nouvelles observations s'ajoutent. Le détail des derniers
tests Foundation/Browser et leur HEAD exact sont consignés dans la PR #37.
Localement : `npm ci`, **224/224 Foundation**, propriétés, interface ciblée,
**169 contrôles DOM**, contrats O1, **7 groupes O2 historiques + 9 économiques**
réussis ; cinq politiques répétées à l'identique. Comparaison des sorties O1 et
de la projection O2 historique **byte-identique**, même ordre et format JSON.
Runtime, équilibrage, sauvegardes, interface et lockfile restent inchangés.
Une CI verte ne remplace pas l'audit indépendant ni une validation Android réelle.

## Validation approfondie après le HEAD dddf24a — 23 octobre 2026 UTC

Base relue : `main` à `ef81233cde248161926c942ab7aafd9f2432b8ad`, PR #37 à
`dddf24ade0c63b6abcc4f1e15aef670c4789db34`. Revue de tout le diff O2 (14 fichiers),
des instructions, des contrats O1/O2 et des API économiques utilisées.

Trois défauts de frontière ont été reproduits avant correction :

| Défaut | Reproduction et cause | Correction limitée |
| --- | --- | --- |
| Exécution valide rejetée à revenu nul | Le vrai `runEconomicWindow` avec `clickRate:0,maxSteps:1` termine par `step-limit`, car O1 donne priorité à la limite. O2 ne comptait l'étape sans revenu que pour `no-income` et levait `wait coverage`. | Reconnaître cette unique étape terminale lorsque le revenu observé est nul et que les compteurs correspondent. Conserver exactement la priorité et les sorties O1. Tester aussi `maxSteps:0` et le rejet d'une attente omise avec revenu positif. |
| Chronologie économique incomplète acceptée | Un achat à une seconde jamais observée, une fin à 5 s après la dernière observation à 4 s, ou un solde modifié avant `finish` étaient acceptés malgré des compteurs concordants. La fin pouvait ainsi inventer un endpoint et dater incorrectement un maximum. | Les achats et la fin doivent rester à la dernière seconde observée ; les attentes font avancer le temps. Les sept valeurs économiques finales doivent égaler le dernier état observé avant tout ajout aux mesures. Un rejet ne clôt pas l'observateur. |
| Jalons détachés des cycles acceptés | Des jalons au cycle 99 inexistant, dans un cycle non commencé ou hors de l'intervalle observé pouvaient alimenter des délais « mesurés ». Seule la positivité du numéro était vérifiée. | Vérifier l'existence du cycle commencé et l'appartenance de l'horodatage global à son intervalle inclusif. Préserver les événements simultanés à une frontière et les statuts `different-cycles`/`reverse-order` valides. |

Cinq nouveaux tests de régression échouaient sur la version auditée puis passent
après correction. Le cas `maxSteps:1` a également été reproduit en injectant
l'appel dans une copie temporaire du véritable analyseur. Un contrôle d'intégration
permanent couvre maintenant les limites zéro et une étape lorsque O2 est actif.
Les anciens fixtures synthétiques sont rendus cohérents : attente explicite entre
achats horodatés, fin à la dernière seconde observée, jalon du cycle 2 à 140 s
(ce cycle commence à 100 s), absence de jalons hors fenêtre dans les seuls tests
de ratios de durée. Les attentes et résultats testés initialement sont conservés.

Vérifications indépendantes ajoutées, sans nouvelle métrique :

- **96 achats réels** : 16 générateurs × deux possessions initiales (0 et 7)
  × trois modes. Oracle de coût par somme rationnelle exacte des prix individuels
  `base × (23/20)^n` en BigInt, distinct de la formule géométrique/logarithmique
  du runtime. Quantité Max, gains CPS/clic/revenu, variation relative et rentabilité
  sont recoupés ; conversion Number uniquement dans l'oracle de plage finie,
  tolérance relative `3e-12` pour l'arithmétique runtime.
- Recherches calculées à la main : 10 curseurs et 10 grand-mères, spécialisations,
  déclenchement d'Atelier complice, multiplicateur CPS global, clic ×2 et recherche
  CPS seule. Totaux après synergie : CPS 24,2 et clic 25,3 ; la transaction porte
  bien tous les effets immédiats. Aucun écart de formule observé.
- Ratios non plafonnés `7,5 × 10^-1002` et `7,5 × 10^998`, plafond de possession,
  observations sur état récursivement gelé et modification d'une paire exportée
  sans altération du runtime. Les cas existants conservent refus, gains nuls,
  différences négatives, dénominateurs nuls, maxima avant dépense, vrais resets,
  continuité des cycles et couverture manquante.

Les vérifications locales Foundation/propriétés/interface/DOM/O1 et les **8 groupes
O2 historiques + 16 économiques** passent après `npm ci`. Les cinq politiques se
répètent à l'identique. JSON O1 **byte-identique à main** (182 074 octets) ; JSON O2
complet, nouveaux diagnostics inclus, **byte-identique à dddf24a** (2 086 656 octets),
sous Node 24.19.0. La projection O1 instrumentée est aussi identique à O1 seul.
Le lancement Browser local est bloqué par l'absence du binaire Chromium ; sa
tentative d'installation échoue au téléchargement. Les résultats Browser/CI du
nouveau HEAD sont consignés dans la PR #37 après publication, distinctement de
ce blocage local. Aucune nouvelle référence O3 n'est ajoutée au dépôt.

Limites inchangées : précision HugeNumber d'environ 15 chiffres, observation de
transitions et snapshots bornés, revenu de clic hypothétique, signaux de domination
locaux sans verdict d'équilibrage. Les validateurs recoupent l'instrumentation ;
ils ne constituent pas un schéma de désérialisation de JSON arbitraire. Aucune
validation physique Android n'est revendiquée. Runtime, économie, sauvegardes,
interface et contrats O1 restent inchangés. Attendre l'audit indépendant ; aucune
fusion ni ouverture d'O3/E1/E2 n'est autorisée par cette validation.
