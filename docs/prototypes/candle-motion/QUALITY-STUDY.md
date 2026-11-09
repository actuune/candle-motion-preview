# Étude de mouvement — air partagé, A corrigée et atmosphère B

**Date :** 9 novembre 2026

**Branche :** `feature/motion-quality-study`

**Statut :** étude supervisée — **aucun master image ou vidéo approuvé**

## 1. Verdict enregistré

- La révision du laboratoire est préférée au renderer original comme
  **direction**, pas comme approbation de production.
- **C / Poetic Breath est rejetée.** Aucun développement de fumée n’est poursuivi
  pour ce tableau ; C ne figure plus dans la page active.
- **B / Moving Night est prometteuse**, mais son mouvement temporel était trop
  lent et insuffisamment perceptible.
- **A / Living Fire** doit répondre collectivement à un air partagé, sans
  mouvements indépendants sans lien ni flammes identiques.
- Aucun nouvel export vidéo n’est autorisé dans cette passe.

## 2. Inspection du vent existant

Le CORE n’est pas un système purement indépendant :

- `windAt(plan, element, time)` combine un `loopNoise` commun au groupe et un
  `loopNoise` propre à l’élément, avec des poids `0.72 / 0.28` en mode
  `correlated` ;
- `flameSignal` et `flameSway` ajoutent ensuite des sinusoïdes indépendantes ;
- il n’existe ni enveloppe de rafale, ni direction signée lisible, ni délai de
  réponse, ni seed de flux exposée comme un driver unique ;
- `paintLight` applique un signal moyen aux sources d’une même lumière.

C’est donc un **mélange** de driver commun et d’oscillations individuelles. Le
laboratoire précédent n’utilisait pas `windAt` : ses flammes étaient encore
guidées par `labSignal` et `labFlameState`, avec des phases séparées. Cette
passe remplace cette partie dans le laboratoire isolé.

La lumière reste **additive** : `paintLight` ne sépare pas la lumière cuite de la
couleur matérielle. Il n’existe pas de passe de reflet de sol distincte ;
`light.left-floor` est un second pool additif. La révision ne prétend pas
reconstruire la lumière physiquement.

## 3. Modèle corrigé

### 3.1 Un flux partagé, déterministe et borné

`labAirflowAt(plan, time)` définit un seul état d’air pour la scène :

- enveloppe de rafale lisse, avec accalmies et retombée ;
- direction signée, autorisant les deux sens ;
- force et direction bornées ;
- seed enregistrée (`4243` dans les plans actuels) ;
- harmoniques entières pour une boucle 12 s exacte ;
- aucun décalage spatial en x : il n’y a **pas** de vague qui traverse la
  façade.

Le profil `calm` garde un plancher bas et des rafales espacées. Le profil
`breeze` a un plancher plus haut et une direction qui s’inverse plus franchement.
Ce sont deux climats du même modèle, pas deux moteurs.

### 3.2 Réponse propre à chaque flamme

Chaque flamme reçoit le même flux, puis applique :

- une sensibilité seedée ;
- un délai de réponse borné ;
- une amplitude d’inclinaison propre ;
- une variation de hauteur et de largeur ;
- un petit résidu périodique ;
- une luminosité liée à son état.

Les ancres de mèche et les bases restent fixes. Deux flammes voisines peuvent se
ressembler sans prendre la même pose : c’est une réponse corrélée, pas une
synchronisation identique. Aucun mouvement n’est ajouté pour créer une activité
de façade.

C’est une **approximation visuelle contrôlée**, pas une simulation d’air
récupérée ni une combustion physique.

### 3.3 Lumière liée par source

Chaque pixel d’un pool calcule une contribution à partir de l’état de chaque
flamme source, pondérée par la distance. La modulation n’est pas un oscillateur
unique appliqué au cadre.

Lumières à contributions multiples dans ce plan :

| Lumière | Sources |
|---|---|
| `light.tr-niche` | `flame.tr-brown-a`, `flame.tr-brown-b` |
| `light.left-niche` | `flame.left-a`, `flame.left-b` |
| `light.lr-niche` | `flame.lr-a`, `flame.lr-b` |
| `light.left-floor` | `flame.left-a`, `flame.left-b` |
| `light.lr-floor` | `flame.lr-a`, `flame.lr-b` |

`light.tl-niche` et `light.mr-niche` n’ont qu’une source. Le pool de sol reste
une modulation du pool peint, pas un reflet reconstruit. Aucun éclairage global
du sol n’est ajouté.

### 3.4 Atmosphère B

B est une couche additive sur A corrigée, pas une seconde version des flammes :

- voile limité à `region.sky` ;
- dérive lente et variation à trois échelles spatiales ;
- contraste local, garde-fous de contour, de chaleur et de luminance ;
- aucun pompage global d’exposition ;
- étoiles et lumière froide désactivées ;
- boucle 12 s à harmoniques entières.

La page montre **A seule** et **A + ciel B** côte à côte. Le delta visible est
le ciel ; les flammes, les pools et le fond ne sont pas réinitialisés.

## 4. Deux climats, même niche

La niche gauche réunit deux flammes, `light.left-niche` et
`light.left-floor`. Les deux profils utilisent la même source, le même modèle de
lumière, la même boucle et le même cadrage. Seuls les paramètres d’air changent.

Contrôles exposés : **force**, **fréquence des rafales**, **équilibre
directionnel**, **variation individuelle**. Le seed est affiché, non éditable.
L’indicateur de direction est disponible uniquement en debug ; il est dessiné
après le rendu, ne modifie aucun pixel et n’existe pas dans un export.

Relevé de contrôle sur 48 échantillons :

- calme : flux signé environ `-0.07…0.13`, 2 changements de signe, enveloppe
  `0.12…0.99` ;
- brise : flux signé environ `-0.17…0.50`, 4 changements de signe, enveloppe
  `0.34…1.00`.

Ces chiffres décrivent le driver, pas une qualité artistique.

## 5. Mesures et contrôles

Sur la page, à 320×256 pour les mesures régionales :

- **A seule** : flammes Δmoy ~12.2/255, p95 ~26.0, max ~89.3 ; lumières hors
  flammes Δmoy ~3.2, p95 ~13.0, max ~29.0 ; variation temporelle régionale
  Δmoy ~0.73, max ~72.7 ;
- **B, ciel seul ajout** : Δmoy ~42.4, p95 ~61.7, max ~67.7 ; variation
  temporelle du ciel Δmoy ~7.6, max ~23.7.

Ces valeurs mesurent une présence de changement. Elles ne classent ni la beauté,
ni le réalisme, ni la lisibilité en mouvement.

Les tests vérifient :

```sh
node tests/test_motion_quality_lab.mjs
node tests/test_scene_variants.mjs
```

- deux flammes reçoivent le même flux partagé mais des délais, sensibilités et
  inclinaisons différents ;
- les deux profils sont distincts et conservent les deux signes ;
- les ancres et les tailles des flammes sont inchangées ;
- aucun octet hors supports, y compris en 1280×1024 ;
- boucle 0/12 s bit-identique et déterminisme à 480×384 et en natif ;
- aller-retour JSON des plans ;
- les projets A/B originaux restent sans champ `lab` ;
- A et B ne diffèrent que dans le ciel.

## 6. Ce qui reste artificiel

- La lumière est peinte ; elle n’est pas séparée de la matière.
- Le pool de sol est modulé, pas reconstruit comme un reflet.
- Le driver est une approximation déterministe, pas un écoulement physique.
- La flamme reste procédurale.
- L’atmosphère n’est pas une diffusion volumique ; il n’y a pas de bloom séparé.
- Aucune fumée, aucun cloth, aucun feuillage et aucun renderer physique n’est
  implémenté.

## 7. Décisions encore nécessaires

1. **A seule** ou **A + atmosphère B**.
2. Pour A : la réponse collective et la lumière locale en mouvement.
3. Pour B : la lisibilité du voile sans laver les silhouettes.
4. Le profil d’air préféré : calme, brise, ou aucun des deux.
5. Un export complet ne doit être ouvert qu’après ces décisions.

Aucun master, aucun MP4, aucun push, aucun LTX, aucun modèle, aucune dépendance
et aucun service de production n’ont été ajoutés dans cette passe.
