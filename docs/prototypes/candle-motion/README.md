# Éditeur de scène — groupe Bougies

**Statut :** prototype local de **diagnostic**, non approuvé. Le fond
`reconstruction-seed-4243.png` n’est ni un master ni une œuvre validée. Cette
passe ne produit aucune vidéo, n’appelle aucun moteur et ne modifie aucun média.

**Build visible :** `2.2.0-variants.1`. **Format projet :**
`candle-motion-project/v2`, identifiant historique conservé pour charger les
projets bougies. **Branche de cette passe :** `feature/scene-ux-refinement`,
crée depuis `937d428` (fondation image-agnostique). La preview publique
connue est `actuune/candle-motion-preview` ; le bundle public est mis à jour
séparément et ne contient aucun master.

Libellé affiché, exact :

> Motion intention preview—not a prediction of AI output.

## 1. Ouvrir

La lecture pixel d’une image locale est bloquée en `file://`. Servir le dépôt en
statique :

```sh
cd studio-ltx
python3 -m http.server 8791
```

Puis ouvrir `localhost:8791/docs/prototypes/candle-motion/`. Aucun build, aucune
dépendance, aucun service. L’import d’une image locale lit ses octets dans le
navigateur et calcule son SHA-256 localement ; aucune requête réseau n’est faite
pour vérifier l’asset. Une image importée n’est pas approuvée et n’est pas
dupliquée dans le JSON.

## 1 bis. Parcours principal et interface

La page est organisée autour d’un seul parcours :

```
Importer une image → sélectionner → choisir un comportement → vérifier l’aperçu → enregistrer
```

- **Barre haute compacte** : Importer (action primaire), Ouvrir, Enregistrer,
  Annuler/Rétablir et état du projet.
- **Canvas central large** : aperçu, lecture/pause, scrub et comparaison.
- **Scène** : groupes et éléments, sélection simple ou multiple, tracé d’une
  nouvelle région.
- **Comportement** : preset du groupe, intensité, vitesse,
  activation/désactivation et lumière.
- **Réglages avancés** repliés : tous les paramètres existants, supports et
  propositions.
- **Détails du projet** repliés : format, source, durée, seed et approbations.
- **Diagnostic du plan** replié : vérifications techniques et métriques.
- **À venir** : feuillage, tissu, détection, transformation et export,
  clairement non exécutables.

Protection : « Garder immobile » ne dessine aucun pixel ; « Protéger tous les
pixels » fige tout le groupe sans supprimer les réglages ; « Autoriser les
changements de lumière » reste désactivé si tous les pixels sont verrouillés.
Le format `candle-motion-project/v2` reste le format de chargement et le
baseline garde son renderer. La variante B ajoute une couche `atmosphere`
**optionnelle** ; aucun champ requis n’est ajouté et aucun projet existant ne
migre.

Captures de la passe : non incluses dans ce bundle public. Elles restent des
artefacts locaux de revue.

## 1 ter. Variantes A/B — brouillons non approuvés

Le sélecteur compact **Variantes** ne crée aucune copie destructive : le projet
baseline et ses presets restent inchangés. Chaque variante est un projet JSON
complet, rechargeable, et le changement passe par l’historique (undo/redo).

| Variante | Contenu | Durée |
|---|---|---|
| **Référence** | image, 8 flammes, 7 lumières liées et presets d’origine | 6 s historique |
| **A · Original Alive** | mêmes flammes, mêmes liaisons explicites, mêmes reflets ; aucune région ni liaison ajoutée | 12 s |
| **B · Atmospheric Night** | A + région de ciel manuelle protégée + atmosphère procédurale ; étoiles et lumière froide optionnelles | 12 s |
| **C · à choisir** | trois propositions seulement ; aucune implémentation | — |

- A ne relie pas automatiquement le passage central à toutes les bougies. Les
  sources de lumière restent celles du projet, explicites et éditables.
- B ne déplace ni l’architecture ni le cadrage. Le ciel est une région bornée ;
  les bords chauds sont atténués par un garde-fou, pas par une segmentation
  sémantique. Les étoiles sont **désactivées par défaut**. La lumière froide des
  hauts de murs est une couche opt-in séparée, pas une source physique.
- A et B sont à **12 s**, 24 fps, 288 échantillons `k·T/N`, endpoint exclusif.
  Les cycles atmosphériques sont des entiers de la boucle : aucun cycle
  indépendant de 20 s dans un export de 12 s.
- Les trois propositions C sont détaillées dans `VARIANTS-C.md` et dans le
  panneau « C · à choisir ». Ne pas les combiner sans choix utilisateur.Captures et capture navigateur A→B : non incluses dans ce bundle public pour éviter les médias lourds. Elles restent dans l’espace local de travail, non publié ici ; ce n’est pas un export du renderer.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | page autonome, cœur, interface, sauvegarde/import |
| `motion-plan.candles-4243.json` | baseline v2, source de vérité inchangée |
| `motion-plan.candles-4243.variant-a.json` | variante A, 12 s |
| `motion-plan.candles-4243.variant-b.json` | variante B, 12 s, atmosphère |
| `motion-plan.schema.json` | schéma du projet v2, `atmosphere` optionnelle |
| `VARIANTS-C.md` | trois propositions C, non implémentées |
| `RECIPES.md` | trois recettes : bougies, feuillage, tissu |
| `EXCALIDRAW.md` | étude de non-adoption |
| `../../../tests/test_candle_motion_plan.mjs` | tests Node déterministes |
| `../../../tests/test_scene_variants.mjs` | tests A/B, ciel, occlusion, boucle |

Le projet est aussi **embarqué** entre `PLAN:BEGIN` / `PLAN:END`. Le test exige
l’égalité exacte avec le JSON externe.

## 3. Projet v2

Le format `candle-motion-project/v2` contient :

- l’asset source : `id`, chemin relatif, dimensions, SHA-256, espace couleur ;
- les **éléments** : support polygonal, ancres, animation, opération, overrides ;
- un **groupe** `Bougies` qui référence 8 flammes et 7 lumières ;
- des **presets versionnés** ; `vivant` est le défaut, `sobre` est le preset
  retenu ;
- une **timeline/loop** : baseline `T = 6,000 s`, 24 fps, 144 échantillons
  `k·T/N`, endpoint exclusif, aucune frame finale dupliquée ; les variantes A/B
  utilisent 12 s et 288 échantillons ;
- la graine déterministe `4243` ;
- le statut d’approbation ;
- des **propositions** de détection, vides dans cette instance.

La version `2.1.0` ajoute une fondation image-agnostique : import PNG/JPEG/WebP,
projet vide, régions protégées, groupes, recettes supportées vs proposées,
sortie cible et approbations séparées. Les groupes/regions/presets peuvent être
vides. Les champs inconnus sont conservés au chargement. Aucun redimensionnement
silencieux n’est appliqué ; une source non 5:4 reste dans son repère.

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
node tests/test_scene_project.mjs
node tests/test_scene_variants.mjs
```

Le test vérifie le contrat de page (un script, un style, deux canvas, aucune URL
ou requête réseau, hash local), le projet embarqué, le schéma v2, les
8 flammes / 7 lumières, le groupe, les cinq presets, les supports, le PNG et son
SHA-256, la précédence, le déterminisme, la boucle, la continuité, les masques
étendus, la désactivation, le rendu natif, l’historique, le round-trip JSON, la
compatibilité d’asset et la confirmation d’une proposition en Protéger.

## 12. Limites connues

- Le groupe Bougies est le seul groupe implémenté. Feuillage et tissu sont des
  recettes documentées, pas des démos exécutables. La fondation accepte des
  projets génériques et des régions protégées, mais ne prouve pas un renderer
  feuillage/tissu.
- Pas de détection automatique, pas de segmentation promptable intégrée.
- Pas d’exécution de transformation, pas de retouche générative.
- Pas d’export vidéo, pas d’encodeur, pas de master, pas d’intégration LTX.
- Les overrides ne changent pas le support ; une correction de masque est une
  opération distincte.
- Le SHA-256 n’est vérifié qu’à l’import ; le chargement initial est celui du
  prototype.
- La variante B est une **approximation artistique** : le ciel est un masque
  manuel, l’occlusion des arêtes est heuristique, et la lumière froide n’est pas
  récupérée physiquement. Les étoiles optionnelles sont rares et seedées.
- La variante C n’est **pas** implémentée. Le choix d’une intervention, son
  support et son renderer restent à approuver.
- La copie publique `candle-motion-preview` (`b9bf116`) n’est pas mise à jour
  par cette branche et ne doit pas être présentée comme la version éditée.

## 13. Suite

Verdict visuel humain sur cette passe, en particulier : mouvement retenu de
`Sobre`, cohérence vent/flamme/lumière, lisibilité de la précédence, propreté des
bords de masque et absence de flamme doublée. Vérifier aussi le parcours
simplifié sur un écran réel : sélection, preset, surcharge, protection,
sauvegarde et réouverture. Aucune génération LTX ni vidéo ne doit être lancée
avant ce verdict.
