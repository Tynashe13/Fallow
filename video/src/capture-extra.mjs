// Extra real screens: the rotation-analysis side panel and the ledger scrolled to the Swartland rain rows.
// Also writes boxes.json: on-screen rectangles of the elements the video zooms to.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = new URL("./shots/", import.meta.url).pathname;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const page = await ctx.newPage();
const boxes = {};
const rect = (loc) => loc.first().boundingBox();
const byText = (t) => page.getByText(t, { exact: false });

for (const site of ["overberg", "swartland"]) {
  await page.goto(`${BASE}/field/${site}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  boxes[`${site}.rainHeading`] = await rect(byText("Annual rain"));
  boxes[`${site}.spread`] = await rect(byText("of IMERG"));
  boxes[`${site}.readFirst`] = await rect(byText("Read this first"));
}
// side panel on Swartland
const toggle = page.locator(".side-toggle");
if (await toggle.isVisible()) await toggle.click();
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}swartland-analysis.png` });
boxes["analysis.chip"] = await rect(page.locator(".verdict-chip"));
boxes["analysis.panel"] = await rect(page.locator(".verdict-chip").locator("xpath=ancestor::*[self::aside or self::section][1]"));
await writeFile(`${OUT}swartland-analysis.txt`, await page.evaluate(() => document.body.innerText));

// ledger at the Swartland rain rows
await page.goto(`${BASE}/ledger`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const row = page.locator("tr", { hasText: "Swartland rain, NASA GPM IMERG" }).first();
await row.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 330));
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}ledger-swartland.png` });
for (const k of ["NASA GPM IMERG", "Open-Meteo", "ERA5", "Meteomatics"]) {
  const r = page.locator("tr", { hasText: `Swartland rain, ${k}` }).first();
  boxes[`ledger.${k}`] = await rect(r);
  boxes[`ledger.${k}.text`] = (await r.innerText()).replace(/\s+/g, " ").slice(0, 400);
}
boxes["ledger.thead"] = await rect(page.locator("thead"));
await writeFile(`${OUT}boxes.json`, JSON.stringify(boxes, null, 1));
console.log(JSON.stringify(boxes, null, 1));
await browser.close();
