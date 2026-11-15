import Image from "next/image";
import { DEPTHS, SITE_NAME, get, num, sitePrefix, sunNoon, type SiteId } from "@/lib/ledger";
import { clayColour } from "@/lib/clay";
import { Calc, Led, N, RowTag, Struct } from "@/components/led";
import SoilHotspots from "./SoilHotspots";

/** Where each horizon's marker sits on the baked image, in percent of its
 *  width and height. Hand-placed on the front cut face, stepped along the
 *  layers so the touch targets do not overlap. Markers, not measurements. */
const HOTSPOTS: readonly (readonly [number, number])[] = [
  [17.8, 64.3], [24.9, 68.6], [32, 73.8], [39, 79.5], [46, 85.6], [53.1, 92.4],
];
/** The Swartland block sits a little lower in its image. */
const HOTSPOT_DY: Record<SiteId, number> = { overberg: 0, swartland: 1.4 };

/** The centre of the plate: the baked block drawing. */
export function BlockArt({ site }: { site: SiteId }) {
  const p = sitePrefix(site), sun = sunNoon(site);
  const alt =
    `Drawing of one block of ${SITE_NAME[site]} farmland cut out of the ground. Green terrain on top with ` +
    `${num(`${p}_outlines_shown`)} predicted field outlines and contour lines. Six soil layers on the cut faces, darker with more clay. ` +
    `An arc shows the sun's path from east to west, ${sun.altitude.toFixed(1)} degrees above the northern horizon at noon. ` +
    `Every value in the drawing is repeated as text on this page.`;
  return (
    <div className="block-wrap">
    <Image
      className="block-art"
      src={`/art/block-${site}.webp`}
      alt={alt}
      width={1205}
      height={1040}
      priority
      unoptimized
      data-calc={[...sun.from, `${p}_outlines_shown`].join(" ")}
    />
    <SoilHotspots
      layers={DEPTHS.map((d, i) => {
        const k = d.replace("-", "_"), clay = `${p}_clay_${k}`, sand = `${p}_sand_${k}`, ph = `${p}_ph_${k}`;
        const r = get(clay);
        return {
          depth: d.replace("-", "–"),
          x: HOTSPOTS[i][0],
          y: HOTSPOTS[i][1] + HOTSPOT_DY[site],
          panel: (
            <div className="insp">
              <p className="part-kicker">Soil layer</p>
              <h3><Struct why="soil horizon depth label, a SoilGrids standard layer">{d.replace("-", "–")} cm</Struct></h3>
              <dl>
                <div><dt>Clay</dt><dd><N id={clay} /> %</dd></div>
                <div><dt>Sand</dt><dd><N id={sand} /> %</dd></div>
                <div><dt>pH in water</dt><dd><N id={ph} /></dd></div>
              </dl>
              <p className="insp-src"><Led ids={clay}>Source: {r.source}, {r.resolution}, {r.period}.</Led><RowTag id={clay} /></p>
              <p className="insp-src"><Led ids={clay}>Modelled, not measured. {r.confidence}.</Led> The same values are in the soil by depth table.</p>
            </div>
          ),
        };
      })}
    />
    </div>
  );
}

/** Flat view: the six horizons as a plain column, drawn by code from the ledger. Default on small screens. */
export function FlatSoil({ site }: { site: SiteId }) {
  const p = sitePrefix(site);
  return (
    <div className="flat">
      <ol className="flat-col" aria-label="Soil by depth, flat view. Depths not to scale.">
        {DEPTHS.map((d) => {
          const k = d.replace("-", "_");
          const clay = num(`${p}_clay_${k}`);
          return (
            <li key={d}>
              <i aria-hidden="true" style={{ background: clayColour(clay) }} />
              <Struct why="soil horizon depth label, a SoilGrids standard layer"><b className="mono">{d.replace("-", "–")} cm</b></Struct>
              <span>clay <N id={`${p}_clay_${k}`} /> % · sand <N id={`${p}_sand_${k}`} /> %</span>
            </li>
          );
        })}
      </ol>
      <p className="flat-note">
        Flat view. Each band is one soil layer, darker with more clay. Depths are not to scale. Sun at noon:{" "}
        <Calc from={sunNoon(site).from}>{sunNoon(site).altitude.toFixed(1)}°</Calc> above the northern horizon.
      </p>
    </div>
  );
}
