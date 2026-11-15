import { fetchRetry } from "@/lib/fetchRetry";
import { NextRequest, NextResponse } from "next/server";
import { parseSiteQuery } from "@/lib/siteGuard";
import { cached, DAY } from "@/lib/cache";
import { MONTHS, DAYS_IN_MONTH } from "@/lib/locations";

export const dynamic = "force-dynamic";

/**
 * Long-term monthly climatology from NASA POWER (MERRA-2 reanalysis).
 * Free, keyless, global. https://power.larc.nasa.gov/docs/
 */
export async function GET(req: NextRequest) {
  const q = parseSiteQuery(req);
  if (q instanceof NextResponse) return q;
  const { lat, lon } = q;

  try {
    const data = await cached(`climate:${lat},${lon}`, 7 * DAY, async () => {
      const params =
        "T2M,RH2M,EVLAND,PRECTOTCORR,GWETTOP,GWETROOT,GWETPROF";
      const url =
        `https://power.larc.nasa.gov/api/temporal/climatology/point` +
        `?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&format=JSON`;
      const res = await fetchRetry(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`POWER ${res.status}`);
      const json = await res.json();
      const p = json?.properties?.parameter;
      if (!p) throw new Error("POWER: missing parameters");

      const monthly = (name: string, perDayToMonth = false) =>
        MONTHS.map((m, i) => {
          const v = p[name]?.[m];
          if (v == null || v === -999) return null;
          return perDayToMonth ? v * DAYS_IN_MONTH[i] : v;
        });

      return {
        source: "NASA POWER (MERRA-2)",
        climatologyRange: json?.header?.range ?? null,
        elevation_m: json?.geometry?.coordinates?.[2] ?? null,
        airTempC: monthly("T2M"),
        humidityPct: monthly("RH2M"),
        evaporationMm: monthly("EVLAND", true), // mm/day → mm/month
        rainMm: monthly("PRECTOTCORR", true), // mm/day → mm/month
        soilWetness: {
          surface: monthly("GWETTOP"),
          rootZone: monthly("GWETROOT"),
          profile: monthly("GWETPROF"),
        },
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: `NASA POWER unavailable: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
