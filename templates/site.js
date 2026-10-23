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

  // Publications: the latest few are shown, the rest on request; a year button shows every paper from that year
  var chips = document.querySelectorAll('.pub-tools .chip'), pubs = document.querySelectorAll('.pub');
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
      gateY.forEach(function (y, i) { wire.style.setProperty('--g' + (i + 1), (y / h * 100).toFixed(3) + '%'); });
    }
    function setStage(n) {
      if (n === stage) return;
      var prev = stage; stage = n;
      wire.setAttribute('data-stage', n);
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
      if (reduceW) { setStage(4); return; }
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

  // Classical research page: a small physics picture in the side panel doubles as the scroll bar.
  // Six pictures are drawn below; `classical_scrollbar` in content/site.yml picks one (data-mode on #cbox).
  // Drag the picture to scroll, click a theme name to jump to it
  (function () {
    var page = document.getElementById('research-classical'), box = document.getElementById('cwire'), side = document.getElementById('cbox');
    if (!page || !box || !side) return;
    var card = side.querySelector('.cbox'), cv = side.querySelector('canvas'), ctx = cv.getContext('2d');
    var nOut = side.querySelector('.cbox-n'), title = side.querySelector('.cbox .eyebrow');
    var themes = Array.prototype.slice.call(box.querySelectorAll('.theme'));
    var names = themes.map(function (t) { return t.querySelector('h3').textContent; });
    var items = Array.prototype.slice.call(side.querySelectorAll('.cbox-list li'));
    var reduceB = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = 0, C = {}, s0 = 0, s1 = 1, bnd = [0, .25, .5, .75], k = -1, measured = false, PAD = 12, mode = 1;
    var TITLES = [null, 'Particle in a box', 'Benzene π orbital', 'Reaction path', 'Spectrometer', 'Electron density', 'Tunnelling'];
    var TALL = [false, true, false, false, true, false, true];
    var m0 = +side.dataset.mode; if (m0 >= 1 && m0 <= 6) mode = m0;

    function rgba(hex, a) {
      var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
      var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    function colors() {
      var cs = getComputedStyle(document.documentElement);
      function t(n) { return cs.getPropertyValue(n).trim(); }
      C = { accent: t('--accent'), ink: t('--ink'), line: t('--line'), muted: t('--muted'), wash: t('--accent-wash'), ink2: t('--ink-2') };
    }
    function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function smooth(f) { return f * f * (3 - 2 * f); }
    function measure() {
      if (!page.offsetParent) return;
      var top = box.getBoundingClientRect().top + scrollY, h = box.offsetHeight;
      var maxS = document.documentElement.scrollHeight - innerHeight;
      s0 = Math.max(0, top - innerHeight * .4);
      s1 = Math.max(s0 + 1, Math.min(maxS, top + h - innerHeight * .6));
      bnd = themes.map(function (t) { return cl((t.getBoundingClientRect().top + scrollY - innerHeight * .4 - s0) / (s1 - s0), 0, 1); });
      var H = cv.clientHeight;
      items.forEach(function (li, i) { li.style.top = TALL[mode] ? (PAD + bnd[i] * (H - 2 * PAD)) + 'px' : ''; });
      colors(); measured = true; cache = {};
    }
    function prog() { return cl((scrollY - s0) / (s1 - s0), 0, 1); }
    function secOf(p) { var i = 0; while (i + 1 < bnd.length && bnd[i + 1] <= p + 1e-4) i++; return i; }
    function local(p) { var kk = secOf(p), b0 = bnd[kk], b1 = kk + 1 < bnd.length ? bnd[kk + 1] : 1; return { k: kk, f: cl((p - b0) / Math.max(1e-3, b1 - b0), 0, 1) }; }
    function goP(p) { scrollTo(0, s0 + cl(p, 0, 1) * (s1 - s0)); }
    function goTheme(i) { i = cl(i, 0, themes.length - 1); goP(bnd[i] + .002); }
    function marker(ctx, W, T, B, p) {
      var yp = T + p * (B - T);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, yp); ctx.lineTo(W, yp); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(W - 1.5, yp, 3, 0, 6.2832); ctx.fill();
    }
    // marching squares: line segments where f crosses level on an nx x ny grid over the canvas
    function contour(F, nx, ny, W, H, level) {
      var seg = [], dx = W / (nx - 1), dy = H / (ny - 1);
      function lerp(a, b) { return (level - a) / (b - a); }
      for (var j = 0; j < ny - 1; j++) for (var i = 0; i < nx - 1; i++) {
        var a = F[j * nx + i], b = F[j * nx + i + 1], c = F[(j + 1) * nx + i + 1], d = F[(j + 1) * nx + i];
        var idx = (a > level) | (b > level) << 1 | (c > level) << 2 | (d > level) << 3;
        if (idx === 0 || idx === 15) continue;
        var x = i * dx, y = j * dy, pts = [];
        if ((a > level) !== (b > level)) pts.push([x + lerp(a, b) * dx, y]);
        if ((b > level) !== (c > level)) pts.push([x + dx, y + lerp(b, c) * dy]);
        if ((d > level) !== (c > level)) pts.push([x + lerp(d, c) * dx, y + dy]);
        if ((a > level) !== (d > level)) pts.push([x, y + lerp(a, d) * dy]);
        if (pts.length >= 2) seg.push(pts[0], pts[1]);
        if (pts.length === 4) seg.push(pts[2], pts[3]);
      }
      return seg;
    }
    function strokeSeg(seg) { ctx.beginPath(); for (var i = 0; i < seg.length; i += 2) { ctx.moveTo(seg[i][0], seg[i][1]); ctx.lineTo(seg[i + 1][0], seg[i + 1][1]); } ctx.stroke(); }
    var cache = {};

    // 1. Particle in a box: each theme adds a node; between themes the state is a superposition, so the density sloshes
    function d1(W, H, p, t) {
      var T = PAD, B = H - PAD, cx = W / 2, A = W / 2 - 3, L = local(p), f = smooth(L.f);
      var n = L.k + 1, m = n + 1, c1 = Math.sqrt(1 - f), c2 = Math.sqrt(f), En = .55 * n * n, Em = .55 * m * m, pts = [];
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
      marker(ctx, W, T, B, p);
      return f < .08 ? 'n = ' + n : f > .92 && L.k + 1 < bnd.length ? 'n = ' + m : 'n = ' + n + ' → ' + m;
    }

    // 2. The benzene π orbital from the home page draws itself in, contour by contour
    function d2(W, H, p, t) {
      var cx = W / 2, cy = H / 2, R = Math.min(W, H) * .17, rot = reduceB ? 0 : t * .05, drawn = 0;
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath();
      for (var i = 0; i <= 6; i++) { var a = rot - Math.PI / 2 + i * Math.PI / 3, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      for (i = 0; i < 6; i++) {
        var q = cl(p * 6.3 - i * 1.02, 0, 1), ang = rot - Math.PI / 2 + i * Math.PI / 3;
        var vx = cx + Math.cos(ang) * R, vy = cy + Math.sin(ang) * R;
        ctx.fillStyle = q > 0 ? C.ink : C.line; ctx.beginPath(); ctx.arc(vx, vy, 2.2, 0, 6.2832); ctx.fill();
        if (q <= 0) continue;
        drawn++;
        var lx = cx + Math.cos(ang) * R * 1.62, ly = cy + Math.sin(ang) * R * 1.62;
        [1, .72, .46].forEach(function (s, j) {
          var qq = cl(q * 1.6 - j * .3, 0, 1); if (qq <= 0) return;
          ctx.strokeStyle = i % 2 ? rgba(C.muted, .8) : C.accent; ctx.lineWidth = j ? 1 : 1.4;
          ctx.beginPath(); ctx.ellipse(lx - Math.cos(ang) * R * .62 * (1 - s), ly - Math.sin(ang) * R * .62 * (1 - s), R * .62 * s, R * .36 * s, ang, 0, qq * 6.2832); ctx.stroke();
        });
      }
      if (p > .97) { ctx.setLineDash([2, 3]); ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.arc(cx, cy, R * .62, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = C.ink; ctx.fillRect(0, H - 3, W * p, 3);
      return drawn + ' of 6 lobes';
    }

    // 3. A marble rolls along the reaction path on a potential energy surface, stopping at a waypoint for each theme
    var WP = [[.2, .14], [.72, .36], [.28, .62], [.74, .87]];
    function pes(u, v) {
      var V = 1.2 * ((u - .5) * (u - .5) + (v - .5) * (v - .5) * .5);
      WP.forEach(function (w, i) { var d = (u - w[0]) * (u - w[0]) + (v - w[1]) * (v - w[1]); V -= (.55 + .1 * i) * Math.exp(-d / .02); });
      V -= .25 * Math.exp(-((u - .5) * (u - .5) + (v - .25) * (v - .25)) / .03) + .25 * Math.exp(-((u - .5) * (u - .5) + (v - .75) * (v - .75)) / .03);
      return V;
    }
    function pathAt(s) { // Catmull-Rom through the waypoints, s in [0, 3]
      var i = Math.min(2, Math.floor(s)), f = s - i, P = [WP[Math.max(0, i - 1)], WP[i], WP[i + 1], WP[Math.min(3, i + 2)]];
      function cr(a, b, c, d) { return .5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f); }
      return [cr(P[0][0], P[1][0], P[2][0], P[3][0]), cr(P[0][1], P[1][1], P[2][1], P[3][1])];
    }
    function d3(W, H, p, t) {
      var key = 'pes' + W + 'x' + H;
      if (!cache[key]) {
        var nx = 46, ny = Math.round(46 * H / W), F = new Float32Array(nx * ny), lo = 1e9, hi = -1e9;
        for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) { var v = pes(i / (nx - 1), j / (ny - 1)); F[j * nx + i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
        cache[key] = []; for (var l = 1; l <= 11; l++) cache[key].push(contour(F, nx, ny, W, H, lo + (hi - lo) * l / 12));
      }
      cache[key].forEach(function (seg, l) { ctx.strokeStyle = l < 4 ? rgba(C.accent, .55 - l * .08) : C.line; ctx.lineWidth = 1; strokeSeg(seg); });
      var L = local(p), s = L.k < 3 ? L.k + smooth(L.f) : 3;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ctx.beginPath();
      for (var q = 0; q <= s + 1e-6; q += .04) { var pt = pathAt(Math.min(q, s)); if (!q) ctx.moveTo(pt[0] * W, pt[1] * H); else ctx.lineTo(pt[0] * W, pt[1] * H); }
      ctx.stroke(); ctx.setLineDash([]);
      WP.forEach(function (w, i) {
        ctx.fillStyle = i <= L.k ? C.ink : 'transparent'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(w[0] * W, w[1] * H, 4, 0, 6.2832); ctx.fill(); ctx.stroke();
      });
      var m = pathAt(s), wob = L.k === 3 && !reduceB ? 1.5 * Math.sin(t * 3) : 0;
      var gr = ctx.createRadialGradient(m[0] * W + wob, m[1] * H, 0, m[0] * W + wob, m[1] * H, 13);
      gr.addColorStop(0, rgba(C.accent, .5)); gr.addColorStop(1, rgba(C.accent, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(m[0] * W + wob, m[1] * H, 13, 0, 6.2832); ctx.fill();
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(m[0] * W + wob, m[1] * H, 5.5, 0, 6.2832); ctx.fill();
      return ['minimum', 'conical intersection', 'solvent basin', 'excitation'][L.k];
    }

    // 4. A spectrometer sweeps down in wavelength; peaks appear as each theme is reached, coloured by the light
    var PK = [[[.45, .95, 7]], [[.5, .55, 40]], [[.32, .5, 5], [.45, .8, 5], [.58, .45, 5]], [[.25, .9, 6], [.4, .65, 6], [.55, .42, 6], [.7, .25, 6]]];
    function wl(nm) {
      var r = 0, g = 0, b = 0;
      if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
      else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
      var k2 = nm < 420 ? .4 + .6 * (nm - 380) / 40 : nm > 700 ? .4 + .6 * (750 - nm) / 50 : 1;
      return 'rgb(' + Math.round(255 * r * k2) + ',' + Math.round(255 * g * k2) + ',' + Math.round(255 * b * k2) + ')';
    }
    function d4(W, H, p, t) {
      var T = PAD, B = H - PAD, x0 = 9, M = W - 13;
      function spec(y) {
        var v = .02 * (1 + Math.sin(y * 1.7) * Math.sin(y * .31));
        for (var kk = 0; kk < bnd.length; kk++) {
          var a = T + bnd[kk] * (B - T), b = T + (kk + 1 < bnd.length ? bnd[kk + 1] : 1) * (B - T);
          PK[kk].forEach(function (q) { var d = y - (a + q[0] * (b - a)); v += q[1] * q[2] * q[2] / (d * d + q[2] * q[2]); });
        }
        return Math.min(1, v);
      }
      for (var y = T; y < B; y += 2) { ctx.fillStyle = wl(380 + 370 * (y - T) / (B - T)); ctx.fillRect(2, y, 3, 2); }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, T); ctx.lineTo(x0, B); ctx.stroke();
      var yp = T + p * (B - T);
      for (y = T; y < yp; y += 2) {
        var c = wl(380 + 370 * (y - T) / (B - T)), v = spec(y), v2 = spec(y + 2);
        ctx.fillStyle = c.replace('rgb', 'rgba').replace(')', ',.22)'); ctx.fillRect(x0, y, v * M, 2);
        ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + v * M, y); ctx.lineTo(x0 + v2 * M, y + 2); ctx.stroke();
      }
      marker(ctx, W, T, B, p);
      return Math.round(380 + 370 * p) + ' nm';
    }

    // 5. Electron density contours that reshape into a different molecule for each theme
    var MOL = (function () {
      function ring(n, r, cx, cy, w, a0) { var o = []; for (var i = 0; i < n; i++) { var a = (a0 || 0) + i * 2 * Math.PI / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a), w]); } return o; }
      function pad(a) { while (a.length < 12) a.push([0, 0, 0]); return a; }
      return [
        pad([[-.42, 0, 1], [-.14, .08, 1], [.14, -.08, 1], [.42, 0, 1], [-.55, .22, .5], [.55, -.22, .5]]),
        pad(ring(6, .3, 0, 0, 1, Math.PI / 6).concat(ring(6, .52, 0, 0, .45, Math.PI / 6))),
        pad([[0, 0, 1.6]].concat(ring(6, .42, 0, 0, .7, 0))),
        pad(ring(6, .24, -.21, 0, 1, Math.PI / 6).concat(ring(6, .24, .21, 0, 1, Math.PI / 6)).slice(0, 12))
      ];
    })();
    function d5(W, H, p, t) {
      var L = local(p), f = smooth(cl((L.f - .55) / .45, 0, 1)), A = MOL[L.k], Bm = MOL[Math.min(3, L.k + 1)];
      var rot = reduceB ? 0 : t * .08, S = Math.min(W, H) * .78, cx = W / 2, cy = H / 2, at = [];
      for (var i = 0; i < 12; i++) {
        var x = A[i][0] + (Bm[i][0] - A[i][0]) * f, y = A[i][1] + (Bm[i][1] - A[i][1]) * f, w = A[i][2] + (Bm[i][2] - A[i][2]) * f;
        var c = Math.cos(rot), s = Math.sin(rot);
        at.push([cx + (x * c - y * s) * S * .5 / .6, cy + (x * s + y * c) * S * .5 / .6, w]);
      }
      var nx = 48, ny = Math.round(48 * H / W), F = new Float32Array(nx * ny), sg = (S * .09) * (S * .09);
      for (var j = 0; j < ny; j++) for (var ii = 0; ii < nx; ii++) {
        var px = ii * W / (nx - 1), py = j * H / (ny - 1), v = 0;
        for (var a = 0; a < 12; a++) if (at[a][2] > 0) { var dx = px - at[a][0], dy = py - at[a][1]; v += at[a][2] * Math.exp(-(dx * dx + dy * dy) / sg); }
        F[j * nx + ii] = v;
      }
      [.18, .35, .6, .9, 1.25].forEach(function (lv, l) { ctx.strokeStyle = rgba(C.accent, .35 + l * .15); ctx.lineWidth = l === 4 ? 1.4 : 1; strokeSeg(contour(F, nx, ny, W, H, lv)); });
      at.forEach(function (q) { if (q[2] > .2) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(q[0], q[1], 1.6, 0, 6.2832); ctx.fill(); } });
      ctx.fillStyle = C.ink; ctx.fillRect(0, H - 3, W * p, 3);
      return ['diradical', 'aromatic ring', 'solvated ion', 'dye'][f > .5 ? Math.min(3, L.k + 1) : L.k];
    }

    // 6. A wavepacket in a double well; the further down the page, the more it tunnels into the far well
    function d6(W, H, p, t) {
      var T = PAD, B = H - PAD, x0 = 4, M = W - 10, P = .15 + .85 * p, a = reduceB ? P / 2 : P * Math.pow(Math.sin(t * .9), 2);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2; ctx.beginPath();
      for (var y = T; y <= B; y += 2) { var u = (y - T) / (B - T), V = Math.pow((u - .5) * (u - .5) - .0625, 2) / .0039; var x = x0 + cl(V, 0, 1) * M; if (y === T) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, T);
      for (y = T; y <= B; y += 2) {
        var uu = (y - T) / (B - T), gl = Math.exp(-Math.pow((uu - .25) / .07, 2)), gr = Math.exp(-Math.pow((uu - .75) / .07, 2));
        ctx.lineTo(x0 + ((1 - a) * gl + a * gr) * M * .85, y);
      }
      ctx.lineTo(x0, B); ctx.closePath(); ctx.fillStyle = rgba(C.accent, .2); ctx.fill(); ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.stroke();
      marker(ctx, W, T, B, p);
      return 'tunnelling ' + Math.round(a * 100) + '%';
    }

    var DR = [null, d1, d2, d3, d4, d5, d6];
    function setMode(v) {
      mode = v; title.textContent = TITLES[v];
      card.classList.toggle('wide', !TALL[v]); card.dataset.mode = v;
      measured = false; k = -1; kick();
    }

    function frame(now) {
      raf = 0;
      if (!page.offsetParent) return;
      if (!measured) measure();
      var dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var p = prog(), kk = secOf(p);
      nOut.textContent = DR[mode](W, H, p, reduceB ? 0 : now / 1000);
      if (kk !== k) { k = kk; items.forEach(function (li, i) { li.classList.toggle('on', i === k); li.classList.toggle('past', i < k); }); }
      cv.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      cv.setAttribute('aria-valuetext', names[kk]);
      if (!reduceB) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    var drag = null;
    function pAt(e) { var r = cv.getBoundingClientRect(); return TALL[mode] ? (e.clientY - r.top - PAD) / (r.height - 2 * PAD) : drag.p0 + (e.clientY - drag.y0) / (r.height * 1.5); }
    cv.addEventListener('pointerdown', function (e) {
      drag = { p0: prog(), y0: e.clientY }; cv.setPointerCapture(e.pointerId); card.classList.add('dragging');
      if (TALL[mode]) goP(pAt(e));
    });
    cv.addEventListener('pointermove', function (e) { if (drag) goP(pAt(e)); });
    cv.addEventListener('pointerup', function () { drag = null; card.classList.remove('dragging'); });
    cv.addEventListener('keydown', function (e) {
      var kk = secOf(prog());
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTheme(kk + 1); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTheme(prog() - bnd[kk] > .02 ? kk : kk - 1); }
    });
    items.forEach(function (li, i) { li.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); goTheme(i); }); });
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', function () { measured = false; kick(); });
    addEventListener('hashchange', function () { measured = false; setTimeout(kick, 50); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measured = false; kick(); });
    addEventListener('themechange', function () { colors(); kick(); });
    setMode(mode);
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
