// RASAD coming-soon teaser v3 (22 Nov 2026).
// 1) One fixed canvas: the RASAD dot field covers the whole screen (edge to edge, every size) and carries on behind the whole page.
//    Phone: a gold lens follows the finger. PC: the field is a 3D plane that tilts with the mouse; the lens magnifies like glass; a radar sweep
//    crosses the field; finding the one hidden dot sends a gold shockwave. Only inside the lens (or under the sweep as a hint) does the dot show signal red.
//    Redraws only while something moves (hero in view, pointer, scroll, easing); no per-dot strings or objects (dots are batched by alpha level).
// 2) The services lens: six invisible hotspots over the six service cells of the poster, plus the list below (tap, Tab and arrow keys). A round gold-ringed
//    magnifier (2.2x, from a sharp crop of the master picture) and a compact card, filled from the list's own text (single source of text, nothing invented).
(() => {
  'use strict';
  const doc = document;
  doc.documentElement.classList.add('js');
  const $ = (s, el = doc) => el.querySelector(s);
  const $$ = (s, el = doc) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const TAU = 6.2832;
  const GOLD = '212,170,92', DOTC = '196,206,218', WAVEC = '232,196,120';

  /* ===================================================================== the dot field */
  const cv = $('#field'), g = cv.getContext('2d');
  const hunt = $('#hunt'), hint = $('#hint'), found = $('#found'), btn = $('#reveal'), hud = $('#hud');
  const NB = 14;                                              // alpha levels (dots of one level are drawn in a single path)
  const styDot = [], styGold = [];
  for (let i = 0; i < NB; i++) { const a = (((i + 1) / NB) * 0.95).toFixed(3); styDot.push(`rgba(${DOTC},${a})`); styGold.push(`rgba(${WAVEC},${a})`); }
  const counts = new Int32Array(NB * 2);
  let bufs = null;
  let PC = false, PITCH = 26, LENS = 78, F = 900, K = 1;
  let W = 0, H = 0, HH = 0, dpr = 1, cols = 1, rows = 1;
  let tcO = 0, trO = 0, haveT = false;                        // the hidden dot, as grid offsets from the plane centre
  const mouse = { x: 0.5, y: 0.42 }, lens = { x: -999, y: -999 }, ease = { x: -999, y: -999 }, tilt = { ax: 0, ay: 0 }, tgt = { x: 0, y: 0 };
  let lock = 0, done = false, doneAt = 0, lastMove = performance.now(), raf = 0, idleUntil = 0, scrollY = 0, lastSec = -1, pointerSeen = false;
  const t0 = performance.now();

  function pickTarget() {
    const cy0 = HH * 0.46, rows0 = HH * 0.17 - cy0, rows1 = HH * (PC ? 0.42 : 0.46) - cy0, sx = HH * 0.42 - cy0;
    for (let i = 0; i < 120; i++) {
      const c = Math.round((Math.random() * 2 - 1) * (W * 0.4) / PITCH), r = Math.round((rows0 + Math.random() * (rows1 - rows0)) / PITCH);
      if (Math.hypot(c * PITCH, r * PITCH - sx) > LENS * 1.9) { tcO = c; trO = r; haveT = true; return; }
    }
    tcO = Math.round(W * 0.22 / PITCH); trO = Math.round(rows0 / PITCH); haveT = true;
  }
  function build() {
    PC = matchMedia('(pointer: fine)').matches && innerWidth >= 900;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight; HH = hunt.clientHeight || H;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    PITCH = PC ? clamp(Math.round(W / 64), 30, 42) : 26; K = PITCH / (PC ? 30 : 26);
    LENS = PC ? Math.round(clamp(W * 0.066, 120, 170)) : 78;
    F = PC ? W * 0.86 : 900;                                  // perspective scales with the screen, so the tilt never uncovers an edge on ultrawide screens
    const cy0 = HH * 0.46, mx = PC ? 1.65 : 1.12, my = PC ? 1.55 : 1.1;
    cols = (Math.floor(W * mx / PITCH) | 1) + 2; cols |= 1;
    rows = (Math.floor(2 * Math.max(cy0, H - cy0) * my / PITCH) | 1) + 2; rows |= 1;
    const cap = cols * rows * 3;
    if (!bufs || bufs[0].length < cap) bufs = Array.from({ length: NB * 2 }, () => new Float32Array(cap));
    if (!haveT) pickTarget();
    else { const rx = tcO * PITCH, ry = trO * PITCH + cy0; if (Math.abs(rx) > W * 0.46 || ry < HH * 0.1 || ry > HH * 0.56) pickTarget(); }
    if (ease.x < -900) { ease.x = lens.x = W / 2; ease.y = lens.y = HH * 0.42; }
  }
  function brackets(x, y, size, a, w) {
    const h = size / 2, arm = size / 4.2; g.strokeStyle = `rgba(${GOLD},${a})`; g.lineWidth = w; g.lineCap = 'square'; g.beginPath();
    for (let i = 0; i < 4; i++) { const sx = i & 1 ? 1 : -1, sy = i & 2 ? 1 : -1, cx = x + sx * h, cy = y + sy * h; g.moveTo(cx - sx * arm, cy); g.lineTo(cx, cy); g.lineTo(cx, cy - sy * arm); }
    g.stroke();
  }
  let tAy = 0, tAx = 0;
  function frame(now) {
    raf = 0;
    scrollY = window.scrollY || 0;
    const t = (now - t0) / 1000;
    const heroLive = scrollY < HH * 0.92, lensOn = !done && scrollY < HH * 0.45;
    const ek = PC ? 0.18 : 0.22;
    ease.x += (lens.x - ease.x) * ek; ease.y += (lens.y - ease.y) * ek;
    if (PC && !reduce) {
      const sw = heroLive ? 1 : 0;                              // the slow idle sway only while the hero is on screen, so the loop can go to sleep below it
      tAy = (mouse.x - 0.5) * 0.5 + sw * 0.04 * Math.sin(t * 0.23); tAx = -(mouse.y - 0.5) * 0.34 + sw * 0.03 * Math.sin(t * 0.31 + 1);
      tilt.ay += (tAy - tilt.ay) * 0.06; tilt.ax += (tAx - tilt.ax) * 0.06;
    }
    const cx0 = W / 2, cy0 = HH * 0.46, ca = Math.cos(tilt.ay), sa = Math.sin(tilt.ay), cb = Math.cos(tilt.ax), sb = Math.sin(tilt.ax);
    const sh = reduce ? 0 : scrollY * 0.5, R0 = Math.floor(sh / PITCH), sOff = sh - R0 * PITCH;       // the field drifts slower than the page and wraps (endless)
    const mid = clamp(scrollY / (HH * 0.9), 0, 1), dim = 1 - 0.46 * mid * mid * (3 - 2 * mid);
    const midC = (cols - 1) / 2, midR = (rows - 1) / 2, tC = tcO + midC, tR = trO + midR - R0;
    // where the hidden dot sits (no lens push), for the lock-on logic
    { const u = tcO * PITCH, v = trO * PITCH - sh, x1 = u * ca, z1 = -u * sa, y2 = v * cb - z1 * sb, z2 = v * sb + z1 * cb, s = F / (F + z2); tgt.x = cx0 + x1 * s; tgt.y = cy0 + y2 * s; }
    const idle = (now - lastMove) / 1000, hintOn = !done && t > 14 && idle > 3 && lensOn;
    const sweepOn = heroLive && !reduce, sweepA = (t * 0.55) % TAU;
    const wave = done && !reduce ? ((now - doneAt) / 1000) * (PC ? 1100 : 700) : -1, waveLim = Math.max(W, H) * 1.3;
    const glowOn = PC && pointerSeen && !reduce, G = 210 * K, G2 = G * G, L2 = LENS * LENS;
    const pushK = LENS * (PC ? 0.26 : 0.18);
    let tx = 0, ty = 0, tr = 0, tShow = false;
    counts.fill(0);
    g.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      const v = (r - midR) * PITCH - sOff;
      for (let c = 0; c < cols; c++) {
        const u = (c - midC) * PITCH, x1 = u * ca, z1 = -u * sa, y2 = v * cb - z1 * sb, z2 = v * sb + z1 * cb, s = F / (F + z2);
        let x = cx0 + x1 * s, y = cy0 + y2 * s;
        if (x < -24 || y < -24 || x > W + 24 || y > H + 24) continue;
        const isT = r === tR && c === tC;
        const dx = x - ease.x, dy = y - ease.y, d2 = dx * dx + dy * dy;
        let k1 = 0;
        if (lensOn && d2 < L2) { const d = Math.sqrt(d2); k1 = 1 - d / LENS; if (d > 0.01) { const push = pushK * k1 * k1; x += (dx / d) * push; y += (dy / d) * push; } }   // magnifier bulge
        let a = (0.27 + 0.2 * (s - 0.7)) * dim + 0.5 * k1, rad = (1.5 + 0.35 * (s - 1) * 4) * K * (1 + 0.9 * k1), gold = 0;
        if (sweepOn && y < HH + 40) { let da = Math.atan2(y - cy0, x - cx0) - sweepA; da = ((da % TAU) + TAU) % TAU; if (da > 5.6) { const sw = (da - 5.6) / 0.68; a += 0.32 * sw * sw; } }
        if (glowOn && d2 < G2 && !k1) { let p = 1 - Math.sqrt(d2) / G; p *= p; a += 0.42 * p; rad *= 1 + 0.7 * p; if (p > 0.07) gold = 1; }
        if (wave > 0) { const dw = Math.abs(Math.hypot(x - tgt.x, y - tgt.y) - wave), f = Math.max(0, 1 - dw / 70) * Math.max(0, 1 - wave / waveLim); if (f > 0) { a += 0.6 * f; rad *= 1 + 0.8 * f; gold = 1; } }
        if (isT) { tx = x; ty = y; tr = rad; tShow = k1 > 0 || done || (hintOn && a > 0.45); if (tShow) continue; }
        if (a < 0.03) continue;
        const bi = (gold ? NB : 0) + Math.min(NB - 1, ((a * NB) / 0.95) | 0), n = counts[bi], b = bufs[bi];
        b[n * 3] = x; b[n * 3 + 1] = y; b[n * 3 + 2] = Math.max(0.6, rad); counts[bi] = n + 1;
      }
    }
    for (let bi = 0; bi < NB * 2; bi++) {
      const n = counts[bi]; if (!n) continue;
      const b = bufs[bi]; g.fillStyle = bi < NB ? styDot[bi] : styGold[bi - NB]; g.beginPath();
      for (let i = 0; i < n; i++) { const x = b[i * 3], y = b[i * 3 + 1], r = b[i * 3 + 2]; g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
      g.fill();
    }
    if (tShow) {                                                // the one red dot
      const pulse = 0.78 + 0.22 * Math.sin(t * 5);
      const gr = g.createRadialGradient(tx, ty, 0, tx, ty, 26 * K); gr.addColorStop(0, `rgba(255,84,68,${0.4 * pulse})`); gr.addColorStop(1, 'rgba(255,84,68,0)'); g.fillStyle = gr; g.beginPath(); g.arc(tx, ty, 26 * K, 0, TAU); g.fill();
      g.fillStyle = `rgba(255,84,68,${pulse})`; g.beginPath(); g.arc(tx, ty, tr + 1.8, 0, TAU); g.fill();
    }
    if (lensOn) {
      // the lens: glass ring, rotating scale ticks, corner brackets and (PC) a live readout
      g.strokeStyle = `rgba(${GOLD},.32)`; g.lineWidth = 1; g.beginPath(); g.arc(ease.x, ease.y, LENS, 0, TAU); g.stroke();
      if (PC) { g.save(); g.translate(ease.x, ease.y); g.rotate(t * 0.25); g.strokeStyle = `rgba(${GOLD},.55)`; g.beginPath(); for (let i = 0; i < 48; i++) { const L = i % 4 ? 5 : 11; g.moveTo(LENS - L, 0); g.lineTo(LENS, 0); g.rotate(TAU / 48); } g.stroke(); g.restore(); }
      brackets(ease.x, ease.y, PC ? 74 : 56, 0.9, PC ? 2.2 : 2);
      if (PC) {
        const gc = Math.round((ease.x - cx0) / PITCH) + 50, gr2 = Math.round((ease.y - cy0) / PITCH) + 30;
        g.font = '400 11px PlexMono, monospace'; g.fillStyle = `rgba(${GOLD},.88)`; g.textAlign = 'left';
        g.fillText(`X ${String(gc).padStart(3, '0')}  Y ${String(gr2).padStart(3, '0')}`, ease.x + LENS * 0.72 + 8, ease.y - LENS * 0.72);
        g.fillStyle = 'rgba(196,206,218,.58)'; g.fillText(`SIG ${(lock * 100).toFixed(0).padStart(3, '0')}%`, ease.x + LENS * 0.72 + 8, ease.y - LENS * 0.72 + 15);
      }
      const dT = Math.hypot(ease.x - tgt.x, ease.y - tgt.y);
      lock = dT < (PC ? 26 : 20) ? Math.min(1, lock + 0.035) : Math.max(0, lock - 0.06);
      if (lock > 0) brackets(tgt.x, tgt.y, 130 - 86 * lock, lock, 2.5);
      if (lock >= 1) win();
    } else if (done) {
      const k = Math.min(1, (now - doneAt) / 650), sz = 130 - 82 * (1 - Math.pow(1 - k, 3)); brackets(tgt.x, tgt.y, sz, 1, 2.6);
    }
    if (hud) { const sec = Math.floor(((done ? doneAt : now) - t0) / 1000); if (sec !== lastSec) { lastSec = sec; hud.textContent = `${done ? 'FOUND' : 'SCANNING'} · ${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; } }
    const settling = Math.abs(lens.x - ease.x) > 0.3 || Math.abs(lens.y - ease.y) > 0.3 || (PC && !reduce && (Math.abs(tilt.ay - tAy) > 0.0008 || Math.abs(tilt.ax - tAx) > 0.0008));
    if ((heroLive && !reduce) || now < idleUntil || settling || (wave >= 0 && wave < waveLim)) raf = requestAnimationFrame(frame);
  }
  function wake(ms) { idleUntil = performance.now() + (ms || 2400); if (!raf) raf = requestAnimationFrame(frame); }
  function win() {
    if (done) return;
    done = true; doneAt = performance.now(); hint.classList.add('off'); hunt.classList.add('done'); if (hud) hud.classList.add('found');
    setTimeout(() => found.classList.add('on'), reduce ? 0 : 600); wake(4000);
  }
  function onMove(e) {
    if (e.pointerType === 'touch') { if (done || scrollY > HH * 0.5) return; } else pointerSeen = true;
    lens.x = e.clientX; lens.y = e.clientY; mouse.x = e.clientX / innerWidth; mouse.y = e.clientY / innerHeight; lastMove = performance.now(); wake();
  }
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onMove, { passive: true });
  addEventListener('scroll', () => wake(1200), { passive: true });
  addEventListener('keydown', e => {
    if (done || scrollY > HH * 0.45) return;
    const ae = doc.activeElement; if (ae && ae !== doc.body && !hunt.contains(ae)) return;
    const step = PITCH;
    if (e.key === 'ArrowLeft') lens.x -= step; else if (e.key === 'ArrowRight') lens.x += step; else if (e.key === 'ArrowUp') lens.y -= step; else if (e.key === 'ArrowDown') lens.y += step; else return;
    lens.x = clamp(lens.x, 0, W); lens.y = clamp(lens.y, 0, HH); lastMove = performance.now(); e.preventDefault(); wake();
  });
  btn.addEventListener('click', () => { lens.x = ease.x = tgt.x; lens.y = ease.y = tgt.y; win(); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const d = done; build(); if (d) { lens.x = ease.x = tgt.x; lens.y = ease.y = tgt.y; } wake(); }, 60); });
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) wake(); });
  build();
  if (reduce) win();
  wake(3000);

  /* ===================================================================== the services lens */
  const stage = $('#stage'), tiltEl = $('#tilt'), slens = $('#slens'), mag = $('#slens-img'), ro = $('#slens-ro'), card = $('#card');
  const hots = $$('.hot'), tileBtns = $$('.tile-btn'), tilesEl = $('#tiles');
  const Z = 2.2, BAND_TOP = 1010, BAND_AR = 1007 / 3200;       // the lens image is the bottom of the master picture: poster y 1010..1350
  // the six service cells in poster units (1080 x 1350): where the text sits (scan range) and its centre line, measured from the picture
  const CELL = [
    { x0: 60, x1: 276, cy: 1171 }, { x0: 388, x1: 680, cy: 1170 }, { x0: 752, x1: 1004, cy: 1170 },
    { x0: 56, x1: 340, cy: 1237 }, { x0: 388, x1: 710, cy: 1237 }, { x0: 750, x1: 1034, cy: 1238 }];
  let cur = -1, curX = 0, hideT = 0, pinned = false, lastPT = 'mouse', rafS = 0;
  const sheetQ = matchMedia('(max-width: 899px), (pointer: coarse)');
  const pad3 = n => String(n).padStart(3, '0');

  function fill(i) {
    const li = tileBtns[i].closest('li');
    $('#c-ar').textContent = $('.t-ar', li).textContent; $('#c-en').textContent = $('.t-en', li).textContent;
    const pl = $('.t-line', li); $('#c-par').textContent = $('.ar', pl).textContent; $('#c-pen').textContent = $('.en', pl).textContent;
    $('#c-ico use').setAttribute('href', $('use', li).getAttribute('href'));
    const list = $('#c-what'), items = $$('.what > li', li).map(src => { const o = doc.createElement('li'); $$('span', src).forEach(sp => o.appendChild(sp.cloneNode(true))); return o; });
    list.replaceChildren(...items);
    const n = `0${i + 1}/06`; $('#c-idx').textContent = n; $('#c-foot').textContent = `SVC ${n}`;
  }
  function geoLens(i, px) {                                    // poster units -> stage pixels; the lens centre and the magnified picture follow
    const Wp = tiltEl.offsetWidth, k = Wp / 1080, c = CELL[i], D = slens.offsetWidth;
    const x = clamp(px, c.x0 + 30, c.x1 - 30), X = x * k, Y = c.cy * k;
    slens.style.transform = `translate(${(X - D / 2).toFixed(1)}px, ${(Y - D / 2).toFixed(1)}px)`;
    const mw = Wp * Z; mag.style.width = `${mw.toFixed(1)}px`;
    mag.style.transform = `translate(${(D / 2 - x * k * Z).toFixed(1)}px, ${(D / 2 - (c.cy - BAND_TOP) * k * Z).toFixed(1)}px)`;
    const txt = `X ${pad3(Math.round((x / 1080) * 1000))} · Y ${pad3(Math.round((c.cy / 1350) * 1000))}`; ro.textContent = txt; $('#c-foot').textContent = `SVC 0${i + 1}/06 · ${txt}`;
    return { X, Y, D, k };
  }
  function placeCard(a) {                                      // a = anchor rect in the viewport
    if (sheetQ.matches) { card.style.left = ''; card.style.top = ''; card.removeAttribute('data-v'); return; }
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 38, vw = innerWidth, vh = innerHeight;
    const above = a.t - gap - ch, below = a.t + a.h + gap;
    let top, v = '';
    if (above >= 12) { top = above; v = 'above'; } else if (below + ch <= vh - 12) { top = below; v = 'below'; } else { top = clamp(a.t + a.h / 2 - ch / 2, 12, vh - ch - 12); }
    let left = clamp(a.l + a.w / 2 - cw / 2, 12, vw - cw - 12);
    if (!v) { left = a.l - 28 - cw >= 12 ? a.l - 28 - cw : Math.min(a.l + a.w + 28, vw - cw - 12); }
    const tx = clamp(a.l + a.w / 2 - left, 26, cw - 26);
    card.style.left = `${left.toFixed(0)}px`; card.style.top = `${top.toFixed(0)}px`;
    card.style.setProperty('--tx', `${tx.toFixed(0)}px`); card.style.setProperty('--ox', `${tx.toFixed(0)}px`);
    card.style.setProperty('--oy', v === 'below' ? '0%' : '100%'); card.style.setProperty('--dy', v === 'below' ? '-8px' : '8px');
    if (v) card.dataset.v = v; else card.removeAttribute('data-v');
  }
  function show(i, o) {
    o = o || {}; clearTimeout(hideT);
    const wasOn = slens.classList.contains('on'); cur = i; if (o.pin !== undefined) pinned = o.pin;
    fill(i);
    const c = CELL[i], px = o.px !== undefined ? o.px : (c.x0 + c.x1) / 2; curX = px;
    const sr = stage.getBoundingClientRect(), k = sr.width / 1080, cyV = sr.top + c.cy * k, inView = cyV > 60 && cyV < innerHeight - 30;
    let anchor;
    if (inView) {
      if (!wasOn) slens.classList.add('snap');
      const gl = geoLens(i, px);
      slens.classList.add('on'); stage.classList.add('lens-on');
      if (!wasOn) { void slens.offsetWidth; requestAnimationFrame(() => slens.classList.remove('snap')); }
      anchor = { l: sr.left + gl.X - gl.D / 2, t: sr.top + gl.Y - gl.D / 2, w: gl.D, h: gl.D };
      tiltEl.style.setProperty('--rx', '0deg'); tiltEl.style.setProperty('--ry', '0deg');
    } else {
      slens.classList.remove('on'); stage.classList.remove('lens-on');
      const r = tileBtns[i].getBoundingClientRect(); anchor = { l: r.left, t: r.top, w: r.width, h: r.height };
    }
    placeCard(anchor);
    card.classList.add('on');
    hots.forEach((h, j) => h.classList.toggle('on', j === i && inView)); tileBtns.forEach((b, j) => b.setAttribute('aria-expanded', j === i ? 'true' : 'false'));
  }
  function hide() {
    cur = -1; pinned = false; clearTimeout(hideT);
    slens.classList.remove('on'); stage.classList.remove('lens-on'); card.classList.remove('on');
    hots.forEach(h => h.classList.remove('on')); tileBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
    tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry');
  }
  const later = ms => { clearTimeout(hideT); hideT = setTimeout(() => { if (!pinned) hide(); }, ms || 130); };
  const unitsX = (e) => { const r = tiltEl.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 1080; };

  addEventListener('pointerdown', e => { lastPT = e.pointerType || 'mouse'; if (cur >= 0 && !card.contains(e.target) && !e.target.closest('.hot, .tile-btn')) hide(); }, { passive: true, capture: true });
  hots.forEach(h => {
    const i = +h.dataset.i;
    const over = e => { if (e.pointerType === 'touch') return; show(i, { px: unitsX(e), pin: false }); };
    h.addEventListener('pointerenter', over); h.addEventListener('pointermove', over);
    h.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') later(); });
    h.addEventListener('click', () => { if (lastPT === 'touch' || lastPT === 'pen') { if (cur === i && card.classList.contains('on')) hide(); else show(i, { pin: true }); } });
  });
  tileBtns.forEach((b, i) => {
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(i, { pin: false }); });
    b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') later(); });
    b.addEventListener('focus', () => { if (b.matches(':focus-visible')) show(i, { pin: true }); });
    b.addEventListener('click', () => { if (lastPT === 'mouse' && !(cur === i && pinned)) show(i, { pin: true }); else if (cur === i && card.classList.contains('on') && pinned) hide(); else show(i, { pin: true }); });
  });
  $('#card-x').addEventListener('click', hide);
  addEventListener('keydown', e => { if (e.key === 'Escape' && cur >= 0) { hide(); } });
  tilesEl.addEventListener('keydown', e => {                    // arrow keys move between the six services (RTL: Left = next)
    const i = tileBtns.indexOf(doc.activeElement); if (i < 0) return;
    const nc = getComputedStyle(tilesEl).gridTemplateColumns.split(' ').length || 1; let j = i;
    if (e.key === 'ArrowLeft') j = i + 1; else if (e.key === 'ArrowRight') j = i - 1; else if (e.key === 'ArrowDown') j = i + nc; else if (e.key === 'ArrowUp') j = i - nc; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = 5; else return;
    e.preventDefault(); if (j >= 0 && j < 6) tileBtns[j].focus();
  });
  const refresh = () => { rafS = 0; if (cur >= 0) show(cur, { px: curX }); };
  addEventListener('scroll', () => { if (cur >= 0 && !rafS) rafS = requestAnimationFrame(refresh); }, { passive: true });
  addEventListener('resize', () => { if (cur >= 0) refresh(); });
  // soft 3D tilt of the picture (PC): follows the pointer, flattens while the lens is open
  if (!reduce) {
    let rt3 = 0;
    stage.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || cur >= 0 || rt3) return;
      rt3 = requestAnimationFrame(() => { rt3 = 0; const r = stage.getBoundingClientRect(), nx = ((e.clientX - r.left) / r.width - 0.5) * 2, ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        tiltEl.style.setProperty('--ry', `${(nx * 5).toFixed(2)}deg`); tiltEl.style.setProperty('--rx', `${(-ny * 3.5).toFixed(2)}deg`); });
    });
    stage.addEventListener('pointerleave', () => { if (cur < 0) { tiltEl.style.removeProperty('--rx'); tiltEl.style.removeProperty('--ry'); } });
  }
  // the sharp lens picture loads only when the poster is near
  if ('IntersectionObserver' in window) {
    const lo = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { mag.src = 'assets/img/services-zoom.jpg'; lo.disconnect(); } }, { rootMargin: '900px 0px' }); lo.observe(stage);
  } else mag.src = 'assets/img/services-zoom.jpg';

  /* ===================================================================== scroll reveal */
  const rvs = $$('.rv');
  $$('.tile.rv').forEach((el, i) => el.style.setProperty('--d', `${(i % 3) * 80}ms`));
  $$('.side.rv').forEach(el => el.style.setProperty('--d', '160ms'));
  if ('IntersectionObserver' in window && !reduce) {
    const ro2 = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); ro2.unobserve(en.target); } }), { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(el => ro2.observe(el));
  } else rvs.forEach(el => el.classList.add('in'));
})();
