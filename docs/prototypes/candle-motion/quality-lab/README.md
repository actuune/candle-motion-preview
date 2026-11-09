# Laboratoire de mouvement — air partagé, A et B

**Statut :** étude supervisée, **aucun master image ou vidéo approuvé**.

Cette passe répond à la préférence pour la révision, au rejet de C et aux
corrections demandées sur A et B. Elle ne produit pas de nouvel export.

## Lancer la preview

```sh
cd studio-ltx
node tools/build-motion-quality-lab.mjs
python3 -m http.server 8766 --bind 127.0.0.1
```

Ouvrir :

`http://127.0.0.1:8766/docs/prototypes/candle-motion/quality-lab.html`

Pour une image stable : `?t=3&pause=1&view=one` (`a` ou `b`). Ces paramètres
servent à l’inspection et ne sont pas un export.

## Contenu

- `quality-lab.html` : page de preview.
- `quality-lab-core.mjs` : CORE existant + révision de laboratoire, généré
  depuis `index.html`.
- `quality-lab/lab-one-calm.json` : niche, calme avec rafales.
- `quality-lab/lab-one-breeze.json` : niche, brise alternée.
- `quality-lab/lab-living-fire.json` : A corrigée sans atmosphère.
- `quality-lab/lab-a-atmosphere.json` : A corrigée + ciel B.
- `quality-lab/manifest.json` : liaison des plans et de la source.
- `tools/motion-quality/lab-renderer.mjs` : source de la révision.
- `tools/motion-quality/quality-lab.template.html` : template de la page.

Les deux profils partagent la source, les supports, le modèle de lumière et la
boucle. Seuls les paramètres du driver d’air changent. Les contrôles exposés
sont la force, la fréquence des rafales, l’équilibre directionnel et la variation
individuelle. Le seed est enregistré et affiché.

Le mode debug dessine une direction d’air sur le canvas de preview. Cet overlay
n’appartient pas au rendu et ne doit jamais être exporté.

## Contrôles

```sh
node tests/test_motion_quality_lab.mjs
node tests/test_scene_variants.mjs
node --check tools/build-motion-quality-lab.mjs
node --check docs/prototypes/candle-motion/quality-lab-core.mjs
```

Les tests vérifient le driver partagé, les réponses distinctes, les deux profils,
les ancres, les bornes, la protection, la boucle, le déterminisme, le natif
1280×1024 et le round-trip JSON. Ils ne mesurent ni la beauté, ni le réalisme, ni
l’accord avec LTX.

## Limites

- La lumière peinte n’est pas séparée de la couleur matérielle.
- Le pool de sol est une modulation du pool existant, pas un reflet reconstruit.
- L’air est une approximation visuelle déterministe, pas une simulation physique.
- Il n’y a pas de renderer de fumée ; C est rejetée et retirée de la page.
- Aucun bloom séparé n’est implémenté.
- Aucun export complet avant validation humaine.
