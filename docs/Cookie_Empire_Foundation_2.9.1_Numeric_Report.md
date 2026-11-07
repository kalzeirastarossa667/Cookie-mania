# Foundation 2.9.1 — candidate numérique

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
