"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/** Shared sheet. Built on the native <dialog>: showModal() traps focus, makes
 *  the rest of the page inert, closes on Esc and returns focus to the control
 *  that opened it. Centre sheet on desktop, bottom sheet on phones (CSS). */
export default function Overlay({
  open, onClose, title, kicker, children,
}: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d || !open) return;
    if (!d.open) d.showModal();
    document.documentElement.classList.add("scroll-lock");
    return () => {
      document.documentElement.classList.remove("scroll-lock");
      if (d.open) d.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-modal="true"
      aria-labelledby={titleId}
      onClose={onClose}
      onMouseDown={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <>
          <header className="sheet-head">
            <div className="sheet-titles">
              {kicker && <p className="part-kicker">{kicker}</p>}
              <h2 id={titleId}>{title}</h2>
            </div>
            <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </header>
          <div className="sheet-body" tabIndex={0} role="region" aria-labelledby={titleId}>{children}</div>
        </>
      )}
    </dialog>
  );
}
