"use client";

/** Small SVG chart atoms in the plate's visual language. */

const GREEN_BAR = "#d9dfbc";
const GREEN_DEEP = "#51633a";
const INK = "#3d2733";

/** 12 thin bars, one month highlighted — like the strips on the plates. */
export function MonthStrip({
  values,
  highlight,
  width = 118,
  height = 30,
}: {
  values: (number | null)[];
  highlight: number;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...values.map((v) => v ?? 0), 0.001);
  const bw = width / 12;
  return (
    <svg width={width} height={height + 7} aria-hidden>
      {values.map((v, i) => {
        const h = Math.max(2, ((v ?? 0) / max) * height);
        return (
          <rect
            key={i}
            x={i * bw + 1}
            y={height - h}
            width={bw - 2}
            height={h}
            fill={i === highlight ? GREEN_DEEP : GREEN_BAR}
          />
        );
      })}
      <path
        d={`M ${highlight * bw + bw / 2 - 3.2} ${height + 6} l 3.2 -4.5 l 3.2 4.5 z`}
        fill={INK}
      />
    </svg>
  );
}

/** Vertical 0–100 % bar for soil wetness. */
export function WetnessBar({
  pct,
  label,
}: {
  pct: number | null;
  label: string;
}) {
  const H = 108, W = 34;
  const fill = pct == null ? 0 : (pct / 100) * H;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
        {pct == null ? "—" : `${Math.round(pct)}`}
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--ink-soft)" }}>%</span>
      </div>
      <svg width={W} height={H} aria-hidden>
        <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} fill="none" stroke={INK} strokeWidth={1.5} />
        <rect x={2} y={H - fill - 1} width={W - 4} height={fill} fill={GREEN_DEEP} opacity={0.85} />
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={W - 6} x2={W - 1} y1={H * f} y2={H * f} stroke={INK} strokeWidth={1} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{label}</div>
    </div>
  );
}

/** Annual-rain comparison bars with value labels. */
export function RainSources({
  sources,
}: {
  sources: { label: string; mm: number | null; note: string; independent: boolean }[];
}) {
  const vals = sources.map((s) => s.mm ?? 0);
  const max = Math.max(...vals, 1);
  const H = 120;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
      {sources.map((s, i) => {
        const h = s.mm == null ? 0 : Math.max(16, (s.mm / max) * H);
        return (
          <div
            key={s.label}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
          >
            {s.mm == null ? (
              <div
                style={{
                  width: "100%", height: 46,
                  border: "1.5px dashed var(--rule-strong)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="mono" style={{ fontSize: 8.5, letterSpacing: "0.08em", color: "var(--ink-soft)", textAlign: "center", padding: "0 3px" }}>
                  {s.note.includes("key") ? "NEEDS KEY" : "NO DATA"}
                </span>
              </div>
            ) : (
              <div
                style={{
                  width: "100%", height: h,
                  background: i === 0 ? GREEN_DEEP : GREEN_BAR,
                  border: `1.5px solid ${INK}`,
                  display: "flex", alignItems: "flex-start", justifyContent: "center",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11, fontWeight: 700, paddingTop: 3,
                    color: i === 0 ? "var(--paper)" : INK,
                  }}
                >
                  {s.mm}
                </span>
              </div>
            )}
            <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.25 }}>
              {s.label}
              {!s.independent && "*"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal clay bar, fixed 0–40 % scale like the plates. */
export function ClayBar({ pct, scaleMax = 40, width = 120 }: { pct: number | null; scaleMax?: number; width?: number }) {
  const f = pct == null ? 0 : Math.min(1, pct / scaleMax);
  return (
    <svg width={width} height={13} aria-hidden>
      <rect x={0.75} y={0.75} width={width - 1.5} height={11.5} fill="var(--paper)" stroke={INK} strokeWidth={1.2} />
      <rect x={1.5} y={1.5} width={(width - 3) * f} height={10} fill="#8d6558" />
    </svg>
  );
}

/** Source-rating glyphs from the legend. */
export function RatingGlyph({ kind }: { kind: "low" | "single" | "nodata" | "ok" }) {
  if (kind === "low")
    return (
      <svg className="glyph" viewBox="0 0 12 12" aria-hidden>
        <circle cx="6" cy="6" r="4.6" fill="none" stroke="#b3433b" strokeWidth="1.6" />
        <line x1="2.9" y1="9.1" x2="9.1" y2="2.9" stroke="#b3433b" strokeWidth="1.6" />
      </svg>
    );
  if (kind === "single")
    return (
      <svg className="glyph" viewBox="0 0 12 12" aria-hidden>
        <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  if (kind === "ok")
    return (
      <svg className="glyph" viewBox="0 0 12 12" aria-hidden>
        <rect x="1.5" y="1.5" width="9" height="9" fill="#51633a" />
      </svg>
    );
  return (
    <svg className="glyph" viewBox="0 0 12 12" aria-hidden>
      <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
    </svg>
  );
}
