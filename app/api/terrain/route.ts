import { fetchRetry } from "@/lib/fetchRetry";
import { NextRequest, NextResponse } from "next/server";
import { parseSiteQuery } from "@/lib/siteGuard";
import { PNG } from "pngjs";
import { cached, DAY } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * Real elevation for the 3D block, from AWS Terrain Tiles (Mapzen
 * terrarium PNGs — open data on S3, no key). Decoded server-side and
 * returned as a small grid the client displaces a mesh with.
 * elevation = (R*256 + G + B/256) − 32768  (metres)
 */

const ZOOM = 12;
const TILE = 256;
const GRID = 129; // output grid resolution (grid cells = 128)

function lonToX(lon: number, z: number) {
  return ((lon + 180) / 360) * 2 ** z;
}
function latToY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
}

async function fetchTile(z: number, x: number, y: number): Promise<PNG> {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  const res = await fetchRetry(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`tile ${z}/${x}/${y}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return PNG.sync.read(buf);
}

export async function GET(req: NextRequest) {
  const q = parseSiteQuery(req);
  if (q instanceof NextResponse) return q;
  const { lat, lon, half } = q;

  try {
    const data = await cached(`terrain:${lat},${lon},${half}`, 30 * DAY, async () => {
      const west = lon - half, east = lon + half;
      const north = lat + half, south = lat - half;

      // fractional pixel coords of the bbox at ZOOM
      const pxW = lonToX(west, ZOOM) * TILE;
      const pxE = lonToX(east, ZOOM) * TILE;
      const pxN = latToY(north, ZOOM) * TILE;
      const pxS = latToY(south, ZOOM) * TILE;

      const tx0 = Math.floor(pxW / TILE), tx1 = Math.floor(pxE / TILE);
      const ty0 = Math.floor(pxN / TILE), ty1 = Math.floor(pxS / TILE);

      const cols = tx1 - tx0 + 1, rows = ty1 - ty0 + 1;
      if (cols * rows > 16) throw new Error("bbox too large");

      // fetch + stitch
      const stitched = new Float32Array(cols * TILE * rows * TILE);
      const stW = cols * TILE;
      await Promise.all(
        Array.from({ length: cols * rows }, (_, i) => {
          const cx = i % cols, cy = Math.floor(i / cols);
          return fetchTile(ZOOM, tx0 + cx, ty0 + cy).then((png) => {
            for (let y = 0; y < TILE; y++) {
              for (let x = 0; x < TILE; x++) {
                const p = (y * TILE + x) * 4;
                const elev =
                  png.data[p] * 256 + png.data[p + 1] + png.data[p + 2] / 256 - 32768;
                stitched[(cy * TILE + y) * stW + cx * TILE + x] = elev;
              }
            }
          });
        })
      );

      // bilinear sample the bbox into a GRID×GRID array
      const ox = pxW - tx0 * TILE;
      const oy = pxN - ty0 * TILE;
      const spanX = pxE - pxW;
      const spanY = pxS - pxN;
      const stH = rows * TILE;

      const elev = new Array<number>(GRID * GRID);
      let min = Infinity, max = -Infinity;
      for (let j = 0; j < GRID; j++) {
        for (let i = 0; i < GRID; i++) {
          const fx = ox + (i / (GRID - 1)) * spanX;
          const fy = oy + (j / (GRID - 1)) * spanY;
          const x0 = Math.min(stW - 2, Math.max(0, Math.floor(fx)));
          const y0 = Math.min(stH - 2, Math.max(0, Math.floor(fy)));
          const dx = fx - x0, dy = fy - y0;
          const v =
            stitched[y0 * stW + x0] * (1 - dx) * (1 - dy) +
            stitched[y0 * stW + x0 + 1] * dx * (1 - dy) +
            stitched[(y0 + 1) * stW + x0] * (1 - dx) * dy +
            stitched[(y0 + 1) * stW + x0 + 1] * dx * dy;
          const r = Math.round(v * 10) / 10;
          elev[j * GRID + i] = r;
          if (r < min) min = r;
          if (r > max) max = r;
        }
      }

      const metresPerDegLat = 111_320;
      const metresPerDegLon = 111_320 * Math.cos((lat * Math.PI) / 180);

      return {
        source: "AWS Terrain Tiles (terrarium) · not a survey",
        grid: GRID,
        bbox: { west, east, south, north },
        widthM: Math.round(2 * half * metresPerDegLon),
        heightM: Math.round(2 * half * metresPerDegLat),
        minElev: min,
        maxElev: max,
        elev,
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: `Terrain unavailable: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
