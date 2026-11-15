"use client";

import { useId, useState } from "react";
import { FIELD_IDS, SITE_NAME, get, type SiteId } from "@/lib/ledger";
import { N, RowTag } from "@/components/led";

/** Choosing an outline sets the decision unit. The comparison itself is made for the place. */
export default function OutlinePicker({ site }: { site: SiteId }) {
  const [picked, setPicked] = useState<string>("block");
  const name = useId();
  const options = site === "overberg" ? FIELD_IDS : [];
  const row = picked !== "block" ? get(picked) : null;

  return (
    <section className="outline" aria-labelledby={`${name}-h`}>
      <h4 id={`${name}-h`}>Decision unit</h4>
      {options.length === 0 ? (
        <p className="small">
          No per-outline list was packaged for {SITE_NAME[site]}. The comparison is made for the place as a whole.
        </p>
      ) : (
        <fieldset>
          <legend className="small">Pick a field outline. The five largest predicted outlines are listed<RowTag id={options[0].id} />.</legend>
          <label className="radio">
            <input type="radio" name={name} value="block" checked={picked === "block"} onChange={() => setPicked("block")} />
            <span>The whole block</span>
          </label>
          {options.map((o) => (
            <label key={o.id} className="radio">
              <input type="radio" name={name} value={o.id} checked={picked === o.id} onChange={() => setPicked(o.id)} />
              <span>Outline <span data-struct="identifier of a predicted outline, not a quantity">{o.fid}</span></span>
              <span className="mono"><N id={o.id} /> ha</span>
            </label>
          ))}
        </fieldset>
      )}
      <p className="unit-sentence" role="status" aria-live="polite">
        {row ? (
          <>
            The rotation comparison is made for this place; this outline is where the decision is taken:{" "}
            <b>outline <span data-struct="identifier of a predicted outline, not a quantity">{picked.replace("field_", "")}</span>, <N id={picked} /> ha</b>.
            The area is that of a computer-predicted outline, not a surveyed boundary.
          </>
        ) : (
          <>The rotation comparison is made for this place. Pick an outline to say where the decision is taken.</>
        )}
      </p>
      {options.length > 0 && (
        <p className="small">
          The outline is not highlighted on the drawing: the outline shapes are not packaged in this build, only their areas.
        </p>
      )}
    </section>
  );
}
