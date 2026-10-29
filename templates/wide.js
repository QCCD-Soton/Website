// Wide mode: a hidden layout for the group's ultrawide monitor owners. Tap Kyle's or Luke's card on the People page five times quickly to switch it on or off.
// It stretches the whole page sideways to fill the window, so it only accepts an ultrawide-shaped window; a maximised 16:9 one is rejected.
(function () {
  var root = document.documentElement, KEY = 'qccd-wide', WIDE_BOYS = ['kyle-acheson', 'luke-wright'];
  var MAXW = 1180;   // the layout's content width (--maxw in style.css)
  // Ultrawide: at least 1600px wide and 2.25 times as wide as tall (a maximised 21:9 browser is about 2.6, a 16:9 one about 2). Matches wide.css.
  var ultrawide = matchMedia('(min-width: 1600px) and (min-aspect-ratio: 9/4)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // How far to stretch: the content goes from its usual width to the window, less the usual 32px gutters
  function fit() { root.style.setProperty('--wide-s', Math.max(1, (innerWidth - 64) / MAXW).toFixed(4)); }
  fit(); addEventListener('resize', fit);

  function badge(on) {
    var b = document.querySelector('.wide-badge'), sub = document.querySelector('.brand-sub');
    if (on && !b && sub) sub.insertAdjacentHTML('beforeend', '<span class="wide-badge">↔ wide mode</span>');
    if (!on && b) b.remove();
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'wide-toast'; t.setAttribute('role', 'status');
    t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 500); }, 3500);
  }
  function play(cls) {
    if (reduce) return;
    root.classList.remove('wide-anim', 'wide-reject'); void root.offsetWidth;
    root.classList.add(cls);
    setTimeout(function () { root.classList.remove(cls); }, 1300);
  }
  function setWide(on) {
    if (on && !ultrawide.matches) { play('wide-reject'); toast('Wide mode rejected: this window isn’t wide enough. Ultrawides only.'); return; }
    play('wide-anim');
    if (on) root.setAttribute('data-wide', ''); else root.removeAttribute('data-wide');
    try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) {}
    badge(on);
    toast(on ? 'Secret unlocked: wide mode ↔ Welcome, wide boy.' : 'Wide mode off. Back to sensible widths.');
  }
  badge(root.hasAttribute('data-wide'));

  // Five taps on Kyle's or Luke's card within two and a half seconds; each tap stretches the card a little
  WIDE_BOYS.forEach(function (id) {
    var card = document.getElementById(id), taps = [];
    if (!card) return;
    function tap() {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 2500; }); taps.push(now);
      card.style.setProperty('--wide-tap', taps.length);
      clearTimeout(card.wideTimer);
      card.wideTimer = setTimeout(function () { card.style.removeProperty('--wide-tap'); }, taps.length >= 5 ? 0 : 900);
      if (taps.length >= 5) { taps = []; card.classList.remove('flipped'); card.setAttribute('aria-pressed', 'false'); setWide(!root.hasAttribute('data-wide')); }
    }
    card.addEventListener('click', function (e) { if (!e.target.closest('a')) tap(); });
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') tap(); });
  });
})();
