(function () {
  var root = document.documentElement;

  // A link to a person (from a publication's author list) centres and highlights their card
  function flashTarget() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    if (!el || !el.classList.contains('card')) return;
    el.scrollIntoView({ block: 'center' });
    el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1800);
  }
  addEventListener('hashchange', flashTarget);
  flashTarget();

  // Theme toggle (the saved choice is applied in <head> so the page doesn't flash)
  document.getElementById('themeBtn').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme');
    if (!cur) cur = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('qccd-theme', next); } catch (e) {}
    window.dispatchEvent(new Event('themechange'));
  });

  // Mobile menu
  var nav = document.getElementById('nav'), menuBtn = document.getElementById('menuBtn');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

  // Publications: the latest few are shown, the rest on request; a year button shows every paper from that year.
  // Preprints sit in their own list above the year buttons and are always shown.
  var chips = document.querySelectorAll('.pub-tools .chip'), pubs = document.querySelectorAll('#pubs .pub');
  var pubBtn = document.getElementById('pubToggle'), pubYear = 'all', pubOpen = false;
  function showPubs() {
    pubs.forEach(function (p) {
      p.hidden = pubYear === 'all' ? !pubOpen && p.classList.contains('pub-more') : p.getAttribute('data-year') !== pubYear;
    });
    if (pubBtn) {
      pubBtn.hidden = pubYear !== 'all';
      pubBtn.setAttribute('aria-expanded', String(pubOpen));
      pubBtn.textContent = pubOpen ? 'Show fewer' : 'Show all ' + pubs.length + ' publications';
    }
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      pubYear = c.getAttribute('data-year');
      chips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      showPubs();
    });
  });
  if (pubBtn) pubBtn.addEventListener('click', function () { pubOpen = !pubOpen; showPubs(); });

  // Flip cards: tap or Enter/Space toggles; hover flips on devices with a pointer
  document.querySelectorAll('.card').forEach(function (c) {
    function toggle() { var on = !c.classList.contains('flipped'); c.classList.toggle('flipped', on); c.setAttribute('aria-pressed', String(on)); }
    c.addEventListener('click', function (e) { if (e.target.closest('a')) return; toggle(); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  // News timeline: latest four shown, older items on request
  var tlBtn = document.getElementById('tlToggle'), tl = document.getElementById('timeline');
  if (tlBtn) tlBtn.addEventListener('click', function () {
    var open = tl.classList.toggle('expanded');
    tlBtn.setAttribute('aria-expanded', String(open));
    tlBtn.textContent = open ? 'Show fewer' : 'Show older news (' + tl.querySelectorAll('.tl-more').length + ')';
  });

  // Quantum research page: one qubit travels down the wire; each gate fires as the light passes it
  (function () {
    var wire = document.getElementById('qwire'); if (!wire) return;
    var reduceW = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gThemes = Array.prototype.slice.call(wire.querySelectorAll('.theme'));
    var photon = wire.querySelector('.photon'), cover = wire.querySelector('.cover');
    var gateY = [], stage = -1, ticking = false;
    function measure() {
      if (!wire.offsetParent) return;
      gateY = gThemes.map(function (t) { var g = t.querySelector('.tgate'); return t.offsetTop + g.offsetTop + g.offsetHeight / 2; });
      var h = wire.offsetHeight;
      // each gate's colour runs from that gate down to the next; the first one also colours the wire above it
      var stops = gThemes.map(function (t, i) {
        var from = i ? (gateY[i] / h * 100).toFixed(3) + '%' : '0%', to = i < gThemes.length - 1 ? (gateY[i + 1] / h * 100).toFixed(3) + '%' : '100%';
        return 'var(--sig-' + t.getAttribute('data-gate') + ') ' + from + ' ' + to;
      });
      wire.style.setProperty('--fill', 'linear-gradient(180deg, ' + stops.join(', ') + ')');
    }
    function setStage(n) {
      if (n === stage) return;
      var prev = stage; stage = n;
      var last = n ? gThemes[n - 1].getAttribute('data-gate') : null;
      var swaps = gThemes.slice(0, n).filter(function (t) { return t.getAttribute('data-gate') === 'z'; }).length;
      if (last) { wire.setAttribute('data-gate', last); wire.style.setProperty('--q', 'var(--sig-' + last + ')'); }
      else { wire.removeAttribute('data-gate'); wire.style.removeProperty('--q'); }
      wire.toggleAttribute('data-swapped', swaps % 2 === 1);
      gThemes.forEach(function (t, i) { t.classList.toggle('passed', i < n); });
      if (prev >= 0 && n > prev && !reduceW) {
        var t = gThemes[n - 1];
        t.classList.remove('fire'); void t.offsetWidth; t.classList.add('fire');
        setTimeout(function () { t.classList.remove('fire'); }, 800);
      }
    }
    function update() {
      ticking = false;
      if (!wire.offsetParent) return;
      if (reduceW) { setStage(gThemes.length); return; }
      // near the bottom of the page the reading line can't reach the end of the wire, so speed the light up over the last stretch
      var r = wire.getBoundingClientRect(), y0 = innerHeight * 0.55 - r.top;
      var rem = Math.max(0, document.documentElement.scrollHeight - innerHeight - scrollY), D = Math.max(0, r.height - (y0 + rem)), R = D + 300;
      var y = Math.min(r.height, Math.max(0, y0 + D * Math.max(0, 1 - rem / R)));
      photon.style.transform = 'translate3d(0,' + y + 'px,0)';
      cover.style.transform = 'translate3d(0,' + y + 'px,0)';
      var n = 0; while (n < gateY.length && gateY[n] <= y) n++;
      setStage(n);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', function () { measure(); onScroll(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); onScroll(); });
    measure(); onScroll();
  })();

  // Classical research page: a particle in a box tracks your place on the page. Each theme adds a node; between themes the state
  // is a superposition of two levels, so the density sloshes. Click a theme name to jump to it
  (function () {
    var page = document.getElementById('research-classical'), box = document.getElementById('cwire'), side = document.getElementById('cbox');
    if (!page || !box || !side) return;
    var cv = side.querySelector('canvas'), ctx = cv.getContext('2d'), nOut = side.querySelector('.cbox-n');
    var themes = Array.prototype.slice.call(box.querySelectorAll('.theme'));
    var items = Array.prototype.slice.call(side.querySelectorAll('.cbox-list li'));
    var reduceB = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = 0, C = {}, s0 = 0, s1 = 1, bnd = [0, .25, .5, .75], k = -1, measured = false, PAD = 12;

    function rgba(hex, a) {
      var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
      var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    function colors() {
      var cs = getComputedStyle(document.documentElement);
      function t(n) { return cs.getPropertyValue(n).trim(); }
      C = { accent: t('--accent'), ink: t('--ink'), line: t('--line'), muted: t('--muted'), wash: t('--accent-wash') };
    }
    function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function measure() {
      if (!page.offsetParent) return;
      var top = box.getBoundingClientRect().top + scrollY, h = box.offsetHeight;
      var maxS = document.documentElement.scrollHeight - innerHeight;
      s0 = Math.max(0, top - innerHeight * .4);
      s1 = Math.max(s0 + 1, Math.min(maxS, top + h - innerHeight * .6));
      bnd = themes.map(function (t) { return cl((t.getBoundingClientRect().top + scrollY - innerHeight * .4 - s0) / (s1 - s0), 0, 1); });
      var H = cv.clientHeight;
      items.forEach(function (li, i) { li.style.top = (PAD + bnd[i] * (H - 2 * PAD)) + 'px'; });
      colors(); measured = true;
    }
    function prog() { return cl((scrollY - s0) / (s1 - s0), 0, 1); }
    function secOf(p) { var i = 0; while (i + 1 < bnd.length && bnd[i + 1] <= p + 1e-4) i++; return i; }
    function goP(p) { scrollTo(0, s0 + cl(p, 0, 1) * (s1 - s0)); }
    function goTheme(i) { i = cl(i, 0, themes.length - 1); goP(bnd[i] + .002); }

    function draw(W, H, p, t) {
      var T = PAD, B = H - PAD, cx = W / 2, A = W / 2 - 3;
      var kk = secOf(p), b0 = bnd[kk], b1 = kk + 1 < bnd.length ? bnd[kk + 1] : 1, f = cl((p - b0) / Math.max(1e-3, b1 - b0), 0, 1);
      f = kk + 1 < bnd.length ? f * f * (3 - 2 * f) : 0;
      var n = kk + 1, m = n + 1, c1 = Math.sqrt(1 - f), c2 = Math.sqrt(f), En = .55 * n * n, Em = .55 * m * m, pts = [];
      // walls: the box's ends are the infinite walls
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(4, T); ctx.lineTo(W - 4, T); ctx.moveTo(4, B); ctx.lineTo(W - 4, B); ctx.stroke();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, T); ctx.lineTo(cx, B); ctx.stroke();
      for (var y = T; y <= B; y += 2) {
        var u = (y - T) / (B - T), pn = Math.sin(n * Math.PI * u), pm = Math.sin(m * Math.PI * u);
        var re = c1 * pn * Math.cos(En * t) + c2 * pm * Math.cos(Em * t), im = -(c1 * pn * Math.sin(En * t) + c2 * pm * Math.sin(Em * t));
        pts.push([y, re, re * re + im * im]);
      }
      ctx.beginPath(); pts.forEach(function (q, i) { var x = cx - A * q[2] * .5; if (!i) ctx.moveTo(x, q[0]); else ctx.lineTo(x, q[0]); });
      for (var i = pts.length - 1; i >= 0; i--) ctx.lineTo(cx + A * pts[i][2] * .5, pts[i][0]);
      ctx.closePath(); ctx.fillStyle = rgba(C.accent, .16); ctx.fill();
      ctx.beginPath(); pts.forEach(function (q, i) { var x = cx + A * q[1] * .5; if (!i) ctx.moveTo(x, q[0]); else ctx.lineTo(x, q[0]); });
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.6; ctx.stroke();
      // where you are on the page
      var yp = T + p * (B - T);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, yp); ctx.lineTo(W, yp); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(W - 1.5, yp, 3, 0, 6.2832); ctx.fill();
      return { n: f < .08 ? 'n = ' + n : f > .92 && kk + 1 < bnd.length ? 'n = ' + m : 'n = ' + n + ' → ' + m, k: kk };
    }

    function frame(now) {
      raf = 0;
      if (!page.offsetParent) return;
      if (!measured) measure();
      var dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var p = prog(), r = draw(W, H, p, reduceB ? 0 : now / 1000);
      if (r.k !== k) { k = r.k; items.forEach(function (li, i) { li.classList.toggle('on', i === k); li.classList.toggle('past', i < k); }); }
      nOut.textContent = r.n;
      if (!reduceB) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    items.forEach(function (li, i) { li.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); goTheme(i); }); });
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', function () { measured = false; kick(); });
    addEventListener('hashchange', function () { measured = false; setTimeout(kick, 50); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measured = false; kick(); });
    addEventListener('themechange', function () { colors(); kick(); });
    kick();
  })();

  (function () {
    // Hero motif: benzene pi orbital lobes over a hexagonal lattice, fine-line contour drawing
    var cv = document.getElementById('orbital'); if (!cv) return;
    var ctx = cv.getContext('2d');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var t0 = performance.now(), phase = 0;
    function tok(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
    function size() {
      var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d));
      ctx.setTransform(d, 0, 0, d, 0, 0);
      return r;
    }
    var box = size();
    function draw() {
      var W = box.width, H = box.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.2;
      var line = tok('--hero-line'), faint = tok('--hero-faint'), accent = tok('--accent');
      ctx.clearRect(0, 0, W, H);
      // background lattice
      ctx.strokeStyle = faint; ctx.lineWidth = 0.6;
      var s = R * 0.62, hh = s * Math.sqrt(3);
      for (var gy = -6; gy <= 6; gy++) for (var gx = -6; gx <= 6; gx++) {
        var px = cx + gx * s * 1.5, py = cy + gy * hh + (gx & 1 ? hh / 2 : 0);
        if (Math.hypot(px - cx, py - cy) > Math.min(W, H) * 0.49) continue;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; var x = px + s * Math.cos(a), y = py + s * Math.sin(a); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
      }
      // outer ring
      ctx.strokeStyle = faint; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.48, 0, Math.PI * 2); ctx.stroke();
      // orbital lobes: nested contours, alternating sign by atom
      var atoms = [];
      for (var i = 0; i < 6; i++) { var an = i * Math.PI / 3 + Math.PI / 6 + phase * 0.15; atoms.push([cx + R * Math.cos(an), cy + R * Math.sin(an), an]); }
      for (i = 0; i < 6; i++) {
        var A = atoms[i], sign = i % 2 ? 1 : -1;
        for (var c = 1; c <= 5; c++) {
          var sc = c / 5, breathe = 1 + 0.04 * Math.sin(phase + i + c * 0.4);
          var lx = R * 0.55 * sc * breathe, ly = R * 0.32 * sc * breathe;
          ctx.save(); ctx.translate(A[0], A[1]); ctx.rotate(A[2]);
          ctx.strokeStyle = sign > 0 ? accent : line;
          ctx.globalAlpha = sign > 0 ? 0.25 + 0.13 * c : 0.35 + 0.12 * c;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.ellipse(lx * 0.95 + R * 0.12, 0, lx, ly, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      // bonds and atoms
      ctx.strokeStyle = line; ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (i = 0; i <= 6; i++) { var P = atoms[i % 6]; i ? ctx.lineTo(P[0], P[1]) : ctx.moveTo(P[0], P[1]); }
      ctx.stroke();
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      for (i = 0; i < 6; i++) {
        ctx.fillStyle = tok('--paper'); ctx.strokeStyle = line;
        ctx.beginPath(); ctx.arc(atoms[i][0], atoms[i][1], 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    function loop(now) { phase = (now - t0) / 2600; draw(); if (!reduce) requestAnimationFrame(loop); }
    draw();
    if (!reduce) requestAnimationFrame(loop);
    window.addEventListener('resize', function () { box = size(); draw(); });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
    addEventListener('themechange', draw);
  })();
})();
