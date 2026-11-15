// Renders scenes.html to video/fallow-demo.mp4: Playwright steps the timeline frame by frame,
// each frame is piped to ffmpeg (H.264, 1920x1080, 30 fps, no audio track).
// Usage: node video/src/render.mjs            full render + poster
//        node video/src/render.mjs still 12.5 one PNG to video/src/stills/
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = fileURLToPath(new URL(".", import.meta.url));
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
await page.goto("file://" + here + "scenes.html");
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
const { DURATION, FPS } = await page.evaluate(() => window.META);
if (process.argv[2] === "still") {
  await mkdir(here + "stills", { recursive: true });
  for (const t of process.argv.slice(3)) {
    await page.evaluate((t) => window.seek(+t), t);
    await page.screenshot({ path: `${here}stills/t${t}.png` });
  }
} else {
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", here + "../fallow-demo.mp4"],
    { stdio: ["pipe", "inherit", "inherit"] });
  const total = Math.round(DURATION * FPS);
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: "jpeg", quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 120 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await page.evaluate(() => window.seek(26));
  await page.screenshot({ path: here + "../fallow-demo-poster.png" });
}
await browser.close();
