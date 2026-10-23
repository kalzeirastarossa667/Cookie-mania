# O2 — diagnostics du rythme de progression

Contrat **v1**, 22 octobre 2026. Base : `ef81233cde248161926c942ab7aafd9f2432b8ad`,
O1 fusionné via PR #36. Le jeu reste Foundation 2.9, sauvegarde v7.
O2 ne modifie ni `index.html`, ni les règles économiques, ni les cinq politiques O1.

**État actuel : les trois compléments descriptifs sont implémentés, en attente
d'audit indépendant avant acceptation d'O2.** Voir le [contrat économique et ses
mesures](Cookie_Empire_O2_Economic_Diagnostics.md), Master §55.7 et le HEAD de la
PR #37. Le contrat pacing v1 est conservé ; `pacing.economics` ajoute un bloc v1.
La revue historique de couverture ci-dessous explique les écarts alors constatés.

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

### Contrat des observations refusées

Tout appel à `observe`, réussi ou refusé, porte un temps entier sûr, positif ou
nul, au moins égal à celui du dernier appel valide. `finish` ne peut pas précéder
cette dernière observation. Un refus valide (`ok:false`, `quantity:0`) avance
seulement cette borne chronologique : il ne compte pas comme achat, n'ajoute pas
d'unités et ne découpe pas l'intervalle entre achats réussis. Son action n'est pas
enregistrée comme achat. Une entrée invalide ne modifie aucun état du collecteur.

Avant cette correction, le retour anticipé ignorait notamment NaN, Infinity,
les temps négatifs, fractionnaires, non sûrs ou antérieurs au dernier achat.
Le vrai analyseur n'envoie actuellement que des achats réussis : le défaut est
celui du contrat du collecteur, sans erreur reproduite dans les cinq politiques.
Une borne de dernière observation distincte du dernier achat évite aussi
d'accepter un achat ou une fin de fenêtre antérieurs à un refus valide.

Le test ciblé échoue sur `f06b1b8` puis passe après correction. Il couvre les
temps invalides, les retours temporels après refus, l'égalité des temps, une
fenêtre composée seulement de refus et l'égalité complète du rapport avec une
trace sans refus. Les six groupes d'audit précédents restent en place.

Après correction sous Node 24.19.0 : `npm ci`, `npm test` (224/224 Foundation,
propriétés, interface, 169 DOM, contrats O1 et 7 groupes O2) et les cinq politiques
répétées passent. Le JSON complet est byte-identique au candidat `f06b1b8`.
Les nouveaux résultats CI Foundation/Browser et leur HEAD exact sont consignés
dans la PR #37 ; aucune validation sur téléphone physique n'est revendiquée.

## Revue historique de couverture avant le complément économique

La consigne initiale O2 du 7 octobre, retrouvée dans le contexte de reprise,
mentionne attentes, murs, accélération, contribution marginale, obsolescence
potentielle, prestige et croissance numérique. La mémoire du dépôt §16 conserve
ces intentions générales. Master §55.1–55.3, rédigé le 22 octobre, spécifie un
sous-ensemble mesurable : il ne prouve pas une autorisation antérieure d'abandonner
les autres objectifs. Cette revue corrige cette ambiguïté sans réécrire O1.

| Objectif initial | Preuve dans le code / couverture actuelle | Décision pour terminer O2 |
| --- | --- | --- |
| Attentes et temps morts | `createPurchaseObserver` : toutes transactions réussies, maximum et cinq plus longs intervalles, fin censurée et compteurs ; `validatePurchaseWindows` recoupe O1 | Indispensable, couvert après correction des refus. Il s'agit d'attentes sans achat, pas d'inactivité humaine. |
| Transitions et spécialisations | `diagnosePacing` : écarts entre ères et accès → achat, statuts pour absences/cycles distincts | Indispensable, couvert dans le modèle O1. |
| Prestige et accélération | `prestigeCycles` : durées consécutives, ratios et réductions ; O1 conserve seuils et récompenses | Indispensable, couvert pour les cycles et politiques observés ; aucune conclusion générale sur la puissance du prestige. |
| Murs de progression | Intervalles, délais, jalons non atteints, horizons et raisons d'arrêt constituent des signaux descriptifs | Minimum descriptif couvert. Les 889 135 s late-run sont une attente sous stratégie restrictive, pas un mur démontré. Classification automatique et seuils universels reportés. |
| Contribution marginale des achats | `evaluateAction` calcule un gain de revenu et coût/gain pour choisir une action sur une copie d'état ; O2 ne les mesure ni ne les publie pour les transactions réelles. Le nombre d'unités n'est pas une contribution économique | **Manquant, indispensable avant de déclarer O2 initial terminé** : coût réel, delta CPS et delta clic/revenu modélisé avant/après achat réussi, avec mode, quantité, cycle et politique ; résumé borné par type d'achat. |
| Obsolescence potentielle des générateurs | O1 indique les premières possessions ; O2 compte globalement les achats. Ni part de revenu par générateur ni évolution de son gain relatif ne sont publiées. Absence d'achat ≠ obsolescence | **Manquant, indispensable au niveau indicateur** : relever à des points déterministes par ère/cycle la contribution CPS/clic et le gain relatif d'un achat comparable par générateur, avec disponibilité et limites de politique. Le verdict universel d'obsolescence est reporté. |
| Croissance numérique | `assertEconomicState`, `assertFiniteTree` et les tests de propriétés vérifient canonicité/finitude ; ils ne publient pas la trajectoire ou les maxima des grandeurs | **Manquant, indispensable au niveau observation** : maxima et relevés bornés à jalons fixes des cookies, production totale, CPS, récompense clic et prestige, avec temps/cycle et représentation HugeNumber ; distinguer les remises à zéro. Stress exhaustif et seuils de danger extrapolés reportés. |

**Décision de cette passe :** réparer seulement le contrat des refus et rendre
les écarts explicites. Les trois mesures minimales manquantes restent des
conditions de clôture d'O2, à spécifier et traiter dans une passe complémentaire
O2 après le nouvel audit indépendant. Elles ne sont ni réputées livrées, ni
transférées silencieusement à O3. La CI verte valide le code exécuté, pas la
complétude du cahier des charges. O2 ne doit pas être déclaré terminé à ce stade.

Cette restriction était celle de la passe des refus au HEAD `8e9a75e`.
L'autorisation ultérieure du propriétaire lance désormais les trois compléments
O2 décrits dans le rapport économique ; aucune nouvelle phase n'est lancée.

Leur future spécification devra préserver les vraies API et les politiques,
séparer CPS et clics hypothétiques, utiliser HugeNumber sans conversion naïve en
Number et borner les observations. Les agrégats de gains locaux ne seront pas
présentés comme une attribution causale globale, notamment avec les synergies.

**Reports explicites à une phase ultérieure d'analyse économique**, à cadrer
séparément avant tout rééquilibrage : recherche de stratégie optimale, preuve
d'obsolescence pour toutes les stratégies, classification automatique des murs
ou d'un prestige trop puissant, calibration par sessions humaines, et stress
numérique exhaustif/extrapolation très long terme. Ces travaux demandent des
contrefactuels, seuils justifiés ou données joueur absents des cinq sondes ; ils
ne sont pas nécessaires pour livrer des indicateurs descriptifs O2 honnêtes.
Ce report ne lance aucune nouvelle phase et ne change pas le rôle d'O3 comme
future référence comparative.

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

## Audit du code O2 — 22 octobre 2026

Périmètre : `scripts/pacing-diagnostics.mjs`, `scripts/check-pacing.mjs` et leur
branchement dans l'analyseur. Les constats concernent la robustesse du diagnostic
face à des données incohérentes ou à une régression d'instrumentation ; aucune
erreur dans les résultats des cinq politiques actuelles n'a été reproduite.

| Constat reproduit avant correction | Conséquence | Correction |
| --- | --- | --- |
| Une liste de fenêtres vide était acceptée pour des cycles observés | O2 pouvait réussir sans mesurer les achats | Une fenêtre obligatoire par cycle commencé, avec recoupement cycle, début, durée, compteurs et motif d'arrêt |
| Des quantités incompatibles avec le mode d'achat et des temps fractionnaires ou non sûrs étaient acceptés | Les libellés et les observations pouvaient devenir trompeurs | Contrôle avant mutation du collecteur, secondes entières sûres |
| Deux jalons sans identité de cycle pouvaient produire un délai ; les cycles 1 et 3 étaient traités comme successifs | Comparaisons sans identité fiable | Identités et booléens explicites, numérotation consécutive des cycles |
| Les fenêtres fournies au diagnostic n'étaient pas contrôlées, notamment NaN/Infinity | Des valeurs invalides pouvaient devenir `null` dans le JSON | Contrôle des nombres, compteurs, intervalles, ordre et couverture temporelle |

Preuves de régression : cinq nouveaux groupes de tests échouent sur l'ancien
module et passent après correction. Un sixième compare le collecteur borné à
une trace chronologique complète indépendante sur **200 séquences générées**
(graine `22022026`, achats unitaires/×10/Max/recherche et achats simultanés).

Une mutation temporaire de l'analyseur, hors dépôt, désactive uniquement le
collecteur d'achats. Avec l'ancien module, `--pacing --json` termine avec le code
0 et des fenêtres vides ; avec le module corrigé, il termine avec le code 1 et
`O2 missing or inconsistent purchase window`. Ce contrôle porte sur le vrai
chemin d'intégration, en complément des tests unitaires.

Après correction, `npm test` passe : **224/224 Foundation**, propriétés et
interface ciblée, **169 contrôles DOM**, contrats O1, assertions historiques O2
et **6 groupes d'audit**. La sortie JSON complète des cinq politiques répétées
est **byte-identique** à celle d'O2 avant audit sous Node 24.19.0. Le contrat
reste en version 1. L'analyseur, les politiques, le runtime et le lockfile ne
sont pas modifiés par cette correction. Les tests ne constituent pas une preuve
exhaustive pour tout jeu de données arbitraire ni une validation de l'équilibrage.

## Limites et prochaine étape

Les cinq politiques gardent les limites O1 : revenu de clic continu hypothétique,
secondes entières, choix myopes, précision HugeNumber d'environ 15 chiffres,
observation prestige pouvant dépasser le seuil, absence de simulation UI/offline
et de commit de sauvegarde. Les maxima d'intervalles ne mesurent pas l'ennui réel.

O2 ne déclare automatiquement ni mur, ni emballement, ni défaut de design.
Les observations économiques ajoutent contribution marginale, signal de domination
locale et croissance des ordres de grandeur. Recherche optimale, verdict universel
d'obsolescence et stress numérique exhaustif restent hors périmètre.

Instruction de reprise : **laisser la PR #37 ouverte, sans fusion, et ne pas
lancer O3**. La prochaine décision porte sur la revue de cet audit O2. O3 et
E1/E2 restent en attente. Aucune nouvelle mécanique ni modification de prix
n'est incluse ici.
