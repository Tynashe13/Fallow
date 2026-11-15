/*
 * Fallow: "One place, in layers".
 * Plain script, no modules, no network. Reads window.FALLOW_PROFILE only.
 * Every figure shown comes from FALLOW_PROFILE or is computed from it here
 * (annual totals and means, spreads, differences). Panel text for unit, source,
 * NASA flag, resolution, period, confidence and caveat comes from FALLOW_PROFILE.meta.
 */
(function () {
  "use strict";
  var P = window.FALLOW_PROFILE;
  var root = document.getElementById("profile");
  if (!root) return;

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null) return;
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  if (!P || !P.sites || !P.meta || !P.months) {
    root.appendChild(el("p", { class: "pf-flag", text: "The layer data did not load, so this section is empty." }));
    return;
  }

  var M = P.meta, MONTHS = P.months, SITES = Object.keys(P.sites);
  var MINUS = "−";

  /* ---------- Geometry (px). Not to scale: equal height per soil horizon. ---------- */
  var S = 240;           // block footprint
  var H = 36;            // height of each soil horizon
  var SHEET = 6;         // thickness of air layers
  var VEG = 8;           // thickness of the vegetation layer
  var AIR_Z = { humid: 70, heat: 120, rain: 170 };   // spacing only, not heights
  var TILT_MIN = 15, TILT_MAX = 80;
  var DEF_TILT_WIDE = 56, DEF_TILT_NARROW = 40, DEF_TURN = -35;

  /* ---------- Layers ---------- */
  var L = {
    rain:    { meta: "rain_imerg_mm_month", series: "rain_imerg_mm_month", dec: 0, agg: "total", short: "Rain", u: "mm", kind: "air" },
    heat:    { meta: "t2m_c", series: "t2m_c", dec: 1, agg: "mean", short: "Heat", u: "°C", kind: "air" },
    humid:   { meta: "rh2m_pct", series: "rh2m_pct", dec: 1, agg: "mean", short: "Humidity", u: "%", kind: "air" },
    ndvi:    { meta: "ndvi_monthly", series: "ndvi_monthly", dec: 2, agg: "mean", short: "Vegetation", u: "", kind: "veg" },
    wet:     { meta: "soil_wetness_pct", dec: 0, agg: "mean", short: "Soil wetness", u: "%", kind: "wet" },
    evap:    { meta: "evaporation_mm_month", series: "evaporation_mm_month", dec: 0, agg: "total", short: "Land evaporation", u: "mm", kind: "series" },
    soil:    { meta: "soil_horizons_soilgrids", short: "Soil by depth", kind: "soil" },
    topsoil: { meta: "soil_topsoil_two_sources", short: "Topsoil, two maps", kind: "topsoil" }
  };
  var ORDER = ["rain", "heat", "humid", "ndvi", "wet", "evap", "soil", "topsoil"];
  var TOGGLES = [["rain", "Rain"], ["heat", "Heat"], ["humid", "Humidity"], ["ndvi", "Vegetation"], ["soil", "Soil by depth"]];
  var WET_NAMES = { surface: "Surface", root_zone: "Root zone", profile: "Whole profile" };
  var RAIN_SRC = [["imerg", "IMERG", false], ["openmeteo", "Open-Meteo", true], ["era5", "ERA5", true], ["meteomatics", "Meteomatics", false]];
  var RAIN_SHORT = { meteomatics: "Meteo\u00admatics" };
  var SOIL_PROPS = [["clay", "Clay", "%", 1], ["sand", "Sand", "%", 1], ["phh2o", "pH", "", 1]];

  /* ---------- Number helpers ---------- */
  function num(v) { return typeof v === "number" && isFinite(v); }
  function fmt(v, d) { return num(v) ? v.toFixed(d) : null; }
  function signed(v, d) { if (!num(v)) return null; var s = Math.abs(v).toFixed(d); return (v > 0 ? "+" : v < 0 ? MINUS : "") + s; }
  function series(siteKey, id) { var c = L[id]; return c && c.series ? P.sites[siteKey][c.series] : null; }
  function hasSeries(arr) { return Array.isArray(arr) && arr.some(num); }
  function monthVal(arr, m) { return Array.isArray(arr) && num(arr[m]) ? arr[m] : null; }
  function aggregate(arr, how) {
    if (!Array.isArray(arr)) return { value: null, n: 0, of: 0 };
    var vals = arr.filter(num);
    if (!vals.length) return { value: null, n: 0, of: arr.length };
    if (how === "total" && vals.length !== arr.length) return { value: null, n: vals.length, of: arr.length };
    var s = vals.reduce(function (a, b) { return a + b; }, 0);
    return { value: how === "total" ? s : s / vals.length, n: vals.length, of: arr.length };
  }
  function seriesMax(key) {
    var mx = null;
    SITES.forEach(function (k) {
      var a = P.sites[k][key];
      if (Array.isArray(a)) a.forEach(function (v) { if (num(v) && (mx === null || v > mx)) mx = v; });
    });
    return mx;
  }
  function unitTotal(unit) { return String(unit || "").replace(/ per month$/, ""); }
  function horizonLabel(k) { return k.replace(/cm$/, " cm"); }
  function metaOf(id) { return M[L[id].meta] || {}; }
  function or(v, fallback) { return v == null || v === "" ? fallback : String(v); }

  /* ---------- State ---------- */
  var supports3d = !!(window.CSS && CSS.supports && CSS.supports("transform-style", "preserve-3d") && CSS.supports("perspective", "1px"));
  var mqNarrow = window.matchMedia ? window.matchMedia("(max-width: 599.98px)") : { matches: false };
  var mqReduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var state = {
    site: SITES.indexOf("overberg") >= 0 ? "overberg" : SITES[0],
    month: 5,
    tilt: mqNarrow.matches ? DEF_TILT_NARROW : DEF_TILT_WIDE,
    turn: DEF_TURN,
    flat: !supports3d || mqNarrow.matches,
    userChoseView: false,
    sel: "rain",
    horizon: null,
    show: { rain: true, heat: true, humid: true, ndvi: true, soil: true }
  };
  var monthInput = $("pf-month");
  if (monthInput && num(+monthInput.value)) state.month = Math.max(0, Math.min(11, +monthInput.value));

  /* ---------- Value text ---------- */
  function shortVal(id, siteKey, m) {
    var c = L[id];
    if (id === "ndvi") {
      var nv = monthVal(series(siteKey, "ndvi"), m);
      return nv === null ? "no data in this version" : fmt(nv, c.dec);
    }
    if (id === "wet") {
      var w = P.sites[siteKey].soil_wetness_pct || {};
      return Object.keys(w).map(function (k) { var v = monthVal(w[k], m); return v === null ? "no data" : fmt(v, 0); }).join(" / ") + " %";
    }
    if (id === "soil") return Object.keys(P.sites[siteKey].soil_horizons_soilgrids || {}).length + " depths, static map";
    if (id === "topsoil") return "SoilGrids and iSDA";
    var v = monthVal(series(siteKey, id), m);
    return v === null ? "no data" : fmt(v, c.dec) + (c.u === "%" ? "%" : " " + c.u);
  }
  function yearText(id, arr, unit) {
    var c = L[id], a = aggregate(arr, c.agg);
    if (a.value === null) return a.n ? "incomplete year, not totalled" : "no data in this version";
    if (c.agg === "total") return fmt(a.value, c.dec) + " " + unitTotal(unit) + " in the year (sum of 12 months)";
    return fmt(a.value, Math.max(1, c.dec)) + " " + unit + " (mean of " + a.n + " months)";
  }

  /* ---------- Notes at the top ---------- */
  (function notes() {
    var power = ORDER.filter(function (id) { var s = metaOf(id).source; return s && s.indexOf("NASA POWER") >= 0; })
      .map(function (id) { return L[id].short.toLowerCase(); });
    var list = $("pf-notes");
    [
      "Model values, not measurements: " + (power.length > 1 ? power.slice(0, -1).join(", ") + " and " + power[power.length - 1] : power.join("")) + " come from NASA POWER.",
      "One model, not several sources: air temperature, humidity, land evaporation and all three soil-wetness values come from the same NASA POWER (MERRA-2) model, so they count as one source.",
      "Soil wetness is modelled, not measured soil moisture.",
      "Depths not to scale.",
      "Terrain and soil maps are first looks."
    ].forEach(function (t) { list.appendChild(el("li", { text: t })); });
  })();

  /* ---------- Toggles ---------- */
  var toggleBox = $("pf-toggles");
  TOGGLES.forEach(function (t) {
    var cb = el("input", { type: "checkbox", id: "pf-show-" + t[0], "data-layer": t[0] });
    cb.checked = true;
    cb.addEventListener("change", function () { state.show[t[0]] = cb.checked; applyVisibility(); });
    toggleBox.appendChild(el("label", { class: "pf-check pf-sw-" + t[0] }, [cb, el("span", { class: "pf-swatch", "aria-hidden": "true" }), t[1]]));
  });

  /* ---------- Layer list (mirrors the layers; main way in on phones) ---------- */
  var listButtons = {};
  ORDER.forEach(function (id) {
    var v = el("span", { class: "pf-lb-v" });
    var b = el("button", { type: "button", class: "pf-lb pf-sw-" + id, "data-sel": id, "aria-pressed": "false" },
      [el("span", { class: "pf-swatch", "aria-hidden": "true" }), el("span", { class: "pf-lb-n", text: or(metaOf(id).label, L[id].short) }), v]);
    b.addEventListener("click", function () { select(id, null); });
    listButtons[id] = { btn: b, val: v };
    $("pf-layerlist").appendChild(el("li", null, [b]));
  });
  function renderList() {
    ORDER.forEach(function (id) {
      listButtons[id].val.textContent = shortVal(id, state.site, state.month);
      listButtons[id].btn.setAttribute("aria-pressed", state.sel === id ? "true" : "false");
    });
  }

  /* ---------- Soil colour by clay (display scale 0 to 40% clay) ---------- */
  var CLAY_SCALE_MAX = 40;
  function clayColour(clay) {
    if (!num(clay)) return "transparent";
    var t = Math.max(0, Math.min(1, clay / CLAY_SCALE_MAX));
    var l = 76 - t * 44, s = 30 + t * 12;
    return "hsl(28, " + s.toFixed(0) + "%, " + l.toFixed(0) + "%)";
  }

  /* ---------- 3D scene ---------- */
  var stage = $("pf-stage"), scene = $("pf-scene"), rig = $("pf-rig");
  var billboards = [];
  function face(cls, w, h, tf) {
    var f = el("div", { class: "pf-face " + cls });
    f.style.width = w + "px"; f.style.height = h + "px"; f.style.transform = tf;
    return f;
  }
  function block(z0, z1, opts) {
    var g = el("div", { class: "pf-slab " + (opts.cls || ""), "data-layer": opts.layer, "data-horizon": opts.horizon || null });
    var h = z1 - z0;
    if (opts.top !== false) g.appendChild(opts.deco(face("pf-top", S, S, "translateZ(" + z1 + "px)"), "top"));
    [
      ["pf-f", "translate3d(0," + S + "px," + z1 + "px) rotateX(-90deg)"],
      ["pf-b", "translate3d(" + S + "px,0," + z1 + "px) rotateZ(180deg) rotateX(-90deg)"],
      ["pf-r", "translate3d(" + S + "px," + S + "px," + z1 + "px) rotateZ(-90deg) rotateX(-90deg)"],
      ["pf-l", "translate3d(0,0," + z1 + "px) rotateZ(90deg) rotateX(-90deg)"]
    ].forEach(function (s) { g.appendChild(opts.deco(face("pf-side " + s[0], S, h, s[1]), "side")); });
    if (opts.bottom) g.appendChild(opts.deco(face("pf-bottom", S, S, "translate3d(0," + S + "px," + z0 + "px) rotateX(180deg)"), "bottom"));
    return g;
  }
  function billboard(text, layer, side, z, horizon, aria) {
    var b = el("button", { type: "button", class: "pf-bb pf-bb-" + side + " pf-sw-" + layer, "data-layer": layer, "data-horizon": horizon || null, "aria-label": aria || null },
      [el("span", { class: "pf-swatch", "aria-hidden": "true" }), text]);
    b._z = z; b._side = side;
    billboards.push(b);
    return b;
  }

  function buildScene() {
    var keepFocus = null;
    if (document.activeElement && rig.contains(document.activeElement)) {
      keepFocus = [document.activeElement.getAttribute("data-layer"), document.activeElement.getAttribute("data-horizon")];
    }
    clear(rig); billboards = [];
    var site = P.sites[state.site], m = state.month;

    /* Soil horizons, top down, equal heights. */
    var hz = site.soil_horizons_soilgrids || {};
    var keys = Object.keys(hz);
    keys.forEach(function (k, i) {
      var d = hz[k], z1 = -i * H, z0 = -(i + 1) * H;
      var txt = "clay " + or(fmt(d.clay, 1), "n/a") + "% · sand " + or(fmt(d.sand, 1), "n/a") + "% · pH " + or(fmt(d.phh2o, 1), "n/a");
      var fill = clayColour(d.clay);
      rig.appendChild(block(z0, z1, {
        cls: "pf-soil", layer: "soil", horizon: k, top: i === 0, bottom: i === keys.length - 1,
        deco: function (f, kind) {
          f.style.backgroundColor = fill;
          if (kind === "side") f.appendChild(el("span", { class: "pf-chip" }, [el("b", { text: horizonLabel(k) }), " " + txt]));
          return f;
        }
      }));
      rig.appendChild(billboard(horizonLabel(k), "soil", "l", (z0 + z1) / 2, k,
        "Soil " + horizonLabel(k) + ": " + txt + ". Show details."));
    });

    /* Vegetation at the surface. */
    var nd = series(state.site, "ndvi"), ndv = monthVal(nd, m), ndOk = ndv !== null;
    rig.appendChild(block(0, VEG, {
      cls: "pf-veg " + (ndOk ? "pf-has" : "pf-nodata"), layer: "ndvi",
      deco: function (f) {
        if (ndOk) {
          var t = Math.max(0, Math.min(1, ndv));
          f.style.backgroundColor = "hsl(95, " + (25 + t * 30).toFixed(0) + "%, " + (78 - t * 48).toFixed(0) + "%)";
        }
        return f;
      }
    }));
    rig.appendChild(billboard("Vegetation: " + (ndOk ? "NDVI " + fmt(ndv, 2) : "no data in this version"), "ndvi", "r", VEG / 2));

    /* Air layers: humidity, heat, rain (bottom to top). Tint strength = value / highest month at either site. */
    ["humid", "heat", "rain"].forEach(function (id) {
      var c = L[id], arr = series(state.site, id), v = monthVal(arr, m), mx = seriesMax(c.series);
      var a = v !== null && num(mx) && mx > 0 ? 0.08 + 0.4 * Math.max(0, v / mx) : 0;
      var z0 = AIR_Z[id], z1 = z0 + SHEET;
      rig.appendChild(block(z0, z1, {
        cls: "pf-air pf-air-" + id + (v === null ? " pf-nodata" : ""), layer: id,
        deco: function (f, kind) {
          var tint = el("span", { class: "pf-tint" });
          tint.style.opacity = a.toFixed(2);
          f.appendChild(tint);
          if (kind === "top") f.appendChild(el("span", { class: "pf-pat" }));
          return f;
        }
      }));
      var vt = v === null ? "no data" : fmt(v, c.dec) + (c.u === "%" ? "%" : " " + c.u);
      rig.appendChild(billboard(c.short + ": " + vt, id, "r", z1));
    });

    billboards.forEach(function (b) { rig.appendChild(b); });
    applyView();
    applyVisibility();
    applySelection();
    if (keepFocus) {
      var q = '[data-layer="' + keepFocus[0] + '"]' + (keepFocus[1] ? '[data-horizon="' + keepFocus[1] + '"]' : "");
      var t = rig.querySelector("button" + q);
      if (t) t.focus({ preventScroll: true });
    }
  }

  function placeBillboards() {
    var t = state.turn * Math.PI / 180, c = S / 2, cs = Math.cos(t), sn = Math.sin(t);
    var corners = [[-c, -c], [c, -c], [-c, c], [c, c]], right = corners[0], left = corners[0], rx = -1e9, lx = 1e9;
    corners.forEach(function (p) {
      var x = p[0] * cs - p[1] * sn;
      if (x > rx) { rx = x; right = p; }
      if (x < lx) { lx = x; left = p; }
    });
    billboards.forEach(function (b) {
      var p = b._side === "r" ? right : left;
      var tf = "translate3d(" + (c + p[0]) + "px," + (c + p[1]) + "px," + b._z + "px) rotateZ(" + (-state.turn) + "deg) rotateX(" + (-state.tilt) + "deg)";
      b.style.transform = tf + (b._side === "r" ? " translate(10px,-50%)" : " translate(calc(-100% - 10px),-50%)");
    });
  }

  function fitStage() {
    if (state.flat || !stage.offsetWidth) return;
    var w = stage.clientWidth;
    var s = Math.max(0.45, Math.min(1, w / 700));
    var th = state.tilt * Math.PI / 180, half = (S / 2) * Math.SQRT2;
    var zTop = AIR_Z.rain + SHEET, zBot = -H * Object.keys(P.sites[state.site].soil_horizons_soilgrids || {}).length;
    var top = -half * Math.cos(th) - zTop * Math.sin(th), bot = half * Math.cos(th) - zBot * Math.sin(th);
    var off = -(top + bot) / 2;
    stage.style.height = Math.round((bot - top + 70) * s) + "px";
    scene.style.transform = "translate(" + (-50 * s).toFixed(1) + "px," + (off * s).toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
  }

  function applyView() {
    rig.style.transform = "rotateX(" + state.tilt + "deg) rotateZ(" + state.turn + "deg)";
    placeBillboards();
    fitStage();
    var ti = $("pf-tilt"), tu = $("pf-turn");
    ti.value = String(state.tilt); tu.value = String(state.turn);
    ti.setAttribute("aria-valuetext", Math.round(state.tilt) + " degrees");
    tu.setAttribute("aria-valuetext", Math.round(state.turn) + " degrees");
  }
  function applyVisibility() {
    Object.keys(state.show).forEach(function (id) {
      var on = state.show[id];
      Array.prototype.forEach.call(rig.querySelectorAll('[data-layer="' + id + '"]'), function (n) { n.classList.toggle("pf-off", !on); });
    });
  }
  function applySelection() {
    Array.prototype.forEach.call(rig.querySelectorAll("[data-layer]"), function (n) {
      var on = n.getAttribute("data-layer") === state.sel;
      var hz = n.getAttribute("data-horizon");
      n.classList.toggle("pf-sel", on && (!state.horizon || !hz || hz === state.horizon));
      if (n.tagName === "BUTTON") n.setAttribute("aria-pressed", on && (!state.horizon || !hz || hz === state.horizon) ? "true" : "false");
    });
    renderList();
  }

  /* ---------- Gauges: soil wetness ---------- */
  function renderGauges() {
    var box = clear($("pf-gauges")), w = P.sites[state.site].soil_wetness_pct || {}, unit = or(M.soil_wetness_pct && M.soil_wetness_pct.unit, "");
    box.appendChild(el("p", { class: "pf-gh", text: "Soil wetness, " + MONTHS[state.month] }));
    var row = el("div", { class: "pf-grow" });
    Object.keys(w).forEach(function (k) {
      var v = monthVal(w[k], state.month), name = WET_NAMES[k] || k;
      var fill = el("span", { class: "pf-gfill" });
      fill.style.height = (v === null ? 0 : Math.max(0, Math.min(100, v))) + "%";
      row.appendChild(el("div", { class: "pf-gauge" }, [
        el("div", { class: "pf-gtrack", role: "img", "aria-label": name + ": " + (v === null ? "no data" : fmt(v, 0) + " " + unit) }, [fill]),
        el("span", { class: "pf-gval", text: v === null ? "no data" : fmt(v, 0) + "%" }),
        el("span", { class: "pf-gname", text: name })
      ]));
    });
    box.appendChild(row);
    box.appendChild(el("p", { class: "pf-small", text: "Soil wetness is modelled, not measured soil moisture. 0 to 100% of full wetness. Exact depths are not verified here." }));
    var b = el("button", { type: "button", class: "pf-btn pf-btn-s", text: "Soil wetness details" });
    b.addEventListener("click", function () { select("wet", null); });
    box.appendChild(b);
  }

  /* ---------- Caption under the stage ---------- */
  (function caption() {
    var cap = $("pf-stage-cap");
    var ramp = el("span", { class: "pf-ramp", "aria-hidden": "true" });
    ramp.style.background = "linear-gradient(to right," + [0, 10, 20, 30, 40].map(function (c) { return clayColour(c); }).join(",") + ")";
    cap.appendChild(el("p", null, [el("strong", { text: "Depths not to scale. " }),
      "Each soil band is drawn the same height. The gaps between the air layers are spacing only, not heights."]));
    cap.appendChild(el("p", { class: "pf-legend" }, [el("span", { class: "pf-nw" }, ["Soil colour: ", el("span", { class: "pf-mono", text: "0%" }), " ", ramp, " ", el("span", { class: "pf-mono", text: CLAY_SCALE_MAX + "% clay" })]),
      " Darker means more clay. Air layer shade shows the month against the highest month at either site."]));
    cap.appendChild(el("p", { class: "pf-small", text: "Drag the block, or focus it and use the arrow keys, to turn and tilt it. No values change when you turn it." }));
  })();

  /* ---------- Rain sources (annual) ---------- */
  function renderRainSrc() {
    var box = clear($("pf-rainsrc")), site = P.sites[state.site], r = site.rain_annual_sources_mm || {};
    box.appendChild(el("h3", { text: "Rain for the year: four sources, one scale" }));
    var scaleMax = 0;
    SITES.forEach(function (k) { var rr = P.sites[k].rain_annual_sources_mm || {}; RAIN_SRC.forEach(function (s) { if (num(rr[s[0]]) && rr[s[0]] > scaleMax) scaleMax = rr[s[0]]; }); });
    var vals = RAIN_SRC.map(function (s) { return r[s[0]]; }).filter(num);
    if (!vals.length || !scaleMax) { box.appendChild(el("p", { text: "No annual rain sources for this site." })); return; }
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), spread = hi - lo;
    var chart = el("div", { class: "pf-colchart", role: "img",
      "aria-label": site.name + " annual rain by source: " + RAIN_SRC.map(function (s) { return s[1] + (s[2] ? " (ECMWF-derived)" : "") + " " + or(r[s[0]], "no data") + " mm"; }).join(", ") });
    var plot = el("div", { class: "pf-colplot" });
    var band = el("span", { class: "pf-band" });
    band.style.bottom = (lo / scaleMax * 100) + "%";
    band.style.height = Math.max(0.5, spread / scaleMax * 100) + "%";
    plot.appendChild(band);
    RAIN_SRC.forEach(function (s) {
      var v = r[s[0]], bar = el("span", { class: "pf-colbar pf-src-" + s[0] });
      bar.style.height = (num(v) ? v / scaleMax * 100 : 0) + "%";
      plot.appendChild(el("div", { class: "pf-col" }, [el("span", { class: "pf-colv", text: num(v) ? String(v) : "n/a" }), bar]));
    });
    chart.appendChild(plot);
    chart.appendChild(el("div", { class: "pf-colnames", "aria-hidden": "true" }, RAIN_SRC.map(function (s) { return el("span", { text: (RAIN_SHORT[s[0]] || s[1]) + (s[2] ? " *" : "") }); })));
    box.appendChild(chart);
    var imerg = r.imerg;
    box.appendChild(el("p", { class: "pf-spread" }, [
      "Spread: ", el("span", { class: "pf-mono", text: spread + " mm" }),
      num(imerg) && imerg > 0 ? ", " : "",
      num(imerg) && imerg > 0 ? el("span", { class: "pf-mono", text: (spread / imerg * 100).toFixed(1) + "%" }) : "",
      num(imerg) && imerg > 0 ? " of the IMERG figure." : ".",
      " Range " + lo + " to " + hi + " mm a year."
    ]));
    box.appendChild(el("p", { class: "pf-small", text: "* derived from the same ECMWF reanalysis, not independent. Spread is the highest minus the lowest source. The dashed band marks that range. One scale for both sites, from 0 to " + scaleMax + " mm." }));
  }

  /* ---------- Water: rain against land evaporation ---------- */
  function renderWater() {
    var box = clear($("pf-water")), site = P.sites[state.site], m = state.month;
    var rain = monthVal(site.rain_imerg_mm_month, m), ev = monthVal(site.evaporation_mm_month, m);
    var mr = M.rain_imerg_mm_month || {}, me = M.evaporation_mm_month || {};
    var mx = Math.max(seriesMax("rain_imerg_mm_month") || 0, seriesMax("evaporation_mm_month") || 0);
    box.appendChild(el("h3", { text: "Water in " + MONTHS[m] + ", indicative" }));
    function row(name, v, cls) {
      var bar = el("span", { class: "pf-hbar " + cls });
      bar.style.width = (num(v) && mx ? v / mx * 100 : 0) + "%";
      return el("div", { class: "pf-hrow" }, [el("span", { class: "pf-hname", text: name }), el("span", { class: "pf-htrack" }, [bar]), el("span", { class: "pf-hval pf-mono", text: num(v) ? v + " mm" : "no data" })]);
    }
    box.appendChild(el("div", { role: "img", "aria-label": "Rain " + or(rain, "no data") + " mm, land evaporation " + or(ev, "no data") + " mm in " + MONTHS[m] }, [
      row("Rain in", rain, "pf-src-imerg"), row("Evaporation out", ev, "pf-evapbar")
    ]));
    box.appendChild(el("p", null, ["Rain minus land evaporation: ", el("span", { class: "pf-mono", text: num(rain) && num(ev) ? signed(rain - ev, 0) + " mm" : "not computed" }), "."]));
    box.appendChild(el("p", { class: "pf-small", text: "Indicative only. Different sources, grids and periods: rain is " + or(mr.source, "source not stated") + " (" + or(mr.period, "period not stated") + "); evaporation is " + or(me.source, "source not stated") + " (" + or(me.period, "period not stated") + ")." }));
  }

  /* ---------- Topsoil: two maps ---------- */
  function renderTopsoil() {
    var box = clear($("pf-topsoil")), t = P.sites[state.site].soil_topsoil_two_sources, mt = M.soil_topsoil_two_sources || {};
    box.appendChild(el("h3", { text: or(mt.label, "Topsoil: two maps compared") }));
    box.appendChild(el("p", { class: "pf-flag-s" }, [el("strong", { text: "Two models, neither measured." })]));
    if (!t || !t.soilgrids || !t.isda) { box.appendChild(el("p", { text: "No two-map comparison for this site." })); return; }
    var tb = el("tbody");
    SOIL_PROPS.forEach(function (p) {
      var a = t.soilgrids[p[0]], b = t.isda[p[0]], d = num(a) && num(b) ? b - a : null;
      tb.appendChild(el("tr", null, [
        el("th", { scope: "row", class: "pf-nw", text: p[1] + (p[2] ? " " + p[2] : "") }),
        el("td", { class: "num", text: or(fmt(a, p[3]), "n/a") }),
        el("td", { class: "num", text: or(fmt(b, p[3]), "n/a") }),
        el("td", { class: "num pf-diff", text: d === null ? "n/a" : signed(d, p[3]) })
      ]));
    });
    var table = el("table", { class: "pf-table" }, [
      el("caption", { text: "Medians across the site's fields. iSDA values cover " + or(t.n_fields_with_isda, "an unstated number of") + " fields. Difference is iSDA minus SoilGrids. Depths differ: SoilGrids topsoil is 0 to 15 cm and iSDA topsoil is 0 to 20 cm (per our data report, not re-checked at source). The 0 to 5 cm row in the soil-by-depth list is a single point at the site centre, so it will not match these field medians." }),
      el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "Topsoil" }), el("th", { scope: "col", text: "SoilGrids" }), el("th", { scope: "col", text: "iSDA" }), el("th", { scope: "col", text: "Difference" })])]),
      tb
    ]);
    box.appendChild(el("div", { class: "table-scroll", tabindex: "0", role: "region", "aria-label": "Topsoil, two maps" }, [table]));
    /* Paired bars for clay and sand on a 0 to 100% scale. */
    var pairs = el("div", { class: "pf-pairs", "aria-hidden": "true" });
    [["clay", "Clay"], ["sand", "Sand"]].forEach(function (p) {
      [["soilgrids", "SoilGrids"], ["isda", "iSDA"]].forEach(function (src) {
        var v = t[src[0]][p[0]], bar = el("span", { class: "pf-hbar pf-pair-" + src[0] });
        bar.style.width = (num(v) ? Math.max(0, Math.min(100, v)) : 0) + "%";
        pairs.appendChild(el("div", { class: "pf-hrow" }, [el("span", { class: "pf-hname", text: p[1] + ", " + src[1] }), el("span", { class: "pf-htrack" }, [bar]), el("span", { class: "pf-hval pf-mono", text: num(v) ? fmt(v, 1) + "%" : "n/a" })]));
      });
    });
    box.appendChild(pairs);
    var b = el("button", { type: "button", class: "pf-btn pf-btn-s", text: "Two-map details" });
    b.addEventListener("click", function () { select("topsoil", null); });
    box.appendChild(b);
  }

  /* ---------- Flat view: every value for the selected month ---------- */
  function renderFlat() {
    var box = clear($("pf-flatview")), site = P.sites[state.site], m = state.month, mon = MONTHS[m];
    box.appendChild(el("h3", { text: "Flat view: " + site.name + ", " + mon }));
    var tb = el("tbody");
    function srcCell(mk) { var mm = M[mk] || {}; return or(mm.source, "not stated") + (mm.nasa === true ? " (NASA data)" : mm.nasa === false ? " (not NASA data)" : ""); }
    function addRow(label, monthText, yearTxt, unit, src) {
      tb.appendChild(el("tr", null, [el("th", { scope: "row", text: label }), el("td", { class: "num", text: monthText }), el("td", { text: yearTxt }), el("td", { text: unit }), el("td", { class: "pf-mono-s", text: src })]));
    }
    ["rain", "evap", "heat", "humid", "ndvi"].forEach(function (id) {
      var c = L[id], mm = metaOf(id), arr = series(state.site, id), v = monthVal(arr, m);
      addRow(or(mm.label, c.short), v === null ? (id === "ndvi" ? "no data in this version" : "no data") : fmt(v, c.dec), yearText(id, arr, mm.unit), or(mm.unit, ""), srcCell(c.meta));
      if (id === "evap") {
        var r = site.rain_imerg_mm_month, e = site.evaporation_mm_month, rv = monthVal(r, m), ev = monthVal(e, m);
        var ra = aggregate(r, "total"), ea = aggregate(e, "total");
        addRow("Rain minus land evaporation (indicative)", rv !== null && ev !== null ? signed(rv - ev, 0) : "not computed",
          ra.value !== null && ea.value !== null ? signed(ra.value - ea.value, 0) + " mm in the year" : "not computed", "mm",
          "Computed here from " + or((M.rain_imerg_mm_month || {}).source, "rain") + " and " + or((M.evaporation_mm_month || {}).source, "evaporation"));
      }
    });
    var w = site.soil_wetness_pct || {}, mw = M.soil_wetness_pct || {};
    Object.keys(w).forEach(function (k) {
      var v = monthVal(w[k], m);
      addRow("Soil wetness, " + (WET_NAMES[k] || k).toLowerCase(), v === null ? "no data" : fmt(v, 0), yearText("wet", w[k], mw.unit), or(mw.unit, ""), srcCell("soil_wetness_pct"));
    });
    var table = el("table", { class: "pf-table pf-flat-table" }, [
      el("caption", { text: site.name + ". Values for " + mon + " and for the year. Model and satellite values, not measurements." }),
      el("thead", null, [el("tr", null, ["Layer", mon, "Year", "Unit", "Source"].map(function (h) { return el("th", { scope: "col", text: h }); }))]),
      tb
    ]);
    box.appendChild(el("div", { class: "table-scroll", tabindex: "0", role: "region", "aria-label": "Flat view, all layers" }, [table]));

    var hz = site.soil_horizons_soilgrids || {}, ms = M.soil_horizons_soilgrids || {}, sb = el("tbody");
    Object.keys(hz).forEach(function (k) {
      sb.appendChild(el("tr", null, [el("th", { scope: "row", text: horizonLabel(k) })].concat(SOIL_PROPS.map(function (p) { return el("td", { class: "num", text: or(fmt(hz[k][p[0]], p[3]), "n/a") }); }))));
    });
    box.appendChild(el("div", { class: "table-scroll", tabindex: "0", role: "region", "aria-label": "Soil by depth" }, [el("table", { class: "pf-table" }, [
      el("caption", { text: or(ms.label, "Soil by depth") + ". " + or(ms.source, "") + ", " + or(ms.period, "") + ". Same in every month. Confidence: " + or(ms.confidence, "not stated") + "." }),
      el("thead", null, [el("tr", null, ["Depth", "Clay (%)", "Sand (%)", "pH"].map(function (h) { return el("th", { scope: "col", text: h }); }))]),
      sb
    ])]));
    box.appendChild(el("p", { class: "pf-small", text: "Rain sources, the two topsoil maps and the water panel appear below in both views. Pick a layer in the list for its source, period and caveat." }));
  }

  /* ---------- Detail panel ---------- */
  function confBadge(text) {
    var t = String(text || "not stated"), cls = /^low/i.test(t) ? "pf-conf-low" : /^not rated/i.test(t) ? "pf-conf-none" : "pf-conf-other";
    return el("span", { class: "pf-conf " + cls, text: t });
  }
  function renderDetail() {
    var id = state.sel, c = L[id], mm = metaOf(id), site = P.sites[state.site], m = state.month, mon = MONTHS[m];
    var box = clear($("pf-detail"));
    box.appendChild(el("h3", { text: or(mm.label, c.short) }));
    box.appendChild(el("p", { class: "pf-where", text: site.name + ", " + mon }));
    var dl = el("dl", { class: "pf-dl" });
    function row(k, v, cls) {
      dl.appendChild(el("dt", { text: k }));
      var dd = el("dd", { class: cls || null });
      if (v && v.nodeType) dd.appendChild(v); else dd.textContent = or(v, "not stated in the data");
      dl.appendChild(dd);
    }
    if (c.kind === "air" || c.kind === "veg" || c.kind === "series") {
      var arr = series(state.site, id), v = monthVal(arr, m);
      row("Value in " + mon, v === null ? (id === "ndvi" ? "No data in this version" : "No data") : fmt(v, c.dec) + " " + or(mm.unit, ""), "pf-mono");
      row(c.agg === "total" ? "Year (total)" : "Year (mean)", yearText(id, arr, mm.unit), "pf-mono");
    } else if (c.kind === "wet") {
      var w = site.soil_wetness_pct || {};
      Object.keys(w).forEach(function (k) {
        var wv = monthVal(w[k], m), nm = WET_NAMES[k] || k;
        row(nm + ", " + mon, wv === null ? "No data" : fmt(wv, 0) + " " + or(mm.unit, ""), "pf-mono");
        row(nm + ", year", yearText("wet", w[k], mm.unit), "pf-mono");
      });
    } else if (c.kind === "soil") {
      row("Value in " + mon, "Static map: the same in every month");
      var hz = site.soil_horizons_soilgrids || {}, tb = el("tbody");
      Object.keys(hz).forEach(function (k) {
        tb.appendChild(el("tr", { class: state.horizon === k ? "pf-hl" : null, "aria-current": state.horizon === k ? "true" : null },
          [el("th", { scope: "row", text: horizonLabel(k) })].concat(SOIL_PROPS.map(function (p) { return el("td", { class: "num", text: or(fmt(hz[k][p[0]], p[3]), "n/a") }); }))));
      });
      row("By depth", el("table", { class: "pf-table pf-mini" }, [
        el("thead", null, [el("tr", null, ["Depth", "Clay %", "Sand %", "pH"].map(function (h) { return el("th", { scope: "col", text: h }); }))]), tb]));
    } else if (c.kind === "topsoil") {
      var t = site.soil_topsoil_two_sources || {};
      row("Value in " + mon, "Static maps: the same in every month");
      SOIL_PROPS.forEach(function (p) {
        var a = t.soilgrids && t.soilgrids[p[0]], b = t.isda && t.isda[p[0]];
        row(p[1], "SoilGrids " + or(fmt(a, p[3]), "n/a") + ", iSDA " + or(fmt(b, p[3]), "n/a") + ", difference " + (num(a) && num(b) ? signed(b - a, p[3]) : "n/a"), "pf-mono");
      });
      row("Fields with iSDA values", or(t.n_fields_with_isda, null), "pf-mono");
    }
    row("Unit", mm.unit);
    row("Source", mm.source, "pf-mono");
    row("NASA data", mm.nasa === true ? "Yes" : mm.nasa === false ? "No" : null);
    row("Resolution", mm.resolution);
    row("Period", mm.period);
    row("Confidence", confBadge(mm.confidence));
    row("Caveat", mm.caveat);
    box.appendChild(dl);
    var flags = [];
    if (mm.source && mm.source.indexOf("NASA POWER") >= 0) flags.push("Model values, not measurements.");
    if (id === "wet") flags.push("Soil wetness is modelled, not measured soil moisture.");
    if (id === "soil" || id === "topsoil") flags.push("Terrain and soil maps are first looks.");
    if (id === "topsoil") flags.push("Two models, neither measured.");
    if (id === "ndvi" && !hasSeries(series(state.site, "ndvi"))) flags.push("No vegetation values in this version. Nothing is estimated in their place.");
    flags.forEach(function (f) { box.appendChild(el("p", { class: "pf-flag", text: f })); });
    if (id === "rain") box.appendChild(el("p", null, [el("a", { href: "#pf-rainsrc", text: "See the four rain sources for the year" })]));
  }

  /* ---------- Selection ---------- */
  function select(id, horizon) {
    if (!L[id]) return;
    state.sel = id;
    state.horizon = id === "soil" ? horizon || null : null;
    applySelection();
    renderDetail();
  }

  /* ---------- View mode ---------- */
  function applyMode() {
    var flat = state.flat || !supports3d;
    $("pf-view3d").hidden = flat;
    $("pf-flatview").hidden = !flat;
    root.classList.toggle("pf-is-flat", flat);
    var b = $("pf-flat");
    b.setAttribute("aria-pressed", flat ? "true" : "false");
    b.textContent = flat ? "Flat view: on" : "Flat view: off";
    if (!supports3d) { b.disabled = true; $("pf-flat-note").textContent = "This browser cannot draw the 3D view, so the flat view is shown."; }
    else $("pf-flat-note").textContent = flat ? "A plain table of every value. Turn off for the 3D view." : "Turn on for a plain table of every value.";
    if (!flat) fitStage();
  }

  /* ---------- Render all for site or month change ---------- */
  function renderAll() {
    $("pf-month-out").textContent = MONTHS[state.month];
    monthInput.setAttribute("aria-valuetext", MONTHS[state.month]);
    buildScene();
    renderGauges();
    renderWater();
    renderRainSrc();
    renderTopsoil();
    renderFlat();
    renderDetail();
    renderList();
  }

  /* ---------- Events ---------- */
  Array.prototype.forEach.call(root.querySelectorAll('input[name="pf-site"]'), function (r) {
    r.checked = r.value === state.site;
    r.addEventListener("change", function () { if (r.checked && P.sites[r.value]) { state.site = r.value; renderAll(); } });
  });
  monthInput.value = String(state.month);
  monthInput.addEventListener("input", function () { state.month = Math.max(0, Math.min(11, parseInt(monthInput.value, 10) || 0)); renderAll(); });
  $("pf-flat").addEventListener("click", function () { state.flat = !state.flat; state.userChoseView = true; applyMode(); });
  $("pf-tilt").addEventListener("input", function (e) { state.tilt = +e.target.value; applyView(); });
  $("pf-turn").addEventListener("input", function (e) { state.turn = +e.target.value; applyView(); });
  function resetView() { state.tilt = mqNarrow.matches ? DEF_TILT_NARROW : DEF_TILT_WIDE; state.turn = DEF_TURN; applyView(); }
  $("pf-reset").addEventListener("click", resetView);

  function wrapAngle(a) { a = ((a + 180) % 360 + 360) % 360 - 180; return Math.round(a); }
  function clampTilt(t) { return Math.round(Math.max(TILT_MIN, Math.min(TILT_MAX, t))); }

  stage.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowLeft") state.turn = wrapAngle(state.turn - 5);
    else if (k === "ArrowRight") state.turn = wrapAngle(state.turn + 5);
    else if (k === "ArrowUp") state.tilt = clampTilt(state.tilt + 3);
    else if (k === "ArrowDown") state.tilt = clampTilt(state.tilt - 3);
    else return;
    e.preventDefault();
    applyView();
  });

  var drag = null, suppressClick = false;
  stage.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    suppressClick = false;
    drag = { x: e.clientX, y: e.clientY, tilt: state.tilt, turn: state.turn, id: e.pointerId, moved: false };
  });
  stage.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    if (!drag.moved) { drag.moved = true; try { stage.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ } stage.classList.add("pf-dragging"); }
    state.turn = wrapAngle(drag.turn + dx * 0.5);
    state.tilt = clampTilt(drag.tilt - dy * 0.3);
    applyView();
  });
  function endDrag() { if (!drag) return; if (drag.moved) suppressClick = true; drag = null; stage.classList.remove("pf-dragging"); }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("click", function (e) {
    if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
    var t = e.target && e.target.closest ? e.target.closest("[data-layer]") : null;
    if (t && rig.contains(t)) select(t.getAttribute("data-layer"), t.getAttribute("data-horizon"));
  });

  function onNarrowChange() {
    if (!state.userChoseView) { state.flat = !supports3d || mqNarrow.matches; applyMode(); }
    resetView();
  }
  if (mqNarrow.addEventListener) mqNarrow.addEventListener("change", onNarrowChange);
  else if (mqNarrow.addListener) mqNarrow.addListener(onNarrowChange);
  var rz = null;
  window.addEventListener("resize", function () { if (rz) clearTimeout(rz); rz = setTimeout(fitStage, 100); });
  root.classList.toggle("pf-reduce", !!mqReduce.matches);

  renderAll();
  applyMode();
})();
