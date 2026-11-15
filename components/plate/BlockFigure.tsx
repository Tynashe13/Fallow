import Image from "next/image";
import { DEPTHS, SITE_NAME, num, sitePrefix, sunNoon, type SiteId } from "@/lib/ledger";
import { clayColour } from "@/lib/clay";
import { Calc, N, Struct } from "@/components/led";

/** The centre of the plate: the baked block drawing. */
export function BlockArt({ site }: { site: SiteId }) {
  const p = sitePrefix(site), sun = sunNoon(site);
  const alt =
    `Drawing of one block of ${SITE_NAME[site]} farmland cut out of the ground. Green terrain on top with ` +
    `${num(`${p}_outlines_shown`)} predicted field outlines and contour lines. Six soil layers on the cut faces, darker with more clay. ` +
    `An arc shows the sun's path from east to west, ${sun.altitude.toFixed(1)} degrees above the northern horizon at noon. ` +
    `Every value in the drawing is repeated as text on this page.`;
  return (
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
