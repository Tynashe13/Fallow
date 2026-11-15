import { SITE_NAME, SITE_ROLE, type SiteId } from "@/lib/ledger";
import { TIERS } from "@/lib/scope";
import { Answer, Descriptive, Diagnostic, Prescriptive, Sources, Trust } from "./sections";
import Change from "./Change";
import OutlinePicker from "./OutlinePicker";
import AiAnalysis from "./AiAnalysis";
import SideModes, { Expand } from "./SideModes";

function Part({ id, title, expand, children }: { id: string; title: string; expand?: boolean; children: React.ReactNode }) {
  return (
    <details className="part" id={id}>
      <summary><span className="part-title">{title}</span></summary>
      <div className="part-body">
        {expand && <Expand title={title} kicker="Evidence">{children}</Expand>}
        {children}
      </div>
    </details>
  );
}

export default function Sidebar({ site }: { site: SiteId }) {
  const tier = TIERS[0];
  return (
    <div className="side-inner">
      <header className="side-head">
        <p className="scope" aria-label="Scope tier">
          {TIERS.map((t) => (
            <span key={t.id} className={t.id === tier.id ? "on" : ""} aria-current={t.id === tier.id ? "true" : undefined}>{t.step}</span>
          ))}
        </p>
        <h2>{SITE_NAME[site]}: wheat again, or a break crop?</h2>
        <p className="small">
          Scope tier: <b>{tier.name}</b> ({SITE_ROLE[site]}). {tier.gives}
        </p>
      </header>

      <section className="plain" id="answer" aria-label="Plain answer">
        <Answer site={site} />
        <OutlinePicker site={site} />
      </section>

      <h3 className="side-h">Rotation analysis in four parts</h3>
      <SideModes
        modes={[
          { id: "descriptive", hotkey: "1", label: "Descriptive", title: "What the sources show", body: <Descriptive site={site} /> },
          { id: "diagnostic", hotkey: "2", label: "Diagnostic", title: "Why the answer is open", body: <Diagnostic site={site} /> },
          { id: "predictive", hotkey: "3", label: "Predictive", title: "What would change the answer", body: <Change site={site} /> },
          { id: "prescriptive", hotkey: "4", label: "Prescriptive", title: "What to do next", body: <Prescriptive site={site} /> },
          {
            id: "evidence", label: "Evidence", title: "Ledger, sources and optional AI", alias: ["trust", "sources", "ai"], expandable: false,
            body: (
              <>
                <Part id="trust" title="Trust panel: the fact ledger" expand><Trust site={site} /></Part>
                <Part id="sources" title="Sources and credits" expand><Sources /></Part>
                <Part id="ai" title="Optional AI analysis"><AiAnalysis site={site} /></Part>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
