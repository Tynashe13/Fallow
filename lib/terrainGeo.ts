import * as THREE from "three";

export interface TerrainData {
  grid: number;
  bbox: { west: number; east: number; south: number; north: number };
  widthM: number;
  heightM: number;
  minElev: number;
  maxElev: number;
  elev: number[];
}

export const WORLD_W = 10; // block width (west→east) in world units
export const EXAGGERATION = 5; // terrain height ×5, stated on the plate
export const BLOCK_DEPTH_Y = 3.4; // soil block height below the lowest point

export function worldScale(t: TerrainData) {
  // normalise so the longest side is WORLD_W
  const longest = Math.max(t.widthM, t.heightM);
  const w = (WORLD_W * t.widthM) / longest;
  const d = (WORLD_W * t.heightM) / longest; // north→south extent
  const yPerMetre = (w / t.widthM) * EXAGGERATION;
  return { w, d, yPerMetre };
}

/** y for an elevation in metres (0 at the block's lowest point). */
export function elevToY(t: TerrainData, elevM: number) {
  return (elevM - t.minElev) * worldScale(t).yPerMetre;
}

/** Bilinear elevation sample at fractional grid coords. */
export function sampleElev(t: TerrainData, fx: number, fz: number) {
  const g = t.grid;
  const x = Math.min(g - 1.001, Math.max(0, fx));
  const z = Math.min(g - 1.001, Math.max(0, fz));
  const x0 = Math.floor(x), z0 = Math.floor(z);
  const dx = x - x0, dz = z - z0;
  const e = t.elev;
  return (
    e[z0 * g + x0] * (1 - dx) * (1 - dz) +
    e[z0 * g + x0 + 1] * dx * (1 - dz) +
    e[(z0 + 1) * g + x0] * (1 - dx) * dz +
    e[(z0 + 1) * g + x0 + 1] * dx * dz
  );
}

/** lon/lat → world x/z (x east, z south; centre of block at origin). */
export function lonLatToWorld(t: TerrainData, lon: number, lat: number) {
  const { w, d } = worldScale(t);
  const u = (lon - t.bbox.west) / (t.bbox.east - t.bbox.west);
  const v = (t.bbox.north - lat) / (t.bbox.north - t.bbox.south);
  return { x: (u - 0.5) * w, z: (v - 0.5) * d, u, v };
}

/** Top surface: grid mesh with real elevation + per-vertex elevation
 *  attribute for the contour/ramp shader. */
export function buildTopGeometry(t: TerrainData): THREE.BufferGeometry {
  const g = t.grid;
  const { w, d } = worldScale(t);
  const pos = new Float32Array(g * g * 3);
  const elevAttr = new Float32Array(g * g);

  for (let j = 0; j < g; j++) {
    for (let i = 0; i < g; i++) {
      const k = j * g + i;
      pos[k * 3] = (i / (g - 1) - 0.5) * w;
      pos[k * 3 + 1] = elevToY(t, t.elev[k]);
      pos[k * 3 + 2] = (j / (g - 1) - 0.5) * d;
      elevAttr[k] = t.elev[k];
    }
  }

  const idx: number[] = [];
  for (let j = 0; j < g - 1; j++) {
    for (let i = 0; i < g - 1; i++) {
      const a = j * g + i;
      const b = a + 1;
      const c = a + g;
      const e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("elev", new THREE.BufferAttribute(elevAttr, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** One soil wall along a block edge. side: 0=N(z-), 1=E(x+), 2=S(z+), 3=W(x-).
 *  UV v runs 0 at the terrain surface → 1 at the block bottom, so the
 *  horizon texture follows the terrain like the plates. */
export function buildWallGeometry(
  t: TerrainData,
  side: 0 | 1 | 2 | 3
): THREE.BufferGeometry {
  const g = t.grid;
  const { w, d } = worldScale(t);
  const n = g;
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const yBottom = -BLOCK_DEPTH_Y;

  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    let x = 0, z = 0, gi = 0, gj = 0;
    if (side === 0) { x = (f - 0.5) * w; z = -d / 2; gi = i; gj = 0; }
    if (side === 1) { x = w / 2; z = (f - 0.5) * d; gi = g - 1; gj = i; }
    if (side === 2) { x = (0.5 - f) * w; z = d / 2; gi = g - 1 - i; gj = g - 1; }
    if (side === 3) { x = -w / 2; z = (0.5 - f) * d; gi = 0; gj = g - 1 - i; }
    const yTop = elevToY(t, t.elev[gj * g + gi]);

    pos[i * 3] = x; pos[i * 3 + 1] = yTop; pos[i * 3 + 2] = z;
    pos[(n + i) * 3] = x; pos[(n + i) * 3 + 1] = yBottom; pos[(n + i) * 3 + 2] = z;
    uv[i * 2] = f * 2; uv[i * 2 + 1] = 0;
    uv[(n + i) * 2] = f * 2; uv[(n + i) * 2 + 1] = 1;
  }

  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    idx.push(i, n + i, i + 1, i + 1, n + i, n + i + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export interface SoilHorizonColor {
  depth: string;
  color: string;
  frac: number; // share of wall height ("depths not to scale")
  sandPct: number | null;
}

/** Horizon band colours: location palette darkened by clay content. */
export function horizonColors(
  light: string,
  dark: string,
  horizons: { depth: string; clayPct: number | null; sandPct: number | null }[] | null
): SoilHorizonColor[] {
  const fracs = [0.07, 0.09, 0.11, 0.14, 0.18, 0.41];
  const a = new THREE.Color(light);
  const b = new THREE.Color(dark);
  const depths = ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm"];
  return depths.map((depth, i) => {
    const h = horizons?.[i];
    // clay 0–40 % → 0–1 mix toward the dark end, with depth as fallback
    const clay = h?.clayPct;
    const mix = clay != null ? Math.min(1, clay / 40) : (i + 1) / 6;
    const c = a.clone().lerp(b, 0.12 + 0.62 * mix);
    return { depth, color: `#${c.getHexString()}`, frac: fracs[i], sandPct: h?.sandPct ?? null };
  });
}

/** Canvas texture of the six horizon bands, sand shown as speckle. */
export function buildSoilTexture(bands: SoilHorizonColor[]): THREE.CanvasTexture {
  const W = 512, H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  let y = 0;
  const rnd = mulberry32(42);
  for (const band of bands) {
    const h = Math.round(band.frac * H);
    ctx.fillStyle = band.color;
    ctx.fillRect(0, y, W, h + 2);
    // sand speckle: density from sand %
    const sand = band.sandPct ?? 50;
    const dots = Math.round((sand / 100) * 900 * band.frac * 6);
    ctx.fillStyle = "rgba(250, 246, 236, 0.35)";
    for (let i = 0; i < dots; i++) {
      const dx = rnd() * W;
      const dy = y + 3 + rnd() * (h - 5);
      const r = 0.7 + rnd() * 1.1;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // faint boundary line
    ctx.fillStyle = "rgba(40, 24, 32, 0.18)";
    ctx.fillRect(0, y + h - 1, W, 1.5);
    y += h;
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
