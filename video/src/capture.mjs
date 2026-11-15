// Captures real app screens at 1920x1080 (deviceScaleFactor 2 so zooms stay sharp).
// Run against a started app: BASE=http://localhost:3100 node video/src/capture.mjs
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3100";
const OUT = new URL("./shots/", import.meta.url).pathname;
const PAGES = [
  ["landing", "/"], ["overberg", "/field/overberg"], ["swartland", "/field/swartland"], ["ledger", "/ledger"],
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const page = await ctx.newPage();
for (const [name, path] of PAGES) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}${name}.png` });
  await page.screenshot({ path: `${OUT}${name}-full.png`, fullPage: true });
  await writeFile(`${OUT}${name}.txt`, await page.evaluate(() => document.body.innerText));
  console.log(name, await page.evaluate(() => [document.documentElement.scrollHeight, document.documentElement.scrollWidth]));
}
await browser.close();
