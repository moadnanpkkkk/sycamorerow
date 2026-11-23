/* Sycamore Row — scene illustrations. Lamplit Southern Gothic: one bone-white light
 * source per scene, dithered; everything else a crisp black silhouette. */
(function () {
  'use strict';
  const SR = window.SR;
  const P = SR.Art.painters;

  /* ---------------- shared compositions ---------------- */
  function interiorWall(A, K, v = 0.12) { K.fillTone(A, v); K.wallpaper(A, v); K.vignette(A, 0.7); }
  function nightSky(A, K, horizon = 0.75) { K.sky(A, 0.02, 0.22, 0, A.H * horizon); }

  /* ---------------- Level 1 · The Sycamore ---------------- */
  P.tree_dusk = (A, K) => {
    K.sky(A, 0.0, 0.5, 0, A.H * 0.8);
    K.glow(A, A.W * 0.62, A.H * 0.82, 420, 0.75);
    K.moon(A, A.W * 0.74, A.H * 0.4, 34, { halo: 6, haloV: 0.5 });
    K.fog(A, A.H * 0.76, 110, 0.25);
    K.hills(A, A.H * 0.82, 14, { phase: 0.4, rim: 0.6 });
    K.tree(A, A.W * 0.34, A.H * 0.83, A.H * 0.62, { seed: 11, rim: 0.55, spread: 0.62 });
    const lx = A.W * 0.37; const base = A.H * 0.83; const top = A.H * 0.6; // ladder against the trunk
    K.stroke(A, [[lx, base], [lx - 18, top]], 3, 1, 'd'); K.stroke(A, [[lx + 16, base], [lx - 2, top]], 3, 1, 'd');
    for (let i = 1; i < 7; i++) { const t = i / 7; K.stroke(A, [[lx - 18 * t, base - (base - top) * t], [lx + 16 - 18 * t, base - (base - top) * t]], 2, 1, 'd'); }
    K.fence(A, A.W * 0.6, A.W, A.H * 0.85, 24);
    K.birds(A, A.W * 0.6, A.H * 0.3, 5, 7);
  };

  P.the_will = (A, K) => {
    interiorWall(A, K, 0.06);
    K.litWindow(A, A.W * 0.6, A.H * 0.08, A.W * 0.26, A.H * 0.5, { cols: 2, rows: 3, v: 0.55, arch: true, spill: 0.9, inside: (x, y, w, h) => K.tree(A, x + w * 0.6, y + h, h * 0.8, { seed: 11, depth: 6 }) });
    K.pictureFrame(A, A.W * 0.3, A.H * 0.16, 90, 116, (x, y, w, h) => K.figure(A, x + w / 2, y + h * 1.25, h * 1.3, 'seth', { rim: 0.3 }));
    K.clock(A, A.W * 0.08, A.H * 0.2, 30);
    K.table(A, A.H * 0.66);
    K.lamp(A, A.W * 0.2, A.H * 0.66, 120, { v: 1 });
    K.paper(A, A.W * 0.5, A.H * 0.78, 300, 190, -0.05, { lines: 7, title: 'LAST WILL', v: 1 });
    K.paper(A, A.W * 0.66, A.H * 0.8, 200, 150, 0.12, { lines: 6, v: 0.7 });
    K.pen(A, A.W * 0.74, A.H * 0.72, 110, 0.5);
  };

  P.clanton_night = (A, K) => {
    nightSky(A, K, 0.8);
    K.moon(A, A.W * 0.18, A.H * 0.2, 30, { halo: 6 });
    K.building(A, 0, A.H * 0.86, 170, 150, { lit: 0.35, roof: 'flat' });
    K.building(A, 170, A.H * 0.86, 120, 190, { lit: 0.2, roof: 'gable' });
    K.building(A, A.W - 290, A.H * 0.86, 150, 170, { lit: 0.3, roof: 'flat' });
    K.building(A, A.W - 140, A.H * 0.86, 140, 130, { lit: 0.4 });
    K.courthouse(A, A.W * 0.5, A.H * 0.86, 420);
    K.ground(A, A.H * 0.86);
    K.streetlamp(A, A.W * 0.24, A.H * 0.86, 110);
    K.streetlamp(A, A.W * 0.78, A.H * 0.86, 110);
    K.stroke(A, [[0, A.H * 0.86], [A.W, A.H * 0.86]], 1.2, 0.7);
  };

  P.crossroads = (A, K) => {
    K.sky(A, 0.04, 0.7, 0, A.H * 0.62);
    K.glow(A, A.W * 0.5, A.H * 0.62, 340, 0.6);
    A.t.fillStyle = K.g(0.1); A.t.fillRect(0, A.H * 0.62, A.W, A.H * 0.38); // dusty fields catch the dawn
    K.glow(A, A.W * 0.5, A.H * 0.7, 260, 0.45);
    // three roads converging toward horizon
    const hz = A.H * 0.62; const cx = A.W * 0.5;
    K.stroke(A, [[cx, hz], [A.W * 0.1, A.H]], 1.4, 0.6); K.stroke(A, [[cx, hz], [A.W * 0.9, A.H]], 1.4, 0.6);
    K.stroke(A, [[cx - 6, hz], [A.W * 0.4, A.H]], 1, 0.35); K.stroke(A, [[cx + 6, hz], [A.W * 0.6, A.H]], 1, 0.35);
    // distant landmarks
    K.building(A, A.W * 0.12, hz + 2, 70, 48, { lit: 1, roof: 'gable', ww: 10, wh: 12 });
    K.courthouse(A, A.W * 0.52, hz + 2, 110, { litV: 0.5 });
    K.tree(A, A.W * 0.86, hz + 2, 150, { seed: 3, depth: 6 });
    // signpost
    const px = A.W * 0.5; const base = A.H * 0.97;
    A.d.fillStyle = K.INK; A.d.fillRect(px - 6, base - 300, 12, 300);
    [[-1, 0.86, -0.08], [1, 0.76, 0.06], [-1, 0.66, 0.05]].forEach(([dir, yy, rot]) => {
      K.withT(A, px, base - 300 * yy, rot, 1, () => {
        A.d.beginPath(); const w = 150; A.d.moveTo(0, -16); A.d.lineTo(dir * w, -16); A.d.lineTo(dir * (w + 18), 0); A.d.lineTo(dir * w, 16); A.d.lineTo(0, 16); A.d.fill();
        K.stroke(A, [[dir * 12, -16], [dir * w, -16], [dir * (w + 18), 0]], 1.2, 0.9);
        K.typed(A, dir > 0 ? 18 : -w + 8, -2, w - 30, 1, 0, 'l');
      });
    });
  };

  P.lettie_door = (A, K) => {
    K.fillTone(A, 0.05);
    K.glow(A, A.W * 0.5, A.H * 0.06, 260, 0.5); // porch bulb
    // screen door lit from inside
    const x = A.W * 0.36; const w = A.W * 0.28; const top = A.H * 0.16; const base = A.H * 0.9;
    K.litWindow(A, x, top, w, base - top, { cols: 1, rows: 3, v: 0.95, spill: 0.7, mw: 10 });
    // mesh texture
    for (let yy = top; yy < base; yy += 5) K.stroke(A, [[x, yy], [x + w, yy]], 0.6, 0.18, 'd');
    K.figure(A, x + w * 0.55, base - 4, (base - top) * 0.82, 'woman', { flip: true });
    // photograph on the wall behind her
    A.t.fillStyle = K.g(0.7); A.t.fillRect(x + w * 0.1, top + 40, 50, 64);
    A.d.clearRect(x + w * 0.1, top + 40, 50, 64);
    K.figure(A, x + w * 0.1 + 25, top + 104, 58, 'hat');
    K.stroke(A, [[x + w * 0.1, top + 40], [x + w * 0.1 + 50, top + 40], [x + w * 0.1 + 50, top + 104], [x + w * 0.1, top + 104], [x + w * 0.1, top + 40]], 2, 1, 'd');
    // porch posts and steps
    A.d.fillStyle = K.INK; A.d.fillRect(A.W * 0.1, 0, 26, A.H); A.d.fillRect(A.W * 0.86, 0, 26, A.H);
    A.d.fillRect(0, base, A.W, A.H - base); K.stroke(A, [[0, base], [A.W, base]], 1.4, 0.8);
    K.stroke(A, [[0, base + 28], [A.W, base + 28]], 1, 0.4);
    K.rocker(A, A.W * 0.78, base, 120);
  };

  P.seth_drawer = (A, K) => {
    interiorWall(A, K, 0.04);
    K.lamp(A, A.W * 0.82, A.H * 0.5, 110);
    K.table(A, A.H * 0.5, { edge: 0.6 });
    // open drawer: lit interior
    const x = A.W * 0.14; const y = A.H * 0.58; const w = A.W * 0.6; const h = A.H * 0.34;
    A.t.fillStyle = K.g(0.25); A.t.fillRect(x, y, w, h); A.d.clearRect(x, y, w, h);
    K.paper(A, x + w * 0.42, y + h * 0.5, 280, 160, -0.04, { typed: true, lines: 8, v: 0.9 });
    K.paper(A, x + w * 0.58, y + h * 0.55, 230, 150, 0.08, { lines: 5, v: 1, after: (pw, ph) => K.text(A, '1964', pw * 0.18, ph * 0.22, 34, { font: '"IM Fell English", Georgia, serif', weight: 400, rot: -0.08 }) });
    A.d.fillStyle = K.INK; A.d.fillRect(x - 14, y - 6, w + 28, 12); A.d.fillRect(x - 14, y, 14, h); A.d.fillRect(x + w, y, 14, h);
    K.stroke(A, [[x - 14, y - 6], [x + w + 14, y - 6]], 1.4, 0.8);
    A.l.fillStyle = K.LAMP; A.l.fillRect(x + w / 2 - 22, y - 2, 44, 4);
  };

  P.scarred_tree = (A, K) => {
    K.sky(A, 0.15, 0.75, 0, A.H);
    K.moon(A, A.W * 0.8, A.H * 0.3, 52, { halo: 5, haloV: 0.6 });
    K.fog(A, A.H * 0.75, 200, 0.25);
    const d = A.d; d.fillStyle = K.INK;
    // massive trunk
    d.beginPath(); d.moveTo(A.W * 0.04, A.H); d.quadraticCurveTo(A.W * 0.14, A.H * 0.5, A.W * 0.08, 0); d.lineTo(A.W * 0.3, 0);
    d.quadraticCurveTo(A.W * 0.24, A.H * 0.5, A.W * 0.34, A.H); d.fill();
    // low branch reaching across
    d.beginPath(); d.moveTo(A.W * 0.22, A.H * 0.38); d.quadraticCurveTo(A.W * 0.55, A.H * 0.3, A.W * 1.02, A.H * 0.36);
    d.lineTo(A.W * 1.02, A.H * 0.43); d.quadraticCurveTo(A.W * 0.55, A.H * 0.4, A.W * 0.24, A.H * 0.5); d.fill();
    // bark mottling (sycamore patches) as rim strokes
    for (let i = 0; i < 26; i++) { const yy = A.R() * A.H; const xx = A.W * (0.2 + A.R() * 0.06); K.stroke(A, [[xx, yy], [xx + 6, yy + 18]], 1.2, 0.35); }
    K.stroke(A, [[A.W * 0.24, A.H * 0.385], [A.W * 0.55, A.H * 0.325], [A.W, A.H * 0.36]], 1.3, 0.75);
    // the rope scar: a worn groove ringing the branch
    const sx = A.W * 0.6;
    for (let k = 0; k < 3; k++) K.stroke(A, [[sx + k * 7, A.H * 0.33], [sx + k * 7 + 5, A.H * 0.42]], 1.6, 0.95);
    K.glow(A, sx + 7, A.H * 0.37, 36, 0.45);
    K.hills(A, A.H * 0.93, 8, { rim: 0.5 });
  };

  /* ---------------- main menu: the sycamore through the great window (600×840) ---------------- */
  P.hero = (A, K) => {
    K.sky(A, 0.04, 0.62, 0, A.H * 0.8);
    K.moon(A, A.W * 0.5, A.H * 0.22, 46, { halo: 6, haloV: 0.75 });
    K.fog(A, A.H * 0.74, 160, 0.35);
    K.hills(A, A.H * 0.82, 12, { rim: 0.65 });
    K.tree(A, A.W * 0.5, A.H * 0.84, A.H * 0.64, { seed: 11, rim: 0.6, spread: 0.6 });
    K.fence(A, 0, A.W * 0.3, A.H * 0.86, 22);
    K.birds(A, A.W * 0.7, A.H * 0.36, 4, 6);
  };

  /* ---------------- fallback ---------------- */
  P.fallback = (A, K) => { K.sky(A, 0.02, 0.4); K.tree(A, A.W * 0.5, A.H * 0.9, A.H * 0.8, { seed: 5, rim: 0.4 }); K.hills(A, A.H * 0.9, 8); };
})();
