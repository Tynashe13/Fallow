/**
 * Computed figures. Nothing here is typed in: every output is arithmetic on
 * ledger rows, and each result lists the rows it used in `from`.
 * Ported from Build A (reference/build-a/app.js) so the wording and the sums
 * stay the same.
 */
import { get, num, series, sitePrefix, RAIN_PROVIDERS, TRIAL_IDS, PLATE_MONTH } from "./rows";
import type { SiteId } from "./types";
import { METRICS } from "./metrics";

const r0 = (x: number) => Math.round(x);
const r1 = (x: number) => Math.round(x * 10) / 10;
const sum = (a: readonly number[]) => a.reduce((s, v) => s + v, 0);

export const THRESHOLD = () => num("rule_spread");

/* ---------- rain: four sources ---------- */
export function rainSummary(site: SiteId) {
  const p = sitePrefix(site);
  const sources = RAIN_PROVIDERS.map((pr) => {
    const id = `${p}_rain_${pr.key}`;
    return { ...pr, id, value: num(id) };
  });
  const vals = sources.map((s) => s.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const imerg = sources[0].value;
  const pct = Math.round(((hi - lo) / imerg) * 1000) / 10;
  const agree = pct <= THRESHOLD();
  return {
    sources, lo, hi, spread: hi - lo, pct, agree, imerg,
    confidence: agree ? "Medium" : "Low",
    from: [...sources.map((s) => s.id), "rule_spread"],
  };
}

/* ---------- rain in the growing season (May to October, our window) ---------- */
export const SEASON = [4, 5, 6, 7, 8, 9];
export function seasonRain(site: SiteId) {
  const p = sitePrefix(site);
  const rs = rainSummary(site);
  const m = series(`${p}_rain_monthly`);
  const annual = sum(m);
  const seasonMonths = SEASON.map((i) => m[i]);
  const seasonMm = sum(seasonMonths);
  const share = seasonMm / annual;
  const src = rs.sources.map((s) => ({ name: s.name, annual: s.value, season: r0(s.value * share) }));
  const sv = src.map((x) => x.season);
  const lo = Math.min(...sv), hi = Math.max(...sv);
  const wu = get("r1_water_use");
  const [wuMin, wuMax] = wu.range ?? [NaN, NaN];
  return {
    rs, annual, seasonMonths, seasonMm, share, sharePct: r1(share * 100), shareFactor: Math.round(share * 1000) / 1000,
    src, lo, hi, cut1: r0(lo + (hi - lo) / 3), cut2: r0(lo + (2 * (hi - lo)) / 3),
    reach: sv.filter((v) => v >= wuMin).length, wuMin, wuMax, wuText: `${wu.value} ${wu.unit}`,
    from: [...rs.from, `${p}_rain_monthly`, "r1_water_use", "season_months"],
  };
}

/* ---------- topsoil moisture at canola planting ---------- */
export function moistureSteps(site: SiteId) {
  const p = sitePrefix(site);
  const w = series(`${p}_wet_surface`);
  const idx = [3, 4, 5]; // April, May, June: the canola window months
  const steps: { month: number; value: number; prev: number | null }[] = [];
  let prev: number | null = null;
  for (const i of idx) {
    const v = w[i];
    if (prev !== null && v <= prev) continue;
    steps.push({ month: i, value: v, prev });
    prev = v;
  }
  return { steps, last: prev as number, readings: idx.map((i) => ({ month: i, value: w[i] })), from: [`${p}_wet_surface`, "r3_planting_moisture", "r3_window"] };
}

/* ---------- two soil maps ---------- */
export function soilCompare(site: SiteId) {
  const p = sitePrefix(site);
  const v = (src: "soilgrids" | "isda", prop: "clay" | "sand" | "ph") => num(`${p}_top_${src}_${prop}`);
  const a = v("soilgrids", "clay"), b = v("isda", "clay");
  const d = r1(Math.abs(a - b));
  const pct = r1((d / a) * 100);
  const sandD = r1(Math.abs(v("soilgrids", "sand") - v("isda", "sand")));
  const phD = r1(Math.abs(v("soilgrids", "ph") - v("isda", "ph")));
  const points = num("rule_soil_points");
  const flagged = [d >= points ? "clay" : null, sandD >= points ? "sand" : null].filter((x): x is string => x !== null);
  return {
    a, b, d, pct, agree: pct <= THRESHOLD(), ratio: r1(Math.max(a, b) / Math.min(a, b)),
    sgSand: v("soilgrids", "sand"), isdaSand: v("isda", "sand"), sandD,
    pa: v("soilgrids", "ph"), pb: v("isda", "ph"), phD, flagged, points, n: num(`${p}_top_n`),
    from: ["clay", "sand", "ph"].flatMap((k) => [`${p}_top_soilgrids_${k}`, `${p}_top_isda_${k}`]).concat([`${p}_top_n`, "rule_spread", "rule_soil_points"]),
  };
}

/* ---------- ARC trial ---------- */
export function trialCompare() {
  const mono = TRIAL_IDS.filter((t) => t.rotation === "Wheat monoculture");
  const rot = TRIAL_IDS.filter((t) => t.rotation !== "Wheat monoculture");
  let lower = 0, cells = 0;
  const byTillage = mono.map((m) => {
    const r = rot.find((x) => x.tillage === m.tillage);
    if (!r) throw new Error(`Trial: no rotation row for ${m.tillage}`);
    const mv = series(m.id), rv = series(r.id);
    const diffs = rv.map((x, i) => x - mv[i]);
    const lowerFlags = diffs.map((x) => x < 0);
    cells += diffs.length;
    lower += lowerFlags.filter(Boolean).length;
    const tot = sum(diffs);
    return { tillage: m.tillage, monoId: m.id, rotId: r.id, mv, rv, diffs, lowerFlags, tot, avg: r0(tot / diffs.length), lc: lowerFlags.filter(Boolean).length };
  });
  return { byTillage, lower, cells, from: TRIAL_IDS.map((t) => t.id) };
}

/* ---------- sun at solar noon, 21 June ---------- */
export function sunNoon(site: SiteId) {
  const p = sitePrefix(site);
  const lat = num(`${p}_lat`), decl = num("declination");
  return { altitude: r1(90 - Math.abs(lat - decl)), lat, decl, from: [`${p}_lat`, "declination"] };
}

/* ---------- how big is a source cell next to a field ---------- */
export function cellSizes(site: SiteId) {
  const p = sitePrefix(site);
  const lat = num(`${p}_lat`), km = num("geo_km_per_deg"), haKm = num("ha_per_km2");
  const field = num("rule_min_ha");
  const cos = Math.cos((lat * Math.PI) / 180);
  const deg = (ns: number, ew: number) => {
    const nsKm = ns * km, ewKm = ew * km * cos;
    const ha = nsKm * ewKm * haKm;
    return { nsKm: r1(nsKm), ewKm: r1(ewKm), ha: r0(ha), fields: r0(ha / field), sideM: Math.sqrt(nsKm * ewKm) * 1000 };
  };
  const metres = (m: number) => {
    const ha = (m * m) / 10000;
    return { m, ha: Math.round(ha * 100) / 100, perField: r0(field / ha), sideM: m };
  };
  return {
    fieldHa: field, fieldSideM: r0(Math.sqrt(field * 10000)),
    imerg: deg(num("res_imerg"), num("res_imerg")),
    merra: deg(num("res_merra_lat"), num("res_merra_lon")),
    soilgrids: metres(num("res_soilgrids")),
    isda: metres(num("res_isda")),
    from: [`${p}_lat`, "geo_km_per_deg", "ha_per_km2", "rule_min_ha", "res_imerg", "res_merra_lat", "res_merra_lon", "res_soilgrids", "res_isda"],
  };
}

/* ---------- can a winner be named? ---------- */
export function verdict() {
  const total = num("metric_cells");
  const sourced = METRICS.reduce((n, m) => n + (m.r1.sourced ? 1 : 0) + (m.r3.sourced ? 1 : 0), 0);
  if (METRICS.length * 2 !== total) throw new Error("Metric cell count does not match the ledger");
  return { total, sourced, canName: sourced * 2 >= total, from: ["metric_cells", "rule_half"] };
}

export function juneValue(id: string) {
  return series(id)[PLATE_MONTH];
}

/** Great-circle distance in km, rounded to the nearest 10. Used by the scope ladder. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = (num("geo_km_per_deg") * 180) / Math.PI;
  const t = Math.PI / 180;
  const h = Math.sin(((bLat - aLat) * t) / 2) ** 2 + Math.cos(aLat * t) * Math.cos(bLat * t) * Math.sin(((bLon - aLon) * t) / 2) ** 2;
  return Math.round((2 * R * Math.asin(Math.sqrt(h))) / 10) * 10;
}
