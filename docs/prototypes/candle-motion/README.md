# Prototype — intention de mouvement des bougies

**Statut :** aperçu local de **diagnostic**, non approuvé. Le fond
`reconstruction-seed-4243.png` n’est ni un master ni une œuvre validée. Ce
prototype ne génère aucune vidéo, n’appelle aucun moteur et ne modifie aucun
média.

Libellé affiché, exact :

> Motion intention preview—not a prediction of AI output.

## 1. Ouvrir l’aperçu

Le navigateur bloque la lecture pixel d’une image locale en `file://`. Servir le
dépôt en statique, puis ouvrir la page :

```sh
cd studio-ltx
python3 -m http.server 8791
```

Adresse : `localhost:8791/docs/prototypes/candle-motion/`.

Aucun build, aucune dépendance, aucun réseau au-delà du fichier local. La page
est un HTML autonome (CSS + JS embarqués) ; seul le PNG de fond est lu à côté.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | page autonome, cœur de rendu, interface, contrôles |
| `motion-plan.candles-4243.json` | instance de plan, source de vérité |
| `motion-plan.schema.json` | schéma JSON du plan |
| `EXCALIDRAW.md` | étude d’une page, recommandation de non-adoption |
| `../../../tests/test_candle_motion_plan.mjs` | tests déterministes Node |

Le plan est aussi **embarqué** dans la page entre les marqueurs
`PLAN:BEGIN` / `PLAN:END`. Le test vérifie qu’il est **identique** au JSON
externe ; toute divergence doit être corrigée dans les deux.

## 3. Structure du plan

Trois couches restent séparées :

- `artistIntent` — intention et non-objectifs ; jamais une garantie.
- `previewSettings` — preset, régions visibles, vitesse de lecture.
- `engineControls` — `conditioningSignals: []`. **Une annotation n’est pas un
  signal de conditionnement LTX.**

Le record MOTION existant (`motion.bougies.flame-lock@1.0.0`) est réutilisé par
référence conceptuelle : même caméra fixe `A-01`, mêmes invariants, même statut
provisoire. Le plan ajoute uniquement les données de régions nécessaires.

### Régions

Coordonnées normalisées `[x, y]` (x divisé par la largeur, y par la hauteur) ;
les valeurs entre parenthèses sont les pixels correspondants en 1280×1024, pour
l’audit.

| ID | Rôle | Support (px) | Ancre / centre (px) | Phase |
|---|---|---|---:|---:|
| `flame.tl-blue` | animé | 331,288 → 364,321 | ancre 347,5 · 315 | 0,00 |
| `flame.tr-brown-a` | animé | 946,236 → 993,285 | ancre 969,5 · 279 | 0,37 |
| `flame.tr-brown-b` | animé | 1018,239 → 1065,283 | ancre 1042 · 277 | 0,71 |
| `flame.mr-blue` | animé | 1064,485 → 1091,512 | ancre 1077 · 508 | 0,12 |
| `flame.left-a` | animé | 176,604 → 203,630 | ancre 189 · 626 | 0,55 |
| `flame.left-b` | animé | 244,604 → 271,632 | ancre 257,5 · 628 | 0,83 |
| `flame.lr-a` | animé | 1026,718 → 1068,756 | ancre 1047 · 751 | 0,26 |
| `flame.lr-b` | animé | 1069,721 → 1111,755 | ancre 1090 · 750 | 0,64 |
| `light.tl-niche` | lumière | 285,210 → 402,356 | centre 347 · 316 | 0,00 |
| `light.tr-niche` | lumière | 898,198 → 1118,320 | centre 1005 · 268 | 0,18 |
| `light.mr-niche` | lumière | 1040,452 → 1128,550 | centre 1077 · 508 | 0,42 |
| `light.left-niche` | lumière | 98,518 → 328,662 | centre 222 · 608 | 0,27 |
| `light.lr-niche` | lumière | 1002,698 → 1118,798 | centre 1065 · 752 | 0,61 |
| `light.left-floor` | lumière | 110,838 → 340,990 | centre 225 · 918 | 0,35 |
| `light.lr-floor` | lumière | 990,812 → 1128,942 | centre 1060 · 878 | 0,72 |

Chaque flamme porte `anchor` (mèche), `height` et `width` normalisés, une
amplitude, une harmonique entière, une phase et une inclinaison. Chaque région
de lumière porte un centre, des rayons, un gain linéaire, une couleur chaude et
la liste de ses flammes sources.

Les huit flammes correspondent au comptage de la frame 0 de la vidéo rejetée :
**5 ouvertures, 8 flammes**. Les rebords éclairés ne sont pas des flammes.

## 4. Rendu déterministe

`renderFrame(fond, plan, temps, …)` est une fonction pure vis-à-vis de ses
entrées : même fond décodé, mêmes réglages, même graine et même temps donnent
les mêmes octets. L’interface n’utilise `requestAnimationFrame` que pour faire
avancer l’horloge de lecture ; le rendu reçoit toujours un temps explicite.

- Espace de travail : **sRGB linéaire**, décodage par table 256, encodage par
  table 65536.
- Lumière additive bornée ; épaulement doux au-dessus de **0,78** linéaire.
  Aucun clipping dur par défaut.
- Aucun `Math.random`, `Date.now` ou `performance.now` dans le cœur.
- Bruit micro déterministe dérivé de `sha` non cryptographique de
  `id + ":" + seed` (FNV-1a) ; il ne change jamais avec le temps.
- Le seed `4243` ne sert qu’à ces micro-déphasages, pas à une génération.

### Boucle

- `T = 6,000 s`, `fps = 24`, `N = 144`.
- `u = ((t / T) mod 1 + 1) mod 1` ; toutes les oscillations utilisent des
  harmoniques **entières**, donc valeur et vitesse sont compatibles au bord.
- `render(0)` et `render(T)` sont **bit-identiques** (tolérance 0) ; le test le
  vérifie octet par octet.
- Aucun adoucissement de chaque flamme vers l’arrêt au bord.
- Temps d’échantillonnage : `k·T/N` pour `k = 0…N−1`, **sans** frame finale
  dupliquée. Le dernier temps est `5,958333 s`.

## 5. Protection et nettoyage local

**Pixels protégés :** tout ce qui est hors de l’union des supports déclarés. Ces
pixels sont recopiés **octet pour octet** depuis le fond décodé ; ils ne sont
jamais décodés puis ré-encodés. Le test compare le rendu au fond décodé dans le
même pipeline — pas au fichier PNG compressé.

**Chevauchement :** les supports animés sont disjoints (vérifié par le test).
Un support de lumière peut chevaucher un support animé. Dans ce cas la lumière
est appliquée d’abord, la flamme ensuite ; l’union reste protégée.

**Nettoyage de la flamme statique :** dans chaque support animé, l’ancienne
flamme est atténuée vers une couleur de fond sombre estimée sur le pourtour du
support (30ᵉ percentile), avec une ellipse douce. La flamme procédurale est
ensuite dessinée par-dessus. Ce n’est **pas** une reconstruction du mur : les
pixels résiduels de l’ancien halo peuvent subsister. Aucune flamme fixe n’est
laissée à côté d’une seconde flamme mobile ; la flamme d’origine est remplacée
dans son support.

**Lumière :** pools additifs locaux, modulés par la moyenne de leurs flammes
sources. Pas de pompage global synchronisé, pas de variation de l’architecture,
pas de nouvel objet, pas de particule. Les reflets de sol sont deux pools
faibles et bornés.

## 6. Interface

- Lecture / pause, remise à zéro, scrub temporel, numéro de frame.
- Quatre presets : Calme, Bougies vivantes, Courant d’air, Veilleuse.
- Sélection d’une région, réglage amplitude / gain, vitesse (harmonique),
  phase, inclinaison.
- Édition des sommets du support à la souris ; le support protège, il ne
  déplace pas la mèche.
- Superposition des régions activable.
- Contrôles : déterminisme, bord de boucle, continuité de vitesse, protection
  pixel, mouvement réel, échantillons, luminance et tableau des phases.

Les contrôles tournent à **320×256** pour rester réactifs. La protection est
indépendante de la résolution ; les valeurs de luminance sont des mesures
réduites, pas une preuve artistique.

## 7. Tests

```sh
node tests/test_candle_motion_plan.mjs
```

Le test vérifie : contrat de page sans réseau, plan embarqué identique au JSON,
schéma, 8 flammes / 7 lumières, phases distinctes, supports dans `[0,1]`,
géométrie PNG et SHA-256 (si le média est présent), déterminisme, boucle
bit-identique, absence d’horloge/aléatoire dans le cœur, protection hors
supports, disjonction des flammes, chevauchement lumière/flamme documenté,
mouvement réel, continuité de vitesse et variation de luminance.

Le média source est **hors Git** : si le PNG est absent, le test l’indique et
saute uniquement la vérification d’empreinte.

## 8. Limites

- Les flammes sont procédurales et **stylisées**, pas photoréalistes.
- Le nettoyage atténue la flamme statique ; il ne reconstruit pas la paroi.
- La lumière n’est pas une simulation physique : pas d’occlusion, de diffusion
  ni de température de couleur mesurée.
- Les supports sont des rectangles déclarés à la main, pas une segmentation.
- Aucun exporteur, aucun encodeur, aucun enregistrement vidéo dans cette passe.
- Aucune prédiction de ce que LTX produira ; aucune preuve que ces réglages
  seront acceptés par le moteur.
- Le rendu dépend du navigateur pour l’affichage, mais les octets produits par
  le cœur sont déterministes.

## 9. Prochain test proposé

Faire un **verdict visuel humain** sur cet aperçu : les flammes remplacent-elles
crédiblement les flammes statiques, la lumière reste-t-elle locale, et le
raccord de boucle est-il invisible ? Si le verdict est positif, le test suivant
est une **unique** génération LTX avec caméra fixe et image d’entrée approuvée,
puis une comparaison côte à côte — sans modifier ce prototype pour imiter LTX.

## 10. Comparaison des trois approches

| Approche | Ce qu’elle préserve | Ce qui reste incertain |
|---|---|---|
| **Procédural / compositing** (ce prototype) | géométrie, cadrage, exposition et pixels hors supports ; contrôle exact du temps, de la phase et de la boucle | réalisme des flammes, nettoyage non reconstructif de la flamme statique, lumière additive non physique ; aucune garantie que LTX suive ce plan |
| **LTX pleine image** | matière, lumière et mouvement générés de façon cohérente sur toute l’image, sans masque | caméra et géométrie non verrouillées (observé sur 4243), dérive couleur/exposition, apparition d’ouvertures et d’objets, boucle non garantie |
| **Éléments générés localisés sous masques** | le fond reste exact ; seules les zones autorisées changent ; contrôle du raccord | qualité du bord, cohérence de lumière avec le fond, contour du masque, moteur de masque non installé pour LTX ; **non testé ici** |

Le procédural ne produit **pas** des flammes photoréalistes et **aucun pipeline
d’export n’existe**. LTX pleine image est la seule approche qui génère de la
matière réelle, mais elle ne verrouille pas encore la caméra. La génération
localisée sous masque demanderait un moteur capable de masque, absent du
workflow actuel. Ce prototype ne tranche pas entre les trois : il isole
l’intention de mouvement pour qu’elle puisse être jugée avant une génération.

## 11. Portail récursif

Concept **séparé**, non implémenté ici : `PORTAL.md`. Il décrit un zoom
récursif, l’alignement de similarité nécessaire, la transition et les limites
2D. Il ne doit pas être ajouté au prototype des bougies.
