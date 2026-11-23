/* Sycamore Row — the people of Clanton, as detailed black silhouettes with lamplit rim light.
 * Each recurring character has a fixed silhouette so they read the same in every scene. */
(function () {
  'use strict';
  const SR = window.SR;
  const K = SR.ArtKit;
  const INK = K.INK; const LAMP = K.LAMP;

  // body specs: build, sex, hair, hat, coat, pose, props
  const CAST = {
    you: { build: 'avg', hair: 'short', coat: 'suit', tie: true },
    seth: { build: 'slim', hair: 'wisps', hat: 'fedora', coat: 'long', tall: 1.04 },
    lettie: { build: 'f', hair: 'bun', coat: 'dress', apron: true },
    ozzie: { build: 'broad', hair: 'short', hat: 'stetson', coat: 'uniform', badge: true, tall: 1.05 },
    harry: { build: 'stout', hair: 'bald', coat: 'suit', tie: true, cigar: true },
    lanier: { build: 'slim', hair: 'slick', coat: 'suit', tie: true, pocket: true, briefcase: true },
    son: { build: 'avg', hair: 'short', coat: 'shirt' },
    daughter: { build: 'f', hair: 'curls', coat: 'dress' },
    reed: { build: 'slim', hair: 'wisps', hat: 'cap', coat: 'long', pose: 'cane', hunch: 0.07, tall: 0.94 },
    farmer: { build: 'avg', hair: 'short', hat: 'fedora', coat: 'shirt', braces: true },
    clerk: { build: 'f', hair: 'bun', coat: 'dress', glasses: true },
    juror: { build: 'avg', hair: 'short', coat: 'shirt' },
    judge: { build: 'broad', hair: 'bald', coat: 'long', glasses: true },
  };
  // legacy type names used by scene painters
  const ALIAS = { man: 'you', hat: 'farmer', sheriff: 'ozzie', woman: 'lettie', old: 'reed', stout: 'harry', lawyer: 'lanier', boy: 'son' };
  const DIMS = {
    slim: { sw: 0.1, hw: 0.068, lw: 0.042 }, avg: { sw: 0.115, hw: 0.078, lw: 0.046 }, broad: { sw: 0.13, hw: 0.085, lw: 0.05 },
    stout: { sw: 0.135, hw: 0.115, lw: 0.056 }, f: { sw: 0.096, hw: 0.084, lw: 0.036 },
  };

  K.figure = function (A, x, y, h, type = 'you', opts = {}) {
    const spec = Object.assign({}, CAST[ALIAS[type] || type] || CAST.you, opts.spec || {});
    const D = DIMS[spec.build] || DIMS.avg; const fem = spec.build === 'f';
    const f = opts.flip ? -1 : 1; const s = h * (spec.tall || 1);
    const pose = opts.pose || spec.pose || 'stand';
    const hunch = (spec.hunch || 0) + (opts.lean || 0);
    const rim = opts.rim == null ? 0.55 : opts.rim;
    const d = A.d; const l = A.l;
    const P = (px, py) => [x + px * s * f, y - py * s];
    // upper-body offset for hunching/leaning (applies above the waist)
    const U = (px, py) => { const k = SR.clamp((py - 0.5) / 0.45, 0, 1); return P(px + hunch * k, py - Math.abs(hunch) * 0.35 * k); };
    const path = (ctx, pts, close = true) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); if (close) ctx.closePath(); };
    const curve = (ctx, segs) => { ctx.beginPath(); ctx.moveTo(...segs[0]); for (let i = 1; i < segs.length; i++) { const sg = segs[i]; if (sg.length === 4) ctx.bezierCurveTo(...sg[0], ...sg[1], ...sg[2]); else if (sg.length === 3) ctx.quadraticCurveTo(...sg[0], ...sg[1]); else ctx.lineTo(...sg[0]); } };
    const rimLine = (pts, a = 1, w = 1.3) => { if (!rim) return; l.save(); l.strokeStyle = LAMP; l.globalAlpha = rim * a; l.lineWidth = w; l.lineCap = 'round'; l.lineJoin = 'round'; path(l, pts, false); l.stroke(); l.restore(); };
    const dot = (p, r, a = 1) => { l.save(); l.fillStyle = LAMP; l.globalAlpha = Math.min(1, rim * 1.4) * a; l.beginPath(); l.arc(p[0], p[1], r, 0, Math.PI * 2); l.fill(); l.restore(); };
    d.save(); d.fillStyle = INK; d.strokeStyle = INK; d.lineCap = 'round'; d.lineJoin = 'round';

    /* ---- legs & shoes ---- */
    const legTop = fem ? 0.22 : 0.47; const stride = pose === 'walk' ? 0.05 : 0.012;
    const legW = fem ? 0.02 : D.lw;
    for (const side of [-1, 1]) {
      const hx = side * D.hw * 0.52; const ax = side * stride + (fem ? side * 0.012 : 0);
      path(d, [P(hx - legW, legTop), P(hx + legW, legTop), P(ax + 0.022, 0.035), P(ax - 0.022, 0.035)]); d.fill();
      d.beginPath(); d.ellipse(...P(ax + 0.016, 0.018), 0.038 * s, 0.017 * s, 0, 0, Math.PI * 2); d.fill();
    }
    if (!fem) rimLine([P(D.hw * 0.52 + legW, legTop), P(stride + 0.022, 0.04)], 0.7);

    /* ---- torso / coat / dress ---- */
    const sw = D.sw; const hw = D.hw;
    const torso = [U(-hw, 0.46), U(-hw * 1.04, 0.6), U(-sw * 1.02, 0.74), U(-sw, 0.79), U(-sw * 0.55, 0.828), U(-0.032, 0.835), U(0.032, 0.835), U(sw * 0.55, 0.828), U(sw, 0.79), U(sw * 1.02, 0.74), U(hw * 1.04, 0.6), U(hw, 0.46)];
    path(d, torso); d.fill();
    if (spec.build === 'stout') { d.beginPath(); d.ellipse(...U(hw * 0.35, 0.57), 0.12 * s, 0.12 * s, 0, 0, Math.PI * 2); d.fill(); }
    if (spec.coat === 'long' || spec.coat === 'suit') { // jacket skirt over the hips
      const bot = spec.coat === 'long' ? 0.2 : 0.39;
      path(d, [U(-hw * 1.05, 0.5), U(hw * 1.05, 0.5), P(hw * 1.2, bot), P(-hw * 1.2, bot)]); d.fill();
      rimLine([P(hw * 1.2, bot), P(-hw * 0.2, bot)], 0.5, 1);
    }
    if (fem) { // dress: fitted bodice, flared skirt
      curve(d, [U(-hw * 0.95, 0.6), [P(-hw * 1.4, 0.4), P(-0.13, 0.21)], [P(0, 0.18), P(0.13, 0.21)], [P(hw * 1.4, 0.4), U(hw * 0.95, 0.6)]]); d.closePath(); d.fill();
      rimLine([U(hw * 0.95, 0.6), P(hw * 1.38, 0.4), P(0.13, 0.215)], 0.85);
      rimLine([U(-hw * 0.9, 0.6), U(hw * 0.9, 0.6)], 0.55, 1); // waistline
      rimLine([P(0.03, 0.55), P(0.05, 0.25)], 0.3, 1); rimLine([P(-0.05, 0.5), P(-0.07, 0.24)], 0.25, 1); // folds
      if (spec.apron) { rimLine([U(-hw * 0.7, 0.6), P(-hw * 0.95, 0.3), P(hw * 0.95, 0.3), U(hw * 0.7, 0.6)], 0.6, 1); }
    }
    // front edge rim (chest to waist)
    rimLine([U(sw * 0.55, 0.828), U(sw, 0.79), U(sw * 1.02, 0.74), U(hw * 1.04, 0.6), U(hw, 0.47)], 1);
    // tailoring details
    if (spec.coat === 'suit' || spec.coat === 'long') {
      rimLine([U(-0.028, 0.832), U(0.012, 0.66), U(0.034, 0.832)], 0.75, 1.1); // lapels
      rimLine([U(0.012, 0.66), U(0.02, 0.44)], 0.45, 1);
      dot(U(0.024, 0.6), 0.006 * s, 0.9); dot(U(0.026, 0.53), 0.006 * s, 0.9);
      if (spec.tie) rimLine([U(0.004, 0.83), U(0.008, 0.69)], 0.9, 1.6);
      if (spec.pocket) rimLine([U(sw * 0.45, 0.74), U(sw * 0.75, 0.745)], 1, 2);
    }
    if (spec.coat === 'uniform') {
      rimLine([U(-hw, 0.5), U(hw, 0.5)], 0.7, 2); // belt
      dot(U(hw * 0.2, 0.5), 0.01 * s); // buckle
      path(d, [U(hw * 0.9, 0.5), U(hw * 1.3, 0.49), U(hw * 1.3, 0.42), U(hw * 0.9, 0.43)]); d.fill(); // holster
      rimLine([U(-0.03, 0.832), U(0, 0.8), U(0.03, 0.832)], 0.8, 1.1); // collar
      rimLine([U(sw * 0.2, 0.74), U(sw * 0.7, 0.74)], 0.5, 1); // pocket flap
    }
    if (spec.coat === 'shirt') { rimLine([U(-0.026, 0.832), U(0, 0.8), U(0.026, 0.832)], 0.8, 1); rimLine([U(0, 0.8), U(0, 0.5)], 0.35, 1); }
    if (spec.braces) { rimLine([U(-sw * 0.5, 0.82), U(-hw * 0.4, 0.47)], 0.7, 1.2); rimLine([U(sw * 0.5, 0.82), U(hw * 0.4, 0.47)], 0.7, 1.2); }
    if (spec.badge) { l.save(); l.fillStyle = LAMP; K.star(l, ...U(sw * 0.5, 0.72), 0.022 * s, 0.009 * s, 5); l.restore(); }

    /* ---- arms ---- */
    const arm = (pts, w1, w2) => {
      d.lineWidth = w1 * s; d.beginPath(); d.moveTo(...pts[0]); d.lineTo(...pts[1]); d.stroke();
      d.lineWidth = w2 * s; d.beginPath(); d.moveTo(...pts[1]); d.lineTo(...pts[2]); d.stroke();
      d.beginPath(); d.ellipse(pts[2][0], pts[2][1], 0.019 * s, 0.022 * s, 0, 0, Math.PI * 2); d.fill();
    };
    const aw = fem ? 0.034 : spec.build === 'stout' ? 0.05 : 0.044;
    arm([U(-sw * 0.82, 0.775), U(-sw * 1.12, 0.6), P(-sw * 1.02, 0.44)], aw, aw * 0.82);
    let hand;
    if (pose === 'hold') { const e = U(sw * 1.02, 0.6); hand = U(sw * 1.02 + 0.11, 0.63); arm([U(sw * 0.82, 0.775), e, hand], aw, aw * 0.82); rimLine([U(sw * 1.1, 0.77), e, hand], 0.8); }
    else if (pose === 'point') { const e = U(sw * 1.3, 0.69); hand = U(sw * 1.3 + 0.16, 0.77); arm([U(sw * 0.82, 0.775), e, hand], aw, aw * 0.82); rimLine([U(sw * 1.05, 0.8), e, hand], 0.9); }
    else if (pose === 'cane') { const e = U(sw * 1.15, 0.58); hand = P(sw * 1.15 + hunch + 0.05, 0.47); arm([U(sw * 0.82, 0.775), e, hand], aw, aw * 0.82); d.lineWidth = 0.014 * s; d.beginPath(); d.moveTo(...hand); d.lineTo(...P(sw * 1.15 + hunch + 0.09, 0)); d.stroke(); d.beginPath(); d.arc(hand[0] - 0.02 * s * f, hand[1], 0.022 * s, Math.PI, 0, f < 0); d.stroke(); rimLine([hand, P(sw * 1.15 + hunch + 0.095, 0.01)], 0.6, 1); }
    else if (pose === 'hatInHands') { hand = U(sw * 0.4, 0.55); arm([U(sw * 0.82, 0.775), U(sw * 1.05, 0.62), hand], aw, aw * 0.82); d.beginPath(); d.ellipse(hand[0], hand[1] + 0.01 * s, 0.09 * s, 0.03 * s, 0.2 * f, 0, Math.PI * 2); d.fill(); rimLine([P(sw * 0.4 - 0.09, 0.53), P(sw * 0.4 + 0.09, 0.56)], 0.7); }
    else { const e = U(sw * 1.1, 0.6); hand = P(sw * 1.0 + hunch * 0.3, 0.44); arm([U(sw * 0.82, 0.775), e, hand], aw, aw * 0.82); rimLine([U(sw * 1.08, 0.76), e, hand], 0.7); }
    if (spec.briefcase && pose !== 'hold') { const [bx, by] = P(-sw * 1.02, 0.44); d.fillRect(bx - 0.055 * s, by + 0.01 * s, 0.11 * s, 0.08 * s); rimLine([[bx - 0.055 * s, by + 0.012 * s], [bx + 0.055 * s, by + 0.012 * s]], 0.6, 1); }
    if (opts.prop === 'cup' && hand) { d.fillRect(hand[0] - 0.012 * s * f, hand[1] - 0.05 * s, 0.035 * s * f, 0.045 * s); }
    if (opts.prop === 'paper' && hand) { l.save(); l.fillStyle = LAMP; l.globalAlpha = 0.95; l.translate(hand[0], hand[1]); l.rotate(-0.2 * f); l.fillRect(-0.02 * s, -0.09 * s, 0.07 * s * f, 0.09 * s); l.restore(); }

    /* ---- neck & head (profile facing f) ---- */
    path(d, [U(-0.026, 0.83), U(0.026, 0.83), U(0.024, 0.865), U(-0.03, 0.865)]); d.fill();
    const head = [U(-0.03, 0.85), U(-0.058, 0.875), U(-0.062, 0.91), U(-0.05, 0.945), U(-0.022, 0.966), U(0.012, 0.968), U(0.04, 0.952), U(0.05, 0.93), U(0.052, 0.913), U(0.066, 0.896), U(0.062, 0.89), U(0.05, 0.887), U(0.054, 0.877), U(0.048, 0.871), U(0.051, 0.862), U(0.046, 0.853), U(0.03, 0.848), U(0.02, 0.84)];
    if (spec.build === 'stout') { head.splice(15, 0, U(0.05, 0.846), U(0.04, 0.838)); }
    d.beginPath(); head.forEach((p, i) => (i ? d.lineTo(...p) : d.moveTo(...p))); d.closePath(); d.fill();
    rimLine([U(0.04, 0.952), U(0.05, 0.93), U(0.052, 0.913), U(0.066, 0.896), U(0.062, 0.89), U(0.05, 0.887), U(0.054, 0.877), U(0.048, 0.871), U(0.051, 0.862), U(0.046, 0.853), U(0.03, 0.848)], 1, 1.25);
    if (spec.glasses) rimLine([U(0.03, 0.912), U(0.05, 0.912)], 1, 1.2);

    /* ---- hair ---- */
    const hairCap = (front = 0.035) => { path(d, [U(front, 0.952), U(0.01, 0.975), U(-0.03, 0.972), U(-0.06, 0.94), U(-0.066, 0.9), U(-0.05, 0.89), U(-0.04, 0.93), U(-0.01, 0.95)]); d.fill(); };
    if (spec.hair === 'short' && !spec.hat) { hairCap(); rimLine([U(0.035, 0.952), U(0.01, 0.975), U(-0.03, 0.972)], 0.6, 1); }
    if (spec.hair === 'slick') { hairCap(0.045); d.beginPath(); d.ellipse(...U(0.03, 0.966), 0.022 * s, 0.01 * s, -0.3 * f, 0, Math.PI * 2); d.fill(); rimLine([U(0.05, 0.962), U(0.02, 0.976), U(-0.03, 0.972), U(-0.058, 0.945)], 0.85, 1.1); rimLine([U(0.0, 0.965), U(-0.04, 0.95)], 0.5, 0.8); }
    if (spec.hair === 'bun') { hairCap(0.03); d.beginPath(); d.arc(...U(-0.072, 0.93), 0.03 * s, 0, Math.PI * 2); d.fill(); rimLine([U(0.03, 0.952), U(-0.01, 0.973), U(-0.05, 0.96)], 0.6, 1); }
    if (spec.hair === 'curls') { for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.13); d.beginPath(); d.arc(...U(-0.012 + Math.cos(a) * -0.05, 0.92 + Math.sin(a) * 0.045), 0.022 * s, 0, Math.PI * 2); d.fill(); } }
    if (spec.hair === 'bald') { path(d, [U(-0.064, 0.9), U(-0.06, 0.93), U(-0.045, 0.925), U(-0.05, 0.89)]); d.fill(); rimLine([U(0.04, 0.952), U(0.012, 0.968), U(-0.022, 0.966)], 0.7, 1); }
    if (spec.hair === 'wisps' && !spec.hat) rimLine([U(-0.02, 0.968), U(0.0, 0.985), U(0.02, 0.97)], 0.7, 1);

    /* ---- hats ---- */
    if (spec.hat === 'fedora') {
      d.beginPath(); d.ellipse(...U(0.0, 0.958), 0.105 * s, 0.017 * s, 0.05 * f, 0, Math.PI * 2); d.fill();
      path(d, [U(-0.055, 0.958), U(-0.05, 1.01), U(-0.015, 1.02), U(0.0, 1.008), U(0.02, 1.022), U(0.05, 1.01), U(0.056, 0.958)]); d.fill();
      rimLine([U(-0.053, 0.972), U(0.054, 0.972)], 0.8, 1.6); rimLine([U(0.0, 0.95), U(0.105, 0.956)], 0.6, 1);
    }
    if (spec.hat === 'stetson') {
      curve(d, [U(-0.14, 0.97), [U(-0.1, 0.945), U(0, 0.948)], [U(0.1, 0.945), U(0.14, 0.97)], [U(0.1, 0.958), U(0, 0.96)], [U(-0.1, 0.958), U(-0.14, 0.97)]]); d.fill();
      path(d, [U(-0.058, 0.955), U(-0.055, 1.02), U(-0.02, 1.035), U(0.0, 1.022), U(0.02, 1.035), U(0.055, 1.02), U(0.058, 0.955)]); d.fill();
      rimLine([U(-0.056, 0.97), U(0.057, 0.97)], 0.8, 1.5); rimLine([U(0.0, 0.948), U(0.1, 0.945), U(0.14, 0.97)], 0.7, 1);
    }
    if (spec.hat === 'cap') {
      path(d, [U(-0.06, 0.94), U(-0.05, 0.985), U(0.02, 0.99), U(0.05, 0.965), U(0.09, 0.955), U(0.05, 0.945)]); d.fill();
      rimLine([U(0.02, 0.99), U(0.05, 0.965), U(0.09, 0.955)], 0.7, 1);
    }
    /* ---- cigar & smoke ---- */
    if (spec.cigar) { const m = U(0.052, 0.868); d.lineWidth = 0.012 * s; d.beginPath(); d.moveTo(...m); d.lineTo(m[0] + 0.05 * s * f, m[1] - 0.008 * s); d.stroke(); dot([m[0] + 0.052 * s * f, m[1] - 0.009 * s], 0.006 * s, 1.2); rimLine([[m[0] + 0.05 * s * f, m[1] - 0.02 * s], [m[0] + 0.06 * s * f, m[1] - 0.06 * s], [m[0] + 0.045 * s * f, m[1] - 0.1 * s], [m[0] + 0.065 * s * f, m[1] - 0.15 * s]], 0.5, 1); }

    d.restore();
    return { head: U(0, 0.91), hand };
  };

  /** A bust portrait (notebook, dialogue strip): the sitter as a black silhouette against a worn,
   *  dithered halftone halo — no window. The oval mirror frame is applied by the UI. */
  K.portrait = function (A, type, scene = {}) {
    K.fillTone(A, 0.04);
    K.wallpaper(A, 0.04, { lift: 0.05 });
    K.glow(A, A.W * 0.5, A.H * 0.4, A.W * 0.78, 0.95);   // the halo behind head and shoulders
    K.glow(A, A.W * 0.52, A.H * 0.32, A.W * 0.32, 0.45);
    if (scene.backdrop) scene.backdrop(0, 0, A.W, A.H);
    // worn print: a few vertical scratches across the halo
    const R = SR.rng(type + 'scratch');
    for (let i = 0; i < 5; i++) { const sx = A.W * (0.15 + R() * 0.7); K.stroke(A, [[sx, A.H * R() * 0.3], [sx + 1, A.H * (0.5 + R() * 0.5)]], 1, 0.12 + R() * 0.12, 'd'); }
    const sc = scene.scale || 1.95;
    // head sits near 0.4 of the height so the oval mirror crops at the chest
    K.figure(A, A.W * (scene.fx || 0.5), A.H * (0.24 + sc), A.H * sc, type, Object.assign({ rim: 0.85 }, scene.fig || {}));
    if (scene.extra) scene.extra();
    K.vignette(A, 0.5);
  };
})();
