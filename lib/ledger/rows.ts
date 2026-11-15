/**
 * THE FACT LEDGER. One file. Every number shown anywhere in the app is a row
 * here, or is computed in derive.ts from rows it names.
 *
 * Values were carried over from Build A's data files (reference/build-a/data.js
 * and profile-data.js, generated 14 Nov 2026). Do not edit numbers by hand.
 * Status rules:
 *   checked    = a source was opened and read (Build A), or re-fetched from
 *                the source API on the `date` shown and matched.
 *   unverified = a source is named but not opened, or not confirmed here.
 *   assumed    = no source found.
 *   ours       = a cut-off we chose.
 */
import type { LedgerRow, SiteId, Status, Group, Scope } from "./types";

const BUILD_A = "2026-11-14";
const TODAY = "2026-11-15";

type Partial_ = Partial<LedgerRow> & Pick<LedgerRow, "label" | "value" | "source" | "status" | "caveat" | "remedy">;

function row(id: string, scope: Scope, group: Group, p: Partial_): LedgerRow {
  return {
    id, scope, group,
    unit: "", dp: 0, url: null, page: null, isNasa: false,
    resolution: "not applicable", period: "not applicable",
    confidence: p.status === "assumed" ? "None (no source found)" : p.status === "ours" ? "Not a finding" : "Not rated",
    date: BUILD_A,
    ...p,
  };
}

export const SITE_IDS = ["overberg", "swartland"] as const;
const PFX: Record<SiteId, "ob" | "sw"> = { overberg: "ob", swartland: "sw" };
export const sitePrefix = (s: SiteId) => PFX[s];

export const DEPTHS = ["0-5", "5-15", "15-30", "30-60", "60-100", "100-200"] as const;
export type Depth = (typeof DEPTHS)[number];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
/** The plates show June. Index into the monthly series. */
export const PLATE_MONTH = 5;

/* ------------------------------------------------------------------ */
/* Per-site raw values (Build A profile-data.js and data.js)           */
/* ------------------------------------------------------------------ */

interface SiteRaw {
  name: string; lat: number; lon: number;
  rainAnnual: { imerg: number; openmeteo: number; era5: number; meteomatics: number };
  rainMonthly: number[]; t2m: number[]; rh: number[]; evap: number[];
  wet: { surface: number[]; root: number[]; profile: number[] };
  horizons: Record<Depth, { clay: number; sand: number; ph: number }>;
  topsoil: { n: number; soilgrids: { clay: number; sand: number; ph: number }; isda: { clay: number; sand: number; ph: number } };
  elevMin: number; elevMax: number; outlinesShown: number; outlinesTotal: number;
  soilPoint: string;
}

const RAW: Record<SiteId, SiteRaw> = {
  overberg: {
    name: "Overberg", lat: -34.2, lon: 19.801,
    rainAnnual: { imerg: 441, openmeteo: 444, era5: 394, meteomatics: 394 },
    rainMonthly: [19, 14, 45, 24, 46, 83, 51, 32, 44, 33, 29, 21],
    t2m: [22.5, 22.6, 20.9, 17.7, 14.8, 11.5, 10.9, 11.2, 13.4, 16.4, 18.5, 21.1],
    rh: [59.0, 59.8, 61.9, 65.1, 68.2, 72.4, 74.2, 75.8, 72.9, 66.8, 62.5, 59.5],
    evap: [37, 31, 28, 30, 26, 28, 35, 49, 62, 69, 63, 48],
    wet: {
      surface: [31, 32, 32, 39, 42, 49, 53, 56, 53, 47, 43, 36],
      root: [39, 39, 39, 41, 43, 48, 51, 54, 52, 48, 45, 41],
      profile: [39, 39, 39, 41, 43, 47, 50, 53, 51, 47, 44, 41],
    },
    horizons: {
      "0-5": { clay: 19.1, sand: 65.1, ph: 6.6 }, "5-15": { clay: 24.2, sand: 60.8, ph: 6.7 },
      "15-30": { clay: 24.0, sand: 60.5, ph: 6.7 }, "30-60": { clay: 28.5, sand: 57.3, ph: 6.9 },
      "60-100": { clay: 32.5, sand: 54.0, ph: 7.1 }, "100-200": { clay: 32.3, sand: 53.9, ph: 7.1 },
    },
    topsoil: { n: 5, soilgrids: { clay: 22.8, sand: 63.1, ph: 6.5 }, isda: { clay: 24.1, sand: 56.9, ph: 6.7 } },
    elevMin: 151.7, elevMax: 348.1, outlinesShown: 208, outlinesTotal: 389,
    soilPoint: "Value at the site centre.",
  },
  swartland: {
    name: "Swartland", lat: -33.46, lon: 18.73,
    rainAnnual: { imerg: 377, openmeteo: 439, era5: 507, meteomatics: 325 },
    rainMonthly: [6, 7, 31, 26, 33, 92, 64, 33, 37, 15, 18, 15],
    t2m: [23.4, 23.6, 21.7, 18.7, 15.4, 12.3, 11.5, 11.7, 13.6, 16.4, 18.9, 21.7],
    rh: [55.1, 55.3, 57.7, 61.8, 70.5, 77.8, 79.8, 81.4, 78.6, 71.5, 63.8, 57.9],
    evap: [28, 18, 15, 22, 25, 35, 46, 64, 88, 106, 82, 51],
    wet: {
      surface: [25, 23, 23, 32, 40, 58, 67, 71, 68, 56, 43, 32],
      root: [34, 32, 32, 35, 40, 53, 62, 67, 65, 54, 45, 37],
      profile: [34, 33, 32, 34, 39, 51, 60, 65, 63, 53, 44, 37],
    },
    horizons: {
      "0-5": { clay: 10.3, sand: 82.2, ph: 6.2 }, "5-15": { clay: 12.0, sand: 80.7, ph: 6.1 },
      "15-30": { clay: 18.8, sand: 74.3, ph: 6.1 }, "30-60": { clay: 22.2, sand: 71.3, ph: 6.4 },
      "60-100": { clay: 22.6, sand: 70.5, ph: 6.4 }, "100-200": { clay: 25.2, sand: 67.2, ph: 6.5 },
    },
    topsoil: { n: 6, soilgrids: { clay: 10.9, sand: 81.8, ph: 6.2 }, isda: { clay: 21.5, sand: 62.0, ph: 6.2 } },
    elevMin: 80.6, elevMax: 416.8, outlinesShown: 210, outlinesTotal: 492,
    soilPoint: "Value for the largest field, because the site centre returned no data.",
  },
};

const POWER_URL = "https://power.larc.nasa.gov/docs/";
const POWER_SRC = "NASA POWER (MERRA-2) monthly climatology API";
const POWER_RES = "about 0.5 x 0.625 degree model grid";
const POWER_PERIOD = "2001-2025 monthly climatology";
const POWER_REMEDY = "Already re-fetched. To go further, compare with a local weather station record.";
const SG_URL = "https://www.isric.org/explore/soilgrids";
const RAIN_PERIOD = "2015-2024 average";
const GAUGE = "A local rain gauge record for the same years.";

function siteRows(site: SiteId): LedgerRow[] {
  const r = RAW[site], p = PFX[site], N = r.name;
  const power = (id: string, label: string, value: number[], unit: string, dp: number, caveat: string): LedgerRow =>
    row(`${p}_${id}`, site, id.startsWith("wet") ? "wetness" : "air", {
      label: `${N} ${label}`, value, unit, dp, source: POWER_SRC, url: POWER_URL, isNasa: true,
      resolution: POWER_RES, period: POWER_PERIOD, status: "checked",
      confidence: "Not rated: single model source", date: TODAY, caveat,
      remedy: POWER_REMEDY,
    });
  const rain = (id: keyof SiteRaw["rainAnnual"], label: string, source: string, isNasa: boolean, resolution: string, caveat: string): LedgerRow =>
    row(`${p}_rain_${id}`, site, "rain", {
      label: `${N} rain, ${label}`, value: r.rainAnnual[id], unit: "mm/yr", source, isNasa, resolution,
      period: RAIN_PERIOD, status: "checked", confidence: "Set by the rain-spread rule", caveat,
      url: isNasa ? "https://gpm.nasa.gov/data/imerg" : null,
      remedy: GAUGE,
    });

  const rows: LedgerRow[] = [
    row(`${p}_lat`, site, "site", {
      label: `${N} latitude of the data point`, value: r.lat, unit: "degrees", dp: 2,
      source: "Build A profile data (site centre chosen by the team)", status: "ours",
      caveat: "One point stands for the whole block.", remedy: "None needed. It is our choice of point.",
    }),
    row(`${p}_lon`, site, "site", {
      label: `${N} longitude of the data point`, value: r.lon, unit: "degrees", dp: 3,
      source: "Build A profile data (site centre chosen by the team)", status: "ours",
      caveat: "One point stands for the whole block.", remedy: "None needed. It is our choice of point.",
    }),

    rain("imerg", "NASA GPM IMERG", "NASA GPM IMERG (IMERG_PRECTOT via the NASA POWER daily API), sum of monthly averages", true, "0.1 degree grid",
      "Satellite estimate for one grid cell near the area centre, not a rain gauge. A re-fetch on 15 Nov 2026 returned missing values, so today's check could not repeat Build A's."),
    rain("openmeteo", "Open-Meteo", "Open-Meteo historical API, best-match blend (ECMWF IFS and ERA5)", false, "unverified",
      "Derived from the same ECMWF reanalysis as ERA5, so not independent of it. Model data, not gauges."),
    rain("era5", "ERA5", "ERA5 reanalysis via Open-Meteo (era5_seamless)", false, "unverified",
      "Same ECMWF reanalysis family as Open-Meteo, so not independent of it. Reanalysis, not gauges."),
    rain("meteomatics", "Meteomatics", "Meteomatics precip_24h, daily sums, nearest grid cell", false, "unverified",
      "Different provider. Model data, not gauges. Not claimed independent of ECMWF data."),

    row(`${p}_rain_monthly`, site, "rain", {
      label: `${N} monthly rain, NASA GPM IMERG`, value: r.rainMonthly, unit: "mm", source: "NASA GPM IMERG (IMERG_PRECTOT via the NASA POWER daily API)",
      url: "https://gpm.nasa.gov/data/imerg", isNasa: true, resolution: "0.1 degree grid", period: "2015-2024 monthly average",
      status: "unverified", confidence: "See rain sources",
      caveat: "Satellite estimate, not a gauge. Carried over from Build A. A re-fetch on 15 Nov 2026 returned missing values, so the monthly figures were not reproduced.",
      remedy: "Re-run the IMERG fetch when the POWER daily API serves IMERG again, and compare month by month.",
    }),

    power("t2m", "air temperature, monthly mean", r.t2m, "°C", 1,
      "Model value for a large grid cell. Not cross-checked. The POWER maximum and minimum fields were not used because they look like period extremes."),
    power("rh", "relative humidity", r.rh, "%", 1, "Model value, not cross-checked."),
    power("evap", "land evaporation", r.evap, "mm", 0, "Daily mean times days in month. Model value."),
    power("wet_surface", "soil wetness, surface", r.wet.surface, "%", 0,
      "Modelled wetness, not measured soil moisture and not NASA SMAP. One value covers many farms. The depth of the surface layer is per MERRA-2 documentation, not verified here."),
    power("wet_root", "soil wetness, root zone", r.wet.root, "%", 0,
      "Modelled wetness, not measured soil moisture and not NASA SMAP. One value covers many farms."),
    power("wet_profile", "soil wetness, whole profile", r.wet.profile, "%", 0,
      "Modelled wetness, not measured soil moisture and not NASA SMAP. One value covers many farms."),

    row(`${p}_ndvi`, site, "air", {
      label: `${N} vegetation greenness (NDVI)`, value: null, source: "NASA MODIS MOD13Q1 (not fetched)", isNasa: true,
      status: "assumed", confidence: "No data", caveat: "No data in this version. Nothing is drawn or scored from it.",
      remedy: "Fetch a MODIS MOD13Q1 series for the outlines and apply its quality flags.",
    }),
  ];

  for (const d of DEPTHS) {
    const h = r.horizons[d], key = d.replace("-", "_");
    for (const [prop, label, unit] of [["clay", "clay", "%"], ["sand", "sand", "%"], ["ph", "pH in water", ""]] as const) {
      rows.push(row(`${p}_${prop}_${key}`, site, "soil", {
        label: `${N} ${label}, ${d} cm`, value: h[prop], unit, dp: 1, source: "ISRIC SoilGrids", url: SG_URL,
        resolution: "250 m model", period: "static map", status: "unverified", confidence: "Low: first look",
        caveat: `Modelled, not measured. ${r.soilPoint} Carried over from Build A and not re-fetched today.`,
        remedy: "A laboratory soil test from the field, sampled by depth.",
      }));
    }
  }

  for (const [src, label, res] of [["soilgrids", "SoilGrids", "250 m model"], ["isda", "iSDA", "30 m model"]] as const) {
    for (const [prop, pl, unit] of [["clay", "clay", "%"], ["sand", "sand", "%"], ["ph", "pH in water", ""]] as const) {
      rows.push(row(`${p}_top_${src}_${prop}`, site, "topsoil", {
        label: `${N} topsoil ${pl}, ${label}`, value: r.topsoil[src][prop], unit, dp: 1,
        source: `${label}, median across the site's fields`, url: src === "soilgrids" ? SG_URL : "https://www.isda-africa.com/isdasoil/",
        resolution: res, period: "static map", status: "unverified", confidence: "Low where the two maps disagree",
        caveat: "A model, not a measurement. The two maps can differ by 10 points of clay or more.",
        remedy: "A laboratory soil test from the field.",
      }));
    }
  }
  rows.push(
    row(`${p}_top_n`, site, "topsoil", {
      label: `${N} fields with an iSDA value`, value: r.topsoil.n, unit: "fields", source: "Build A soil comparison (count of fields sampled)",
      status: "unverified", caveat: "A small sample of the outlines.", remedy: "Sample every outline shown.",
    }),
    row(`${p}_elev_min`, site, "terrain", {
      label: `${N} lowest point of the block`, value: r.elevMin, unit: "m", dp: 1, source: "AWS Terrain Tiles",
      url: "https://registry.opendata.aws/terrain-tiles/", resolution: "unverified", period: "static",
      status: "unverified", confidence: "Not rated", caveat: "Not a survey. Read from the baked plate; the terrain grid is not in this repository.",
      remedy: "Re-derive from the terrain tiles for the same block bounds.",
    }),
    row(`${p}_elev_max`, site, "terrain", {
      label: `${N} highest point of the block`, value: r.elevMax, unit: "m", dp: 1, source: "AWS Terrain Tiles",
      url: "https://registry.opendata.aws/terrain-tiles/", resolution: "unverified", period: "static",
      status: "unverified", confidence: "Not rated", caveat: "Not a survey. Read from the baked plate; the terrain grid is not in this repository.",
      remedy: "Re-derive from the terrain tiles for the same block bounds.",
    }),
    row(`${p}_outlines_shown`, site, "outlines", {
      label: `${N} field outlines shown`, value: r.outlinesShown, unit: "outlines", source: "Fields of the World, computer-predicted outlines",
      url: "https://fieldsofthe.world/", status: "unverified", confidence: "Not rated",
      caveat: "Predicted by a model, not surveyed. No spot-check against imagery has been published.",
      remedy: "Run and publish the planned outline spot-check against imagery.",
    }),
    row(`${p}_outlines_total`, site, "outlines", {
      label: `${N} field outlines predicted in the block`, value: r.outlinesTotal, unit: "outlines", source: "Fields of the World, computer-predicted outlines",
      url: "https://fieldsofthe.world/", status: "unverified", confidence: "Not rated",
      caveat: "Predicted by a model, not surveyed.", remedy: "Run and publish the planned outline spot-check against imagery.",
    }),
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/* Shared rows                                                          */
/* ------------------------------------------------------------------ */

const ARC_2009 = "ARC-SGI, Small-scale small grain production, 2009";
const ARC_2020 = "ARC-SGI, Guideline for production of small grains in the winter rainfall area, 2020";
const ARC_TRIAL = "ARC-SGI, 2019 and 2020";
const DAFF = "Department of Agriculture (DAFF, now DALRRD), Canola Production Guideline";
const DAFF_URL = "https://old.dalrrd.gov.za/Portals/0/Brochures and Production guidelines/Canola - Production Guideline.pdf";
const OPEN_PDF = "Open the guideline PDF, find the page and quote it.";
const SINGLE = "Medium (single source)";

const TRIAL: [string, string, string, number[]][] = [
  ["mono_mb", "Wheat monoculture", "Mouldboard", [3516, 3303, 2390]],
  ["mono_min", "Wheat monoculture", "Minimum tillage", [3724, 3640, 3105]],
  ["mono_nt", "Wheat monoculture", "No-tillage", [3744, 3973, 3363]],
  ["rot_mb", "Wheat after lupins or canola", "Mouldboard", [3098, 3038, 3093]],
  ["rot_min", "Wheat after lupins or canola", "Minimum tillage", [2864, 3408, 3159]],
  ["rot_nt", "Wheat after lupins or canola", "No-tillage", [3147, 3516, 2537]],
];

const FIELDS: [string, number][] = [["440673", 783.92], ["9", 455.19], ["440727", 281.1], ["440023", 254.2], ["70", 202.16]];

const noSource = (id: string, group: Group, label: string, remedy: string): LedgerRow =>
  row(id, "both", group, {
    label, value: null, source: "none found", status: "assumed",
    caveat: "Assumed, no source found. Not used in any score.", remedy,
  });

const shared: LedgerRow[] = [
  /* ---- rules: ours ---- */
  row("rule_spread", "global", "rule", {
    label: "Disagreement threshold", value: 15, unit: "%", source: "Our own parameter, from the team's plan notes where it was a proposal",
    status: "ours", caveat: "Spread is the highest minus the lowest value, as a share of the NASA IMERG figure. Above the threshold no single verdict is given. It is not a finding.",
    remedy: "Replace with a threshold from a published method, or test it against gauge data.",
  }),
  row("rule_soil_points", "global", "rule", {
    label: "Soil maps flagged as disagreeing", value: 10, unit: "points", source: "Our own parameter, carried over from the plate",
    status: "ours", caveat: "The plate flags clay or sand when the two soil maps are this many points apart or more.",
    remedy: "Replace with a tolerance from a soil-survey standard.",
  }),
  row("rule_min_ha", "global", "outlines", {
    label: "Smallest outline shown", value: 10, unit: "ha", source: "Our own display filter", status: "ours",
    caveat: "Smaller predicted outlines are left off the block.", remedy: "None needed. It is a display choice.",
  }),
  row("rule_half", "global", "rule", {
    label: "Share of metric cells that must be sourced before a winner is named", value: "half", source: "Our own rule",
    status: "ours", caveat: "With fewer than half of the metric cells sourced, the page names no winner and shows no score.",
    remedy: "None needed. It is a design rule.",
  }),
  row("metric_cells", "global", "rule", {
    label: "Metric cells in the comparison", value: 8, unit: "cells", source: "Our own design: four farmer metrics for each of two rotations",
    status: "ours", caveat: "Water fit, heat and dry-spell exposure, soil health contribution, bare-field days.",
    remedy: "None needed.",
  }),
  row("spotcheck_n", "global", "outlines", {
    label: "Outlines in the planned spot-check", value: 30, unit: "outlines", source: "Our own plan", status: "ours",
    caveat: "A planned sample size for checking predicted outlines against imagery. The check has not been run.",
    remedy: "Run the check and publish the result.",
  }),
  row("season_months", "global", "rule", {
    label: "Growing season used for rain", value: "May to October", source: "Our own window", status: "assumed",
    caveat: "Only the May to July sowing window is sourced.", remedy: "A sourced growing-season definition for winter wheat in the Western Cape.",
  }),

  /* ---- plate constants ---- */
  row("contour_m", "global", "terrain", {
    label: "Contour interval on the block", value: 20, unit: "m", source: "Drawing choice on the baked plate", status: "ours",
    caveat: "A drawing interval, not a property of the data.", remedy: "None needed.",
  }),
  row("exaggeration", "global", "terrain", {
    label: "Terrain height exaggeration", value: 5, unit: "times", source: "Drawing choice on the baked plate", status: "ours",
    caveat: "Heights are stretched so relief is visible. Slopes look steeper than they are.", remedy: "None needed.",
  }),
  row("clay_scale_max", "global", "soil", {
    label: "Top of the clay bar scale", value: 40, unit: "%", source: "Drawing choice on the baked plate", status: "ours",
    caveat: "The bar runs from 0 to this value.", remedy: "None needed.",
  }),
  row("wet_scale_max", "global", "wetness", {
    label: "Top of the soil wetness scale", value: 100, unit: "%", source: "Definition: percent of full wetness", status: "ours",
    caveat: "The bar runs from 0 to full wetness.", remedy: "None needed.",
  }),
  row("declination", "global", "sun", {
    label: "Solar declination on 21 June", value: 23.4, unit: "degrees", dp: 1, source: "Standard astronomy (Earth's axial tilt at the June solstice)",
    status: "unverified", caveat: "A textbook constant. No almanac was opened for it.", remedy: "Cite an astronomical almanac for the year.",
  }),

  /* ---- R1 wheat monoculture ---- */
  row("r1_water_use", "both", "r1", {
    label: "Wheat seasonal water use", value: "330 to 380", range: [330, 380], unit: "mm per season", source: ARC_2009,
    resolution: "written guideline", period: "2009 publication", status: "unverified", confidence: "Low",
    caveat: "The figure is in the source, but the passage describes summer-rainfall provinces. Unverified for the Western Cape.",
    remedy: "A seasonal water-use figure for wheat in the winter-rainfall region, from the ARC-SGI 2020 guideline.",
  }),
  row("r1_sowing", "both", "r1", {
    label: "Wheat sowing window", value: "May to July", source: ARC_2009, resolution: "winter-rainfall region as a whole",
    period: "2009 publication", status: "checked", confidence: SINGLE, caveat: "Region-wide statement, not specific to any field.",
    remedy: "A second source, or a district-level planting calendar.",
  }),
  row("r1_tillage", "both", "r1", {
    label: "Tillage in Western Cape monoculture",
    value: "150 to 200 mm deep tillage on compaction-prone soils; 75 to 100 mm tine tillage after the first autumn rain",
    source: ARC_2020, resolution: "written guideline", period: "2020 publication", status: "checked", confidence: SINGLE,
    caveat: "Tillage here mainly improves the seedbed. Which depth applies depends on the soil.", remedy: "A second source.",
  }),
  row("r1_disease", "both", "r1", {
    label: "Disease with retained stubble", value: "Take-all, crown rot, Septoria, eyespot and head blight can increase",
    source: ARC_2020, resolution: "written guideline", period: "2020 publication", status: "checked", confidence: SINGLE,
    caveat: "Applies to retained stubble under conservation tillage, because inoculum carries over. No size of effect given.",
    remedy: "A trial that reports the size of the disease effect.",
  }),
  noSource("r1_root", "r1", "Wheat root depth", "A wheat rooting depth for Western Cape soils from an extension document."),
  noSource("r1_nitrogen", "r1", "Nitrogen effect of wheat on wheat", "A nitrogen figure for wheat after wheat from an ARC-SGI or university trial."),

  /* ---- R3 break crop ---- */
  row("r3_tillage", "both", "r3", {
    label: "Tillage treatments in the trial", value: "No-tillage and minimum tillage were treatments alongside the lupin and canola rotation",
    source: ARC_TRIAL, resolution: "one trial, one site band", period: "unverified", status: "checked", confidence: SINGLE,
    caveat: "Mouldboard ploughing was also a treatment.", remedy: "The full trial report with its site and year labels.",
  }),
  noSource("r3_n_credit", "r3", "Legume nitrogen credit", "A lupin or canola nitrogen credit from the ARC-SGI 2020 guideline."),
  noSource("r3_root", "r3", "Break crop root depth", "A lupin or canola rooting depth from an extension document."),
  noSource("r3_water", "r3", "Break crop water need", "A published seasonal water use for lupin or canola in the winter-rainfall region."),
  row("r3_window", "both", "r3", {
    label: "Canola planting window", value: "April to early June for highest yield; significant yield reduction if planted after 15 June",
    source: DAFF, url: DAFF_URL, resolution: "national guideline, not specific to either site", period: "publication year not confirmed",
    status: "unverified", confidence: "Low (document not yet opened by us)",
    caveat: "Relayed from a secondary summary (Farmers Weekly) of this guideline. We could not open the PDF to quote the page. Canola only, not lupin.",
    remedy: OPEN_PDF,
  }),
  row("r3_heat", "both", "r3", {
    label: "Canola heat and drought limit at flowering",
    value: "Very susceptible to temperatures above 27 °C and to drought stress during flowering; planting in May lowers that risk",
    source: DAFF, url: DAFF_URL, resolution: "national guideline, not specific to either site", period: "publication year not confirmed",
    status: "unverified", confidence: "Low (document not yet opened by us)",
    caveat: "Relayed from a secondary summary, not checked against the PDF by us. Canola only.", remedy: OPEN_PDF,
  }),
  row("r3_planting_moisture", "both", "r3", {
    label: "Canola planting needs moist topsoil", value: "Cannot be planted when the top 5 to 7.5 cm of soil has dried out",
    source: DAFF, url: DAFF_URL, resolution: "national guideline, not specific to either site", period: "publication year not confirmed",
    status: "unverified", confidence: "Low (document not yet opened by us)",
    caveat: "Relayed from a secondary summary, not checked against the PDF by us. The modelled soil-wetness bars are a coarse model and not a measurement of the top 5 cm.",
    remedy: OPEN_PDF,
  }),

  /* ---- ARC trial ---- */
  ...TRIAL.map(([id, rotation, tillage, values]) =>
    row(`trial_${id}`, "both", "trial", {
      label: `${rotation}, ${tillage.toLowerCase()}`, value: values, unit: "kg/ha", source: ARC_TRIAL,
      resolution: "one trial, one site band", period: "column labels not available in our copy", status: "checked", confidence: SINGLE,
      caveat: "Trial wheat yields. Wheat yield only. The three column labels (year or site) are not in our copy. Not a prediction for any field.",
      remedy: "The full trial report with its column labels.",
    })),

  /* ---- scale ---- */
  row("scale_area", "both", "scale", {
    label: "Winter-rainfall region area", value: "about 1.5 million", unit: "ha", source: "Overberg Agri, LNR Project Report: Wheat, Winter Rainfall, 2020",
    resolution: "region", period: "2020 report", status: "checked", confidence: SINGLE,
    caveat: "Single source. Shows the size of the decision space only, not anything this tool changes.", remedy: "A second source, such as a national crop estimate.",
  }),
  row("scale_share", "both", "scale", {
    label: "Western Cape share of South African wheat", value: "nearly half", source: "Overberg Agri, LNR Project Report: Wheat, Winter Rainfall, 2020",
    resolution: "province", period: "2020 report", status: "checked", confidence: SINGLE,
    caveat: "Single source. Shows the size of the decision space only.", remedy: "A second source, such as a national crop estimate.",
  }),

  /* ---- five largest Overberg outlines ---- */
  ...FIELDS.map(([fid, ha]) =>
    row(`field_${fid}`, "overberg", "outlines", {
      label: `Overberg outline ${fid}, area`, value: ha, unit: "ha", dp: 2, source: "Fields of the World predicted outline, area computed in Build A",
      url: "https://fieldsofthe.world/", status: "unverified", confidence: "Not rated",
      caveat: "Area of a computer-predicted outline, not a surveyed boundary. The outline file is not in this repository.",
      remedy: "Run and publish the planned outline spot-check against imagery.",
    })),

  /* ---- source grid sizes, for the resolution exhibit ---- */
  row("res_imerg", "global", "resolution", {
    label: "NASA GPM IMERG grid cell", value: 0.1, unit: "degrees", dp: 1, source: "NASA GPM IMERG product description",
    url: "https://gpm.nasa.gov/data/imerg", isNasa: true, status: "unverified", confidence: "Not rated",
    caveat: "Carried over from Build A. The dataset page was not opened in this build.", remedy: "Open the IMERG documentation and quote the grid size.",
  }),
  row("res_merra_lat", "global", "resolution", {
    label: "MERRA-2 grid cell, north to south", value: 0.5, unit: "degrees", dp: 1, source: "NASA POWER documentation (MERRA-2 source grid)",
    url: POWER_URL, isNasa: true, status: "unverified", confidence: "Not rated",
    caveat: "Carried over from Build A. The documentation page was not opened in this build.", remedy: "Open the POWER methodology page and quote the grid size.",
  }),
  row("res_merra_lon", "global", "resolution", {
    label: "MERRA-2 grid cell, east to west", value: 0.625, unit: "degrees", dp: 3, source: "NASA POWER documentation (MERRA-2 source grid)",
    url: POWER_URL, isNasa: true, status: "unverified", confidence: "Not rated",
    caveat: "Carried over from Build A. The documentation page was not opened in this build.", remedy: "Open the POWER methodology page and quote the grid size.",
  }),
  row("res_soilgrids", "global", "resolution", {
    label: "SoilGrids cell", value: 250, unit: "m", source: "ISRIC SoilGrids documentation", url: SG_URL, status: "unverified", confidence: "Not rated",
    caveat: "Carried over from Build A. The documentation page was not opened in this build.", remedy: "Open the SoilGrids documentation and quote the cell size.",
  }),
  row("res_isda", "global", "resolution", {
    label: "iSDA soil cell", value: 30, unit: "m", source: "iSDAsoil documentation", url: "https://www.isda-africa.com/isdasoil/", status: "unverified", confidence: "Not rated",
    caveat: "Carried over from Build A. The documentation page was not opened in this build.", remedy: "Open the iSDAsoil documentation and quote the cell size.",
  }),
  row("geo_km_per_deg", "global", "resolution", {
    label: "Length of one degree of latitude", value: 111.32, unit: "km", dp: 2, source: "Standard geodesy approximation", status: "unverified",
    caveat: "A rounded constant used only to turn grid degrees into kilometres. East to west it is multiplied by the cosine of the latitude.",
    remedy: "None needed for a size comparison.",
  }),
  row("ha_per_km2", "global", "resolution", {
    label: "Hectares in a square kilometre", value: 100, unit: "ha", source: "Definition of the hectare", status: "checked",
    confidence: "Definition", caveat: "A unit definition.", remedy: "None needed.",
  }),

  /* ---- licence and app facts ---- */
  row("licence_ftw", "both", "licence", {
    label: "Fields of the World licence", value: "CC-BY-4.0, as credited on the plate", source: "Plate credit line; Fields of the World dataset page",
    url: "https://fieldsofthe.world/", status: "unverified", confidence: "Not verified", date: TODAY,
    caveat: "Not verified. The dataset page could not be reached from the build environment on 15 Nov 2026. The project's code README says the collection mixes CC-BY and non-commercial sources, so the licence for the South Africa outlines has to be read country by country.",
    remedy: "Open the Fields of the World dataset page and read the licence for the South Africa outlines.",
  }),
  row("coast", "global", "app", {
    label: "Globe land outline", value: "Natural Earth 1:110m land, public domain", source: "Natural Earth via the world-atlas package", url: "https://www.naturalearthdata.com/",
    status: "checked", confidence: "Not rated", date: TODAY, caveat: "A coarse coastline for orientation only. Not used in any figure.",
    remedy: "None needed.",
  }),
  row("gazetteer", "global", "app", {
    label: "Place search list", value: "approximate coordinates, typed in by hand", source: "Compiled by hand for this build", status: "unverified",
    confidence: "Not rated", date: TODAY, caveat: "City coordinates are rounded and were not checked against a gazetteer. They only decide which scope tier a place falls in.",
    remedy: "Replace with coordinates from an open gazetteer such as GeoNames.",
  }),
];

export const LEDGER: readonly LedgerRow[] = [...siteRows("overberg"), ...siteRows("swartland"), ...shared];

const BY_ID = new Map(LEDGER.map((r) => [r.id, r]));
if (BY_ID.size !== LEDGER.length) throw new Error("Ledger: duplicate row id");

/** Throws at build time if a row is missing: a number with no row is a build error. */
export function get(id: string): LedgerRow {
  const r = BY_ID.get(id);
  if (!r) throw new Error(`Ledger: no row "${id}"`);
  return r;
}
export const has = (id: string) => BY_ID.has(id);

export function num(id: string): number {
  const v = get(id).value;
  if (typeof v !== "number") throw new Error(`Ledger: row "${id}" is not a single number`);
  return v;
}
export function series(id: string): readonly number[] {
  const v = get(id).value;
  if (!Array.isArray(v)) throw new Error(`Ledger: row "${id}" is not a series`);
  return v as readonly number[];
}

export const SITE_NAME: Record<SiteId, string> = { overberg: "Overberg", swartland: "Swartland" };
export const SITE_ROLE: Record<SiteId, string> = { overberg: "worked example", swartland: "uncertainty example" };
export const TRIAL_IDS = TRIAL.map(([id, rotation, tillage]) => ({ id: `trial_${id}`, rotation, tillage }));
export const FIELD_IDS = FIELDS.map(([fid]) => ({ id: `field_${fid}`, fid }));
export const RAIN_PROVIDERS = [
  { key: "imerg", name: "NASA GPM IMERG", short: "IMERG", ecmwf: false },
  { key: "openmeteo", name: "Open-Meteo", short: "Open-Meteo", ecmwf: true },
  { key: "era5", name: "ERA5", short: "ERA5", ecmwf: true },
  { key: "meteomatics", name: "Meteomatics", short: "Meteomatics", ecmwf: false },
] as const;

export function rowsFor(site: SiteId): LedgerRow[] {
  return LEDGER.filter((r) => r.scope === site || r.scope === "both" || r.scope === "global");
}
export type { Status };
