"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export interface Layer {
  /** Depth label, for example "0–5". */
  depth: string;
  /** Marker position over the image, in percent of its width and height. */
  x: number;
  y: number;
  /** Ledger values for this horizon, rendered on the server. */
  panel: ReactNode;
}

/** Six markers over the baked block image, one per soil horizon, and a small
 *  inspector. The image itself never moves: no camera, no WebGL. */
export default function SoilHotspots({ layers }: { layers: Layer[] }) {
  const [sel, setSel] = useState<number | null>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();

  function close() {
    const i = sel;
    setSel(null);
    if (i !== null) btns.current[i]?.focus();
  }

  return (
    <div
      className="hotspots"
      onKeyDown={(e) => {
        if (e.key === "Escape" && sel !== null) { e.stopPropagation(); e.preventDefault(); close(); }
      }}
    >
      <ul className="hotspot-list" aria-label="Soil layers on the cut face. Choose one to read its values.">
        {layers.map((l, i) => (
          <li key={l.depth} style={{ left: `${l.x}%`, top: `${l.y}%` }}>
            <button
              ref={(el) => { btns.current[i] = el; }}
              type="button"
              className="hotspot"
              aria-pressed={sel === i}
              aria-controls={panelId}
              aria-label={`Soil layer ${l.depth} cm`}
              data-struct="soil horizon depth label, a SoilGrids standard layer"
              onClick={() => setSel(sel === i ? null : i)}
            >
              <i aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div id={panelId} className="inspector" role="region" aria-label="Soil layer inspector" aria-live="polite" hidden={sel === null}>
        {sel !== null && (
          <>
            {layers[sel].panel}
            <button type="button" className="sheet-close inspector-close" onClick={close} aria-label="Close the soil layer inspector">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
