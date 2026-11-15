// Re-fetches what can be re-fetched from the original sources and compares it
// with the ledger. Writes docs/verification.json. A ledger row may be marked
// "checked" on the strength of this file only if its result here is "match".
// Needs outbound network and a started app:
//   BASE=http://localhost:3000 node scripts/verify-sources.mjs
import { writeFile, mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SITES = [
  { id: "overberg", p: "ob", lat: -34.2, lon: 19.801 },
  { id: "swartland", p: "sw", lat: -33.46, lon: 18.73 },
];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

async function getJson(url, ms = 90_000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function compare(label, ledger, fetched, tol) {
  const diffs = ledger.map((v, i) => Math.abs(v - fetched[i]));
  const worst = Math.max(...diffs);
  return { check: label, result: worst <= tol ? "match" : "mismatch", tolerance: tol, largest_difference: Math.round(worst * 100) / 100, ledger, fetched };
}

const out = {
  run_at: new Date().toISOString(),
  note: "Results of re-fetching source values and comparing them with the ledger. Tolerance is one unit in the last printed decimal, to allow for rounding at the boundary. A match shows the value can be reproduced from the source API today; it does not show the model value is accurate on the ground.",
  sites: {},
};

for (const s of SITES) {
  const rows = Object.fromEntries((await getJson(`${BASE}/api/ledger?lat=${s.lat}&lon=${s.lon}`)).rows.map((r) => [r.id, r]));
  const checks = [];

  // NASA POWER monthly climatology (MERRA-2)
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,RH2M,EVLAND,GWETTOP,GWETROOT,GWETPROF&community=AG&longitude=${s.lon}&latitude=${s.lat}&format=JSON`;
    const j = await getJson(url);
    const P = j.properties.parameter;
    const m = (name, f = (v) => v) => MONTHS.map((k, i) => f(P[name][k], i));
    const r1 = (v) => Math.round(v * 10) / 10, r0 = (v) => Math.round(v);
    checks.push({ source: "NASA POWER climatology", url, period: j.header?.range ?? null });
    checks.push(compare(`${s.p}_t2m`, rows[`${s.p}_t2m`].value, m("T2M", r1), 0.1));
    checks.push(compare(`${s.p}_rh`, rows[`${s.p}_rh`].value, m("RH2M", r1), 0.1));
    checks.push(compare(`${s.p}_evap`, rows[`${s.p}_evap`].value, m("EVLAND", (v, i) => r0(v * DAYS[i])), 1));
    checks.push(compare(`${s.p}_wet_surface`, rows[`${s.p}_wet_surface`].value, m("GWETTOP", (v) => r0(v * 100)), 0.5));
    checks.push(compare(`${s.p}_wet_root`, rows[`${s.p}_wet_root`].value, m("GWETROOT", (v) => r0(v * 100)), 0.5));
    checks.push(compare(`${s.p}_wet_profile`, rows[`${s.p}_wet_profile`].value, m("GWETPROF", (v) => r0(v * 100)), 0.5));
  } catch (e) {
    checks.push({ check: "NASA POWER climatology", result: "not reproduced", reason: String(e.message ?? e) });
  }

  // NASA GPM IMERG via the POWER daily API, 2015 to 2024
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=IMERG_PRECTOT&community=AG&longitude=${s.lon}&latitude=${s.lat}&start=20150101&end=20241231&format=JSON`;
    const j = await getJson(url, 150_000);
    const d = j.properties.parameter.IMERG_PRECTOT;
    const sums = Array(12).fill(0);
    let missing = 0, n = 0;
    for (const k in d) { n++; if (d[k] < 0) { missing++; continue; } sums[Number(k.slice(4, 6)) - 1] += d[k]; }
    if (missing > n * 0.05) {
      checks.push({ check: `${s.p}_rain_monthly`, result: "not reproduced", reason: `${missing} of ${n} daily values came back as missing`, url });
    } else {
      const monthly = sums.map((v) => Math.round(v / 10));
      checks.push({ ...compare(`${s.p}_rain_monthly`, rows[`${s.p}_rain_monthly`].value, monthly, 1), url });
      checks.push({ ...compare(`${s.p}_rain_imerg`, [rows[`${s.p}_rain_imerg`].value], [monthly.reduce((a, b) => a + b, 0)], 2), url });
    }
  } catch (e) {
    checks.push({ check: `${s.p}_rain_monthly`, result: "not reproduced", reason: String(e.message ?? e) });
  }

  // ISRIC SoilGrids at the site centre
  try {
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${s.lon}&lat=${s.lat}&property=clay&property=sand&property=phh2o&value=mean`;
    const j = await getJson(url, 120_000);
    const DEPTHS = ["0-5", "5-15", "15-30", "30-60", "60-100", "100-200"];
    for (const layer of j.properties.layers) {
      const key = layer.name === "phh2o" ? "ph" : layer.name;
      const fetched = layer.depths.map((x) => (x.values.mean === null ? null : x.values.mean / 10));
      const ledger = DEPTHS.map((dd) => rows[`${s.p}_${key}_${dd.replace("-", "_")}`].value);
      if (fetched.some((v) => v === null)) checks.push({ check: `${s.p}_${key}_by_depth`, result: "not reproduced", reason: "SoilGrids returned no value at the site centre", ledger, url });
      else checks.push({ ...compare(`${s.p}_${key}_by_depth`, ledger, fetched, 0.05), url });
    }
  } catch (e) {
    checks.push({ check: `${s.p}_soilgrids`, result: "not reproduced", reason: String(e.message ?? e) });
  }

  out.sites[s.id] = checks;
  for (const c of checks) if (c.check) console.log(`${s.id.padEnd(10)} ${String(c.check).padEnd(22)} ${c.result}${c.reason ? " (" + c.reason + ")" : ""}`);
}

out.not_attempted = [
  "Open-Meteo, ERA5 and Meteomatics annual rain: provider hosts are not reachable from the build environment or need keys.",
  "iSDA topsoil: needs credentials.",
  "Terrain elevation range and Fields of the World outline counts and areas: the source grids and outline files are not in this repository.",
  "ARC-SGI and DAFF documents: need a person to open the PDFs.",
];
await mkdir("docs", { recursive: true });
await writeFile("docs/verification.json", JSON.stringify(out, null, 1) + "\n");
console.log("wrote docs/verification.json");
