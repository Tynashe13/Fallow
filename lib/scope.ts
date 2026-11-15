import { LOCATIONS, type FieldLocation } from "@/lib/locations";
import { distanceKm } from "@/lib/ledger/derive";

/** The scope ladder. The tier is always named in the UI. */
export type TierId = "full" | "south-africa" | "anywhere";

export interface Tier { id: TierId; step: string; name: string; covers: string; gives: string }

export const TIERS: Tier[] = [
  { id: "full", step: "Full", name: "Full profile", covers: "Overberg and Swartland",
    gives: "The plate, the rotation analysis in four parts and the full ledger." },
  { id: "south-africa", step: "Coarse", name: "Other South Africa", covers: "Anywhere else in South Africa",
    gives: "Coarse rain, soil and terrain only where data has been baked in. None has been baked in this build, and the page says so." },
  { id: "anywhere", step: "Method only", name: "Anywhere", covers: "The rest of the world",
    gives: "The method applies, but no data is baked in. The rotation panel declines and names the one document it would need." },
];

/** A rough box around South Africa. Our approximation for choosing a tier, not a border. */
const SA_BOX = { south: -35, north: -22, west: 16.3, east: 33 };
const SITE_TOLERANCE_DEG = 0.25;

export interface Resolved { tier: Tier; site: FieldLocation | null; nearest: FieldLocation; nearestKm: number }

export function resolvePlace(lat: number, lon: number): Resolved {
  const ranked = LOCATIONS.map((l) => ({ l, km: distanceKm(lat, lon, l.lat, l.lon) })).sort((a, b) => a.km - b.km);
  const nearest = ranked[0];
  const site = LOCATIONS.find((l) => Math.abs(l.lat - lat) <= SITE_TOLERANCE_DEG && Math.abs(l.lon - lon) <= SITE_TOLERANCE_DEG) ?? null;
  const inSA = lat >= SA_BOX.south && lat <= SA_BOX.north && lon >= SA_BOX.west && lon <= SA_BOX.east;
  const tier = TIERS[site ? 0 : inSA ? 1 : 2];
  return { tier, site, nearest: nearest.l, nearestKm: nearest.km };
}

/** Parse "lat, lon" typed by a person. Returns null unless both are valid numbers in range. */
export function parseLatLon(text: string): { lat: number; lon: number } | null {
  const m = text.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]), lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}
