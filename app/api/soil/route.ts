import { fetchRetry } from "@/lib/fetchRetry";
import { NextRequest, NextResponse } from "next/server";
import { parseSiteQuery } from "@/lib/siteGuard";
import { cached, DAY } from "@/lib/cache";
import { SOIL_DEPTHS } from "@/lib/locations";

export const dynamic = "force-dynamic";

/**
 * Soil by depth. Primary: ISRIC SoilGrids 2.0 (free, keyless, 250 m,
 * machine-learning soil map — modelled, not measured). Second opinion
 * for the topsoil: iSDA Africa (30 m, Africa only, needs credentials).
 */

interface Horizon {
  depth: string;
  clayPct: number | null;
  sandPct: number | null;
  ph: number | null;
}

async function soilgrids(lat: number, lon: number) {
  const depths = SOIL_DEPTHS.map((d) => `depth=${d}`).join("&");
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query` +
    `?lon=${lon}&lat=${lat}&property=clay&property=sand&property=phh2o` +
    `&${depths}&value=mean&value=uncertainty`;
  const res = await fetchRetry(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`SoilGrids ${res.status}`);
  const json = await res.json();
  const layers: any[] = json?.properties?.layers ?? [];

  const get = (prop: string, depth: string): number | null => {
    const layer = layers.find((l) => l.name === prop);
    const d = layer?.depths?.find((x: any) => x.label === depth);
    const mean = d?.values?.mean;
    if (mean == null) return null;
    return mean / (layer?.unit_measure?.d_factor ?? 10);
  };

  const horizons: Horizon[] = SOIL_DEPTHS.map((depth) => ({
    depth,
    clayPct: get("clay", depth),
    sandPct: get("sand", depth),
    ph: get("phh2o", depth),
  }));

  return horizons;
}

/** iSDA Africa: median of topsoil (0–20 cm) predictions near the point. */
async function isdaTopsoil(lat: number, lon: number) {
  const user = process.env.ISDA_USERNAME;
  const pass = process.env.ISDA_PASSWORD;
  if (!user || !pass) return { configured: false as const };

  const loginRes = await fetch("https://api.isda-africa.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: user, password: pass }),
    cache: "no-store",
  });
  if (!loginRes.ok) throw new Error(`iSDA login ${loginRes.status}`);
  const { access_token } = await loginRes.json();

  // sample a few points ~500 m apart around the field centre → median
  const offsets = [
    [0, 0], [0.005, 0], [-0.005, 0], [0, 0.005], [0, -0.005], [0.005, 0.005],
  ];
  const props = ["clay_content", "sand_content", "ph"] as const;
  const samples: Record<string, number[]> = { clay: [], sand: [], ph: [] };

  await Promise.all(
    offsets.map(async ([dy, dx]) => {
      const url =
        `https://api.isda-africa.com/isdasoil/v2/soilproperty` +
        `?lat=${lat + dy}&lon=${lon + dx}&depth=0-20`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${access_token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      const p = json?.property ?? {};
      const read = (name: (typeof props)[number]) =>
        p[name]?.[0]?.value?.value;
      const clay = read("clay_content");
      const sand = read("sand_content");
      const ph = read("ph");
      if (clay != null) samples.clay.push(clay);
      if (sand != null) samples.sand.push(sand);
      if (ph != null) samples.ph.push(ph / 10);
    })
  );

  const median = (a: number[]) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  };

  return {
    configured: true as const,
    n: samples.clay.length,
    clayPct: median(samples.clay),
    sandPct: median(samples.sand),
    ph: median(samples.ph),
  };
}

export async function GET(req: NextRequest) {
  const q = parseSiteQuery(req);
  if (q instanceof NextResponse) return q;
  const { lat, lon } = q;

  const data = await cached(`soil:${lat},${lon}`, 30 * DAY, async () => {
    const [sg, isda] = await Promise.allSettled([
      soilgrids(lat, lon),
      isdaTopsoil(lat, lon),
    ]);

    const horizons = sg.status === "fulfilled" ? sg.value : null;

    // SoilGrids topsoil (0–20 cm-ish) = weighted mean of the top 3 layers
    let topsoil: { clayPct: number; sandPct: number; ph: number } | null = null;
    if (horizons) {
      const w = [5, 10, 15]; // layer thickness in the 0–30 band
      const agg = (sel: (h: Horizon) => number | null) => {
        let s = 0, wsum = 0;
        horizons.slice(0, 3).forEach((h, i) => {
          const v = sel(h);
          if (v != null) { s += v * w[i]; wsum += w[i]; }
        });
        return wsum ? Math.round((s / wsum) * 10) / 10 : null;
      };
      const clay = agg((h) => h.clayPct);
      const sand = agg((h) => h.sandPct);
      const ph = agg((h) => h.ph);
      if (clay != null && sand != null && ph != null)
        topsoil = { clayPct: clay, sandPct: sand, ph };
    }

    return {
      soilgrids: {
        source: "ISRIC SoilGrids 2.0 · 250 m · modelled",
        horizons,
        topsoil,
        error: sg.status === "rejected" ? String(sg.reason?.message ?? sg.reason) : null,
      },
      isda:
        isda.status === "fulfilled"
          ? isda.value
          : { configured: true, error: String(isda.reason?.message ?? isda.reason) },
    };
  });

  return NextResponse.json(data);
}
