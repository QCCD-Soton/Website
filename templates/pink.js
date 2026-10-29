// Pink mode: a hidden theme. Tap the "&" in the home page title five times quickly (or type the Konami code) to switch it on or off.
(function () {
  var root = document.documentElement, KEY = 'qccd-pink';

  function badge(on) {
    var b = document.querySelector('.pink-badge'), sub = document.querySelector('.brand-sub');
    if (on && !b && sub) sub.insertAdjacentHTML('beforeend', '<span class="pink-badge">♥ pink mode</span>');
    if (!on && b) b.remove();
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'pink-toast'; t.setAttribute('role', 'status');
    t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 500); }, 3000);
  }
  function setPink(on) {
    if (on) root.setAttribute('data-pink', ''); else root.removeAttribute('data-pink');
    try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) {}
    badge(on);
    window.dispatchEvent(new Event('themechange'));   // the canvases re-read their colours
    toast(on ? 'Secret unlocked: pink mode ♥' : 'Pink mode off');
  }
  function toggle() { setPink(!root.hasAttribute('data-pink')); }
  badge(root.hasAttribute('data-pink'));

  // Five taps on the title's "&" within two and a half seconds
  var h1 = document.getElementById('hero-title');
  if (h1) {
    h1.innerHTML = h1.innerHTML.replace('&amp;', '<span class="pink-amp">&amp;</span>');
    var amp = h1.querySelector('.pink-amp'), taps = [];
    amp.addEventListener('click', function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 2500; }); taps.push(now);
      amp.classList.add('tap'); setTimeout(function () { amp.classList.remove('tap'); }, 150);
      if (taps.length >= 5) { taps = []; toggle(); }
    });
  }

  // Konami code for keyboards
  var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
  addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) { pos = 0; toggle(); }
  });

  // Hearts where you click, only while pink mode is on
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  addEventListener('pointerdown', function (e) {
    if (!root.hasAttribute('data-pink')) return;
    for (var i = 0; i < 6; i++) {
      var s = document.createElement('span'), a = i / 6 * 6.283 + Math.random() * .6, r = 22 + Math.random() * 18;
      s.className = 'pink-spark'; s.textContent = '♥'; s.style.fontSize = '10px'; s.style.lineHeight = '8px';
      s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
      s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px');
      document.body.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 800);
    }
  });
})();
