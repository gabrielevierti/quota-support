// Quota – Flight Radar · home page: reveals, the device switcher, the rain compare and iPhone Duo in 3D.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  var hasIO = "IntersectionObserver" in window;
  function whileVisible(el, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }, { threshold: 0.3 }).observe(el);
  }

  // Fade in as things come into view.
  var reveals = $$("[data-reveal]");
  if (!hasIO || reduce) reveals.forEach(function (el) { el.classList.add("in"); });
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Features: a list and one iPhone; moves on by itself until someone picks an item.
  var fx = $(".fx");
  if (fx) {
    var items = $$(".fx-list li", fx), pics = $$(".fx-phone img", fx), fxCur = 0, fxTimer = null, fxVis = false, FX_DUR = 6000;
    fx.style.setProperty("--fx-dur", FX_DUR / 1000 + "s");
    function fxSelect(n) {
      fxCur = n;
      items.forEach(function (li, i) {
        li.classList.toggle("on", i === n);
        var bar = $(".fx-bar", li); if (bar && i === n) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      });
      pics.forEach(function (im, i) { im.classList.toggle("on", i === n); });
    }
    function fxSchedule() {
      clearTimeout(fxTimer);
      if (!fxVis || fx.classList.contains("chosen") || reduce || document.hidden) return;
      fxTimer = setTimeout(function () { fxSelect((fxCur + 1) % items.length); fxSchedule(); }, FX_DUR);
    }
    items.forEach(function (li, i) { $("button", li).addEventListener("click", function () { fx.classList.add("chosen"); clearTimeout(fxTimer); fxSelect(i); }); });
    if (reduce) fx.classList.add("chosen");
    fxSelect(0);
    whileVisible(fx, function (v) { fxVis = v; if (v) fxSelect(fxCur); fxSchedule(); });
    document.addEventListener("visibilitychange", fxSchedule);
  }

  // Rain on and off.
  var compare = $(".compare");
  if (compare) {
    var frame = $(".frame", compare), range = $(".compare-range", compare), touched = false, dragging = false;
    function set(x) { x = clamp(x, 0, 100); frame.style.setProperty("--x", x + "%"); if (range) range.value = Math.round(x); }
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
        var t0 = null;
        setTimeout(function () {
          requestAnimationFrame(function step(ts) {
            if (touched) return;
            if (t0 === null) t0 = ts;
            var u = Math.min(1, (ts - t0) / 1600);
            set(50 + 26 * Math.sin(u * Math.PI));
            if (u < 1) requestAnimationFrame(step);
          });
        }, 600);
      });
    }
  }

  // Pilots: the drone set-up and the flight screen take turns.
  $$(".dev.swap").forEach(function (box) {
    var imgs = $$("img", box), k = 0, t = null;
    if (reduce || imgs.length < 2) return;
    whileVisible(box, function (v) {
      clearInterval(t);
      if (v) t = setInterval(function () { imgs[k].classList.remove("on"); k = (k + 1) % imgs.length; imgs[k].classList.add("on"); }, 4200);
    });
  });

  // Support: the form prepares an email in the visitor's mail app; nothing is sent from the page.
  var form = $(".report");
  if (form) {
    var root = document.documentElement;
    function lang() { return (root.getAttribute("data-lang") || "en").indexOf("it") === 0 ? "it" : "en"; }
    function placeholders() {
      var l = lang();
      $$("[data-ph-en]", form).forEach(function (el) { el.placeholder = el.getAttribute("data-ph-" + l) || ""; });
    }
    placeholders();
    if ("MutationObserver" in window) new MutationObserver(placeholders).observe(root, { attributes: true, attributeFilter: ["data-lang"] });
    var err = $(".form-error", form);
    form.addEventListener("input", function (e) { if (e.target.classList) e.target.classList.remove("bad"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = $$("[required]", form).filter(function (el) { return !el.value.trim(); });
      $$("[required]", form).forEach(function (el) { el.classList.toggle("bad", bad.indexOf(el) >= 0); });
      err.hidden = bad.length === 0;
      if (bad.length) { bad[0].focus(); return; }
      var v = function (n) { return form.elements[n].value.trim(); };
      var kind = (form.querySelector("input[name=kind]:checked") || {}).value || "other";
      var KIND = { bug: "Problem", data: "Wrong data", idea: "Suggestion", other: "Other" };
      var body = [
        "Type: " + KIND[kind],
        "Device: " + v("device"),
        "System: " + v("os"),
        "Quota: " + v("app"),
        v("ref") ? "Aircraft or airport: " + v("ref") : null,
        "",
        v("what"),
        "",
        "—",
        lang() === "it" ? "(Allega uno screenshot, se puoi.)" : "(Attach a screenshot if you can.)"
      ].filter(function (x) { return x !== null; }).join("\n");
      var to = ["gabriele", "vierti"].join(".") + String.fromCharCode(64) + ["gmail", "com"].join(".");
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent("[Quota] " + KIND[kind] + ": " + v("summary")) + "&body=" + encodeURIComponent(body);
    });
  }

  // iPhone Duo: plays on its own while it is on screen. Closed and tilted, the front half swings from right to left
  // and reveals the inner screen; then six stops, each with a box on the feature, a line and a card.
  // The timeline below can pause it, scrub it, or jump to a stop.
  var duo = $(".duo-scene");
  if (duo) {
    var pin = $(".duo-pin", duo), head = $(".duo-top", duo), book = $(".book", duo), flap = $(".half.l", duo), zoom = $(".zoomer", duo);
    var shade = $(".shade", duo), floor = $(".floor", duo), screens = $(".screens", duo), shots = $$(".screens img", duo);
    var caps = $$(".duo-caption", duo), cards = $$(".callout", duo);
    var svg = $(".leader", duo), box = $("rect", svg), line = $("path", svg), dot = $("circle", svg);
    var playBtn = $(".tl-play", duo), track = $(".tl-track", duo), fill = $(".tl-fill", duo), knob = $(".tl-knob", duo), marksEl = $(".tl-marks", duo);
    // The feature on the unfolded screen (fractions of it), how close to go, and which screen.
    var STOPS = [
      { b: [.58, .08, .98, .59], s: 1.2, screen: 0 },
      { b: [.505, .24, .56, .82], s: 1.22, screen: 0 },
      { b: [.01, .73, .37, .82], s: 1.26, screen: 1 },
      { b: [.01, .70, .33, .81], s: 1.26, screen: 2 },
      { b: [.37, .37, .66, .62], s: 1.22, screen: 3 },
      { b: [.05, .31, .95, .50], s: 1.12, screen: 4 }
    ];
    // Times in seconds.
    var OPEN_A = 1.4, OPEN_B = 4.0, START = 4.6, SLOT = 5.6, END = START + STOPS.length * SLOT, TOTAL = END + 2;
    var ease = function (t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

    // The frame: thin slices with the same rounded outline, from the screen to the back.
    var LAYERS = 12;
    [flap, $(".half.r", duo)].forEach(function (half) {
      var back = $(".back", half);
      for (var i = 1; i < LAYERS; i++) {
        var l = document.createElement("i"), k = i / LAYERS, light = Math.sin(k * Math.PI);
        l.className = "layer";
        l.style.transform = "translateZ(calc(var(--t) * " + (-k).toFixed(3) + "))";
        var c = Math.round(40 + 92 * light), c2 = Math.round(44 + 96 * light);
        l.style.background = "rgb(" + c + "," + (c + 2) + "," + c2 + ")";
        half.insertBefore(l, back);
      }
    });

    // Timeline marks: the opening, then the six stops.
    var markTimes = [OPEN_A].concat(STOPS.map(function (st, i) { return START + i * SLOT + SLOT * 0.42; }));
    var marks = markTimes.map(function (t, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.k = i;
      b.style.left = (t / TOTAL * 100).toFixed(2) + "%";
      marksEl.appendChild(b);
      return b;
    });
    function labelMarks() {
      var it = (document.documentElement.getAttribute("data-lang") || document.documentElement.lang || "en").indexOf("it") === 0;
      marks.forEach(function (b, i) {
        var txt = i === 0 ? (it ? "Apertura" : "Unfold") : $("b [lang=" + (it ? "it" : "en") + "]", cards[i - 1]).textContent;
        b.dataset.label = txt; b.setAttribute("aria-label", txt);
      });
    }
    labelMarks();
    if ("MutationObserver" in window) new MutationObserver(labelMarks).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang", "lang"] });

    function hide() {
      [box, line, dot].forEach(function (e) { e.style.opacity = 0; });
      cards.forEach(function (c) { c.style.opacity = 0; c.style.visibility = "hidden"; });
    }
    function draw(T) {
      var narrow = innerWidth < 760;
      var bw = book.offsetWidth, bh = book.offsetHeight;
      book.style.setProperty("--t", Math.max(7, bw * .017).toFixed(1) + "px");
      book.style.setProperty("--r", Math.max(18, bw * .05).toFixed(1) + "px");
      var turn = ease(seg(T, 0, OPEN_A)), open = ease(seg(T, OPEN_A, OPEN_B));
      // 180° = lying on the right half with the cover facing us; 0° = open, left of the hinge.
      flap.style.transform = "rotateY(" + (180 - 180 * open).toFixed(2) + "deg)";
      var ry = lerp(-26, -12, turn) * (1 - open) - Math.sin(open * Math.PI) * 8;
      var rx = lerp(-10, -5, turn) * (1 - open);
      var lift = Math.sin(open * Math.PI) * -2;
      book.style.transform = "translateX(" + lerp(-25, 0, open).toFixed(2) + "%) translateY(" + lift.toFixed(2) + "%) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      if (shade) shade.style.opacity = (Math.sin(open * Math.PI) * 0.8).toFixed(3);
      if (floor) floor.style.width = lerp(55, 100, open).toFixed(1) + "%";
      screens.classList.toggle("on", open >= 0.999);
      var act = -1, z = 0, u = 0, screen = 0;
      for (var i = 0; i < STOPS.length; i++) {
        var v = (T - (START + i * SLOT)) / SLOT;
        if (v >= 0 && v < 1) { act = i; u = v; z = ease(seg(v, 0.02, 0.24)) * (1 - ease(seg(v, 0.86, 1))); }
        if (T >= START + i * SLOT) screen = STOPS[i].screen;
      }
      shots.forEach(function (im, k) { im.classList.toggle("on", k === screen); });
      var closedScale = lerp(1.1, 1, open);
      if (act < 0) { zoom.style.transform = "scale(" + closedScale.toFixed(4) + ")"; hide(); }
      else {
        var st = STOPS[act], b = st.b, insX = 10 / bw, insY = 10 / bh;
        var fx = function (q) { return insX + q * (1 - 2 * insX); }, fy = function (q) { return insY + q * (1 - 2 * insY); };
        var cx = fx((b[0] + b[2]) / 2), cy = fy((b[1] + b[3]) / 2);
        var s = narrow ? 1 : 1 + (st.s - 1) * z;
        var right = cx < 0.5; // the card goes on the side with more room
        var tx = narrow ? 0 : (cx - 0.5) * (1 - s) * 100 + (right ? -1 : 1) * 12 * z;
        var ty = (cy - 0.5) * (1 - s) * 100 * (narrow ? 0.4 : 1);
        zoom.style.transform = "translate(" + tx.toFixed(3) + "%," + ty.toFixed(3) + "%) scale(" + s.toFixed(4) + ")";
        var pr = pin.getBoundingClientRect(), br = book.getBoundingClientRect();
        var X = function (q) { return br.left - pr.left + fx(q) * br.width; }, Y = function (q) { return br.top - pr.top + fy(q) * br.height; };
        var pad = 6, x0 = X(b[0]) - pad, y0 = Y(b[1]) - pad, x1 = X(b[2]) + pad, y1 = Y(b[3]) + pad, ym = (y0 + y1) / 2;
        box.setAttribute("x", x0.toFixed(1)); box.setAttribute("y", y0.toFixed(1));
        box.setAttribute("width", (x1 - x0).toFixed(1)); box.setAttribute("height", (y1 - y0).toFixed(1));
        var card = cards[act], W = pr.width, H = pr.height;
        card.style.width = narrow ? (W - 40) + "px" : "";
        var cw = card.offsetWidth, ch = card.offsetHeight;
        var minTop = head.getBoundingClientRect().bottom - pr.top - 6, maxTop = $(".timeline", duo).getBoundingClientRect().top - pr.top - ch - 16;
        var cardX, cardY, d, ex, ey;
        if (narrow) {
          cardX = 20; cardY = clamp(br.bottom - pr.top + 24, minTop, maxTop);
          ex = (x0 + x1) / 2; ey = cardY;
          d = "M" + ex + "," + y1 + " L" + ex + "," + ey;
        } else {
          cardY = clamp(ym - ch / 2, minTop, maxTop);
          ey = clamp(ym, cardY + 24, cardY + ch - 24);
          if (right) {
            cardX = clamp(Math.max(br.right - pr.left + 40, x1 + 70), 24, W - cw - 24); ex = cardX;
            d = "M" + x1 + "," + ym + " L" + (ex - 28) + "," + ym + " L" + ex + "," + ey;
          } else {
            cardX = clamp(Math.min(br.left - pr.left - 40 - cw, x0 - 70 - cw), 24, W - cw - 24); ex = cardX + cw;
            d = "M" + x0 + "," + ym + " L" + (ex + 28) + "," + ym + " L" + ex + "," + ey;
          }
        }
        line.setAttribute("d", d); dot.setAttribute("cx", ex); dot.setAttribute("cy", ey);
        var out = 1 - ease(seg(u, 0.8, 0.88));
        var dBox = ease(seg(u, 0.24, 0.34)), dLine = ease(seg(u, 0.32, 0.42)), dCard = ease(seg(u, 0.38, 0.5));
        var per = 2 * ((x1 - x0) + (y1 - y0)), len = line.getTotalLength ? line.getTotalLength() : 400;
        box.style.strokeDasharray = per; box.style.strokeDashoffset = (per * (1 - dBox)).toFixed(1);
        box.style.opacity = (dBox > 0 ? 1 : 0) * out;
        line.style.strokeDasharray = len; line.style.strokeDashoffset = (len * (1 - dLine)).toFixed(1);
        line.style.opacity = (dLine > 0 ? 1 : 0) * out;
        dot.style.opacity = (dLine >= 1 ? 1 : 0) * out;
        cards.forEach(function (c, k) { var o = k === act ? dCard * out : 0; c.style.opacity = o.toFixed(3); c.style.visibility = o > 0 ? "visible" : "hidden"; });
        card.style.transform = "translate(" + cardX.toFixed(1) + "px," + (cardY + (1 - dCard) * 10).toFixed(1) + "px)";
      }
      var key = T < OPEN_A ? "closed" : T >= END ? "end" : "open";
      caps.forEach(function (c) { c.classList.toggle("on", c.dataset.step === key); });
      var f = (T / TOTAL * 100).toFixed(3) + "%";
      fill.style.width = f; knob.style.left = f;
      marks.forEach(function (m, i) { m.classList.toggle("done", T >= markTimes[i] - 0.01); });
    }

    // The clock.
    var T = reduce ? START - 0.2 : 0, playing = !reduce, visible = false, last = null, raf = null, dragging = false;
    function setPlaying(p) {
      playing = p;
      playBtn.classList.toggle("paused", !p);
      playBtn.setAttribute("aria-label", p ? "Pause" : "Play");
      run();
    }
    function tick(ts) {
      raf = null;
      if (last !== null && playing && !dragging) T = Math.min(TOTAL, T + (ts - last) / 1000);
      last = ts;
      draw(T);
      if (T >= TOTAL && playing) { setPlaying(false); return; }
      if (playing && visible && !document.hidden) raf = requestAnimationFrame(tick);
      else last = null;
    }
    function run() { if (!raf) { last = null; raf = requestAnimationFrame(tick); } }
    playBtn.addEventListener("click", function () {
      if (!playing && T >= TOTAL - 0.01) T = 0;
      setPlaying(!playing);
    });
    function seekTo(e) { var r = track.getBoundingClientRect(); T = clamp((e.clientX - r.left) / r.width, 0, 1) * TOTAL; run(); }
    var wasPlaying = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      dragging = true; wasPlaying = playing; track.setPointerCapture(e.pointerId); seekTo(e);
    });
    track.addEventListener("pointermove", function (e) { if (dragging) seekTo(e); });
    function endDrag() { if (!dragging) return; dragging = false; if (wasPlaying) setPlaying(true); else run(); }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    marks.forEach(function (m, i) {
      // Jump just before the point, so the box and the card draw themselves.
      m.addEventListener("click", function () { T = i === 0 ? OPEN_A - 0.2 : START + (i - 1) * SLOT; run(); if (!playing) setPlaying(true); });
    });
    if (hasIO) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; run(); }, { threshold: 0.45 }).observe(pin);
    else visible = true;
    document.addEventListener("visibilitychange", run);
    addEventListener("resize", function () { draw(T); });
    if (reduce) setPlaying(false);
    draw(T);
  }
})();
