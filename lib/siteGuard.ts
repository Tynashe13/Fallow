import { NextRequest, NextResponse } from "next/server";
import { LOCATIONS, type FieldLocation } from "@/lib/locations";

/** How far (degrees) a requested lat/lon may sit from a known site. */
const TOLERANCE_DEG = 0.01;
/** Largest terrain/field block half-size the API will fetch, degrees. */
export const MAX_HALF_DEG = 0.1;
const MIN_HALF_DEG = 0.005;

export type SiteQuery = {
  site: FieldLocation;
  /** the site's own coordinates, so upstream calls and cache keys stay fixed */
  lat: number;
  lon: number;
  half: number;
};

/**
 * Accept only lat/lon that match a site in lib/locations.ts, and clamp
 * `half`. Returns the parsed query, or a 400 response to send back.
 */
export function parseSiteQuery(req: NextRequest): SiteQuery | NextResponse {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!sp.get("lat") || !sp.get("lon") || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }
  const site = LOCATIONS.find(
    (l) => Math.abs(l.lat - lat) <= TOLERANCE_DEG && Math.abs(l.lon - lon) <= TOLERANCE_DEG
  );
  if (!site) {
    return NextResponse.json(
      { error: "lat/lon must match one of the app's field sites" },
      { status: 400 }
    );
  }
  const rawHalf = Number(sp.get("half") ?? site.halfDeg);
  const half = Number.isFinite(rawHalf)
    ? Math.min(MAX_HALF_DEG, Math.max(MIN_HALF_DEG, rawHalf))
    : site.halfDeg;
  return { site, lat: site.lat, lon: site.lon, half: Math.round(half * 1000) / 1000 };
}
