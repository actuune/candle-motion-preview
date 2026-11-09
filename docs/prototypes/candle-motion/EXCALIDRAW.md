# Excalidraw — étude d’une page

**Date :** 9 novembre 2026. **Portée :** étude en lecture seule. Aucun build,
aucune installation, aucune migration React, aucune intégration production.

## 1. Copie locale inspectée

- Dossier : `GITHUB/excalidraw-master/` (copie locale du dépôt amont).
- Licence : **MIT** (`LICENSE`, copyright Excalidraw).
- Application : `excalidraw-app/package.json`, version **1.0.0**, privée.
- Stack : **React 19**, Vite, TypeScript, Yarn **1.22** ; monorepo avec
  `packages/excalidraw`, `packages/element`, `packages/common`, etc.
- Aucun `node_modules` installé, aucun build lancé, aucun service démarré.

## 2. Fonctions réellement utiles ici

| Fonction | Intérêt pour le prototype bougies |
|---|---|
| Scène JSON versionnée | décrire des régions et des annotations de façon lisible |
| Formes et polygones éditables | dessiner les supports à la main |
| Images de fond | poser la graine 4243 comme fond de travail |
| Export PNG/SVG | produire une planche de revue |
| Collaboration temps réel | **aucun besoin** pour un prototype local |
| Bibliothèques de formes | **aucun besoin** |

## 3. Ce qu’Excalidraw ne fournit pas

- Il n’anime pas une image : pas de `renderAtTime`, pas de shader, pas de
  boucle périodique, pas de contrôle de protection pixel.
- Il ne remplace pas le moteur de rendu ; il faudrait de toute façon écrire
  l’animation à côté.
- Il n’existe pas de mode « région animée » ni de contrat de support.

## 4. Coût d’adoption

- Monorepo React 19 + Vite + Yarn, avec de nombreuses dépendances.
- Nécessite une installation et un build, donc une chaîne de plus à maintenir
  pour un usage qui reste local et expérimental.
- La licence MIT est favorable, mais la licence ne résout pas le coût
  d’intégration.

## 5. Recommandation

**Ne pas adopter Excalidraw pour ce prototype.** Aucun besoin concret ne
justifie ses dépendances : les régions sont définies dans un JSON versionné,
éditées par des poignées directement sur le canvas, et le rendu est un module
JavaScript pur sans framework. La page HTML autonome existante couvre le besoin
avec zéro dépendance.

Excalidraw reste un bon outil **hors du dépôt** pour dessiner une planche de
revue ou discuter d’une composition. Si un jour un éditeur de scène multi-objets
avec collaboration devient une exigence produit, la question pourra être
rouverte avec un périmètre et un budget de dépendances explicites.
