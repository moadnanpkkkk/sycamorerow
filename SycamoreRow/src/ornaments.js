/* Sycamore Row — Gothic Revival ornament set. One shape language everywhere:
 * pointed lancet arches, cusped picture frames, sycamore leaves and seed-balls, bone line on black.
 * Colours are always CSS tokens (var(--lamp) …); band tiles are masks so they inherit --lamp too. */
(function () {
  'use strict';
  const SR = window.SR;
  const LAMP = 'var(--lamp)';

  /* ---------- sycamore leaf (local 100×100 box, stem at bottom centre) ---------- */
  const LEAF_PTS = [[50, 82], [36, 80], [16, 72], [27, 62], [6, 36], [28, 40], [34, 20], [50, 2], [66, 20], [72, 40], [94, 36], [73, 62], [84, 72], [64, 80]];
  const leafPath = 'M' + LEAF_PTS.map((p) => p.join(',')).join(' L') + ' Z';
  const leafVeins = 'M50,80 L50,6 M50,62 L10,38 M50,62 L90,38 M50,74 L19,70 M50,74 L81,70';
  function leaf(x, y, s, rot, extra = '') {
    return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s}) translate(-50,-82)" ${extra}>
      <path d="${leafPath}" fill="var(--ink)" stroke="${LAMP}" stroke-width="${1.4 / s}" stroke-linejoin="round"/>
      <path d="${leafVeins} M50,82 L50,98" fill="none" stroke="${LAMP}" stroke-width="${1 / s}" opacity=".75"/></g>`;
  }
  function seedBall(x, y, r, stemFrom) {
    let dots = '';
    const R = SR.rng(Math.round(x * 31 + y));
    for (let i = 0; i < 14; i++) { const a = R() * Math.PI * 2; const d = Math.sqrt(R()) * r * 0.75; dots += `<circle cx="${(x + Math.cos(a) * d).toFixed(1)}" cy="${(y + Math.sin(a) * d).toFixed(1)}" r="${(r * 0.09).toFixed(2)}" fill="${LAMP}"/>`; }
    const stem = stemFrom ? `<path d="M${stemFrom[0]},${stemFrom[1]} Q${stemFrom[0] + 4},${(stemFrom[1] + y) / 2} ${x},${y - r}" fill="none" stroke="${LAMP}" stroke-width="1"/>` : '';
    return `${stem}<circle cx="${x}" cy="${y}" r="${r}" fill="var(--ink)" stroke="${LAMP}" stroke-width="1.3"/>${dots}`;
  }
  function spiral(x, y, r, dir = 1) {
    // small closing scroll
    return `<path d="M${x},${y} a${r},${r} 0 1,${dir > 0 ? 1 : 0} ${r * 1.6 * dir},${r * 0.2} a${r * 0.7},${r * 0.7} 0 1,${dir > 0 ? 1 : 0} ${-r * 0.9 * dir},${-r * 0.6}" fill="none" stroke="${LAMP}" stroke-width="1.2"/>`;
  }

  /* ---------- corner ornament (top-left; CSS mirrors it to the other corners) ---------- */
  const CORNER = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="none" stroke="${LAMP}" stroke-linecap="round">
      <path d="M6,150 L6,6 L150,6" stroke-width="1.6"/>
      <path d="M14,118 L14,14 L118,14" stroke-width="1"/>
      <path d="M22,64 L22,22 L64,22" stroke-width="1"/>
      <path d="M34,30 C70,12 96,44 128,24 C150,10 170,26 188,18 C204,11 216,20 226,16" stroke-width="1.3"/>
      <path d="M30,34 C12,70 44,96 24,128 C10,150 26,170 18,188 C11,204 20,216 16,226" stroke-width="1.3"/>
      <path d="M62,30 C74,40 70,54 58,58" stroke-width="1"/>
      <path d="M30,62 C40,74 54,70 58,58" stroke-width="1"/>
    </g>
    ${spiral(226, 16, 6, 1)}${spiral(16, 226, 6, -1)}
    ${leaf(44, 44, 0.62, 135)}
    ${leaf(160, 22, 0.28, 60)}${leaf(22, 160, 0.28, 210)}
    ${seedBall(110, 52, 8, [104, 30])}${seedBall(52, 110, 8, [30, 104])}
    <circle cx="6" cy="6" r="3.2" fill="${LAMP}"/>
  </svg>`;

  /* ---------- border bands: a running Gothic arcade ---------- */
  function bandTile(vertical) { // returned as a mask image: black = visible, the colour comes from --lamp
    const arch = 'M5,27 L5,19 Q5,12 12,9 Q19,12 19,19 L19,27';
    const body = `<path d="M0,6 H24 M0,30 H24" stroke="#000" stroke-width="1" opacity=".75"/>
      <path d="${arch}" fill="none" stroke="#000" stroke-width="1" opacity=".8"/><circle cx="12" cy="20" r="1.4" fill="#000" opacity=".8"/>`;
    const g = vertical ? `<g transform="translate(36,0) rotate(90)">${body}</g>` : body;
    const w = vertical ? 36 : 24; const h = vertical ? 24 : 36;
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${g}</svg>`)}")`;
  }

  /* ---------- eight-point star: the single blood-red ornament ---------- */
  const STAR_PATH = 'M50,0 L55,40 L85,15 L60,45 L100,50 L60,55 L85,85 L55,60 L50,100 L45,60 L15,85 L40,55 L0,50 L40,45 L15,15 L45,40 Z';
  /** Inline star for use inside another SVG (centre x,y; r = half-size). */
  function starPath(x, y, r, tone = 'blood') { // tone 'bone' for ornament that must not spend the red budget
    return `<path d="${STAR_PATH}" transform="translate(${x - r},${y - r}) scale(${r / 50})" fill="var(${tone === 'bone' ? '--lamp' : '--blood-hi'})"/>`;
  }
  /** Floating star element; pos = CSS offsets, size = '' | 'sm' | 'lg'. */
  function star(pos = {}, size = '') {
    const el = SR.svg(`<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${STAR_PATH}" fill="currentColor"/><path d="M50,8 V92 M8,50 H92" stroke="currentColor" stroke-width="1.5" opacity=".7"/></svg>`);
    const wrap = SR.h('span.star8' + (size ? '.' + size : ''), { 'aria-hidden': 'true' });
    Object.assign(wrap.style, pos);
    wrap.append(el);
    return wrap;
  }
  /** A display title framed by red star sparkles (splash, menu, chapter cards, endings). */
  function sparkTitle(titleEl) {
    const w = SR.h('div.title-wrap');
    w.append(star({ left: '-2.6rem', top: '-.6rem' }, 'lg'), titleEl, star({ right: '-1.4rem', top: '18%' }, 'sm'), star({ right: '12%', bottom: '-1.2rem' }));
    return w;
  }

  /* ---------- dividers ---------- */
  function divider(kind = 'flourish') {
    if (kind === 'branch') { // main menu: a sycamore branch with seed-balls
      return `<svg class="divider divider--branch" viewBox="0 0 600 70" aria-hidden="true">
        <path d="M30,35 C150,28 210,44 300,35 C390,26 450,42 570,35" fill="none" stroke="${LAMP}" stroke-width="1.5"/>
        <path d="M60,35 L30,35 M540,35 L570,35" stroke="${LAMP}" stroke-width="1"/>
        ${starPath(26, 35, 9, 'bone')}${starPath(574, 35, 9, 'bone')}
        ${leaf(300, 35, 0.34, 0)}${leaf(250, 37, 0.26, -70)}${leaf(350, 33, 0.26, 70)}
        ${leaf(160, 32, 0.2, -110)}${leaf(440, 38, 0.2, 110)}
        ${seedBall(205, 56, 6, [205, 39])}${seedBall(395, 54, 6, [395, 35])}
      </svg>`;
    }
    return `<svg class="divider" viewBox="0 0 600 56" aria-hidden="true">
      <path d="M40,28 L262,28 M338,28 L560,28" stroke="${LAMP}" stroke-width="1.4"/>
      <path d="M90,24 L262,24 M338,24 L510,24" stroke="${LAMP}" stroke-width=".8" opacity=".55"/>
      ${starPath(36, 28, 7, 'bone')}${starPath(564, 28, 7, 'bone')}
      ${leaf(282, 28, 0.2, -90)}${leaf(318, 28, 0.2, 90)}
      ${seedBall(300, 28, 7)}
    </svg>`;
  }

  /* ---------- key strip: arcade header for overlay cards ---------- */
  function keyStrip() {
    let arches = '';
    for (let i = 0; i < 9; i++) {
      const cx = 60 + i * 60; const big = i === 4; const top = big ? 6 : 22; const w = big ? 22 : 16;
      arches += `<path d="M${cx - w},60 L${cx - w},${top + 22} Q${cx - w},${top + 6} ${cx},${top} Q${cx + w},${top + 6} ${cx + w},${top + 22} L${cx + w},60" fill="none" stroke="${LAMP}" stroke-width="1.2" opacity="${big ? 1 : 0.7}"/>`;
    }
    return `<svg class="keystrip" viewBox="0 0 600 70" aria-hidden="true">
      <path d="M10,62 H590 M10,67 H590" stroke="${LAMP}" stroke-width="1" opacity=".7"/>${arches}${seedBall(300, 44, 8)}</svg>`;
  }

  /* ---------- Gothic window silhouettes (viewBox 300×200) ---------- */
  function lancet(x0, x1, top, spring, base = 200) {
    const cx = (x0 + x1) / 2; const w = x1 - x0; const k = spring - top;
    return `M${x0},${base} L${x0},${spring} C${x0},${spring - k * 0.55} ${cx - w * 0.28},${top + k * 0.1} ${cx},${top} C${cx + w * 0.28},${top + k * 0.1} ${x1},${spring - k * 0.55} ${x1},${spring} L${x1},${base} Z`;
  }
  const QUATREFOIL = 'M98.1,48.1 A52,52 0 1,1 201.9,48.1 A52,52 0 1,1 201.9,151.9 A52,52 0 1,1 98.1,151.9 A52,52 0 1,1 98.1,48.1 Z';
  const bar = (d, w = 7) => `<path d="${d}" fill="none" stroke="var(--lamp)" stroke-width="${w + 2.4}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="var(--ink)" stroke-width="${w}" stroke-linejoin="round"/>`;

  const WINDOWS = {
    // Level 1 · The Sycamore — a single lancet
    lancet: {
      clip: lancet(0, 300, 0, 78),
      tracery: () => `<path d="${lancet(8, 292, 9, 82, 192)}" class="win-inner"/>`,
    },
    // Level 2 · Clanton — twin lancets under a roundel (geometric tracery)
    twin: {
      clip: lancet(0, 300, 0, 78),
      tracery: () => bar(`M150,200 L150,104 ${''}`, 8) + bar(lancet(4, 150, 60, 110, 200).replace(/ L150,200 Z$/, ''), 6) + bar(lancet(150, 296, 60, 110, 200).replace(/^M150,200 L150,110/, 'M150,110'), 6)
        + bar('M150,36 m-27,0 a27,27 0 1,0 54,0 a27,27 0 1,0 -54,0', 5)
        + `<path d="M150,22 a7,7 0 1,1 0.1,0 M136,36 a7,7 0 1,1 0.1,0 M164,36 a7,7 0 1,1 0.1,0 M150,50 a7,7 0 1,1 0.1,0" class="win-inner"/>`,
    },
    // Level 3 · Pressure — leaded diamond quarries, one pane cracked
    quarry: {
      clip: lancet(0, 300, 0, 78),
      tracery: () => {
        let lines = '';
        for (let i = -6; i <= 12; i++) { const x = i * 34; lines += `M${x},200 L${x + 150},-20 M${x},-20 L${x + 150},200 `; }
        const crack = 'M214,126 L238,96 L262,90 M214,126 L246,140 L276,134 M214,126 L206,96 L214,64 M214,126 L190,148 L176,176 M214,126 L186,118 L160,122 M214,126 L224,160 L232,196';
        return `<path d="${lines}" fill="none" stroke="var(--ink)" stroke-width="3.2"/><path d="${lines}" fill="none" stroke="var(--lamp)" stroke-width=".6" opacity=".35"/>
          <path d="${crack}" fill="none" stroke="var(--lamp)" stroke-width="1.6"/><path d="${crack}" fill="none" stroke="var(--ink)" stroke-width="1" transform="translate(1.5,1)"/>
          <path d="${lancet(8, 292, 9, 82, 192)}" class="win-inner"/>`;
      },
    },
    // Level 4 · The Night Before — a quatrefoil, like a keyhole onto the dark
    quatrefoil: {
      clip: QUATREFOIL,
      tracery: () => bar('M150,0 L150,200 M50,100 L250,100', 4) + `<circle cx="150" cy="100" r="18" fill="var(--ink)" stroke="var(--lamp)" stroke-width="1.4"/>`
        + `<path d="${QUATREFOIL}" class="win-inner" transform="translate(150,100) scale(.93) translate(-150,-100)"/>`,
    },
    // Level 5 · The Trial — three tall lancets, the courthouse window
    triple: {
      clip: lancet(0, 92, 24, 82) + ' ' + lancet(104, 196, 0, 70) + ' ' + lancet(208, 300, 24, 82),
      tracery: () => bar('M0,138 L92,138 M104,130 L196,130 M208,138 L300,138', 5)
        + `<path d="${lancet(7, 85, 32, 86, 194)} ${lancet(111, 189, 8, 74, 194)} ${lancet(215, 293, 32, 86, 194)}" class="win-inner"/>`,
    },
  };
  WINDOWS.twin.tracery = () => {
    const left = 'M150,200 L150,108 C150,84 108,64 78,58 C48,64 4,84 4,108 L4,200';
    const right = 'M150,108 C150,84 192,64 222,58 C252,64 296,84 296,108 L296,200';
    return bar(left, 6) + bar(right, 6) + bar('M123,36 a27,27 0 1,0 54,0 a27,27 0 1,0 -54,0', 5)
      + `<path d="M150,22 a6,6 0 1,1 -.1,0 M136,36 a6,6 0 1,1 -.1,0 M164,36 a6,6 0 1,1 -.1,0 M150,50 a6,6 0 1,1 -.1,0" fill="none" stroke="var(--lamp)" stroke-width="1"/>`
      + `<path d="${lancet(8, 292, 9, 82, 192)}" class="win-inner"/>`;
  };

  const LEVEL_WINDOW = { 0: 'lancet', 1: 'lancet', 2: 'twin', 3: 'quarry', 4: 'quatrefoil', 5: 'triple' };

  /** Five hairline cracks for the outer frame (viewBox 1000×1000, stretched), one per point of Threat. */
  const CRACKS = [
    'M300,0 L292,9 L305,18 L298,30 L303,44 M292,9 L280,14 M305,18 L316,21',
    'M1000,420 L990,428 L982,423 L970,436 L961,433 M990,428 L993,441 M982,423 L979,410',
    'M180,1000 L186,990 L176,981 L183,968 L178,955 M186,990 L196,986 M176,981 L166,984',
    'M0,640 L10,646 L17,638 L29,647 L38,642 M10,646 L8,659 M17,638 L15,626',
    'M820,0 L826,12 L818,22 L829,36 L824,48 L831,60 M826,12 L838,15 M818,22 L806,27 M829,36 L840,40',
  ];

  /** Carved stone surround: double hood-mould, sycamore-leaf finial, sill with corbels and seed-ball stops. */
  function surround(W) {
    const hood = (k, cls) => `<path d="${W.clip}" class="${cls}" transform="translate(150,200) scale(${1 + 0.05 * k},${1 + 0.072 * k}) translate(-150,-200)"/>`;
    const finial = `<g transform="translate(150,-15.5) scale(.15) translate(-50,-98)"><path d="${leafPath}" class="win-finial"/><path d="${leafVeins} M50,82 L50,98" class="win-inner"/></g>`;
    const crockets = [0.25, 0.75].map((t) => `<circle cx="${150 + (t - 0.5) * 2 * 128}" cy="${t === 0.25 ? 20 : 20}" r="1.6" class="win-dot"/>`).join('');
    const sill = `<path d="M-16,200.5 H316 M-12,207 H312" class="win-outline"/>
      <path d="M-8,207 V214 Q-8,218 -2,218 H6 M308,207 V214 Q308,218 302,218 H294" class="win-outline win-outline--thin"/>
      <circle cx="-16" cy="203.8" r="2.6" class="win-dot"/><circle cx="316" cy="203.8" r="2.6" class="win-dot"/>`;
    return hood(1, 'win-hood') + hood(1.35, 'win-hood win-hood--thin') + finial + crockets + sill;
  }

  /** Build an art window: a 3:2 box clipped to the level's Gothic window, with tracery over the art. */
  function artWindow(kind) {
    const W = WINDOWS[kind] || WINDOWS.lancet;
    const id = 'clip-' + kind;
    const box = SR.h('div.art-window', { dataset: { kind } });
    const canvasA = SR.h('canvas.art-canvas', { width: 960, height: 640 });
    const canvasB = SR.h('canvas.art-canvas.art-canvas--next', { width: 960, height: 640 });
    const holder = SR.h('div.art-clip', { style: { clipPath: `url(#${id})` } }, canvasA, canvasB);
    const over = SR.svg(`<svg class="art-tracery" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
      ${W.tracery()}
      <path d="${W.clip}" class="win-outline"/>
      ${surround(W)}</svg>`);
    box.append(holder, over);
    return { el: box, canvasA, canvasB };
  }

  /* ---------- the scene frame: an ornate picture frame for gameplay art (no window, no tracery) ---------- */
  // cusped corners: each corner is a small concave notch, like an old engraved photograph mount
  const FRAME_CLIP = 'M12,0 H288 A12,12 0 0,0 300,12 V188 A12,12 0 0,0 288,200 H12 A12,12 0 0,0 0,188 V12 A12,12 0 0,0 12,0 Z';
  const ring = (sx, sy, cls) => `<path d="${FRAME_CLIP}" class="${cls}" transform="translate(150,100) scale(${sx},${sy}) translate(-150,-100)"/>`;
  function frameLeaf(x, y, s, rot) {
    return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s}) translate(-50,-82)"><path d="${leafPath}" class="frame-leaf"/><path d="${leafVeins}" class="frame-vein"/></g>`;
  }
  /** Ornate frame around a 3:2 scene. `level` puts that level's window silhouette in the crest (0 = sycamore leaf). */
  function artFrame(level = 0) {
    const kind = LEVEL_WINDOW[level];
    const box = SR.h('div.art-window.art-frame', { dataset: { level } });
    const canvasA = SR.h('canvas.art-canvas', { width: 960, height: 640 });
    const canvasB = SR.h('canvas.art-canvas.art-canvas--next', { width: 960, height: 640 });
    const holder = SR.h('div.art-clip', { style: { clipPath: 'url(#clip-frame)' } }, canvasA, canvasB);
    // a sycamore leaf grows diagonally out of each corner, a seed-ball sits in the cusp
    const corners = [[0, 0, -45], [300, 0, 45], [300, 200, 135], [0, 200, -135]].map(([x, y, r]) => {
      const dx = x ? 1 : -1; const dy = y ? 1 : -1;
      return frameLeaf(x + dx * 7, y + dy * 10.5, 0.085, r) + `<circle cx="${x - dx * 3.2}" cy="${y - dy * 4.6}" r="1.4" class="win-dot"/>`;
    }).join('');
    const crestArch = lancet(131, 169, -34, -17, -4);
    const cid = 'crest' + Math.random().toString(36).slice(2, 8);
    const crestWin = kind && level
      ? `<g transform="translate(140.5,-25) scale(${19 / 300},${17 / 200})"><clipPath id="${cid}"><path d="${WINDOWS[kind].clip}"/></clipPath>
          <path d="${WINDOWS[kind].clip}" class="frame-crest-win"/><path d="${ICON_TRACERY[kind] || ''}" class="frame-crest-tracery" clip-path="url(#${cid})"/></g>`
      : `<g transform="translate(150,-6) scale(.14) translate(-50,-98)"><path d="${leafPath}" class="frame-crest-win"/></g>`;
    const diamonds = [[150, 208.2], [-6.2, 100], [306.2, 100]].map(([x, y]) => `<path d="M${x},${y - 2.6} L${x + 1.8},${y} L${x},${y + 2.6} L${x - 1.8},${y} Z" class="win-dot"/>`).join('');
    const over = SR.svg(`<svg class="art-tracery frame-tracery" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
      ${ring(1, 1, 'win-outline')}
      ${ring(1.022, 1.034, 'frame-bead')}
      ${ring(1.042, 1.064, 'win-outline win-outline--thin')}
      ${ring(1.058, 1.088, 'frame-moulding')}
      ${ring(1.072, 1.108, 'win-outline')}
      <path d="${crestArch}" class="frame-crest"/>${crestWin}
      ${corners}${diamonds}</svg>`);
    box.append(holder, over);
    return { el: box, canvasA, canvasB };
  }

  /** Shared <svg> with clipPaths for every window (objectBoundingBox units). */
  function defs() {
    const paths = Object.entries(WINDOWS).map(([k, w]) => `<clipPath id="clip-${k}" clipPathUnits="objectBoundingBox"><path transform="scale(${1 / 300},${1 / 200})" d="${w.clip}"/></clipPath>`).join('');
    const frame = `<clipPath id="clip-frame" clipPathUnits="objectBoundingBox"><path transform="scale(${1 / 300},${1 / 200})" d="${FRAME_CLIP}"/></clipPath>`;
    return SR.svg(`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${paths}${frame}</defs></svg>`);
  }

  /** Small window icon (level pips, case files). state: lit | open | dark */
  const ICON_TRACERY = {
    lancet: 'M150,200 V40',
    twin: 'M150,200 V108 M150,108 C150,84 108,64 78,58 C48,64 8,84 8,108 M150,108 C150,84 192,64 222,58 C252,64 292,84 292,108 M123,36 a27,27 0 1,0 54,0 a27,27 0 1,0 -54,0',
    quarry: 'M0,120 L120,0 M0,200 L200,0 M80,200 L280,0 M160,200 L300,60 M0,60 L60,0 M300,120 L180,0 M300,200 L100,0 M220,200 L20,0 M140,200 L0,60',
    quatrefoil: 'M150,0 V200 M50,100 H250',
    triple: 'M0,138 H92 M104,130 H196 M208,138 H300',
  };
  function windowIcon(kind, state = 'lit') {
    const W = WINDOWS[kind] || WINDOWS.lancet; const id = 'wi' + Math.random().toString(36).slice(2, 8);
    return SR.svg(`<svg class="win-icon win-icon--${state}" viewBox="-6 -6 312 212" aria-hidden="true">
      <defs><clipPath id="${id}"><path d="${W.clip}"/></clipPath></defs>
      <path d="${W.clip}"/><path d="${ICON_TRACERY[kind] || ''}" class="win-icon-tracery" clip-path="url(#${id})"/></svg>`);
  }

  /* ---------- the great window (main menu hero), viewBox 300×420 ---------- */
  function greatWindow() {
    const outer = 'M0,420 L0,170 C0,80 92,14 150,0 C208,14 300,80 300,170 L300,420 Z';
    const tracery = [
      'M75,420 L75,200', 'M150,420 L150,150', 'M225,420 L225,200', 'M0,300 L300,300',
      'M0,200 C0,150 40,120 75,112 C110,120 150,150 150,200', 'M150,200 C150,150 190,120 225,112 C260,120 300,150 300,200',
      'M0,230 C0,214 20,204 37,201 C55,204 75,214 75,230', 'M75,230 C75,214 95,204 112,201 C130,204 150,214 150,230',
      'M150,230 C150,214 170,204 187,201 C205,204 225,214 225,230', 'M225,230 C225,214 245,204 262,201 C280,204 300,214 300,230',
    ];
    const ring = 'M110,70 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0';
    const foil = 'M150,44 a11,11 0 1,1 -.1,0 M126,70 a11,11 0 1,1 -.1,0 M174,70 a11,11 0 1,1 -.1,0 M150,96 a11,11 0 1,1 -.1,0';
    const el = SR.h('div.great-window');
    const canvas = SR.h('canvas.great-canvas', { width: 600, height: 840 });
    const clip = SR.h('div.great-clip', { style: { clipPath: 'url(#clip-great)' } }, canvas);
    const over = SR.svg(`<svg class="great-tracery" viewBox="0 0 300 420" preserveAspectRatio="none" aria-hidden="true">
      <defs><clipPath id="clip-great" clipPathUnits="objectBoundingBox"><path transform="scale(${1 / 300},${1 / 420})" d="${outer}"/></clipPath></defs>
      ${tracery.map((d) => bar(d, 5)).join('')}${bar(ring, 5)}<path d="${foil}" fill="none" stroke="var(--lamp)" stroke-width="1.2"/>
      <path d="${outer}" class="win-outline"/><path d="M-6,426 L-6,170 C-6,76 90,6 150,-7 C210,6 306,76 306,170 L306,426" class="win-outline win-outline--thin"/></svg>`);
    el.append(clip, over);
    return { el, canvas };
  }

  Object.assign(SR, { Orn: { CORNER, CRACKS, bandTile, divider, star, starPath, STAR_PATH, sparkTitle, keyStrip, artWindow, artFrame, FRAME_CLIP, defs, windowIcon, greatWindow, leaf, leafPath, seedBall, LEVEL_WINDOW, WINDOWS } });
})();
