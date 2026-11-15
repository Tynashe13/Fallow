import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/plate/glyphs";
import { TIERS, resolvePlace } from "@/lib/scope";
import { Calc, Struct } from "@/components/led";
import { sitePrefix } from "@/lib/ledger";

export const metadata: Metadata = { title: "A place outside the two sites" };

function parse(v: string | string[] | undefined, max: number): number | null {
  if (typeof v !== "string" || !/^-?\d{1,3}(\.\d{1,6})?$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null;
}

export default function PlacePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const lat = parse(searchParams.lat, 90), lon = parse(searchParams.lon, 180);
  const rawName = typeof searchParams.name === "string" ? searchParams.name : "";
  // Letters, spaces and a few marks only; anything else falls back to a neutral name.
  const name = /^[\p{L} .'-]{1,40}$/u.test(rawName) ? rawName : "This point";

  if (lat === null || lon === null) {
    return (
      <div className="landing narrow">
        <header className="land-head"><Link className="brandmark" href="/"><Logo className="logo" /><span>Fallow</span></Link></header>
        <main id="main-content" tabIndex={-1}>
          <h1>That point could not be read</h1>
          <p className="lede">A place needs a latitude between -90 and 90 and a longitude between -180 and 180.</p>
          <p><Link className="btn btn-solid" href="/">Back to the globe</Link></p>
        </main>
      </div>
    );
  }

  const r = resolvePlace(lat, lon);
  const np = sitePrefix(r.nearest.slug);
  const from = [`${np}_lat`, `${np}_lon`, "geo_km_per_deg"];
  const doc = r.tier.id === "south-africa"
    ? "the ARC-SGI production guideline for the grain region this place falls in"
    : "a regional crop production guideline for this place, from its national agricultural research body";

  return (
    <div className="landing narrow">
      <header className="land-head">
        <Link className="brandmark" href="/"><Logo className="logo" /><span>Fallow</span></Link>
        <nav aria-label="Main"><Link href="/">Globe</Link><Link href="/ledger">Ledger</Link></nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <p className="scope" aria-label="Scope tier">
          {TIERS.map((t) => <span key={t.id} className={t.id === r.tier.id ? "on" : ""} aria-current={t.id === r.tier.id ? "true" : undefined}>{t.step}</span>)}
        </p>
        <h1>{name}</h1>
        <p className="lede">
          <Struct why="coordinates entered by the visitor or taken from the hand-typed place list">{lat.toFixed(2)}, {lon.toFixed(2)}</Struct>. Scope tier: <b>{r.tier.name}</b>.
        </p>

        <section className="land-sec">
          <h2>No baked data for this place</h2>
          <p>
            {r.tier.gives} Fallow does not fetch or estimate values for places it has not packaged, so there is no rain, soil or terrain figure to show here.
          </p>
          <h2>The rotation panel declines</h2>
          <p>
            A rotation comparison needs local agronomy: sowing windows, water use, disease carry-over. Fallow has none for this place and will not borrow the
            Western Cape figures. The one document that would be needed first: <b>{doc}</b>.
          </p>
          <h2>Nearest full profile</h2>
          <p>
            <Calc from={from}>{r.nearest.name} is about {r.nearestKm.toLocaleString("en-GB")} km away</Calc> (straight line, computed from the coordinates). Its
            figures describe that block only and should not be read as describing this place.
          </p>
          <p className="actions">
            <Link className="btn btn-solid" href={`/field/${r.nearest.slug}`}>Open the {r.nearest.name} profile</Link>
            <Link className="btn" href="/">Back to the globe</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
