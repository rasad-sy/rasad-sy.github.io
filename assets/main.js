// RASAD website: four languages (ar/en/fr/de), video player, live signal field, dot charts, scroll reveals.
// No trackers, no third-party code. Motion respects prefers-reduced-motion.
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var KEY = 'rasad-lang';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var listeners = [];

  // ------------------------------------------------------------ languages
  var LANGS = ['ar', 'en', 'fr', 'de'];
  var CLOSE = { ar: 'إغلاق', en: 'Close', fr: 'Fermer', de: 'Schließen' };
  var TITLE0 = document.title;
  var TITLES = { fr: 'RASAD | رصد : services de cybersécurité en Syrie', de: 'RASAD | رصد: Cybersicherheit in Syrien' };
  var langButtons = [].slice.call(document.querySelectorAll('[data-set-lang]'));

  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage may be blocked */ }
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang)); });
    var x = document.getElementById('player-close');
    if (x) x.setAttribute('aria-label', CLOSE[lang]);
    document.title = TITLES[lang] || TITLE0;
    listeners.forEach(function (fn) { fn(lang); });
  }

  // a shared link (?lang=de) wins, then the visitor's last choice, then the browser's languages; English otherwise
  function pick() {
    var m = /[?&]lang=([a-z]{2})/i.exec(location.search);
    if (m && LANGS.indexOf(m[1].toLowerCase()) >= 0) return m[1].toLowerCase();
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (LANGS.indexOf(saved) >= 0) return saved;
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < prefs.length; i++) {
      var l = String(prefs[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(l) >= 0) return l;
    }
    return 'en';
  }
  setLang(pick());

  langButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-set-lang');
      setLang(lang);
      // keep a shared ?lang= link in step with the choice, so a reload shows the same language
      if (/[?&]lang=/.test(location.search) && window.history && history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search.replace(/([?&]lang=)[^&]*/, '$1' + lang) + location.hash);
      }
    });
  });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ------------------------------------------------------------ video player
  var FILES = {
    '00': 'RASAD_00_Overview.mp4',
    '01': 'RASAD_01_Cybersecurity.mp4',
    '02': 'RASAD_02_Information_Security.mp4',
    '03': 'RASAD_03_Risk_Assessment.mp4',
    '04': 'RASAD_04_Digital_Forensics.mp4',
    '05': 'RASAD_05_Security_Consulting.mp4',
    'aml': 'RASAD_Banks_AML_CFT.mp4'
  };
  var dialog = document.getElementById('player');
  var video = document.getElementById('player-video');

  function open(id) {
    if (!FILES[id]) return;
    video.poster = 'assets/img/poster_' + id + '.jpg';
    video.src = 'assets/video/' + FILES[id];
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: user presses play */ });
  }
  function close() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (dialog.open) dialog.close();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-video]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-video')); }
  });
  document.getElementById('player-close').addEventListener('click', close);
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
  dialog.addEventListener('close', function () { video.pause(); });

  // ------------------------------------------------------------ nav: transparent over the hero, solid below it
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  if ('IntersectionObserver' in window && nav && hero) {
    new IntersectionObserver(function (en) {
      nav.classList.toggle('solid', !en[0].isIntersecting);
    }, { rootMargin: '-68px 0px 0px 0px', threshold: 0 }).observe(hero);
  } else if (nav) { nav.classList.add('solid'); }

  // ------------------------------------------------------------ dot charts (unit charts)
  var SVGNS = 'http://www.w3.org/2000/svg';
  function buildDots(el) {
    var n = +el.getAttribute('data-n'), a = +el.getAttribute('data-a') || 0, b = +el.getAttribute('data-b') || 0;
    var cols = +el.getAttribute('data-cols') || 10, tone = el.getAttribute('data-tone') || 'gold';
    var dark = !!el.closest('.dark');
    var pitch = 11, r = 3.3, rows = Math.ceil(n / cols);
    var A = { red: '#D7303A', navy: '#0B1630', gold: '#A9792A' }[tone] || '#A9792A';
    var B = '#D7303A', OFF = dark ? 'rgba(241,237,228,.16)' : '#DADEE5';
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + cols * pitch + ' ' + rows * pitch);
    svg.setAttribute('width', cols * pitch); svg.setAttribute('height', rows * pitch);
    var rtl = root.getAttribute('dir') === 'rtl';
    for (var i = 0; i < n; i++) {
      var c = document.createElementNS(SVGNS, 'circle');
      var col = i % cols, row = Math.floor(i / cols);
      if (rtl) col = cols - 1 - col;
      c.setAttribute('cx', col * pitch + pitch / 2); c.setAttribute('cy', row * pitch + pitch / 2); c.setAttribute('r', r);
      var fill = i < a ? A : (i < a + b ? B : OFF);
      c.setAttribute('fill', fill);
      if (fill !== OFF && !REDUCED) { c.setAttribute('class', 'd'); c.style.opacity = '0'; c.style.transition = 'opacity .35s ' + (i * 6) + 'ms'; }
      svg.appendChild(c);
    }
    el.textContent = ''; el.appendChild(svg);
  }
  var dotEls = [].slice.call(document.querySelectorAll('.dots[data-n]'));
  dotEls.forEach(buildDots);
  listeners.push(function () { dotEls.forEach(function (el) { var inn = el.closest('.in'); buildDots(el); if (inn) light(el); }); });
  function light(el) { [].forEach.call(el.querySelectorAll('circle.d'), function (c) { c.style.opacity = '1'; }); }

  // ------------------------------------------------------------ count-up numbers (French and German number style)
  function fmt(el, v) {
    var lang = root.getAttribute('data-lang'), dec = +el.getAttribute('data-dec') || 0;
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '', n = v.toFixed(dec);
    if (lang === 'fr' || lang === 'de') {
      n = n.replace('.', ',');
      if (suf === '%') return n + (lang === 'fr' ? '\u202F%' : '\u00A0%');
      if (pre === '$' && suf === 'M') return n + (lang === 'fr' ? '\u00A0M$' : '\u00A0Mio.\u00A0$');
    }
    return pre + n + suf;
  }
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  function settle() { nums.forEach(function (el) { var v = parseFloat(el.getAttribute('data-count')); if (!isNaN(v)) el.textContent = fmt(el, v); }); }
  settle();
  listeners.push(settle);
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (REDUCED || isNaN(target)) return;
    var t0 = null, dur = 1400;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(el, target * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ------------------------------------------------------------ reveal on scroll
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  function show(el) {
    el.classList.add('in');
    [].forEach.call(el.querySelectorAll('.dots'), light);
    [].forEach.call(el.querySelectorAll('[data-count]'), countUp);
  }
  if ('IntersectionObserver' in window && !REDUCED) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sibs = [].slice.call(el.parentNode.children).filter(function (s) { return s.classList.contains('reveal'); });
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 70 + 'ms';
        show(el); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(show); }

  // ------------------------------------------------------------ hero: a live field of signals; one gets flagged
  var cv = document.getElementById('field');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, pts = [], pitch = 26, running = false, raf = 0;
  var mouse = { x: -9999, y: -9999 };
  var flag = null, nextFlag = 1200;

  function resize() {
    var rect = cv.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    pitch = W < 600 ? 22 : 26;
    pts = [];
    var cols = Math.ceil(W / pitch) + 1, rows = Math.ceil(H / pitch) + 1;
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      pts.push({ x: i * pitch + (j % 2 ? pitch / 2 : 0), y: j * pitch, s: Math.random() * 6.283 });
    }
    if (REDUCED) draw(0);
  }

  function pickFlag(t) {
    var rtl = root.getAttribute('dir') === 'rtl', mobile = W < 600, tries = 0, p;
    do {
      p = pts[(Math.random() * pts.length) | 0]; tries++;
      // phones: the free strip between the menu bar and the first line of text; desktop: the open side of the hero
      var xo = mobile ? (rtl ? p.x > W * 0.52 && p.x < W * 0.7 : p.x > W * 0.3 && p.x < W * 0.48) : (rtl ? p.x < W * 0.42 && p.x > 280 : p.x > W * 0.58 && p.x < W - 280);
      var yo = mobile ? (p.y > 76 && p.y < 102) : (p.y > H * 0.16 && p.y < H * 0.78);
    } while (!(xo && yo) && tries < 400);
    flag = { p: p, t0: t, dur: 3400, short: mobile };
  }

  function stamp() {
    var d = new Date(), z = function (v) { return (v < 10 ? '0' : '') + v; };
    return z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds());
  }

  var FLAGTXT = {
    ar: ['رُصد · ', 'رُصد نشاط غير اعتيادي · '],
    en: ['FLAGGED · ', 'ANOMALY FLAGGED · '],
    fr: ['SIGNALÉ · ', 'ANOMALIE SIGNALÉE · '],
    de: ['ERKANNT · ', 'ANOMALIE ERKANNT · ']
  };

  var BUCKETS = 7;
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var sweep = (t * 0.09) % (W + H + 400) - 200;   // a slow diagonal scan line
    var paths = []; for (var b = 0; b < BUCKETS; b++) paths.push([]);
    var hot = [];
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      var w = 0.5 + 0.5 * Math.sin(t * 0.0007 + p.x * 0.006 + p.y * 0.004 + p.s * 0.15);
      var a = 0.2 + 0.3 * w;
      var ds = Math.abs((p.x * 0.8 + p.y) - sweep);
      if (ds < 110) a += (1 - ds / 110) * 0.45;
      var r = 1.35;
      var dx = p.x - mouse.x, dy = p.y - mouse.y, dm = dx * dx + dy * dy;
      if (dm < 19600) { var q = 1 - Math.sqrt(dm) / 140; r += q * 1.6; a += q * 0.5; if (q > 0.35) { hot.push([p, r]); continue; } }
      if (flag && flag.p === p) continue;
      var bi = Math.min(BUCKETS - 1, (a * BUCKETS) | 0);
      paths[bi].push(p.x, p.y, r);
    }
    for (var bb = 0; bb < BUCKETS; bb++) {
      var arr = paths[bb]; if (!arr.length) continue;
      ctx.fillStyle = 'rgba(206,212,224,' + Math.min(1, (bb + 0.5) / BUCKETS).toFixed(3) + ')';
      ctx.beginPath();
      for (var m = 0; m < arr.length; m += 3) { ctx.moveTo(arr[m] + arr[m + 2], arr[m + 1]); ctx.arc(arr[m], arr[m + 1], arr[m + 2], 0, 6.2832); }
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(212,170,92,.85)';
    ctx.beginPath();
    hot.forEach(function (h) { ctx.moveTo(h[0].x + h[1], h[0].y); ctx.arc(h[0].x, h[0].y, h[1], 0, 6.2832); });
    ctx.fill();
    drawFlag(t);
  }

  function drawFlag(t) {
    if (REDUCED && !flag && pts.length) { pickFlag(0); flag.static = true; }
    if (!flag) return;
    var e = flag.static ? 0.5 : (t - flag.t0) / flag.dur;
    if (e > 1) { flag = null; return; }
    var p = flag.p, fadeIn = Math.min(1, e / 0.12), fadeOut = e > 0.86 ? (1 - e) / 0.14 : 1, al = Math.min(fadeIn, fadeOut);
    // the anomaly
    var pulse = flag.static ? 0 : (Math.sin(t * 0.012) + 1) / 2;
    ctx.fillStyle = 'rgba(215,48,58,' + (0.25 * al * pulse).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, 7 + pulse * 6, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(215,48,58,' + al.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3.8, 0, 6.2832); ctx.fill();
    // viewfinder locks on
    var lock = flag.static ? 1 : Math.min(1, e / 0.18), ease = 1 - Math.pow(1 - lock, 3);
    var s = (flag.short ? 30 : 46) - (flag.short ? 20 : 30) * ease, L = flag.short ? 5 : 7;
    ctx.strokeStyle = 'rgba(212,170,92,' + al.toFixed(3) + ')'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
      var x = p.x + c[0] * s, y = p.y + c[1] * s;
      ctx.moveTo(x - c[0] * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y - c[1] * L);
    });
    ctx.stroke();
    // label, typed out
    if (lock >= 1) {
      var rtl = root.getAttribute('dir') === 'rtl';
      var ft = FLAGTXT[root.getAttribute('data-lang')] || FLAGTXT.en;
      if (!flag.label) flag.label = (flag.short ? ft[0] : ft[1]) + stamp();
      var chars = flag.static ? flag.label.length : Math.min(flag.label.length, Math.floor((e - 0.18) / 0.3 * flag.label.length));
      ctx.font = (rtl ? '500 13px "IBM Plex Sans Arabic", sans-serif' : '500 11.5px "Plex Mono", monospace');
      ctx.fillStyle = 'rgba(242,215,150,' + al.toFixed(3) + ')';
      ctx.textBaseline = 'middle';
      var txt = flag.label.slice(0, chars);
      if (rtl) { ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillText(txt, p.x - s - 10, p.y); }
      else { ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.fillText(txt, p.x + s + 10, p.y); }
    }
  }

  function loop(t) {
    if (!running) return;
    if (!flag && t > nextFlag) { pickFlag(t); nextFlag = t + 5200; }
    draw(t);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!running && !REDUCED) { running = true; raf = requestAnimationFrame(loop); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', function () { resize(); });
  hero.addEventListener('pointermove', function (ev) { var r = cv.getBoundingClientRect(); mouse.x = ev.clientX - r.left; mouse.y = ev.clientY - r.top; });
  hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  listeners.push(function () { if (flag) flag.label = null; if (REDUCED) { flag = null; draw(0); } });
  if (REDUCED) { draw(0); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else stop(); }).observe(hero);
  } else { start(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
})();
