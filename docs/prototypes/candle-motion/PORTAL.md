# Portail récursif — concept séparé

**Statut :** concept seulement. Aucune implémentation, aucune image, aucun
rendu, aucun test. Ce document n’entre pas dans le prototype des bougies.

## 1. Idée

Un animatic de **zoom récursif** : la caméra avance vers une ouverture
rectangulaire ; dans l’ouverture apparaît la même pièce, avec la même bougie,
à une échelle inférieure. Le mouvement se répète, donnant l’impression d’une
descente sans fin dans la même image.

C’est un effet **2D** : la profondeur est suggérée par l’emboîtement, pas par
une vraie géométrie 3D, pas par une parallaxe, pas par un déplacement de caméra
dans un volume.

## 2. Ce qui doit s’aligner

Pour qu’un niveau paraisse continu avec le suivant, il ne suffit pas que le
facteur d’échelle soit le même. Il faut au minimum :

1. **Correspondance de similarité** entre le rectangle de l’ouverture vue à la
   fin du niveau A et le bord extérieur du cadre du niveau B : échelle,
   translation et rotation.
2. **Continuité de contour** : les bords de l’ouverture doivent coïncider avec
   les bords du cadre suivant, sans décalage d’un pixel ni marche visible.
3. **Continuité de lumière** : la luminance et la couleur de la zone-frontière
   doivent rester dans le même ordre, sinon une ligne apparaît au raccord.
4. **Continuité de contenu** : si la pièce change (objet déplacé, flamme
   différente), le raccord est visible même si la géométrie est parfaite.
5. **Stabilité du point de fuite** : le centre du zoom doit rester fixe pendant
   toute la séquence, sinon l’ouverture « glisse ».

Un facteur d’échelle identique ne garantit donc **rien** à lui seul. Une
similarité exacte, un contenu identique et un raccord vérifié sont nécessaires.

## 3. Transition et boucle

Deux options réalistes :

- **Coupe masquée** : au moment où le rectangle intérieur remplit exactement le
  cadre, on coupe vers le niveau suivant déjà aligné. La coupe est invisible si
  le contenu et la lumière coïncident.
- **Fondu court** : 2 à 4 images de fondu au moment du raccord. Plus tolérant
  aux petits décalages, mais visible si le contenu diffère.

Pour une boucle parfaite, la **dernière image** doit être une copie transformée
de la première, ou le raccord doit être masqué par un événement (obscurité,
passage d’un objet, coupe). Sans cela, la boucle présente un saut.

## 4. Ce que ce n’est pas

- Pas un vrai travelling : aucune parallaxe, aucune occlusion 3D, aucun
  déplacement de caméra dans un volume.
- Pas une preuve de profondeur : l’œil accepte l’emboîtement, pas la géométrie.
- Pas une recette du prototype bougies : il ne faut pas l’y ajouter. Le
  prototype actuel garde une caméra fixe et n’anime que les flammes et la
  lumière locale.
- Pas mesuré : aucune évaluation de netteté, de moiré ou de stabilité n’a été
  faite. L’effet reste à tester séparément.

## 5. Prochain pas, si le concept est retenu

Produire **une** planche de 3 images (niveau 0, niveau 1, niveau 2) avec une
seule similarité calculée, puis vérifier le raccord à l’œil avant toute
animation. Ne pas commencer par un rendu long.
