// Evidence screenshots at 1920x1080, 1366x768 and 390 wide.
// Run against a started app: BASE=http://localhost:3000 node scripts/screenshots.mjs
import { chromium } from "./_pw.mjs";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const SIZES = [
  { tag: "1920x1080", width: 1920, height: 1080, scale: 1, full: false },
  { tag: "1366x768", width: 1366, height: 768, scale: 1, full: false },
  { tag: "390", width: 390, height: 844, scale: 2, full: true },
];
const PAGES = [
  { name: "landing", path: "/" },
  { name: "field-overberg", path: "/field/overberg" },
  { name: "field-swartland", path: "/field/swartland" },
  { name: "field-overberg-analysis", path: "/field/overberg", analysis: true },
  { name: "field-overberg-mode-predictive", path: "/field/overberg", key: "3" },
  { name: "field-overberg-verdict-sheet", path: "/field/overberg", button: "Verdict notice" },
  { name: "field-overberg-sources-sheet", path: "/field/overberg", button: "Sources and citations" },
  { name: "field-overberg-soil-layer", path: "/field/overberg", layer: 3 },
  { name: "field-swartland-soil-layer", path: "/field/swartland", layer: 1 },
  { name: "place-other", path: "/place?lat=-29.1&lon=26.2&name=Bloemfontein" },
  { name: "ledger", path: "/ledger" },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.scale });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(BASE + p.path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (p.analysis) {
      const toggle = page.locator(".side-toggle");
      if (await toggle.isVisible()) await toggle.click();
      await page.evaluate(() => {
        for (const id of ["diagnostic", "predictive", "prescriptive"]) document.getElementById(id)?.setAttribute("open", "");
      });
      await page.waitForTimeout(400);
    }
    if (p.key) { await page.keyboard.press(p.key); await page.waitForTimeout(500); }
    if (p.button) { await page.getByRole("button", { name: p.button }).click(); await page.waitForTimeout(600); }
    if (p.layer !== undefined) {
      const art = page.getByRole("button", { name: "Block drawing" });
      if (await art.isVisible()) await art.click();
      await page.locator(".hotspot").nth(p.layer).click();
      await page.waitForTimeout(500);
    }
    const file = `${OUT}/${p.name}-${s.tag}.png`;
    // A sheet is fixed to the viewport, so those shots are never full-page.
    await page.screenshot({ path: file, fullPage: s.full && !p.button });
    console.log(file);
  }
  await ctx.close();
}
await browser.close();
