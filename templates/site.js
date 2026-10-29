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
    var gateY = [], stage = -1, ticking = false, geo = null, runs = [];
    // where Chrome supports scroll timelines, the light rides an animation the browser runs alongside the scroll itself,
    // so it stays smooth even when the page is busy or the laptop is in power-saving mode; elsewhere update() moves it
    var scrollLinked = !reduceW && typeof ScrollTimeline === 'function' && !!photon.animate;
    // near the bottom of the page the reading line can't reach the end of the wire, so speed the light up over the last stretch
    function lightAt(s) {
      var y0 = geo.H * 0.55 + s - geo.top, rem = Math.max(0, geo.maxS - s);
      return Math.min(geo.h, Math.max(0, y0 + geo.D * Math.max(0, 1 - rem / (geo.D + 300))));
    }
    function track() {
      runs.forEach(function (a) { a.cancel(); }); runs = [];
      if (!scrollLinked || geo.maxS <= 0) return;
      // lightAt is straight between these scroll positions, so a keyframe at each one traces it exactly
      var R = geo.D + 300, k = geo.D / R, c = geo.top - geo.H * 0.55;
      var pts = [0, geo.maxS, geo.maxS - R, c, c + geo.h,
        (c - geo.D + k * geo.maxS) / (1 + k), (c + geo.h - geo.D + k * geo.maxS) / (1 + k)];
      pts = pts.map(function (s) { return Math.min(geo.maxS, Math.max(0, s)); }).sort(function (a, b) { return a - b; });
      var frames = pts.filter(function (s, i) { return !i || s !== pts[i - 1]; }).map(function (s) {
        return { transform: 'translate3d(0,' + lightAt(s) + 'px,0)', offset: s / geo.maxS };
      });
      var timeline = new ScrollTimeline({ source: document.documentElement });
      [photon, cover].forEach(function (el) {
        el.style.transform = '';
        runs.push(el.animate(frames, { timeline: timeline, fill: 'both', easing: 'linear' }));
      });
    }
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
      var r = wire.getBoundingClientRect(), maxS = document.documentElement.scrollHeight - innerHeight;
      geo = { top: r.top + scrollY, h: r.height, H: innerHeight, maxS: maxS };
      geo.D = Math.max(0, geo.h - (geo.H * 0.55 + maxS - geo.top));
      track();
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
      if (!geo) return;
      var y = lightAt(scrollY);
      if (!scrollLinked) {
        photon.style.transform = 'translate3d(0,' + y + 'px,0)';
        cover.style.transform = 'translate3d(0,' + y + 'px,0)';
      }
      var n = 0; while (n < gateY.length && gateY[n] <= y) n++;
      setStage(n);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', function () { measure(); onScroll(); });
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); onScroll(); }).observe(document.body);
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
    // Group logo: a Bloch sphere with electrons orbiting its surface. The hero adds the circuit
    // (four qubits in on the left, four measurements on the right); the header shows the sphere alone.
    // Colours follow the old benzene drawing: navy lines, teal and navy electrons.
    var heroCv = document.getElementById('orbital'), markCv = document.getElementById('brand-logo');
    if (!heroCv && !markCv) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var TILT = 0.3, ct = Math.cos(TILT), st = Math.sin(TILT);
    function tok(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
    // fully transparent version of a hex colour, so gradients fade without going grey
    function fade(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c + '00' : 'rgba(0,0,0,0)'; }
    var C = {};
    function colors() {
      C.line = tok('--navy'); C.teal = tok('--accent'); C.paper = tok('--paper'); C.muted = tok('--muted');
    }
    // 3D point on the unit sphere (y up, z toward the viewer) to screen offset and depth
    function proj(p) { return [p[0], -p[1] * ct + p[2] * st, p[2] * ct + p[1] * st]; }
    function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
    function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    // a great circle with normal n, carrying electrons at the given phase offsets
    function orbit(n, color, speed, starts) {
      n = norm(n);
      var u = norm(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), v = cross(n, u);
      return { u: u, v: v, color: color, speed: speed, starts: starts };
    }
    // one electron per orbit, alternating teal and navy; the hero canvas's data-electrons picks how many
    var ORBITS = [
      orbit([0.445, 0.895, 0.014], 'teal', 0.55, [0]),
      orbit([-0.55, 0.8, 0.45], 'line', -0.42, [2.2]),
      orbit([0.9, 0.35, -0.5], 'teal', 0.34, [4.1]),
      orbit([1, -0.15, 0.25], 'line', -0.3, [1.1])
    ];
    function at(o, a) { var c = Math.cos(a), s = Math.sin(a); return proj([o.u[0] * c + o.v[0] * s, o.u[1] * c + o.v[1] * s, o.u[2] * c + o.v[2] * s]); }

    function drawOrbits(ctx, X, Y, R, t, front, lw, er, orbits) {
      orbits.forEach(function (o) {
        ctx.strokeStyle = C[o.color]; ctx.lineWidth = lw; ctx.globalAlpha = front ? 0.9 : 0.3;
        ctx.beginPath();
        var pen = false;
        for (var i = 0; i <= 96; i++) {
          var q = at(o, i / 96 * Math.PI * 2);
          if ((q[2] >= 0) === front) { pen ? ctx.lineTo(X + q[0] * R, Y + q[1] * R) : ctx.moveTo(X + q[0] * R, Y + q[1] * R); pen = true; } else pen = false;
        }
        ctx.stroke();
        o.starts.forEach(function (a0) {
          var q = at(o, a0 + t * o.speed);
          if ((q[2] >= 0) !== front) return;
          var r = er * (0.85 + 0.15 * q[2]);
          ctx.globalAlpha = front ? 1 : 0.45;
          var g = ctx.createRadialGradient(X + q[0] * R - r * 0.35, Y + q[1] * R - r * 0.35, r * 0.1, X + q[0] * R, Y + q[1] * R, r);
          g.addColorStop(0, '#fff'); g.addColorStop(0.35, C[o.color]); g.addColorStop(1, C[o.color]);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X + q[0] * R, Y + q[1] * R, r, 0, Math.PI * 2); ctx.fill();
        });
      });
      ctx.globalAlpha = 1;
    }
    function drawSphere(ctx, X, Y, R, lw) {
      ctx.save();
      ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.clip();
      var lg = ctx.createLinearGradient(X - R, Y, X + R, Y);
      lg.addColorStop(0, C.teal); lg.addColorStop(1, C.line);
      ctx.globalAlpha = 0.07; ctx.fillStyle = lg; ctx.fillRect(X - R, Y - R, 2 * R, 2 * R);
      var hl = ctx.createRadialGradient(X - R * 0.3, Y - R * 0.35, 0, X - R * 0.3, Y - R * 0.35, R * 1.1);
      hl.addColorStop(0, C.paper); hl.addColorStop(1, fade(C.paper));
      ctx.globalAlpha = 0.55; ctx.fillStyle = hl; ctx.fillRect(X - R, Y - R, 2 * R, 2 * R);
      ctx.restore();
      ctx.globalAlpha = 1; ctx.strokeStyle = C.line; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.stroke();
    }
    function drawGrid(ctx, X, Y, R, lw) {
      ctx.strokeStyle = C.line; ctx.lineWidth = lw * 0.5; ctx.globalAlpha = 0.22;
      [-0.55, 0, 0.55].forEach(function (h) { // latitudes
        var r = Math.sqrt(1 - h * h);
        ctx.beginPath(); ctx.ellipse(X, Y - h * ct * R, r * R, r * st * R, 0, 0, Math.PI * 2); ctx.stroke();
      });
      [Math.PI / 3].forEach(function (a) { // a meridian
        ctx.beginPath();
        for (var i = 0; i <= 64; i++) { var b = i / 64 * Math.PI * 2, q = proj([Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)]); i ? ctx.lineTo(X + q[0] * R, Y + q[1] * R) : ctx.moveTo(X + q[0] * R, Y + q[1] * R); }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    // axes: 'top' is the z axis running past the sphere with an arrowhead at the top only;
    // 'inside' keeps it within the sphere with arrowheads at both ends; 'none' draws no axis
    function arrow(ctx, x0, y0, x1, y1, ah) {
      var a = Math.atan2(y1 - y0, x1 - x0), c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ah * c + ah * 0.45 * s, y1 - ah * s - ah * 0.45 * c); ctx.lineTo(x1 - ah * c - ah * 0.45 * s, y1 - ah * s + ah * 0.45 * c); ctx.closePath(); ctx.fill();
    }
    function drawAxis(ctx, X, Y, R, lw, mode) {
      if (mode === 'none') return;
      var ah = Math.max(3, R * 0.07);
      ctx.strokeStyle = C.line; ctx.fillStyle = C.line; ctx.lineWidth = lw * 0.8; ctx.lineCap = 'butt';
      if (mode === 'top' || !mode) {
        var top = Y - R * 1.18, bot = Y + R * 1.12;
        ctx.beginPath(); ctx.moveTo(X, top + ah); ctx.lineTo(X, bot); ctx.stroke();
        arrow(ctx, X, top + ah, X, top, ah);
        return;
      }
      var rim = R - lw * 0.6;
      // up and down arrows whose tips touch the sphere's outline
      ctx.beginPath(); ctx.moveTo(X, Y - rim + ah); ctx.lineTo(X, Y + rim - ah); ctx.stroke();
      arrow(ctx, X, Y, X, Y - rim, ah); arrow(ctx, X, Y, X, Y + rim, ah);
    }
    function sphere(ctx, X, Y, R, t, lw, er, orbits, grid, axis) {
      drawOrbits(ctx, X, Y, R, t, false, lw, er, orbits);
      drawSphere(ctx, X, Y, R, lw);
      if (grid) drawGrid(ctx, X, Y, R, lw);
      drawAxis(ctx, X, Y, R, lw, axis);
      drawOrbits(ctx, X, Y, R, t, true, lw, er, orbits);
    }

    // circuit around the sphere: four qubits in on the left, four measurements on the right
    var WIRES = [-0.6, -0.2, 0.2, 0.6], KETS = ['0', '0', '1', '1'];
    function drawCircuit(ctx, W, H, t, orbits, axis) {
      var R = Math.min(H / 2.5, W / 3.9), X = W / 2 + R * 0.08, Y = H / 2, lw = Math.max(1, R / 70);
      // left wires start as far from the sphere's axis as the measurement boxes begin on the right
      var gx = X + R * 1.42, gs = R * 0.24, x0 = X - (gx - gs / 2 - X);
      ctx.lineCap = 'round'; ctx.lineWidth = lw * 1.5; ctx.strokeStyle = C.line;
      ctx.font = (R * 0.15) + 'px ' + tok('--font-mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      WIRES.forEach(function (h, i) {
        var y = Y + h * R, edge = Math.sqrt(1 - h * h) * R;
        ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(X - edge, y); ctx.moveTo(X + edge, y); ctx.lineTo(gx - gs / 2, y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = C.line;
        ctx.fillText('|' + KETS[i] + '⟩', x0 - R * 0.06, y);
      });
      sphere(ctx, X, Y, R, t, lw * 1.4, R * 0.075, orbits, true, axis);
      WIRES.forEach(function (h) {
        var y = Y + h * R;
        ctx.fillStyle = C.paper; ctx.strokeStyle = C.line; ctx.lineWidth = lw * 1.4;
        ctx.beginPath(); ctx.roundRect(gx - gs / 2, y - gs / 2, gs, gs, gs * 0.12); ctx.fill(); ctx.stroke();
        ctx.lineWidth = lw * 1.2;
        ctx.beginPath(); ctx.arc(gx, y + gs * 0.18, gs * 0.3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, y + gs * 0.18); ctx.lineTo(gx + gs * 0.2, y - gs * 0.22); ctx.stroke();
      });
    }
    // header mark: the sphere alone, with one teal and one navy electron
    var MARK = [orbit([0.445, 0.895, 0.014], 'teal', 0.7, [0]), orbit([-0.55, 0.8, 0.45], 'line', -0.55, [2.6])];
    function drawMark(ctx, W, H, t) {
      var R = Math.min(W, H) * 0.4;
      sphere(ctx, W / 2, H / 2, R, t, Math.max(1, R / 12), R * 0.17, MARK, false, 'none');
    }

    function canvas(cv, paint) {
      if (!cv) return null;
      var ctx = cv.getContext('2d'), box;
      function size() {
        box = cv.getBoundingClientRect(); var d = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, Math.round(box.width * d)); cv.height = Math.max(1, Math.round(box.height * d));
        ctx.setTransform(d, 0, 0, d, 0, 0);
      }
      size();
      return { size: size, draw: function (t) { ctx.clearRect(0, 0, box.width, box.height); paint(ctx, box.width, box.height, t); } };
    }
    var heroOrbits = heroCv ? ORBITS.slice(0, +heroCv.dataset.electrons || 2) : [];
    var views = [canvas(heroCv, function (ctx, W, H, t) { drawCircuit(ctx, W, H, t, heroOrbits, heroCv.dataset.axis); }), canvas(markCv, drawMark)].filter(Boolean);
    var t0 = performance.now(), still = 1.2;
    function frame(now) { var t = reduce ? still : (now - t0) / 1000; views.forEach(function (v) { v.draw(t); }); }
    function loop(now) { frame(now); requestAnimationFrame(loop); }
    colors();
    reduce ? frame(0) : requestAnimationFrame(loop);
    window.addEventListener('resize', function () { views.forEach(function (v) { v.size(); }); if (reduce) frame(0); });
    function recolor() { colors(); if (reduce) frame(0); }
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
    addEventListener('themechange', recolor);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (reduce) frame(0); });
  })();
})();
