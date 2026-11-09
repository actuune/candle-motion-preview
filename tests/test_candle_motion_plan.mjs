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
assert.equal((html.match(/\bfetch\s*\(/g) || []).length, 0, "aucune requête réseau : l’image locale est hashée dans le navigateur");
assert.ok(!/fetch\s*\(\s*["'`]https?:/i.test(html), "fetch ne doit pas viser une URL distante");
assert.ok(!/XMLHttpRequest|WebSocket/.test(html), "aucun accès réseau annexe");
assert.ok(!/\blocalStorage\b/.test(html), "aucun stockage persistant");
assert.ok(html.includes("requestAnimationFrame"), "la lecture doit utiliser rAF");
assert.ok(html.includes("renderAtTime") || html.includes("renderFrame"), "rendu explicite attendu");
assert.ok(html.includes("ne sert qu’à faire avancer la lecture"), "rAF doit être documenté comme non autoritaire");
assert.ok(html.includes("downloadProject"), "export projet attendu");
assert.ok(html.includes("loadProjectFile"), "import projet attendu");
assert.ok(html.includes("verifySourceAsset"), "vérification d’asset attendue");
assert.ok(html.includes("createEmptyProject"), "création de projet générique attendue");
assert.ok(html.includes("importLocalImage"), "import d’image locale attendu");
assert.ok(html.includes("setAddRegionMode"), "ajout manuel de région attendu");
assert.ok(html.includes("PROTOTYPE_BUILD"), "identifiant de build attendu");
assert.ok(html.includes("createHistory"), "historique attendu");
assert.ok(html.includes("confirmProposal"), "confirmation de proposition attendue");

/* ---------- projet embarqué identique au JSON externe ---------- */

const markerStart = "/* === PLAN:BEGIN === */";
const markerEnd = "/* === PLAN:END === */";
const start = html.indexOf(markerStart);
const end = html.indexOf(markerEnd);
assert.ok(start >= 0 && end > start, "marqueurs du plan absents");
const embedded = JSON.parse(html.slice(start + markerStart.length, end));
assert.deepEqual(embedded, plan, "le projet embarqué doit être identique au JSON externe");

/* ---------- schéma et structure ---------- */

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.$id, "candle-motion-project/v2");
assert.equal(plan.schema, "candle-motion-project/v2");
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
assert.equal(plan.previewSettings.preset, "vivant");

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

const group = plan.groups[0];
assert.equal(plan.groups.length, 1, "un groupe bougies");
assert.equal(group.id, "group.candles");
assert.equal(group.category, "candles");
assert.equal(group.elementIds.length, plan.regions.length, "le groupe couvre tous les éléments");
assert.deepEqual(new Set(group.elementIds), new Set(plan.regions.map((r) => r.id)), "ids de groupe");
assert.ok(plan.presets.some((preset) => preset.id === group.presetId && preset.version === group.presetVersion));
assert.equal(group.settings.wind.direction, 12, "réglage de groupe explicite");

for (const region of plan.regions) {
  assert.equal(region.support.type, "polygon");
  assert.ok(region.support.points.length >= 3, `${region.id}: polygone trop court`);
  assert.ok(Array.isArray(region.support.extraRects), `${region.id}: extraRects`);
  assert.ok(Array.isArray(region.support.extraCircles), `${region.id}: extraCircles`);
  for (const [x, y] of region.support.points) {
    assert.ok(x >= 0 && x <= 1, `${region.id}: x hors [0,1]`);
    assert.ok(y >= 0 && y <= 1, `${region.id}: y hors [0,1]`);
  }
  assert.equal(region.groupId, group.id);
  assert.equal(region.category, region.role === "animated" ? "flame" : "light");
  assert.equal(region.operation, "animate");
  assert.ok(!("amplitude" in region.motion), "les valeurs partagées ne doivent pas être dupliquées dans motion");
  assert.ok(!("harmonic" in region.motion), "les valeurs partagées ne doivent pas être dupliquées dans motion");
  assert.ok(!("lean" in region.motion), "les valeurs partagées ne doivent pas être dupliquées dans motion");
  if (region.role === "animated") {
    assert.ok(region.anchor[0] >= 0 && region.anchor[0] <= 1);
    assert.ok(region.anchor[1] >= 0 && region.anchor[1] <= 1);
    assert.ok(region.height > 0 && region.width > 0);
    assert.ok(region.size >= 0.25 && region.size <= 3);
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

/* un preset par défaut, cinq intensités distinctes, dont un preset retenu */
const presets = plan.presets;
assert.equal(presets.length, 5, "quatre presets historiques + Sobre");
assert.equal(presets.filter((p) => p.default).length, 1);
assert.equal(plan.previewSettings.preset, presets.find((p) => p.default).id);
assert.equal(new Set(presets.map((p) => p.flame.amplitude)).size, 5, "presets différenciés");
assert.ok(presets.every((p) => p.lightScale > 0 && p.lightModulation >= 0));
assert.ok(presets.every((p) => Number.isInteger(p.version) && p.version >= 1));
assert.ok(presets.every((p) => ["synchronized", "correlated", "independent"].includes(p.variation)));
const sober = presets.find((p) => p.id === "sobre");
assert.ok(sober, "preset Sobre absent");
assert.ok(sober.flame.amplitude <= 0.1 && sober.wind.strength <= 0.12, "Sobre doit rester retenu");
assert.equal(sober.variation, "correlated");

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
assert.equal(core.CORE_VERSION, "scene-motion-core/2.2.0");
assert.equal(core.PROTOTYPE_BUILD, "2.2.0-variants.1");
assert.equal(core.PROJECT_SCHEMA, "candle-motion-project/v2");

const W = 640;
const H = 512;
function makeBase(width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rgba[i] = 10 + ((x * 17 + y * 3) % 22);
      rgba[i + 1] = 8 + ((x * 5 + y * 11) % 16);
      rgba[i + 2] = 12 + ((x * 3 + y * 7) % 20);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}
const base = makeBase(W, H);

const outA = new Uint8ClampedArray(base.length);
const outB = new Uint8ClampedArray(base.length);
core.renderFrame(base, plan, 2.37, { width: W, height: H, out: outA });
core.renderFrame(base, plan, 2.37, { width: W, height: H, out: outB });
assert.equal(core.frameHash(outA), core.frameHash(outB), "même temps ⇒ même image");

core.renderFrame(base, plan, 0, { width: W, height: H, out: outA });
core.renderFrame(base, plan, plan.loop.durationSeconds, { width: W, height: H, out: outB });
assert.equal(core.frameHash(outA), core.frameHash(outB), "render(T) doit égaler render(0)");
for (let i = 0; i < outA.length; i++) assert.equal(outA[i], outB[i], `octet ${i} différent au bord de boucle`);

/* temps d’échantillonnage */
const times = core.sampleTimes(plan);
assert.equal(times.length, plan.loop.samples);
assert.equal(times[0], 0);
assert.ok(Math.abs(times[times.length - 1] - (6 - 6 / 144)) < 1e-12);
assert.ok(times[times.length - 1] < 6);
for (let k = 1; k < times.length; k++) assert.ok(times[k] > times[k - 1]);

/* précédence et couches */
const precedence = structuredClone(plan);
const probe = precedence.regions[0];
const pgroup = precedence.groups[0];
pgroup.settings.flame = { amplitude: 0.21 };
probe.overrides.flame = { amplitude: 0.33 };
let resolved = core.resolveField(precedence, probe, "flame.amplitude");
assert.equal(resolved.source, "element");
assert.equal(resolved.value, 0.33);
delete probe.overrides.flame.amplitude;
resolved = core.resolveField(precedence, probe, "flame.amplitude");
assert.equal(resolved.source, "group");
assert.equal(resolved.value, 0.21);
delete pgroup.settings.flame.amplitude;
resolved = core.resolveField(precedence, probe, "flame.amplitude");
assert.equal(resolved.source, "preset");
assert.equal(resolved.value, 0.16);
assert.equal(core.resolveField(precedence, probe, "wind.direction").source, "group");
assert.equal(core.resolveField(precedence, probe, "wind.strength").source, "preset");
const app = core.resolveSettings(precedence, probe);
assert.equal(app.flame.harmonic, 1);
assert.equal(app.variation, "correlated");

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

/* désactivation : groupe statique = fond, aucun élément supprimé du projet */
const disabled = structuredClone(plan);
disabled.groups.forEach((item) => { item.animationEnabled = false; });
disabled.regions.forEach((item) => { delete item.animationEnabled; });
core.renderFrame(base, disabled, 1.5, { width: W, height: H, out: outA });
assert.equal(core.frameHash(outA), core.frameHash(base), "groupe désactivé : le fond doit rester intact");
assert.equal(disabled.regions.length, plan.regions.length, "désactiver ne retire pas les éléments");
const activeMask = core.supportMask(disabled, W, H, ["animated", "light-influence"], { activeOnly: true });
assert.equal(activeMask.reduce((sum, value) => sum + value, 0), 0, "aucun support actif si tout est désactivé");

/* une surcharge d’élément ne fuit pas hors de son support */
const oneOff = structuredClone(plan);
const oneFlame = oneOff.regions.find((region) => region.role === "animated");
oneFlame.animationEnabled = false;
core.renderFrame(base, oneOff, 1.7, { width: W, height: H, out: outA });
assert.equal(core.isElementAnimated(oneOff, oneFlame), false);
assert.equal(core.isElementAnimated(oneOff, oneOff.regions.find((region) => region.role === "animated" && region.id !== oneFlame.id)), true);

/* masque étendu : rectangle et brosse, sans écriture hors support */
const extended = structuredClone(plan);
const extendedFlame = extended.regions.find((region) => region.id === "flame.tl-blue");
extendedFlame.support.extraRects.push({ x0: 0.245, y0: 0.27, x1: 0.30, y1: 0.325 });
extendedFlame.support.extraCircles.push({ x: 0.271, y: 0.30, rx: 0.012, ry: 0.012 });
assert.ok(core.pointInSupport(extendedFlame, 0.246, 0.271));
assert.ok(core.pointInSupport(extendedFlame, 0.271, 0.300));
const extendedMask = core.supportMask(extended, W, H, ["animated", "light-influence"], { activeOnly: true });
core.renderFrame(base, extended, 1.5, { width: W, height: H, out: outA });
let extendedOutside = 0;
for (let p = 0; p < extendedMask.length; p++) {
  if (extendedMask[p]) continue;
  const i = p * 4;
  if (outA[i] !== base[i] || outA[i + 1] !== base[i + 1] || outA[i + 2] !== base[i + 2]) extendedOutside++;
}
assert.equal(extendedOutside, 0, "le masque étendu doit rester la seule zone autorisée");

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

/* boucle et protection natives 1280×1024 */
const NW = 1280;
const NH = 1024;
const nativeBase = makeBase(NW, NH);
const nativeA = new Uint8ClampedArray(nativeBase.length);
const nativeB = new Uint8ClampedArray(nativeBase.length);
core.renderFrame(nativeBase, plan, 0, { width: NW, height: NH, out: nativeA });
core.renderFrame(nativeBase, plan, plan.loop.durationSeconds, { width: NW, height: NH, out: nativeB });
assert.equal(core.frameHash(nativeA), core.frameHash(nativeB), "boucle native bit-identique");
core.renderFrame(nativeBase, plan, 1.5, { width: NW, height: NH, out: nativeB });
const nativeMask = core.supportMask(plan, NW, NH, ["animated", "light-influence"], { activeOnly: true });
let nativeOutside = 0;
for (let p = 0; p < nativeMask.length; p++) {
  if (nativeMask[p]) continue;
  const i = p * 4;
  if (nativeB[i] !== nativeBase[i] || nativeB[i + 1] !== nativeBase[i + 1] || nativeB[i + 2] !== nativeBase[i + 2]) nativeOutside++;
}
assert.equal(nativeOutside, 0, "protection native 1280×1024 : écriture hors support");
console.log(`test_candle_motion_plan: natif ${NW}×${NH} protégé, boucle bit-identique`);

/* historique */
const history = core.createHistory(2);
history.push({ value: 1 });
history.push({ value: 2 });
assert.equal(history.canUndo(), true);
assert.deepEqual(history.undo({ value: 3 }), { value: 2 });
assert.equal(history.canRedo(), true);
assert.deepEqual(history.redo({ value: 2 }), { value: 3 });
history.clear();
assert.equal(history.canUndo(), false);
assert.equal(history.canRedo(), false);

/* projet : round-trip, pas d’image dupliquée, compatibilité d’asset */
const serialized = core.serializeProject(plan);
assert.ok(serialized.length < 250000, "le projet ne doit pas embarquer de gros blob image");
assert.ok(!/data:image|base64,/i.test(serialized), "aucune image dupliquée dans le JSON");
const parsed = core.parseProject(serialized);
assert.deepEqual(parsed, plan, "round-trip projet");
assert.equal(core.checkSourceCompatibility(plan, {
  sha256: plan.source.sha256,
  width: plan.source.width,
  height: plan.source.height
}).ok, true);
assert.equal(core.checkSourceCompatibility(plan, {
  sha256: "0".repeat(64),
  width: plan.source.width,
  height: plan.source.height
}).code, "asset-hash-mismatch");
assert.equal(core.checkSourceCompatibility(plan, {
  sha256: plan.source.sha256,
  width: plan.source.width + 1,
  height: plan.source.height
}).code, "asset-dimensions-mismatch");
assert.throws(() => core.parseProject(JSON.stringify({ ...plan, schema: "candle-motion-project/v1" })), /Format/);
assert.deepEqual(core.parseProject(JSON.stringify({ ...plan, groups: [], regions: [], presets: [] })).groups, [], "un projet vide reste lisible");

/* proposition confirmée : élément créé en Protéger, jamais animé silencieusement */
const proposalPlan = structuredClone(plan);
proposalPlan.proposals.push({
  id: "proposal.test-flame",
  category: "flame",
  label: "Flamme proposée test",
  support: { type: "polygon", points: [[0.4, 0.4], [0.45, 0.4], [0.45, 0.46], [0.4, 0.46]], extraRects: [], extraCircles: [] },
  confidence: 0.62,
  status: "proposed"
});
const confirmed = core.confirmProposal(proposalPlan, "proposal.test-flame");
assert.equal(confirmed.region.operation, "protect");
assert.equal(core.isElementAnimated(proposalPlan, confirmed.region), false);
assert.ok(proposalPlan.groups[0].elementIds.includes(confirmed.region.id));
assert.equal(proposalPlan.proposals[0].status, "confirmed");
assert.equal(proposalPlan.proposals[0].confirmedElementId, confirmed.region.id);
assert.throws(() => core.confirmProposal(proposalPlan, "proposal.test-flame"), /déjà/);

/* ---------- documentation ---------- */

const excalidraw = readFileSync(new URL("docs/prototypes/candle-motion/EXCALIDRAW.md", ROOT), "utf8");
assert.ok(/MIT/.test(excalidraw), "licence Excalidraw");
assert.ok(/Ne pas adopter Excalidraw/.test(excalidraw), "recommandation absente");

const reconciliation = readFileSync(new URL("validation/2026-11-09-video-test/RECONCILIATION.md", ROOT), "utf8");
assert.ok(/rejetée pour la production/.test(reconciliation));
assert.ok(/Aucune trajectoire de\s+caméra exacte n’est revendiquée/.test(reconciliation));
assert.ok(/No audio treatment/.test(reconciliation) || /no audio treatment/.test(reconciliation));

console.log("test_candle_motion_plan: ok");
console.log(`  flammes=${flames.length} lumières=${lights.length} presets=${presets.length} changés=${changed} vitesse=${velocityMean.toFixed(3)} luminance=${minLum.toFixed(5)}..${maxLum.toFixed(5)}`);
