(function () {
  "use strict";
  var D = window.FALLOW_DATA;
  var F = D.figures;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function $(id) { return document.getElementById(id); }
  var STATUS_LABEL = { checked: "checked", unverified: "unverified", assumption: "assumed, no source found" };
  function statusTag(s) { return el("span", { class: "status status-" + s, text: STATUS_LABEL[s] }); }
  function valueText(f) {
    if (f.value === null) return "No figure";
    if (typeof f.value === "number") return f.value + " " + f.unit;
    if (f.unit === "mm per season" || f.unit === "ha") return f.value + " " + f.unit;
    return f.value;
  }

  if (D.interim) $("interim-note").hidden = false;

  /* ---------- B. Rotation cards ---------- */
  Object.keys(D.rotations).forEach(function (key) {
    var r = D.rotations[key];
    var list = el("ul", { class: "facts" });
    r.facts.forEach(function (id) {
      var f = F[id];
      list.appendChild(el("li", { class: "fact fact-" + f.status }, [
        el("div", { class: "fact-head" }, [el("span", { class: "fact-label", text: f.label }), statusTag(f.status)]),
        el("p", { class: "fact-value", text: valueText(f) }),
        el("p", { class: "fact-src", text: "Source: " + f.source }),
        el("p", { class: "fact-cav", text: f.caveat })
      ]));
    });
    $("rotation-cards").appendChild(el("article", { class: "panel rot rot-" + key, "aria-label": r.name }, [
      el("h3", { text: r.name }), el("p", { class: "sub", text: r.sub }), list
    ]));
  });

  /* ---------- C. Trial table ---------- */
  var T = D.trial;
  $("trial-source").textContent = T.source;
  $("trial-cols").textContent = T.columns_note;
  var mono = T.rows.filter(function (r) { return r.rotation === "Wheat monoculture"; });
  var rot = T.rows.filter(function (r) { return r.rotation !== "Wheat monoculture"; });
  var lower = 0, cells = 0;
  rot.forEach(function (r) {
    var m = mono.filter(function (x) { return x.tillage === r.tillage; })[0];
    r.lowerFlags = r.values.map(function (v, i) { cells++; var lo = v < m.values[i]; if (lo) lower++; return lo; });
  });
  var table = $("trial-table");
  table.appendChild(el("caption", { text: "ARC trial, wheat yield (kg/ha). Shaded cells: wheat after the break crop yielded less than the matching monoculture cell." }));
  table.appendChild(el("thead", null, [el("tr", null, [
    el("th", { scope: "col", text: "Rotation" }), el("th", { scope: "col", text: "Tillage" }),
    el("th", { scope: "col", text: "Value 1 (label n/a)" }), el("th", { scope: "col", text: "Value 2 (label n/a)" }),
    el("th", { scope: "col", text: "Value 3 (label n/a)" })
  ])]));
  var tb = el("tbody");
  T.rows.forEach(function (r) {
    var tr = el("tr", null, [el("th", { scope: "row", text: r.rotation }), el("td", { text: r.tillage })]);
    r.values.forEach(function (v, i) {
      var low = r.lowerFlags && r.lowerFlags[i];
      tr.appendChild(el("td", { class: "num" + (low ? " lower" : ""), text: String(v) + (low ? " (lower)" : "") }));
    });
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  [
    "One trial, one site band, wheat yield only.",
    "Wheat after the break crop yielded less than monoculture in " + lower + " of the " + cells + " cells.",
    "The table leaves out the break crop's own income, any disease relief and any nitrogen credit.",
    "It is not a prediction for any field and not proof that rotation wins."
  ].forEach(function (t) { $("trial-notes").appendChild(el("li", { text: t })); });

  /* ---------- Plain answer (first screen) ---------- */
  (function () {
    var ob = D.rain.sites.overberg, sw = D.rain.sites.swartland;
    [
      "The one sourced trial (ARC-SGI) shows wheat yielding less after a break crop in " + lower + " of " + cells + " cells. It counts wheat yield only, not the break crop's income, disease relief or nitrogen credit.",
      "Most of what would decide it has no source we could find: the break crop's water need, its nitrogen credit and root depth.",
      "Overberg rain sources agree within about " + Math.round(ob.spread_pct) + "% (" + ob.low + " to " + ob.high + " mm a year). In the Swartland they are " + sw.spread + " mm a year apart, so rain alone cannot settle a choice there."
    ].forEach(function (t) { $("answer-why").appendChild(el("li", { text: t })); });
    $("nasa-lead").textContent = "NASA data on this page: GPM IMERG satellite rainfall (" + F.ob_rain_imerg.resolution + "). Three non-NASA sources cross-check it. The layers section also uses NASA POWER (MERRA-2) model values for temperature, humidity, evaporation and soil wetness. No MODIS vegetation values are in this version.";
  })();

  /* ---------- A1. What would change the answer (conditional ranges, computed from the data files) ---------- */
  (function () {
    var P = window.FALLOW_PROFILE;
    var sitesBox = $("change-sites"), trialBox = $("change-trial");
    if (!sitesBox || !trialBox || !P) return;
    var TH = D.rule.disagree_threshold_pct;
    var SEASON = [4, 5, 6, 7, 8, 9]; // May to October, month indices; our window
    var MINUS = "−";
    function ours() { return el("span", { class: "status status-ours", text: "our threshold, not from a source" }); }
    function r0(x) { return Math.round(x); }
    function r1(x) { return Math.round(x * 10) / 10; }
    function sgn(x) { return (x > 0 ? "+" : x < 0 ? MINUS : "") + Math.abs(x); }
    function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
    function work(lines) {
      var u = el("ul");
      lines.forEach(function (t) { u.appendChild(el("li", null, typeof t === "string" ? [t] : t)); });
      return el("div", { class: "working" }, [el("p", { class: "working-h", text: "Inputs and arithmetic" }), u]);
    }
    function block(title, conds, lines) {
      var u = el("ul");
      conds.forEach(function (c) { u.appendChild(el("li", null, c)); });
      return el("div", { class: "cond" }, [el("h4", { text: title }), u, work(lines)]);
    }

    function rainBlock(key) {
      var s = D.rain.sites[key], m = P.sites[key].rain_imerg_mm_month;
      var annual = sum(m), seasonMm = sum(SEASON.map(function (i) { return m[i]; }));
      var share = seasonMm / annual;
      var src = s.ids.map(function (id) {
        var f = F[id];
        return { name: D.rain.providers[f.provider].name, annual: f.value, season: r0(f.value * share) };
      });
      var sv = src.map(function (x) { return x.season; });
      var lo = Math.min.apply(null, sv), hi = Math.max.apply(null, sv);
      var cut1 = r0(lo + (hi - lo) / 3), cut2 = r0(lo + 2 * (hi - lo) / 3);
      var wu = F.r1_water_use, reach = sv.filter(function (v) { return v >= wu.min; }).length;
      var wuText;
      if (hi < wu.min) wuText = "all four season estimates (" + lo + " to " + hi + " mm) fall short of " + wu.min + " mm, by " + (wu.min - hi) + " to " + (wu.min - lo) + " mm. Any rest would have to come from stored soil water, which no source here gives. ";
      else if (lo >= wu.min) wuText = "all four season estimates (" + lo + " to " + hi + " mm) reach " + wu.min + " mm. ";
      else wuText = reach + " of 4 season estimates reach " + wu.min + " mm (range " + lo + " to " + hi + " mm), so the sources do not agree on whether wheat's water need is met from rain alone. ";
      var conds = [
        [el("strong", { text: "If May to October rain falls in the lower third of the four sources (below about " + cut1 + " mm): " }), ours(),
          " water is the main risk for a break crop. Its water need has no source", statusTag("assumption"),
          "; canola is reported very susceptible to drought stress during flowering", statusTag("unverified"), "."],
        [el("strong", { text: "In the middle third (" + cut1 + " to " + cut2 + " mm): " }), ours(),
          " rain does not separate the two rotations. The trial gap below and the missing nitrogen and disease figures decide it."],
        [el("strong", { text: "In the upper third (above about " + cut2 + " mm): " }), ours(),
          " the wheat-on-wheat disease carry-over matters more. Retained stubble can increase take-all, crown rot, Septoria, eyespot and head blight", statusTag("checked"),
          ", with no size of effect given. That a wetter season makes this worse:", statusTag("assumption"), "."],
        s.agree
          ? ["Under our " + TH + "% rain-spread rule", ours(), " the four sources agree here (annual spread " + s.spread_pct + "%). The lower and upper ends are only " + (hi - lo) + " mm apart in season, so the three statements sit close together."]
          : ["Under our " + TH + "% rain-spread rule", ours(), " the sources disagree here (annual spread " + s.spread_pct + "%). The lower and upper ends are " + (hi - lo) + " mm apart in season, so the data cannot say which statement fits a normal season. A local rain gauge record would."],
        ["Against the wheat water-use figure of " + wu.value + " " + wu.unit, statusTag("unverified"), " (from a passage on summer-rainfall provinces): " + wuText, "Stored soil water:", statusTag("assumption"), "."]
      ];
      var lines = [
        "NASA GPM IMERG monthly rain, May to October: " + SEASON.map(function (i) { return m[i]; }).join(" + ") + " = " + seasonMm + " mm, of " + annual + " mm a year (" + r1(share * 100) + "%).",
        ["May to October as the growing season is our window", statusTag("assumption"), "; only the May to July sowing window is sourced", statusTag("checked"), "."],
        ["Season estimate per source = annual figure × " + r1(share * 100) + "%, assuming all four sources share IMERG's monthly pattern", statusTag("assumption"), ": " +
          src.map(function (x) { return x.name + " " + x.annual + " × " + (Math.round(share * 1000) / 1000) + " = " + x.season; }).join("; ") + " mm."],
        "Lower-third edge = " + lo + " + (" + hi + " " + MINUS + " " + lo + ") ÷ 3 = " + cut1 + " mm. Upper-third edge = " + lo + " + 2 × (" + hi + " " + MINUS + " " + lo + ") ÷ 3 = " + cut2 + " mm.",
        "Annual spread = (" + s.high + " " + MINUS + " " + s.low + ") ÷ " + F[s.ids[0]].value + " (IMERG) = " + s.spread_pct + "%; our threshold is " + TH + "%."
      ];
      return block("Rain in the growing season", conds, lines);
    }

    function moistureBlock(key) {
      var w = P.sites[key].soil_wetness_pct.surface, mo = P.months;
      var idx = [3, 4, 5]; // April, May, June: the canola window months
      var FULL = { 3: "April", 4: "May", 5: "June" };
      var conds = [], prev = null;
      idx.forEach(function (i) {
        var v = w[i];
        if (prev !== null && v <= prev) return;
        var when = i === 5
          ? " June is the end of the canola window; planting after 15 June is reported to cut yield significantly"
          : " That is inside the canola window of April to early June";
        conds.push([el("strong", { text: "If “moist enough” means " + (prev === null ? "" : "more than " + prev + "% and ") + "up to " + v + "% of full wetness: " }),
          "the model's surface layer reaches it in " + FULL[i] + "." + when, statusTag("unverified"), "."]);
        prev = v;
      });
      conds.push([el("strong", { text: "If it means more than " + prev + "%: " }), "the model does not reach it by June, so the canola window would be missed", statusTag("unverified"), "."]);
      conds.push(["Lupin: the source covers canola only. No lupin planting-moisture figure found", statusTag("assumption"), "."]);
      var lines = [
        "NASA POWER (MERRA-2) modelled surface wetness, 2001-2025 monthly climatology: " + idx.map(function (i) { return mo[i] + " " + w[i] + "%"; }).join(", ") + ".",
        ["Canola cannot be planted when the top 5 to 7.5 cm of soil has dried out", statusTag("unverified"), "."],
        ["The model's surface layer is not the top 5 cm and is not a measurement. Which percent counts as “dried out”:", statusTag("assumption"), "."]
      ];
      return block("Topsoil moisture at canola planting", conds, lines);
    }

    function soilBlock(key) {
      var t = P.sites[key].soil_topsoil_two_sources, h = P.sites[key].soil_horizons_soilgrids;
      var a = t.soilgrids.clay, b = t.isda.clay, d = r1(Math.abs(a - b)), pct = r1(d / a * 100), agree = pct <= TH;
      var pa = t.soilgrids.phh2o, pb = t.isda.phh2o, pd = r1(Math.abs(pa - pb));
      var conds = [];
      if (agree) conds.push([el("strong", { text: "If a soil test lands near the maps' " + Math.min(a, b) + " to " + Math.max(a, b) + "% clay: " }),
        "the two maps agree under our " + TH + "% rule, reused here for soil", ours(), ", so the topsoil map is not what keeps the answer open."]);
      else conds.push([el("strong", { text: "If your field is near " + a + "% clay (SoilGrids), the topsoil is sandy; near " + b + "% (iSDA), it holds about " + r1(Math.max(a, b) / Math.min(a, b)) + " times as much clay. " }),
        "The maps disagree under our " + TH + "% rule, reused here for soil", ours(), ", so only a soil test can say which."]);
      conds.push(["Either way, tillage depth depends on the soil: " + F.r1_tillage.value, statusTag("checked"), ". Which clay level counts as compaction-prone, and which rotation that favours:", statusTag("assumption"), "."]);
      conds.push(["pH (water): SoilGrids " + pa + ", iSDA " + pb + ", difference " + pd + ". No source on this page ties pH to wheat, lupin or canola, so pH moves no statement here", statusTag("assumption"), "."]);
      var lines = [
        "Topsoil clay, medians across the site's fields (iSDA from " + t.n_fields_with_isda + " fields): SoilGrids " + a + "%, iSDA " + b + "%.",
        "Difference = " + d + " points; " + d + " ÷ " + a + " (SoilGrids) = " + pct + "%; our threshold is " + TH + "%. Using SoilGrids as the base is our choice.",
        "SoilGrids clay by depth: " + Object.keys(h).map(function (k) { return k + " " + h[k].clay + "%"; }).join(", ") + ". Both maps are models, not measurements."
      ];
      return block("Soil clay and pH", conds, lines);
    }

    ["overberg", "swartland"].forEach(function (key) {
      var s = D.rain.sites[key];
      sitesBox.appendChild(el("article", { class: "panel change-site", "aria-label": s.name }, [
        el("h3", { text: s.name + (key === "swartland" ? " (uncertainty example)" : " (lead site)") }),
        rainBlock(key), moistureBlock(key), soilBlock(key)
      ]));
    });

    /* Trial: same figures for both sites */
    var conds = [], lines = [];
    mono.forEach(function (mr) {
      var rr = rot.filter(function (x) { return x.tillage === mr.tillage; })[0];
      var diffs = rr.values.map(function (v, i) { return v - mr.values[i]; });
      var tot = sum(diffs), avg = r0(tot / diffs.length);
      var lc = diffs.filter(function (x) { return x < 0; }).length;
      var lead = "If you use " + mr.tillage.toLowerCase() + (mr.tillage === "Mouldboard" ? " ploughing" : "") + ": ";
      if (avg < 0) conds.push([el("strong", { text: lead }),
        "wheat after the break crop averaged " + Math.abs(avg) + " kg/ha less than monoculture (" + lc + " of " + diffs.length + " cells lower). The break crop's own income, disease relief and nitrogen credit would need to make up about that much wheat. None of the three has a sourced value", statusTag("assumption"), "."]);
      else conds.push([el("strong", { text: lead }),
        "wheat after the break crop averaged " + avg + " kg/ha more than monoculture, though " + lc + " of " + diffs.length + " cells were lower. On the average, wheat yield alone does not count against the break crop here; cell by cell it " + (lc * 2 > diffs.length ? "mostly does" : "mostly does not") + "."]);
      lines.push(mr.tillage + ": " + rr.values.map(function (v, i) { return "(" + v + " " + MINUS + " " + mr.values[i] + ")"; }).join(" + ") +
        " = " + diffs.map(sgn).join(" ") + " = " + sgn(tot) + "; ÷ " + diffs.length + " = " + sgn(avg) + " kg/ha.");
    });
    lines.push("Averaging the three unlabelled columns is our choice; their labels (year or site) are not in our copy. " + T.source + ", one trial, one site band. The same figures apply to both sites on this page.");
    trialBox.appendChild(el("article", { class: "panel change-site", "aria-label": "Both sites: the ARC trial" }, [
      el("h3", { text: "Both sites: the ARC trial, by tillage" }),
      block("Wheat yield given up, or gained, after a break crop", conds, lines)
    ]));
  })();

  /* ---------- D. Metrics: what can be scored today ---------- */
  var mp = $("metric-panel");
  var mt = el("table", { class: "metric-table" });
  mt.appendChild(el("caption", { text: "A metric is scored only when it has a sourced value." }));
  mt.appendChild(el("thead", null, [el("tr", null, [
    el("th", { scope: "col", text: "Metric" }),
    el("th", { scope: "col", text: D.rotations.r1.name }), el("th", { scope: "col", text: D.rotations.r3.name })
  ])]));
  var mtb = el("tbody"), cellsTotal = 0, cellsScored = 0;
  D.metrics.forEach(function (m) {
    function cell(c) {
      cellsTotal++;
      if (c.scored) { cellsScored++; return el("td", { class: "scored" }, [el("strong", { text: "scored" })]); }
      return el("td", { class: "unscored" }, [el("strong", { text: "no sourced value" }), el("span", { class: "small", text: " " + c.missing })]);
    }
    mtb.appendChild(el("tr", null, [el("th", { scope: "row", text: m.name }), cell(m.r1), cell(m.r3)]));
  });
  mt.appendChild(mtb);
  mp.appendChild(el("div", { class: "table-scroll", tabindex: "0", role: "region", "aria-label": "Farmer metrics" }, [mt]));
  (function () {
    var miss = [];
    D.metrics.forEach(function (m) { if (!m.r1.scored || !m.r3.scored) miss.push(m.name.toLowerCase()); });
    $("gap-strip").textContent = "Sourced and scored: " + cellsScored + " of " + cellsTotal + " metric cells. What we could not source: " + miss.join(", ") + ". Each gap below names the document that would settle it.";
  })();
  $("score-panel").appendChild(el("p", { class: "warn" }, [el("strong", { text: "No score is shown. " }),
    cellsScored + " of " + cellsTotal + " metric cells have a sourced value we trust, so a score would look more certain than it is. No winner is named."]));

  /* ---------- F. Rain panels ---------- */
  var R = D.rain;
  $("rule-text").textContent = "Disagreement rule: spread is the highest minus the lowest value, as a share of the NASA IMERG figure. Up to " +
    D.rule.disagree_threshold_pct + "%, the sources count as agreeing and one verdict is shown (confidence " + D.rule.agree_confidence +
    ", because all four are models, not gauges, and two share ECMWF origin). Above " + D.rule.disagree_threshold_pct +
    "%, every value is shown and the single verdict is withheld (confidence " + D.rule.disagree_confidence + "). The " + D.rule.disagree_threshold_pct + "% threshold is our own parameter, taken from the team's plan notes where it was a proposal. It is not a finding. Capping agreement at " + D.rule.agree_confidence + " is our choice.";
  var SCALE = 550;
  function rainPanel(key, box) {
    var s = R.sites[key];
    box.appendChild(el("h3", { text: s.name + (key === "swartland" ? " (uncertainty example)" : " (lead site)") }));
    box.appendChild(el("p", { class: "conf conf-" + s.confidence.toLowerCase(), text: "Confidence: " + s.confidence }));
    var chart = el("div", { class: "bars", role: "img",
      "aria-label": s.name + " rain by source: " + s.ids.map(function (id) { return R.providers[F[id].provider].name + " " + F[id].value + " mm"; }).join(", ") });
    s.ids.forEach(function (id) {
      var f = F[id], p = R.providers[f.provider];
      var bar = el("div", { class: "bar bar-" + f.provider });
      bar.style.width = (f.value / SCALE * 100) + "%";
      chart.appendChild(el("div", { class: "bar-row" }, [
        el("span", { class: "bar-name", text: p.name + (p.ecmwf ? " *" : "") }),
        el("div", { class: "track" }, [bar]),
        el("span", { class: "bar-val", text: f.value + " mm" })
      ]));
    });
    var wrap = el("div", { class: "chart" }, [chart]);
    var axis = el("div", { class: "axis", "aria-hidden": "true" }, [el("span", { class: "bar-name" }), el("div", { class: "track ticks" },
      [0, 200, 400].map(function (t) { var x = el("span", { text: String(t) }); x.style.left = (t / SCALE * 100) + "%"; return x; })), el("span", { class: "bar-val", text: "mm/yr" })]);
    wrap.appendChild(axis);
    box.appendChild(wrap);
    box.appendChild(el("p", { class: "small", text: "* derived from the same ECMWF reanalysis, not independent. Average 2015-2024. Models, not rain gauges." }));
    box.appendChild(el("p", { text: "Range " + s.low + " to " + s.high + " mm. Spread " + s.spread + " mm, about " + Math.round(s.spread_pct) + "% of the IMERG figure." }));
    if (s.agree) {
      box.appendChild(el("p", { class: "verdict" }, [el("strong", { text: "The sources agree closely here: about " + s.low + " to " + s.high + " mm a year." })]));
      box.appendChild(el("p", { class: "small", text: "Agreement is judged against our own " + D.rule.disagree_threshold_pct + "% threshold. Confidence stays at " + s.confidence + " because all four are models." }));
    } else {
      box.appendChild(el("p", { class: "withheld" }, [el("strong", { text: "No single verdict. " }),
        "The sources disagree by about " + Math.round(s.spread_pct) + "% of the IMERG figure, above our " + D.rule.disagree_threshold_pct + "% threshold."]));
      var ul = el("ul", { class: "plain" });
      s.ids.forEach(function (id) { var f = F[id]; ul.appendChild(el("li", { text: R.providers[f.provider].name + ": " + f.value + " mm." })); });
      box.appendChild(ul);
      box.appendChild(el("p", { text: "A tool that printed one number here would mislead: the lowest and highest sources are " + s.spread + " mm a year apart. A local rain gauge record would be needed to narrow it." }));
    }
  }
  rainPanel("overberg", $("rain-overberg"));
  rainPanel("swartland", $("rain-swartland"));

  /* ---------- E. Trust panel ---------- */
  var tt = $("trust-table");
  tt.appendChild(el("caption", { text: "All figures used on this page. Spread applies to rain only." }));
  tt.appendChild(el("thead", null, [el("tr", null, ["Figure", "Value", "Status", "Source", "NASA?", "Resolution", "Period", "Spread", "Confidence", "Caveat"].map(function (h) { return el("th", { scope: "col", text: h }); }))]));
  var ttb = el("tbody");
  Object.keys(F).forEach(function (id) {
    var f = F[id];
    ttb.appendChild(el("tr", { class: "row-" + f.status }, [
      el("th", { scope: "row", text: f.label }), el("td", { text: valueText(f) }), el("td", null, [statusTag(f.status)]),
      el("td", { text: f.source }), el("td", { text: f.source_is_nasa ? "Yes" : "No" }), el("td", { text: f.resolution }),
      el("td", { text: f.period }), el("td", { text: f.spread || "not applicable" }), el("td", { text: f.confidence }), el("td", { text: f.caveat })
    ]));
  });
  tt.appendChild(ttb);

  /* ---------- H. Scale ---------- */
  [
    "The winter-rainfall region covers " + F.scale_area.value + " hectares, and the Western Cape grows " + F.scale_share.value + " of South African wheat (" + F.scale_area.source + "; single source). This shows the size of the decision. It is not a claim about what this page changes.",
    "The page runs offline with no server. Open the file and it works, with no login and no third-party requests."
  ].forEach(function (t) { $("scale-lines").appendChild(el("li", { text: t })); });
})();
