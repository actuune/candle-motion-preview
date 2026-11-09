# Variante C — trois propositions, aucune implémentation

**Statut :** propositions non approuvées, hors baseline. Le projet reste en
`candle-motion-project/v2`; aucune de ces options n’est branchée dans le
renderer. Ne pas les combiner automatiquement et ne pas les présenter comme un
contenu déjà présent dans l’image.

## C1 — Ombre géométrique retenue

**Idée :** une ombre douce et stable, projetée par une forme architecturale ou
un occultant discret, sans nouvelle calligraphie ni objet décoratif.

**Prérequis :**

- hypothèse explicite d’une source et d’un occultant ;
- un support/masque éditable pour l’ombre ;
- nettoyage local de l’arête de mur et du sol ;
- nouveau renderer d’ombre (pas une détection automatique).

**Contenu image :** aucun ajout nécessaire si l’occultant existe déjà ; sinon,
une forme doit être dessinée et approuvée. Aucun moucharabieh n’est supposé
présent.

## C2 — Fil de fumée fin

**Idée :** un fil de fumée ténu, court, qui accompagne une flamme existante sans
devenir un nuage ou un effet de brume.

**Prérequis :**

- support/masque étroit et nettoyage local autour de la flamme ;
- nouveau renderer de fumée, boucle propre et seed fixe ;
- validation visuelle de l’épaisseur, de la vitesse et du raccord ;
- aucune revendication d’encens invisible déjà présent.

**Contenu image :** possible sans nouvelle image si le tracé reste procédural,
mais la forme doit être approuvée. La collection baseline interdit la fumée :
cette option reste une variante, jamais une règle universelle.

## C3 — Petit mouvement textile

**Idée :** un pan de textile existant ou une petite zone textile ajoutée, avec
un mouvement borné et retenu.

**Prérequis :**

- nouvelle matière image ou région textile explicitement dessinée ;
- masque et nettoyage local des plis et des bords ;
- nouveau renderer textile ;
- aucune combinaison avec l’ombre ou la fumée sans choix utilisateur.

**Contenu image :** le plus souvent une nouvelle image ou une retouche locale
approuvée. Le renderer bougies ne suffit pas.

## Recommandation

Après choix utilisateur, prototyper **C2 — fil de fumée fin** en premier : c’est
l’option la plus localisée, sans nouvelle architecture ni objet, et elle peut
être bornée par un support étroit. Elle exige néanmoins un nouveau renderer et
une validation visuelle ; elle ne doit pas être implémentée avant cet accord.

## Ce que ces propositions ne sont pas

- une détection sémantique ou une occultation physique ;
- un ajout d’encens, de moucharabieh, de calligraphie ou de décor ;
- une modification de la baseline, de la collection ou du master ;
- une raison de fusionner A, B et C.
