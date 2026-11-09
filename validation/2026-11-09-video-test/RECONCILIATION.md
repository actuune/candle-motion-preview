# Réconciliation visuelle — test vidéo 4243

**Date :** 9 novembre 2026.
**Statut :** vidéo **rejetée pour la production**. Le MP4 d’origine est
**conservé intact** ; aucune nouvelle génération LTX n’a été lancée.

Ce document réconcilie deux lectures des mêmes médias :

- **Revue A** — `RESULT.md` et `review.html`, rédigés après le décodage.
- **Revue B** — inspection indépendante des frames 0, 24, 48, 72 et 96
  effectuée pour cette passe, sur des copies de travail uniquement.

Les deux revues partagent la même source : le MP4 n’a pas été régénéré. Elles ne
sont donc pas deux observations indépendantes du moteur, mais deux lectures du
même fichier. Les divergences portent sur les **comptes** et sur la
**qualification de la géométrie**, pas sur l’existence des dérives.

## 1. Décision de rejet

| Élément | Constat |
|---|---|
| Statut production | **rejeté** |
| Motif principal | caméra et géométrie non verrouillées ; ouvertures et bougies absentes du cadre initial ; dérive d’exposition et de couleur |
| Motif secondaire | piste audio non silencieuse alors que le prompt demandait « no audio treatment » |
| MP4 | `video.mp4`, SHA-256 `75398adeb98bc0eb40781e25d65020a15d44d48682ab2d9709b1907fd888e61a`, **non modifié** |
| Générations | une seule, terminée ; **aucun retry, aucune seconde génération** |
| Master | **aucun** |

Le fichier reste une **preuve diagnostique**. Il ne doit pas être publié,
présenté comme un plan abouti, ni utilisé comme image de départ d’un master.

## 2. Comptage des ouvertures et des flammes

Comptage visuel sur les frames natives 1280×1024, avec agrandissements 2,2× sur
les zones de bougies. Une « ouverture » est un renfoncement visible dans une
masse ; une « flamme » est une flamme chaude distincte, pas un reflet ni un
rebord éclairé.

| Frame | Ouvertures visibles | Ouvertures avec bougies | Flammes nettes | Incertitude |
|---|---:|---:|---:|---|
| 0 | 5 | 5 | 8 | faible |
| 24 | 6 | 5 | 8 | faible ; un liseré chaud sous le bloc bleu droit n’est pas compté |
| 48 | 7 | 6 | 11 | ±1 ; une ouverture haute gauche est vide |
| 72 | 9 | 7 | 13 | ±1 ; deux niches sombres à droite |
| 96 | 9 | 7 | 13 | ±1 ; ouverture haute droite partiellement hors cadre |

Détail frame 0 (référence) : niche bleue haute gauche **1**, niche brune haute
droite **2**, niche bleue médiane droite **1**, niche brune gauche **2**, niche
brune basse droite **2** — soit **8 flammes dans 5 ouvertures**.

Éléments **non comptés** comme flammes :

- le liseré horizontal très fin sous le bloc bleu droit à la frame 24 ;
- les rebords et tablettes éclairés des niches (chaud, mais sans flamme) ;
- les reflets du sol ;
- les zones chaudes de l’encadrement du passage central.

Ces éléments expliquent pourquoi un simple seuil de pixels chauds propose
davantage de « flammes » qu’il n’en existe. Un détecteur de blobs a été utilisé
comme aide, pas comme verdict : il confond rebords et flammes et rate les
flammes faibles. Les comptes ci-dessus sont **visuels**, avec l’incertitude
indiquée.

## 3. Changements de cadrage et de géométrie

Les positions des flammes suivies dans les frames donnent un déplacement
cohérent :

| Repère | Frame 0 | 24 | 48 | 72 | 96 | Déplacement |
|---|---:|---:|---:|---:|---:|---:|
| Flamme niche haute gauche, y | ~307 | ~279 | ~230 | ~172 | ~112 | **−195 px** |
| Flamme niche haute droite gauche, y | ~259 | ~212 | ~162 | ~114 | ~60 | **−199 px** |
| Flamme niche bleue médiane, y | ~501 | ~446 | ~393 | ~337 | ~278 | **−223 px** |
| Même flamme, x | ~1077 | ~1078 | ~1077 | ~1078 | ~1077 | **~0 px** |

Observations :

- le contenu visible **monte** d’environ **200 px** en 96 frames, soit environ
  **2,1 px/frame**, alors que les abscisses restent quasi constantes ;
- le nombre d’ouvertures passe de **5 à 9** et le nombre de flammes de **8 à 13** ;
- des masses changent d’échelle et de proportions ; le passage central se
  déforme ; une ouverture basse gauche se scinde ;
- l’ouverture haute droite sort partiellement du cadre à la frame 96.

**Ce qui est établi :** le point de vue n’est pas verrouillé et la géométrie
évolue. Une translation verticale seule ne suffit pas à expliquer l’apparition
d’ouvertures supplémentaires ni les changements d’échelle.

**Ce qui n’est pas établi :** la part respective d’un mouvement de caméra, d’un
changement de focale et d’une déformation de la géométrie générée. Ces trois
causes produisent des effets observables similaires. **Aucune trajectoire de
caméra exacte n’est revendiquée.** Les valeurs ci-dessus sont des mesures de
repères visibles, pas une reconstruction 3D.

## 4. Exposition, couleur, boucle

- Luminance moyenne : **29,2** (frame 0) → **33,7** (frame 48) → **35,4**
  (frame 96), soit **+21 %** environ.
- Les bleus s’éclaircissent, les bruns se réchauffent, les reflets du sol
  s’intensifient.
- La frame 0 et la frame 96 diffèrent fortement (MAE **21,24**) : **aucune
  boucle seamless**.
- Le flicker des flammes est réel, mais il est accompagné d’une hausse globale
  de luminance et de reflets ; les changements de pixels ne sont pas
  attribuables aux seules flammes.

## 5. Clarification audio

« No audio treatment » était une **consigne de prompt**, pas une demande
technique de silence. Le MP4 contient une piste **AAC stéréo 48 kHz, 128 kb/s**,
non silencieuse : moyenne **−26,7 dB**, pic **−15,7 dB**.

- Le fichier n’a **pas** été modifié.
- Aucun traitement, mute, remux ni remplacement audio n’a été effectué.
- La présence de cette piste reste une **observation**, pas un défaut technique
  du conteneur.
- Pour un futur test, la question à trancher est explicite : piste muette,
  absence de piste, ou piste conservée. Elle ne doit pas être déduite de la
  formule « no audio treatment ».

## 6. Ce que la vidéo ne prouve pas

- Elle ne valide pas le plan de mouvement : la caméra n’est pas fixe.
- Elle ne valide pas la fidélité de la graine 4243, qui reste non approuvée.
- Elle ne valide pas un raccord de boucle.
- Elle ne mesure pas la qualité des flammes indépendamment de l’exposition.
- Elle ne permet pas de distinguer caméra et déformation géométrique.

## 7. Suites possibles

1. Attendre le verdict utilisateur sur les candidats image 4242/4243.
2. Si un nouveau test vidéo est autorisé, ne changer **qu’une variable** et
   comparer avec cette référence : par exemple une image d’entrée approuvée,
   même graine et mêmes réglages, sans audio.
3. Tester d’abord l’intention de mouvement avec le prototype procédural local
   (`docs/prototypes/candle-motion/`), qui ne dépend d’aucun moteur et permet
   de valider amplitude, phase et boucle avant toute génération.
