// Fails if the browser makes any third-party request, and checks that every
// page still renders with all outside hosts blocked (the baked parts work offline).
// Run against a started app: BASE=http://localhost:3000 node scripts/check-network.mjs
import { chromium } from "./_pw.mjs";
import { BASE, PAGES, expand } from "./pages.mjs";

const own = new URL(BASE).host;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const third = [];
let total = 0, failures = 0;
await ctx.route("**/*", (route) => {
  const url = new URL(route.request().url());
  total++;
  if (url.protocol === "data:" || url.protocol === "blob:" || url.host === own) return route.continue();
  third.push(url.href);
  return route.abort();
});
const page = await ctx.newPage();
for (const p of PAGES) {
  await page.goto(BASE + p.path, { waitUntil: "networkidle" });
  if (p.analysis) await expand(page);
  const h1 = (await page.locator("h1").first().textContent())?.trim();
  const broken = await page.evaluate(() => Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0).length);
  const fonts = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px "Figtree Variable"') && Array.from(document.fonts).every((f) => f.status !== "error"); });
  const ok = Boolean(h1) && broken === 0 && fonts;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${p.name}: h1="${h1}", broken images=${broken}, bundled fonts loaded=${fonts}`);
}
await browser.close();
console.log(`requests seen: ${total}; third-party requests: ${third.length}`);
third.forEach((u) => console.error("THIRD PARTY: " + u));
process.exit(third.length || failures ? 1 : 0);
