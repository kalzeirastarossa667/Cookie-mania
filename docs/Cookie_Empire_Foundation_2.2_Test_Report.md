# Foundation 2.2 Rayonnement — rapport de vérification

Date : 2026-09-28 UTC. Baseline : Foundation 2.1 Horizons, commit `1e097e69ebb802f8cad5b9cbb9e649e11a1d2a85`.

## Implémenté

- Éclats d'empire permanents en HugeNumber.
- Prestige disponible à 1e12 cookies produits dans la partie.
- Récompense : sqrt(totalProduced / 1e12).
- Multiplicateur permanent : 1 + 0,10 × Éclats, appliqué aux CPS et à la contribution des générateurs aux clics, pas au clic de base.
- Reset de run transactionnel ; l'état vivant n'est remplacé qu'après confirmation de la sauvegarde.
- Sauvegarde v5 avec migration v1–v4 et validation d'import.
- Interface de prestige dans Parcours avec confirmation explicite.

## Red / green

Le premier passage Foundation après implémentation a échoué, comme attendu, sur les assertions de schéma v4. Après adaptation, trois erreurs résiduelles ont été isolées : helper structuredClone absent du contexte VM et deux assertions de champs persistés encore v4. Elles ont été corrigées sans retirer les protections. Un test supplémentaire injecte ensuite un échec d'écriture pendant le prestige et vérifie que le run vivant reste strictement inchangé.

## Résultats automatiques

- Foundation : **187/187**.
- Interface jsdom ciblée : réussite.
- Constellation/Horizons : **56/56**.
- Cadence : 20 rendus et 1 sauvegarde sur 5 secondes simulées.
- Browser checks GitHub Actions : réussite dans Chromium desktop et émulation Pixel 5.
- Nouveau scénario navigateur : prestige verrouillé sous le seuil, déverrouillage à 1e12, confirmation, +1 Éclat, ×1.1, wallet remis à zéro, Éclat conservé après reload.

## Limites

L'émulation Pixel 5 est un vrai navigateur automatisé, pas un téléphone physique. Le rythme économique du prestige n'a pas encore été validé par une longue partie réelle. La concurrence entre onglets et les limites historiques d'horloge/stockage restent inchangées. Aucun second niveau de prestige ni boutique d'Éclats n'est inclus.
