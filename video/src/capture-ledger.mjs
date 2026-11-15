// Ledger rows for the four Swartland rain sources. The table is wider than the 1920 viewport and scrolls
// sideways on the real page, so it is captured twice (scrolled fully left, fully right) and the video
// places the two captures side by side to pan across the real rows. Also saves the app's own logo SVG.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = new URL("./shots/", import.meta.url).pathname;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(`${BASE}/ledger`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const first = page.locator("tr", { hasText: "Swartland rain, NASA GPM IMERG" }).first();
const last = page.locator("tr", { hasText: "Swartland rain, Meteomatics" }).first();
await first.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40));
await page.waitForTimeout(300);
const info = await first.evaluate((el) => {
  const sc = el.closest(".scroll"); const r = sc.getBoundingClientRect();
  return { x: r.x, w: r.width, max: sc.scrollWidth - sc.clientWidth };
});
const a = await first.boundingBox(), b = await last.boundingBox();
const clip = { x: info.x + 1, y: a.y, width: info.w - 2, height: b.y + b.height - a.y };
await page.screenshot({ path: `${OUT}ledger-rows-left.png`, clip });
await first.evaluate((el) => { el.closest(".scroll").scrollLeft = 1e6; });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}ledger-rows-right.png`, clip });
const cells = await first.evaluate((el) => [...el.children].map((c) => { const r = c.getBoundingClientRect(); return [c.innerText.slice(0, 30), Math.round(r.x), Math.round(r.width)]; }));
await page.goto(`${BASE}/field/swartland`, { waitUntil: "networkidle" });
const logo = await page.locator("svg.logo").first().evaluate((el) => el.outerHTML);
await writeFile(`${OUT}logo.svg.txt`, logo);
await writeFile(`${OUT}ledger-rows.json`, JSON.stringify({ clip, scrollMax: info.max, cellsAtRightScroll: cells }, null, 1));
console.log(JSON.stringify({ clip, info, cells }), "\n", logo);
await browser.close();
