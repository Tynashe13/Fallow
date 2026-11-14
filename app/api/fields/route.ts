import { NextRequest, NextResponse } from "next/server";
import { cached, DAY } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * Field / farmland outlines inside the block, from OpenStreetMap via
 * the Overpass API. Community-mapped — coverage varies by area, and
 * that honesty is shown in the UI ("n mapped parcels", not "all").
 */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const half = Number(req.nextUrl.searchParams.get("half") ?? "0.055");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  try {
    const data = await cached(`fields:${lat},${lon},${half}`, 30 * DAY, async () => {
      const s = lat - half, w = lon - half, n = lat + half, e = lon + half;
      const query = `
[out:json][timeout:25];
(
  way["landuse"~"^(farmland|meadow|orchard|vineyard)$"](${s},${w},${n},${e});
);
out geom 400;`;
      const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
      ];
      let json: any = null;
      let lastErr: unknown = null;
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            body: "data=" + encodeURIComponent(query),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            cache: "no-store",
            signal: AbortSignal.timeout(20_000),
          });
          if (!res.ok) throw new Error(`overpass ${res.status}`);
          json = await res.json();
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!json) throw lastErr ?? new Error("overpass unreachable");
      const outlines = (json?.elements ?? [])
        .filter((el: any) => el.type === "way" && el.geometry?.length > 3)
        .map((el: any) => ({
          landuse: el.tags?.landuse ?? "farmland",
          ring: el.geometry.map((g: any) => [g.lon, g.lat] as [number, number]),
        }));
      return {
        source: "OpenStreetMap via Overpass · community-mapped, not complete",
        count: outlines.length,
        outlines,
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: `Field outlines unavailable: ${(e as Error).message}`, outlines: [], count: 0 },
      { status: 200 } // non-fatal: the plate renders without outlines
    );
  }
}
