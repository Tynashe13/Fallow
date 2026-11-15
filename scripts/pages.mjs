// The page states every check visits.
export const BASE = process.env.BASE ?? "http://localhost:3000";
export const PAGES = [
  { name: "landing", path: "/" },
  { name: "field-overberg", path: "/field/overberg", analysis: true },
  { name: "field-swartland", path: "/field/swartland", analysis: true },
  { name: "place-south-africa", path: "/place?lat=-29.1&lon=26.2&name=Bloemfontein" },
  { name: "place-anywhere", path: "/place?lat=51.5&lon=-0.1&name=London" },
  { name: "ledger", path: "/ledger" },
];
export const SITES = [
  { lat: -34.2, lon: 19.801 },
  { lat: -33.46, lon: 18.73 },
];

/** Open the sidebar and every collapsed part, and pick an outline, so all text is on screen. */
export async function expand(page) {
  const toggle = page.locator(".side-toggle");
  if (await toggle.count() && await toggle.isVisible()) await toggle.click();
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")));
  const radios = page.locator('.outline input[type="radio"]');
  if ((await radios.count()) > 1) await radios.nth(1).check();
  await page.waitForTimeout(300);
}
