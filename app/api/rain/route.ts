import { fetchRetry } from "@/lib/fetchRetry";
import { NextRequest, NextResponse } from "next/server";
import { cached, DAY } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * Annual rain cross-check across independent-ish sources, 2015–2024:
 *  - NASA POWER  (MERRA-2 reanalysis, precipitation-corrected)
 *  - Open-Meteo  (best-match blend — ECMWF-derived)
 *  - ERA5        (via Open-Meteo archive — same ECMWF family)
 *  - Meteomatics (only if credentials are in .env)
 * The point is the disagreement, not a single truth.
 */

const START = 2015;
const END = 2024;
const YEARS = END - START + 1;

async function powerAnnual(lat: number, lon: number) {
  const url =
    `https://power.larc.nasa.gov/api/temporal/monthly/point` +
    `?parameters=PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}` +
    `&start=${START}&end=${END}&format=JSON`;
  const res = await fetchRetry(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`POWER ${res.status}`);
  const json = await res.json();
  const p = json?.properties?.parameter?.PRECTOTCORR ?? {};
  // key "YYYY13" is the annual mean in mm/day
  let sum = 0;
  let n = 0;
  for (let y = START; y <= END; y++) {
    const v = p[`${y}13`];
    if (v != null && v !== -999) {
      sum += v * 365.25;
      n++;
    }
  }
  if (!n) throw new Error("POWER: no annual values");
  return Math.round(sum / n);
}

async function openMeteoAnnual(lat: number, lon: number, model?: string) {
  const key = process.env.OPEN_METEO_API_KEY;
  const host = key
    ? "customer-archive-api.open-meteo.com"
    : "archive-api.open-meteo.com";
  const url =
    `https://${host}/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${START}-01-01&end_date=${END}-12-31` +
    `&monthly=precipitation_sum` +
    (model ? `&models=${model}` : "") +
    (key ? `&apikey=${key}` : "");
  let res = await fetchRetry(url, { cache: "no-store" });
  let json = await res.json();
  let sums: number[] | undefined = json?.monthly?.precipitation_sum;
  if (!sums) {
    // some deployments only support daily aggregation
    const dUrl = url.replace("&monthly=precipitation_sum", "&daily=precipitation_sum");
    res = await fetch(dUrl, { cache: "no-store" });
    json = await res.json();
    sums = json?.daily?.precipitation_sum;
    if (!sums) throw new Error(json?.reason ?? `open-meteo ${res.status}`);
  }
  const total = sums.reduce((a: number, b: number | null) => a + (b ?? 0), 0);
  return Math.round(total / YEARS);
}

async function meteomaticsAnnual(lat: number, lon: number) {
  const user = process.env.METEOMATICS_USERNAME;
  const pass = process.env.METEOMATICS_PASSWORD;
  if (!user || !pass) return null;
  const url =
    `https://api.meteomatics.com/${START}-01-01T00:00:00Z--${END + 1}-01-01T00:00:00Z:P1Y/` +
    `precip_365d:mm/${lat},${lon}/json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`meteomatics ${res.status}`);
  const json = await res.json();
  const dates: { value: number }[] =
    json?.data?.[0]?.coordinates?.[0]?.dates ?? [];
  const vals = dates.map((d) => d.value).filter((v) => Number.isFinite(v));
  if (!vals.length) throw new Error("meteomatics: empty");
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  // per-source caching: a success sticks for 7 days, a failure is
  // retried on the next request instead of poisoning the cache
  const [power, om, era5, meteomatics] = await Promise.allSettled([
    cached(`rain:power:${lat},${lon}`, 7 * DAY, () => powerAnnual(lat, lon)),
    cached(`rain:om:${lat},${lon}`, 7 * DAY, () => openMeteoAnnual(lat, lon)),
    cached(`rain:era5:${lat},${lon}`, 7 * DAY, () => openMeteoAnnual(lat, lon, "era5")),
    cached(`rain:mm:${lat},${lon}`, 7 * DAY, () => meteomaticsAnnual(lat, lon)),
  ]);
  const data = await (async () => {

    const val = (r: PromiseSettledResult<number | null>) =>
      r.status === "fulfilled" ? r.value : null;
    const err = (r: PromiseSettledResult<number | null>) =>
      r.status === "rejected" ? String(r.reason?.message ?? r.reason) : null;

    const sources = [
      {
        id: "power",
        label: "NASA POWER",
        note: "MERRA-2 reanalysis, corrected",
        independent: true,
        mm: val(power),
        error: err(power),
      },
      {
        id: "openmeteo",
        label: "Open-Meteo",
        note: "derived from ECMWF reanalysis",
        independent: false,
        mm: val(om),
        error: err(om),
      },
      {
        id: "era5",
        label: "ERA5",
        note: "derived from ECMWF reanalysis",
        independent: false,
        mm: val(era5),
        error: err(era5),
      },
      {
        id: "meteomatics",
        label: "Meteomatics",
        note: process.env.METEOMATICS_USERNAME
          ? "mixed model/station"
          : "needs API key in .env",
        independent: true,
        mm: val(meteomatics),
        error: err(meteomatics),
      },
    ];

    const got = sources.map((s) => s.mm).filter((v): v is number => v != null);
    const spread = got.length >= 2 ? Math.max(...got) - Math.min(...got) : null;
    const spreadPct =
      spread != null && got[0] ? Math.round((spread / got[0]) * 1000) / 10 : null;

    return {
      period: `${START}–${END}`,
      sources,
      spreadMm: spread,
      spreadPctOfFirst: spreadPct,
    };
  })();

  return NextResponse.json(data);
}
