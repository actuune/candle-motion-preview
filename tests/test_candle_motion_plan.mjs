import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const PAGE = new URL("docs/prototypes/candle-motion/index.html", ROOT);
const PLAN_FILE = new URL("docs/prototypes/candle-motion/motion-plan.candles-4243.json", ROOT);
const SCHEMA_FILE = new URL("docs/prototypes/candle-motion/motion-plan.schema.json", ROOT);
const SOURCE_PNG = new URL("validation/2026-11-09-reconstruction-v2/outputs/reconstruction-seed-4243.png", ROOT);

const html = readFileSync(PAGE, "utf8");
const plan = JSON.parse(readFileSync(PLAN_FILE, "utf8"));
const schema = JSON.parse(readFileSync(SCHEMA_FILE, "utf8"));
const LABEL = "Motion intention preview—not a prediction of AI output.";

function extract(marker) {
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `marqueur absent : ${marker}`);
  return start;
}

/* ---------- contrat de la page ---------- */

assert.match(html, /^<!doctype html>/i);
assert.ok(html.includes(LABEL), "libellé exact absent");
assert.equal((html.match(/<script\b/g) || []).length, 1, "un seul script embarqué");
assert.equal((html.match(/<style\b/g) || []).length, 1, "une seule feuille embarquée");
assert.equal((html.match(/<canvas\b/g) || []).length, 2, "canvas image + overlay");
assert.ok(!/<script\s+[^>]*src\s*=/i.test(html), "aucun script distant");
assert.ok(!/<link\s+[^>]*stylesheet/i.test(html), "aucune feuille distante");
assert.ok(!/<img\s+[^>]*src\s*=/i.test(html), "aucune image déclarée en dur");
assert.ok(!/https?:\/\//i.test(html), "aucune URL réseau");
assert.ok(!/@import\b/i.test(html), "aucun import CSS");
assert.ok(!/(?:background|background-image|border-image|list-style-image)\s*:[^;{}]*url\s*\(/i.test(html), "aucune ressource CSS");
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(html), "aucun accès réseau");
assert.ok(!/\blocalStorage\b/.test(html), "aucun stockage persistant");
assert.ok(html.includes("requestAnimationFrame"), "la lecture doit utiliser rAF");
assert.ok(html.includes("renderAtTime") || html.includes("renderFrame"), "rendu explicite attendu");
assert.ok(html.includes("ne sert qu’à faire avancer la lecture"), "rAF doit être documenté comme non autoritaire");

/* ---------- plan embarqué identique au plan externe ---------- */

const markerStart = "/* === PLAN:BEGIN === */";
const markerEnd = "/* === PLAN:END === */";
const start = html.indexOf(markerStart);
const end = html.indexOf(markerEnd);
assert.ok(start >= 0 && end > start, "marqueurs du plan absents");
const embedded = JSON.parse(html.slice(start + markerStart.length, end));
assert.deepEqual(embedded, plan, "le plan embarqué doit être identique au JSON externe");

/* ---------- schéma et structure ---------- */

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(plan.schema, "candle-motion-plan/v1");
assert.equal(plan.status, "diagnostic-not-approved");
assert.equal(plan.approval.status, "not-approved");
assert.equal(plan.label, LABEL);
assert.equal(plan.camera.mode, "fixed");
assert.equal(plan.camera.catalogId, "A-01");
assert.deepEqual(plan.engineControls.conditioningSignals, [], "aucun signal de conditionnement");
assert.match(plan.engineControls.note, /pas une entrée moteur/i);
assert.equal(plan.loop.durationSeconds, 6);
assert.equal(plan.loop.fps, 24);
assert.equal(plan.loop.samples, 144);
assert.equal(plan.loop.endpoint, "exclusive");
assert.equal(plan.loop.durationSeconds * plan.loop.fps, plan.loop.samples);
assert.equal(plan.seed, 4243);

const flames = plan.regions.filter((r) => r.role === "animated");
const lights = plan.regions.filter((r) => r.role === "light-influence");
assert.equal(flames.length, 8, "huit flammes");
assert.equal(lights.length, 7, "sept régions de lumière");
assert.equal(new Set(plan.regions.map((r) => r.id)).size, plan.regions.length, "ids uniques");
assert.ok(flames.every((r) => r.id.startsWith("flame.")));
assert.ok(lights.every((r) => r.id.startsWith("light.")));
assert.ok(flames.every((r) => r.motion.action === "flame-shape"));
assert.ok(lights.every((r) => r.motion.action === "warm-pool"));

const phases = flames.map((r) => r.motion.phase);
assert.equal(new Set(phases).size, 8, "déphasages distincts");
assert.ok(phases.every((p) => p >= 0 && p < 1));
assert.ok(flames.every((r) => Number.isInteger(r.motion.harmonic) && r.motion.harmonic >= 1));

for (const region of plan.regions) {
  assert.equal(region.support.type, "polygon");
  assert.ok(region.support.points.length >= 3, `${region.id}: polygone trop court`);
  for (const [x, y] of region.support.points) {
    assert.ok(x >= 0 && x <= 1, `${region.id}: x hors [0,1]`);
    assert.ok(y >= 0 && y <= 1, `${region.id}: y hors [0,1]`);
  }
  if (region.role === "animated") {
    assert.ok(region.anchor[0] >= 0 && region.anchor[0] <= 1);
    assert.ok(region.anchor[1] >= 0 && region.anchor[1] <= 1);
    assert.ok(region.height > 0 && region.width > 0);
    assert.equal(region.render.method, "procedural-flame-v1");
    assert.ok(region.render.suppression > 0);
    assert.ok(!("sources" in region), "une flamme ne doit pas lister de sources");
  } else {
    assert.ok(region.center[0] >= 0 && region.center[0] <= 1);
    assert.ok(region.center[1] >= 0 && region.center[1] <= 1);
    assert.ok(region.radii[0] > 0 && region.radii[1] > 0);
    assert.equal(region.render.method, "local-warm-pool-v1");
    assert.ok(region.sources.length >= 1);
    for (const id of region.sources) {
      assert.ok(flames.some((f) => f.id === id), `${region.id}: source inconnue ${id}`);
    }
  }
}

/* un preset par défaut, valeurs distinctes */
const presets = plan.presets;
assert.equal(presets.length, 4);
assert.equal(presets.filter((p) => p.default).length, 1);
assert.equal(plan.previewSettings.preset, presets.find((p) => p.default).id);
assert.equal(new Set(presets.map((p) => p.flame.amplitude)).size, 4, "presets différenciés");
assert.ok(presets.every((p) => p.lightScale > 0 && p.lightModulation >= 0));

/* ---------- média source ---------- */

if (existsSync(SOURCE_PNG)) {
  const png = readFileSync(SOURCE_PNG);
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), plan.source.width, "largeur PNG");
  assert.equal(png.readUInt32BE(20), plan.source.height, "hauteur PNG");
  const sha = createHash("sha256").update(png).digest("hex");
  assert.equal(sha, plan.source.sha256, "SHA-256 du fond");
  console.log("test_candle_motion_plan: fond vérifié (1280×1024, SHA-256)");
} else {
  console.log("test_candle_motion_plan: média source absent — vérification PNG ignorée (média hors Git)");
}

/* ---------- cœur déterministe, extrait de la page ---------- */

const coreStart = extract("/* === CORE:BEGIN === */") + "/* === CORE:BEGIN === */".length;
const coreEnd = html.indexOf("/* === CORE:END === */");
assert.ok(coreEnd > coreStart, "fin du cœur absente");
const coreSource = html.slice(coreStart, coreEnd);
assert.ok(!/Math\.random|Date\.now|performance\.now/.test(coreSource), "le cœur ne doit pas lire d’horloge ni d’aléatoire");
const core = await import("data:text/javascript;base64," + Buffer.from(coreSource, "utf8").toString("base64"));
assert.equal(core.CORE_VERSION, "candle-motion-core/1.0.0");

const W = 640;
const H = 512;
const base = new Uint8ClampedArray(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    base[i] = 10 + ((x * 17 + y * 3) % 22);
    base[i + 1] = 8 + ((x * 5 + y * 11) % 16);
    base[i + 2] = 12 + ((x * 3 + y * 7) % 20);
    base[i + 3] = 255;
  }
}

const outA = new Uint8ClampedArray(base.length);
const outB = new Uint8ClampedArray(base.length);
core.renderFrame(base, plan, 2.37, { width: W, height: H, out: outA });
core.renderFrame(base, plan, 2.37, { width: W, height: H, out: outB });
assert.equal(core.frameHash(outA), core.frameHash(outB), "même temps ⇒ même image");

core.renderFrame(base, plan, 0, { width: W, height: H, out: outA });
core.renderFrame(base, plan, plan.loop.durationSeconds, { width: W, height: H, out: outB });
assert.equal(core.frameHash(outA), core.frameHash(outB), "render(T) doit égaler render(0)");
for (let i = 0; i < outA.length; i++) {
  assert.equal(outA[i], outB[i], `octet ${i} différent au bord de boucle`);
}

/* temps d’échantillonnage */
const times = core.sampleTimes(plan);
assert.equal(times.length, plan.loop.samples);
assert.equal(times[0], 0);
assert.ok(Math.abs(times[times.length - 1] - (6 - 6 / 144)) < 1e-12);
assert.ok(times[times.length - 1] < 6);
for (let k = 1; k < times.length; k++) assert.ok(times[k] > times[k - 1]);

/* protection : tout pixel hors union des supports reste identique au fond */
const mask = core.supportMask(plan, W, H);
let outsideChanges = 0;
for (let p = 0; p < mask.length; p++) {
  if (mask[p]) continue;
  const i = p * 4;
  if (outA[i] !== base[i] || outA[i + 1] !== base[i + 1] || outA[i + 2] !== base[i + 2]) outsideChanges++;
}
assert.equal(outsideChanges, 0, "des pixels protégés ont changé");

/* supports animés disjoints, lumières autorisées à les chevaucher */
const stamp = new Uint8Array(W * H);
let overlaps = 0;
for (const region of flames) {
  const single = { ...plan, regions: [region] };
  const m = core.supportMask(single, W, H, ["animated"]);
  let pixels = 0;
  for (let p = 0; p < m.length; p++) {
    if (!m[p]) continue;
    pixels++;
    if (stamp[p] === 1) overlaps++;
    stamp[p] = 1;
  }
  assert.ok(pixels > 0, `${region.id}: support vide à cette résolution`);
}
assert.equal(overlaps, 0, "les supports animés doivent être disjoints");

const lightMask = core.supportMask(plan, W, H, ["light-influence"]);
let lightOnFlame = 0;
for (let p = 0; p < lightMask.length; p++) {
  if (lightMask[p] && stamp[p]) lightOnFlame++;
}
assert.ok(lightOnFlame > 0, "au moins une lumière doit chevaucher une flamme (politique documentée)");

/* mouvement réel à l’intérieur des supports */
core.renderFrame(base, plan, 1.5, { width: W, height: H, out: outA });
let changed = 0;
for (let p = 0; p < mask.length; p++) {
  if (!mask[p]) continue;
  const i = p * 4;
  if (outA[i] !== base[i] || outA[i + 1] !== base[i + 1] || outA[i + 2] !== base[i + 2]) changed++;
}
assert.ok(changed > 200, `trop peu de pixels animés : ${changed}`);

/* continuité de vitesse au bord : pas avant ≈ pas après */
const eps = 1 / 240;
const before = new Uint8ClampedArray(base.length);
const afterEdge = new Uint8ClampedArray(base.length);
core.renderFrame(base, plan, 6 - eps, { width: W, height: H, out: before });
core.renderFrame(base, plan, 6, { width: W, height: H, out: afterEdge });
const stepBefore = new Float32Array(before.length);
for (let i = 0; i < before.length; i++) stepBefore[i] = afterEdge[i] - before[i];
core.renderFrame(base, plan, 0, { width: W, height: H, out: before });
core.renderFrame(base, plan, eps, { width: W, height: H, out: afterEdge });
let velocity = 0;
let velocityCount = 0;
for (let i = 0; i < before.length; i += 4) {
  for (let c = 0; c < 3; c++) {
    velocity += Math.abs((afterEdge[i + c] - before[i + c]) - stepBefore[i + c]);
    velocityCount++;
  }
}
const velocityMean = velocity / velocityCount;
assert.ok(velocityMean < 4, `discontinuité de vitesse au bord : ${velocityMean}`);

/* luminance globale : variation finie, sans seuil artistique */
let minLum = Infinity;
let maxLum = -Infinity;
for (let k = 0; k < 12; k++) {
  core.renderFrame(base, plan, (k * 6) / 12, { width: W, height: H, out: outA });
  const lum = core.meanLuminance(outA, W, H, 4);
  minLum = Math.min(minLum, lum);
  maxLum = Math.max(maxLum, lum);
}
assert.ok(minLum > 0 && maxLum > minLum, "la luminance doit varier dans la boucle");
assert.ok(maxLum / minLum < 4, `variation de luminance trop grande : ${maxLum / minLum}`);

/* ---------- documentation ---------- */

const excalidraw = readFileSync(new URL("docs/prototypes/candle-motion/EXCALIDRAW.md", ROOT), "utf8");
assert.ok(/MIT/.test(excalidraw), "licence Excalidraw");
assert.ok(/Ne pas adopter Excalidraw/.test(excalidraw), "recommandation absente");

const reconciliation = readFileSync(new URL("validation/2026-11-09-video-test/RECONCILIATION.md", ROOT), "utf8");
assert.ok(/rejetée pour la production/.test(reconciliation));
assert.ok(/Aucune trajectoire de\s+caméra exacte n’est revendiquée/.test(reconciliation));
assert.ok(/No audio treatment/.test(reconciliation) || /no audio treatment/.test(reconciliation));

console.log("test_candle_motion_plan: ok");
console.log(`  flammes=${flames.length} lumières=${lights.length} changés=${changed} vitesse=${velocityMean.toFixed(3)} luminance=${minLum.toFixed(5)}..${maxLum.toFixed(5)}`);
