// Fish chase: a hidden game. Click the little fish at the bottom of any page and it swims off across the site.
// Follow it from page to page (the menu link it hid behind gets a small fish) and click it to catch it on the last page.
// Catching it swaps the home page group photo for the one where the group holds Karl Michael like a fish.
// The chase and the catch last for the browser tab (sessionStorage); clicking the footer fish again after a catch throws it back.
(function () {
  var root = document.documentElement, KEY = 'qccd-fish', CAUGHT = 'qccd-fish-caught';
  var HOPS = 3;          // pages it swims to before it can be caught
  var LINGER = 9000;     // ms it swims around a page before fleeing on its own (not on the last page)
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FISH = '<svg viewBox="0 0 24 16" aria-hidden="true"><path d="M2.5 8c3-4.6 9.2-5.6 14.3-1.4L21.5 3v10l-4.7-3.6C11.7 13.6 5.5 12.6 2.5 8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"></path><circle cx="6.6" cy="7.2" r=".95" fill="currentColor"></circle><path d="M10.5 5.6c.9 1.5.9 3.3 0 4.8" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"></path></svg>';

  function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function state() { try { return JSON.parse(get(KEY)); } catch (e) { return null; } }
  function save(s) { set(KEY, s ? JSON.stringify(s) : null); }
  function norm(p) { return p.replace(/index\.html$/, '').replace(/\/?$/, '/'); }
  var here = norm(location.pathname);

  function toast(msg, ms) {
    var t = document.createElement('div'); t.className = 'fish-toast'; t.setAttribute('role', 'status');
    t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 500); }, ms || 3200);
  }

  // Pages the fish can swim to: every page in the footer menu, plus home
  function pages() {
    var seen = {}, out = [{ href: '/', name: 'Home' }];
    document.querySelectorAll('nav.foot-col a').forEach(function (a) {
      var p = norm(new URL(a.href, location.href).pathname);
      if (!seen[p]) { seen[p] = 1; out.push({ href: p, name: a.textContent.trim() }); }
    });
    return out;
  }
  // The links to a page, in the header and footer menus
  function linksTo(href) {
    return Array.prototype.filter.call(document.querySelectorAll('#nav a, nav.foot-col a, a.brand'), function (a) {
      return norm(new URL(a.href, location.href).pathname) === href;
    });
  }
  function markLinks(href) {
    document.querySelectorAll('.fish-here').forEach(function (a) { a.classList.remove('fish-here'); });
    if (href) linksTo(href).forEach(function (a) { if (!a.classList.contains('brand')) a.classList.add('fish-here'); });
  }

  function setCaught(on) {
    if (on) root.setAttribute('data-fish-caught', ''); else root.removeAttribute('data-fish-caught');
    set(CAUGHT, on ? '1' : null);
  }

  // The fish in the footer, which starts the chase
  var legal = document.querySelector('.legal');
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'fish-btn'; btn.innerHTML = FISH;
  btn.setAttribute('aria-label', 'A fish');
  if (legal) legal.appendChild(btn);
  function hideBtn(on) { btn.classList.toggle('gone', on); }

  btn.addEventListener('click', function () {
    if (root.hasAttribute('data-fish-caught')) {
      setCaught(false); toast('You threw it back. Off it swims 🐟');
      return;
    }
    if (state()) return;
    hideBtn(true);
    save({ hop: 0, page: here });
    toast('Catch me if you can!');
    var r = btn.getBoundingClientRect();
    swim(r.left + r.width / 2, r.top + r.height / 2);
  });

  // The swimming fish
  var el, x, y, vx, vy, tx, ty, raf, fleeing = false, entered = false, lingerTimer, ptr = { x: -1e4, y: -1e4 };
  addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });

  function newTarget() {
    var m = 60;
    tx = m + Math.random() * Math.max(1, innerWidth - 2 * m);
    ty = 90 + Math.random() * Math.max(1, innerHeight - 90 - m);
  }
  function swim(sx, sy) {
    var s = state(); if (!s) return;
    el = document.createElement('button');
    el.type = 'button'; el.className = 'fish-swim'; el.innerHTML = '<span>' + FISH + '</span>';
    el.setAttribute('aria-label', s.hop >= HOPS ? 'Catch the fish' : 'The fish');
    document.body.appendChild(el);
    x = sx; y = sy; vx = -2; vy = -2; newTarget();
    el.addEventListener('click', onFishClick);
    if (reduce) {
      // No swimming: it sits still in a corner of the window until clicked
      x = innerWidth - 70; y = innerHeight - 90; place(0);
    } else {
      raf = requestAnimationFrame(step);
    }
    if (s.hop < HOPS) lingerTimer = setTimeout(flee, LINGER);
  }
  function place(angle) {
    el.style.transform = 'translate(' + (x - 22) + 'px,' + (y - 22) + 'px)';
    var face = vx > 0 ? -1 : 1;   // the drawing faces left
    el.firstChild.style.transform = 'scaleX(' + face + ') rotate(' + (angle * face) + 'deg)';
  }
  function step() {
    var s = state() || { hop: 0 }, last = s.hop >= HOPS;
    var speed = fleeing ? 9 : (last ? 3.2 : 4.2);
    var dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
    if (!fleeing && d < 30) newTarget();
    vx += dx / d * .35; vy += dy / d * .35;
    // Dart away from the pointer when it gets close
    var px = x - ptr.x, py = y - ptr.y, pd = Math.hypot(px, py);
    if (!fleeing && pd < 110) { var push = (last ? .9 : 1.6) * (1 - pd / 110); vx += px / (pd || 1) * push * 3; vy += py / (pd || 1) * push * 3; }
    var v = Math.hypot(vx, vy), max = pd < 110 && !fleeing ? speed * 1.6 : speed;
    if (v > max) { vx = vx / v * max; vy = vy / v * max; }
    x += vx; y += vy;
    // Stay in the window
    if (!entered) entered = x > 24 && x < innerWidth - 24;
    if (!fleeing && entered) { x = Math.min(Math.max(x, 24), innerWidth - 24); y = Math.min(Math.max(y, 70), innerHeight - 24); }
    place(Math.max(-25, Math.min(25, Math.atan2(vy, Math.abs(vx)) * 57)));
    if (fleeing && Math.hypot(tx - x, ty - y) < 20) { gone(); return; }
    raf = requestAnimationFrame(step);
  }
  function gone() {
    cancelAnimationFrame(raf);
    if (el) { el.classList.add('out'); var e = el; setTimeout(function () { e.remove(); }, 400); el = null; }
  }

  function flee() {
    var s = state(); if (!s || fleeing) return;
    clearTimeout(lingerTimer);
    var list = pages().filter(function (p) { return p.href !== here && p.href !== s.page; });
    if (!list.length) list = pages().filter(function (p) { return p.href !== here; });
    var next = list[Math.floor(Math.random() * list.length)];
    s.hop += 1; s.page = next.href; save(s);
    markLinks(next.href);
    toast(s.hop >= HOPS ? 'It swam off to ' + next.name + '. Last chance!' : 'It swam off to ' + next.name + '…');
    // Head for the menu link it is hiding behind, or off the bottom of the window
    var link = linksTo(next.href).filter(function (a) { var r = a.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; })[0];
    if (link) { var r = link.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
    else { tx = innerWidth / 2; ty = innerHeight + 80; }
    if (reduce) { gone(); return; }
    fleeing = true;
  }

  function onFishClick() {
    var s = state(); if (!s || fleeing) return;
    if (s.hop < HOPS) { flee(); return; }
    // Caught
    gone(); save(null); markLinks(null); setCaught(true); hideBtn(false);
    var photo = document.querySelector('.group-photo');
    if (photo) {
      toast('You caught it! 🎣', 3600);
      photo.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    } else {
      toast('You caught it! Have a look at the group photo on the home page 🎣', 4500);
    }
  }

  // Resume a chase on page load
  var s = state();
  if (s) {
    hideBtn(true);
    if (s.page === here) {
      markLinks(null);
      // It swims in from the side nearest the header
      swim(Math.random() < .5 ? -30 : innerWidth + 30, 100 + Math.random() * 200);
      if (s.hop >= HOPS) toast('There it is. Catch it!');
    } else {
      markLinks(s.page);
    }
  }
})();
