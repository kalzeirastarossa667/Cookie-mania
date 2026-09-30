# Cookie Empire

**Foundation 2.9 — Visual & Guidance** : clicker autonome avec **16 générateurs**, **22 recherches**, **44 objectifs** et un système de **prestige permanent à branches**, désormais accompagné d’une hiérarchie visuelle renforcée et d’un guidage joueur explicite.

## Jouer

Télécharger `index.html` puis l'ouvrir dans un navigateur. La page de fichiers GitHub n'est pas un jeu hébergé.

- **Empire** : cookie central, prochain objectif et destinations.
- **Atelier** : seize générateurs dans quatre régions ; descriptions pédagogiques ; détails progressifs avec production de pile, contribution au clic, part des CPS, gain de la prochaine unité et spécialisation ; filtres ; achats ×1 / ×10 / Max ; estimation du temps avant achat.
- **Recherche** : bonus permanents, prérequis manquants expliqués par leur nom réel, huit spécialisations des anciens générateurs et quatre synergies. Le Parcours contient aussi un arbre permanent de cinq améliorations : racine commune, voies Clic et Production, puis convergence. Les voies restent non exclusives.
- **Parcours** : quarante-quatre objectifs, prochaine action contextualisée et prestige à partir de 1 billion de cookies produits dans la partie, avec contrat visible **PERDU / CONSERVÉ / GAGNÉ**.
- **Donner mon avis** : pseudo et note facultatifs, commentaire obligatoire ; l’envoi reste sur la page et ne joint aucune donnée de sauvegarde.

Mode galaxie par défaut, thème clair disponible, ressources persistantes et clic accessible depuis les autres vues. Foundation 2.9 ajoute des accents distincts pour Atelier, Orbite, Cosmos et Infini ainsi qu’un mouvement ambiant limité aux couches décoratives ; le bouton cookie lui-même n’est pas animé en continu et `prefers-reduced-motion` est respecté. Les protections 2.8.1 (timing), 2.8.2 (dégagement de navigation mobile) et 2.8.3 (menu « … » au-dessus du HUD) restent couvertes. Le gameplay et les sauvegardes restent autonomes ; seule la section **Donner mon avis** utilise Formspree et nécessite Internet au moment de l’envoi.

Pour reprendre une partie dans un nouveau fichier téléchargé, **Exporter les données** depuis l'ancien jeu, puis **Importer une partie** dans le nouveau. Les sauvegardes v6 migrent vers le schéma v7 avec une boutique permanente vide. Les sauvegardes v5 initialisent toujours le portefeuille d’Éclats depuis le Rayonnement total ; les sauvegardes v1 à v4 migrent avec Rayonnement et Éclats à zéro. Les nouveaux générateurs commencent à zéro. Les synergies sont dérivées des recherches possédées et n’ajoutent aucun champ sauvegardé. Le retour à une ancienne version après des achats nouveaux n'est pas pris en charge.

## Développer

- [Master Dev File v3.0](docs/Cookie_Empire_Master_Dev_File_v3.0.md), source de vérité.
- [Rapport Foundation 2.9 Visual & Guidance](docs/Cookie_Empire_Foundation_2.9_Visual_Guidance_Report.md).
- [Rapport Foundation 2.8.3 Menu](docs/Cookie_Empire_Foundation_2.8.3_Menu_Report.md).
- [Rapport Foundation 2.8.2 Mobile](docs/Cookie_Empire_Foundation_2.8.2_Mobile_Report.md).
- [Rapport Foundation 2.8.1 Timing](docs/Cookie_Empire_Foundation_2.8.1_Timing_Report.md).
- [Rapport Foundation 2.8 Quality](docs/Cookie_Empire_Foundation_2.8_Quality_Report.md).
- [Rapport Foundation 2.7.2 Feedback](docs/Cookie_Empire_Foundation_2.7.2_Feedback_Report.md).
- [Rapport de stabilisation Foundation 2.7.1](docs/Cookie_Empire_Foundation_2.7.1_Stability_Report.md).
- [Rapport Foundation 2.4](docs/Cookie_Empire_Foundation_2.4_Test_Report.md).
- [Clickers GitHub étudiés et décisions retenues](docs/Cookie_Empire_GitHub_Research_2.1.md).
- Node 24 : `npm ci`, puis `npm test`. `npm run analyze:balance` rejoue séparément l’observatoire déterministe de pacing.

Sur la phase C verte, la suite exécute **224/224** cas Foundation, les propriétés déterministes, les vérifications d’interface ciblées et **169** assertions Constellation. Playwright déclare 28 cas : **26 PASS** et **2 skips attendus** selon le viewport. Elle couvre notamment axe en thèmes sombre/clair, les régressions 2.8.1/2.8.2/2.8.3, les métriques de générateur, le guidage prestige/recherche et les garde-fous visuels Foundation 2.9. Le test physique Android reste une validation séparée de l’émulation Pixel 5.

Ces résultats Node/jsdom ne certifient pas le rendu sur un téléphone réel. Lire le Master, spécifier chaque mécanique puis vérifier ses effets avant de poursuivre. Les références externes ont inspiré des principes de conception ; aucun de leurs assets ou codes n'est embarqué.

## Organisation du dépôt

- [Documentation actuelle](docs/README.md) et [méthode de travail](docs/WORKFLOW.md).
- `index.html` : jeu courant ; `scripts/` : vérifications ; `docs/archive/` : historique documentaire ; `archive/releases/` : anciens prototypes.
- GitHub Actions vérifie le code ; Dependabot regroupe les mises à jour routinières sur une cadence mensuelle. Les dépendances de développement ne sont pas embarquées dans le jeu.
