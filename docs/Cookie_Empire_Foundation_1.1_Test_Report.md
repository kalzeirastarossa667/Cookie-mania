# Foundation 1.1 — rapport de vérification

Date locale Martinique : 2026-09-27.

- Point de départ confirmé par les captures Android de Foundation 1.0 : en-tête complet, achats accessibles et progression à 11/12 étapes. Ces captures ne valident pas les nouveautés 1.1.
- Contenu : mine ×2 CPS pour 25 000 cookies, clic ×3 pour 150 000 cookies (cumulable avec ×2), laboratoire pour 250 000 cookies (+230 CPS et +230/clic), quatre étapes supplémentaires pour un total de seize.
- Compatibilité : même clé, même schéma v4, nouveaux identifiants générateurs absents chargés à zéro, anciens bonus et étapes dérivés des champs sauvegardés.
- Performance et expérience : prix de lots recalculés seulement après changement de possession ; gain du clic affiché via un seul élément réutilisé ; filtre des étapes franchies ; reprise de production après passage en arrière-plan, plafonnée à trente jours.
- `npm test` : 163/163 tests de règles et sauvegarde, vérifications jsdom ciblées dont achats, formule, affichage, compatibilité, mise en arrière-plan et retour d'historique simulés. Cadence : 20 rendus et une sauvegarde en cinq secondes simulées ; aucune avancée de boucle quand la page est cachée.

La disposition et la reprise réelles sur Android n'ont pas encore été observées pour cette version. Les scénarios historiques DOM de la 0.7 ne sont pas disponibles comme suite indépendante. Une fermeture brutale sans événement de sauvegarde peut perdre environ cinq secondes de progression ; limites de précision et stockage documentées dans le Master Dev File.
