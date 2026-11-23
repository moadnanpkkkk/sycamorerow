/* Sycamore Row — art compositor: paints a scene on three layers, dithers the light
 * layer into 1-bit bone-white lamplight, then lays crisp silhouettes and linework on top. */
(function () {
  'use strict';
  const SR = window.SR;
  const K = SR.ArtKit;
  const LAMP_RGB = SR.hexRgb(K.LAMP);
  const INK_RGB = SR.hexRgb(K.INK);
  const cache = new Map();
  const painters = {};

  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /** Atkinson dither of a grayscale canvas at half resolution → crisp 2px lamplight dots. */
  function dither(tone, W, H, seed) {
    const sw = W >> 1; const sh = H >> 1;
    const small = makeCanvas(sw, sh); const sc = small.getContext('2d');
    sc.imageSmoothingEnabled = true; sc.drawImage(tone, 0, 0, sw, sh);
    const src = sc.getImageData(0, 0, sw, sh).data;
    const g = new Float32Array(sw * sh); const R = SR.rng(seed);
    for (let i = 0; i < g.length; i++) {
      const v = src[i * 4] / 255;
      g[i] = Math.pow(v, 1.15) + (R() - 0.5) * 0.06; // slight gamma + grain
    }
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = y * sw + x; const old = g[i]; const nv = old > 0.5 ? 1 : 0; const err = (old - nv) / 8; g[i] = nv;
        if (x + 1 < sw) g[i + 1] += err;
        if (x + 2 < sw) g[i + 2] += err;
        if (y + 1 < sh) { if (x > 0) g[i + sw - 1] += err; g[i + sw] += err; if (x + 1 < sw) g[i + sw + 1] += err; }
        if (y + 2 < sh) g[i + sw * 2] += err;
      }
    }
    const out = sc.createImageData(sw, sh); const o = out.data;
    for (let i = 0; i < g.length; i++) {
      const c = g[i] > 0.5 ? LAMP_RGB : INK_RGB; o[i * 4] = c[0]; o[i * 4 + 1] = c[1]; o[i * 4 + 2] = c[2]; o[i * 4 + 3] = 255;
    }
    sc.putImageData(out, 0, 0);
    return small;
  }

  function render(id, W = 960, H = 640) {
    const key = id + '@' + W + 'x' + H;
    if (cache.has(key)) return cache.get(key);
    const paint = painters[id] || painters.fallback;
    const t = makeCanvas(W, H); const d = makeCanvas(W, H); const l = makeCanvas(W, H);
    const A = { t: t.getContext('2d'), d: d.getContext('2d'), l: l.getContext('2d'), W, H, R: SR.rng(id) };
    A.t.fillStyle = '#000'; A.t.fillRect(0, 0, W, H);
    try { paint(A, K); } catch (e) { console.error('Art painter failed:', id, e); }
    const out = makeCanvas(W, H); const o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    o.drawImage(dither(t, W, H, SR.hashStr(id)), 0, 0, W, H);
    o.drawImage(d, 0, 0); o.drawImage(l, 0, 0);
    cache.set(key, out);
    return out;
  }

  /** Copy a rendered scene onto a target canvas (keeps the cached original intact). */
  function drawInto(canvas, id) {
    const src = render(id, canvas.width, canvas.height);
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(src, 0, 0);
    return src;
  }

  /** Pre-render scenes during idle time so transitions stay smooth. */
  function preload(ids) {
    const queue = ids.filter((id) => painters[id] && !cache.has(id + '@960x640'));
    const step = () => {
      const id = queue.shift(); if (!id) return;
      render(id);
      (window.requestIdleCallback || setTimeout)(step, { timeout: 400 });
    };
    (window.requestIdleCallback || setTimeout)(step, { timeout: 400 });
  }

  SR.Art = { painters, render, drawInto, preload, has: (id) => !!painters[id] };
})();
