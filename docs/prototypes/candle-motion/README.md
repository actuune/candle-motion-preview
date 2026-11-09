# Éditeur de scène — groupe Bougies

**Statut :** prototype local de **diagnostic**, non approuvé. Le fond
`reconstruction-seed-4243.png` n’est ni un master ni une œuvre validée. Cette
passe ne produit aucune vidéo, n’appelle aucun moteur et ne modifie aucun média.

Libellé affiché, exact :

> Motion intention preview—not a prediction of AI output.

## 1. Ouvrir

La lecture pixel d’une image locale est bloquée en `file://`. Servir le dépôt en
statique :

```sh
cd candle-motion-public
python3 -m http.server 8794
```

Puis ouvrir `localhost:8791/docs/prototypes/candle-motion/`. Aucun build, aucune
dépendance, aucun service. Une seule requête locale est faite **à l’import d’un
projet** pour relire les octets du PNG et vérifier son SHA-256.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | page autonome, cœur, interface, sauvegarde/import |
| `motion-plan.candles-4243.json` | projet v2, source de vérité |
| `motion-plan.schema.json` | schéma du projet v2 |
| `RECIPES.md` | trois recettes : bougies, feuillage, tissu |
| `EXCALIDRAW.md` | étude de non-adoption |
| `../../../tests/test_candle_motion_plan.mjs` | tests Node déterministes |

Le projet est aussi **embarqué** entre `PLAN:BEGIN` / `PLAN:END`. Le test exige
l’égalité exacte avec le JSON externe.

## 3. Projet v2

Le format `candle-motion-project/v2` contient :

- l’asset source : `id`, chemin relatif, dimensions, SHA-256, espace couleur ;
- les **éléments** : support polygonal, ancres, animation, opération, overrides ;
- un **groupe** `Bougies` qui référence 8 flammes et 7 lumières ;
- des **presets versionnés** ; `vivant` est le défaut, `sobre` est le preset
  retenu ;
- une **timeline/loop** : `T = 6,000 s`, 24 fps, 144 échantillons `k·T/N`,
  endpoint exclusif, aucune frame finale dupliquée ;
- la graine déterministe `4243` ;
- le statut d’approbation ;
- des **propositions** de détection, vides dans cette instance.

Le fichier projet ne duplique **jamais** l’image. L’import vérifie d’abord les
dimensions et le SHA-256 ; une différence bloque le chargement et demande un
remappage des masques. Le format privilégie les fichiers JSON à une base : aucune
migration SQLite n’est nécessaire pour ce prototype.

## 4. Précédence et couches

Ordre strict :

```
override d’élément  >  réglage du groupe  >  défaut du preset
```

L’inspecteur affiche la couche réellement utilisée :

- badge `preset` : valeur par défaut ;
- badge `groupe` : réglage partagé ;
- badge `surchargé` : override local ;
- badge `élément` : valeur intrinsèque (phase, ancre, taille, support).

Le bouton `↺` retire l’override quand il existe. `Hériter de tout le groupe`
efface toutes les surcharges d’un élément. `Réinitialiser au preset` retire les
réglages du groupe ; les overrides d’éléments restent, par choix explicite.

## 5. Workflow Bougies

1. Le groupe est sélectionné dans la scène ; ses réglages partagés s’appliquent
   aux 15 éléments.
2. Choisir un preset versionné. `Sobre` est destiné à un mouvement retenu ;
   `Courant d’air` est volontairement plus démonstratif.
3. Ajuster amplitude, vitesse harmonique, inclinaison, intensité, variation et
   vent (direction, force, réponse par défaut). La graine est projet-globale.
4. Sélectionner une flamme dans la scène **ou dans l’image**. `Maj`/`Ctrl`/`Cmd`
   ajoute ou retire un élément à la sélection. Le groupe reste sélectionnable.
5. Régler ses overrides : amplitude, vitesse, inclinaison, multiplicateur
   d’intensité, réponse au vent, variation, phase, taille, ancre de mèche.
6. Vérifier sa ou ses lumières liées. Chaque flamme doit rester reliée à une
   région de lumière locale ; les pools sont additifs et bornés.
7. Désactiver l’animation d’un élément ou du groupe conserve l’image statique et
   le support. Rien n’est masqué, aucune flamme n’est dupliquée.
8. `Comparer` partage le canvas de scène entre le fond original et le rendu ;
   le curseur règle la séparation. C’est un avant/après de preview, pas un rendu
   final.

Le vent est **commun** (même signal périodique) mais chaque flamme garde sa phase
et sa réponse. Le mode `synchronisée` supprime le bruit individuel ajouté ;
`corrélée` combine vent commun et micro-réponse ; `indépendante` privilégie la
micro-réponse. Aucun mode ne copie une flamme sur l’autre.

## 6. Sélection et corrections de masque

- Sélection depuis l’image ou la liste de scène.
- Multi-sélection et inspecteur de sélection multiple.
- Outil **polygone** : déplacement des sommets, ajout/retrait, suppression d’un
  sommet sélectionné.
- Outil **rectangle** : ajoute une zone autorisée au support.
- Outil **brosse** : ajoute des cercles au support.
- Les extras étendent le support, pas l’ancre. Une correction de masque ne crée
  pas de patch rectangulaire de suppression : la suppression de la flamme
  statique reste elliptique et bornée par le support.
- Les supports de flammes restent disjoints ; une lumière peut chevaucher une
  flamme. La lumière est appliquée avant la flamme.

## 7. Opérations

| Opération | Effet réel |
|---|---|
| **Protéger** | aucune écriture procédurale ; le pixel d’origine reste |
| **Animer** | applique la recette bougies si l’animation est active |
| **Transformer** | stocke un plan proposé ; **aucune exécution** |

Une transformation comme « faire la nuit » exige un plan couvrant ciel, sources,
ombres et reflets. Le champ texte est une note de proposition, pas un contrôle
moteur. Aucun adaptateur de transformation n’est branché.

## 8. Détection

La détection automatique n’est **pas** implémentée dans cet incrément. Le format
prévoit des propositions avec catégorie, support/masque, confiance ou incertitude
et statut. Une proposition confirmée est créée en **Protéger** : elle ne devient
jamais une animation silencieuse. Les catégories non supportées restent non
exécutables. La segmentation promptable et la reconnaissance sémantique sont deux
capacités distinctes ; aucune n’est revendiquée ici.

## 9. Boucle, déterminisme, lumière

- `renderFrame(fond, projet, temps, …)` reste la seule autorité de rendu ;
  `requestAnimationFrame` ne fait qu’avancer l’horloge de lecture.
- Toutes les oscillations utilisent des fréquences entières de `u`; le bruit de
  vent est composé de sinus seedés. `render(0)` et `render(T)` sont
  bit-identiques.
- Même projet, même graine, même temps ⇒ même image. Aucun `Math.random`,
  `Date.now` ou `performance.now` dans le cœur.
- La lumière est additive, locale, liée aux flammes sources. Ce n’est pas une
  reconstruction physique : pas d’occlusion, diffusion ou température mesurée.
- Les flammes restent stylisées. Le nettoyage atténue la flamme statique ; il ne
  reconstruit pas la paroi.

## 10. Contrôles

Le bouton `Lancer les vérifications` mesure à **320×256** :

- précédence élément/groupe/preset ;
- déterminisme et boucle bit-identique ;
- continuité de vitesse au bord ;
- protection hors supports ;
- mouvement réel ;
- désactivation complète : frame identique au fond, éléments conservés ;
- échantillons sans endpoint dupliqué ;
- variation de luminance.

Puis il vérifie à **1280×1024 natif** la boucle et la protection sur le fond
décodé réel. Ces contrôles ne prouvent ni le photoréalisme, ni un accord LTX, ni
un export.

## 11. Tests

```sh
node tests/test_candle_motion_plan.mjs
```

Le test vérifie le contrat de page (un script, un style, deux canvas, aucune URL
réseau, une seule requête locale d’asset), le projet embarqué, le schéma v2, les
8 flammes / 7 lumières, le groupe, les cinq presets, les supports, le PNG et son
SHA-256, la précédence, le déterminisme, la boucle, la continuité, les masques
étendus, la désactivation, le rendu natif, l’historique, le round-trip JSON, la
compatibilité d’asset et la confirmation d’une proposition en Protéger.

## 12. Limites connues

- Le groupe Bougies est le seul groupe implémenté. Feuillage et tissu sont des
  recettes documentées, pas des démos exécutables.
- Pas de détection automatique, pas de segmentation promptable intégrée.
- Pas d’exécution de transformation, pas de retouche générative.
- Pas d’export vidéo, pas d’encodeur, pas de master, pas d’intégration LTX.
- Les overrides ne changent pas le support ; une correction de masque est une
  opération distincte.
- Le SHA-256 n’est vérifié qu’à l’import ; le chargement initial est celui du
  prototype.
- Ce dépôt public correspond à la v2 issue de `studio-ltx`, branche
  `feature/candle-group-editor`, commit `c36bfbe`. Il ne vaut ni approbation
  visuelle, ni master, ni validation LTX.

## 13. Suite

Verdict visuel humain sur cette passe, en particulier : mouvement retenu de
`Sobre`, cohérence vent/flamme/lumière, lisibilité de la précédence, propreté des
bords de masque et absence de flamme doublée. Aucune génération LTX ni vidéo ne
doit être lancée avant ce verdict.
