# Prototype de mouvement des bougies — bundle de revue

Ce dépôt public est un **bundle de revue** du prototype local de mouvement des
bougies. Il permet à un lecteur ou à un outil comme Perplexity d’ouvrir la page,
de lire le plan et de vérifier les contrôles déterministes sans télécharger les
médias de validation.

Il ne contient **aucun MP4, aucun master, aucune image de validation** et ne
remplace pas la vidéo LTX rejetée. La graine 4243 n’est **pas une œuvre
approuvée**.

## Ouvrir la page

Une fois GitHub Pages activé sur la branche `main`, dossier `/` (racine) :

`https://<compte>.github.io/candle-motion-preview/docs/prototypes/candle-motion/`

La racine du site redirige vers cette page. En local :

```bash
python3 -m http.server 8794 --bind 127.0.0.1
# puis http://127.0.0.1:8794/docs/prototypes/candle-motion/
```

La page est autonome : le plan est embarqué, aucune bibliothèque externe n’est
chargée. La seule dépendance est le PNG de fond, servi sur la même origine :

`validation/2026-11-09-reconstruction-v2/outputs/reconstruction-seed-4243.png`

La mention « aucun réseau » dans la page signifie **aucune dépendance ni requête
externe** ; le PNG est chargé depuis le même site.

Libellé exact affiché :

**Motion intention preview—not a prediction of AI output.**

## Contenu

| Fichier | Rôle |
| --- | --- |
| `docs/prototypes/candle-motion/index.html` | page autonome, rendu déterministe, édition des régions, presets, checks |
| `docs/prototypes/candle-motion/README.md` | documentation détaillée du prototype |
| `docs/prototypes/candle-motion/motion-plan.candles-4243.json` | instance de plan, source de vérité |
| `docs/prototypes/candle-motion/motion-plan.schema.json` | schéma du plan |
| `docs/prototypes/candle-motion/EXCALIDRAW.md` | étude Excalidraw, non adopté |
| `docs/prototypes/candle-motion/PORTAL.md` | concept séparé de portail récursif |
| `tests/test_candle_motion_plan.mjs` | contrôles déterministes Node |
| `validation/2026-11-09-video-test/RECONCILIATION.md` | rejet vidéo, comptes, géométrie, audio |
| `validation/2026-11-09-reconstruction-v2/outputs/reconstruction-seed-4243.png` | fond diagnostique, 1280×1024, non approuvé |

Aucun fichier vidéo, aucune image LaMa, aucun master n’est inclus.

## Vérifier

Depuis la racine du dépôt :

```bash
node tests/test_candle_motion_plan.mjs
```

Sortie attendue : `test_candle_motion_plan: ok`, avec le rappel des 8 flammes,
7 régions de lumière, du déterminisme, de la boucle bit-identique, de la
protection hors supports et des dimensions/SHA du PNG.

Les checks intégrés à la page se lancent avec le bouton **Lancer les
vérifications** ; ils mesurent notamment 0 octet modifié hors supports.

## Pour Perplexity

- Pour une **analyse de code** : commencer par ce README, puis
  `motion-plan.candles-4243.json`, `motion-plan.schema.json` et `index.html`.
- La page est une application canvas : un navigateur headless peut afficher une
  frame, mais les boutons, le scrub et les checks ne s’exécutent pas sans
  interaction. Pour une revue visuelle, préférer des frames PNG ou un court
  clip ; ne pas conclure au photoréalisme ni à une équivalence LTX.
- Le plan sépare `artistIntent`, `previewSettings` et `engineControls` ;
  `conditioningSignals` est vide. Une annotation n’est pas un signal LTX.
- Les checks ne prouvent ni le photoréalisme, ni l’accord avec LTX, ni l’existence
  d’un exporteur.

## Contexte

La vidéo diagnostique LTX de la graine 4243 est **rejetée pour la production** ;
le MP4 d’origine est conservé hors de ce dépôt. La réconciliation des deux
revues (frames 0/24/48/72/96) est dans
`validation/2026-11-09-video-test/RECONCILIATION.md` : ouvertures et flammes en
hausse, translation verticale d’environ 200 px, aucune trajectoire caméra exacte
revendiquée.

## Limites

Flammes stylisées, non photoréalistes ; nettoyage local par atténuation, non
reconstructif ; lumière additive non physique ; protection mesurée à 320×256 et
640×512 ; aucun exporteur, aucun rendu vidéo. Le prototype est un aperçu
d’intention, pas une prédiction de la sortie IA.

## Source et droits

Extrait ciblé de `studio-ltx`, commit `681b67a`, sans historique ni médias
lourds. Aucune licence n’est ajoutée à ce bundle. La graine 4243 reste non
approuvée : ne pas la réutiliser comme master ni comme artwork validé.
