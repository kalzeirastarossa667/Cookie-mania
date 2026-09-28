# Foundation 2.1 Horizons

Date: 2026-09-28 UTC / 27 septembre 2026 en Martinique. Baseline: Constellation 2.0.

## Résultat

- 16 générateurs, 22 recherches et 44 objectifs.
- 8 spécialisations pour les générateurs historiques : à partir de 10 unités, achat permanent doublant leur production et leur contribution aux clics.
- Atelier filtrable par région, possibilité d'achat, possession et découverte.
- Cookies manquants et attente estimée à production constante, sans présumer une fréquence de clic.
- Liens de destination et de prérequis qui retrouvent un générateur même après filtrage.

## Correction reproduite

Avant correction, provoquer une exception dans la dérivation des gains pendant un achat de générateur laissait le coût débité et la possession augmentée. Le test échouait contre 2.0. L'achat prépare maintenant les nouveaux nombres, possessions et valeurs dérivées avant de les appliquer. Le même test passe, avec état inchangé en cas d'échec. Les identifiants invalides bénéficient aussi d'un contrôle explicite ; leur test passait déjà avant cette consolidation.

## Tests allégés

Les régressions de développement ont quitté `index.html` pour `scripts/foundation-cases.js`. Elles s'exécutent uniquement avec `npm test`, une fois, au lieu d'être également relancées à chaque démarrage du jeu et dans chaque DOM de test. Quatre tests spécifiques à quelques générateurs ont été remplacés par deux cas paramétrés couvrant les seize. Deux assertions de thème redondantes ont été retirées de la suite Constellation ; la suite précédente couvre déjà cette préférence.

Les tests de sauvegarde, récupération, import, calcul et temps restent présents : ils protègent des comportements concrets et des défauts historiques.

## Résultats automatiques

Commande : `npm test`.

- 181/181 cas de règles, économie, persistance et régression réussis.
- Suite d'interface existante réussie après adaptation des tailles de catalogue.
- 56 vérifications Constellation/Horizons réussies sous jsdom.
- 20 rafraîchissements et une sauvegarde sur cinq secondes simulées ; aucun tick caché.
- Sur 20 rendus sans changement de recherches : zéro recalcul de multiplicateurs UI ou de production unitaire.
- Sur un rendu inchangé : zéro mutation enfant/texte dans l'atelier.
- Invalidation du cache vérifiée après changement des recherches ; les 16 taux sont reconstruits.
- Le moteur ne consomme aucun cache de l'interface.

Le HTML passe de 224 991 à 155 595 octets, soit environ 31 % de moins malgré le contenu ajouté. Cela mesure la taille du fichier, pas les FPS ni le temps de chargement sur téléphone.

## Limites

Tests Node et DOM simulé ; pas de capture ni de validation d'un navigateur réel pour cette version. L'ancienne restriction d'accès navigateur n'a pas été contournée. Les prix sont un premier équilibrage, pas une durée de jeu garantie. Sauvegardes v4 et clé inchangées ; nouveaux générateurs absents dans une ancienne sauvegarde initialisés à zéro. Les limites de précision, d'horloge locale, de stockage entre fichiers téléchargés et de concurrence entre onglets restent celles de 2.0.
