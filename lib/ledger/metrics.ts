/** Four farmer metrics for two rotations: eight cells. A cell is "sourced"
 *  only when a checked value exists for this region. Today none is. */
export interface MetricCell { sourced: boolean; missing: string; needs: string[] }
export interface Metric { id: string; name: string; r1: MetricCell; r3: MetricCell }

export const METRICS: Metric[] = [
  { id: "water", name: "Water fit",
    r1: { sourced: false, needs: ["r1_water_use"], missing: "Needs a sourced water-use figure for the winter-rainfall region. The 330 to 380 mm figure comes from a passage about summer-rainfall provinces, so we do not score it." },
    r3: { sourced: false, needs: ["r3_water"], missing: "Break crop water need: no source found. To settle it: a published seasonal water use for lupin or canola in the winter-rainfall region, for example in the ARC-SGI 2020 small-grains guideline." } },
  { id: "heat", name: "Heat and dry-spell exposure",
    r1: { sourced: false, needs: [], missing: "No sourced heat or dry-spell threshold for wheat here. To settle it: a wheat heat and dry-spell limit for the Western Cape from the ARC-SGI 2020 guideline." },
    r3: { sourced: false, needs: ["r3_heat"], missing: "A canola heat and drought-at-flowering limit has been reported from a government guideline, but we have not opened the document, so it is unverified and not scored. To settle it: read the guideline page and quote it." } },
  { id: "soil", name: "Soil health contribution",
    r1: { sourced: false, needs: ["r1_disease", "r1_nitrogen"], missing: "Disease carry-over is sourced, but with no size of effect. Nitrogen effect assumed. To settle it: the size of the disease effect and a nitrogen figure from a trial or extension document." },
    r3: { sourced: false, needs: ["r3_n_credit", "r3_root"], missing: "Nitrogen credit and root depth: no source found. To settle it: lupin or canola nitrogen credit and rooting depth from the ARC-SGI 2020 wheat-legume rotation section." } },
  { id: "bare", name: "Bare-field days",
    r1: { sourced: false, needs: [], missing: "Needs a NASA vegetation series. Not included in this version." },
    r3: { sourced: false, needs: [], missing: "Needs a NASA vegetation series. Not included in this version." } },
];

/** Ledger rows whose text is quoted inside the `missing` sentences above. */
export const METRIC_TEXT_ROWS = ["r1_water_use", "r1_tillage", "r3_heat"];
