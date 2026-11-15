/*
 * INTERIM, to be replaced by the data lane's data/packaged output.
 *
 * Every number here traces to a repo file under data/shared/ or to a fact
 * given in the page-lane brief (ARC-SGI facts, ARC trial table, scale lines).
 * Contract per figure: value, unit, source, source_is_nasa, resolution
 * (or "unverified"), period, confidence, caveat, status
 * (checked / unverified / assumption).
 *
 * Confidence wording used for documents (our rule, not a source's):
 *   checked single document -> "Medium (single source)"
 *   unverified for this site -> "Low"
 *   assumption               -> "None (no source found)"
 * Rain confidence comes from the disagreement rule in `rule` below.
 */
window.FALLOW_DATA = {
  interim: true,

  rule: {
    // Spread = (highest - lowest) as a share of the NASA IMERG figure.
    // 15% is taken from docs/PLAN_scoring_and_data_confidence.md (B1), where it is
    // marked as a proposal. Above it the page withholds a single verdict.
    disagree_threshold_pct: 15,
    // Confidence when sources agree is capped at Medium: all four are models or
    // reanalyses, not gauges, and two share ECMWF origin.
    agree_confidence: "Medium",
    disagree_confidence: "Low"
  },

  figures: {
    /* ---------- Rain, Overberg (mm per year, 2015-2024 average) ---------- */
    ob_rain_imerg: {
      label: "Overberg rain, NASA GPM IMERG", site: "overberg", group: "rain", provider: "imerg",
      value: 441, unit: "mm/yr",
      source: "NASA GPM IMERG (IMERG_PRECTOT via NASA POWER daily API); data/shared/exp3d_climate.json (sum of monthly averages)",
      source_is_nasa: true, resolution: "0.1 degree grid", period: "2015-2024 average",
      caveat: "Satellite estimate for one grid cell near the area centre, not a rain gauge.",
      status: "checked"
    },
    ob_rain_openmeteo: {
      label: "Overberg rain, Open-Meteo", site: "overberg", group: "rain", provider: "openmeteo",
      value: 444, unit: "mm/yr",
      source: "Open-Meteo historical API, best-match blend (ECMWF IFS and ERA5); data/shared/rain_crosscheck_era5_v4.json",
      source_is_nasa: false, resolution: "unverified", period: "2015-2024 average",
      caveat: "Derived from the same ECMWF reanalysis as ERA5, so not independent of it. Model data, not gauges.",
      status: "checked"
    },
    ob_rain_era5: {
      label: "Overberg rain, ERA5", site: "overberg", group: "rain", provider: "era5",
      value: 394, unit: "mm/yr",
      source: "ERA5 reanalysis via Open-Meteo (era5_seamless); data/shared/rain_crosscheck_era5_v4.json",
      source_is_nasa: false, resolution: "unverified", period: "2015-2024 average",
      caveat: "Same ECMWF reanalysis family as Open-Meteo, so not independent of it. Reanalysis, not gauges.",
      status: "checked"
    },
    ob_rain_meteomatics: {
      label: "Overberg rain, Meteomatics", site: "overberg", group: "rain", provider: "meteomatics",
      value: 394, unit: "mm/yr",
      source: "Meteomatics precip_24h, daily sums, nearest grid cell; data/shared/rain_crosscheck_meteomatics_v4.json",
      source_is_nasa: false, resolution: "unverified", period: "2015-2024 average",
      caveat: "Different provider. Model data, not gauges. Not claimed independent of ECMWF data.",
      status: "checked"
    },

    /* ---------- Rain, Swartland (mm per year, 2015-2024 average) ---------- */
    sw_rain_imerg: {
      label: "Swartland rain, NASA GPM IMERG", site: "swartland", group: "rain", provider: "imerg",
      value: 377, unit: "mm/yr",
      source: "NASA GPM IMERG (IMERG_PRECTOT via NASA POWER daily API); data/shared/exp3d_climate.json (sum of monthly averages)",
      source_is_nasa: true, resolution: "0.1 degree grid", period: "2015-2024 average",
      caveat: "Satellite estimate for one grid cell near the area centre, not a rain gauge.",
      status: "checked"
    },
    sw_rain_openmeteo: {
      label: "Swartland rain, Open-Meteo", site: "swartland", group: "rain", provider: "openmeteo",
      value: 439, unit: "mm/yr",
      source: "Open-Meteo historical API, best-match blend (ECMWF IFS and ERA5); data/shared/rain_crosscheck_era5_v4.json",
      source_is_nasa: false, resolution: "unverified", period: "2015-2024 average",
      caveat: "Derived from the same ECMWF reanalysis as ERA5, so not independent of it. Model data, not gauges.",
      status: "checked"
    },
    sw_rain_era5: {
      label: "Swartland rain, ERA5", site: "swartland", group: "rain", provider: "era5",
      value: 507, unit: "mm/yr",
      source: "ERA5 reanalysis via Open-Meteo (era5_seamless); data/shared/rain_crosscheck_era5_v4.json",
      source_is_nasa: false, resolution: "unverified", period: "2015-2024 average",
      caveat: "Same ECMWF reanalysis family as Open-Meteo, so not independent of it. Reanalysis, not gauges.",
      status: "checked"
    },
    sw_rain_meteomatics: {
      label: "Swartland rain, Meteomatics", site: "swartland", group: "rain", provider: "meteomatics",
      value: 325, unit: "mm/yr",
      source: "Meteomatics precip_24h, daily sums, nearest grid cell; data/shared/rain_crosscheck_meteomatics_v4.json",
      source_is_nasa: false, resolution: "unverified", period: "2015-2024 average",
      caveat: "Different provider. Model data, not gauges. Not claimed independent of ECMWF data.",
      status: "checked"
    },

    /* ---------- R1 wheat monoculture ---------- */
    r1_water_use: {
      label: "Wheat seasonal water use", group: "r1",
      value: "330 to 380", min: 330, max: 380, unit: "mm per season",
      source: "ARC-SGI, Small-scale small grain production, 2009",
      source_is_nasa: false, resolution: "not applicable (written guideline)", period: "2009 publication",
      confidence: "Low",
      caveat: "Figure is verified in the source, but the passage describes summer-rainfall provinces. Unverified for Overberg.",
      status: "unverified"
    },
    r1_sowing: {
      label: "Wheat sowing window", group: "r1",
      value: "May to July", unit: "months",
      source: "ARC-SGI, Small-scale small grain production, 2009",
      source_is_nasa: false, resolution: "winter-rainfall region as a whole", period: "2009 publication",
      confidence: "Medium (single source)",
      caveat: "Region-wide statement, not specific to any field.",
      status: "checked"
    },
    r1_tillage: {
      label: "Tillage in Western Cape monoculture", group: "r1",
      value: "150 to 200 mm deep tillage on compaction-prone soils; 75 to 100 mm tine tillage after the first autumn rain", unit: "mm depth",
      source: "ARC-SGI, Guideline for production of small grains in the winter rainfall area, 2020",
      source_is_nasa: false, resolution: "not applicable (written guideline)", period: "2020 publication",
      confidence: "Medium (single source)",
      caveat: "Tillage here mainly improves the seedbed. Which depth applies depends on the soil.",
      status: "checked"
    },
    r1_disease: {
      label: "Disease with retained stubble", group: "r1",
      value: "Take-all, crown rot, Septoria, eyespot and head blight can increase", unit: "qualitative",
      source: "ARC-SGI, Guideline for production of small grains in the winter rainfall area, 2020",
      source_is_nasa: false, resolution: "not applicable (written guideline)", period: "2020 publication",
      confidence: "Medium (single source)",
      caveat: "Applies to retained stubble under conservation tillage, because inoculum carries over. No size of effect given.",
      status: "checked"
    },
    r1_root: {
      label: "Wheat root depth", group: "r1",
      value: null, unit: "",
      source: "none found", source_is_nasa: false, resolution: "unverified", period: "unverified",
      confidence: "None (no source found)",
      caveat: "Assumed, no source found. Not used in any score. To settle it: a wheat rooting depth for Western Cape soils from an extension document.",
      status: "assumption"
    },
    r1_nitrogen: {
      label: "Nitrogen effect of wheat on wheat", group: "r1",
      value: null, unit: "",
      source: "none found", source_is_nasa: false, resolution: "unverified", period: "unverified",
      confidence: "None (no source found)",
      caveat: "Assumed, no source found. Not used in any score. To settle it: a nitrogen figure for wheat after wheat from an ARC-SGI or university trial.",
      status: "assumption"
    },

    /* ---------- R3 lupin or canola break crop, reduced tillage ---------- */
    r3_trial: {
      label: "ARC trial wheat yields (table below)", group: "r3",
      value: "see table", unit: "kg/ha",
      source: "ARC-SGI, 2019 and 2020",
      source_is_nasa: false, resolution: "one trial, one site band", period: "column labels not available in our copy",
      confidence: "Medium (single source)",
      caveat: "Verified as trial yields. Wheat yield only. Not a prediction for any field.",
      status: "checked"
    },
    r3_tillage: {
      label: "Tillage treatments in the trial", group: "r3",
      value: "No-tillage and minimum tillage were treatments alongside the lupin and canola rotation", unit: "qualitative",
      source: "ARC-SGI, 2019 and 2020",
      source_is_nasa: false, resolution: "one trial, one site band", period: "unverified",
      confidence: "Medium (single source)",
      caveat: "Mouldboard ploughing was also a treatment.",
      status: "checked"
    },
    r3_n_credit: {
      label: "Legume nitrogen credit", group: "r3",
      value: null, unit: "", source: "none found", source_is_nasa: false,
      resolution: "unverified", period: "unverified", confidence: "None (no source found)",
      caveat: "Assumed, no source found. Not used in any score. To settle it: a lupin or canola nitrogen credit from the ARC-SGI 2020 guideline.", status: "assumption"
    },
    r3_root: {
      label: "Break crop root depth", group: "r3",
      value: null, unit: "", source: "none found", source_is_nasa: false,
      resolution: "unverified", period: "unverified", confidence: "None (no source found)",
      caveat: "Assumed, no source found. Not used in any score. To settle it: a lupin or canola rooting depth from an extension document.", status: "assumption"
    },
    r3_water: {
      label: "Break crop water need", group: "r3",
      value: null, unit: "", source: "none found", source_is_nasa: false,
      resolution: "unverified", period: "unverified", confidence: "None (no source found)",
      caveat: "Assumed, no source found. Not used in any score. To settle it: a published seasonal water use for lupin or canola in the winter-rainfall region.", status: "assumption"
    },
    r3_window: {
      label: "Canola planting window", group: "r3",
      value: "April to early June for highest yield; significant yield reduction if planted after 15 June", unit: "",
      source: "Department of Agriculture (DAFF, now DALRRD), Canola Production Guideline. https://old.dalrrd.gov.za/Portals/0/Brochures and Production guidelines/Canola - Production Guideline.pdf",
      source_is_nasa: false, resolution: "national guideline, not specific to Overberg", period: "publication year not confirmed",
      confidence: "Low (document not yet opened by us)",
      caveat: "Relayed from a secondary summary (Farmers Weekly) of this guideline. We could not open the PDF to quote the page. Canola only, not lupin. A second, non-ARC-SGI source.",
      status: "unverified"
    },
    r3_heat: {
      label: "Canola heat and drought limit at flowering", group: "r3",
      value: "Very susceptible to temperatures above 27 C and to drought stress during flowering; planting in May lowers that risk", unit: "",
      source: "Department of Agriculture (DAFF, now DALRRD), Canola Production Guideline. https://old.dalrrd.gov.za/Portals/0/Brochures and Production guidelines/Canola - Production Guideline.pdf",
      source_is_nasa: false, resolution: "national guideline, not specific to Overberg", period: "publication year not confirmed",
      confidence: "Low (document not yet opened by us)",
      caveat: "Relayed from a secondary summary, not checked against the PDF by us. National guideline, so not specific to Overberg. Canola only.",
      status: "unverified"
    },
    r3_planting_moisture: {
      label: "Canola planting needs moist topsoil", group: "r3",
      value: "Cannot be planted when the top 5 to 7.5 cm of soil has dried out", unit: "",
      source: "Department of Agriculture (DAFF, now DALRRD), Canola Production Guideline. https://old.dalrrd.gov.za/Portals/0/Brochures and Production guidelines/Canola - Production Guideline.pdf",
      source_is_nasa: false, resolution: "national guideline, not specific to Overberg", period: "publication year not confirmed",
      confidence: "Low (document not yet opened by us)",
      caveat: "Relayed from a secondary summary, not checked against the PDF by us. Links to the modelled soil-wetness bars in the layers section, which are a coarse model and not a measurement of the top 5 cm.",
      status: "unverified"
    },

    /* ---------- Scale lines ---------- */
    scale_area: {
      label: "Winter-rainfall region area", group: "scale",
      value: "about 1.5 million", unit: "ha",
      source: "Overberg Agri, LNR Project Report: Wheat, Winter Rainfall, 2020",
      source_is_nasa: false, resolution: "region", period: "2020 report",
      confidence: "Medium (single source)",
      caveat: "Single source. Shows the size of the decision space only, not anything this tool changes.",
      status: "checked"
    },
    scale_share: {
      label: "Western Cape share of South African wheat", group: "scale",
      value: "nearly half", unit: "share",
      source: "Overberg Agri, LNR Project Report: Wheat, Winter Rainfall, 2020",
      source_is_nasa: false, resolution: "province", period: "2020 report",
      confidence: "Medium (single source)",
      caveat: "Single source. Shows the size of the decision space only, not anything this tool changes.",
      status: "checked"
    }
  },

  rain: {
    providers: {
      imerg:       { name: "NASA GPM IMERG", nasa: true,  ecmwf: false },
      openmeteo:   { name: "Open-Meteo",     nasa: false, ecmwf: true },
      era5:        { name: "ERA5",           nasa: false, ecmwf: true },
      meteomatics: { name: "Meteomatics",    nasa: false, ecmwf: false }
    },
    sites: {
      overberg:  { name: "Overberg",  ids: ["ob_rain_imerg", "ob_rain_openmeteo", "ob_rain_era5", "ob_rain_meteomatics"] },
      swartland: { name: "Swartland", ids: ["sw_rain_imerg", "sw_rain_openmeteo", "sw_rain_era5", "sw_rain_meteomatics"] }
    }
  },

  trial: {
    source: "ARC-SGI, 2019 and 2020",
    unit: "kg/ha",
    columns_note: "Each row has three values. Their column labels (year or site) are not available in our copy.",
    rows: [
      { rotation: "Wheat monoculture", tillage: "Mouldboard",      values: [3516, 3303, 2390] },
      { rotation: "Wheat monoculture", tillage: "Minimum tillage", values: [3724, 3640, 3105] },
      { rotation: "Wheat monoculture", tillage: "No-tillage",      values: [3744, 3973, 3363] },
      { rotation: "Wheat after lupins or canola", tillage: "Mouldboard",      values: [3098, 3038, 3093] },
      { rotation: "Wheat after lupins or canola", tillage: "Minimum tillage", values: [2864, 3408, 3159] },
      { rotation: "Wheat after lupins or canola", tillage: "No-tillage",      values: [3147, 3516, 2537] }
    ]
  },

  rotations: {
    r1: { name: "R1 Wheat monoculture", sub: "Stubble retained or grazed",
          facts: ["r1_water_use", "r1_sowing", "r1_tillage", "r1_disease", "r1_root", "r1_nitrogen"] },
    r3: { name: "R3 Lupin or canola break crop", sub: "With reduced tillage",
          facts: ["r3_trial", "r3_tillage", "r3_n_credit", "r3_root", "r3_water", "r3_window", "r3_heat", "r3_planting_moisture"] }
  },

  /*
   * Farmer metrics. A sub-score exists only where a sourced input exists.
   * R1 water fit is the only one: it compares Overberg annual rain (four
   * sources) with the 330 to 380 mm wheat water-use range using the rule
   * below. The rule and its levels are ours, not from a source.
   */
  metrics: [
    { id: "water", name: "Water fit",
      r1: { scored: false, missing: "Needs a sourced water-use figure for the Overberg. The 330 to 380 mm figure comes from a passage about summer-rainfall provinces, so we do not score it." },
      r3: { scored: false, missing: "Break crop water need: no source found. To settle it: a published seasonal water use for lupin or canola in the winter-rainfall region, for example in the ARC-SGI 2020 small-grains guideline." } },
    { id: "heat", name: "Heat and dry-spell exposure",
      r1: { scored: false, missing: "No sourced heat or dry-spell threshold for wheat here. To settle it: a wheat heat and dry-spell limit for the Western Cape from the ARC-SGI 2020 guideline." },
      r3: { scored: false, missing: "A canola heat and drought-at-flowering limit has been reported from a government guideline but we have not opened the document, so it is unverified and not scored. To settle it: read the guideline page and quote it." } },
    { id: "soil", name: "Soil health contribution",
      r1: { scored: false, missing: "Disease carry-over is sourced, but no size of effect. Nitrogen effect assumed. To settle it: the size of the disease effect and a nitrogen figure from a trial or extension document." },
      r3: { scored: false, missing: "Nitrogen credit and root depth: no source found. To settle it: lupin or canola nitrogen credit and rooting depth from the ARC-SGI 2020 wheat-legume rotation section." } },
    { id: "bare", name: "Bare-field days",
      r1: { scored: false, missing: "Needs a NASA vegetation series. Not included in this version." },
      r3: { scored: false, missing: "Needs a NASA vegetation series. Not included in this version." } }
  ],

  /* Five largest Overberg outlines by area, from data/shared/fields_compiled.csv.
     Areas are computed from predicted outlines (Fields of the World). */
  fields: [
    { id: "440673", ha: 783.92 },
    { id: "9",      ha: 455.19 },
    { id: "440727", ha: 281.1 },
    { id: "440023", ha: 254.2 },
    { id: "70",     ha: 202.16 }
  ]
};

/* Rain confidence and spread, derived from the disagreement rule above. */
(function (d) {
  Object.keys(d.rain.sites).forEach(function (key) {
    var site = d.rain.sites[key];
    var vals = site.ids.map(function (id) { return d.figures[id].value; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var imerg = d.figures[site.ids[0]].value;
    site.low = lo; site.high = hi; site.spread = hi - lo;
    site.spread_pct = Math.round((hi - lo) / imerg * 1000) / 10;
    site.agree = site.spread_pct <= d.rule.disagree_threshold_pct;
    site.confidence = site.agree ? d.rule.agree_confidence : d.rule.disagree_confidence;
    site.ids.forEach(function (id) {
      d.figures[id].confidence = site.confidence;
      d.figures[id].spread = lo + " to " + hi + " mm (" + (hi - lo) + " mm, " + site.spread_pct + "% of IMERG)";
    });
  });
})(window.FALLOW_DATA);
