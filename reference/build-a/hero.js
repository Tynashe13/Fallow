(function () {
  "use strict";
  var img = document.getElementById("hero-img"), link = document.getElementById("hero-link");
  var SITES = {
    overberg: { src: "art/fallow-profile-overberg-june-1280.webp", full: "art/fallow-profile-overberg-june.png", name: "Overberg", alt: "Field profile plate for Overberg, Western Cape, June. An isometric block of terrain above six soil depths, with rain, air temperature, humidity, land evaporation, soil wetness, four-source annual rain, two soil maps and a legend. Every value is a model, not a measurement." },
    swartland: { src: "art/fallow-profile-swartland-june-1280.webp", full: "art/fallow-profile-swartland-june.png", name: "Swartland", alt: "Field profile plate for the Swartland, Western Cape, June. Same layout as the Overberg plate. The four rain sources disagree widely here. Every value is a model, not a measurement." }
  };
  if (!img) return;
  Object.keys(SITES).forEach(function (k) {
    var b = document.getElementById("hero-tab-" + k);
    if (!b) return;
    b.addEventListener("click", function () {
      var st = document.getElementById("hero-status"); if (st) st.textContent = "Loading the " + SITES[k].name + " plate...";
      img.onload = function () { if (st) st.textContent = "Showing the " + SITES[k].name + " plate."; };
      img.onerror = function () { if (st) st.textContent = "The " + SITES[k].name + " plate did not load. Use the full-size link."; };
      img.src = SITES[k].src; img.alt = SITES[k].alt; link.href = SITES[k].full;
      Object.keys(SITES).forEach(function (j) { document.getElementById("hero-tab-" + j).setAttribute("aria-pressed", String(j === k)); });
    });
  });
})();
