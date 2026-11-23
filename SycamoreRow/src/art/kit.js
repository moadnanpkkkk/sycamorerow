/* Sycamore Row — art kit.
 * Every illustration is painted on three layers and composited:
 *   t (tone)  grayscale light map, 0 = black, 1 = lamp light. Dithered to 1-bit bone white (--lamp).
 *   d (dark)  crisp black silhouettes painted on top of the dithered light.
 *   l (line)  crisp bone linework (rims, edges, writing, details).
 */
(function () {
  'use strict';
  const SR = window.SR;
  // colours come from the design tokens in styles/main.css (fallbacks only for the standalone art preview)
  const INK = SR.token('ink', '#080708');
  const LAMP = SR.token('lamp', '#e6e1d6');
  const K = {};

  const g = (v) => { const c = Math.round(SR.clamp(v, 0, 1) * 255); return `rgb(${c},${c},${c})`; };
  K.g = g;
  K.INK = INK;
  K.LAMP = LAMP;

  /* ---------- tone helpers ---------- */
  K.fillTone = (A, v) => { A.t.fillStyle = g(v); A.t.fillRect(0, 0, A.W, A.H); };
  K.sky = (A, top, bottom, y0 = 0, y1 = A.H) => {
    const gr = A.t.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, g(top)); gr.addColorStop(1, g(bottom));
    A.t.fillStyle = gr; A.t.fillRect(0, y0, A.W, y1 - y0);
  };
  K.glow = (A, x, y, r, v = 1, ctx) => {
    const c = ctx || A.t;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${v})`);
    gr.addColorStop(0.35, `rgba(255,255,255,${v * 0.45})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr;
    c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  };
  K.cone = (A, x, y, w0, w1, len, v = 0.7) => {
    // a light cone pointing down from (x,y)
    const c = A.t; c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(0, y, 0, y + len);
    gr.addColorStop(0, `rgba(255,255,255,${v})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.beginPath();
    c.moveTo(x - w0 / 2, y); c.lineTo(x + w0 / 2, y); c.lineTo(x + w1 / 2, y + len); c.lineTo(x - w1 / 2, y + len);
    c.closePath(); c.fill(); c.restore();
  };
  K.shaft = (A, x0, y0, x1, y1, w0, w1, v = 0.35) => {
    // diagonal light shaft from a high window
    const c = A.t; c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, `rgba(255,255,255,${v})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.beginPath();
    c.moveTo(x0 - w0 / 2, y0); c.lineTo(x0 + w0 / 2, y0); c.lineTo(x1 + w1 / 2, y1); c.lineTo(x1 - w1 / 2, y1);
    c.closePath(); c.fill(); c.restore();
  };
  K.fog = (A, y, h, v = 0.25) => {
    const c = A.t; c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${v})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, y - h / 2, A.W, h); c.restore();
  };
  K.rect = (A, layer, x, y, w, h, v) => { const c = A[layer]; c.fillStyle = layer === 't' ? g(v) : (v || INK); c.fillRect(x, y, w, h); };
  K.vignette = (A, v = 0.6) => {
    const c = A.t; const gr = c.createRadialGradient(A.W / 2, A.H * 0.55, A.H * 0.25, A.W / 2, A.H * 0.55, A.W * 0.7);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${v})`);
    c.fillStyle = gr; c.fillRect(0, 0, A.W, A.H);
  };

  /* ---------- line helpers ---------- */
  K.stroke = (A, pts, w = 1.6, a = 1, layer = 'l') => {
    const c = A[layer]; c.save(); c.strokeStyle = layer === 'd' ? INK : LAMP; c.globalAlpha = a; c.lineWidth = w;
    c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore();
  };
  K.scribble = (A, x, y, w, lines, gap, opts = {}) => {
    // handwriting: wavy lines with loops, drawn in ink (d) or lamp (l)
    const layer = opts.layer || 'd'; const c = A[layer]; const R = A.R;
    c.save(); c.strokeStyle = layer === 'd' ? INK : LAMP; c.lineWidth = opts.w || 1.4; c.globalAlpha = opts.a || 1;
    c.lineCap = 'round';
    for (let i = 0; i < lines; i++) {
      const ly = y + i * gap; const len = i === lines - 1 ? w * (0.35 + R() * 0.3) : w * (0.85 + R() * 0.15);
      c.beginPath(); c.moveTo(x, ly);
      let px = x;
      while (px < x + len) {
        const step = 4 + R() * 7; const amp = (opts.amp || 3) * (0.5 + R());
        c.quadraticCurveTo(px + step / 2, ly - amp * (R() > 0.3 ? 1 : -0.6), px + step, ly + (R() - 0.5) * 1.5);
        px += step;
        if (R() < 0.12) { px += 5 + R() * 6; c.moveTo(px, ly); }
      }
      c.stroke();
    }
    c.restore();
  };
  K.typed = (A, x, y, w, lines, gap, layer = 'd') => {
    const c = A[layer]; const R = A.R; c.save(); c.fillStyle = layer === 'd' ? INK : LAMP;
    for (let i = 0; i < lines; i++) {
      let px = x; const end = x + (i === lines - 1 ? w * 0.5 : w);
      while (px < end) { const ww = 3 + R() * 14; c.fillRect(px, y + i * gap, Math.min(ww, end - px), 2); px += ww + 4; }
    }
    c.restore();
  };
  K.text = (A, str, x, y, size, opts = {}) => {
    const c = A[opts.layer || 'd']; c.save();
    c.fillStyle = (opts.layer || 'd') === 'd' ? INK : LAMP; c.globalAlpha = opts.a || 1;
    c.font = `${opts.weight || 700} ${size}px ${opts.font || '"Cinzel", "Palatino Linotype", serif'}`;
    c.textAlign = opts.align || 'center'; c.textBaseline = 'middle';
    if (opts.rot) { c.translate(x, y); c.rotate(opts.rot); c.fillText(str, 0, 0); } else c.fillText(str, x, y);
    c.restore();
  };

  /* ---------- transforms ---------- */
  K.withT = (A, x, y, rot, s, fn) => {
    ['t', 'd', 'l'].forEach((k) => { const c = A[k]; c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s || 1, s || 1); });
    try { fn(); } finally { ['t', 'd', 'l'].forEach((k) => A[k].restore()); }
  };

  /* ---------- landscape ---------- */
  K.hills = (A, y, amp, opts = {}) => {
    const c = A.d; const R = A.R; c.fillStyle = INK; c.beginPath(); c.moveTo(0, A.H);
    const n = 8; const pts = [];
    for (let i = 0; i <= n; i++) pts.push([(A.W / n) * i, y + Math.sin(i * 1.3 + (opts.phase || 0)) * amp + (R() - 0.5) * amp * 0.5]);
    c.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
      c.quadraticCurveTo(x0 + (x1 - x0) / 2, (y0 + y1) / 2 + (R() - 0.5) * amp, x1, y1);
    }
    c.lineTo(A.W, A.H); c.closePath(); c.fill();
    if (opts.rim) { c.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = opts.rim; A.l.lineWidth = 1.2; A.l.beginPath(); A.l.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; A.l.quadraticCurveTo(x0 + (x1 - x0) / 2, (y0 + y1) / 2, x1, y1); } A.l.stroke(); A.l.globalAlpha = 1; c.restore(); }
  };
  K.ground = (A, y) => { A.d.fillStyle = INK; A.d.fillRect(0, y, A.W, A.H - y); };
  K.moon = (A, x, y, r, opts = {}) => {
    K.glow(A, x, y, r * (opts.halo || 5), opts.haloV || 0.55);
    A.t.fillStyle = g(1); A.t.beginPath(); A.t.arc(x, y, r, 0, Math.PI * 2); A.t.fill();
    if (opts.crescent) { A.d.fillStyle = INK; A.d.beginPath(); A.d.arc(x + r * 0.45, y - r * 0.2, r * 0.92, 0, Math.PI * 2); A.d.fill(); }
  };
  K.birds = (A, x, y, n, s = 8) => {
    const R = A.R;
    for (let i = 0; i < n; i++) {
      const bx = x + (R() - 0.5) * s * 14; const by = y + (R() - 0.5) * s * 5; const w = s * (0.6 + R() * 0.6);
      K.stroke(A, [[bx - w, by - w * 0.3], [bx - w * 0.4, by - w * 0.45], [bx, by], [bx + w * 0.4, by - w * 0.45], [bx + w, by - w * 0.3]], 1.6, 1, 'd');
    }
  };
  K.rain = (A, n = 180, a = 0.35) => {
    const R = A.R; for (let i = 0; i < n; i++) { const x = R() * A.W; const y = R() * A.H; K.stroke(A, [[x, y], [x - 4, y + 16]], 1, a); }
  };
  K.fence = (A, x0, x1, y, h, opts = {}) => {
    const c = A.d; c.fillStyle = INK; const step = opts.step || 34;
    for (let x = x0; x <= x1; x += step) c.fillRect(x, y - h, 4, h);
    c.fillRect(x0, y - h * 0.75, x1 - x0, 3); c.fillRect(x0, y - h * 0.35, x1 - x0, 3);
  };

  /* ---------- the sycamore ---------- */
  K.tree = (A, x, y, h, opts = {}) => {
    const R = SR.rng(opts.seed || 7); const c = A.d; c.fillStyle = INK; c.strokeStyle = INK;
    const leafs = [];
    function branch(x0, y0, ang, len, w, depth) {
      const x1 = x0 + Math.cos(ang) * len; const y1 = y0 + Math.sin(ang) * len;
      const nx = Math.cos(ang + Math.PI / 2); const ny = Math.sin(ang + Math.PI / 2); const w1 = w * 0.68;
      const bend = (R() - 0.5) * len * 0.25;
      c.beginPath();
      c.moveTo(x0 + nx * w / 2, y0 + ny * w / 2);
      c.quadraticCurveTo((x0 + x1) / 2 + nx * (w / 2 + bend), (y0 + y1) / 2 + ny * (w / 2 + bend), x1 + nx * w1 / 2, y1 + ny * w1 / 2);
      c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2);
      c.quadraticCurveTo((x0 + x1) / 2 - nx * (w / 2 - bend), (y0 + y1) / 2 - ny * (w / 2 - bend), x0 - nx * w / 2, y0 - ny * w / 2);
      c.closePath(); c.fill();
      if (opts.rim && depth < 3 && w > 4) {
        A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = opts.rim; A.l.lineWidth = 1.1; A.l.beginPath();
        A.l.moveTo(x0 + nx * w / 2, y0 + ny * w / 2); A.l.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); A.l.stroke(); A.l.restore();
      }
      if (depth >= (opts.depth || 7) || len < 6) { leafs.push([x1, y1]); return; }
      const n = depth < 2 ? 2 : (R() < 0.7 ? 2 : 3);
      for (let i = 0; i < n; i++) {
        const spread = (opts.spread || 0.55) * (depth < 1 ? 1.2 : 1);
        const a = ang + (i - (n - 1) / 2) * spread + (R() - 0.5) * 0.35;
        branch(x1, y1, a, len * (0.68 + R() * 0.16), w1, depth + 1);
      }
      if (depth === 1 && opts.lowBranch) opts.lowBranch(x0, y0, x1, y1);
    }
    // trunk
    const trunkW = h * 0.075;
    branch(x, y, -Math.PI / 2 + (opts.lean || 0), h * 0.32, trunkW, 0);
    // roots flare
    c.beginPath(); c.moveTo(x - trunkW * 1.6, y + 2); c.quadraticCurveTo(x - trunkW * 0.4, y - trunkW * 0.6, x - trunkW * 0.3, y - trunkW * 2);
    c.lineTo(x + trunkW * 0.3, y - trunkW * 2); c.quadraticCurveTo(x + trunkW * 0.4, y - trunkW * 0.6, x + trunkW * 1.7, y + 2); c.closePath(); c.fill();
    // foliage clusters (sycamore: broad, open crown with seed balls)
    if (opts.leaves !== false) {
      leafs.forEach(([lx, ly]) => {
        const n = opts.sparse ? 2 : 4;
        for (let i = 0; i < n; i++) {
          const rr = h * (0.012 + R() * 0.02);
          c.beginPath(); c.arc(lx + (R() - 0.5) * h * 0.05, ly + (R() - 0.5) * h * 0.04, rr, 0, Math.PI * 2); c.fill();
        }
        if (R() < 0.12) { // hanging buttonball
          const by = ly + h * 0.03; c.fillRect(lx, ly, 1.2, by - ly); c.beginPath(); c.arc(lx, by, h * 0.008, 0, Math.PI * 2); c.fill();
        }
      });
    }
    return leafs;
  };

  /* ---------- people (black silhouettes) ---------- */
  // type: man | hat | sheriff | woman | old | stout | lawyer | boy
  K.figure = (A, x, y, h, type = 'man', opts = {}) => {
    const c = A.d; const f = opts.flip ? -1 : 1; const s = h;
    const P = (px, py) => [x + px * s * f, y - py * s];
    c.save(); c.fillStyle = INK; c.beginPath();
    const W = { man: 0.13, hat: 0.13, sheriff: 0.14, woman: 0.12, old: 0.12, stout: 0.18, lawyer: 0.11, boy: 0.11 }[type] || 0.13;
    const lean = type === 'old' ? 0.06 : (opts.lean || 0);
    const headY = 0.9 - (type === 'old' ? 0.05 : 0); const headX = lean;
    const mv = (p) => c.moveTo(...P(...p)); const ln = (p) => c.lineTo(...P(...p));
    const qc = (a, b) => c.quadraticCurveTo(...P(...a), ...P(...b));
    // body
    mv([-W * 0.45, 0]);
    if (type === 'woman') {
      ln([-W * 0.75, 0.02]); qc([-W * 0.8, 0.35], [-W * 0.55, 0.5]); // skirt
    } else {
      ln([-W * 0.25, 0]); ln([-W * 0.3, 0.42]);
    }
    qc([-W * 0.75, 0.55], [-W * 0.95 + lean, 0.72]); // waist to shoulder
    qc([-W * 0.95 + lean, 0.79], [-W * 0.35 + lean, 0.8]);
    ln([-W * 0.18 + headX, 0.82]); ln([W * 0.18 + headX, 0.82]);
    ln([W * 0.35 + lean, 0.8]);
    qc([W * 0.95 + lean, 0.79], [W * 0.95 + lean, 0.72]);
    qc([W * 0.75, 0.55], [W * 0.3, 0.42]);
    if (type === 'woman') { qc([W * 0.8, 0.35], [W * 0.75, 0.02]); ln([W * 0.45, 0]); }
    else { ln([W * 0.25, 0]); ln([W * 0.45, 0]); ln([W * 0.06, 0.38]); ln([-W * 0.06, 0.38]); }
    c.closePath(); c.fill();
    // stout belly
    if (type === 'stout') { c.beginPath(); c.ellipse(...P(lean * 0.5, 0.52), W * 0.75 * s, 0.14 * s, 0, 0, Math.PI * 2); c.fill(); }
    // head
    const hr = 0.065 * s; const [hx, hy] = P(headX, headY);
    c.beginPath(); c.ellipse(hx, hy, hr * 0.85, hr, 0, 0, Math.PI * 2); c.fill();
    // hats & hair
    if (type === 'hat' || type === 'old') {
      c.beginPath(); c.ellipse(hx, hy - hr * 0.55, hr * 1.7, hr * 0.28, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(hx, hy - hr * 0.95, hr * 0.9, hr * 0.55, 0, 0, Math.PI * 2); c.fill();
    }
    if (type === 'sheriff') {
      c.beginPath(); c.ellipse(hx, hy - hr * 0.6, hr * 2.1, hr * 0.32, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(hx - hr, hy - hr * 0.6); c.quadraticCurveTo(hx, hy - hr * 2.1, hx + hr, hy - hr * 0.6); c.fill();
      // badge glint
      const [bx, by] = P(-W * 0.4 * f + lean, 0.68);
      A.l.save(); A.l.fillStyle = LAMP; star(A.l, bx, by, 0.022 * s, 0.009 * s, 5); A.l.restore();
    }
    if (type === 'woman') { c.beginPath(); c.arc(hx - hr * 0.55 * f, hy - hr * 0.55, hr * 0.5, 0, Math.PI * 2); c.fill(); }
    if (type === 'lawyer') { // slick hair + briefcase
      c.beginPath(); c.ellipse(hx, hy - hr * 0.4, hr * 0.95, hr * 0.7, 0, Math.PI, 0); c.fill();
      const [bx, by] = P(W * 1.25, 0.32); c.fillRect(bx - 0.06 * s * (f > 0 ? 0 : 1), by, 0.06 * s, 0.045 * s);
      c.fillRect(bx + (f > 0 ? 0.02 : -0.04) * s, by - 0.012 * s, 0.02 * s, 0.014 * s);
    }
    if (type === 'old') { // cane
      const [cx0, cy0] = P(W * 1.3, 0.5); const [cx1, cy1] = P(W * 1.5, 0);
      c.lineWidth = 0.012 * s; c.strokeStyle = INK; c.beginPath(); c.moveTo(cx0, cy0); c.lineTo(cx1, cy1); c.stroke();
      c.beginPath(); c.arc(cx0 - 0.02 * s * f, cy0, 0.02 * s, Math.PI, 0); c.stroke();
    }
    if (opts.rim) { // pale rim light on one side
      A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = opts.rim; A.l.lineWidth = 1.3; A.l.beginPath();
      A.l.moveTo(...P(W * 0.35 + lean, 0.8)); A.l.quadraticCurveTo(...P(W * 0.95 + lean, 0.79), ...P(W * 0.95 + lean, 0.72));
      A.l.quadraticCurveTo(...P(W * 0.75, 0.55), ...P(W * 0.3, 0.42)); A.l.stroke();
      A.l.beginPath(); A.l.arc(hx, hy, hr, -Math.PI * 0.45 * f, Math.PI * 0.35 * f, f < 0); A.l.stroke(); A.l.restore();
    }
    c.restore();
    return { head: [hx, hy], hr };
  };
  function star(c, x, y, R1, R2, n) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R2 : R1; const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  K.star = star;

  /* ---------- architecture & windows ---------- */
  // A lit window: bright pane with mullions; opts: cols, rows, curtains, blinds, arch, v (brightness), figure
  K.litWindow = (A, x, y, w, h, opts = {}) => {
    const v = opts.v == null ? 1 : opts.v;
    const t = A.t; const gr = t.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, g(v * 0.92)); gr.addColorStop(1, g(v * 0.62));
    t.fillStyle = gr;
    t.beginPath();
    if (opts.arch) { t.moveTo(x, y + h); t.lineTo(x, y + w / 2); t.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); t.lineTo(x + w, y + h); }
    else t.rect(x, y, w, h);
    t.fill();
    const d = A.d;
    // cut the pane out of any silhouette already painted (walls, houses) so the light shows through
    d.save(); d.globalCompositeOperation = 'destination-out'; d.beginPath();
    if (opts.arch) { d.moveTo(x, y + h); d.lineTo(x, y + w / 2); d.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); d.lineTo(x + w, y + h); d.closePath(); }
    else d.rect(x, y, w, h);
    d.fill(); d.restore();
    if (opts.spill) K.glow(A, x + w / 2, y + h / 2, Math.max(w, h) * opts.spill, 0.35);
    if (opts.inside) opts.inside(x, y, w, h);
    d.fillStyle = INK;
    if (opts.blinds) for (let yy = y + 6; yy < y + h; yy += opts.blinds) d.fillRect(x, yy, w, Math.max(2, opts.blinds * 0.38));
    const cols = opts.cols || 2; const rows = opts.rows || 2; const mw = opts.mw || Math.max(3, w * 0.035);
    for (let i = 1; i < cols; i++) d.fillRect(x + (w / cols) * i - mw / 2, y, mw, h);
    for (let j = 1; j < rows; j++) d.fillRect(x, y + (h / rows) * j - mw / 2, w, mw);
    if (opts.curtains) {
      d.beginPath(); d.moveTo(x, y); d.lineTo(x + w * 0.28, y); d.quadraticCurveTo(x + w * 0.12, y + h * 0.5, x + w * 0.22, y + h); d.lineTo(x, y + h); d.fill();
      d.beginPath(); d.moveTo(x + w, y); d.lineTo(x + w * 0.72, y); d.quadraticCurveTo(x + w * 0.88, y + h * 0.5, x + w * 0.78, y + h); d.lineTo(x + w, y + h); d.fill();
      K.curtainFolds(A, x, y, w, h);
    }
    if (opts.sill !== false && opts.frame !== false) { d.fillRect(x - 12, y + h, w + 24, 8); K.stroke(A, [[x - 12, y + h], [x + w + 12, y + h]], 1.2, 0.75); }
    if (opts.frame !== false) { d.strokeStyle = INK; d.lineWidth = mw * 1.4; d.strokeRect(x, y, w, h); }
  };
  K.building = (A, x, base, w, h, opts = {}) => {
    const d = A.d; const R = A.R; d.fillStyle = INK; d.fillRect(x, base - h, w, h);
    if (opts.roof === 'gable') { d.beginPath(); d.moveTo(x - 6, base - h); d.lineTo(x + w / 2, base - h - w * 0.35); d.lineTo(x + w + 6, base - h); d.fill(); }
    if (opts.roof === 'flat') d.fillRect(x - 4, base - h - 8, w + 8, 8);
    const ww = opts.ww || 14; const wh = opts.wh || 20; const cols = Math.max(1, Math.floor((w - 10) / (ww + 12)));
    const rows = Math.max(1, Math.floor((h - 20) / (wh + 16)));
    for (let r = 0; r < rows; r++) for (let cI = 0; cI < cols; cI++) {
      if (R() < (opts.lit == null ? 0.25 : opts.lit)) {
        const wx = x + 8 + cI * ((w - 16) / cols) + ((w - 16) / cols - ww) / 2; const wy = base - h + 14 + r * (wh + 16);
        A.t.fillStyle = g(0.85 + R() * 0.15); A.t.fillRect(wx, wy, ww, wh);
        K.glow(A, wx + ww / 2, wy + wh / 2, ww * 2.2, 0.18);
        // window cut in dark layer so light shows through the silhouette
        d.clearRect(wx, wy, ww, wh); d.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      }
    }
  };
  K.courthouse = (A, cx, base, s, opts = {}) => {
    const d = A.d; d.fillStyle = INK;
    const w = s; const h = s * 0.42;
    d.fillRect(cx - w / 2, base - h, w, h); // main block
    d.fillRect(cx - w * 0.55, base - s * 0.04, w * 1.1, s * 0.04); // steps
    // pediment
    d.beginPath(); d.moveTo(cx - w * 0.3, base - h); d.lineTo(cx, base - h - s * 0.13); d.lineTo(cx + w * 0.3, base - h); d.fill();
    // tower + dome
    d.fillRect(cx - s * 0.09, base - h - s * 0.32, s * 0.18, s * 0.2);
    d.beginPath(); d.arc(cx, base - h - s * 0.32, s * 0.09, Math.PI, 0); d.fill();
    d.fillRect(cx - 1.5, base - h - s * 0.5, 3, s * 0.1);
    // clock face (lit)
    const ky = base - h - s * 0.22; const kr = s * 0.045;
    A.t.fillStyle = g(1); A.t.beginPath(); A.t.arc(cx, ky, kr, 0, Math.PI * 2); A.t.fill(); K.glow(A, cx, ky, kr * 5, 0.4);
    d.save(); d.globalCompositeOperation = 'destination-out'; d.beginPath(); d.arc(cx, ky, kr, 0, Math.PI * 2); d.fill(); d.restore();
    K.stroke(A, [[cx, ky], [cx, ky - kr * 0.7]], 2, 1, 'd'); K.stroke(A, [[cx, ky], [cx + kr * 0.5, ky + kr * 0.2]], 2, 1, 'd');
    // columns: cut gaps to reveal light between columns if lit
    if (opts.lit !== false) {
      const n = 6; const colW = w * 0.6 / (n * 2 - 1);
      for (let i = 0; i < n - 1; i++) {
        const gx = cx - w * 0.3 + colW * (1 + i * 2);
        A.t.fillStyle = g(opts.litV || 0.75); A.t.fillRect(gx, base - h * 0.85, colW, h * 0.78);
        d.clearRect(gx, base - h * 0.85, colW, h * 0.78);
      }
      K.glow(A, cx, base - h * 0.4, w * 0.45, 0.25);
    }
    // side windows
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
      const wx = cx + side * (w * 0.36 + i * w * 0.07) - 6; const wy = base - h * 0.75;
      if (opts.lit !== false && (i + side) % 2 === 0) { A.t.fillStyle = g(0.9); A.t.fillRect(wx, wy, 12, h * 0.4); d.clearRect(wx, wy, 12, h * 0.4); }
    }
  };
  K.streetlamp = (A, x, base, h) => {
    const d = A.d; d.fillStyle = INK; d.fillRect(x - 2, base - h, 4, h); d.fillRect(x - 10, base - h - 4, 20, 5);
    d.beginPath(); d.moveTo(x - 9, base - h - 4); d.lineTo(x, base - h - 18); d.lineTo(x + 9, base - h - 4); d.fill();
    K.glow(A, x, base - h + 6, h * 0.55, 0.6); K.cone(A, x, base - h + 2, 14, h * 0.9, h, 0.18);
  };

  /* ---------- interiors & objects ---------- */
  K.table = (A, y, opts = {}) => {
    A.d.fillStyle = INK; A.d.fillRect(0, y, A.W, A.H - y);
    K.stroke(A, [[0, y], [A.W, y]], 1.5, opts.edge == null ? 0.8 : opts.edge);
  };
  K.lamp = (A, x, base, s, opts = {}) => {
    const d = A.d; d.fillStyle = INK;
    d.beginPath(); d.ellipse(x, base - 3, s * 0.35, s * 0.07, 0, 0, Math.PI * 2); d.fill();
    d.fillRect(x - 3, base - s * 0.9, 6, s * 0.9);
    d.beginPath(); d.moveTo(x - s * 0.42, base - s * 0.72); d.lineTo(x - s * 0.18, base - s * 1.25); d.lineTo(x + s * 0.18, base - s * 1.25); d.lineTo(x + s * 0.42, base - s * 0.72); d.closePath(); d.fill();
    K.glow(A, x, base - s * 0.5, s * (opts.r || 3.2), opts.v || 0.9);
    K.cone(A, x, base - s * 0.72, s * 0.84, s * 2.4, s * 0.8, 0.5);
    K.stroke(A, [[x - s * 0.42, base - s * 0.72], [x + s * 0.42, base - s * 0.72]], 1.4, 0.9);
  };
  K.candle = (A, x, base, s) => {
    A.d.fillStyle = INK; A.d.fillRect(x - s * 0.09, base - s, s * 0.18, s);
    A.d.beginPath(); A.d.ellipse(x, base, s * 0.25, s * 0.06, 0, 0, Math.PI * 2); A.d.fill();
    K.glow(A, x, base - s * 1.15, s * 3.5, 0.85);
    A.t.fillStyle = g(1); A.t.beginPath(); A.t.ellipse(x, base - s * 1.15, s * 0.06, s * 0.14, 0, 0, Math.PI * 2); A.t.fill();
    A.l.fillStyle = LAMP; A.l.beginPath(); A.l.ellipse(x, base - s * 1.15, s * 0.05, s * 0.13, 0, 0, Math.PI * 2); A.l.fill();
  };
  // a sheet of paper: lit (tone) with ink writing on top
  K.paper = (A, x, y, w, h, rot, opts = {}) => {
    K.withT(A, x, y, rot, 1, () => {
      A.t.fillStyle = g(opts.v || 0.95); A.t.fillRect(-w / 2, -h / 2, w, h);
      if (opts.fold) { A.t.fillStyle = g((opts.v || 0.95) * 0.75); A.t.fillRect(-w / 2, -h / 2 + h * opts.fold, w, 2); }
      A.d.clearRect(-w / 2, -h / 2, w, h);
      if (opts.write !== false) {
        if (opts.typed) K.typed(A, -w / 2 + w * 0.12, -h / 2 + h * 0.14, w * 0.76, opts.lines || 9, h * 0.075);
        else K.scribble(A, -w / 2 + w * 0.1, -h / 2 + h * 0.16, w * 0.8, opts.lines || 8, h * 0.085, { amp: h * 0.012 + 1 });
      }
      if (opts.title) K.text(A, opts.title, 0, -h / 2 + h * 0.09, h * 0.07);
      if (opts.seal) { A.d.fillStyle = K.INK; A.d.beginPath(); A.d.arc(w * 0.28, h * 0.34, w * 0.09, 0, Math.PI * 2); A.d.fill(); A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = 0.8; A.l.beginPath(); A.l.arc(w * 0.28, h * 0.34, w * 0.065, 0, Math.PI * 2); A.l.stroke(); A.l.restore(); }
      if (opts.after) opts.after(w, h);
      if (opts.edge !== false) { A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = 0.5; A.l.lineWidth = 1; A.l.strokeRect(-w / 2, -h / 2, w, h); A.l.restore(); }
    });
  };
  K.cup = (A, x, base, s, steam) => {
    const d = A.d; d.fillStyle = INK;
    d.beginPath(); d.moveTo(x - s * 0.5, base - s); d.lineTo(x + s * 0.5, base - s); d.quadraticCurveTo(x + s * 0.48, base - s * 0.1, x + s * 0.2, base); d.lineTo(x - s * 0.2, base); d.quadraticCurveTo(x - s * 0.48, base - s * 0.1, x - s * 0.5, base - s); d.fill();
    d.lineWidth = s * 0.12; d.strokeStyle = INK; d.beginPath(); d.arc(x + s * 0.55, base - s * 0.6, s * 0.2, -Math.PI / 2, Math.PI / 2); d.stroke();
    d.beginPath(); d.ellipse(x, base, s * 0.8, s * 0.12, 0, 0, Math.PI * 2); d.fill();
    K.stroke(A, [[x - s * 0.5, base - s], [x + s * 0.5, base - s]], 1.3, 0.8);
    if (steam) for (let i = -1; i <= 1; i++) { const sx = x + i * s * 0.22; K.stroke(A, [[sx, base - s * 1.1], [sx + 5, base - s * 1.5], [sx - 3, base - s * 1.9], [sx + 4, base - s * 2.3]], 1.2, 0.55); }
  };
  K.glass = (A, x, base, s, fill = 0.5) => {
    A.t.fillStyle = g(0.55); A.t.fillRect(x - s * 0.32, base - s * fill, s * 0.64, s * fill);
    K.stroke(A, [[x - s * 0.35, base - s], [x - s * 0.3, base], [x + s * 0.3, base], [x + s * 0.35, base - s]], 1.6, 0.95);
  };
  K.bottle = (A, x, base, s) => {
    const d = A.d; d.fillStyle = INK; d.beginPath(); d.moveTo(x - s * 0.18, base); d.lineTo(x - s * 0.18, base - s * 0.6);
    d.quadraticCurveTo(x - s * 0.18, base - s * 0.75, x - s * 0.06, base - s * 0.82); d.lineTo(x - s * 0.06, base - s);
    d.lineTo(x + s * 0.06, base - s); d.lineTo(x + s * 0.06, base - s * 0.82); d.quadraticCurveTo(x + s * 0.18, base - s * 0.75, x + s * 0.18, base - s * 0.6);
    d.lineTo(x + s * 0.18, base); d.fill();
    K.stroke(A, [[x + s * 0.12, base - s * 0.55], [x + s * 0.12, base - s * 0.1]], 1.4, 0.8);
  };
  K.books = (A, x, base, w, opts = {}) => {
    const R = A.R; let px = x; const d = A.d;
    while (px < x + w) {
      const bw = 8 + R() * 14; const bh = (opts.h || 60) * (0.7 + R() * 0.3); const lean = R() < 0.08 ? 0.2 : 0;
      d.save(); d.translate(px, base); d.rotate(lean); d.fillStyle = INK; d.fillRect(0, -bh, bw - 2, bh); d.restore();
      if (opts.rim) K.stroke(A, [[px + 1, base - bh + 4], [px + 1, base - 4]], 1, opts.rim);
      px += bw;
    }
  };
  K.shelf = (A, x, y, w, h, rows) => {
    const d = A.d; d.fillStyle = INK; d.fillRect(x, y, 8, h); d.fillRect(x + w - 8, y, 8, h);
    for (let r = 0; r <= rows; r++) { const yy = y + (h / rows) * r; d.fillRect(x, yy - 4, w, 6); if (r > 0) K.books(A, x + 10, yy - 4, w - 22, { h: h / rows - 12, rim: 0.35 }); }
  };
  K.chair = (A, x, base, s, flip) => {
    const f = flip ? -1 : 1; const d = A.d; d.fillStyle = INK;
    d.fillRect(x - s * 0.3 * f, base - s * 0.55, s * 0.6 * f, s * 0.07);
    d.fillRect(x - s * 0.3 * f, base - s * 0.55, s * 0.06 * f, s * 0.55); d.fillRect(x + s * 0.24 * f, base - s * 0.55, s * 0.06 * f, s * 0.55);
    d.fillRect(x + s * 0.24 * f, base - s * 1.2, s * 0.07 * f, s * 0.7);
    for (let i = 0; i < 3; i++) d.fillRect(x + s * 0.0 * f, base - s * (1.1 - i * 0.18), s * 0.3 * f, s * 0.04);
  };
  K.rocker = (A, x, base, s) => {
    K.chair(A, x, base - s * 0.08, s);
    A.d.strokeStyle = INK; A.d.lineWidth = s * 0.05; A.d.beginPath(); A.d.arc(x, base - s * 0.9, s * 0.95, Math.PI * 0.32, Math.PI * 0.68); A.d.stroke();
  };
  K.badge = (A, x, y, r) => { A.l.save(); A.l.fillStyle = LAMP; star(A.l, x, y, r, r * 0.45, 5); A.l.restore(); A.d.fillStyle = INK; A.d.beginPath(); A.d.arc(x, y, r * 0.25, 0, Math.PI * 2); A.d.fill(); };
  K.hat = (A, x, y, s) => {
    const d = A.d; d.fillStyle = INK; d.beginPath(); d.ellipse(x, y, s, s * 0.18, 0, 0, Math.PI * 2); d.fill();
    d.beginPath(); d.moveTo(x - s * 0.5, y); d.quadraticCurveTo(x - s * 0.5, y - s * 0.6, x, y - s * 0.62); d.quadraticCurveTo(x + s * 0.5, y - s * 0.6, x + s * 0.5, y); d.fill();
    K.stroke(A, [[x - s * 0.5, y - s * 0.12], [x + s * 0.5, y - s * 0.12]], 1.5, 0.8);
    K.stroke(A, [[x - s, y], [x + s, y]], 1.2, 0.5);
  };
  K.scales = (A, x, base, s, tilt = 0) => {
    const d = A.d; d.fillStyle = INK; d.fillRect(x - 3, base - s, 6, s); d.fillRect(x - s * 0.25, base - 6, s * 0.5, 6);
    const ax = s * 0.48; const t = tilt * s * 0.15;
    K.stroke(A, [[x - ax, base - s * 0.92 + t], [x + ax, base - s * 0.92 - t]], 4, 1, 'd');
    for (const sd of [-1, 1]) {
      const px = x + sd * ax; const py = base - s * 0.92 - sd * t;
      K.stroke(A, [[px, py], [px - s * 0.12, py + s * 0.3]], 1.2, 1, 'd'); K.stroke(A, [[px, py], [px + s * 0.12, py + s * 0.3]], 1.2, 1, 'd');
      d.beginPath(); d.ellipse(px, py + s * 0.31, s * 0.15, s * 0.035, 0, 0, Math.PI); d.fill();
      K.stroke(A, [[px - s * 0.15, py + s * 0.31], [px + s * 0.15, py + s * 0.31]], 1.2, 0.8);
    }
    K.stroke(A, [[x - ax, base - s * 0.92 + t], [x + ax, base - s * 0.92 - t]], 1.1, 0.8);
  };
  K.gavel = (A, x, y, s, rot = -0.4) => {
    K.withT(A, x, y, rot, 1, () => {
      A.d.fillStyle = INK; A.d.fillRect(-s * 0.05, -s * 0.05, s * 0.95, s * 0.1);
      A.d.fillRect(-s * 0.32, -s * 0.2, s * 0.32, s * 0.4);
      K.stroke(A, [[-s * 0.32, -s * 0.2], [0, -s * 0.2]], 1.2, 0.8);
    });
  };
  K.car = (A, x, base, s, opts = {}) => {
    const d = A.d; d.fillStyle = INK; const f = opts.flip ? -1 : 1;
    d.beginPath(); d.moveTo(x - s * 0.5 * f, base - s * 0.08); d.lineTo(x - s * 0.5 * f, base - s * 0.2);
    d.lineTo(x - s * 0.3 * f, base - s * 0.24); d.lineTo(x - s * 0.18 * f, base - s * 0.38); d.lineTo(x + s * 0.18 * f, base - s * 0.38);
    d.lineTo(x + s * 0.3 * f, base - s * 0.24); d.lineTo(x + s * 0.52 * f, base - s * 0.2); d.lineTo(x + s * 0.52 * f, base - s * 0.08); d.closePath(); d.fill();
    for (const wx of [-0.3, 0.32]) { d.beginPath(); d.arc(x + wx * s * f, base - s * 0.08, s * 0.08, 0, Math.PI * 2); d.fill(); }
    if (opts.siren) { K.glow(A, x, base - s * 0.42, s * 0.6, 0.8); A.t.fillStyle = g(1); A.t.fillRect(x - s * 0.04, base - s * 0.43, s * 0.08, s * 0.04); d.clearRect(x - s * 0.04, base - s * 0.43, s * 0.08, s * 0.04); }
    if (opts.head) { K.glow(A, x + s * 0.52 * f, base - s * 0.15, s * 0.25, 0.9); }
    if (opts.tail) { A.l.fillStyle = LAMP; A.l.fillRect(x - s * 0.52 * f - 3, base - s * 0.18, 4, 5); }
  };
  K.cracks = (A, x, y, r, n = 9) => {
    const R = A.R;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.4; let px = x; let py = y; const pts = [[px, py]];
      const len = r * (0.5 + R() * 0.6); const steps = 5;
      for (let s = 0; s < steps; s++) { px += Math.cos(a + (R() - 0.5) * 0.6) * len / steps; py += Math.sin(a + (R() - 0.5) * 0.6) * len / steps; pts.push([px, py]); }
      K.stroke(A, pts, 1.4, 0.95); K.stroke(A, pts.map(([u, v]) => [u + 1.5, v + 1]), 1.2, 1, 'd');
    }
    for (let k = 1; k <= 2; k++) { const rr = r * 0.25 * k; const pts = []; for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push([x + Math.cos(a) * rr * (0.8 + R() * 0.4), y + Math.sin(a) * rr * (0.8 + R() * 0.4)]); } K.stroke(A, pts, 1.1, 0.7); }
  };
  K.rope = (A, x, y, len, cut) => {
    const pts = []; for (let i = 0; i <= 10; i++) pts.push([x + Math.sin(i * 0.9) * 2, y + (len / 10) * i]);
    K.stroke(A, pts, 3.2, 1, 'd'); K.stroke(A, pts.map(([u, v]) => [u + 1.6, v]), 1, 0.8);
    if (cut) { K.stroke(A, [[x - 4, y + len], [x + 4, y + len + 3]], 1.4, 0.9); }
  };
  K.pin = (A, x, y) => { A.l.fillStyle = LAMP; A.l.beginPath(); A.l.arc(x, y, 3.5, 0, Math.PI * 2); A.l.fill(); A.d.fillStyle = INK; A.d.beginPath(); A.d.arc(x, y, 1.5, 0, Math.PI * 2); A.d.fill(); };
  K.magnifier = (A, x, y, r) => {
    A.d.strokeStyle = INK; A.d.lineWidth = r * 0.16; A.d.beginPath(); A.d.arc(x, y, r, 0, Math.PI * 2); A.d.stroke();
    A.d.lineWidth = r * 0.24; A.d.beginPath(); A.d.moveTo(x + r * 0.75, y + r * 0.75); A.d.lineTo(x + r * 1.7, y + r * 1.7); A.d.stroke();
    A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = 0.85; A.l.lineWidth = 1.2; A.l.beginPath(); A.l.arc(x, y, r * 1.08, -2.4, -0.9); A.l.stroke(); A.l.restore();
  };
  K.envelope = (A, x, y, w, h, rot = 0, opts = {}) => {
    K.withT(A, x, y, rot, 1, () => {
      A.t.fillStyle = g(0.9); A.t.fillRect(-w / 2, -h / 2, w, h); A.d.clearRect(-w / 2, -h / 2, w, h);
      K.stroke(A, [[-w / 2, -h / 2], [0, h * 0.08], [w / 2, -h / 2]], 1.4, 1, 'd');
      if (opts.seal) { A.d.fillStyle = INK; A.d.beginPath(); A.d.arc(0, h * 0.06, h * 0.12, 0, Math.PI * 2); A.d.fill(); A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = 0.8; A.l.beginPath(); A.l.arc(0, h * 0.06, h * 0.07, 0, Math.PI * 2); A.l.stroke(); A.l.restore(); }
      if (opts.label) K.typed(A, -w * 0.25, h * 0.22, w * 0.5, 2, 8);
      A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = 0.5; A.l.strokeRect(-w / 2, -h / 2, w, h); A.l.restore();
    });
  };
  K.pen = (A, x, y, s, rot = 0.6) => {
    K.withT(A, x, y, rot, 1, () => {
      A.d.fillStyle = INK; A.d.beginPath(); A.d.moveTo(0, 0); A.d.lineTo(s * 0.08, -s * 0.06); A.d.lineTo(s, -s * 0.06); A.d.lineTo(s, s * 0.06); A.d.lineTo(s * 0.08, s * 0.06); A.d.closePath(); A.d.fill();
      K.stroke(A, [[s * 0.15, -s * 0.03], [s * 0.95, -s * 0.03]], 1, 0.7);
    });
  };
  K.door = (A, x, base, w, h, opts = {}) => {
    // wooden door lit by porch light
    A.t.fillStyle = g(opts.v || 0.4); A.t.fillRect(x, base - h, w, h);
    const R = A.R; for (let i = 1; i < 5; i++) K.stroke(A, [[x + (w / 5) * i, base - h], [x + (w / 5) * i, base]], 2, 1, 'd');
    for (let i = 0; i < 40; i++) { const gx = x + R() * w; const gy = base - h + R() * h; K.stroke(A, [[gx, gy], [gx, gy + 10 + R() * 30]], 1, 0.25); }
    A.d.fillStyle = INK; A.d.fillRect(x - 10, base - h - 10, w + 20, 10); A.d.fillRect(x - 10, base - h, 10, h); A.d.fillRect(x + w, base - h, 10, h);
    A.l.fillStyle = LAMP; A.l.beginPath(); A.l.arc(x + w * 0.85, base - h * 0.48, 4, 0, Math.PI * 2); A.l.fill();
  };

  /* ---------- room detail ---------- */
  // damask wallpaper: a diamond lattice of small sycamore leaves, painted into the light layer
  K.wallpaper = (A, v = 0.1, opts = {}) => {
    const t = A.t; const step = opts.step || 46; const lift = opts.lift || 0.07;
    t.save(); t.globalCompositeOperation = 'lighter'; t.fillStyle = `rgba(255,255,255,${lift})`;
    const leafAt = (cx, cy, sc, rot) => {
      t.save(); t.translate(cx, cy); t.rotate(rot); t.scale(sc, sc); t.beginPath();
      [[0, 14], [-6, 13], [-14, 9], [-9, 4], [-16, -6], [-7, -5], [-5, -12], [0, -18], [5, -12], [7, -5], [16, -6], [9, 4], [14, 9], [6, 13]].forEach(([px, py], i) => (i ? t.lineTo(px, py) : t.moveTo(px, py)));
      t.closePath(); t.fill(); t.restore();
    };
    for (let yy = (opts.y0 || 0); yy < (opts.y1 || A.H) + step; yy += step) {
      for (let xx = 0, row = Math.round(yy / step); xx < A.W + step; xx += step) {
        const ox = row % 2 ? step / 2 : 0;
        leafAt(xx + ox, yy, 0.55, 0);
        t.fillRect(xx + ox + step / 2 - 1.5, yy - 1.5, 3, 3);
      }
    }
    t.restore();
  };
  K.wainscot = (A, y, opts = {}) => {
    const d = A.d; d.fillStyle = INK; d.fillRect(0, y, A.W, A.H - y);
    K.stroke(A, [[0, y], [A.W, y]], 1.6, 0.8); K.stroke(A, [[0, y + 8], [A.W, y + 8]], 1, 0.45);
    const pw = opts.panel || 120; const top = y + 24; const bot = Math.min(A.H - 14, y + (opts.h || 150));
    for (let x = 18; x + pw - 12 < A.W; x += pw) {
      K.stroke(A, [[x, top], [x + pw - 24, top], [x + pw - 24, bot], [x, bot], [x, top]], 1, 0.32);
      K.stroke(A, [[x + 6, top + 6], [x + pw - 30, top + 6]], 0.8, 0.18);
    }
  };
  K.floor = (A, y, opts = {}) => {
    // perspective floorboards that catch a little light
    A.t.fillStyle = g(opts.v || 0.07); A.t.fillRect(0, y, A.W, A.H - y);
    A.d.clearRect(0, y, A.W, A.H - y);
    const vx = opts.vx == null ? A.W / 2 : opts.vx;
    for (let i = -10; i <= 10; i++) K.stroke(A, [[vx + i * 26, y], [vx + i * 150, A.H]], 1, 0.22, 'd');
    for (let j = 1; j < 6; j++) { const yy = y + (A.H - y) * Math.pow(j / 6, 1.6); K.stroke(A, [[0, yy], [A.W, yy]], 0.8, 0.16); }
    K.stroke(A, [[0, y], [A.W, y]], 1.4, 0.7);
  };
  K.pictureFrame = (A, x, y, w, h, inner) => {
    A.t.fillStyle = g(0.5); A.t.fillRect(x, y, w, h); A.d.clearRect(x, y, w, h);
    if (inner) inner(x, y, w, h);
    const d = A.d; d.strokeStyle = INK; d.lineWidth = 7; d.strokeRect(x - 3, y - 3, w + 6, h + 6);
    K.stroke(A, [[x - 7, y - 7], [x + w + 7, y - 7], [x + w + 7, y + h + 7], [x - 7, y + h + 7], [x - 7, y - 7]], 1.1, 0.75);
    K.stroke(A, [[x + w / 2, y - 7], [x + w / 2, y - 26]], 1, 0.5); K.pin(A, x + w / 2, y - 27);
  };
  K.clock = (A, x, y, r) => {
    A.d.fillStyle = INK; A.d.beginPath(); A.d.arc(x, y, r + 6, 0, Math.PI * 2); A.d.fill();
    A.t.fillStyle = g(0.55); A.t.beginPath(); A.t.arc(x, y, r, 0, Math.PI * 2); A.t.fill();
    A.d.save(); A.d.globalCompositeOperation = 'destination-out'; A.d.beginPath(); A.d.arc(x, y, r, 0, Math.PI * 2); A.d.fill(); A.d.restore();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; K.stroke(A, [[x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8], [x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92]], 1.6, 1, 'd'); }
    K.stroke(A, [[x, y], [x + r * 0.1, y - r * 0.6]], 2.4, 1, 'd'); K.stroke(A, [[x, y], [x + r * 0.5, y + r * 0.2]], 2, 1, 'd');
    A.l.save(); A.l.strokeStyle = LAMP; A.l.globalAlpha = 0.8; A.l.lineWidth = 1.2; A.l.beginPath(); A.l.arc(x, y, r + 6, -2.6, -0.4); A.l.stroke(); A.l.restore();
  };
  K.sconce = (A, x, y, s = 30) => {
    A.d.fillStyle = INK; A.d.fillRect(x - 3, y, 6, s * 0.9); A.d.beginPath(); A.d.moveTo(x - s * 0.35, y); A.d.lineTo(x, y - s * 0.6); A.d.lineTo(x + s * 0.35, y); A.d.fill();
    K.glow(A, x, y - s * 0.3, s * 4, 0.55); A.l.fillStyle = LAMP; A.l.beginPath(); A.l.ellipse(x, y - s * 0.32, s * 0.08, s * 0.16, 0, 0, Math.PI * 2); A.l.fill();
  };
  K.plant = (A, x, base, s) => {
    A.d.fillStyle = INK; A.d.beginPath(); A.d.moveTo(x - s * 0.3, base - s * 0.4); A.d.lineTo(x + s * 0.3, base - s * 0.4); A.d.lineTo(x + s * 0.22, base); A.d.lineTo(x - s * 0.22, base); A.d.fill();
    const R = A.R; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (R() - 0.5) * 2.2; const L = s * (0.5 + R() * 0.6); const ex = x + Math.cos(a) * L; const ey = base - s * 0.4 + Math.sin(a) * L; K.stroke(A, [[x, base - s * 0.4], [(x + ex) / 2 + (R() - 0.5) * 10, (base - s * 0.4 + ey) / 2], [ex, ey]], 3, 1, 'd'); A.d.beginPath(); A.d.ellipse(ex, ey, s * 0.09, s * 0.04, a, 0, Math.PI * 2); A.d.fill(); }
  };
  // folds on the curtains of a lit window
  K.curtainFolds = (A, x, y, w, h) => {
    for (let i = 0; i < 4; i++) {
      K.stroke(A, [[x + w * (0.04 + i * 0.05), y + 4], [x + w * (0.02 + i * 0.045), y + h * 0.5], [x + w * (0.05 + i * 0.04), y + h - 4]], 1, 0.35);
      K.stroke(A, [[x + w * (0.96 - i * 0.05), y + 4], [x + w * (0.98 - i * 0.045), y + h * 0.5], [x + w * (0.95 - i * 0.04), y + h - 4]], 1, 0.35);
    }
    K.stroke(A, [[x - 10, y - 6], [x + w + 10, y - 6]], 3, 1, 'd'); K.stroke(A, [[x - 10, y - 8], [x + w + 10, y - 8]], 1, 0.6);
  };

  SR.ArtKit = K;
})();
