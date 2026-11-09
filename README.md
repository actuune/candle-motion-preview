# Éditeur de scène des bougies — bundle public v2

Ce dépôt public est un **bundle de revue** de l’éditeur de scène local consacré
au groupe **Bougies**. Il contient la page autonome, le projet JSON v2, le
schéma, les tests et les recettes. Il ne contient **aucun MP4, aucun master,
aucune image de validation hors du fond diagnostique**.

La graine 4243 n’est **pas une œuvre approuvée**. Ce bundle ne remplace ni la
vidéo LTX rejetée ni une revue visuelle humaine.

## Ouvrir la page

La page est publiée par GitHub Pages (branche `main`, dossier `/`) :

`https://actuune.github.io/candle-motion-preview/docs/prototypes/candle-motion/`

La racine du site redirige vers cette page. En local :

```bash
cd candle-motion-public
python3 -m http.server 8794 --bind 127.0.0.1
# puis http://127.0.0.1:8794/docs/prototypes/candle-motion/
```

La page est autonome : aucune bibliothèque externe, aucune police distante,
aucun build. Le PNG de fond est servi sur la même origine. Une **seule requête
locale** est effectuée lors de l’import d’un projet pour relire les octets du PNG
et vérifier son SHA-256 ; il n’y a aucun appel externe.

Libellé exact affiché :

**Motion intention preview—not a prediction of AI output.**

## Contenu v2

| Fichier | Rôle |
| --- | --- |
| `docs/prototypes/candle-motion/index.html` | page autonome : scène groupée, rendu déterministe, édition, projet, checks |
| `docs/prototypes/candle-motion/motion-plan.candles-4243.json` | projet `candle-motion-project/v2`, source de vérité |
| `docs/prototypes/candle-motion/motion-plan.schema.json` | schéma du projet v2 |
| `docs/prototypes/candle-motion/README.md` | documentation détaillée du prototype |
| `docs/prototypes/candle-motion/RECIPES.md` | bougies implémentées ; feuillage et tissu documentés seulement |
| `docs/prototypes/candle-motion/EXCALIDRAW.md` | étude Excalidraw, non adopté |
| `docs/prototypes/candle-motion/PORTAL.md` | concept séparé de portail récursif |
| `tests/test_candle_motion_plan.mjs` | contrôles déterministes Node |
| `validation/2026-11-09-video-test/RECONCILIATION.md` | rejet vidéo, comptes, géométrie, audio |
| `validation/2026-11-09-reconstruction-v2/outputs/reconstruction-seed-4243.png` | fond diagnostique, 1280×1024, non approuvé |

## Ce que fait l’éditeur

- Groupe `Bougies` : **8 flammes**, **7 lumières**, 15 supports.
- Sélection depuis l’image et la liste de scène, multi-sélection.
- Précédence affichée **override d’élément > réglage de groupe > preset**.
- Cinq presets versionnés, dont **Sobre** pour un mouvement retenu.
- Contrôles partagés : amplitude, vitesse harmonique, inclinaison, intensité,
  vent, variation, seed.
- Contrôles par flamme : taille, ancre de mèche, réponse au vent, phase,
  multiplicateur d’intensité, lumières locales liées.
- Vent commun seedé et périodique, avec réponses individuelles.
- Activation/désactivation sans masquer l’élément ; opérations **Protéger**,
  **Animer** et **Transformer** distinctes. Transformer reste une proposition non
  exécutable.
- Corrections manuelles du support : polygone, rectangle, brosse.
- Undo/redo, comparaison avant/après, contrôles déterministes.
- Export/import de projet JSON, sans image dupliquée. L’import vérifie les
  dimensions et le SHA-256 ; une différence bloque et demande un remappage.
- Aucune détection automatique ni segmentation promptable n’est branchée.

## Vérifier

Depuis la racine du dépôt :

```bash
node tests/test_candle_motion_plan.mjs
```

Sortie attendue : `test_candle_motion_plan: ok`, avec 8 flammes, 7 lumières,
5 presets, boucle bit-identique et protection native **0 octet hors supports**.

Les checks intégrés à la page se lancent avec **Lancer les vérifications**.
Ils couvrent à 320×256 la précédence, le déterminisme, la boucle, la continuité,
la protection, la désactivation, les échantillons et la luminance, puis à
**1280×1024 natif** la boucle et la protection sur le fond décodé réel.

## Notes pour une revue outillée

- Pour une analyse de code : commencer par ce README, puis le projet v2, le
  schéma, `README.md` et `index.html`.
- La page est une application canvas : un navigateur headless peut afficher une
  frame, mais les boutons, la sélection, les masques et les checks demandent une
  interaction.
- Les checks ne prouvent ni le photoréalisme, ni l’accord avec LTX, ni un export.
- La page n’est pas un master et le fond 4243 reste non approuvé.

## Contexte

La vidéo diagnostique LTX de la graine 4243 est **rejetée pour la production** ;
le MP4 d’origine est conservé hors de ce dépôt. La réconciliation des deux
revues (frames 0/24/48/72/96) est dans
`validation/2026-11-09-video-test/RECONCILIATION.md` : ouvertures et flammes en
hausse, translation verticale d’environ 200 px, aucune trajectoire caméra exacte
revendiquée.

## Limites

Flammes stylisées, non photoréalistes ; nettoyage local par atténuation, non
reconstructif ; lumière additive non physique. Feuillage et tissu sont des
recettes documentées, pas des simulations implémentées. Aucun exporteur vidéo,
aucun rendu final, aucun master. Le prototype est un aperçu d’intention, pas une
prédiction de la sortie IA.

## Source et droits

Bundle public de la v2 issue de `studio-ltx`, branche
`feature/candle-group-editor`, commit `c36bfbe`, sans historique ni médias
lourds. Aucune licence n’est ajoutée. La graine 4243 reste non approuvée : ne pas
la réutiliser comme master ni comme artwork validé.
