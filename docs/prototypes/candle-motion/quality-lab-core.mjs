/* GÉNÉRÉ par tools/build-motion-quality-lab.mjs — ne pas éditer à la main. */
/* CORE existant, puis révision de laboratoire. Le CORE source reste inchangé. */
export const CORE_VERSION = "scene-motion-core/2.2.0";
export const PROTOTYPE_BUILD = "2.2.0-variants.1";
export const PROJECT_SCHEMA = "candle-motion-project/v2";
export const PROJECT_LABEL = "Motion intention preview—not a prediction of AI output.";
export const DELIVERY_DURATIONS = Object.freeze([10, 11, 12, 13, 14, 15]);
export const SUPPORTED_RECIPES = Object.freeze(["protect", "candle-flame", "candle-light"]);
export const PROPOSED_RECIPES = Object.freeze(["foliage", "fabric", "camera-transform"]);
export const DELIVERY_OUTPUT = Object.freeze({ width: 1280, height: 1024, aspectRatio: "5:4" });

/* Les anciens projets n’ont pas de champ recipe : le rôle suffit à retrouver la recette. */
export function recipeOf(element) {
  if (element && typeof element.recipe === "string" && element.recipe) return element.recipe;
  if (element?.role === "animated" || element?.category === "flame") return "candle-flame";
  if (element?.role === "light-influence" || element?.category === "light") return "candle-light";
  return "protect";
}

export function isSupportedRecipe(recipe) {
  return SUPPORTED_RECIPES.includes(recipe);
}

export function isCandleRecipe(recipe) {
  return recipe === "candle-flame" || recipe === "candle-light";
}

/* Variante B : ciel manuel + couche atmosphérique optionnelle. Aucun champ requis n’est ajouté au format. */
export const VARIANT_A_ID = "candles-4243.variant-a";
export const VARIANT_B_ID = "candles-4243.variant-b";

export function atmosphereOf(plan) {
  const config = plan?.atmosphere;
  if (!config || config.enabled !== true) return null;
  const region = (plan.regions || []).find((item) => item.id === config.regionId);
  if (!region) return null;
  const group = (plan.groups || []).find((item) => item.id === region.groupId);
  if (group && group.animationEnabled === false) return null;
  return { config, region };
}

/* Décodage sRGB -> linéaire, table 256 entrées. */
const S2L = (() => {
  const table = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    table[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  return table;
})();

/* Encodage linéaire -> sRGB, table 65536 entrées. */
const E2S = (() => {
  const table = new Uint8Array(65536);
  for (let i = 0; i < 65536; i++) {
    const v = i / 65535;
    const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    table[i] = Math.min(255, Math.max(0, Math.round(c * 255)));
  }
  return table;
})();

function encode(v) {
  if (!(v > 0)) return 0;
  if (v >= 1) return 255;
  return E2S[(v * 65535 + 0.5) | 0];
}

/* Épaulement doux : conserve les hautes lumières sous 1,0 sans coupure dure. */
function shoulder(v) {
  const k = 0.78;
  if (v <= k) return v > 0 ? v : 0;
  return k + (1 - k) * (1 - Math.exp(-(v - k) / (1 - k)));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPath(object, path) {
  let node = object;
  for (const key of path.split(".")) {
    if (!node || typeof node !== "object" || !(key in node)) return undefined;
    node = node[key];
  }
  return node;
}

function groupOf(plan, element) {
  return (plan.groups || []).find((group) => group.id === element.groupId) || (plan.groups || [])[0] || null;
}

function presetOf(plan, group) {
  return (plan.presets || []).find((preset) => preset.id === group?.presetId)
    || (plan.presets || []).find((preset) => preset.default)
    || (plan.presets || [])[0]
    || null;
}

const FIELD_DEFAULTS = {
  "flame.amplitude": 0.16,
  "flame.harmonic": 1,
  "flame.lean": 0.2,
  "flame.windResponse": 1,
  lightScale: 1,
  lightModulation: 0.35,
  intensity: 1,
  "wind.direction": 0,
  "wind.strength": 0,
  variation: "correlated"
};

/*
 * Précédence explicite : override d’élément > réglage de groupe > preset.
 * Les valeurs intrinsèques (phase, taille, ancre, support) ne passent pas ici.
 */
export function resolveField(plan, element, path) {
  const group = groupOf(plan, element);
  const preset = presetOf(plan, group);
  const fromElement = getPath(element.overrides || {}, path);
  if (fromElement !== undefined) return { value: fromElement, source: "element" };
  const fromGroup = getPath(group?.settings || {}, path);
  if (fromGroup !== undefined) return { value: fromGroup, source: "group" };
  const fromPreset = getPath(preset || {}, path);
  if (fromPreset !== undefined) return { value: fromPreset, source: "preset" };
  return { value: FIELD_DEFAULTS[path], source: "preset" };
}

export function resolveSettings(plan, element) {
  const amplitude = resolveField(plan, element, "flame.amplitude").value;
  const harmonic = resolveField(plan, element, "flame.harmonic").value;
  const lean = resolveField(plan, element, "flame.lean").value;
  const windResponse = resolveField(plan, element, "flame.windResponse").value;
  const lightScale = resolveField(plan, element, "lightScale").value;
  const lightModulation = resolveField(plan, element, "lightModulation").value;
  const intensity = resolveField(plan, element, "intensity").value;
  const direction = resolveField(plan, element, "wind.direction").value;
  const strength = resolveField(plan, element, "wind.strength").value;
  const variation = resolveField(plan, element, "variation").value;
  return {
    flame: {
      amplitude: clamp(Number(amplitude) || 0, 0, 0.5),
      harmonic: clamp(Math.round(Number(harmonic) || 1), 1, 4),
      lean: clamp(Number(lean) || 0, 0, 0.6),
      windResponse: clamp(Number(windResponse) || 0, 0, 2)
    },
    lightScale: clamp(Number(lightScale) || 0, 0.0001, 3),
    lightModulation: clamp(Number(lightModulation) || 0, 0, 1),
    intensity: clamp(Number(intensity) || 0, 0, 2),
    wind: {
      direction: ((Number(direction) || 0) % 360 + 360) % 360,
      strength: clamp(Number(strength) || 0, 0, 1)
    },
    variation: ["synchronized", "correlated", "independent"].includes(variation) ? variation : "correlated"
  };
}

/* Une opération non animée ou un élément désactivé reste dans la scène et dans le fond. */
export function isElementAnimated(plan, element) {
  const recipe = recipeOf(element);
  if (!isSupportedRecipe(recipe) || recipe === "protect") return false;
  if (recipe === "candle-flame" && element.role !== "animated") return false;
  if (recipe === "candle-light" && element.role !== "light-influence") return false;
  if ((element.operation || "animate") !== "animate") return false;
  if (element.animationEnabled === true) return true;
  if (element.animationEnabled === false) return false;
  const group = groupOf(plan, element);
  return group ? group.animationEnabled !== false : true;
}

export function phaseAt(time, duration) {
  const u = time / duration;
  return ((u % 1) + 1) % 1;
}

export function hash32(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function seededUnit(key) {
  return hash32(key) / 4294967296;
}

/* Bruit périodique : fréquences entières, donc raccord bit-identique à u=0/u=1. */
function loopNoise(key, seed, u) {
  const p1 = seededUnit(key + ":p1:" + seed);
  const p2 = seededUnit(key + ":p2:" + seed);
  const p3 = seededUnit(key + ":p3:" + seed);
  const w = 2 * Math.PI;
  return 0.58 * Math.sin(w * (2 * u + p1))
    + 0.30 * Math.sin(w * (3 * u + p2))
    + 0.12 * Math.sin(w * (5 * u + p3));
}

export function windAt(plan, element, time) {
  const group = groupOf(plan, element);
  const settings = resolveSettings(plan, element);
  const u = phaseAt(time, plan.loop.durationSeconds);
  const common = loopNoise("wind:" + (group?.id || "group"), plan.seed, u);
  const individual = loopNoise("wind:" + element.id, plan.seed, u);
  const weights = settings.variation === "synchronized"
    ? [1, 0]
    : settings.variation === "independent"
      ? [0.25, 0.75]
      : [0.72, 0.28];
  const direction = (settings.wind.direction * Math.PI) / 180;
  return settings.wind.strength * Math.cos(direction) * (weights[0] * common + weights[1] * individual);
}

/* Signal périodique, borné, sans aléatoire temporel. */
export function flameSignal(flame, time, plan) {
  const duration = plan.loop.durationSeconds;
  const u = phaseAt(time, duration);
  const ph = flame.motion.phase;
  const n = resolveSettings(plan, flame).flame.harmonic;
  const micro = seededUnit(flame.id + ":" + plan.seed);
  const w = 2 * Math.PI;
  return 0.62 * Math.sin(w * (n * u + ph))
    + 0.26 * Math.sin(w * (2 * n * u + ph * 1.7 + micro * 0.25))
    + 0.12 * Math.sin(w * (3 * n * u + ph * 2.3 + micro * 0.5));
}

export function flameSway(flame, time, plan) {
  const duration = plan.loop.durationSeconds;
  const u = phaseAt(time, duration);
  const ph = flame.motion.phase;
  const n = resolveSettings(plan, flame).flame.harmonic;
  const micro = seededUnit(flame.id + ":" + plan.seed);
  const w = 2 * Math.PI;
  return 0.68 * Math.sin(w * (n * u + ph + 0.17))
    + 0.32 * Math.sin(w * (2 * n * u + ph * 1.9 + micro * 0.35));
}

export function lightSignal(light, plan, time) {
  const sources = (light.sources || [])
    .map((id) => plan.regions.find((region) => region.id === id))
    .filter((flame) => flame && isElementAnimated(plan, flame));
  if (!sources.length) return 0;
  const shifted = time + (light.motion.phase || 0) * plan.loop.durationSeconds;
  let sum = 0;
  for (const flame of sources) sum += flameSignal(flame, shifted, plan);
  return sum / sources.length;
}

export function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* Test normalisé, utilisé par la sélection et les outils de correction. */
export function pointInSupport(region, nx, ny) {
  const support = region.support || {};
  if (pointInPolygon(nx, ny, support.points || [])) return true;
  for (const rect of support.extraRects || []) {
    const x0 = Math.min(rect.x0, rect.x1);
    const x1 = Math.max(rect.x0, rect.x1);
    const y0 = Math.min(rect.y0, rect.y1);
    const y1 = Math.max(rect.y0, rect.y1);
    if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1) return true;
  }
  for (const circle of support.extraCircles || []) {
    const dx = (nx - circle.x) / circle.rx;
    const dy = (ny - circle.y) / circle.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function toPixels(points, width, height) {
  return points.map(([x, y]) => [x * width, y * height]);
}

function boundsOf(poly, width, height) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return {
    x0: Math.max(0, Math.floor(x0)),
    y0: Math.max(0, Math.floor(y0)),
    x1: Math.min(width - 1, Math.ceil(x1)),
    y1: Math.min(height - 1, Math.ceil(y1)),
  };
}

function prepareSupport(region, width, height) {
  const poly = toPixels(region.support.points, width, height);
  const rects = (region.support.extraRects || []).map((rect) => ({
    x0: Math.min(rect.x0, rect.x1) * width,
    x1: Math.max(rect.x0, rect.x1) * width,
    y0: Math.min(rect.y0, rect.y1) * height,
    y1: Math.max(rect.y0, rect.y1) * height,
  }));
  const circles = (region.support.extraCircles || []).map((circle) => ({
    x: circle.x * width,
    y: circle.y * height,
    rx: Math.max(1, circle.rx * width),
    ry: Math.max(1, circle.ry * height),
  }));
  const bounds = boundsOf(poly, width, height);
  for (const rect of rects) {
    bounds.x0 = Math.min(bounds.x0, Math.max(0, Math.floor(rect.x0)));
    bounds.y0 = Math.min(bounds.y0, Math.max(0, Math.floor(rect.y0)));
    bounds.x1 = Math.max(bounds.x1, Math.min(width - 1, Math.ceil(rect.x1)));
    bounds.y1 = Math.max(bounds.y1, Math.min(height - 1, Math.ceil(rect.y1)));
  }
  for (const circle of circles) {
    bounds.x0 = Math.min(bounds.x0, Math.max(0, Math.floor(circle.x - circle.rx)));
    bounds.y0 = Math.min(bounds.y0, Math.max(0, Math.floor(circle.y - circle.ry)));
    bounds.x1 = Math.max(bounds.x1, Math.min(width - 1, Math.ceil(circle.x + circle.rx)));
    bounds.y1 = Math.max(bounds.y1, Math.min(height - 1, Math.ceil(circle.y + circle.ry)));
  }
  return { poly, rects, circles, bounds };
}

function containsPrepared(support, x, y) {
  if (pointInPolygon(x, y, support.poly)) return true;
  for (const rect of support.rects) {
    if (x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1) return true;
  }
  for (const circle of support.circles) {
    const dx = (x - circle.x) / circle.rx;
    const dy = (y - circle.y) / circle.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

export function regionPixelBounds(region, width, height) {
  return prepareSupport(region, width, height).bounds;
}

/* Fond local estimé : médiane des luminances du pourtour du support. */
function supportBackground(out, support, width) {
  const samples = [];
  const { bounds } = support;
  for (let gy = 0; gy < 5; gy++) {
    for (let gx = 0; gx < 5; gx++) {
      const x = Math.round(bounds.x0 + ((bounds.x1 - bounds.x0) * gx) / 4);
      const y = Math.round(bounds.y0 + ((bounds.y1 - bounds.y0) * gy) / 4);
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const i = (y * width + x) * 4;
      const r = S2L[out[i]];
      const g = S2L[out[i + 1]];
      const b = S2L[out[i + 2]];
      samples.push([r, g, b, 0.2126 * r + 0.7152 * g + 0.0722 * b]);
    }
  }
  if (!samples.length) return [0.004, 0.003, 0.002];
  samples.sort((a, b) => a[3] - b[3]);
  const pick = samples[Math.floor((samples.length - 1) * 0.5)];
  return [pick[0], pick[1], pick[2]];
}

function paintLight(ctx, region, support) {
  const { out, width, height, plan, time } = ctx;
  const settings = resolveSettings(plan, region);
  const sources = (region.sources || [])
    .map((id) => plan.regions.find((candidate) => candidate.id === id))
    .filter((flame) => flame && isElementAnimated(plan, flame));
  if (!sources.length) return;
  const signal = lightSignal(region, plan, time);
  const linkIntensity = sources.reduce((sum, flame) => sum + resolveSettings(plan, flame).intensity, 0) / sources.length;
  const gain = region.render.gain * settings.lightScale * linkIntensity
    * (1 + settings.lightModulation * signal);
  if (!(gain > 0)) return;
  const cx = region.center[0] * width;
  const cy = region.center[1] * height;
  const rx = Math.max(2, region.radii[0] * width);
  const ry = Math.max(2, region.radii[1] * height);
  const color = region.render.color;
  const falloff = region.render.falloff;
  const { bounds } = support;
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const radius = Math.hypot(nx, ny);
      if (radius >= 0.92) continue;
      const amount = gain * Math.pow(1 - radius / 0.92, falloff);
      if (!(amount > 0)) continue;
      const i = (y * width + x) * 4;
      out[i] = encode(shoulder(S2L[out[i]] + amount * color[0]));
      out[i + 1] = encode(shoulder(S2L[out[i + 1]] + amount * color[1]));
      out[i + 2] = encode(shoulder(S2L[out[i + 2]] + amount * color[2]));
    }
  }
}

/* Remplace la flamme statique dans son support, puis dessine une flamme animée. */
function paintFlame(ctx, region, support) {
  const { out, width, height, plan, time } = ctx;
  const settings = resolveSettings(plan, region);
  const { amplitude, lean, windResponse } = settings.flame;
  const intensity = settings.intensity;
  const wind = windAt(plan, region, time);
  const size = clamp(region.size || 1, 0.5, 1.8);
  const cx = region.anchor[0] * width;
  const by = region.anchor[1] * height;
  const h0 = Math.max(2, region.height * height * size);
  const w0 = Math.max(1.5, region.width * width * size);
  const signal = flameSignal(region, time, plan);
  const heightNow = Math.max(2, h0 * clamp(1 + amplitude * signal + 0.08 * wind * windResponse, 0.55, 1.55));
  const leanNow = clamp(lean * flameSway(region, time, plan) + 0.30 * wind * windResponse, -0.65, 0.65);
  const leanPx = h0 * leanNow;
  const u = phaseAt(time, plan.loop.durationSeconds);
  const widthNow = Math.max(w0 * 0.65, w0 * (1 + 0.10 * Math.sin(2 * Math.PI * (2 * u + region.motion.phase * 1.3))));
  const bg = supportBackground(out, support, width);
  const bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  const scx = cx;
  const scy = by - 0.52 * h0;
  const srx = Math.max(2, w0 * 0.70);
  const sry = Math.max(2, h0 * 0.58);
  const haloX = Math.max(2, 0.60 * heightNow);
  const haloY = Math.max(2, 0.52 * heightNow);
  const brightness = clamp(0.9 + 0.10 * signal + 0.04 * wind * windResponse, 0.70, 1.05);
  const { bounds } = support;
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const dx = x + 0.5 - cx;
      const dyUp = by - (y + 0.5);
      const i = (y * width + x) * 4;
      let r = S2L[out[i]];
      let g = S2L[out[i + 1]];
      let b = S2L[out[i + 2]];
      let suppress = 0;
      if (dyUp > -1.5) {
        const e = Math.hypot((x + 0.5 - scx) / srx, (y + 0.5 - scy) / sry);
        const mask = 1 - smoothstep(0.62, 1.35, e);
        if (mask > 0) {
          /* N’atténue que l’excès de luminance de la flamme statique ; ne noircit pas la niche. */
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const excess = Math.max(0, lum - bgLum);
          suppress = region.render.suppression * mask * Math.min(1, excess / 0.012);
        }
      }
      let fr = 0;
      let fg = 0;
      let fb = 0;
      if (dyUp >= 0) {
        const sN = dyUp / heightNow;
        if (sN <= 1) {
          const envelope = Math.pow(Math.sin(Math.PI * Math.pow(sN, 0.52)), 0.55);
          const center = leanPx * Math.pow(sN, 1.55)
            + widthNow * 0.10 * Math.sin(2 * Math.PI * sN * 0.8 + region.motion.phase * 6.283 + 2 * Math.PI * u);
          const halfWidth = Math.max(0.34, 0.5 * widthNow * envelope);
          const distance = Math.abs(dx - center);
          if (distance < halfWidth + 1.2) {
            const alpha = Math.min(1, (halfWidth + 1.2 - distance) / 1.6);
            const q = halfWidth > 0 ? Math.max(0, 1 - distance / halfWidth) : 0;
            const temp = Math.min(1, Math.max(0, 0.26 + 0.58 * q - 0.20 * sN));
            const radiance = 0.98 * envelope * alpha * (0.30 + 0.82 * q) * intensity * brightness;
            fr += radiance;
            fg += radiance * (0.30 + 0.48 * temp);
            fb += radiance * (0.055 + 0.30 * temp);
          }
        }
      }
      const hx = (x + 0.5 - cx - leanPx * 0.35) / haloX;
      const hy = (y + 0.5 - (by - 0.46 * heightNow)) / haloY;
      const haloDistance = Math.hypot(hx, hy);
      if (haloDistance < 1) {
        const glow = (1 - haloDistance) * (1 - haloDistance) * 0.13 * intensity;
        fr += glow;
        fg += glow * 0.36;
        fb += glow * 0.10;
      }
      if (suppress <= 0 && fr <= 0 && fg <= 0 && fb <= 0) continue;
      r += (bg[0] - r) * suppress;
      g += (bg[1] - g) * suppress;
      b += (bg[2] - b) * suppress;
      out[i] = encode(shoulder(r + fr));
      out[i + 1] = encode(shoulder(g + fg));
      out[i + 2] = encode(shoulder(b + fb));
    }
  }
}

/*
 * Ciel procédural volontairement borné : le masque manuel décide des pixels autorisés.
 * Un garde-fou de contour et de couleur évite de laver les arêtes chaudes de l’architecture.
 */
function paintAtmosphere(ctx, region, support) {
  const { out, width, height, plan, time } = ctx;
  const config = plan.atmosphere;
  const intensity = clamp(Number(config?.intensity) || 0, 0, 1);
  if (!(intensity > 0)) return;
  const cycles = clamp(Math.round(Number(config?.cycles) || 1), 1, 3);
  const u = phaseAt(time, plan.loop.durationSeconds);
  const phase = Math.PI * 2 * cycles * u;
  const { bounds } = support;
  const lumAt = (x, y) => {
    const i = (y * width + x) * 4;
    return 0.2126 * S2L[out[i]] + 0.7152 * S2L[out[i + 1]] + 0.0722 * S2L[out[i + 2]];
  };
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const i = (y * width + x) * 4;
      const r = S2L[out[i]];
      const g = S2L[out[i + 1]];
      const b = S2L[out[i + 2]];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const dx = Math.abs(lumAt(Math.min(width - 1, x + 1), y) - lumAt(Math.max(0, x - 1), y));
      const dy = Math.abs(lumAt(x, Math.min(height - 1, y + 1)) - lumAt(x, Math.max(0, y - 1)));
      const edgeGuard = 1 - 0.86 * Math.min(1, (dx + dy) * 90);
      const warmGuard = 1 - 0.82 * clamp((r - b) * 26, 0, 1);
      const skyGuard = 0.38 + 0.62 * (1 - smoothstep(0.012, 0.10, lum));
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;
      const field = 0.5
        + 0.28 * Math.sin(phase + nx * 7.0 + ny * 3.0)
        + 0.22 * Math.sin(2 * phase - nx * 4.0 + ny * 5.0);
      const amount = intensity * 0.085 * (0.62 + 0.38 * field) * edgeGuard * warmGuard * skyGuard;
      const rr = r + amount * 0.18;
      const gg = g + amount * 0.34;
      const bb = b + amount * 0.95;
      out[i] = encode(shoulder(rr));
      out[i + 1] = encode(shoulder(gg));
      out[i + 2] = encode(shoulder(bb));
    }
  }
  if (config.stars) paintAtmosphereStars(ctx, support, intensity, phase);
}

function paintAtmosphereStars(ctx, support, intensity, phase) {
  const { out, base, width, height, plan } = ctx;
  const count = 18;
  const bx0 = support.bounds.x0 / width;
  const bx1 = Math.min(1, (support.bounds.x1 + 1) / width);
  const by0 = support.bounds.y0 / height;
  const by1 = Math.min(1, (support.bounds.y1 + 1) / height);
  for (let i = 0; i < count; i++) {
    const nx = bx0 + (bx1 - bx0) * seededUnit(`atmosphere:star:x:${i}:${plan.seed}`);
    const ny = by0 + (by1 - by0) * seededUnit(`atmosphere:star:y:${i}:${plan.seed}`);
    const px = Math.min(width - 0.001, Math.max(0.001, nx * width));
    const py = Math.min(height - 0.001, Math.max(0.001, ny * height));
    if (!containsPrepared(support, px, py)) continue;
    const ci = (Math.floor(py) * width + Math.floor(px)) * 4;
    const baseLum = 0.2126 * S2L[base[ci]] + 0.7152 * S2L[base[ci + 1]] + 0.0722 * S2L[base[ci + 2]];
    if (baseLum > 0.022 || base[ci] > base[ci + 2] + 5) continue;
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(phase + seededUnit(`atmosphere:star:phase:${i}:${plan.seed}`) * Math.PI * 2));
    const alpha = intensity * 0.30 * twinkle;
    const cx = Math.floor(px);
    const cy = Math.floor(py);
    for (const [ox, oy, weight] of [[0, 0, 1], [1, 0, 0.32], [-1, 0, 0.32], [0, 1, 0.25], [0, -1, 0.25]]) {
      const x = cx + ox;
      const y = cy + oy;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const k = (y * width + x) * 4;
      out[k] = encode(shoulder(S2L[out[k]] + alpha * weight * 0.55));
      out[k + 1] = encode(shoulder(S2L[out[k + 1]] + alpha * weight * 0.72));
      out[k + 2] = encode(shoulder(S2L[out[k + 2]] + alpha * weight));
    }
  }
}

/* Couche distincte, opt-in, bornée par un second support manuel (hauts de murs). */
function paintCoolLight(ctx, config, region, support) {
  const { out, width, height, plan, time } = ctx;
  const intensity = clamp(Number(config.intensity) || 0, 0, 1);
  if (!(intensity > 0)) return;
  const cycles = clamp(Math.round(Number(config.cycles) || 1), 1, 3);
  const phase = Math.PI * 2 * cycles * phaseAt(time, plan.loop.durationSeconds);
  const { bounds } = support;
  const lumAt = (x, y) => {
    const i = (y * width + x) * 4;
    return 0.2126 * S2L[out[i]] + 0.7152 * S2L[out[i + 1]] + 0.0722 * S2L[out[i + 2]];
  };
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const i = (y * width + x) * 4;
      const r = S2L[out[i]];
      const g = S2L[out[i + 1]];
      const b = S2L[out[i + 2]];
      const dx = Math.abs(lumAt(Math.min(width - 1, x + 1), y) - lumAt(Math.max(0, x - 1), y));
      const dy = Math.abs(lumAt(x, Math.min(height - 1, y + 1)) - lumAt(x, Math.max(0, y - 1)));
      const edgeGuard = 1 - 0.86 * Math.min(1, (dx + dy) * 90);
      const field = 0.5
        + 0.28 * Math.sin(phase + ((x + 0.5) / width) * 6.0 + ((y + 0.5) / height) * 4.0)
        + 0.22 * Math.sin(2 * phase - ((x + 0.5) / width) * 3.0 + ((y + 0.5) / height) * 5.0);
      const amount = intensity * 0.020 * (0.62 + 0.38 * field) * edgeGuard;
      out[i] = encode(shoulder(r + amount * 0.28));
      out[i + 1] = encode(shoulder(g + amount * 0.50));
      out[i + 2] = encode(shoulder(b + amount));
    }
  }
}

export function renderFrame(base, plan, time, options = {}) {
  const width = options.width || plan.source.width;
  const height = options.height || plan.source.height;
  const out = options.out || new Uint8ClampedArray(base.length);
  if (out !== base) out.set(base);
  const ctx = { base, out, width, height, plan, time };
  const atmosphere = atmosphereOf(plan);
  if (atmosphere) {
    paintAtmosphere(ctx, atmosphere.region, prepareSupport(atmosphere.region, width, height));
    if (atmosphere.config.coolLight && atmosphere.config.coolLightRegionId) {
      const cool = (plan.regions || []).find((region) => region.id === atmosphere.config.coolLightRegionId);
      if (cool) paintCoolLight(ctx, atmosphere.config, cool, prepareSupport(cool, width, height));
    }
  }
  const active = (plan.regions || []).filter((region) => isElementAnimated(plan, region));
  const lights = active.filter((region) => region.role === "light-influence");
  const flames = active.filter((region) => region.role === "animated");
  for (const region of lights) paintLight(ctx, region, prepareSupport(region, width, height));
  for (const region of flames) paintFlame(ctx, region, prepareSupport(region, width, height));
  return { rgba: out, width, height };
}

export function frameHash(rgba) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < rgba.length; i++) {
    h ^= rgba[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ("0000000" + h.toString(16)).slice(-8);
}

export function sampleTimes(plan) {
  const count = plan.loop.samples;
  const times = new Float64Array(count);
  for (let k = 0; k < count; k++) times[k] = (k * plan.loop.durationSeconds) / count;
  return times;
}

export function supportMask(plan, width, height, roles = ["animated", "light-influence"], options = {}) {
  const mask = new Uint8Array(width * height);
  for (const region of plan.regions || []) {
    if (!roles.includes(region.role)) continue;
    if (options.activeOnly && !isElementAnimated(plan, region)) continue;
    const support = prepareSupport(region, width, height);
    for (let y = support.bounds.y0; y <= support.bounds.y1; y++) {
      for (let x = support.bounds.x0; x <= support.bounds.x1; x++) {
        if (containsPrepared(support, x + 0.5, y + 0.5)) mask[y * width + x] = 1;
      }
    }
  }
  return mask;
}

/* Union des pixels que le renderer est autorisé à écrire, atmosphère comprise. */
export function renderWriteMask(plan, width, height) {
  const mask = supportMask(plan, width, height, ["animated", "light-influence"], { activeOnly: true });
  const atmosphere = atmosphereOf(plan);
  if (!atmosphere) return mask;
  const regions = [atmosphere.region];
  if (atmosphere.config.coolLight && atmosphere.config.coolLightRegionId) {
    const cool = (plan.regions || []).find((region) => region.id === atmosphere.config.coolLightRegionId);
    if (cool) regions.push(cool);
  }
  for (const region of regions) {
    const support = prepareSupport(region, width, height);
    for (let y = support.bounds.y0; y <= support.bounds.y1; y++) {
      for (let x = support.bounds.x0; x <= support.bounds.x1; x++) {
        if (containsPrepared(support, x + 0.5, y + 0.5)) mask[y * width + x] = 1;
      }
    }
  }
  return mask;
}

export function meanLuminance(rgba, width, height, step = 2) {
  let total = 0;
  let count = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      total += 0.2126 * S2L[rgba[i]] + 0.7152 * S2L[rgba[i + 1]] + 0.0722 * S2L[rgba[i + 2]];
      count++;
    }
  }
  return count ? total / count : 0;
}

export function createHistory(limit = 50) {
  const past = [];
  const future = [];
  return {
    push(snapshot) {
      past.push(snapshot);
      if (past.length > limit) past.shift();
      future.length = 0;
    },
    undo(current) {
      if (!past.length) return null;
      const previous = past.pop();
      future.push(current);
      return previous;
    },
    redo(current) {
      if (!future.length) return null;
      const next = future.pop();
      past.push(current);
      return next;
    },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
    clear() { past.length = 0; future.length = 0; },
    size() { return past.length; }
  };
}

export function serializeProject(plan) {
  return JSON.stringify(plan, null, 2) + "\n";
}

export function parseProject(text) {
  const project = JSON.parse(text);
  if (!project || typeof project !== "object") throw new Error("Projet JSON invalide.");
  if (project.schema !== PROJECT_SCHEMA) {
    throw new Error("Format de projet non pris en charge : candle-motion-project/v2 attendu.");
  }
  for (const key of ["source", "loop", "groups", "regions", "presets", "proposals"]) {
    if (!(key in project)) throw new Error("Projet incomplet : " + key + " absent.");
  }
  if (!Array.isArray(project.groups)) throw new Error("Liste de groupes invalide.");
  if (!Array.isArray(project.regions)) throw new Error("Liste d’éléments invalide.");
  if (!Array.isArray(project.presets)) throw new Error("Liste de presets invalide.");
  if (!Array.isArray(project.proposals)) throw new Error("Liste de propositions invalide.");
  if (!/^[0-9a-f]{64}$/.test(project.source.sha256 || "")) throw new Error("Empreinte source absente ou invalide.");
  return project;
}

export function checkSourceCompatibility(project, actual) {
  if (!project?.source || !actual) return { ok: false, code: "source-missing", message: "Source absente." };
  if (project.source.width !== actual.width || project.source.height !== actual.height) {
    return {
      ok: false,
      code: "asset-dimensions-mismatch",
      message: `Dimensions incompatibles : projet ${project.source.width}×${project.source.height}, asset ${actual.width}×${actual.height}. Remappage requis.`
    };
  }
  if (project.source.sha256 !== actual.sha256) {
    return {
      ok: false,
      code: "asset-hash-mismatch",
      message: "Empreinte de l’asset différente. Le projet vient probablement d’une autre image : remappage des masques requis."
    };
  }
  return { ok: true, code: "match", message: "Asset compatible : dimensions et empreinte vérifiées." };
}

/* Projet vide, image-agnostique : aucune région, aucun groupe, aucun preset inventé. */
export function createEmptyProject(source, options = {}) {
  const sha256 = String(source?.sha256 || "");
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error("Empreinte source invalide pour créer le projet.");
  const width = Math.round(Number(source.width));
  const height = Math.round(Number(source.height));
  if (!(width > 0) || !(height > 0)) throw new Error("Dimensions source invalides pour créer le projet.");
  const requestedDuration = Number(options.duration ?? 12);
  const duration = requestedDuration === 6 || DELIVERY_DURATIONS.includes(requestedDuration)
    ? requestedDuration
    : 12;
  const fps = Math.max(1, Math.round(Number(options.fps ?? 24) || 24));
  return {
    schema: PROJECT_SCHEMA,
    id: options.id || `motion.local-${sha256.slice(0, 12)}.draft`,
    version: "2.1.0",
    status: "diagnostic-not-approved",
    approval: {
      status: "not-approved",
      source: "création locale dans l’éditeur",
      note: "Projet créé depuis une image locale. L’image, l’aperçu et la durée ne sont pas approuvés ; aucun master n’est créé."
    },
    label: PROJECT_LABEL,
    artistIntent: {
      summary: "Définir manuellement les régions d’une image source, choisir une recette supportée et vérifier une boucle déterministe sans modifier les zones protégées.",
      constraints: [
        "Aucun redimensionnement ni repositionnement silencieux des masques.",
        "Les coordonnées de support restent normalisées dans le repère de l’image source.",
        "Une recette non supportée reste proposée et n’écrit aucun pixel.",
        "La caméra reste fixe et la boucle est exclusive à l’endpoint."
      ],
      nonGoals: [
        "Détecter automatiquement les objets ou segments de l’image.",
        "Produire une vidéo ou un master.",
        "Transformer une annotation en contrôle moteur.",
        "Déduire les dimensions LED de la cible 1280×1024."
      ]
    },
    previewSettings: {
      preset: "none",
      showRegions: true,
      playbackRate: 1,
      compare: false,
      compareSplit: 0.5,
      note: "Réglages d’aperçu uniquement ; aucun preset de recette n’est créé par défaut."
    },
    engineControls: {
      conditioningSignals: [],
      note: "Aucune région, annotation ou intention de ce projet n’est un signal de conditionnement LTX. Le projet décrit un aperçu local."
    },
    source: {
      id: source.id || `local-${sha256.slice(0, 12)}`,
      path: source.path || `local/${sha256.slice(0, 12)}`,
      sha256,
      width,
      height,
      colorSpace: source.colorSpace || "sRGB navigateur (non certifié)",
      role: source.role || "local-import"
    },
    workingSpace: {
      name: "linear-sRGB",
      decode: "EOTF sRGB par table de 256 entrées",
      encode: "OETF sRGB par table de 65536 entrées",
      highlight: "Épaulement doux au-dessus de 0,78 en linéaire ; maximum asymptotique 1,0.",
      note: "Les pixels hors support sont recopiés octet pour octet ; aucune image n’est rééchantillonnée dans le projet."
    },
    camera: {
      mode: "fixed",
      catalogId: "A-01",
      note: "Caméra fixe ; aucune trajectoire n’est simulée."
    },
    loop: {
      durationSeconds: duration,
      fps,
      samples: Math.round(duration * fps),
      endpoint: "exclusive",
      boundaryTolerance: 0,
      phaseRule: "u = ((t / T) mod 1 + 1) mod 1 ; oscillations à fréquences entières de u.",
      note: `${duration} s à ${fps} fps ; les temps d’export sont k·T/N pour k = 0…N−1, sans frame finale dupliquée. Durée non approuvée.`
    },
    protection: {
      definition: "Tout pixel hors de l’union des supports actifs est recopié octet pour octet depuis le fond décodé. Une région protégée n’autorise aucune écriture.",
      overlapPolicy: "Les recettes supportées restent bornées à leur support ; une région protégée peut chevaucher un support sans être modifiée. Aucun patch de suppression global n’est créé.",
      edgePolicy: "Les dégradés s’annulent avant le bord du support ; un masque non supporté ne déclenche aucun rendu."
    },
    output: {
      width: DELIVERY_OUTPUT.width,
      height: DELIVERY_OUTPUT.height,
      aspectRatio: DELIVERY_OUTPUT.aspectRatio,
      fps,
      colorSpace: "sRGB (convention non certifiée)",
      audio: "none",
      status: "unresolved"
    },
    approvals: {
      sourceImage: "not-reviewed",
      imagePreparation: "not-reviewed",
      preview: "not-reviewed",
      duration: "not-approved",
      output: "unresolved"
    },
    seed: Math.max(0, Math.round(Number(options.seed ?? 4243) || 0)),
    groups: [],
    regions: [],
    presets: [],
    proposals: []
  };
}

/* Durée de livraison : 10–15 s pour les nouveaux projets ; 6 s reste lisible pour l’historique. */
export function setLoopDuration(plan, seconds) {
  const duration = Number(seconds);
  if (!(duration > 0) || (duration !== 6 && !DELIVERY_DURATIONS.includes(duration))) {
    throw new Error("Durée non supportée : choisir 10–15 s (ou 6 s pour un projet historique).");
  }
  if (!plan?.loop) throw new Error("Timeline absente.");
  const fps = Math.max(1, Math.round(Number(plan.loop.fps) || 24));
  plan.loop.durationSeconds = duration;
  plan.loop.fps = fps;
  plan.loop.samples = Math.round(duration * fps);
  plan.loop.endpoint = "exclusive";
  plan.loop.boundaryTolerance = 0;
  plan.loop.note = `${duration} s à ${fps} fps ; les temps d’export sont k·T/N pour k = 0…N−1, sans frame finale dupliquée.`;
  if (plan.approvals) plan.approvals.duration = "not-approved";
  return plan.loop;
}

/* Variante A : dérivée du baseline, sans nouvelle région ni nouvelle liaison. */
export function createOriginalAliveVariant(plan) {
  const variant = JSON.parse(JSON.stringify(plan));
  delete variant.atmosphere;
  variant.groups = (variant.groups || []).filter((group) => group.id !== "group.atmosphere");
  variant.regions = (variant.regions || []).filter((region) => region.id !== "region.sky" && region.id !== "region.cool-light");
  variant.id = VARIANT_A_ID;
  variant.version = "2.1.0";
  variant.status = "provisional";
  variant.approval = {
    status: "not-approved",
    source: "variante artistique dérivée du diagnostic 4243",
    note: "Variante A proposée, non approuvée. L’image source reste un fond diagnostique, pas un master."
  };
  variant.artistIntent = {
    summary: "Variante A — Original Alive. Animer uniquement les flammes existantes, leurs lumières locales explicitement liées et les reflets existants.",
    constraints: [
      "La géométrie, le cadrage et le ciel restent ceux du diagnostic 4243.",
      "Aucune liaison de lumière n’est ajoutée : chaque source reste explicite et éditable.",
      "Les supports, les presets et le nombre d’éléments restent inchangés.",
      "Boucle de 12 s, endpoint exclusif, même seed déterministe."
    ],
    nonGoals: [
      "Modifier l’architecture ou le ciel de l’image source.",
      "Relier automatiquement le passage central ou une lumière à toutes les bougies.",
      "Créer un master, une vidéo ou une sortie LTX."
    ]
  };
  setLoopDuration(variant, 12);
  variant.loop.note = "12 s à 24 fps ; temps k·T/N, aucune frame finale dupliquée. Variante non approuvée.";
  return variant;
}

/* Variante B : A + ciel manuel + couche atmosphérique et lumière froide opt-in. */
export function createAtmosphericNightVariant(plan) {
  const variant = createOriginalAliveVariant(plan);
  variant.id = VARIANT_B_ID;
  variant.approval = {
    status: "not-approved",
    source: "variante artistique dérivée du diagnostic 4243",
    note: "Variante B proposée, non approuvée. Ciel, atmosphère et lumière froide sont des approximations artistiques."
  };
  variant.artistIntent = {
    summary: "Variante B — Atmospheric Night. Partir de A, ajouter un ciel manuel et une atmosphère procédurale retenue, avec étoiles et lumière froide optionnelles.",
    constraints: [
      "Le ciel reste une région manuelle, protégée et éditable ; aucun masque sémantique automatique.",
      "L’atmosphère ne remplace pas le ciel par un noir neutre et ne pompe pas l’exposition globale.",
      "Les étoiles sont désactivées par défaut ; aucune lune ni lumière lunaire n’est ajoutée.",
      "La lumière froide sur les hauts de mur est une couche opt-in séparée, pas une source physique.",
      "Aucune étoile, aucun nuage ni aucune lumière n’est ajouté automatiquement parce que la scène est nocturne."
    ],
    nonGoals: [
      "Détecter le ciel ou les bâtiments automatiquement.",
      "Promouvoir la variante en master ou en règle universelle de collection.",
      "Ajouter une lune, des nuages ou une illumination lunaire."
    ]
  };
  variant.groups = variant.groups.filter((group) => group.id !== "group.atmosphere");
  variant.regions = variant.regions.filter((region) => region.id !== "region.sky" && region.id !== "region.cool-light");
  const skyPoints = [
    [0.0, 0.0], [1.0, 0.0], [1.0, 0.06], [0.985, 0.06], [0.985, 0.075],
    [0.61, 0.075], [0.61, 0.055], [0.59, 0.055], [0.59, 0.082], [0.47, 0.082],
    [0.47, 0.07], [0.45, 0.07], [0.45, 0.09], [0.06, 0.09], [0.06, 0.078], [0.0, 0.078]
  ];
  const skyGroup = {
    id: "group.atmosphere",
    label: "Atmosphère",
    category: "generic",
    elementIds: ["region.sky", "region.cool-light"],
    animationEnabled: true,
    settings: {}
  };
  variant.groups.push(skyGroup);
  variant.regions.push({
    id: "region.sky",
    role: "protected",
    category: "other",
    groupId: "group.atmosphere",
    label: "Ciel nocturne — région manuelle",
    supportStatus: "declared",
    support: { type: "polygon", points: skyPoints, extraRects: [], extraCircles: [] },
    operation: "protect",
    recipe: "protect",
    overrides: {},
    motion: { action: "none", phase: 0 },
    render: { method: "none", workingSpace: "linear" },
    notes: "Région de ciel dessinée manuellement. L’atmosphère ne peut écrire qu’à l’intérieur ; les arêtes chaudes sont atténuées, sans masque sémantique automatique."
  });
  variant.regions.push({
    id: "region.cool-light",
    role: "protected",
    category: "other",
    groupId: "group.atmosphere",
    label: "Hauts de murs — lumière froide optionnelle",
    supportStatus: "declared",
    support: {
      type: "polygon",
      points: [[0.04, 0.072], [0.45, 0.072], [0.45, 0.105], [0.04, 0.105]],
      extraRects: [
        { x0: 0.59, y0: 0.055, x1: 0.98, y1: 0.09 },
        { x0: 0.68, y0: 0.30, x1: 0.98, y1: 0.33 }
      ],
      extraCircles: []
    },
    operation: "protect",
    recipe: "protect",
    overrides: {},
    motion: { action: "none", phase: 0 },
    render: { method: "none", workingSpace: "linear" },
    notes: "Couche opt-in, distincte du ciel. Elle approxime une lumière froide indirecte sur quelques hauts de murs ; ce n’est pas une source lumineuse récupérée."
  });
  variant.atmosphere = {
    enabled: true,
    regionId: "region.sky",
    intensity: 0.42,
    cycles: 2,
    stars: false,
    coolLight: false,
    coolLightRegionId: "region.cool-light",
    note: "Approximation artistique : bleu indigo localisé, boucle entière, aucun pompage global. Étoiles et lumière froide désactivées par défaut."
  };
  return variant;
}

function uniqueSceneId(plan, base) {
  const clean = String(base || "scene").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "scene";
  let id = clean;
  let suffix = 2;
  while ((plan.groups || []).some((group) => group.id === id)) id = `${clean}-${suffix++}`;
  return id;
}

export function createGroup(plan, options = {}) {
  if (!plan || !Array.isArray(plan.groups)) throw new Error("Projet sans liste de groupes.");
  const id = uniqueSceneId(plan, options.id || "group.scene");
  const group = {
    id,
    label: String(options.label || "Scène"),
    category: options.category || "generic",
    elementIds: [],
    animationEnabled: true,
    settings: {}
  };
  plan.groups.push(group);
  return group;
}

export function attachRegionToGroup(plan, region, groupId) {
  const group = (plan.groups || []).find((item) => item.id === groupId);
  if (!group) throw new Error("Groupe introuvable.");
  for (const item of plan.groups) item.elementIds = (item.elementIds || []).filter((id) => id !== region.id);
  if (!group.elementIds.includes(region.id)) group.elementIds.push(region.id);
  region.groupId = group.id;
  return group;
}

export function createProtectedRegion(plan, options = {}) {
  const group = (plan.groups || []).find((item) => item.id === options.groupId);
  if (!group) throw new Error("Un groupe est requis avant d’ajouter une région.");
  const points = (options.points || []).map(([x, y]) => [Number(x), Number(y)]);
  if (points.length < 3 || points.some(([x, y]) => !(x >= 0 && x <= 1 && y >= 0 && y <= 1))) {
    throw new Error("Support polygonal invalide.");
  }
  let baseId = "region.element";
  let id = baseId;
  let suffix = 2;
  while (plan.regions.some((region) => region.id === id)) id = `${baseId}-${suffix++}`;
  const region = {
    id,
    role: "protected",
    category: "other",
    groupId: group.id,
    label: String(options.label || "Région protégée"),
    supportStatus: "declared",
    support: { type: "polygon", points, extraRects: [], extraCircles: [] },
    operation: "protect",
    recipe: "protect",
    overrides: {},
    motion: { action: "none", phase: 0 },
    render: { method: "none", workingSpace: "linear" },
    notes: "Région ajoutée manuellement. Protégée par défaut ; aucune recette n’écrit de pixel tant qu’une recette supportée n’est pas choisie."
  };
  plan.regions.push(region);
  group.elementIds.push(region.id);
  return region;
}

export function removeRegion(plan, regionId) {
  const index = (plan.regions || []).findIndex((region) => region.id === regionId);
  if (index < 0) return null;
  const [removed] = plan.regions.splice(index, 1);
  for (const group of plan.groups || []) {
    group.elementIds = (group.elementIds || []).filter((id) => id !== regionId);
  }
  return removed;
}

/* Une proposition confirmée crée un élément Protéger, jamais une animation silencieuse. */
export function confirmProposal(plan, proposalId) {
  const proposal = (plan.proposals || []).find((item) => item.id === proposalId);
  if (!proposal) throw new Error("Proposition introuvable.");
  if (proposal.status !== "proposed") throw new Error("Cette proposition a déjà été traitée.");
  if (proposal.category !== "flame" && proposal.category !== "light") {
    throw new Error("Catégorie non supportée par l’éditeur de bougies ; la proposition reste non exécutable.");
  }
  const group = (plan.groups || []).find((item) => item.category === "candles") || plan.groups[0];
  const points = proposal.support.points;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const baseId = (proposal.category === "flame" ? "flame." : "light.") + proposal.id.replace(/^proposal\./, "");
  let id = baseId;
  let suffix = 2;
  while (plan.regions.some((region) => region.id === id)) id = baseId + "-" + suffix++;
  const region = proposal.category === "flame"
    ? {
        id,
        role: "animated",
        category: "flame",
        groupId: group.id,
        label: proposal.label,
        supportStatus: "visually-checked",
        support: JSON.parse(JSON.stringify(proposal.support)),
        operation: "protect",
        overrides: {},
        size: 1,
        anchor: [(x0 + x1) / 2, y1],
        height: Math.max(0.012, (y1 - y0) * 0.9),
        width: Math.max(0.004, (x1 - x0) * 0.55),
        motion: { action: "flame-shape", phase: 0.5 },
        render: { method: "procedural-flame-v1", suppression: 0.92, workingSpace: "linear" },
        notes: "Proposition confirmée manuellement. Opération Protéger par défaut ; activer Animer après contrôle du support et de l’ancre."
      }
    : {
        id,
        role: "light-influence",
        category: "light",
        groupId: group.id,
        label: proposal.label,
        supportStatus: "visually-checked",
        support: JSON.parse(JSON.stringify(proposal.support)),
        operation: "protect",
        overrides: {},
        center: [(x0 + x1) / 2, (y0 + y1) / 2],
        radii: [Math.max(0.01, (x1 - x0) / 2), Math.max(0.01, (y1 - y0) / 2)],
        sources: [],
        motion: { action: "warm-pool", phase: 0.2 },
        render: { method: "local-warm-pool-v1", gain: 0.008, color: [1, 0.42, 0.12], falloff: 2, workingSpace: "linear" },
        notes: "Proposition confirmée manuellement. Aucune source liée : la lumière reste inactive jusqu’à liaison explicite."
      };
  plan.regions.push(region);
  if (!group.elementIds.includes(id)) group.elementIds.push(id);
  proposal.status = "confirmed";
  proposal.confirmedElementId = id;
  return { region, proposal };
}

/*
 * Révision expérimentale du renderer, ajoutée après le CORE.
 *
 * Elle ne remplace aucune fonction du CORE : la comparaison montre
 * renderFrame (avant) et renderLabFrame (révision). Toutes les écritures
 * restent dans les supports explicites. Aucune lumière n’est reconstruite
 * physiquement : les pools peints sont seulement modulés par une
 * approximation locale additive, avec une petite correction négative bornée.
 *
 * Le vent n’est pas une simulation physique. C’est un flux partagé déterministe,
 * à rafales et direction signée, auquel chaque flamme répond avec sa propre
 * sensibilité, son délai et un petit résidu. Aucune onde ne traverse la façade.
 */

function labNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function labPhase(plan, time) {
  return phaseAt(time, plan.loop.durationSeconds);
}

function labWindConfig(plan) {
  const raw = plan.lab?.wind || {};
  return {
    profile: raw.profile === "breeze" ? "breeze" : "calm",
    seed: Math.round(labNumber(raw.seed, plan.seed, 0, 1e9)),
    strength: labNumber(raw.strength, 0.52, 0, 1),
    gustFrequency: Math.round(labNumber(raw.gustFrequency, 2, 1, 3)),
    directionBalance: labNumber(raw.directionBalance, 0.18, -1, 1),
    individualVariation: labNumber(raw.individualVariation, 0.65, 0, 1),
    responseDelayMin: labNumber(raw.responseDelayMin, 0.10, 0, 0.8),
    responseDelayMax: labNumber(raw.responseDelayMax, 0.46, 0, 1.2)
  };
}

/*
 * Un seul signal d’air pour toute la scène. Tous les termes temporels sont des
 * harmoniques entières de la boucle ; le raccord est donc exact à t=0/T.
 * Les rafales sont des enveloppes lisses (montée et retombée), pas des sauts.
 */
export function labAirflowAt(plan, time) {
  const config = labWindConfig(plan);
  const calm = config.profile === "calm";
  const u = labPhase(plan, time);
  const w = 2 * Math.PI;
  const seed = config.seed;
  const floor = calm ? 0.12 : 0.34;
  const shape = calm ? 4.2 : 1.8;
  const profileGain = calm ? 0.82 : 1.0;
  const profileDirection = calm ? 0.72 : 1.0;
  const gustPhase = seededUnit(`air:gust:${seed}:${config.profile}`) * w;
  const gust = Math.pow(0.5 - 0.5 * Math.cos(w * config.gustFrequency * u + gustPhase), shape);
  const envelope = floor + (1 - floor) * gust;
  const p1 = seededUnit(`air:dir1:${seed}:${config.profile}`) * w;
  const p2 = seededUnit(`air:dir2:${seed}:${config.profile}`) * w;
  const p3 = seededUnit(`air:dir3:${seed}:${config.profile}`) * w;
  const rawDirection = 0.58 * Math.sin(w * (u + p1))
    + 0.28 * Math.sin(w * (2 * u + p2))
    + 0.14 * Math.sin(w * (3 * u + p3));
  const direction = clamp(rawDirection * profileDirection + config.directionBalance, -1, 1);
  const strength = clamp(
    config.strength * profileGain * (0.24 + 0.76 * envelope) * (0.84 + 0.16 * Math.abs(rawDirection)),
    0,
    1
  );
  return {
    u,
    profile: config.profile,
    seed,
    gust,
    envelope,
    calm: 1 - envelope,
    direction,
    strength,
    flow: strength * direction
  };
}

/*
 * Réponse individuelle : même flux pour tous, mais sensibilité, délai et résidu
 * seedés par flamme. Le délai est appliqué au signal partagé, sans dépendance à
 * la position horizontale : il n’y a donc pas de vague qui traverse la façade.
 */
export function labFlameResponse(plan, flame, time) {
  const config = labWindConfig(plan);
  const settings = resolveSettings(plan, flame);
  const cfg = plan.lab?.flame || {};
  const h = labNumber(cfg.heightGain, 0.19, 0, 0.3);
  const leanCfg = labNumber(cfg.lean, 0.46, 0, 0.65);
  const wg = labNumber(cfg.widthGain, 0.11, 0, 0.3);
  const phase = flame.motion.phase || 0;
  const micro = seededUnit(`air:flame:${flame.id}:${config.seed}`);
  const delayMicro = seededUnit(`air:delay:${flame.id}:${config.seed}`);
  const delay = config.responseDelayMin + (config.responseDelayMax - config.responseDelayMin) * delayMicro;
  const shared = labAirflowAt(plan, time);
  const delayed = labAirflowAt(plan, time - delay);
  const sensitivity = 1 + (micro - 0.5) * 0.55 * config.individualVariation;
  const u = shared.u;
  const w = 2 * Math.PI;
  const r1 = Math.sin(w * (2 * u + phase * 1.3 + micro * 0.37));
  const r2 = Math.sin(w * (3 * u + phase * 0.71 + micro * 0.61));
  const residual = 0.64 * r1 + 0.36 * r2;
  const airLean = delayed.flow * sensitivity * 1.14 + delayed.direction * 0.10;
  const lean = clamp(leanCfg * (airLean + 0.14 * residual), -0.70, 0.70);
  const height = 1
    + h * (0.70 * delayed.envelope - 0.34)
    + h * 0.22 * delayed.flow
    + h * 0.16 * residual;
  const width = 1 + wg * (0.58 * delayed.envelope + 0.24 * residual + 0.18 * r2);
  const brightness = clamp(0.90 + 0.105 * delayed.flow + 0.030 * residual, 0.68, 1.08);
  const signal = clamp(0.58 * delayed.flow + 0.24 * delayed.envelope + 0.18 * residual, -1, 1);
  return {
    shared,
    air: delayed,
    delay,
    sensitivity,
    residual,
    phase,
    height,
    lean,
    width,
    brightness,
    signal,
    shimmer: r2,
    u
  };
}

function labSupportsForLight(plan, light) {
  return (light.sources || [])
    .map((id) => plan.regions.find((region) => region.id === id))
    .filter((flame) => flame && isElementAnimated(plan, flame));
}

function labSourceStates(plan, sources, time) {
  return sources.map((flame) => {
    const x = flame.anchor[0];
    const y = flame.anchor[1];
    return {
      flame,
      x,
      y,
      settings: resolveSettings(plan, flame),
      response: labFlameResponse(plan, flame, time)
    };
  });
}

function labLightSignalAt(plan, light, x, y, width, height, states) {
  if (!states.length) return { signal: 0, intensity: 0, sources: 0 };
  let totalWeight = 0;
  let signal = 0;
  let intensity = 0;
  for (const state of states) {
    const sx = state.x * width;
    const sy = state.y * height;
    const dx = (x + 0.5 - sx) / Math.max(1, width * 0.055);
    const dy = (y + 0.5 - sy) / Math.max(1, height * 0.055);
    const weight = 1 / (0.35 + dx * dx + dy * dy);
    totalWeight += weight;
    signal += weight * state.response.signal;
    intensity += weight * state.settings.intensity;
  }
  return {
    signal: signal / totalWeight,
    intensity: intensity / totalWeight,
    sources: states.length
  };
}

function paintLightLab(ctx, region, support) {
  const { out, width, height, plan, time } = ctx;
  const settings = resolveSettings(plan, region);
  const cfg = plan.lab?.light || {};
  const sources = labSupportsForLight(plan, region);
  if (!sources.length) return;
  const states = labSourceStates(plan, sources, time);
  const isFloor = /floor/.test(region.id);
  const gainScale = labNumber(cfg.gainScale, 6.0, 1, 8)
    * (isFloor ? labNumber(cfg.floorGainScale, 3.0, 1, 4) : 1);
  const modulation = labNumber(cfg.modulation, 1.20, 0, 1.3);
  const dip = labNumber(cfg.dip, 0.060, 0, 0.08);
  const glint = labNumber(cfg.glint, 0.060, 0, 0.10);
  const drift = labNumber(cfg.drift, 0.0040, 0, 0.008);
  const linkIntensity = states.reduce((sum, state) => sum + state.settings.intensity, 0) / states.length;
  const color = region.render.color;
  const falloff = region.render.falloff;
  const { bounds } = support;

  let centerX = region.center[0] * width;
  const centerY = region.center[1] * height;
  const rx = Math.max(2, region.radii[0] * width);
  const ry = Math.max(2, region.radii[1] * height);
  /* Le pool de sol est déjà peint dans la source : on ne déplace que sa
     modulation, pas sa géométrie. Le déplacement reste sous 2 px natifs. */
  if (isFloor) {
    const mid = labLightSignalAt(plan, region, centerX, centerY, width, height, states);
    centerX += mid.signal * drift * width;
  }

  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const nx = (x + 0.5 - centerX) / rx;
      const ny = (y + 0.5 - centerY) / ry;
      const radius = Math.hypot(nx, ny);
      if (radius >= 0.94) continue;
      const link = labLightSignalAt(plan, region, x, y, width, height, states);
      const breathe = 1 + modulation * link.signal;
      const gain = region.render.gain * settings.lightScale * (linkIntensity || link.intensity)
        * gainScale * breathe;
      const falloffAmount = Math.pow(1 - radius / 0.94, falloff);
      const amount = gain * falloffAmount;
      const i = (y * width + x) * 4;
      let r = S2L[out[i]];
      let g = S2L[out[i + 1]];
      let b = S2L[out[i + 2]];

      /* Correction négative très bornée : elle ne retire qu’une petite fraction
         du pool déjà peint, jamais la texture entière. Désactivable (dip=0). */
      if (dip > 0 && link.signal < 0) {
        const local = Math.min(1, Math.max(0, 1 - radius / 0.94));
        const cut = dip * Math.max(0, -link.signal) * local * local;
        const keep = 1 - cut;
        r *= keep;
        g *= keep;
        b *= keep;
      }

      if (amount > 0) {
        r += amount * color[0];
        g += amount * color[1];
        b += amount * color[2];
      }

      /* Apports centrés sur chaque flamme source. Une lumière qui reçoit deux
         flammes additionne deux réponses locales, sans oscillateur commun. */
      if (!isFloor && glint > 0) {
        for (const state of states) {
          const gx = state.x * width;
          const gy = state.y * height;
          const gr = Math.max(2, state.flame.height * height * 2.8);
          const gd = Math.hypot(x + 0.5 - gx, y + 0.5 - gy) / gr;
          if (gd >= 1) continue;
          const add = glint * (1 - gd) * (1 - gd) * (0.78 + 0.22 * state.response.signal);
          r += add * color[0];
          g += add * color[1];
          b += add * color[2];
        }
      }

      out[i] = encode(shoulder(r));
      out[i + 1] = encode(shoulder(g));
      out[i + 2] = encode(shoulder(b));
    }
  }
}

function paintFlameLab(ctx, region, support) {
  const { out, width, height, plan, time } = ctx;
  const settings = resolveSettings(plan, region);
  const cfg = plan.lab?.flame || {};
  const state = labFlameResponse(plan, region, time);
  const u = state.u;
  const size = clamp(region.size || 1, 0.5, 1.8);
  const cx = region.anchor[0] * width;
  const by = region.anchor[1] * height;
  const h0 = Math.max(2, region.height * height * size);
  const w0 = Math.max(1.5, region.width * width * size);
  const heightNow = Math.max(2, h0 * clamp(state.height, 0.72, 1.35));
  const widthNow = Math.max(w0 * 0.7, w0 * clamp(state.width, 0.75, 1.3));
  const leanPx = h0 * clamp(state.lean, -0.70, 0.70);
  const intensity = clamp(settings.intensity, 0, 2);
  const brightness = clamp(state.brightness, 0.68, 1.08);
  const bg = supportBackground(out, support, width);
  const bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  const scx = cx;
  const scy = by - 0.50 * h0;
  const srx = Math.max(2, w0 * 0.82);
  const sry = Math.max(2, h0 * 0.64);
  const haloStrength = labNumber(cfg.halo, 0.075, 0, 0.14);
  const { bounds } = support;

  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const dx = x + 0.5 - cx;
      const dyUp = by - (y + 0.5);
      const i = (y * width + x) * 4;
      let r = S2L[out[i]];
      let g = S2L[out[i + 1]];
      let b = S2L[out[i + 2]];

      /* Nettoyage de la flamme statique : même principe que le CORE, mais
         l’ellipse est plus large pour couvrir la nouvelle hauteur. */
      let suppress = 0;
      if (dyUp > -1.5) {
        const e = Math.hypot((x + 0.5 - scx) / srx, (y + 0.5 - scy) / sry);
        const mask = 1 - smoothstep(0.56, 1.42, e);
        if (mask > 0) {
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const excess = Math.max(0, lum - bgLum);
          suppress = 0.95 * mask * Math.min(1, excess / 0.012);
        }
      }

      let fr = 0;
      let fg = 0;
      let fb = 0;
      if (dyUp >= 0 && dyUp <= heightNow) {
        const sN = dyUp / heightNow;
        const envelope = Math.pow(Math.sin(Math.PI * Math.pow(sN, 0.44)), 0.56);
        const ripple = widthNow * 0.16 * Math.sin(2 * Math.PI * (2 * u + state.phase) + sN * 4.2) * sN * (1 - sN)
          + widthNow * 0.035 * state.shimmer * sN * (1 - sN);
        const center = leanPx * Math.pow(sN, 1.42) + ripple;
        const halfWidth = Math.max(0.30, 0.5 * widthNow * envelope * (0.92 + 0.08 * Math.sin(2 * Math.PI * 4 * u + sN * 6.0)));
        const distance = Math.abs(dx - center);
        if (distance < halfWidth + 1.1) {
          const alpha = Math.min(1, (halfWidth + 1.1 - distance) / 1.5);
          const q = Math.max(0, 1 - distance / Math.max(0.01, halfWidth));
          const temp = Math.min(1, Math.max(0, 0.30 + 0.48 * q - 0.22 * sN));
          const blueBase = 1 - smoothstep(0.06, 0.32, sN);
          const body = Math.min(0.92, 0.88 * envelope * alpha * (0.34 + 0.74 * q) * intensity * brightness);
          fr += body * (0.94 - 0.22 * blueBase);
          fg += body * (0.32 + 0.48 * temp - 0.14 * blueBase);
          fb += body * (0.055 + 0.30 * temp + 0.34 * blueBase);
        }
      }

      const haloX = Math.max(2, 0.62 * heightNow);
      const haloY = Math.max(2, 0.54 * heightNow);
      const hx = (x + 0.5 - cx - leanPx * 0.30) / haloX;
      const hy = (y + 0.5 - (by - 0.44 * heightNow)) / haloY;
      const haloDistance = Math.hypot(hx, hy);
      if (haloDistance < 1) {
        const glow = (1 - haloDistance) * (1 - haloDistance) * haloStrength * intensity
          * (0.84 + 0.16 * state.signal);
        fr += glow;
        fg += glow * 0.37;
        fb += glow * 0.10;
      }

      /* Mèche courte, uniquement dans le support : évite une flamme
         visiblement détachée sans créer de patch sombre rectangulaire. */
      if (dyUp >= 0 && dyUp <= h0 * 0.18 && Math.abs(dx) <= Math.max(0.6, w0 * 0.16)) {
        const wick = 0.42 * (1 - dyUp / Math.max(1, h0 * 0.18));
        r *= 1 - wick;
        g *= 1 - wick;
        b *= 1 - wick;
      }

      if (suppress <= 0 && fr <= 0 && fg <= 0 && fb <= 0) continue;
      r += (bg[0] - r) * suppress;
      g += (bg[1] - g) * suppress;
      b += (bg[2] - b) * suppress;
      out[i] = encode(shoulder(r + fr));
      out[i + 1] = encode(shoulder(g + fg));
      out[i + 2] = encode(shoulder(b + fb));
    }
  }
}

function paintAtmosphereLab(ctx, region, support) {
  const { out, base, width, height, plan, time } = ctx;
  const config = plan.atmosphere;
  const cfg = plan.lab?.atmosphere || {};
  const intensity = clamp(Number(config?.intensity) || 0, 0, 1)
    * labNumber(cfg.intensityScale, 1.55, 0.2, 2.5);
  if (!(intensity > 0)) return;
  const u = labPhase(plan, time);
  const band = labNumber(cfg.band, 0.38, 0, 0.7);
  const seed = plan.seed;
  const p1 = seededUnit(`atmo:large:${seed}`) * 2 * Math.PI;
  const p2 = seededUnit(`atmo:medium:${seed}`) * 2 * Math.PI;
  const p3 = seededUnit(`atmo:fine:${seed}`) * 2 * Math.PI;
  const { bounds } = support;
  const baseLumAt = (x, y) => {
    const i = (y * width + x) * 4;
    return 0.2126 * S2L[base[i]] + 0.7152 * S2L[base[i + 1]] + 0.0722 * S2L[base[i + 2]];
  };
  for (let y = bounds.y0; y <= bounds.y1; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      if (!containsPrepared(support, x + 0.5, y + 0.5)) continue;
      const i = (y * width + x) * 4;
      const r = S2L[base[i]];
      const g = S2L[base[i + 1]];
      const b = S2L[base[i + 2]];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const dx = Math.abs(baseLumAt(Math.min(width - 1, x + 1), y) - baseLumAt(Math.max(0, x - 1), y));
      const dy = Math.abs(baseLumAt(x, Math.min(height - 1, y + 1)) - baseLumAt(x, Math.max(0, y - 1)));
      const edgeGuard = 1 - 0.88 * Math.min(1, (dx + dy) * 90);
      const warmGuard = 1 - 0.86 * clamp((r - b) * 26, 0, 1);
      const skyGuard = 0.28 + 0.72 * (1 - smoothstep(0.012, 0.13, lum));
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;
      /* Trois échelles spatiales et trois vitesses entières, sans respiration
         globale : le voile se déplace dans le masque de ciel, pas l’image. */
      const large = Math.sin(2 * Math.PI * (nx * 1.18 + ny * 0.20 + u + p1));
      const medium = Math.sin(2 * Math.PI * (nx * 2.65 - ny * 0.46 + 2 * u + p2));
      const fine = Math.sin(2 * Math.PI * (nx * 0.62 + ny * 1.38 + u + p3));
      const field = 0.5 + 0.5 * (0.50 * large + 0.32 * medium + 0.18 * fine);
      const vertical = 0.5 + 0.5 * Math.cos(2 * Math.PI * (ny * 1.17 - u + p2 * 0.35));
      const veil = 1 - band + band * vertical;
      const amount = intensity * 0.145 * (0.34 + 0.66 * field) * veil
        * edgeGuard * warmGuard * skyGuard;
      out[i] = encode(shoulder(r + amount * 0.12));
      out[i + 1] = encode(shoulder(g + amount * 0.40));
      out[i + 2] = encode(shoulder(b + amount * 0.95));
    }
  }
  if (config.stars) {
    const phase = Math.PI * 2 * 3 * u;
    paintAtmosphereStars(ctx, support, intensity, phase);
  }
}

export function renderLabFrame(base, plan, time, options = {}) {
  const width = options.width || plan.source.width;
  const height = options.height || plan.source.height;
  const out = options.out || new Uint8ClampedArray(base.length);
  if (out !== base) out.set(base);
  const ctx = { base, out, width, height, plan, time };
  const atmosphere = atmosphereOf(plan);
  if (atmosphere) {
    paintAtmosphereLab(ctx, atmosphere.region, prepareSupport(atmosphere.region, width, height));
    if (atmosphere.config.coolLight && atmosphere.config.coolLightRegionId) {
      const cool = (plan.regions || []).find((region) => region.id === atmosphere.config.coolLightRegionId);
      if (cool) paintCoolLight(ctx, atmosphere.config, cool, prepareSupport(cool, width, height));
    }
  }
  const active = (plan.regions || []).filter((region) => isElementAnimated(plan, region));
  const lights = active.filter((region) => region.role === "light-influence");
  const flames = active.filter((region) => region.role === "animated");
  for (const region of lights) paintLightLab(ctx, region, prepareSupport(region, width, height));
  for (const region of flames) paintFlameLab(ctx, region, prepareSupport(region, width, height));
  return { rgba: out, width, height };
}
