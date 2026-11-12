// Quota – Flight Radar · home page: fades on scroll, the flight gallery, the iPad gallery and the rain compare.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  var hasIO = "IntersectionObserver" in window;

  function whileVisible(el, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }, { threshold: 0.25 }).observe(el);
  }

  // Fade in as things scroll into view.
  var reveals = $$("[data-reveal]");
  if (!hasIO || reduce) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Your flight: arrows for the horizontal gallery.
  var rail = $(".rail");
  if (rail) {
    var track = $(".track", rail), prev = $(".prev", rail), next = $(".next", rail);
    function stepWidth() {
      var card = $(".slide", track);
      return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 300;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -stepWidth(), behavior: reduce ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: stepWidth(), behavior: reduce ? "auto" : "smooth" }); });
    track.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  // iPad gallery: moves on by itself while visible, stops once someone picks a tab.
  var gallery = $(".gallery");
  if (gallery) {
    var pics = $$(".stack img", gallery), tabs = $$(".tabs button", gallery);
    var current = 0, timer = null, visible = false, chosen = false;
    function select(n) {
      current = n;
      pics.forEach(function (p, i) { p.classList.toggle("on", i === n); });
      tabs.forEach(function (t, i) { t.classList.toggle("on", i === n); t.setAttribute("aria-selected", i === n ? "true" : "false"); });
    }
    function schedule() {
      clearTimeout(timer);
      if (!visible || chosen || reduce || document.hidden) return;
      timer = setTimeout(function () { select((current + 1) % pics.length); schedule(); }, 5000);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { chosen = true; clearTimeout(timer); select(i); });
    });
    select(0);
    whileVisible(gallery, function (v) { visible = v; schedule(); });
    document.addEventListener("visibilitychange", schedule);
  }

  // Rain compare.
  var compare = $(".compare");
  if (compare) {
    var frame = $(".frame", compare), range = $(".compare-range", compare), touched = false, dragging = false;
    function set(x) {
      x = Math.max(0, Math.min(100, x));
      frame.style.setProperty("--x", x + "%");
      if (range) range.value = Math.round(x);
    }
    function at(e) { var r = frame.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    frame.addEventListener("pointerdown", function (e) { dragging = touched = true; frame.setPointerCapture(e.pointerId); at(e); });
    frame.addEventListener("pointermove", function (e) { if (dragging) at(e); });
    frame.addEventListener("pointerup", function () { dragging = false; });
    frame.addEventListener("pointercancel", function () { dragging = false; });
    if (range) range.addEventListener("input", function () { touched = true; set(+range.value); });
    set(50);
    if (!reduce) {
      var shown = false;
      whileVisible(compare, function (v) {
        if (!v || shown) return;
        shown = true;
        var from = 50, to = 72, t0 = null, D = 1400;
        setTimeout(function () {
          requestAnimationFrame(function step(ts) {
            if (touched) return;
            if (t0 === null) t0 = ts;
            var u = Math.min(1, (ts - t0) / D), k = Math.sin(u * Math.PI);
            set(from + (to - from) * k);
            if (u < 1) requestAnimationFrame(step);
          });
        }, 700);
      });
    }
  }
})();
