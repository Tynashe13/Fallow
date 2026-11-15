import { SITE_NAME, SITE_ROLE, type SiteId } from "@/lib/ledger";
import { TIERS } from "@/lib/scope";
import { Answer, Descriptive, Diagnostic, Prescriptive, Sources, Trust } from "./sections";
import Change from "./Change";
import OutlinePicker from "./OutlinePicker";
import AiAnalysis from "./AiAnalysis";

function Part({ id, kicker, title, open, children }: { id: string; kicker?: string; title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="part" id={id} open={open}>
      <summary>
        {kicker && <span className="part-kicker">{kicker}</span>}
        <span className="part-title">{title}</span>
      </summary>
      <div className="part-body">{children}</div>
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

      <Part id="answer" title="Plain answer" open>
        <Answer site={site} />
        <OutlinePicker site={site} />
      </Part>

      <h3 className="side-h">Rotation analysis in four parts</h3>
      <Part id="descriptive" kicker="Descriptive" title="What the sources show"><Descriptive site={site} /></Part>
      <Part id="diagnostic" kicker="Diagnostic" title="Why the answer is open"><Diagnostic site={site} /></Part>
      <Part id="predictive" kicker="Predictive" title="What would change the answer"><Change site={site} /></Part>
      <Part id="prescriptive" kicker="Prescriptive" title="What to do next"><Prescriptive site={site} /></Part>

      <h3 className="side-h">Evidence</h3>
      <Part id="trust" title="Trust panel: the fact ledger"><Trust site={site} /></Part>
      <Part id="sources" title="Sources and credits"><Sources /></Part>
      <Part id="ai" title="Optional AI analysis"><AiAnalysis site={site} /></Part>
    </div>
  );
}
