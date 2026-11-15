import { NextRequest, NextResponse } from "next/server";
import { parseSiteQuery } from "@/lib/siteGuard";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * Current weather at the field → drives the sky over the 3D block.
 * Primary: Open-Meteo (keyless; commercial key honoured if present).
 * Fallback: MET Norway Locationforecast (keyless, needs a User-Agent).
 */

export type SkyKind =
  | "clear" | "partly" | "cloudy" | "fog" | "drizzle"
  | "rain" | "storm" | "snow";

function kindFromWmo(code: number): SkyKind {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 85 && code <= 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

function kindFromSymbol(symbol: string): SkyKind {
  const s = symbol.toLowerCase();
  if (s.includes("thunder")) return "storm";
  if (s.includes("snow") || s.includes("sleet")) return "snow";
  if (s.includes("heavyrain") || s.includes("rain")) return "rain";
  if (s.includes("drizzle") || s.includes("lightrain")) return "drizzle";
  if (s.includes("fog")) return "fog";
  if (s.includes("partlycloudy") || s.includes("fair")) return "partly";
  if (s.includes("cloudy")) return "cloudy";
  if (s.includes("clearsky")) return "clear";
  return "cloudy";
}

async function openMeteo(lat: number, lon: number) {
  const key = process.env.OPEN_METEO_API_KEY;
  const host = key ? "customer-api.open-meteo.com" : "api.open-meteo.com";
  const url =
    `https://${host}/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,` +
    `cloud_cover,wind_speed_10m,is_day&timezone=auto` +
    (key ? `&apikey=${key}` : "");
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json?.error) throw new Error(json?.reason ?? `open-meteo ${res.status}`);
  const c = json.current;
  return {
    source: "Open-Meteo",
    kind: kindFromWmo(c.weather_code),
    tempC: c.temperature_2m,
    humidityPct: c.relative_humidity_2m,
    precipMm: c.precipitation,
    cloudCoverPct: c.cloud_cover,
    windMs: Math.round((c.wind_speed_10m / 3.6) * 10) / 10, // km/h → m/s
    isDay: c.is_day === 1,
    observedAt: c.time as string,
    timezone: json.timezone as string,
  };
}

async function metNo(lat: number, lon: number) {
  const url =
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: {
      // met.no requires an identifying UA; generic project id, no personal data
      "User-Agent": "fallow-field-profile/0.1 github.com/Tynashe13/Fallow",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`met.no ${res.status}`);
  const json = await res.json();
  const now = json?.properties?.timeseries?.[0];
  if (!now) throw new Error("met.no: empty timeseries");
  const d = now.data.instant.details;
  const symbol: string =
    now.data.next_1_hours?.summary?.symbol_code ??
    now.data.next_6_hours?.summary?.symbol_code ??
    "cloudy";
  return {
    source: "MET Norway",
    kind: kindFromSymbol(symbol),
    tempC: d.air_temperature,
    humidityPct: d.relative_humidity,
    precipMm: now.data.next_1_hours?.details?.precipitation_amount ?? 0,
    cloudCoverPct: d.cloud_area_fraction,
    windMs: d.wind_speed,
    isDay: !symbol.endsWith("_night"),
    observedAt: now.time as string,
    timezone: null as string | null,
  };
}

export async function GET(req: NextRequest) {
  const q = parseSiteQuery(req);
  if (q instanceof NextResponse) return q;
  const { lat, lon } = q;

  try {
    // 10-minute cache: "current" weather, but be kind to the free APIs
    const data = await cached(`weather:${lat},${lon}`, 10 * 60_000, async () => {
      try {
        return await openMeteo(lat, lon);
      } catch {
        return await metNo(lat, lon);
      }
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: `No weather source reachable: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
