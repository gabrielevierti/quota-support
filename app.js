// Quota support site: language switch (English / Italiano) and the App Store button.
(function () {
  // Paste the App Store link here once the app is live, e.g.
  // "https://apps.apple.com/app/quota-flight-radar/id1234567890"
  var APP_STORE_URL = "";

  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem("quota.lang"); } catch (e) { return null; }
  }
  function remember(lang) {
    try { localStorage.setItem("quota.lang", lang); } catch (e) { /* private mode: fine */ }
  }
  function apply(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
  }

  var initial = stored() ||
    ((navigator.language || "").toLowerCase().indexOf("it") === 0 ? "it" : "en");
  if (location.hash === "#it" || location.hash === "#italiano") initial = "it";
  apply(initial);

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-set]");
    if (!button) return;
    var lang = button.getAttribute("data-set");
    apply(lang);
    remember(lang);
  });

  var store = document.querySelectorAll("[data-appstore]");
  for (var i = 0; i < store.length; i++) {
    if (APP_STORE_URL) {
      store[i].setAttribute("href", APP_STORE_URL);
      store[i].removeAttribute("aria-disabled");
      store[i].classList.add("live");
    }
  }

  var year = document.querySelectorAll("[data-year]");
  for (var j = 0; j < year.length; j++) year[j].textContent = String(new Date().getFullYear());
})();
