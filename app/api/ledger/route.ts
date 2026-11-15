import { NextRequest, NextResponse } from "next/server";
import { parseSiteQuery } from "@/lib/siteGuard";
import { cached, DAY } from "@/lib/cache";
import { rainSummary, rowsFor, soilCompare, sunNoon, verdict } from "@/lib/ledger";

export const dynamic = "force-dynamic";

/** The fact ledger for one of the two sites, as JSON. Baked data only: this
 *  route makes no outbound request. lat/lon must match a site (lib/siteGuard). */
export async function GET(req: NextRequest) {
  const q = parseSiteQuery(req);
  if (q instanceof NextResponse) return q;
  const site = q.site.slug;
  const data = await cached(`ledger:${site}`, DAY, async () => ({
    site,
    generated: "baked; see each row's date",
    rows: rowsFor(site),
    computed: { rain: rainSummary(site), topsoil: soilCompare(site), sun: sunNoon(site), verdict: verdict() },
  }));
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=3600" } });
}
