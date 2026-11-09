# Recettes d’éléments — état initial

Ces recettes décrivent des **contrats de mouvement**, pas des simulateurs
physiques. Une seule est exécutée dans cette passe : **Bougies**. Feuillage et
tissu restent des recettes de conception ; elles ne doivent pas être présentées
comme implémentées.

## A. Bougies — implémentée

**Éléments :** 8 flammes existantes + 7 régions de lumière locale.
**Groupe :** `group.candles`.

**Entrées partagées :**

- amplitude et vitesse harmonique ;
- inclinaison ;
- intensité liée ;
- direction et force du vent ;
- variation `synchronized | correlated | independent` ;
- graine déterministe du projet ;
- preset versionné, avec défaut et overrides.

**Entrées par flamme :**

- taille ;
- ancre de mèche ;
- réponse au vent ;
- phase ;
- multiplicateur d’intensité ;
- support polygonal corrigeable ;
- lumières locales liées.

**Rendu :** remplacement local de la flamme statique, forme procédurale,
suppression elliptique bornée, halo local, pools de lumière additifs liés à la
moyenne des flammes sources.

**Boucle :** sinus de fréquences entières ; vent seedé périodique ; aucun bruit
temporel non périodique. Même projet + seed + temps ⇒ même frame.

**Limites :** flammes stylisées, pas de combustion physique ; le nettoyage ne
reconstruit pas le mur ; la lumière n’est pas une simulation ; le preset `Sobre`
reste une intention, pas une preuve de réalisme.

**Invariant :** désactiver ou protéger conserve l’élément statique et le support ;
aucun élément n’est masqué.

## B. Feuillage / arbre — documentée, non implémentée

**Objectif :** un tronc fixe, des branches ancrées, une réponse corrélée au vent,
sans wobble global de l’objet.

**Contrat proposé :**

| Paramètre | Portée | Rôle |
|---|---|---|
| `trunkMask` | élément | zone fixe, jamais déformée |
| `branchAnchors` | branches | points d’attache fixes |
| `branchPhase` | branche | déphasage propre |
| `windResponse` | branche | amplitude de réponse |
| `leafDensityMask` | feuillage | masque de feuilles, pas une forme pleine |
| `windDirection` / `windStrength` | groupe | signal partagé |
| `variation` | groupe | corrélation, pas copies |
| `loopSeed` | projet | reproductibilité |

**Mouvement :** le vent commun incline les branches autour de leurs ancres ; les
sous-branches répondent avec retard et amplitude décroissante. Les feuilles
peuvent avoir une micro-réponse, mais le tronc ne bouge pas. Aucune déformation
globale de l’image.

**Pourquoi une démo séparée :** il faut un asset synthétique avec plusieurs
branches et un masque par branche. Une seule boîte ou un seul masque plat ne
démontre pas l’articulation. Une petite démo autonome est préférable à une
extension du groupe Bougies ; elle n’est pas incluse ici.

**Limite :** un masque plat décrit une zone, pas une hiérarchie de branches. Ne
pas appeler cela une simulation d’arbre.

## C. Tissu — documentée, non implémentée

**Objectif :** points d’attache fixes, ondes cohérentes, amplitude bornée.

**Contrat proposé :**

| Paramètre | Portée | Rôle |
|---|---|---|
| `attachmentPoints` | élément | points fixes |
| `freeEdgeMask` | élément | bord libre |
| `wavePhase` | élément | déphasage |
| `waveSpeed` | groupe | vitesse partagée |
| `amplitude` | groupe | amplitude bornée |
| `damping` | groupe | atténuation vers les attaches |
| `variation` | groupe | corrélation spatiale |
| `loopSeed` | projet | reproductibilité |

**Mouvement :** une onde progressive parcourt la zone libre ; l’amplitude est
nulle aux attaches et maximale au bord libre. La déformation reste bornée et
périodique. Pas de drapeau qui se déplace en bloc.

**Pourquoi une démo séparée :** il faut un asset synthétique avec des attaches
identifiables et un masque de tissu. Une image plate et un simple déplacement
sinusoïdal ne démontrent pas une onde cohérente. Démo non incluse ici.

**Limite :** une seule transformation globale n’est pas un tissu ; une grille ou
une déformation articulée serait nécessaire. Aucun moteur de simulation n’est
installé ou revendiqué.

## Règles communes

1. **Ancrages fixes** : ce qui est attaché ne doit pas suivre le wobble.
2. **Signal partagé + réponse individuelle** : le vent commun n’impose pas une
   copie identique.
3. **Boucle** : fréquences entières et seed fixes ; pas de bruit non périodique.
4. **Support** : les corrections manuelles autorisent des pixels ; elles ne
   changent pas l’ancre ni la physique.
5. **Honnêteté** : pas de « simulation complète » à partir d’un masque plat.
6. **Pas d’exécution silencieuse** : une recette non branchée reste documentée ou
   proposée, jamais présentée comme un contrôle moteur.

## Ordre d’implémentation futur

1. Bougies — fait.
2. Feuillage synthétique — démo autonome, asset plat avec branches séparées.
3. Tissu synthétique — démo autonome, grille et attaches.
4. Seulement ensuite, envisager un adaptateur de production ; ce n’est pas dans
   cette passe.
