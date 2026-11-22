// RASAD coming-soon teaser (22 Nov 2026): the visitor moves a gold lens over the RASAD dot grid to find the one dot that is not like the others.
// Only inside the lens does the hidden dot show its signal red. When the lens rests on it, four gold brackets close on it and the page answers "We see it first."
(() => {
  const cv = document.getElementById('field'), g = cv.getContext('2d');
  const hint = document.getElementById('hint'), found = document.getElementById('found'), btn = document.getElementById('reveal');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PITCH = 26, LENS = 78, GOLD = '212,170,92';
  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, target = { c: 0, r: 0, x: 0, y: 0 };
  let lens = { x: -999, y: -999 }, ease = { x: -999, y: -999 }, lock = 0, done = false, t0 = performance.now(), lastMove = t0;

  function place() {
    // the hidden dot: away from the edges, the emblem and the text at the bottom
    const r0 = Math.floor(rows * 0.18), r1 = Math.floor(rows * 0.6), c0 = 2, c1 = cols - 3;
    for (let i = 0; i < 60; i++) {        // never under the lens's start position (the middle of the screen)
      target.c = c0 + Math.floor(Math.random() * Math.max(1, c1 - c0)); target.r = r0 + Math.floor(Math.random() * Math.max(1, r1 - r0));
      target.x = offX + target.c * PITCH; target.y = offY + target.r * PITCH;
      if (Math.hypot(target.x - W / 2, target.y - H * 0.42) > LENS * 1.8) break;
    }
  }
  let offX = 0, offY = 0;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.floor(W / PITCH); rows = Math.floor(H / PITCH); offX = (W - (cols - 1) * PITCH) / 2; offY = (H - (rows - 1) * PITCH) / 2;
    place(); if (ease.x < -900) { ease.x = W / 2; ease.y = H * 0.42; lens.x = ease.x; lens.y = ease.y; }
  }
  function bracket(x, y, s, a, k) {
    const h = s / 2, arm = s / 4.2;
    g.strokeStyle = `rgba(${GOLD},${a})`; g.lineWidth = k; g.lineCap = 'square'; g.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = x + sx * h, cy = y + sy * h; g.moveTo(cx - sx * arm, cy); g.lineTo(cx, cy); g.lineTo(cx, cy - sy * arm); }
    g.stroke();
  }
  function frame(now) {
    const t = (now - t0) / 1000;
    ease.x += (lens.x - ease.x) * 0.22; ease.y += (lens.y - ease.y) * 0.22;
    g.clearRect(0, 0, W, H);
    // a slow light band crosses the field; after 14 s without a find, it lingers over the hidden dot as a hint
    const idle = (now - lastMove) / 1000, hintOn = !done && t > 14 && idle > 3;
    const band = ((t * 0.09) % 1.4 - 0.2) * W;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = offX + c * PITCH, y = offY + r * PITCH, d = Math.hypot(x - ease.x, y - ease.y);
      const inLens = d < LENS, mag = inLens ? 1 - d / LENS : 0, lit = Math.max(0, 1 - Math.abs(x - band) / 90);
      const isT = c === target.c && r === target.r;
      let a = 0.26 + 0.18 * lit + 0.45 * mag, rad = 1.7 + 1.1 * mag;
      if (isT && (inLens || done || (hintOn && lit > 0.6))) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 5);
        g.fillStyle = `rgba(255,84,68,${Math.min(1, 0.55 + 0.45 * Math.max(mag, done ? 1 : 0)) * pulse})`;
        g.beginPath(); g.arc(x, y, rad + 1.6, 0, 6.2832); g.fill();
        if (done || mag > 0.2) { const gr = g.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, 'rgba(255,84,68,.35)'); gr.addColorStop(1, 'rgba(255,84,68,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 22, 0, 6.2832); g.fill(); }
        continue;
      }
      g.fillStyle = `rgba(196,206,218,${a})`; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill();
    }
    // the lens
    if (!done) {
      g.strokeStyle = `rgba(${GOLD},.28)`; g.lineWidth = 1; g.beginPath(); g.arc(ease.x, ease.y, LENS, 0, 6.2832); g.stroke();
      bracket(ease.x, ease.y, 56, .85, 2);
      const dT = Math.hypot(ease.x - target.x, ease.y - target.y);
      lock = dT < 20 ? Math.min(1, lock + 0.035) : Math.max(0, lock - 0.06);
      if (lock > 0) bracket(target.x, target.y, 120 - 80 * lock, lock, 2.5);
      if (lock >= 1) win();
    } else {
      const k = Math.min(1, (now - doneAt) / 700), s = 120 - 76 * (1 - Math.pow(1 - k, 3));
      bracket(target.x, target.y, s, 1, 2.5);
    }
    if (!reduce || !done) requestAnimationFrame(frame);
  }
  let doneAt = 0;
  function win() {
    if (done) return; done = true; doneAt = performance.now();
    hint.classList.add('off'); setTimeout(() => found.classList.add('on'), reduce ? 0 : 650); cv.style.cursor = 'default';
  }
  function move(e) { const r = cv.getBoundingClientRect(); lens.x = e.clientX - r.left; lens.y = e.clientY - r.top; lastMove = performance.now(); }
  cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move);
  btn.addEventListener('click', () => { lens.x = target.x; lens.y = target.y; ease.x = target.x; ease.y = target.y; win(); });
  window.addEventListener('resize', () => { const wasDone = done; size(); if (wasDone) { lens.x = ease.x = target.x; lens.y = ease.y = target.y; } });
  size();
  if (reduce) { win(); frame(performance.now()); } else requestAnimationFrame(frame);
})();
