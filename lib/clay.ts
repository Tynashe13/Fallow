import { num } from "@/lib/ledger/rows";

/** Clay percent to bar colour, on the plate's 0 to 40 scale (sampled from the baked plate). */
export function clayColour(clay: number): string {
  const k = Math.min(1, Math.max(0, clay / num("clay_scale_max")));
  const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
  return `rgb(${mix(234, 52)}, ${mix(224, 42)}, ${mix(204, 31)})`;
}
