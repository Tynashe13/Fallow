"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  open: boolean;
  onClose: () => void;
  geminiConfigured: boolean | null;
  /** everything the plate fetched, sent to Gemini as evidence */
  buildPayload: () => any;
}

export default function AnalysisDrawer({ open, onClose, geminiConfigured, buildPayload }: Props) {
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (json.markdown) {
        setMarkdown(json.markdown);
        setModel(json.model ?? null);
      } else {
        // drop any earlier reply so the error (e.g. number check, rate limit) shows
        setMarkdown(null);
        setError(json.error ?? "No analysis returned");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <header
          style={{
            padding: "18px 26px 14px",
            borderBottom: "1.5px solid var(--rule-strong)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div className="kicker">Rotation analysis</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, marginTop: 4 }}>
              Wheat again, or a break crop?
            </div>
            <div className="srcline" style={{ marginTop: 6 }}>
              AI-generated{model ? ` · ${model}` : ""} · from this plate&apos;s live data · not validated
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close analysis"
            style={{
              border: "1.5px solid var(--ink)", background: "none", cursor: "pointer",
              width: 32, height: 32, fontSize: 16, lineHeight: 1, flex: "none",
              fontFamily: "var(--font-mono)", color: "var(--ink)",
            }}
          >
            ×
          </button>
        </header>

        <div className="drawer-body">
          {geminiConfigured === false && (
            <div>
              <div className="nodata-chip" style={{ marginBottom: 14 }}>Needs a Gemini key</div>
              <p style={{ color: "var(--ink-soft)" }}>
                The analysis drawer sends this plate&apos;s fetched data — climate, soil,
                the rain-source disagreement, current weather — to Google Gemini and asks
                for a rotation-focused read with confidence labels.
              </p>
              <p style={{ marginTop: 10, color: "var(--ink-soft)" }}>
                To turn it on: copy <code className="mono">.env.example</code> to{" "}
                <code className="mono">.env.local</code>, set{" "}
                <code className="mono">GEMINI_API_KEY</code> (free at
                aistudio.google.com/apikey), restart the dev server.
              </p>
            </div>
          )}

          {geminiConfigured !== false && !markdown && (
            <div>
              <p style={{ color: "var(--ink-soft)", marginBottom: 16 }}>
                Sends the numbers on this plate — nothing else — to Gemini and asks it to
                compare <strong>wheat on wheat</strong> against <strong>lupin / canola
                break crops</strong> for this block, with a confidence label on every
                claim and a section on what the data cannot know.
              </p>
              <button className="btn btn-solid" onClick={run} disabled={loading}>
                {loading ? "Reading the field…" : "Run analysis"}
              </button>
              {error && (
                <p style={{ marginTop: 14, color: "var(--alert)", fontSize: 13 }}>{error}</p>
              )}
            </div>
          )}

          {markdown && (
            <>
              <ReactMarkdown>{markdown}</ReactMarkdown>
              <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                <button className="btn" onClick={run} disabled={loading}>
                  {loading ? "Re-reading…" : "Re-run"}
                </button>
              </div>
              <p className="srcline" style={{ marginTop: 18 }}>
                AI output · numbers come from the sources on the plate · judgement is the
                model&apos;s, not a measurement
              </p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
