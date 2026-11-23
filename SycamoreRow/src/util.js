/* Sycamore Row — shared utilities. Exposes window.SR namespace. */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});

  /** Create a DOM element. h('div.class#id', {attrs}, children...) */
  function h(sel, props, ...kids) {
    const m = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, n) => {
      if (t === '.') el.classList.add(n); else el.id = n;
    });
    if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
      kids.unshift(props);
      props = null;
    }
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className += ' ' + v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    appendKids(el, kids);
    return el;
  }
  function appendKids(el, kids) {
    for (const k of kids) {
      if (k == null || k === false) continue;
      if (Array.isArray(k)) appendKids(el, k);
      else el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  }

  /** Parse an SVG string into a DOM node. */
  function svg(str) {
    const t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.firstChild;
  }

  /** Deterministic PRNG (mulberry32). */
  function rng(seed) {
    let a = typeof seed === 'string' ? hashStr(seed) : seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  /** Tiny event bus. */
  const bus = {
    map: {},
    on(ev, fn) { (this.map[ev] = this.map[ev] || []).push(fn); return () => this.off(ev, fn); },
    off(ev, fn) { this.map[ev] = (this.map[ev] || []).filter((f) => f !== fn); },
    emit(ev, data) { (this.map[ev] || []).slice().forEach((f) => f(data)); },
  };

  function reducedMotion() {
    return document.documentElement.classList.contains('reduce-motion');
  }

  /** Read a design token (CSS custom property on :root), e.g. token('lamp') → '#e6e1d6'.
   *  Canvas and data-URI code use this so colours live only in styles/main.css. */
  const tokenCache = {};
  function token(name, fallback = '') {
    if (tokenCache[name]) return tokenCache[name];
    const v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
    if (v) tokenCache[name] = v;
    return v || fallback;
  }
  function hexRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  Object.assign(SR, { h, svg, rng, hashStr, clamp, lerp, wait, clone, nextFrame, bus, reducedMotion, token, hexRgb });
})();
