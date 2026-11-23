/* Sycamore Row — reusable UI components (DOM only, no game rules). */
(function () {
  'use strict';
  const SR = window.SR;
  const { h, svg } = SR;
  const UI = {};

  /* ---------------- frame ---------------- */
  UI.buildFrame = function (root) {
    const frame = h('div.frame');
    const band = (cls, vertical) => { const b = h('div.band.' + cls); b.style.webkitMaskImage = b.style.maskImage = SR.Orn.bandTile(vertical); return b; };
    frame.append(band('band--top', false), band('band--bottom', false), band('band--left', true), band('band--right', true));
    ['tl', 'tr', 'bl', 'br'].forEach((c) => frame.append(h('div.corner.corner--' + c, { html: SR.Orn.CORNER })));
    // hairline cracks that spread across the frame as Threat rises (one per step)
    frame.append(SR.svg(`<svg class="frame-cracks" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${SR.Orn.CRACKS.map((d, i) => `<path d="${d}" pathLength="1" data-step="${i + 1}"/>`).join('')}</svg>`));
    root.append(frame);
  };
  UI.corners = (el) => { ['tl', 'tr', 'bl', 'br'].forEach((c) => el.append(h('div.corner.corner--' + c, { html: SR.Orn.CORNER }))); return el; };

  /* ---------------- lancet option button ---------------- */
  const SHAPE = '<svg class="opt-shape" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2.6,0.4 H97.4 L99.6,5 L97.4,9.6 H2.6 L0.4,5 Z"/></svg>';
  UI.button = function (o, onPick) {
    const cls = ['opt'];
    if (o.primary) cls.push('primary');
    if (o.locked) cls.push('locked');
    if (o.small) cls.push('small');
    if (o.center) cls.push('center');
    const sub = o.locked ? `Locked · ${o.locked}` : o.sub;
    const b = h('button.' + cls.join('.'), { type: 'button', 'aria-disabled': o.locked ? 'true' : null, dataset: { id: o.id } },
      svg(SHAPE),
      o.key ? h('span.opt-key', { text: o.key }) : null,
      h('span.opt-text', h('span.opt-label', { text: o.label }), sub ? h('span.opt-sub', { text: sub }) : null),
      o.badge ? h('span.badge') : null);
    if (o.aria) b.setAttribute('aria-label', o.aria);
    b.addEventListener('mouseenter', () => SR.Audio.play('hover'));
    b.addEventListener('click', (e) => { e.preventDefault(); onPick && onPick(o, b); });
    return b;
  };

  /* ---------------- HUD ---------------- */
  function pipIcon() { return svg('<svg viewBox="-12 -12 324 224" aria-hidden="true"><path d="M0,200 L0,78 C0,35 84,8 150,0 C216,8 300,35 300,78 L300,200 Z"/></svg>'); }
  UI.hud = function (run) {
    const ST = SR.Story;
    const stat = (k, glyph, label, val, extra) => h('div.stat', { dataset: { stat: k } }, h('span.glyph', { text: glyph, 'aria-hidden': 'true' }), h('span', { text: label }), h('b', { text: String(val) }), extra);
    const pips = h('span.pips', { 'aria-hidden': 'true' });
    for (let i = 0; i < ST.THREAT_MAX; i++) { const p = h('span.pip' + (i < run.stats.threat ? '.on' : '')); p.append(pipIcon()); pips.append(p); }
    const threat = stat('threat', '⚠', 'Threat', `${run.stats.threat}/${ST.THREAT_MAX}`, pips);
    if (run.stats.threat >= ST.THREAT_MAX - 1) threat.classList.add('danger');
    const lp = h('span.level-pips', { 'aria-hidden': 'true' });
    for (let n = 1; n <= 5; n++) lp.append(SR.Orn.windowIcon(SR.Orn.LEVEL_WINDOW[n], n < run.level ? 'lit' : n === run.level ? 'lit' : 'dark'));
    [...lp.children].forEach((ic, i) => { if (i + 1 === run.level) ic.style.filter = 'drop-shadow(0 0 4px var(--lamp))'; });
    return h('div.hud',
      h('div.stats', { role: 'status', 'aria-live': 'polite' },
        stat('evidence', '◈', 'Evidence', run.stats.evidence),
        stat('trust', '❦', 'Trust', run.stats.trust),
        threat,
        stat('day', '☾', 'Day', `${run.day} · ${ST.timeLabel(run)}`)),
      h('div.level-title', h('span', { text: `Level ${run.level} · ${ST.LEVELS[run.level].name}` }), lp));
  };
  UI.bumpStat = function (hud, k, d) {
    const el = hud && hud.querySelector(`[data-stat="${k}"]`); if (!el || !d) return;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    const name = { evidence: 'Evidence', trust: 'Trust', threat: 'Threat' }[k];
    const f = h('span.float', { text: `${d > 0 ? '+' : '−'}${Math.abs(d)} ${name}` }); el.append(f);
    setTimeout(() => f.remove(), 1500);
  };

  /* ---------------- art window ---------------- */
  UI.artWindow = function (kind) { return SR.Orn.artWindow(kind); };
  UI.artFrame = function (level) { return SR.Orn.artFrame(level); };
  /** Show art in an art window, dissolving through the dither like a photograph developing. */
  UI.showArt = function (win, id, instant) {
    const { canvasA, canvasB } = win;
    if (win.current === id) return;
    const src = SR.Art.render(id);
    win.current = id;
    if (instant || SR.reducedMotion() || !win.hasArt) {
      const c = canvasA.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(src, 0, 0);
      win.hasArt = true;
      if (!instant && !SR.reducedMotion()) canvasA.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' });
      return;
    }
    // dissolve: reveal new image through a noise threshold mask
    const W = canvasB.width; const H = canvasB.height; const cb = canvasB.getContext('2d');
    const srcData = src.getContext('2d').getImageData(0, 0, W, H);
    const out = cb.createImageData(W, H); const R = SR.rng(id + 'mask');
    const cell = 4; const cw = Math.ceil(W / cell); const ch = Math.ceil(H / cell); const thr = new Float32Array(cw * ch);
    for (let i = 0; i < thr.length; i++) thr[i] = R();
    canvasB.style.opacity = 1;
    const start = performance.now(); const dur = 650;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const d = out.data; const s = srcData.data;
      for (let y = 0; y < H; y++) {
        const row = Math.floor(y / cell) * cw;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4; const on = thr[row + Math.floor(x / cell)] < p;
          d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = on ? 255 : 0;
        }
      }
      cb.putImageData(out, 0, 0);
      if (p < 1 && win.current === id) requestAnimationFrame(step);
      else if (win.current === id) { const ca = canvasA.getContext('2d'); ca.drawImage(src, 0, 0); canvasB.style.opacity = 0; cb.clearRect(0, 0, W, H); }
    };
    requestAnimationFrame(step);
  };

  /* ---------------- oval mirror portrait + dialogue strip ---------------- */
  /** A character bust in an oval mirror frame (hairline, ink gap, bead ring). Rendered at 360×480, shown small. */
  UI.mirror = function (art, cls = '') {
    const c = h('canvas', { width: 360, height: 480 });
    requestAnimationFrame(() => SR.Art.drawInto(c, art));
    return h('div.mirror' + (cls ? '.' + cls : ''), { 'aria-hidden': 'true' }, c, h('span.mirror-rim'));
  };
  /** Whenever a character speaks: their mirror on the left, name in Cinzel, small-caps role, the line in italics. */
  UI.dialogue = function (say) {
    const [who, line] = say; const sp = SR.Story.SPEAKERS[who];
    if (!sp) return null;
    const text = UI.storyText(`“${line}”`, { plain: true }); text.className = 'd-line story';
    return h('div.dialogue', { role: 'group', 'aria-label': `${sp.name} says` },
      UI.mirror(sp.art, 'speaking'),
      h('div.d-body', h('div.d-name', h('span', { text: sp.name }), h('span.d-role', { text: sp.role })), text));
  };

  /* ---------------- story text (word reveal) ---------------- */
  UI.storyText = function (text, opts = {}) {
    const p = h('p.story');
    let first = !opts.plain;
    text.split(/(\s+)/).forEach((tok) => {
      if (/^\s+$/.test(tok)) { p.append(tok); return; }
      if (first && /^[A-Za-z]/.test(tok)) { // illuminated blackletter initial
        first = false;
        p.append(h('span.w.dropcap-word', h('span.dropcap', { text: tok[0], 'aria-hidden': 'true' }), h('span.sr-only', { text: tok[0] }), tok.slice(1)));
        return;
      }
      first = false;
      p.append(h('span.w', { text: tok }));
    });
    return p;
  };
  /** Reveal words over time. Returns { done: Promise, finish() }. */
  UI.reveal = function (p) {
    const speed = { instant: 0, fast: 26, normal: 55 }[SR.Game.settings.textSpeed] ?? 26;
    const words = [...p.querySelectorAll('.w')];
    let i = 0; let timer = null; let resolve;
    const done = new Promise((r) => (resolve = r));
    const finish = () => { if (timer) clearInterval(timer); timer = null; p.classList.add('done'); resolve(); };
    if (!speed || SR.reducedMotion()) { finish(); return { done, finish }; }
    timer = setInterval(() => { if (i >= words.length) return finish(); words[i++].classList.add('on'); }, speed);
    return { done, finish };
  };
  /** Reveal several paragraphs in turn (narration, then a spoken line). finish() fast-forwards all of them. */
  UI.revealChain = function (els, onStart) {
    let ff = false; let cur = null; let resolve;
    const done = new Promise((r) => (resolve = r));
    (async () => {
      for (const el of els.filter(Boolean)) {
        if (onStart) onStart(el);
        if (ff) { el.classList.add('done'); continue; }
        cur = UI.reveal(el); await cur.done;
      }
      cur = null; resolve();
    })();
    return { done, finish() { ff = true; if (cur) cur.finish(); } };
  };

  /* ---------------- clue box, chips, meter ---------------- */
  UI.clueBox = (clueId) => {
    const c = SR.Story.CLUES[clueId]; if (!c) return null;
    return h('div.clue', h('div.lbl', { text: 'Clue added to your notebook' }), h('div.txt', { text: c.text }));
  };
  UI.chips = (chips) => {
    if (!chips || !chips.length) return null;
    const names = { evidence: 'Evidence', trust: 'Trust', threat: 'Threat', jury: 'Jury belief' };
    return h('div.chips', chips.map((c, i) => h('span.chip' + (c.k === 'threat' ? (c.d > 0 ? '.neg' : '') : (c.d < 0 ? '.neg' : '')), { text: `${c.d > 0 ? '+' : '−'}${Math.abs(c.d)} ${names[c.k]}`, style: { animationDelay: 200 + i * 140 + 'ms' } })));
  };
  const CELL = '<svg viewBox="-10 -10 120 160" aria-hidden="true"><path d="M0,140 L0,52 C0,22 32,6 50,0 C68,6 100,22 100,52 L100,140 Z"/></svg>';
  UI.meter = (m) => {
    const cells = h('div.cells');
    for (let i = 0; i < m.max; i++) {
      const isNew = m.gain && i >= m.value - m.gain && i < m.value;
      const c = h('span.cell' + (i < m.value ? '.on' : '') + (isNew ? '.new' : '')); c.append(svg(CELL)); if (isNew) c.style.animationDelay = (i - (m.value - m.gain)) * 160 + 'ms';
      cells.append(c);
    }
    cells.append(h('span.count', { text: `${m.value}/${m.max}` }));
    return h('div.meter', { role: 'img', 'aria-label': `${m.label}: ${m.value} of ${m.max}` }, h('div.lbl', { text: m.label }), cells);
  };
  UI.stars = (n, max = 3) => { const s = h('div.stars', { 'aria-label': `${n} of ${max} stars` }); for (let i = 0; i < max; i++) s.append(h('span' + (i < n ? '' : '.off'), { text: i < n ? '★' : '☆' })); return s; };

  /* ---------------- icons for clues ---------------- */
  const ICONS = {
    doc: '<path d="M14,6 H40 L50,16 V58 H14 Z M40,6 V16 H50" /><path d="M20,26 H44 M20,34 H44 M20,42 H36" />',
    photo: '<path d="M8,12 H56 V52 H8 Z" /><path d="M14,46 L26,30 L34,40 L40,34 L50,46 Z" /><circle cx="44" cy="22" r="4" />',
    tree: '<path d="M32,60 V34 M32,40 L22,30 M32,36 L42,26 M32,46 L24,40" /><circle cx="32" cy="20" r="14" />',
    person: '<circle cx="32" cy="18" r="9" /><path d="M14,58 C14,40 22,32 32,32 C42,32 50,40 50,58 Z" />',
    eye: '<path d="M6,32 C16,16 48,16 58,32 C48,48 16,48 6,32 Z" /><circle cx="32" cy="32" r="8" />',
  };
  UI.icon = (k) => svg(`<svg viewBox="0 0 64 64" fill="none" stroke="var(--lamp)" stroke-width="2" aria-hidden="true">${ICONS[k] || ICONS.doc}</svg>`);

  /* ---------------- juice: brief, quiet feedback (all < 600 ms, skipped under reduce-motion) ---------------- */
  /** One red eight-point star bursts beside a newly earned clue. */
  UI.starBurst = function (el) {
    if (!el || SR.reducedMotion()) return;
    const s = SR.Orn.star({ right: '-.9rem', top: '-1rem' }, 'burst');
    el.append(s);
    s.animate([{ transform: 'scale(0) rotate(-40deg)', opacity: 0 }, { transform: 'scale(1.35) rotate(10deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(.9) rotate(22deg)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' })
      .finished.then(() => s.remove(), () => s.remove());
  };
  /** A bone rubber stamp ("+1 TRUST") thunks onto the scene and fades. */
  UI.stamp = function (host, text) {
    if (!host || SR.reducedMotion()) return;
    const tilt = ((Math.random() - 0.5) * 10 - 6).toFixed(1) + 'deg';
    const st = h('div.stamp', { 'aria-hidden': 'true' }, text);
    host.append(st);
    SR.Audio.play('thunk');
    st.animate([{ transform: `rotate(${tilt}) scale(1.9)`, opacity: 0 }, { transform: `rotate(${tilt}) scale(1)`, opacity: 1, offset: 0.24 }, { transform: `rotate(${tilt}) scale(1)`, opacity: 1, offset: 0.62 }, { transform: `rotate(${tilt}) scale(1.02)`, opacity: 0 }], { duration: 580, easing: 'ease-out', fill: 'forwards' })
      .finished.then(() => st.remove(), () => st.remove());
  };
  /** A small ink blot spreads from the point where a button is pressed. */
  UI.inkBlot = function (btn, x, y) {
    if (!btn || SR.reducedMotion()) return;
    const box = btn.querySelector(':scope > .paper') || btn; // on a pinned note, the ink stays on the paper
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    const host = box.querySelector(':scope > .blot-host') || box.appendChild(h('span.blot-host', { 'aria-hidden': 'true' }));
    const r = box.getBoundingClientRect(); const size = Math.max(r.width, r.height) * 0.9;
    const R = () => 38 + Math.random() * 24;
    const b = h('span.blot', { style: { left: (x - r.left - size / 2) + 'px', top: (y - r.top - size / 2) + 'px', width: size + 'px', height: size + 'px', borderRadius: `${R()}% ${R()}% ${R()}% ${R()}% / ${R()}% ${R()}% ${R()}% ${R()}%` } });
    host.append(b);
    b.animate([{ transform: 'scale(.05)', opacity: 0.32 }, { transform: 'scale(1)', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' })
      .finished.then(() => b.remove(), () => b.remove());
  };

  /* ---------------- toast ---------------- */
  let toastTimer;
  UI.toast = (msg) => { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2400); };

  /* ---------------- drifting motes (seed fluff in the lamplight) ---------------- */
  UI.motes = function (canvas) {
    const ctx = canvas.getContext('2d'); let W = 0; let H = 0; const parts = [];
    const resize = () => { W = canvas.width = canvas.clientWidth; H = canvas.height = canvas.clientHeight; };
    resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 38; i++) parts.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, vx: (Math.random() - 0.5) * 0.00008, vy: -0.00004 - Math.random() * 0.00008, a: 0.1 + Math.random() * 0.35, ph: Math.random() * 6 });
    let last = performance.now();
    const color = SR.token('lamp');
    let speed = 1;
    UI.motes.setUnrest = (threat) => { speed = 1 + threat * 0.55; }; // motes drift faster as Threat rises
    const loop = (t) => {
      const dt = Math.min(50, t - last) * speed; last = t;
      ctx.clearRect(0, 0, W, H);
      if (!SR.reducedMotion() && !document.hidden) {
        for (const p of parts) {
          p.x += p.vx * dt + Math.sin(t / 3000 + p.ph) * 0.00003 * dt * (speed > 1.5 ? 2 : 1); p.y += p.vy * dt;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); } if (p.x < -0.02) p.x = 1.02; if (p.x > 1.02) p.x = -0.02;
          ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.ph)); ctx.fillStyle = color;
          ctx.fillRect(Math.round(p.x * W), Math.round(p.y * H), p.r, p.r);
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  SR.UI = UI;
})();
