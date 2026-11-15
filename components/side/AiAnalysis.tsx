"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { num, sitePrefix, type SiteId } from "@/lib/ledger";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; markdown: string; model: string }
  | { kind: "error"; message: string };

/** Optional. The page is complete without it; the four parts above never depend on it. */
export default function AiAnalysis({ site }: { site: SiteId }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("status"))))
      .then((j: { ai?: unknown }) => { if (alive) setConfigured(j.ai === true); })
      .catch(() => { if (alive) setConfigured(false); });
    return () => { alive = false; };
  }, []);

  async function run() {
    setState({ kind: "loading" });
    const p = sitePrefix(site);
    try {
      const res = await fetch(`/api/analyze?lat=${num(`${p}_lat`)}&lon=${num(`${p}_lon`)}`, { method: "POST" });
      const json: { markdown?: unknown; model?: unknown; error?: unknown } = await res.json();
      if (typeof json.markdown === "string") {
        setState({ kind: "done", markdown: json.markdown, model: typeof json.model === "string" ? json.model : "model not named" });
      } else {
        setState({ kind: "error", message: typeof json.error === "string" ? json.error : "No analysis came back. Try again." });
      }
    } catch {
      setState({ kind: "error", message: "The analysis service could not be reached. The four parts above do not depend on it." });
    }
  }

  return (
    <div className="ai">
      <p className="small">
        <b>AI-generated, not validated.</b> This sends the ledger for this site, and nothing else, to Google Gemini and asks for the same four parts:
        descriptive, diagnostic, predictive and prescriptive. It is told to name no winner and to recommend evidence steps only. Numbers in its
        reply are compared with the ledger: a reply with more than three unmatched numbers is rejected, and any unmatched number is listed under the reply.
      </p>
      {configured === null && <p className="small" role="status">Checking whether the analysis is switched on.</p>}
      {configured === false && (
        <p className="callout" role="status">
          The AI analysis is switched off on this server (no key is set). Nothing is missing: the four parts above are computed from the ledger without it.
        </p>
      )}
      {configured && state.kind !== "done" && (
        <button type="button" className="btn" onClick={run} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Asking Gemini" : "Run AI analysis"}
        </button>
      )}
      <div role="status" aria-live="polite">
        {state.kind === "error" && <p className="callout warn">{state.message}</p>}
        {state.kind === "done" && (
          <div className="ai-out" data-struct="AI output; numbers compared on the server with the ledger payload, unmatched ones listed under the reply">
            <p className="small"><b>AI-generated</b> by {state.model}. Not validated. Judgement is the model&apos;s, not a measurement.</p>
            <ReactMarkdown disallowedElements={["a", "img"]} unwrapDisallowed>{state.markdown}</ReactMarkdown>
            <button type="button" className="btn" onClick={run}>Run again</button>
          </div>
        )}
      </div>
    </div>
  );
}
