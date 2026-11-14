"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { FieldLocation } from "@/lib/locations";
import { MONTHS } from "@/lib/locations";
import { useJson } from "@/lib/useJson";
import { declination, noonAltitude, dayOfYear } from "@/lib/sun";
import { MonthStrip, WetnessBar, RainSources, ClayBar, RatingGlyph } from "@/components/charts";
import AnalysisDrawer from "@/components/AnalysisDrawer";

const FieldScene = dynamic(() => import("@/components/scene/FieldScene"), {
  ssr: false,
  loading: () => (
    <div className="skeleton" style={{ position: "absolute", inset: 0 }} />
  ),
});

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function FieldPlate({ loc }: { loc: FieldLocation }) {
  const q = `lat=${loc.lat}&lon=${loc.lon}`;
  const climate = useJson<any>(`/api/climate?${q}`);
  const rain = useJson<any>(`/api/rain?${q}`);
  const soil = useJson<any>(`/api/soil?${q}`);
  const weather = useJson<any>(`/api/weather?${q}`);
  const terrain = useJson<any>(`/api/terrain?${q}&half=${loc.halfDeg}`);
  const fields = useJson<any>(`/api/fields?${q}&half=${loc.halfDeg}`);
  const status = useJson<any>(`/api/status`);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [azimuth, setAzimuth] = useState(42.6);

  const m = new Date().getMonth();
  const monthName = MONTH_NAMES[m];
  const doy = dayOfYear(new Date());
  const decl = declination(doy);
  const noonAlt = noonAltitude(loc.lat, decl);

  const horizons = soil.data?.soilgrids?.horizons ?? null;
  const topsoil = soil.data?.soilgrids?.topsoil ?? null;
  const isda = soil.data?.isda ?? null;

  const skyLabel = useMemo(() => {
    const w = weather.data;
    if (weather.loading) return "reading the sky…";
    if (!w) return "no live weather";
    return `${w.kind}${w.isDay ? "" : " · night"} · ${Math.round(w.tempC)}°C · ${w.source}`;
  }, [weather]);

  const num = (v: number | null | undefined, digits = 0) =>
    v == null ? "—" : v.toFixed(digits);

  const buildPayload = () => ({
    location: { name: loc.name, slug: loc.slug, lat: loc.lat, lon: loc.lon },
    month: monthName,
    climate_monthly_NASA_POWER: climate.data,
    annual_rain_sources: rain.data,
    soil_by_depth: soil.data,
    current_weather: weather.data,
    terrain: terrain.data
      ? {
          source: terrain.data.source,
          minElev: terrain.data.minElev,
          maxElev: terrain.data.maxElev,
          widthM: terrain.data.widthM,
        }
      : null,
    mapped_field_outlines: fields.data
      ? { source: fields.data.source, count: fields.data.count }
      : null,
  });

  /* ── source-line helper ─────────────────────────────────────── */
  const Src = ({ glyph, children }: { glyph: "low" | "single" | "nodata" | "ok"; children: React.ReactNode }) => (
    <div className="srcline" style={{ marginTop: 5 }}>
      <RatingGlyph kind={glyph} />
      <span>{children}</span>
    </div>
  );

  const Stat = ({
    label, value, unit, digits = 0, series, src,
  }: {
    label: string; value: number | null | undefined; unit: string;
    digits?: number; series: (number | null)[] | undefined; src: React.ReactNode;
  }) => (
    <div style={{ padding: "13px 0", borderBottom: "1px solid var(--rule)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          <div className={`bignum ${climate.loading ? "skeleton" : ""}`} style={{ marginTop: 2 }}>
            {num(value, digits)}
            <span className="unit">{unit}</span>
          </div>
        </div>
        {series ? <MonthStrip values={series} highlight={m} /> : null}
      </div>
      {src}
    </div>
  );

  const c = climate.data;

  return (
    <div className="plate">
      {/* ───────── header ───────── */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="kicker" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span style={{ fontSize: 15, letterSpacing: "0.02em", textTransform: "none", fontFamily: "var(--font-head)", fontWeight: 800 }}>
              Fallow
            </span>
            <span className="dim">FIELD PROFILE · PLATE {loc.plate} OF 2 · LIVE</span>
          </div>
          <h1 className="headline">
            {loc.name.replace(", Western Cape", "")}, Western Cape, {monthName}
          </h1>
          <p className="standfirst">
            One block of farmland, drawn live from open data: the terrain on top, the
            soil by depth on the cut faces, a long-term average {monthName} in the air
            above — and today&apos;s actual weather in the sky.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 6 }}>
          <Link href={`/field/${loc.slug === "overberg" ? "swartland" : "overberg"}`} className="btn" style={{ textDecoration: "none" }}>
            Plate {loc.plate === 1 ? 2 : 1} →
          </Link>
          <button className="btn btn-solid" onClick={() => setDrawerOpen(true)}>
            Rotation analysis
          </button>
        </div>
      </header>

      {/* ───────── main grid ───────── */}
      <div className="plate-grid" style={{ marginTop: 10 }}>
        {/* left column */}
        <div>
          <div className="panel-title">The air above · {monthName}</div>
          {climate.error && <div className="nodata-chip">NASA POWER unreachable</div>}
          <Stat
            label="Rain" value={c?.rainMm?.[m]} unit="mm" series={c?.rainMm}
            src={<Src glyph="single">NASA POWER (MERRA-2) · see rain sources</Src>}
          />
          <Stat
            label="Air temperature" value={c?.airTempC?.[m]} unit="°C" digits={1} series={c?.airTempC}
            src={<Src glyph="single">NASA POWER (MERRA-2) · single model source</Src>}
          />
          <Stat
            label="Humidity" value={c?.humidityPct?.[m]} unit="%" digits={1} series={c?.humidityPct}
            src={<Src glyph="single">NASA POWER (MERRA-2) · single model source</Src>}
          />
          <Stat
            label="Land evaporation" value={c?.evaporationMm?.[m]} unit="mm" series={c?.evaporationMm}
            src={<Src glyph="single">NASA POWER (MERRA-2) · single model source</Src>}
          />

          <div className="panel-title" style={{ marginTop: 28 }}>In the soil · {monthName}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            Soil wetness <span style={{ fontWeight: 400, color: "var(--ink-soft)", fontSize: 12.5 }}>percent of full wetness</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <WetnessBar pct={c ? c.soilWetness.surface[m] * 100 : null} label="surface" />
            <WetnessBar pct={c ? c.soilWetness.rootZone[m] * 100 : null} label="root zone" />
            <WetnessBar pct={c ? c.soilWetness.profile[m] * 100 : null} label="profile" />
            <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, paddingBottom: 20 }}>
              modelled,<br />not measured<br />soil moisture
            </div>
          </div>
          <Src glyph="single">NASA POWER (MERRA-2) · single model source</Src>
        </div>

        {/* centre: the 3D block */}
        <div>
          <div className="canvas-wrap">
            {terrain.data && (
              <FieldScene
                terrain={terrain.data}
                horizons={horizons}
                weather={weather.data}
                fields={fields.data?.outlines ?? []}
                soilLight={loc.soilLight}
                soilDark={loc.soilDark}
                lat={loc.lat}
                lon={loc.lon}
                onAzimuth={setAzimuth}
              />
            )}
            {terrain.loading && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
            {terrain.error && (
              <div className="nodata-chip" style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)" }}>
                terrain tiles unreachable
              </div>
            )}

            {/* live sky chip */}
            <div
              className="srcline"
              style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 99, background: weather.data ? "#51633a" : "var(--ink-faint)", display: "inline-block" }} />
              live sky · {skyLabel}
            </div>

            {/* compass */}
            <div style={{ position: "absolute", left: 10, bottom: 26, textAlign: "center", pointerEvents: "none" }}>
              <svg width="46" height="46" viewBox="-23 -23 46 46" style={{ transform: `rotate(${azimuth}deg)` }}>
                <circle r="16" fill="none" stroke="var(--ink)" strokeWidth="1.3" />
                <path d="M 0 -15 L 4 6 L 0 2 L -4 6 Z" fill="var(--ink)" />
                <text y="-17.5" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="var(--ink)">N</text>
              </svg>
              <div className="srcline" style={{ justifyContent: "center" }}>north: the sun side</div>
            </div>

            <div className="hint">drag to turn · pinch or scroll to zoom</div>
          </div>
        </div>

        {/* right column */}
        <div className="col-right">
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>
              Computed sun position at solar noon, today
            </div>
            <div className="bignum" style={{ marginTop: 4 }}>
              {noonAlt.toFixed(1)}°
              <span className="unit">above the {loc.lat > decl ? "southern" : "northern"} horizon</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4, lineHeight: 1.5 }}>
              Astronomy for latitude {Math.abs(loc.lat).toFixed(2)}° {loc.lat < 0 ? "S" : "N"},
              declination {decl >= 0 ? "+" : ""}{decl.toFixed(1)}°. Computed, not a measurement.
              The sun in the scene sits where it really is right now.
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 7 }}>Vegetation greenness (NDVI)</div>
            <div className="nodata-chip">
              <RatingGlyph kind="nodata" /> no data in this version
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Terrain and field outlines</div>
            <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.6 }}>
              <span className={`mono ${terrain.loading ? "skeleton" : ""}`} style={{ fontWeight: 700 }}>
                {terrain.data ? `${terrain.data.minElev.toFixed(1)}–${terrain.data.maxElev.toFixed(1)} m` : "———"}
              </span>{" "}
              above sea level, contours every 20 m
              <br />
              <span className={`mono ${fields.loading ? "skeleton" : ""}`} style={{ fontWeight: 700 }}>
                {fields.data ? fields.data.count : "——"}
              </span>{" "}
              mapped parcels drawn on the surface
            </div>
            <Src glyph="single">AWS terrain tiles · not a survey</Src>
            <Src glyph="single">OpenStreetMap farmland · community-mapped, not complete</Src>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="panel-title">The soil by depth · six horizons</div>
            {soil.error && <div className="nodata-chip">SoilGrids unreachable</div>}
            {(horizons ?? Array.from({ length: 6 }, () => null)).map((h: any, i: number) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--rule)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, width: 86, whiteSpace: "nowrap", flex: "none" }}>
                    {["0–5 cm", "5–15 cm", "15–30 cm", "30–60 cm", "60–100 cm", "100–200 cm"][i]}
                  </span>
                  <ClayBar pct={h?.clayPct ?? null} />
                  <span className="mono" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
                    clay <b>{h ? num(h.clayPct, 1) : "——"} %</b>
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
                    sand <b>{h ? num(h.sandPct, 1) : "——"} %</b>
                  </span>
                  <span className="mono" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
                    pH <b>{h ? num(h.ph, 1) : "—"}</b>
                  </span>
                </div>
                <Src glyph="low">ISRIC SoilGrids · modelled 250 m · low: first look</Src>
              </div>
            ))}
            <div className="srcline" style={{ marginTop: 8 }}>clay bar scale 0 to 40 %</div>
          </div>
        </div>
      </div>

      {/* ───────── bottom row ───────── */}
      <div className="plate-bottom">
        <div>
          <div className="panel-title">Annual rain · four sources · mm</div>
          {rain.loading && <div className="skeleton" style={{ height: 120 }} />}
          {rain.data && (
            <>
              <RainSources sources={rain.data.sources} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 8 }}>
                <div className="srcline">* derived from the same ECMWF reanalysis, not independent</div>
                {rain.data.spreadMm != null && (
                  <div className="mono" style={{ fontSize: 11.5, textAlign: "right", flex: "none" }}>
                    spread <b>{rain.data.spreadMm} mm</b>
                    <br />
                    <span style={{ color: "var(--ink-soft)" }}>
                      {rain.data.spreadPctOfFirst} % of POWER (computed)
                    </span>
                  </div>
                )}
              </div>
              <div className="srcline" style={{ marginTop: 4 }}>{rain.data.period} mean · where sources disagree, trust moves</div>
            </>
          )}
        </div>

        <div>
          <div className="panel-title">Topsoil · two soil maps</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <thead>
              <tr>
                {["", "clay %", "sand %", "pH"].map((hd) => (
                  <th key={hd} style={{ textAlign: "left", fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-soft)", paddingBottom: 6, fontWeight: 500 }}>
                    {hd}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--rule)" }}>
                <td style={{ padding: "6px 8px 6px 0", fontWeight: 700 }}>SoilGrids</td>
                <td>{topsoil ? topsoil.clayPct.toFixed(1) : "——"}</td>
                <td>{topsoil ? topsoil.sandPct.toFixed(1) : "——"}</td>
                <td>{topsoil ? topsoil.ph.toFixed(1) : "—"}</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--rule)" }}>
                <td style={{ padding: "6px 8px 6px 0", fontWeight: 700 }}>iSDA</td>
                {isda?.configured && isda?.clayPct != null ? (
                  <>
                    <td>{isda.clayPct.toFixed(1)}</td>
                    <td>{isda.sandPct?.toFixed(1) ?? "—"}</td>
                    <td>{isda.ph?.toFixed(1) ?? "—"}</td>
                  </>
                ) : (
                  <td colSpan={3}>
                    <span className="nodata-chip" style={{ padding: "3px 8px" }}>
                      {isda?.configured ? "iSDA unreachable" : "needs key in .env"}
                    </span>
                  </td>
                )}
              </tr>
              {topsoil && isda?.clayPct != null && (
                <tr style={{ borderTop: "1px solid var(--rule)", color: "var(--ink-soft)" }}>
                  <td style={{ padding: "6px 8px 6px 0" }}>difference</td>
                  <td>{Math.abs(topsoil.clayPct - isda.clayPct).toFixed(1)}</td>
                  <td>{isda.sandPct != null ? Math.abs(topsoil.sandPct - isda.sandPct).toFixed(1) : "—"}</td>
                  <td>{isda.ph != null ? Math.abs(topsoil.ph - isda.ph).toFixed(1) : "—"}</td>
                </tr>
              )}
            </tbody>
          </table>
          {topsoil && isda?.clayPct != null &&
            (Math.abs(topsoil.clayPct - isda.clayPct) >= 10 ||
              (isda.sandPct != null && Math.abs(topsoil.sandPct - isda.sandPct) >= 10)) && (
              <div className="srcline" style={{ marginTop: 8, color: "var(--alert)" }}>
                <RatingGlyph kind="low" /> two models disagree (10+ points apart)
              </div>
            )}
          <div className="srcline" style={{ marginTop: 8 }}>two models, neither measured</div>
        </div>

        <div>
          <div className="panel-title">Legend</div>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              ["ok", `${monthName}, in the 12-month strips`],
              ["single", "not rated: single model source"],
              ["low", "low: first look"],
              ["nodata", "no data / needs a key"],
            ].map(([g, t]) => (
              <div className="srcline" key={t as string}>
                <RatingGlyph kind={g as any} /> {t}
              </div>
            ))}
            <div className="srcline">darker clay bar = more clay · scale 0–40 %</div>
            <div className="srcline">field outline · 20 m contour on the block</div>
          </div>
        </div>

        <div>
          <div className="panel-title">Read this first</div>
          <ul style={{ listStyle: "none", display: "grid", gap: 7, fontSize: 13.5, fontWeight: 600 }}>
            <li>■ Model values, not measurements.</li>
            <li>■ Horizon depths not to scale.</li>
            <li>■ Terrain height exaggerated ×5.</li>
            <li style={{ fontWeight: 400, color: "var(--ink-soft)", lineHeight: 1.55 }}>
              The sky over the block is today&apos;s actual weather at this point.
              Relief light follows the real sun. One model value can cover many farms.
            </li>
          </ul>
        </div>
      </div>

      <footer style={{ marginTop: 30, paddingTop: 14, borderTop: "1.5px solid var(--rule-strong)" }}>
        <div className="srcline" style={{ display: "block", lineHeight: 1.8 }}>
          Data: NASA POWER (MERRA-2), ISRIC SoilGrids, AWS Terrain Tiles, Open-Meteo /
          MET Norway (live sky), OpenStreetMap via Overpass (field outlines), ERA5
          {status.data?.isda ? ", iSDA" : ""}{status.data?.meteomatics ? ", Meteomatics" : ""}.
          Drawn by code from live API responses; AI-assisted build. Analysis drawer is
          AI-generated and labelled as such. Not affiliated with or endorsed by NASA.
          · NASA Space Apps Challenge 2026 · Field Shift
        </div>
      </footer>

      <AnalysisDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        geminiConfigured={status.data ? status.data.gemini : null}
        buildPayload={buildPayload}
      />
    </div>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r="10" fill="var(--green-deep)" />
      <path d="M11 1 a10 10 0 0 1 0 20 z" fill="var(--paper)" opacity="0.9" />
      <rect x="9.8" y="4" width="2.4" height="14" fill="var(--paper)" />
    </svg>
  );
}
