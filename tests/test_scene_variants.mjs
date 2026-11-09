import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const PAGE = new URL("docs/prototypes/candle-motion/index.html", ROOT);
const BASE_FILE = new URL("docs/prototypes/candle-motion/motion-plan.candles-4243.json", ROOT);
const A_FILE = new URL("docs/prototypes/candle-motion/motion-plan.candles-4243.variant-a.json", ROOT);
const B_FILE = new URL("docs/prototypes/candle-motion/motion-plan.candles-4243.variant-b.json", ROOT);
const SCHEMA_FILE = new URL("docs/prototypes/candle-motion/motion-plan.schema.json", ROOT);

const html = readFileSync(PAGE, "utf8");
const baseline = JSON.parse(readFileSync(BASE_FILE, "utf8"));
const variantA = JSON.parse(readFileSync(A_FILE, "utf8"));
const variantB = JSON.parse(readFileSync(B_FILE, "utf8"));
const schema = JSON.parse(readFileSync(SCHEMA_FILE, "utf8"));
const baselineSnapshot = JSON.stringify(baseline);

const coreStart = html.indexOf("/* === CORE:BEGIN === */") + "/* === CORE:BEGIN === */".length;
const coreEnd = html.indexOf("/* === CORE:END === */");
assert.ok(coreEnd > coreStart, "cœur absent");
const core = await import("data:text/javascript;base64," + Buffer.from(html.slice(coreStart, coreEnd), "utf8").toString("base64"));

function makeBase(width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rgba[i] = 9 + ((x * 13 + y * 5) % 18);
      rgba[i + 1] = 8 + ((x * 7 + y * 11) % 15);
      rgba[i + 2] = 14 + ((x * 3 + y * 17) % 20);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function render(plan, time, base, width, height) {
  const out = new Uint8ClampedArray(base.length);
  core.renderFrame(base, plan, time, { width, height, out });
  return out;
}

function linksOf(plan) {
  return Object.fromEntries(plan.regions
    .filter((region) => Array.isArray(region.sources))
    .map((region) => [region.id, [...region.sources]]));
}

/* ---------- baseline intact et variantes nommées ---------- */

assert.equal(baseline.loop.durationSeconds, 6, "le baseline historique reste à 6 s");
assert.equal(baseline.atmosphere, undefined, "le baseline ne reçoit aucune couche de ciel");
assert.equal(baseline.regions.length, 15);
assert.equal(baseline.groups.length, 1);
assert.equal(variantA.id, core.VARIANT_A_ID);
assert.equal(variantB.id, core.VARIANT_B_ID);
assert.equal(variantA.loop.durationSeconds, 12);
assert.equal(variantB.loop.durationSeconds, 12);
assert.equal(variantA.status, "provisional");
assert.equal(variantB.status, "provisional");
assert.equal(variantA.approval.status, "not-approved");
assert.equal(variantB.approval.status, "not-approved");
assert.equal(variantA.regions.length, baseline.regions.length);
assert.equal(variantB.regions.length, baseline.regions.length + 2);
assert.equal(variantA.groups.length, 1);
assert.equal(variantB.groups.length, 2);
assert.equal(variantA.atmosphere, undefined);
assert.ok(variantB.atmosphere, "variante B sans configuration atmosphérique");
assert.equal(variantB.atmosphere.enabled, true);
assert.equal(variantB.atmosphere.stars, false, "étoiles désactivées par défaut");
assert.equal(variantB.atmosphere.coolLight, false, "lumière froide désactivée par défaut");
assert.equal(variantB.atmosphere.cycles, 2);
assert.equal(variantB.atmosphere.regionId, "region.sky");
assert.ok(variantB.groups.some((group) => group.id === "group.atmosphere"));
assert.ok(variantB.regions.some((region) => region.id === "region.sky" && region.role === "protected"));
assert.ok(variantB.regions.some((region) => region.id === "region.cool-light" && region.role === "protected"));
assert.deepEqual(linksOf(variantA), linksOf(baseline), "A ne doit ajouter aucune liaison");
assert.deepEqual(linksOf(variantB), linksOf(baseline), "B ne doit ajouter aucune liaison");
assert.deepEqual(variantA, core.createOriginalAliveVariant(baseline));
assert.deepEqual(variantB, core.createAtmosphericNightVariant(baseline));
assert.equal(JSON.stringify(baseline), baselineSnapshot, "la génération ne doit pas muter le baseline");

/* ---------- schéma rétrocompatible ---------- */

assert.ok(schema.properties.atmosphere, "propriété atmosphere absente");
assert.equal(schema.required.includes("atmosphere"), false, "atmosphere doit rester optionnel");
assert.equal(schema.$defs.atmosphere.required.includes("coolLightRegionId"), false);
assert.equal(schema.$defs.atmosphere.properties.cycles.minimum, 1);
assert.equal(schema.$defs.atmosphere.properties.cycles.maximum, 3);

/* ---------- round-trip et timing ---------- */

for (const plan of [variantA, variantB]) {
  assert.deepEqual(core.parseProject(core.serializeProject(plan)), plan);
  const times = core.sampleTimes(plan);
  assert.equal(times.length, 12 * 24);
  assert.equal(times[0], 0);
  assert.ok(times[times.length - 1] < 12, "aucune frame finale dupliquée");
  assert.ok(Math.abs(times[times.length - 1] - (12 - 12 / times.length)) < 1e-12);
}

/* ---------- boucle, déterminisme et continuité ---------- */

const W = 320;
const H = 256;
const base = makeBase(W, H);
const stress = structuredClone(variantB);
stress.atmosphere.stars = true;
stress.atmosphere.coolLight = true;
stress.atmosphere.cycles = 3;

for (const plan of [variantA, variantB, stress]) {
  const first = render(plan, 0, base, W, H);
  const again = render(plan, 0, base, W, H);
  const end = render(plan, 12, base, W, H);
  assert.equal(core.frameHash(first), core.frameHash(again), `${plan.id}: non déterministe`);
  assert.equal(core.frameHash(first), core.frameHash(end), `${plan.id}: boucle non raccordée`);
  for (let i = 0; i < first.length; i++) assert.equal(first[i], end[i], `${plan.id}: octet de bord différent`);
}

const eps = 1 / 240;
const before = new Uint8ClampedArray(base.length);
const after = new Uint8ClampedArray(base.length);
core.renderFrame(base, stress, 12 - eps, { width: W, height: H, out: before });
core.renderFrame(base, stress, 12, { width: W, height: H, out: after });
const stepBefore = new Float32Array(base.length);
for (let i = 0; i < base.length; i++) stepBefore[i] = after[i] - before[i];
core.renderFrame(base, stress, 0, { width: W, height: H, out: before });
core.renderFrame(base, stress, eps, { width: W, height: H, out: after });
let velocitySum = 0;
let velocityCount = 0;
for (let i = 0; i < base.length; i += 4) {
  for (let c = 0; c < 3; c++) {
    velocitySum += Math.abs((after[i + c] - before[i + c]) - stepBefore[i + c]);
    velocityCount++;
  }
}
assert.ok(velocitySum / velocityCount < 4, "discontinuité de mouvement au bord avec l’atmosphère");

/* ---------- aucune écriture hors supports autorisés ---------- */

const mask = core.renderWriteMask(variantB, W, H);
let skyPixels = 0;
for (let p = 0; p < mask.length; p++) if (mask[p]) skyPixels++;
assert.ok(skyPixels > 0, "masque d’écriture vide");
const bOut = render(variantB, 2.37, base, W, H);
let outside = 0;
for (let p = 0; p < mask.length; p++) {
  if (mask[p]) continue;
  const i = p * 4;
  if (bOut[i] !== base[i] || bOut[i + 1] !== base[i + 1] || bOut[i + 2] !== base[i + 2]) outside++;
}
assert.equal(outside, 0, "le ciel ou une autre couche écrit hors de ses supports");

/* ---------- occlusion de test : garde-fou chaud + arêtes ---------- */

const SW = 96;
const SH = 96;
const syntheticBase = new Uint8ClampedArray(SW * SH * 4);
for (let y = 0; y < SH; y++) {
  for (let x = 0; x < SW; x++) {
    const i = (y * SW + x) * 4;
    const warm = y >= 34 && y < 40;
    syntheticBase[i] = warm ? 100 : 8;
    syntheticBase[i + 1] = warm ? 48 : 10;
    syntheticBase[i + 2] = warm ? 18 : 24;
    syntheticBase[i + 3] = 255;
  }
}
const synthetic = structuredClone(variantB);
const syntheticSky = synthetic.regions.find((region) => region.id === "region.sky");
syntheticSky.support = { type: "polygon", points: [[0, 0], [1, 0], [1, 1], [0, 1]], extraRects: [], extraCircles: [] };
synthetic.regions = [syntheticSky];
synthetic.groups = [synthetic.groups.find((group) => group.id === "group.atmosphere")];
synthetic.groups[0].elementIds = ["region.sky"];
synthetic.atmosphere.coolLight = false;
synthetic.atmosphere.stars = false;
const syntheticOut = render(synthetic, 1, syntheticBase, SW, SH);
function meanDelta(x0, x1, y0, y1) {
  let total = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * SW + x) * 4;
      total += Math.abs(syntheticOut[i] - syntheticBase[i])
        + Math.abs(syntheticOut[i + 1] - syntheticBase[i + 1])
        + Math.abs(syntheticOut[i + 2] - syntheticBase[i + 2]);
      count += 3;
    }
  }
  return total / count;
}
const skyDelta = meanDelta(10, 86, 8, 24);
const warmDelta = meanDelta(10, 86, 35, 39);
assert.ok(skyDelta > 1, "le ciel synthétique ne change pas");
assert.ok(warmDelta < skyDelta * 0.55, `garde-fou chaud insuffisant : ciel ${skyDelta}, bande chaude ${warmDelta}`);

const starPlan = structuredClone(synthetic);
starPlan.atmosphere.stars = true;
const starOut = render(starPlan, 1, syntheticBase, SW, SH);
let starChanged = 0;
for (let p = 0; p < syntheticBase.length; p += 4) {
  if (starOut[p] !== syntheticOut[p] || starOut[p + 1] !== syntheticOut[p + 1] || starOut[p + 2] !== syntheticOut[p + 2]) starChanged++;
}
assert.ok(starChanged > 0, "les étoiles optionnelles ne dessinent aucun pixel dans le support");

/* ---------- lumière froide séparée, opt-in ---------- */

const coolPlan = structuredClone(variantB);
coolPlan.atmosphere.stars = false;
coolPlan.atmosphere.coolLight = false;
const coolOff = render(coolPlan, 1.2, base, W, H);
coolPlan.atmosphere.coolLight = true;
const coolOn = render(coolPlan, 1.2, base, W, H);
const coolRegion = coolPlan.regions.find((region) => region.id === "region.cool-light");
const coolMask = core.supportMask({ regions: [coolRegion] }, W, H, ["protected"]);
let coolChanged = 0;
for (let p = 0; p < coolMask.length; p++) {
  if (!coolMask[p]) continue;
  const i = p * 4;
  if (coolOn[i] !== coolOff[i] || coolOn[i + 1] !== coolOff[i + 1] || coolOn[i + 2] !== coolOff[i + 2]) coolChanged++;
}
assert.ok(coolChanged > 0, "la lumière froide opt-in ne change aucun pixel de son support");

/* ---------- désactivation du groupe Atmosphère ---------- */

const frozen = structuredClone(variantB);
frozen.groups.find((group) => group.id === "group.atmosphere").animationEnabled = false;
const frozenOut = render(frozen, 1.2, base, W, H);
const frozenBase = render(variantA, 1.2, base, W, H);
assert.equal(core.frameHash(frozenOut), core.frameHash(frozenBase), "groupe Atmosphère figé : retour à A");

/* ---------- contrat d’interface ---------- */

for (const name of ["buildVariantUI", "applyVariant", "syncAtmosphereUI", "data-variant", "atmosphere-card"]) {
  assert.ok(html.includes(name), `contrôle d’interface absent : ${name}`);
}
assert.ok(html.includes("C · à choisir"), "les trois propositions C doivent rester visibles comme propositions");
assert.ok(html.includes("Étoiles (optionnel)"), "le contrôle étoiles doit être explicite");

console.log("test_scene_variants: ok");
console.log("  baseline 6 s intact, A/B 12 s, liens inchangés, ciel borné, occlusion chaude, boucle et round-trip");
