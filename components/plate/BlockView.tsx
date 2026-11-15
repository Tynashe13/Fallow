"use client";

import { useState, type ReactNode } from "react";

/** Centre of the plate. Shows the block drawing; under 600 px the flat soil
 *  column is the default, and either can be chosen. */
export default function BlockView({ art, flat }: { art: ReactNode; flat: ReactNode }) {
  const [mode, setMode] = useState<"auto" | "art" | "flat">("auto");
  return (
    <div className="view" data-mode={mode}>
      <div className="view-toggle" role="group" aria-label="Choose the drawing">
        <button type="button" className="btn" aria-pressed={mode === "art"} onClick={() => setMode("art")}>Block drawing</button>
        <button type="button" className="btn" aria-pressed={mode === "flat"} onClick={() => setMode("flat")}>Flat view</button>
      </div>
      <div className="view-art">{art}</div>
      <div className="view-flat">{flat}</div>
    </div>
  );
}
