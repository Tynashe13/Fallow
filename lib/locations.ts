import { num, sitePrefix, SITE_IDS, SITE_NAME, SITE_ROLE } from "@/lib/ledger/rows";
import type { SiteId } from "@/lib/ledger/types";

export interface FieldLocation {
  slug: SiteId;
  name: string;
  role: string;
  plate: number;
  lat: number;
  lon: number;
  /** half-size of a request window around the site, degrees (used by the API guard) */
  halfDeg: number;
}

/** The two sites with full baked data. Coordinates come from the ledger. */
export const LOCATIONS: FieldLocation[] = SITE_IDS.map((slug, i) => ({
  slug,
  name: SITE_NAME[slug],
  role: SITE_ROLE[slug],
  plate: i + 1,
  lat: num(`${sitePrefix(slug)}_lat`),
  lon: num(`${sitePrefix(slug)}_lon`),
  halfDeg: 0.055,
}));

export function getLocation(slug: string): FieldLocation | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}
