"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Overlay from "@/components/Overlay";

export interface Mode {
  id: string;
  /** Number key that selects this mode, if any. */
  hotkey?: string;
  label: string;
  title: string;
  body: ReactNode;
  /** Other anchors that should land on this mode. */
  alias?: string[];
  /** False when the body already carries its own cards. */
  expandable?: boolean;
}

/** Opens a section component in the shared sheet. */
export function Expand({ title, kicker, label = "Open full view", children }: { title: string; kicker?: string; label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-quiet expand" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {label}<span className="vh">: {title}</span>
      </button>
      <Overlay open={open} onClose={() => setOpen(false)} title={title} kicker={kicker}>{children}</Overlay>
    </>
  );
}

function typing(t: EventTarget | null) {
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

/** The four analytic parts plus Evidence, one at a time. Keys 1 to 4 switch. */
export default function SideModes({ modes }: { modes: Mode[] }) {
  const [mode, setMode] = useState(modes[0].id);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef(modes);
  list.current = modes;

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      const m = list.current.find((x) => x.id === h || x.alias?.includes(h));
      if (m) setMode(m.id);
    };
    fromHash();
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || typing(e.target)) return;
      if (document.querySelector("dialog[open]")) return;
      const m = list.current.find((x) => x.hotkey === e.key);
      if (!m) return;
      setMode(m.id);
      window.dispatchEvent(new Event("fallow:open-side"));
      requestAnimationFrame(() => root.current?.scrollIntoView({ block: "nearest" }));
    };
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("hashchange", fromHash); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div className="modes" ref={root}>
      <div className="seg" role="group" aria-label="Analysis mode. Keys 1 to 4 switch." data-struct="keyboard shortcut numbers">
        {modes.map((m) => (
          <button key={m.id} type="button" className="seg-btn" aria-pressed={mode === m.id} aria-keyshortcuts={m.hotkey} onClick={() => setMode(m.id)}>
            {m.hotkey && <kbd aria-hidden="true">{m.hotkey}</kbd>}
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      {modes.map((m) => (
        <section key={m.id} id={m.id} className="mode-panel" hidden={mode !== m.id} aria-label={`${m.label}: ${m.title}`}>
          <header className="mode-card">
            <div>
              <p className="part-kicker">{m.label}</p>
              <h4 className="part-title">{m.title}</h4>
            </div>
            {m.expandable !== false && <Expand title={m.title} kicker={m.label}>{m.body}</Expand>}
          </header>
          <div className="part-body">{m.body}</div>
        </section>
      ))}
    </div>
  );
}
