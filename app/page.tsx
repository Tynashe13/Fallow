import Link from "next/link";
import { LOCATIONS } from "@/lib/locations";

export default function Home() {
  return (
    <main className="plate" style={{ maxWidth: 1100 }}>
      <header style={{ padding: "48px 0 8px" }}>
        <div className="kicker" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 22 22" aria-hidden>
            <circle cx="11" cy="11" r="10" fill="var(--green-deep)" />
            <path d="M11 1 a10 10 0 0 1 0 20 z" fill="var(--paper)" opacity="0.9" />
            <rect x="9.8" y="4" width="2.4" height="14" fill="var(--paper)" />
          </svg>
          <span className="dim">NASA SPACE APPS CHALLENGE 2026 · FIELD SHIFT</span>
        </div>
        <h1 className="headline" style={{ fontSize: "clamp(44px, 7vw, 84px)" }}>
          Fallow
        </h1>
        <p className="standfirst" style={{ fontSize: 17, maxWidth: "58ch" }}>
          One block of farmland, drawn live from open data: the terrain on top, the soil
          by depth on the cut faces, a long-term average month in the air above — and
          today&apos;s real weather in the sky. Every number names its source; where
          sources disagree, the plate says so.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 28 }}>
        {LOCATIONS.map((l) => (
          <Link
            key={l.slug}
            href={`/field/${l.slug}`}
            style={{
              textDecoration: "none",
              border: "1.5px solid var(--rule-strong)",
              padding: "22px 24px 26px",
              background: "var(--paper)",
              display: "block",
            }}
          >
            <div className="kicker dim">PLATE {l.plate} OF 2</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 30, margin: "8px 0 4px" }}>
              {l.name.replace(", Western Cape", "")}
            </div>
            <div className="srcline" style={{ marginBottom: 10 }}>{l.region}</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)" }}>{l.blurb}</p>
            <div
              style={{
                marginTop: 16, height: 10,
                background: `linear-gradient(90deg, #7b8f55 0%, #8da064 45%, ${l.soilLight} 45.2%, ${l.soilDark} 100%)`,
              }}
            />
            <div className="btn" style={{ marginTop: 18, display: "inline-block" }}>
              Open the plate →
            </div>
          </Link>
        ))}
      </div>

      <footer style={{ margin: "48px 0 30px" }}>
        <div className="srcline" style={{ display: "block", lineHeight: 1.8 }}>
          Data: NASA POWER (MERRA-2), ISRIC SoilGrids, AWS Terrain Tiles, Open-Meteo /
          MET Norway, OpenStreetMap, ERA5. Optional with keys: Google Gemini analysis,
          iSDA soil, Meteomatics rain. Model values, not measurements. AI-assisted
          build. Not affiliated with or endorsed by NASA.
        </div>
      </footer>
    </main>
  );
}
