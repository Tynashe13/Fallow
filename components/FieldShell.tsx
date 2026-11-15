"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { SiteId } from "@/lib/ledger/types";
import Overlay from "@/components/Overlay";

/** Field view shell: the plate on one screen, with a collapsible sidebar that
 *  takes its own column so the plate rescales instead of being covered. */
export default function FieldShell({ site, plate, sidebar, verdictNotice, sources }: { site: SiteId; plate: ReactNode; sidebar: ReactNode; verdictNotice: ReactNode; sources: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<"verdict" | "sources" | null>(null);
  const sideId = useId();
  const sideRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Arriving with a #part hash opens the sidebar at that part.
  useEffect(() => {
    if (window.location.hash.length > 1) setOpen(true);
    // A mode key (1 to 4) opens the sidebar at that mode.
    const openSide = () => setOpen(true);
    window.addEventListener("fallow:open-side", openSide);
    return () => window.removeEventListener("fallow:open-side", openSide);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Esc belongs to an open sheet first.
      if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector("dialog[open]")) { setOpen(false); btnRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) requestAnimationFrame(() => sideRef.current?.focus());
  }

  return (
    <div className="field" data-side={open ? "open" : "closed"}>
      <main id="main-content" tabIndex={-1} className="field-main">
        <div className="stage-wrap">
          <div className="stage">
            <nav className="toolbar" aria-label="Field view">
              <Link className="btn" href="/">Globe</Link>
              <span className="btn-group">
                <Link className="btn" href="/field/overberg" aria-current={site === "overberg" ? "page" : undefined}>Overberg</Link>
                <Link className="btn" href="/field/swartland" aria-current={site === "swartland" ? "page" : undefined}>Swartland</Link>
              </span>
              <button type="button" className="btn" aria-haspopup="dialog" onClick={() => setSheet("verdict")}>Verdict notice</button>
              <button type="button" className="btn" aria-haspopup="dialog" onClick={() => setSheet("sources")}>Sources and citations</button>
              <button ref={btnRef} type="button" className="btn btn-solid side-toggle" aria-expanded={open} aria-controls={sideId} onClick={toggle}>
                {open ? "Hide analysis" : "Rotation analysis"}
              </button>
              <a className="btn btn-solid side-jump" href="#answer">Rotation analysis</a>
            </nav>
            {plate}
          </div>
        </div>
      </main>
      <aside ref={sideRef} id={sideId} className="side" aria-label="Rotation analysis and trust panel" tabIndex={-1}>
        {sidebar}
      </aside>
      <Overlay open={sheet === "verdict"} onClose={() => setSheet(null)} title="Verdict notice" kicker="Plain answer">{verdictNotice}</Overlay>
      <Overlay open={sheet === "sources"} onClose={() => setSheet(null)} title="Sources and citations" kicker="Evidence">{sources}</Overlay>
    </div>
  );
}
