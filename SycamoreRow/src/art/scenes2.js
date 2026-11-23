/* Sycamore Row — illustrations for Levels 2–5, endings and character portraits. */
(function () {
  'use strict';
  const SR = window.SR;
  const P = SR.Art.painters;

  const wall = (A, K, v = 0.08) => { K.fillTone(A, v); K.wallpaper(A, v, { lift: v > 0.15 ? 0.06 : 0.08 }); K.vignette(A, 0.75); };

  /* ================= Level 2 · Clanton ================= */
  P.town_map = (A, K) => {
    K.fillTone(A, 0.05);
    K.glow(A, A.W * 0.5, A.H * 0.15, 520, 0.55);
    // the map sheet pinned to the wall
    const x = A.W * 0.14; const y = A.H * 0.12; const w = A.W * 0.72; const h = A.H * 0.8;
    const t = A.t; const gr = t.createRadialGradient(A.W * 0.5, A.H * 0.3, 40, A.W * 0.5, A.H * 0.5, w * 0.7);
    gr.addColorStop(0, K.g(0.92)); gr.addColorStop(1, K.g(0.45)); t.fillStyle = gr; t.fillRect(x, y, w, h);
    const cx = x + w / 2; const cy = y + h * 0.52;
    // streets
    const st = (pts, wd = 7) => K.stroke(A, pts, wd, 1, 'd');
    st([[x, cy], [x + w, cy]]); st([[cx, y], [cx, y + h]]);
    st([[x + w * 0.1, y + h * 0.15], [cx - 60, cy - 60]], 4); st([[cx + 60, cy + 60], [x + w * 0.92, y + h * 0.9]], 4);
    st([[x + w * 0.05, y + h * 0.82], [cx - 80, cy + 40]], 4); st([[x + w * 0.75, y + h * 0.05], [cx + 70, cy - 70]], 3);
    // square + courthouse
    A.d.fillStyle = K.INK; A.d.fillRect(cx - 55, cy - 55, 110, 110); A.t.fillStyle = K.g(0.9); A.t.fillRect(cx - 40, cy - 40, 80, 80); A.d.clearRect(cx - 40, cy - 40, 80, 80);
    A.d.fillRect(cx - 18, cy - 14, 36, 28); A.d.beginPath(); A.d.moveTo(cx - 20, cy - 14); A.d.lineTo(cx, cy - 28); A.d.lineTo(cx + 20, cy - 14); A.d.fill();
    // blocks
    const R = A.R; for (let i = 0; i < 26; i++) { const bx = x + 20 + R() * (w - 60); const by = y + 20 + R() * (h - 60); if (Math.abs(bx - cx) < 90 && Math.abs(by - cy) < 90) continue; A.d.fillRect(bx, by, 14 + R() * 26, 10 + R() * 18); }
    // creek and the tree
    K.stroke(A, [[x + w * 0.62, y + h], [x + w * 0.7, y + h * 0.78], [x + w * 0.86, y + h * 0.7], [x + w, y + h * 0.62]], 2, 1, 'd');
    K.withT(A, x + w * 0.88, y + h * 0.6, 0, 1, () => { K.tree(A, 0, 0, 70, { seed: 4, depth: 5 }); });
    // five marked places
    const marks = [[0.2, 0.28, 'I'], [0.62, 0.36, 'II'], [0.38, 0.7, 'III'], [0.5, 0.45, 'IV'], [0.78, 0.82, 'V']];
    marks.forEach(([mx, my, n]) => { const px = x + w * mx; const py = y + h * my; A.d.fillStyle = K.INK; A.d.beginPath(); A.d.arc(px, py, 15, 0, Math.PI * 2); A.d.fill(); K.text(A, n, px, py + 1, 12, { layer: 'l' }); });
    K.text(A, 'CLANTON · FORD CO.', cx, y + 26, 22); K.stroke(A, [[x + 30, y + 44], [x + w - 30, y + 44]], 1.2, 1, 'd');
    // compass
    const kx = x + w - 60; const ky = y + h - 60; K.stroke(A, [[kx, ky - 30], [kx, ky + 30]], 1.5, 1, 'd'); K.stroke(A, [[kx - 30, ky], [kx + 30, ky]], 1.5, 1, 'd'); K.text(A, 'N', kx, ky - 42, 13);
    [[x + 14, y + 14], [x + w - 14, y + 14]].forEach(([px, py]) => K.pin(A, px, py));
  };

  P.lettie_porch = (A, K) => {
    K.sky(A, 0.02, 0.32, 0, A.H * 0.7);
    K.moon(A, A.W * 0.86, A.H * 0.16, 24, { halo: 5, haloV: 0.4 });
    const base = A.H * 0.86; const d = A.d; d.fillStyle = K.INK;
    // shotgun house
    d.fillRect(A.W * 0.12, A.H * 0.34, A.W * 0.62, base - A.H * 0.34);
    d.beginPath(); d.moveTo(A.W * 0.08, A.H * 0.36); d.lineTo(A.W * 0.43, A.H * 0.12); d.lineTo(A.W * 0.78, A.H * 0.36); d.fill();
    K.stroke(A, [[A.W * 0.08, A.H * 0.36], [A.W * 0.43, A.H * 0.12], [A.W * 0.78, A.H * 0.36]], 1.2, 0.5);
    // kitchen window with Lettie inside
    K.litWindow(A, A.W * 0.44, A.H * 0.42, A.W * 0.2, A.H * 0.26, { cols: 2, rows: 2, curtains: true, spill: 1.2, inside: (x, y, w, h) => { K.figure(A, x + w * 0.55, y + h * 1.25, h * 1.2, 'woman', { flip: true }); } });
    K.litWindow(A, A.W * 0.18, A.H * 0.44, A.W * 0.1, A.H * 0.2, { cols: 1, rows: 2, v: 0.45 });
    // porch roof, posts, rail
    d.fillRect(A.W * 0.06, A.H * 0.33, A.W * 0.74, 12);
    for (const px of [0.08, 0.3, 0.52, 0.76]) d.fillRect(A.W * px, A.H * 0.33, 10, base - A.H * 0.33);
    d.fillRect(A.W * 0.06, base - 50, A.W * 0.74, 5);
    for (let px = A.W * 0.07; px < A.W * 0.8; px += 16) d.fillRect(px, base - 50, 4, 50);
    K.stroke(A, [[A.W * 0.06, base - 50], [A.W * 0.8, base - 50]], 1, 0.45);
    K.ground(A, base); K.stroke(A, [[0, base], [A.W, base]], 1.2, 0.6);
    K.rocker(A, A.W * 0.2, base - 2, 90);
    K.tree(A, A.W * 0.92, base, A.H * 0.7, { seed: 21, depth: 6, rim: 0.3 });
  };

  P.sheriff_office = (A, K) => {
    wall(A, K, 0.09);
    K.floor(A, A.H * 0.8, { v: 0.1 });
    K.litWindow(A, A.W * 0.34, A.H * 0.1, A.W * 0.34, A.H * 0.56, { cols: 2, rows: 1, blinds: 14, spill: 1.1, v: 1, inside: (x, y, w, h) => { K.courthouse(A, x + w * 0.5, y + h, w * 0.9, { lit: false }); } });
    // blind light falling on the floor
    for (let i = 0; i < 7; i++) K.shaft(A, A.W * 0.5, A.H * 0.66, A.W * (0.3 + i * 0.03), A.H, 40, 70, 0.08);
    K.clock(A, A.W * 0.24, A.H * 0.2, 26);
    K.pictureFrame(A, A.W * 0.74, A.H * 0.18, 120, 80, (x, y, w, h) => { K.typed(A, x + 12, y + 14, w - 24, 5, 12); K.text(A, 'WANTED', x + w / 2, y + 8, 9); });
    // filing cabinet
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.2, A.H * 0.5, A.W * 0.1, A.H * 0.32);
    for (let i = 0; i < 3; i++) { K.stroke(A, [[A.W * 0.2, A.H * (0.5 + i * 0.105)], [A.W * 0.3, A.H * (0.5 + i * 0.105)]], 1, 0.5); A.l.fillStyle = K.LAMP; A.l.fillRect(A.W * 0.245, A.H * (0.55 + i * 0.105), 12, 3); }
    K.figure(A, A.W * 0.48, A.H * 0.96, A.H * 0.78, 'ozzie', { rim: 0.6, pose: 'hold' });
    // desk & fan
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.62, A.H * 0.72, A.W * 0.38, A.H * 0.28);
    K.stroke(A, [[A.W * 0.62, A.H * 0.72], [A.W, A.H * 0.72]], 1.4, 0.8);
    A.d.fillRect(A.W * 0.5 - 2, 0, 4, A.H * 0.06); A.d.beginPath(); A.d.ellipse(A.W * 0.5, A.H * 0.06, 150, 8, 0, 0, Math.PI * 2); A.d.fill();
    K.hat(A, A.W * 0.82, A.H * 0.71, 40);
    // hat rack
    A.d.fillRect(A.W * 0.12, A.H * 0.25, 6, A.H * 0.75); K.stroke(A, [[A.W * 0.08, A.H * 0.3], [A.W * 0.12, A.H * 0.25], [A.W * 0.16, A.H * 0.3]], 3, 1, 'd');
  };

  P.law_office = (A, K) => {
    wall(A, K, 0.1);
    K.litWindow(A, A.W * 0.06, A.H * 0.12, A.W * 0.2, A.H * 0.5, { cols: 2, rows: 3, v: 0.85, spill: 1 });
    K.shelf(A, A.W * 0.62, A.H * 0.06, A.W * 0.34, A.H * 0.62, 4);
    K.pictureFrame(A, A.W * 0.37, A.H * 0.1, 96, 66, (x, y, w, h) => { K.text(A, 'JURIS', x + w / 2, y + 18, 11); K.scribble(A, x + 14, y + 38, w - 28, 2, 12, { amp: 2 }); });
    K.lamp(A, A.W * 0.3, A.H * 0.62, 70, { r: 4 });
    K.glow(A, A.W * 0.5, A.H * 0.36, 260, 0.8); // lamplight on the wall behind him
    K.figure(A, A.W * 0.47, A.H * 0.98, A.H * 0.74, 'harry', { rim: 0.7, flip: true });
    K.table(A, A.H * 0.62);
    for (let i = 0; i < 12; i++) K.stroke(A, [[A.W * (0.02 + i * 0.08), A.H * 0.68], [A.W * (0.06 + i * 0.08), A.H * 0.98]], 1, 0.12); // desk grain
    K.paper(A, A.W * 0.62, A.H * 0.74, 160, 100, 0.2, { typed: true, lines: 6, v: 0.6 });
    K.paper(A, A.W * 0.7, A.H * 0.78, 150, 96, -0.15, { typed: true, lines: 6, v: 0.7 });
    K.bottle(A, A.W * 0.2, A.H * 0.62, 70); K.glass(A, A.W * 0.25, A.H * 0.62, 32);
  };

  P.records_room = (A, K) => {
    K.fillTone(A, 0.14);
    const cx = A.W * 0.5; const vy = A.H * 0.42;
    K.glow(A, cx, A.H * 0.22, 360, 0.95); K.cone(A, cx, A.H * 0.24, 40, A.W * 0.6, A.H * 0.76, 0.3);
    A.d.fillStyle = K.INK; A.d.fillRect(cx - 1, 0, 2, A.H * 0.18); A.d.beginPath(); A.d.moveTo(cx - 22, A.H * 0.24); A.d.lineTo(cx, A.H * 0.17); A.d.lineTo(cx + 22, A.H * 0.24); A.d.fill();
    A.l.fillStyle = K.LAMP; A.l.beginPath(); A.l.arc(cx, A.H * 0.255, 7, 0, Math.PI * 2); A.l.fill();
    // receding shelves on both sides
    for (let i = 0; i < 6; i++) {
      const t = i / 6; const s = 1 - t * 0.8;
      for (const side of [-1, 1]) {
        const x = cx + side * (A.W * 0.48 * s); const top = vy - A.H * 0.5 * s; const bot = vy + A.H * 0.58 * s; const w = 40 * s;
        A.d.fillRect(side < 0 ? x - w : x, top, w, bot - top);
        K.stroke(A, [[x, top], [x, bot]], 1.2, 0.7 * (1 - t));
        for (let r = 1; r < 6; r++) K.stroke(A, [[x, top + ((bot - top) / 6) * r], [side < 0 ? x - w : x + w, top + ((bot - top) / 6) * r]], 1, 0.6 * (1 - t));
      }
    }
    K.figure(A, cx + 30, A.H * 0.8, A.H * 0.34, 'clerk', { rim: 0.7, pose: 'hold', prop: 'paper', flip: true });
    A.d.fillRect(0, A.H * 0.92, A.W, A.H * 0.08);
  };

  P.confront = (A, K) => {
    K.sky(A, 0.1, 0.95, 0, A.H * 0.7);
    K.glow(A, A.W * 0.5, A.H * 0.66, 260, 1);
    K.building(A, 0, A.H * 0.7, 220, 260, { lit: 0 }); K.building(A, A.W - 240, A.H * 0.7, 240, 230, { lit: 0 });
    K.ground(A, A.H * 0.7);
    // long shadows toward the viewer
    K.figure(A, A.W * 0.37, A.H * 0.88, A.H * 0.52, 'you', { rim: 0.8, pose: 'point' });
    K.figure(A, A.W * 0.64, A.H * 0.88, A.H * 0.52, 'lanier', { flip: true, rim: 0.8 });
    K.stroke(A, [[0, A.H * 0.7], [A.W, A.H * 0.7]], 1.2, 0.8);
    for (let i = 0; i < 9; i++) K.stroke(A, [[A.W * 0.5, A.H * 0.7], [A.W * (i / 8), A.H]], 1, 0.22);
  };

  /* ---- visit results ---- */
  P.r_father = (A, K) => {
    wall(A, K, 0.04);
    K.candle(A, A.W * 0.24, A.H * 0.7, 70);
    K.table(A, A.H * 0.7);
    // framed photograph of Sylvester Rinds
    const x = A.W * 0.42; const y = A.H * 0.16; const w = A.W * 0.26; const h = A.H * 0.52;
    A.d.fillStyle = K.INK; A.d.fillRect(x - 20, y - 20, w + 40, h + 40);
    K.stroke(A, [[x - 20, y - 20], [x + w + 20, y - 20], [x + w + 20, y + h + 20], [x - 20, y + h + 20], [x - 20, y - 20]], 1.4, 0.8);
    const t = A.t; const gr = t.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, K.g(0.85)); gr.addColorStop(1, K.g(0.4)); t.fillStyle = gr; t.fillRect(x, y, w, h); A.d.clearRect(x, y, w, h);
    K.figure(A, x + w / 2, y + h + h * 0.25, h * 1.05, 'hat');
    K.tree(A, x + w * 0.85, y + h, h * 0.6, { seed: 9, depth: 5, sparse: true });
    A.d.fillRect(x, y + h, w, 2);
    K.stroke(A, [[x + 10, y + h - 12], [x + w - 10, y + h - 12]], 0.8, 0.3);
  };
  P.r_father_closed = (A, K) => {
    K.fillTone(A, 0.03);
    K.glow(A, A.W * 0.5, A.H * 0.1, 300, 0.6);
    K.door(A, A.W * 0.38, A.H * 0.9, A.W * 0.24, A.H * 0.7, { v: 0.38 });
    K.glow(A, A.W * 0.5, A.H * 0.9, 200, 0.5);
    A.t.fillStyle = K.g(1); A.t.fillRect(A.W * 0.38, A.H * 0.895, A.W * 0.24, 6); // light under the door
    A.d.fillStyle = K.INK; A.d.fillRect(0, A.H * 0.9 + 6, A.W, A.H);
    K.text(A, 'Rinds', A.W * 0.5, A.H * 0.96, 26, { layer: 'l', font: '"IM Fell English", Georgia, serif', weight: 400, a: 0.85 });
  };
  P.r_tea = (A, K) => {
    wall(A, K, 0.05);
    K.litWindow(A, A.W * 0.3, A.H * 0.1, A.W * 0.4, A.H * 0.66, { cols: 2, rows: 3, curtains: true, v: 0.85, spill: 1 });
    K.table(A, A.H * 0.76);
    K.cup(A, A.W * 0.4, A.H * 0.76, 60, true); K.cup(A, A.W * 0.6, A.H * 0.76, 60, true);
    // teapot between the cups
    const d = A.d; d.fillStyle = K.INK; d.beginPath(); d.ellipse(A.W * 0.5, A.H * 0.7, 52, 44, 0, 0, Math.PI * 2); d.fill();
    d.fillRect(A.W * 0.5 - 8, A.H * 0.6, 16, 10); d.lineWidth = 8; d.strokeStyle = K.INK; d.beginPath(); d.moveTo(A.W * 0.5 + 44, A.H * 0.72); d.quadraticCurveTo(A.W * 0.5 + 80, A.H * 0.7, A.W * 0.5 + 86, A.H * 0.6); d.stroke();
    K.stroke(A, [[A.W * 0.5 - 30, A.H * 0.64], [A.W * 0.5 - 44, A.H * 0.7]], 1.2, 0.7);
  };
  P.r_promise = (A, K) => {
    wall(A, K, 0.03);
    K.lamp(A, A.W * 0.72, A.H * 0.7, 110, { v: 1 });
    K.glow(A, A.W * 0.45, A.H * 0.55, 300, 0.4);
    K.table(A, A.H * 0.7);
    K.hat(A, A.W * 0.4, A.H * 0.69, 120);
    K.badge(A, A.W * 0.6, A.H * 0.84, 34);
    K.paper(A, A.W * 0.22, A.H * 0.84, 160, 90, -0.1, { typed: true, lines: 5, v: 0.6 });
  };
  P.r_photo = (A, K) => {
    wall(A, K, 0.03);
    K.lamp(A, A.W * 0.15, A.H * 0.58, 90);
    K.table(A, A.H * 0.58, { edge: 0.4 });
    K.withT(A, A.W * 0.55, A.H * 0.62, -0.06, 1, () => {
      const w = 380; const h = 270; A.t.fillStyle = K.g(0.95); A.t.fillRect(-w / 2, -h / 2, w, h); A.d.clearRect(-w / 2, -h / 2, w, h);
      const iw = w - 36; const ih = h - 60; const t = A.t; const gr = t.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, K.g(0.75)); gr.addColorStop(1, K.g(0.35)); t.fillStyle = gr; t.fillRect(-iw / 2, -h / 2 + 18, iw, ih);
      A.d.fillStyle = K.INK; A.d.beginPath(); A.d.moveTo(-iw / 2, -h / 2 + 18 + ih * 0.3); A.d.quadraticCurveTo(0, -h / 2 + 18 + ih * 0.22, iw / 2, -h / 2 + 18 + ih * 0.28); A.d.lineTo(iw / 2, -h / 2 + 18 + ih * 0.38); A.d.quadraticCurveTo(0, -h / 2 + 18 + ih * 0.32, -iw / 2, -h / 2 + 18 + ih * 0.42); A.d.fill();
      A.d.fillRect(-iw / 2, -h / 2 + 18, 60, ih);
      K.rope(A, 40, -h / 2 + 18 + ih * 0.32, ih * 0.38, true);
      K.scribble(A, -w / 2 + 30, h / 2 - 26, w * 0.5, 1, 0, { amp: 3 });
      K.text(A, '1964', w / 2 - 50, h / 2 - 22, 18, { font: '"IM Fell English", Georgia, serif', weight: 400 });
    });
  };
  P.r_drink = (A, K) => {
    wall(A, K, 0.04);
    K.glow(A, A.W * 0.5, A.H * 0.18, 260, 0.9); A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.5 - 1, 0, 2, A.H * 0.14);
    A.d.beginPath(); A.d.moveTo(A.W * 0.5 - 50, A.H * 0.2); A.d.lineTo(A.W * 0.5, A.H * 0.13); A.d.lineTo(A.W * 0.5 + 50, A.H * 0.2); A.d.fill();
    K.cone(A, A.W * 0.5, A.H * 0.2, 100, 520, A.H * 0.6, 0.45);
    K.table(A, A.H * 0.72);
    K.bottle(A, A.W * 0.5, A.H * 0.72, 190);
    K.glass(A, A.W * 0.38, A.H * 0.72, 70, 0.4); K.glass(A, A.W * 0.62, A.H * 0.72, 70, 0.2);
    K.figure(A, A.W * 0.14, A.H * 1.1, A.H * 0.9, 'stout', { rim: 0.4 });
  };
  P.r_estate = (A, K) => {
    wall(A, K, 0.04);
    K.litWindow(A, A.W * 0.55, A.H * 0.06, A.W * 0.38, A.H * 0.42, { cols: 3, rows: 2, v: 0.7, inside: (x, y, w, h) => { for (let i = 0; i < 5; i++) { A.d.fillStyle = K.INK; A.d.beginPath(); A.d.arc(x + 30 + i * 24, y + h - 20 - (i % 2) * 20, 16, 0, Math.PI * 2); A.d.fill(); } K.tree(A, x + w * 0.8, y + h, h * 0.9, { seed: 13, depth: 5 }); } });
    K.table(A, A.H * 0.58);
    K.lamp(A, A.W * 0.14, A.H * 0.58, 90);
    // open ledger
    K.paper(A, A.W * 0.38, A.H * 0.78, 220, 170, -0.04, { typed: true, lines: 10, v: 0.95 });
    K.paper(A, A.W * 0.6, A.H * 0.78, 220, 170, 0.04, { typed: true, lines: 10, v: 0.8, after: (w, h) => K.stroke(A, [[-w * 0.4, h * 0.1], [w * 0.4, h * 0.1]], 2, 1, 'd') });
  };
  P.r_deeds = (A, K) => {
    wall(A, K, 0.04);
    K.glow(A, A.W * 0.5, A.H * 0.4, 420, 0.7);
    K.paper(A, A.W * 0.46, A.H * 0.52, 420, 520, -0.03, { title: 'WARRANTY DEED', typed: true, lines: 12, seal: true, v: 0.97, after: (w, h) => { K.scribble(A, -w * 0.38, h * 0.36, w * 0.4, 1, 0, { amp: 6, w: 2 }); K.text(A, '1964', -w * 0.25, -h * 0.34, 20, { font: '"IM Fell English", Georgia, serif', weight: 400 }); } });
    K.magnifier(A, A.W * 0.72, A.H * 0.68, 70);
  };
  P.r_file1964 = (A, K) => {
    K.fillTone(A, 0.03);
    K.glow(A, A.W * 0.5, A.H * 0.1, 300, 1); K.cone(A, A.W * 0.5, A.H * 0.12, 30, A.W * 0.8, A.H * 0.9, 0.35);
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.5 - 1, 0, 2, A.H * 0.1);
    K.withT(A, A.W * 0.5, A.H * 0.62, 0.04, 1, () => {
      const w = 460; const h = 320; A.t.fillStyle = K.g(0.8); A.t.fillRect(-w / 2, -h / 2, w, h); A.t.fillRect(-w / 2, -h / 2 - 24, 140, 26);
      A.d.clearRect(-w / 2, -h / 2 - 24, w, h + 24);
      K.stroke(A, [[-w / 2, -h / 2], [w / 2, -h / 2]], 1.2, 1, 'd');
      K.text(A, '1964', 0, -10, 84);
      K.text(A, 'RINDS, SYLVESTER — CLOSED', 0, 60, 18);
      A.d.save(); A.d.strokeStyle = K.INK; A.d.lineWidth = 3; A.d.strokeRect(-130, -70, 260, 120); A.d.restore();
    });
  };
  P.r_lanier = (A, K) => {
    K.fillTone(A, 0.03);
    K.litWindow(A, A.W * 0.36, A.H * 0.1, A.W * 0.28, A.H * 0.82, { cols: 1, rows: 1, v: 1, spill: 1, blinds: 18, frame: true });
    K.figure(A, A.W * 0.5, A.H * 0.94, A.H * 0.74, 'lawyer');
    for (let i = 0; i < 6; i++) K.shaft(A, A.W * 0.5, A.H * 0.92, A.W * (0.2 + i * 0.12), A.H, 60, 120, 0.06);
  };
  P.r_hubbards = (A, K) => {
    K.sky(A, 0.02, 0.25, 0, A.H * 0.75);
    const d = A.d; d.fillStyle = K.INK; const base = A.H * 0.82;
    d.fillRect(A.W * 0.08, A.H * 0.3, A.W * 0.84, base - A.H * 0.3);
    d.beginPath(); d.moveTo(A.W * 0.04, A.H * 0.32); d.lineTo(A.W * 0.5, A.H * 0.08); d.lineTo(A.W * 0.96, A.H * 0.32); d.fill();
    for (const px of [0.12, 0.27, 0.65, 0.8]) K.litWindow(A, A.W * px, A.H * 0.4, A.W * 0.08, A.H * 0.18, { cols: 2, rows: 2, v: 0.75, spill: 0.8 });
    K.litWindow(A, A.W * 0.43, A.H * 0.4, A.W * 0.14, base - A.H * 0.4, { cols: 1, rows: 1, v: 1, spill: 1.4, sill: false, inside: (x, y, w, h) => { K.figure(A, x + w * 0.32, y + h, h * 0.86, 'son', { pose: 'point', rim: 0 }); K.figure(A, x + w * 0.74, y + h, h * 0.8, 'daughter', { flip: true, rim: 0 }); } });
    for (const px of [0.1, 0.3, 0.68, 0.88]) d.fillRect(A.W * px, A.H * 0.3, 14, base - A.H * 0.3);
    K.ground(A, base); K.stroke(A, [[0, base], [A.W, base]], 1.2, 0.6);
  };
  P.r_slammed = (A, K) => {
    P.r_hubbards(A, K);
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.43, A.H * 0.4, A.W * 0.14, A.H * 0.42);
    A.l.fillStyle = K.LAMP; A.l.fillRect(A.W * 0.43, A.H * 0.815, A.W * 0.14, 3);
  };
  P.not_enough = (A, K) => {
    wall(A, K, 0.04);
    K.litWindow(A, A.W * 0.58, A.H * 0.08, A.W * 0.3, A.H * 0.5, { cols: 2, rows: 3, v: 0.35, inside: () => K.rain(A, 60, 0.4) });
    K.table(A, A.H * 0.62);
    K.lamp(A, A.W * 0.18, A.H * 0.62, 70, { v: 0.5, r: 2.5 });
    const R = A.R; for (let i = 0; i < 6; i++) K.paper(A, A.W * (0.32 + R() * 0.5), A.H * (0.72 + R() * 0.16), 110, 76, (R() - 0.5) * 1.2, { lines: 4, v: 0.45 + R() * 0.3 });
    K.chair(A, A.W * 0.86, A.H * 0.98, 160, true);
  };

  /* ================= Level 3 · Pressure ================= */
  P.note_door = (A, K) => {
    K.fillTone(A, 0.02);
    K.glow(A, A.W * 0.5, A.H * 0.02, 330, 0.8);
    K.door(A, A.W * 0.3, A.H * 1.02, A.W * 0.4, A.H * 0.95, { v: 0.32 });
    K.paper(A, A.W * 0.5, A.H * 0.42, 190, 150, 0.05, { write: false, v: 1, after: (w, h) => {
      K.text(A, 'LET THE DEAD', 0, -h * 0.22, 19); K.text(A, "MAN'S MONEY", 0, -h * 0.02, 19); K.text(A, 'GO HOME', 0, h * 0.18, 19);
      A.d.fillStyle = K.INK; A.d.beginPath(); A.d.arc(0, -h * 0.42, 4, 0, Math.PI * 2); A.d.fill();
    } });
  };
  P.brick_window = (A, K) => {
    K.fillTone(A, 0.03);
    K.litWindow(A, A.W * 0.24, A.H * 0.06, A.W * 0.52, A.H * 0.62, { cols: 2, rows: 2, v: 0.62, inside: (x, y, w, h) => { K.streetlamp(A, x + w * 0.8, y + h, h * 0.8); } });
    K.cracks(A, A.W * 0.4, A.H * 0.3, 160, 11);
    K.table(A, A.H * 0.74);
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.46, A.H * 0.8, 110, 50); K.stroke(A, [[A.W * 0.46, A.H * 0.8], [A.W * 0.46 + 110, A.H * 0.8], [A.W * 0.46 + 110, A.H * 0.8 + 50]], 1.3, 0.85);
    K.stroke(A, [[A.W * 0.46 + 20, A.H * 0.8], [A.W * 0.46 + 30, A.H * 0.8 + 50]], 1, 0.5);
    const R = A.R; for (let i = 0; i < 14; i++) { const sx = A.W * (0.2 + R() * 0.6); const sy = A.H * (0.78 + R() * 0.18); K.stroke(A, [[sx, sy], [sx + 8 + R() * 10, sy - 4], [sx + 5, sy + 4], [sx, sy]], 1, 0.85); }
  };
  P.r_ignored = (A, K) => {
    wall(A, K, 0.03);
    K.lamp(A, A.W * 0.28, A.H * 0.6, 110, { v: 1 });
    K.clock(A, A.W * 0.86, A.H * 0.18, 28);
    K.glow(A, A.W * 0.66, A.H * 0.34, 250, 0.7); // lamplight thrown on the wall behind you
    K.figure(A, A.W * 0.64, A.H * 1.12, A.H * 0.86, 'you', { flip: true, lean: 0.06, rim: 0.8, pose: 'hold' });
    K.table(A, A.H * 0.6);
    K.paper(A, A.W * 0.44, A.H * 0.76, 150, 110, 0.1, { write: false, v: 1, after: (w, h) => K.text(A, 'HUBBARD LUMBER', 0, h * 0.25, 11, { a: 0.6 }) });
    K.magnifier(A, A.W * 0.44, A.H * 0.74, 44);
  };
  P.r_lowlying = (A, K) => {
    wall(A, K, 0.05);
    K.litWindow(A, A.W * 0.3, A.H * 0.08, A.W * 0.4, A.H * 0.62, { cols: 2, rows: 3, curtains: true, v: 0.3 });
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.36, A.H * 0.08, A.W * 0.28, A.H * 0.62); // drawn curtains meet
    K.stroke(A, [[A.W * 0.5, A.H * 0.08], [A.W * 0.5, A.H * 0.7]], 1.4, 0.6);
    K.glow(A, A.W * 0.5, A.H * 0.4, 120, 0.25);
    K.table(A, A.H * 0.74);
    K.candle(A, A.W * 0.24, A.H * 0.74, 60);
    K.glow(A, A.W * 0.32, A.H * 0.62, 280, 0.55);
    // telephone off the hook
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.6, A.H * 0.68, 90, 46); A.d.beginPath(); A.d.ellipse(A.W * 0.6 + 45, A.H * 0.68, 48, 10, 0, Math.PI, 0); A.d.fill();
    K.stroke(A, [[A.W * 0.6, A.H * 0.68], [A.W * 0.6 + 90, A.H * 0.68]], 1.2, 0.7);
    K.stroke(A, [[A.W * 0.6 + 90, A.H * 0.72], [A.W * 0.78, A.H * 0.8], [A.W * 0.74, A.H * 0.9], [A.W * 0.82, A.H * 0.95]], 2.4, 1, 'd');
    K.stroke(A, [[A.W * 0.6 + 90, A.H * 0.72], [A.W * 0.78, A.H * 0.8], [A.W * 0.74, A.H * 0.9], [A.W * 0.82, A.H * 0.95]], 1, 0.5);
  };
  P.r_deputy = (A, K) => {
    K.sky(A, 0.01, 0.12, 0, A.H * 0.7);
    K.building(A, 0, A.H * 0.74, 300, 300, { lit: 0.15 }); K.building(A, A.W - 320, A.H * 0.74, 320, 280, { lit: 0.2 });
    K.litWindow(A, A.W * 0.06, A.H * 0.34, 120, 120, { cols: 2, rows: 2, v: 0.85, spill: 1 });
    A.t.fillStyle = K.g(0.12); A.t.fillRect(0, A.H * 0.74, A.W, A.H * 0.26); // street surface takes light
    A.d.clearRect(0, A.H * 0.74, A.W, A.H * 0.26);
    K.stroke(A, [[0, A.H * 0.74], [A.W, A.H * 0.74]], 1, 0.5);
    K.streetlamp(A, A.W * 0.78, A.H * 0.74, 150);
    K.glow(A, A.W * 0.5, A.H * 0.88, 360, 0.6);
    K.car(A, A.W * 0.48, A.H * 0.86, 340, { siren: true, head: true });
    K.figure(A, A.W * 0.68, A.H * 0.88, A.H * 0.34, 'sheriff', { flip: true, rim: 0.5 });
  };
  P.r_public = (A, K) => {
    wall(A, K, 0.05);
    K.glow(A, A.W * 0.5, A.H * 0.45, 460, 0.6);
    K.paper(A, A.W * 0.5, A.H * 0.56, 560, 420, -0.02, { write: false, v: 0.95, after: (w, h) => {
      K.text(A, 'THE FORD COUNTY TIMES', 0, -h * 0.4, 24); K.stroke(A, [[-w * 0.45, -h * 0.33], [w * 0.45, -h * 0.33]], 1.5, 1, 'd');
      K.text(A, 'THREATS OVER HUBBARD WILL', 0, -h * 0.22, 26);
      K.typed(A, -w * 0.44, -h * 0.08, w * 0.42, 12, 13); K.typed(A, w * 0.03, -h * 0.08, w * 0.42, 5, 13);
      A.d.fillStyle = K.INK; A.d.fillRect(w * 0.03, h * 0.02, w * 0.42, h * 0.3);
      K.withT(A, w * 0.24, h * 0.3, 0, 1, () => K.tree(A, 0, 0, h * 0.26, { seed: 6, depth: 5, rim: 0.5 }));
    } });
  };
  P.clue_board = (A, K) => {
    K.fillTone(A, 0.05);
    K.glow(A, A.W * 0.5, A.H * 0.4, 520, 0.5);
    const R = A.R; const notes = [[0.22, 0.28], [0.5, 0.22], [0.78, 0.3], [0.3, 0.66], [0.62, 0.62], [0.82, 0.72]];
    for (let i = 0; i < notes.length; i++) for (let j = i + 1; j < notes.length; j++) if (R() < 0.45) K.stroke(A, [[A.W * notes[i][0], A.H * notes[i][1] - 40], [A.W * notes[j][0], A.H * notes[j][1] - 40]], 1.3, 0.9);
    notes.forEach(([nx, ny], i) => {
      if (i === 1) K.withT(A, A.W * nx, A.H * ny, 0.05, 1, () => { const w = 150; const h = 110; A.t.fillStyle = K.g(0.8); A.t.fillRect(-w / 2, -h / 2, w, h); A.d.clearRect(-w / 2, -h / 2, w, h); K.tree(A, 0, h * 0.4, h * 0.7, { seed: 2, depth: 5 }); });
      else K.paper(A, A.W * nx, A.H * ny, 150, 110, (R() - 0.5) * 0.25, { lines: 4, v: 0.7 + R() * 0.25 });
      K.pin(A, A.W * nx, A.H * ny - 46);
    });
  };
  P.tree_land = (A, K) => {
    K.sky(A, 0.01, 0.42, 0, A.H * 0.68);
    K.moon(A, A.W * 0.5, A.H * 0.2, 36, { halo: 6, haloV: 0.6 });
    K.ground(A, A.H * 0.68);
    // surveyed plot lines with stakes, crossed out
    const pts = [[0.18, 0.8], [0.82, 0.8], [0.94, 0.98], [0.06, 0.98]].map(([x, y]) => [A.W * x, A.H * y]);
    K.stroke(A, [...pts, pts[0]], 1.6, 0.9);
    for (let i = 1; i < 6; i++) K.stroke(A, [[A.W * (0.18 + (i / 6) * 0.64), A.H * 0.8], [A.W * (0.06 + (i / 6) * 0.88), A.H * 0.98]], 1, 0.35);
    K.stroke(A, [pts[0], pts[2]], 3, 0.95); K.stroke(A, [pts[1], pts[3]], 3, 0.95);
    pts.forEach(([x, y]) => { A.d.fillStyle = K.INK; A.d.fillRect(x - 3, y - 26, 6, 26); K.stroke(A, [[x + 3, y - 26], [x + 3, y]], 1, 0.8); });
    K.tree(A, A.W * 0.5, A.H * 0.7, A.H * 0.55, { seed: 11, rim: 0.6 });
    K.text(A, '80 ACRES', A.W * 0.5, A.H * 0.9, 18, { layer: 'l', a: 0.8 });
  };
  P.torn_notes = (A, K) => {
    wall(A, K, 0.1);
    K.glow(A, A.W * 0.5, A.H * 0.6, 380, 0.5);
    K.stroke(A, [[0, A.H * 0.4], [A.W, A.H * 0.4]], 1.2, 0.35);
    const R = A.R;
    for (let i = 0; i < 11; i++) {
      const x = A.W * (0.15 + R() * 0.7); const y = A.H * (0.5 + R() * 0.42); const w = 50 + R() * 70; const h = 40 + R() * 50;
      K.withT(A, x, y, (R() - 0.5) * 1.4, 1, () => {
        A.t.fillStyle = K.g(0.5 + R() * 0.4); A.t.beginPath(); A.t.moveTo(-w / 2, -h / 2); A.t.lineTo(w / 2, -h / 2 + R() * 10); A.t.lineTo(w / 2 - R() * 14, h / 2); A.t.lineTo(-w / 2 + R() * 10, h / 2 - R() * 10); A.t.closePath(); A.t.fill();
        K.scribble(A, -w * 0.35, -h * 0.2, w * 0.6, 2, h * 0.3, { amp: 2 });
      });
    }
  };

  /* ================= Level 4 · The Night Before ================= */
  P.lamplit_desk = (A, K) => {
    wall(A, K, 0.03);
    K.litWindow(A, A.W * 0.37, A.H * 0.06, A.W * 0.26, A.W * 0.26, { cols: 2, rows: 2, v: 0.4, inside: (x, y, w, h) => K.moon(A, x + w * 0.7, y + h * 0.3, 18, { halo: 3, haloV: 0.4 }) });
    K.table(A, A.H * 0.6);
    K.lamp(A, A.W * 0.2, A.H * 0.6, 120, { v: 1 });
    K.envelope(A, A.W * 0.52, A.H * 0.76, 280, 170, -0.06, { seal: true, label: true });
    K.paper(A, A.W * 0.74, A.H * 0.78, 180, 120, 0.15, { typed: true, lines: 6, v: 0.75 });
    K.pen(A, A.W * 0.62, A.H * 0.88, 120, -0.3);
    K.glass(A, A.W * 0.86, A.H * 0.6, 50, 0.3);
  };
  P.courthouse_dawn = (A, K) => {
    K.sky(A, 0.05, 0.9, 0, A.H * 0.84);
    K.glow(A, A.W * 0.5, A.H * 0.84, 380, 0.9);
    K.courthouse(A, A.W * 0.5, A.H * 0.86, 460, { lit: false });
    K.ground(A, A.H * 0.86); K.stroke(A, [[0, A.H * 0.86], [A.W, A.H * 0.86]], 1.2, 0.8);
    K.figure(A, A.W * 0.5, A.H * 0.9, 70, 'woman');
    K.birds(A, A.W * 0.3, A.H * 0.2, 6, 6);
    K.tree(A, A.W * 0.1, A.H * 0.88, A.H * 0.6, { seed: 31, depth: 6 }); K.tree(A, A.W * 0.92, A.H * 0.88, A.H * 0.5, { seed: 32, depth: 6 });
  };

  /* ================= Level 5 · The Trial ================= */
  function courtWindow(A, K, x, w, v = 1) {
    K.litWindow(A, x, A.H * 0.04, w, A.H * 0.5, { cols: 3, rows: 4, arch: true, v, spill: 0.9 });
  }
  P.courtroom = (A, K) => {
    wall(A, K, 0.26);
    courtWindow(A, K, A.W * 0.4, A.W * 0.2);
    K.shaft(A, A.W * 0.5, A.H * 0.4, A.W * 0.45, A.H, 160, 360, 0.25);
    const d = A.d; d.fillStyle = K.INK;
    d.fillRect(A.W * 0.32, A.H * 0.5, A.W * 0.36, A.H * 0.5); K.stroke(A, [[A.W * 0.32, A.H * 0.5], [A.W * 0.68, A.H * 0.5]], 1.4, 0.9);
    K.figure(A, A.W * 0.5, A.H * 0.56, A.H * 0.3, 'judge', { rim: 0.7, flip: true });
    K.clock(A, A.W * 0.82, A.H * 0.16, 26);
    for (let i = 0; i < 9; i++) K.stroke(A, [[A.W * (0.34 + i * 0.04), A.H * 0.56], [A.W * (0.34 + i * 0.04), A.H]], 1, 0.22); // bench panelling
    // jury box with heads
    d.fillRect(0, A.H * 0.66, A.W * 0.26, A.H * 0.34); K.stroke(A, [[0, A.H * 0.66], [A.W * 0.26, A.H * 0.66]], 1.2, 0.8);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const hx = 20 + i * 38 + r * 18; const hy = A.H * (0.6 - r * 0.07); d.beginPath(); d.arc(hx, hy, 12, 0, Math.PI * 2); d.fill(); d.fillRect(hx - 16, hy + 8, 32, 30); }
    d.fillRect(A.W * 0.74, A.H * 0.68, A.W * 0.26, A.H * 0.32); K.stroke(A, [[A.W * 0.74, A.H * 0.68], [A.W, A.H * 0.68]], 1.2, 0.8);
    K.gavel(A, A.W * 0.58, A.H * 0.49, 60);
  };
  P.witness_stand = (A, K) => {
    wall(A, K, 0.26);
    courtWindow(A, K, A.W * 0.08, A.W * 0.18, 0.9);
    K.shaft(A, A.W * 0.17, A.H * 0.45, A.W * 0.55, A.H * 0.9, 120, 320, 0.3);
    K.glow(A, A.W * 0.6, A.H * 0.36, 230, 0.75);
    K.figure(A, A.W * 0.55, A.H * 0.84, A.H * 0.6, 'juror', { rim: 0.8, flip: true });
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.4, A.H * 0.62, A.W * 0.3, A.H * 0.38);
    K.stroke(A, [[A.W * 0.4, A.H * 0.62], [A.W * 0.7, A.H * 0.62]], 1.4, 0.9);
    for (let i = 1; i < 5; i++) K.stroke(A, [[A.W * (0.4 + i * 0.06), A.H * 0.66], [A.W * (0.4 + i * 0.06), A.H * 0.98]], 1, 0.3);
  };
  P.closing = (A, K) => {
    wall(A, K, 0.26);
    courtWindow(A, K, A.W * 0.62, A.W * 0.2);
    K.shaft(A, A.W * 0.72, A.H * 0.4, A.W * 0.45, A.H, 140, 300, 0.28);
    K.figure(A, A.W * 0.47, A.H * 0.98, A.H * 0.72, 'you', { rim: 0.85, flip: true, pose: 'point' });
    const d = A.d; d.fillStyle = K.INK;
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const hx = 30 + i * 46 + r * 22; const hy = A.H * (0.74 - r * 0.08); d.beginPath(); d.arc(hx, hy, 15, 0, Math.PI * 2); d.fill(); d.fillRect(hx - 20, hy + 10, 40, A.H); }
    K.stroke(A, [[0, A.H * 0.8], [A.W * 0.3, A.H * 0.8]], 1.2, 0.7);
  };
  P.m_expert = (A, K) => {
    wall(A, K, 0.04);
    K.glow(A, A.W * 0.5, A.H * 0.5, 420, 0.6);
    K.paper(A, A.W * 0.42, A.H * 0.55, 400, 300, -0.04, { lines: 9, v: 0.95 });
    K.paper(A, A.W * 0.7, A.H * 0.6, 260, 120, 0.08, { write: false, v: 0.85, after: (w, h) => { K.typed(A, -w * 0.4, -h * 0.3, w * 0.8, 2, 12); K.scribble(A, -w * 0.1, h * 0.15, w * 0.45, 1, 0, { amp: 5, w: 1.8 }); } });
    K.glow(A, A.W * 0.46, A.H * 0.64, 70, 0.7);
    K.magnifier(A, A.W * 0.46, A.H * 0.64, 70);
  };
  P.m_lettie = (A, K) => {
    P.witness_stand(A, K);
    A.d.clearRect(A.W * 0.4, A.H * 0.1, A.W * 0.3, A.H * 0.52);
    K.figure(A, A.W * 0.55, A.H * 0.84, A.H * 0.58, 'lettie', { rim: 0.8, flip: true, pose: 'hold' });
  };
  P.m_deeds = (A, K) => {
    wall(A, K, 0.04);
    K.glow(A, A.W * 0.5, A.H * 0.5, 460, 0.65);
    K.paper(A, A.W * 0.3, A.H * 0.55, 300, 400, -0.05, { title: 'DEED · 1964', typed: true, lines: 10, seal: true, after: (w, h) => K.scribble(A, -w * 0.38, h * 0.36, w * 0.5, 1, 0, { amp: 6, w: 2 }) });
    K.paper(A, A.W * 0.7, A.H * 0.55, 300, 400, 0.05, { title: 'HUBBARD LEDGER', typed: true, lines: 10, after: (w, h) => K.scribble(A, -w * 0.38, h * 0.36, w * 0.5, 1, 0, { amp: 6, w: 2 }) });
    K.stroke(A, [[A.W * 0.36, A.H * 0.84], [A.W * 0.64, A.H * 0.84]], 1.4, 0.9);
    K.stroke(A, [[A.W * 0.36, A.H * 0.84], [A.W * 0.38, A.H * 0.82]], 1.4, 0.9); K.stroke(A, [[A.W * 0.64, A.H * 0.84], [A.W * 0.62, A.H * 0.82]], 1.4, 0.9);
  };
  P.m_sheriff = (A, K) => {
    P.witness_stand(A, K);
    A.d.clearRect(A.W * 0.4, A.H * 0.1, A.W * 0.3, A.H * 0.52);
    K.figure(A, A.W * 0.55, A.H * 0.84, A.H * 0.6, 'ozzie', { rim: 0.8, flip: true, pose: 'hatInHands', spec: { hat: null } });
  };
  P.m_oldman = (A, K) => {
    wall(A, K, 0.26);
    courtWindow(A, K, A.W * 0.41, A.W * 0.18, 0.95);
    K.shaft(A, A.W * 0.5, A.H * 0.45, A.W * 0.5, A.H, 120, 380, 0.35);
    K.figure(A, A.W * 0.5, A.H * 0.94, A.H * 0.62, 'old', { rim: 0.8 });
    A.d.fillStyle = K.INK; A.d.fillRect(0, A.H * 0.94, A.W, A.H * 0.06);
  };
  P.m_counter = (A, K) => {
    wall(A, K, 0.26);
    courtWindow(A, K, A.W * 0.42, A.W * 0.16, 0.85);
    K.shaft(A, A.W * 0.5, A.H * 0.45, A.W * 0.5, A.H, 100, 300, 0.22);
    K.figure(A, A.W * 0.3, A.H * 0.98, A.H * 0.72, 'lanier', { rim: 0.8, pose: 'point' });
    K.figure(A, A.W * 0.7, A.H * 0.98, A.H * 0.74, 'you', { flip: true, rim: 0.8, pose: 'hold', prop: 'paper' });
    const R = A.R; for (let i = 0; i < 5; i++) K.paper(A, A.W * (0.42 + R() * 0.16), A.H * (0.25 + R() * 0.3), 50, 64, (R() - 0.5) * 1.6, { lines: 3, v: 0.8 });
  };
  P.m_law = (A, K) => {
    wall(A, K, 0.2);
    K.glow(A, A.W * 0.48, A.H * 0.4, 380, 0.7);
    K.lamp(A, A.W * 0.86, A.H * 0.66, 80);
    K.table(A, A.H * 0.66);
    const d = A.d; d.fillStyle = K.INK;
    for (let i = 0; i < 4; i++) { const w = 240 - i * 18; const y = A.H * 0.66 - (i + 1) * 30; d.fillRect(A.W * 0.32 - w / 2, y, w, 26); K.stroke(A, [[A.W * 0.32 - w / 2 + 6, y + 13], [A.W * 0.32 + w / 2 - 6, y + 13]], 1, 0.6); }
    K.scales(A, A.W * 0.6, A.H * 0.66, 220, 0);
  };
  P.m_truth = (A, K) => {
    K.sky(A, 0.02, 0.5, 0, A.H * 0.8);
    K.moon(A, A.W * 0.68, A.H * 0.3, 44, { halo: 6, haloV: 0.65 });
    K.hills(A, A.H * 0.84, 12, { rim: 0.6 });
    K.tree(A, A.W * 0.36, A.H * 0.85, A.H * 0.7, { seed: 11, rim: 0.6, lowBranch: (x0, y0, x1, y1) => {} });
    K.rope(A, A.W * 0.52, A.H * 0.44, A.H * 0.16, true);
  };
  P.m_wish = (A, K) => {
    wall(A, K, 0.03);
    K.candle(A, A.W * 0.22, A.H * 0.66, 80);
    K.table(A, A.H * 0.66);
    K.paper(A, A.W * 0.55, A.H * 0.62, 380, 440, -0.03, { lines: 9, v: 0.95, after: (w, h) => { A.t.fillStyle = K.g(1); K.text(A, 'Ask about the tree.', 0, h * 0.36, 24, { font: '"IM Fell English", Georgia, serif', weight: 400 }); K.stroke(A, [[-w * 0.36, h * 0.41], [w * 0.36, h * 0.41]], 1.2, 1, 'd'); } });
  };

  /* ================= Endings ================= */
  P.e_justice = (A, K) => {
    K.sky(A, 0.1, 1, 0, A.H * 0.8);
    K.glow(A, A.W * 0.5, A.H * 0.8, 520, 1);
    for (let i = 0; i < 12; i++) { const a = Math.PI + (i / 11) * Math.PI; K.stroke(A, [[A.W * 0.5 + Math.cos(a) * 120, A.H * 0.8 + Math.sin(a) * 120], [A.W * 0.5 + Math.cos(a) * 700, A.H * 0.8 + Math.sin(a) * 700]], 1.2, 0.25, 'd'); }
    K.hills(A, A.H * 0.82, 10);
    K.tree(A, A.W * 0.5, A.H * 0.84, A.H * 0.62, { seed: 11, rim: 0.5 });
    K.figure(A, A.W * 0.62, A.H * 0.86, 64, 'woman');
  };
  P.e_stands = (A, K) => {
    wall(A, K, 0.04);
    K.glow(A, A.W * 0.5, A.H * 0.45, 480, 0.7);
    K.paper(A, A.W * 0.5, A.H * 0.55, 380, 460, 0.02, { title: 'LAST WILL', lines: 10, seal: true, after: (w, h) => { A.d.save(); A.d.strokeStyle = K.INK; A.d.lineWidth = 4; A.d.translate(-w * 0.1, h * 0.12); A.d.rotate(-0.2); A.d.strokeRect(-90, -26, 180, 52); A.d.restore(); K.text(A, 'UPHELD', -w * 0.1, h * 0.12, 28, { rot: -0.2 }); } });
  };
  P.e_hung = (A, K) => {
    wall(A, K, 0.26);
    courtWindow(A, K, A.W * 0.42, A.W * 0.16, 0.8);
    K.shaft(A, A.W * 0.5, A.H * 0.45, A.W * 0.5, A.H, 100, 420, 0.3);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = A.W * (0.12 + i * 0.15) + r * 20; K.chair(A, x, A.H * (0.98 - r * 0.16), 120 - r * 20, i >= 3); }
  };
  P.e_fails = (A, K) => {
    wall(A, K, 0.03);
    K.litWindow(A, A.W * 0.34, A.H * 0.04, A.W * 0.32, A.H * 0.46, { cols: 2, rows: 3, v: 0.4, inside: () => K.rain(A, 90, 0.5) });
    K.shaft(A, A.W * 0.5, A.H * 0.5, A.W * 0.5, A.H, 160, 400, 0.2);
    K.ground(A, A.H * 0.62);
    K.paper(A, A.W * 0.42, A.H * 0.8, 200, 160, -0.3, { lines: 5, v: 0.75 });
    K.paper(A, A.W * 0.6, A.H * 0.84, 180, 150, 0.4, { lines: 5, v: 0.7 });
    K.stroke(A, [[A.W * 0.5, A.H * 0.74], [A.W * 0.52, A.H * 0.8], [A.W * 0.5, A.H * 0.86], [A.W * 0.53, A.H * 0.92]], 1.4, 0.9);
  };
  P.e_deal = (A, K) => {
    wall(A, K, 0.1);
    K.glow(A, A.W * 0.55, A.H * 0.3, 380, 0.85);
    K.lamp(A, A.W * 0.14, A.H * 0.62, 100, { v: 1 });
    // two shadows shaking hands on the wall
    K.figure(A, A.W * 0.43, A.H * 0.62, A.H * 0.5, 'you', { pose: 'hold', rim: 0 });
    K.figure(A, A.W * 0.67, A.H * 0.62, A.H * 0.5, 'lanier', { flip: true, pose: 'hold', rim: 0 });
    K.table(A, A.H * 0.62);
    K.envelope(A, A.W * 0.55, A.H * 0.8, 240, 140, 0.05, { seal: false, label: true });
    K.pen(A, A.W * 0.72, A.H * 0.86, 110, -0.2);
  };
  P.e_runout = (A, K) => {
    K.sky(A, 0.0, 0.12, 0, A.H * 0.62);
    for (let i = 0; i < 14; i++) { const x = A.W * (0.3 + A.R() * 0.4); A.t.fillStyle = K.g(0.9); A.t.fillRect(x, A.H * 0.6 - A.R() * 14, 3, 3); }
    K.courthouse(A, A.W * 0.5, A.H * 0.62, 90, { litV: 0.5 });
    A.t.fillStyle = K.g(0.06); A.t.fillRect(0, A.H * 0.62, A.W, A.H * 0.38);
    K.stroke(A, [[0, A.H * 0.62], [A.W, A.H * 0.62]], 1, 0.5);
    // road receding, car leaving with tail lights
    K.stroke(A, [[A.W * 0.47, A.H * 0.62], [A.W * 0.1, A.H]], 1.4, 0.6); K.stroke(A, [[A.W * 0.53, A.H * 0.62], [A.W * 0.9, A.H]], 1.4, 0.6);
    for (let i = 0; i < 6; i++) { const t = i / 6; K.stroke(A, [[A.W * 0.5, A.H * (0.64 + t * 0.36)], [A.W * 0.5, A.H * (0.66 + t * 0.36 + 0.02)]], 2 + t * 4, 0.7); }
    K.glow(A, A.W * 0.5, A.H * 0.86, 260, 0.45);
    K.car(A, A.W * 0.5, A.H * 0.9, 300, { tail: true });
    A.l.fillStyle = K.LAMP; A.l.fillRect(A.W * 0.5 + 150 - 10, A.H * 0.9 - 300 * 0.18, 8, 6); A.l.fillRect(A.W * 0.5 - 150 + 2, A.H * 0.9 - 300 * 0.18, 8, 6);
  };

  /* ================= Character portraits (360×480): each a silhouette in a lit window ================= */
  // window-free busts: each sitter keeps one small prop of their own in the halo
  P.pt_seth = (A, K) => K.portrait(A, 'seth', { backdrop: (x, y, w, h) => { K.hills(A, y + h * 0.86, 6); K.tree(A, x + w * 0.82, y + h * 0.88, h * 0.5, { seed: 11, depth: 6, rim: 0.4 }); } });
  P.pt_lettie = (A, K) => K.portrait(A, 'lettie', { fig: { flip: true }, extra: () => K.cup(A, A.W * 0.22, A.H * 0.98, 34, true) });
  P.pt_ozzie = (A, K) => K.portrait(A, 'ozzie', { scale: 1.68 });
  P.pt_harry = (A, K) => K.portrait(A, 'harry', { fig: { flip: true }, extra: () => { K.bottle(A, A.W * 0.86, A.H * 0.98, 80); K.glass(A, A.W * 0.76, A.H * 0.98, 30, 0.4); } });
  P.pt_lanier = (A, K) => K.portrait(A, 'lanier', {});
  P.pt_children = (A, K) => K.portrait(A, 'son', { fx: 0.33, scale: 1.6, extra: () => K.figure(A, A.W * 0.7, A.H * 1.8, A.H * 1.5, 'daughter', { flip: true, rim: 0.85 }) });
  P.pt_son = (A, K) => K.portrait(A, 'son', { scale: 1.8, fig: { flip: true } });
  P.pt_reed = (A, K) => K.portrait(A, 'reed', { fig: { flip: true }, backdrop: (x, y, w, h) => { for (let i = 0; i < 4; i++) { A.d.fillStyle = K.INK; A.d.beginPath(); A.d.arc(x + 30 + i * 30, y + h - 24, 18, 0, Math.PI * 2); A.d.fill(); } } });
})();
