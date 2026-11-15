// Crops the centre block (terrain, soil faces, sun arc, leader lines) out of
// the baked reference plates, so the live page can lay real text around it.
// Coordinates are in the plate's 1920x1080 space. Run: node scripts/bake-art.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CROP = { x: 472, y: 66, w: 904, h: 780 };
// The plate title and standfirst overlap the crop; that rectangle is made
// transparent so the live HTML title shows instead.
const BLANK = { x: 472, y: 66, w: 296, h: 136 };

for (const site of ["overberg", "swartland"]) {
  const src = path.join(root, "reference/art", `fallow-profile-${site}-june.png`);
  const meta = await sharp(src).metadata();
  const f = meta.width / 1920;
  const r = (v) => Math.round(v * f);
  const { data, info } = await sharp(src)
    .extract({ left: r(CROP.x), top: r(CROP.y), width: r(CROP.w), height: r(CROP.h) })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < r(BLANK.h); y++)
    for (let x = 0; x < r(BLANK.w); x++) data[(y * info.width + x) * 4 + 3] = 0;
  // Flat paper pixels become transparent, so the page background shows through
  // and lossy compression cannot tint the paper.
  const PAPER = [0xf4, 0xf4, 0xf1];
  for (let i = 0; i < data.length; i += 4) {
    if (Math.abs(data[i] - PAPER[0]) + Math.abs(data[i + 1] - PAPER[1]) + Math.abs(data[i + 2] - PAPER[2]) <= 2) data[i + 3] = 0;
  }
  const out = path.join(root, "public/art", `block-${site}.webp`);
  await sharp(data, { raw: info }).webp({ quality: 92, alphaQuality: 100, exact: false }).toFile(out);
  console.log(out, info.width, info.height);
}
