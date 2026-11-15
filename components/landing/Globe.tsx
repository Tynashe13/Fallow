"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import landTopo from "world-atlas/land-110m.json";
import { LOCATIONS } from "@/lib/locations";

const SIZE = 560, R = 262, C = SIZE / 2;
const HOME: [number, number] = [-21, 17]; // centred on southern Africa
const land = feature(landTopo as unknown as Topology, (landTopo as unknown as Topology).objects.land) as GeoPermissibleObjects;
const graticule = geoGraticule10();

export interface GlobeTarget { name: string; lat: number; lon: number }

/** A code-drawn globe: bundled Natural Earth coastline, no map tiles, no network. */
export default function Globe({ target }: { target: GlobeTarget | null }) {
  const [rot, setRot] = useState<[number, number]>(HOME);
  const drag = useRef<{ x: number; y: number; rot: [number, number] } | null>(null);
  const frame = useRef<number>(0);

  // Turn to a searched place. One authored movement; skipped when reduced motion is asked for.
  useEffect(() => {
    if (!target) return;
    const to: [number, number] = [-target.lon, Math.max(-60, Math.min(60, -target.lat * 0.6))];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setRot(to); return; }
    let from: [number, number] | null = null;
    const start = performance.now(), dur = 700;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 4);
      setRot((cur) => {
        from = from ?? cur;
        let dl = to[0] - from[0];
        if (dl > 180) dl -= 360;
        if (dl < -180) dl += 360;
        return [from[0] + dl * e, from[1] + (to[1] - from[1]) * e];
      });
      if (k < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target]);

  const { landPath, gratPath, project } = useMemo(() => {
    const proj = geoOrthographic().scale(R).translate([C, C]).rotate([rot[0], rot[1], 0]).clipAngle(90);
    const path = geoPath(proj);
    const visible = (lon: number, lat: number) => path({ type: "Point", coordinates: [lon, lat] }) !== null;
    return {
      landPath: path(land) ?? "",
      gratPath: path(graticule) ?? "",
      project: (lon: number, lat: number) => (visible(lon, lat) ? proj([lon, lat]) : null),
    };
  }, [rot]);

  const turn = (dLon: number, dLat: number) =>
    setRot(([l, p]) => [l + dLon, Math.max(-75, Math.min(75, p + dLat))]);

  function onKey(e: React.KeyboardEvent) {
    const step = 10;
    if (e.key === "ArrowLeft") turn(step, 0);
    else if (e.key === "ArrowRight") turn(-step, 0);
    else if (e.key === "ArrowUp") turn(0, -step);
    else if (e.key === "ArrowDown") turn(0, step);
    else return;
    e.preventDefault();
  }

  const sites = LOCATIONS.map((l) => ({ l, xy: project(l.lon, l.lat) }));
  const tXY = target ? project(target.lon, target.lat) : null;
  const isSite = target ? LOCATIONS.some((l) => Math.abs(l.lat - target.lat) < 0.3 && Math.abs(l.lon - target.lon) < 0.3) : false;

  return (
    <div className="globe">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="group"
        aria-label="Globe. The two sites with full data are marked in southern Africa. Drag, or use the arrow keys or the buttons below, to turn it."
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, rot }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          setRot([d.rot[0] + (e.clientX - d.x) * 0.3, Math.max(-75, Math.min(75, d.rot[1] - (e.clientY - d.y) * 0.3))]);
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <circle cx={C} cy={C} r={R} className="g-sea" />
        <path d={gratPath} className="g-grat" />
        <path d={landPath} className="g-land" />
        <circle cx={C} cy={C} r={R} className="g-rim" />
        {tXY && !isSite && target && (
          <g className="g-target">
            <circle cx={tXY[0]} cy={tXY[1]} r="5" />
            <text x={tXY[0] + 10} y={tXY[1] + 4}>{target.name}</text>
          </g>
        )}
        {sites.map(({ l, xy }, i) =>
          xy ? (
            <g key={l.slug} className="g-site">
              <path d={i === 0 ? `M${xy[0]} ${xy[1]}l46 34` : `M${xy[0]} ${xy[1]}l-52 -30`} />
              <circle cx={xy[0]} cy={xy[1]} r="4.5" />
            </g>
          ) : null
        )}
      </svg>
      {sites.map(({ l, xy }, i) =>
        xy ? (
          <Link
            key={l.slug}
            href={`/field/${l.slug}`}
            className={`g-label ${i === 0 ? "se" : "nw"}`}
            style={{ left: `${((xy[0] + (i === 0 ? 46 : -52)) / SIZE) * 100}%`, top: `${((xy[1] + (i === 0 ? 34 : -30)) / SIZE) * 100}%` }}
          >
            <b>{l.name}</b>
            <span>{l.role}</span>
          </Link>
        ) : null
      )}
      <div className="g-controls" role="group" aria-label="Turn the globe">
        <button type="button" className="btn" onClick={() => turn(20, 0)} aria-label="Turn the globe west">West</button>
        <button type="button" className="btn" onClick={() => turn(-20, 0)} aria-label="Turn the globe east">East</button>
        <button type="button" className="btn" onClick={() => setRot(HOME)}>Back to the sites</button>
      </div>
    </div>
  );
}
