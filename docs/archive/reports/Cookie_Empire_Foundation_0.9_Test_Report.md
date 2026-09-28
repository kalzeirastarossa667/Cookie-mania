# Foundation 0.9 — rapport de vérification

Date : 2026-09-27.

- 157/157 tests de règles et sauvegarde intégrés réussis ; cadence simulée : 20 affichages et une sauvegarde sur cinq secondes.
- Interface jsdom : démarrage, quatre cartes, thème par défaut, bascule et préférence enregistrée, étiquettes accessibles, achats et prix, ancienne sauvegarde sans mine, bonus par clic et CPS après achat, persistance à la fermeture simulée.
- Audit : données de générateurs centralisées et immuables, rendu avec références DOM conservées, prix formaté une seule fois par carte ; préférence du thème isolée de la sauvegarde v4.
- Essai sur navigateur réel, rendu visuel et lecteur d'écran non vérifiés. Les 58 scénarios DOM historiques de la 0.7 ne sont pas disponibles comme suite autonome.

Risque connu : fermeture brutale sans événement de cycle de vie pouvant perdre environ cinq secondes de progression ; les limites documentées de stockage et de précision restent valables. Prochaine vérification manuelle : mode nuit et clair sur mobile et ordinateur, rechargement, achat de mine, équilibre des clics.
