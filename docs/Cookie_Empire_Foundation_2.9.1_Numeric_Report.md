# Foundation 2.9.1 — candidate numérique

**Statut actuel :** les PR #39 et #37 ont été fusionnées avec l’accord explicite du propriétaire. Les mentions de candidat ou d’attente ci-dessous sont historiques ; voir le [checkpoint d’intégration](Cookie_Empire_2.9.1_Integration_Release.md) pour les preuves finales.

Base : main `ef81233cde248161926c942ab7aafd9f2432b8ad`, 7 novembre 2026. PR O2 #37 inchangée et non fusionnée. Contrat : Master §56 ; §55 réservé au contrat O2 de sa branche.

## Changements

- Rejeter les exposants fractionnaires au niveau HugeNumber, y compris les champs économiques chargés depuis les anciens formats. Conserver la normalisation historique des mantisses avec exposant entier.
- Parser les chaînes positives sous le domaine Number sans les écraser à zéro ; normaliser les Number subnormaux via leur écriture scientifique.
- Saturer totalClicks à MAX_SAFE_INTEGER en continuant à créditer les clics.
- Conserver schema v7, clés, catalogue, prix, multiplicateurs, temps et règles de prestige.

## Preuves

Les tests ajoutés précèdent les corrections. Premier passage : quatre échecs numériques et un contrôle de compatibilité vert. Deuxième reproduction séparée : le compteur dépasse son domaine sauvegardable après un clic à sa limite. Les huit groupes ciblés passent après correction, avec les 224 Foundation, propriétés, interface, 169 DOM et O1.

Le test historique d’import de mantisse subnormale attendait un refus parce que sa normalisation était invalide. Cette attente est explicitement remplacée : le négatif reste rejeté et une nouvelle assertion exige que le subnormal normalisé soit importable. Les autres protections d’import sont conservées.

Deux parcours Playwright ajoutés couvrent la conservation d’une sauvegarde à exposant corrompu et la sauvegarde/relecture après saturation des clics. Résultats navigateur du candidat à consigner après CI ; ne pas réutiliser ceux de Foundation 2.9 comme preuve de cette correction.

## Limites

Précision ~15 chiffres inchangée. L’exposant reste un Number fini entier, pas un entier arbitrairement précis. Une donnée volontairement corrompue n’est pas réparée automatiquement. La saturation du compteur ne conserve pas le nombre de clics au-delà du plafond ; les gains continuent. Aucune validation sur Android physique, aucun rééquilibrage et aucune acceptation d’O2.

## Validation finale du code — 7 novembre 2026

Le statut navigateur en attente ci-dessus est désormais clos pour le code `548e0e5c1096c4f34c258c13982b2c31ce8d4896` (PR #39) :
- [Foundation CI 42423522958](https://github.com/kalzeirastarossa667/Cookie-mania/actions/runs/42423522958) SUCCESS.
- [Browser CI 42423522923](https://github.com/kalzeirastarossa667/Cookie-mania/actions/runs/42423522923) SUCCESS, journal vérifié : **32 PASS + 2 skips attendus**, Chromium desktop et Pixel 5 émulé. Les deux nouveaux parcours passent sur les deux projets.
- Les cinq timelines O1 recalculées sont identiques à la référence de l’audit pré-correction.
- Les 8 contrôles pacing et 16 économiques d’O2 passent aussi sur une copie temporaire utilisant ce runtime ; cela n’est pas une acceptation ni une modification de la PR #37.
- Catalogue, Economy, SaveSystem, GameUI et orchestration temporelle sont identiques à main ; syntaxe et diff sans erreur.
- Runtime livré SHA-256 : `82fae47a4b6c389d4ef8a8e4f5b6b941f64502b1cd44d9e2f51045e3e010c6b1`.

La consignation de ces résultats ne change que la documentation. Le candidat n’est ni fusionné ni déployé. Android physique reste non vérifié.
