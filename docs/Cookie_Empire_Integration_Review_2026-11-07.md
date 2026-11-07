# Revue et préparation d’intégration — 7 novembre 2026

**Statut actuel :** les PR #39 et #37 ont été fusionnées avec l’accord explicite du propriétaire. Les mentions de candidat ou d’attente ci-dessous sont historiques ; voir le [checkpoint d’intégration](Cookie_Empire_2.9.1_Integration_Release.md) pour les preuves finales.

## Résultat

La combinaison de Foundation 2.9.1 Numeric et des diagnostics O2 passe la suite automatique complète. Les cinq simulations répétées produisent exactement les mêmes timelines O1, diagnostics de rythme et diagnostics économiques que le candidat O2 avant correction numérique. Aucun nouveau défaut bloquant reproduit dans le périmètre revu.

Branche de préparation uniquement : `integration/numeric-o2-review`. Ni fusion dans main, ni déploiement, ni ouverture d’O3. Les PR #39 et #37 restent distinctes et ouvertes ; cette branche prépare leur compatibilité sans les accepter à la place du propriétaire.

## Provenance

- main : `ef81233cde248161926c942ab7aafd9f2432b8ad`.
- PR #39 : `c7ab7f22acf91f6fe90f5fead22e48577878cdee` ; code testé `548e0e5c1096c4f34c258c13982b2c31ce8d4896`.
- PR #37 : `f7dd58dc9d769ea12dc44176b406709f583be86e`.
- Runtime combiné : SHA-256 `82fae47a4b6c389d4ef8a8e4f5b6b941f64502b1cd44d9e2f51045e3e010c6b1`, identique au candidat 2.9.1 livré.
- Node local : 24.22.1.

## Travail réalisé

Relecture des modifications numériques, des collecteurs pacing/économie, de leur instrumentation, des tests et des contrats O2. Vérification des coûts réels, quantités ×1/×10/Max, deltas CPS/clic, synergies, ratios, maxima avant dépense et transitions prestige. Les tests économiques incluent 96 achats comparés à un oracle rationnel et des totaux de recherche calculés indépendamment.

La préparation de fusion a révélé trois conflits, résolus sans modifier les calculs :

- `package.json` : conserver les suites pacing, économiques ET numériques dans `npm test`.
- Master : conserver §54.1, §55 O2 puis §56 Numeric, dans cet ordre.
- index documentaire : conserver les liens des deux branches.

Aucun module de runtime ou diagnostic modifié par ces résolutions. Les instructions historiques restent consultables ; le présent checkpoint précise le statut actuel.

## Vérifications

- Suite complète sur la combinaison résolue : 224 Foundation, propriétés, interface ciblée, 169 contrôles DOM, O1, 8 groupes pacing, 16 économiques et 8 numériques : PASS.
- Simulation `node scripts/analyze-balance.mjs --pacing --json` sur copie temporaire O2 + runtime Numeric : code de sortie 0, cinq politiques répétées sans divergence.
- Comparaison structurée exacte avec la sortie O2 pré-correction : `timelines`, `pacing.reports` et `pacing.economics` tous identiques. La provenance du runtime change intentionnellement. Les quatre fichiers utilisés par l’analyseur et le runtime sont identiques à ceux de la branche combinée.
- Comparaison supplémentaire de tous les scripts de la copie temporaire : différence attendue dans les anciens tests d’interface portant le numéro 2.9 ; cette copie servait uniquement à la simulation. La suite complète a bien été exécutée depuis la branche combinée avec les tests 2.9.1.
- Navigateur : preuve antérieure du code runtime identique, CI Browser 42423522923 : 32 PASS, 2 skips attendus, desktop Chromium et Pixel 5 émulé. Aucune nouvelle exécution navigateur revendiquée sur la branche combinée.
- Aucun test sur Android physique.

## Décision proposée et suite

La préparation technique n’expose plus de conflit non résolu et conserve toutes les suites. La prochaine étape est la décision d’intégrer les candidats, puis la CI sur le résultat effectivement fusionné. La restriction explicite du propriétaire sur #37 reste applicable : ne pas fusionner O2 ou démarrer O3 sans son accord. Après acceptation seulement, O3 pourra spécifier une référence comparative versionnée ; aucun rééquilibrage n’est déduit des cinq sondes.

Limites : arithmétique à environ 15 chiffres, politiques simulées et clics hypothétiques, observations bornées. Les résultats ne prouvent ni équilibre universel ni stratégie optimale.
