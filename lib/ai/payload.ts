/** The only data the AI analysis ever sees: a compact text built on the
 *  server from the ledger, organised by the four types of analysis. */
import {
  METRICS, SITE_NAME, cellSizes, get, moistureSteps, rainSummary, rowsFor, seasonRain, soilCompare, trialCompare, verdict,
  MONTHS_LONG, type SiteId,
} from "@/lib/ledger";

export function buildPayload(site: SiteId) {
  const rs = rainSummary(site), sr = seasonRain(site), sc = soilCompare(site), t = trialCompare(), v = verdict(), ms = moistureSteps(site), cs = cellSizes(site);
  const rows = rowsFor(site).map((r) => ({
    figure: r.label, value: r.value, unit: r.unit, status: r.status, source: r.source, confidence: r.confidence, caveat: r.caveat, remedy: r.remedy,
  }));
  return {
    site: SITE_NAME[site],
    descriptive: { ledger_rows: rows },
    diagnostic: {
      rain: { lowest_mm: rs.lo, highest_mm: rs.hi, spread_mm: rs.spread, spread_pct_of_imerg: rs.pct, sources_agree_under_our_rule: rs.agree, confidence: rs.confidence },
      topsoil_clay: { soilgrids_pct: sc.a, isda_pct: sc.b, difference_points: sc.d, difference_pct_of_soilgrids: sc.pct, maps_agree_under_our_rule: sc.agree },
      metric_cells: { sourced: v.sourced, total: v.total, winner_can_be_named: v.canName, gaps: METRICS.flatMap((m) => [`${m.name}, R1: ${m.r1.missing}`, `${m.name}, R3: ${m.r3.missing}`]) },
      source_cell_vs_field: { imerg_cell_ha: cs.imerg.ha, fields_of_10_ha_per_imerg_cell: cs.imerg.fields, soilgrids_cell_m: cs.soilgrids.m },
    },
    predictive_conditionals: {
      note: "Conditional ranges only. Thresholds are ours, not from a source.",
      season_rain_may_to_october_mm: { lowest_source: sr.lo, highest_source: sr.hi, lower_third_below: sr.cut1, upper_third_above: sr.cut2, wheat_water_use_range: sr.wuText, sources_reaching_wheat_minimum: sr.reach },
      topsoil_wetness_reached: ms.steps.map((s) => ({ month: MONTHS_LONG[s.month], percent_of_full_wetness: s.value })),
      trial_wheat_after_break_crop_vs_monoculture_kg_ha: t.byTillage.map((b) => ({ tillage: b.tillage, average_difference: b.avg, cells_lower: b.lc, cells: b.diffs.length })),
    },
    prescriptive_evidence_steps: Array.from(new Set(rowsFor(site).filter((r) => r.status !== "checked" && r.status !== "ours").map((r) => r.remedy))),
    rule: String(get("rule_half").caveat),
  };
}
