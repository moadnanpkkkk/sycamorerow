/* Sycamore Row — application shell: routing, overlays, input, fullscreen, boot. */
(function () {
  'use strict';
  const SR = window.SR;
  const { h, UI } = SR;
  const ST = SR.Story;
  const G = SR.Game;

  const App = {
    current: null, name: null, overlays: [], keyboardMode: false, transitioning: false,

    /* ---------------- boot ---------------- */
    boot() {
      const app = document.getElementById('app');
      document.body.prepend(SR.Orn.defs());
      document.body.prepend(SR.svg('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" style="fill:var(--panel)"/><line x1="0" y1="0" x2="0" y2="7" style="stroke:var(--lamp-mute);stroke-opacity:.45" stroke-width="2"/></pattern></defs></svg>'));
      UI.buildFrame(app);
      UI.motes(document.getElementById('motes'));
      this.applySettings();
      this.bindInput();
      this.bindNative();
      document.addEventListener('visibilitychange', () => { SR.bus.emit('visibility', document.hidden); });
      const start = () => this.go('splash', null, { instant: true });
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(start, start);
      SR.Art.preload(['hero', 'tree_dusk', 'the_will', 'clanton_night']);
    },
    applySettings() {
      const s = G.settings; const root = document.documentElement;
      root.classList.toggle('large-text', !!s.largeText);
      root.classList.toggle('high-contrast', !!s.highContrast);
      root.classList.toggle('reduce-motion', !!s.reduceMotion);
      SR.Audio.applyVolumes();
    },
    unlockAudio() { SR.Audio.init(); },

    /** Make Threat physical: red bleeds into the vignette, the frame cracks, motes hurry, audio warps at 4+. */
    setThreat(n) {
      n = Math.max(0, Math.min(ST.THREAT_MAX, n | 0));
      if (n === this.threat) return;
      this.threat = n;
      document.getElementById('app').style.setProperty('--threat', String(n / ST.THREAT_MAX));
      document.querySelectorAll('.frame-cracks path').forEach((p) => p.classList.toggle('on', Number(p.dataset.step) <= n));
      if (UI.motes.setUnrest) UI.motes.setUnrest(n);
      SR.Audio.setWarp(n >= ST.THREAT_MAX - 1);
    },
    threat: 0,

    /* ---------------- ink-wipe transition ---------------- */
    /** Organic ink blob: a jittered circle plus a few satellite droplets (viewBox 1600×900). */
    inkBlobs(seed) {
      const R = SR.rng(seed); const spots = [[800, 450, 1000], [260, 240, 420], [1340, 230, 400], [300, 720, 380], [1300, 700, 420], [800, 120, 300]];
      return spots.map(([cx, cy, r], i) => {
        // jittered outline, smoothed with quadratic curves through the midpoints so the edge reads as liquid
        const n = 22; const pts = [];
        for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const rr = r * (0.84 + R() * 0.26 + Math.sin(a * 3 + i) * 0.06); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        const midp = (p, q) => [((p[0] + q[0]) / 2).toFixed(0), ((p[1] + q[1]) / 2).toFixed(0)];
        let d = 'M' + midp(pts[n - 1], pts[0]).join(',');
        for (let k = 0; k < n; k++) { const p = pts[k]; d += ` Q${p[0].toFixed(0)},${p[1].toFixed(0)} ${midp(p, pts[(k + 1) % n]).join(',')}`; }
        for (let k = 0; k < 4; k++) { const a = R() * Math.PI * 2; const dr = r * (1.05 + R() * 0.25); const sr = 6 + R() * r * 0.05; d += `M${(cx + Math.cos(a) * dr + sr).toFixed(0)},${(cy + Math.sin(a) * dr).toFixed(0)} a${sr.toFixed(0)},${sr.toFixed(0)} 0 1,0 0.1,0`; }
        return `<g class="blob" style="--d:${i * 35}ms"><path d="${d}Z"/></g>`;
      }).join('');
    },
    buildInk() {
      const el = SR.svg(`<svg id="ink" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><mask id="ink-mask"><rect width="1600" height="900" fill="#fff"/><g class="holes" fill="#000"></g></mask></defs>
        <g class="cover"></g><rect class="sheet" width="1600" height="900" mask="url(#ink-mask)"/></svg>`);
      document.getElementById('app').append(el);
      return el;
    },
    /** Ink spreads until the screen is black. */
    async inkCover(slow) {
      const ink = this.ink || (this.ink = this.buildInk());
      this.inkToken = (this.inkToken || 0) + 1;
      ink.classList.add('on'); ink.classList.remove('revealing');
      if (SR.reducedMotion()) { ink.classList.add('flat'); await SR.wait(120); return; }
      ink.classList.remove('flat');
      const cover = ink.querySelector('.cover'); cover.innerHTML = this.inkBlobs(Date.now() & 0xffff);
      const anims = [...cover.children].map((g, i) => g.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: slow ? 620 : 380, delay: i * 35, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' }));
      SR.Audio.play('ink');
      await Promise.all(anims.map((a) => a.finished)).catch(() => {});
    },
    /** The next screen shows through spreading holes in the ink. */
    async inkReveal() {
      const ink = this.ink; if (!ink) return;
      const token = this.inkToken;
      if (SR.reducedMotion() || ink.classList.contains('flat')) { ink.classList.remove('on', 'flat'); return; }
      const holes = ink.querySelector('.holes'); holes.innerHTML = this.inkBlobs((Date.now() >> 3) & 0xffff);
      ink.querySelector('.cover').innerHTML = ''; ink.classList.add('revealing');
      const anims = [...holes.children].map((g, i) => g.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.05)' }], { duration: 520, delay: i * 30, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'forwards' }));
      await Promise.all(anims.map((a) => a.finished)).catch(() => {});
      if (token !== this.inkToken) return; // a newer transition has taken over the ink
      ink.classList.remove('on', 'revealing'); holes.innerHTML = '';
    },

    /* ---------------- routing ---------------- */
    async go(name, params, opts = {}) {
      if (this.transitioning) return;
      this.transitioning = true;
      const host = document.getElementById('screen');
      const wiped = !opts.instant && this.current;
      if (wiped) await this.inkCover(opts.slow);
      this.closeAllOverlays(true);
      if (this.current && this.current.cleanup) this.current.cleanup();
      if ((name === 'game' || name === 'chapter') && !G.run && !G.load()) name = 'menu';
      if (name === 'results' && !(G.run && G.run.ended)) name = 'menu';
      // Threat only weighs on the case itself (and the ending it caused)
      if (name !== 'game' && !(name === 'results' && G.run && G.run.ending === 'runout')) this.setThreat(0);
      let scr;
      try {
        scr = SR.Screens[name](params || {});
        host.innerHTML = ''; host.append(scr.el);
        this.current = scr; this.name = name;
        if (scr.onEnter) scr.onEnter();
      } catch (err) { // never leave the player on a black screen
        console.error('Screen failed:', name, err);
        scr = SR.Screens.menu(); host.innerHTML = ''; host.append(scr.el); this.current = scr; this.name = 'menu';
        UI.toast('Something went wrong — your case is saved.');
      }
      if (scr.onClick) scr.el.addEventListener('click', scr.onClick);
      if (scr.onClickStage) scr.el.addEventListener('click', (e) => { if (!e.target.closest('button')) scr.onClickStage(); });
      await SR.nextFrame();
      if (wiped) this.inkReveal(); // runs on while the new screen fades in
      if (scr.focusFirst && this.keyboardMode) this.focus(scr.focusFirst);
      this.transitioning = false;
    },
    /** Enter the game screen (optionally via a chapter card for the current level). */
    startGame(continuing, opts = {}) {
      const r = G.run;
      const chapter = opts.chapter || (!continuing && r.scene === 'P1' ? 1 : null) || (continuing ? r.level : null);
      if (chapter) this.go('chapter', { level: chapter, then: () => { this.transitioning = false; this.go('game'); } });
      else this.go('game');
    },

    /* ---------------- overlays ---------------- */
    openOverlay(build, opts = {}) {
      const ov = h('div.overlay');
      const card = UI.corners(h('div.card' + (opts.narrow ? '.narrow' : ''), { role: 'dialog', 'aria-modal': 'true' }));
      card.append(SR.svg(SR.Orn.keyStrip()));
      const api = { el: ov, card, onKey: null, close: () => this.closeOverlay(api), prevFocus: document.activeElement, onClose: opts.onClose };
      build(card, api);
      ov.append(card);
      ov.addEventListener('mousedown', (e) => { if (e.target === ov && !opts.modal) api.close(); });
      document.getElementById('app').append(ov);
      this.overlays.push(api);
      SR.Audio.play('open');
      const first = (opts.focus && card.querySelector(opts.focus)) || card.querySelector('.opt.primary') || card.querySelector('.tab.on') || card.querySelector('.opt') || card.querySelector('button');
      if (first) this.focus(first, !this.keyboardMode);
      return api;
    },
    closeOverlay(api, silent) {
      const i = this.overlays.indexOf(api); if (i < 0) return;
      this.overlays.splice(i, 1);
      if (!silent) SR.Audio.play('close');
      api.el.classList.add('closing');
      setTimeout(() => api.el.remove(), silent ? 0 : 190);
      if (api.onClose) api.onClose();
      if (api.prevFocus && document.contains(api.prevFocus) && this.keyboardMode) this.focus(api.prevFocus);
    },
    closeAllOverlays(silent) { [...this.overlays].reverse().forEach((o) => this.closeOverlay(o, silent)); },
    /** Yes/no dialog. Enter activates the focused button; destructive dialogs focus Cancel by default. */
    confirm(title, text, okLabel = 'Confirm', cancelLabel = 'Cancel', danger = false) {
      return new Promise((resolve) => {
        let answered = false;
        const done = (v) => { if (answered) return; answered = true; resolve(v); };
        this.openOverlay((card, api) => {
          const pick = (o) => { SR.Audio.play(o.id === 'ok' ? 'confirm' : 'back'); done(o.id === 'ok'); api.close(); };
          card.append(h('h2.heading', { text: title }), SR.svg(SR.Orn.divider()), h('p', { text, style: { textAlign: 'center' } }),
            h('div.card-actions',
              UI.button({ id: 'cancel', label: cancelLabel, key: 'Esc', center: true, primary: danger }, pick),
              UI.button({ id: 'ok', label: okLabel, key: danger ? null : 'Enter', primary: !danger, center: true }, pick)));
        }, { narrow: true, modal: danger, focus: danger ? '[data-id="cancel"]' : '[data-id="ok"]', onClose: () => done(false) });
      });
    },
    openHint() {
      if (!G.run || this.overlays.length) return;
      const v = G.view();
      this.openOverlay((card, api) => {
        const strip = UI.dialogue(['harry', v.hint]); strip.querySelector('.d-line').classList.add('done');
        card.append(h('div.eyebrow.center', { text: `Hint · Level ${G.run.level}` }), h('h2.heading', { text: 'A Word from Harry Rex' }), SR.svg(SR.Orn.divider()),
          strip, h('div.card-actions', UI.button({ id: 'close', label: 'Close', key: 'Esc', primary: true, center: true }, () => api.close())));
      }, { narrow: true });
    },
    openNotebook(tab = 'clues') {
      if (!G.run) return;
      if (this.overlays.length) { const top = this.overlays[this.overlays.length - 1]; if (top.kind === 'notebook') return; }
      const r = G.run;
      const ov = this.openOverlay((card, api) => {
        api.kind = 'notebook';
        const tabs = h('div.tabs', { role: 'tablist' });
        const body = h('div.card-body');
        const TABS = [['clues', 'Clues', '1'], ['people', 'People', '2'], ['case', 'The Case', '3']];
        const show = (k) => {
          tabs.querySelectorAll('.tab').forEach((t) => { const on = t.dataset.k === k; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); });
          body.innerHTML = '';
          if (k === 'clues') body.append(clueList(r));
          if (k === 'people') body.append(peopleGrid(r));
          if (k === 'case') body.append(casePage(r));
          body.scrollTop = 0;
        };
        TABS.forEach(([k, label, key]) => { const t = h('button.tab', { type: 'button', role: 'tab', dataset: { k } }, label, h('span.k', { text: key })); t.addEventListener('click', () => { SR.Audio.play('page'); show(k); }); tabs.append(t); });
        card.append(h('h2.heading', { text: 'Notebook' }), tabs, body, h('div.card-actions', UI.button({ id: 'close', label: 'Close', key: 'Esc', primary: true, center: true }, () => api.close())));
        show(tab);
        api.onKey = (e) => { const i = ['1', '2', '3'].indexOf(e.key); if (i >= 0) { SR.Audio.play('page'); show(TABS[i][0]); return true; } if (e.key.toLowerCase() === 'n') { api.close(); return true; } return false; };
      }, { onClose: () => { G.markCluesSeen(); const b = document.querySelector('.bottombar .badge'); if (b) b.remove(); } });
      return ov;
    },
    openPause() {
      if (this.overlays.length || !G.run) return;
      this.openOverlay((card, api) => {
        const list = h('div.options', { style: { margin: '1rem auto 0', width: '26rem' } });
        const opts = [
          { id: 'resume', label: 'Resume', key: 'Esc', primary: true },
          { id: 'notebook', label: 'Notebook', key: 'N' },
          { id: 'settings', label: 'Settings', key: '3' },
          { id: 'restart', label: 'Restart this level', key: '4', sub: `Level ${G.run.level} · ${ST.LEVELS[G.run.level].name}` },
          { id: 'title', label: 'Save & return to title', key: '5', sub: 'Your case is saved automatically' },
        ];
        if (window.native && window.native.isDesktop) opts.push({ id: 'quit', label: 'Save & quit to desktop', key: '6' });
        const pick = async (o) => {
          if (o.id === 'resume') { api.close(); return; }
          if (o.id === 'notebook') { api.close(); setTimeout(() => this.openNotebook(), 60); return; }
          if (o.id === 'settings') { SR.Audio.play('select'); this.openSettingsOverlay(); return; }
          if (o.id === 'restart') {
            const lv = G.run.level;
            if (await this.confirm(`Restart Level ${lv}?`, `You will return to the start of ${ST.LEVELS[lv].name} with the record you had then.`, 'Restart')) { G.replayLevel(lv); this.closeAllOverlays(true); this.startGame(false, { chapter: lv }); }
            return;
          }
          if (o.id === 'title') { G.save(); SR.Audio.play('back'); this.go('menu'); return; }
          if (o.id === 'quit') { G.save(); window.native.quit(); }
        };
        opts.forEach((o) => list.append(UI.button(o, pick)));
        card.append(h('h2.heading', { text: 'Paused' }), SR.svg(SR.Orn.divider()),
          h('div.eyebrow', { text: `Level ${G.run.level} · ${ST.LEVELS[G.run.level].name} · Day ${G.run.day}, ${ST.timeLabel(G.run)}`, style: { textAlign: 'center' } }), list);
        api.onKey = (e) => {
          const k = e.key.toLowerCase();
          if (k === 'n') { pick({ id: 'notebook' }); return true; }
          const map = { 3: 'settings', 4: 'restart', 5: 'title', 6: 'quit' }; if (map[k] && opts.find((o) => o.id === map[k])) { pick({ id: map[k] }); return true; }
          return false;
        };
      }, { narrow: true });
    },
    openSettingsOverlay() {
      this.openOverlay((card, api) => {
        card.style.width = 'min(76rem, 92vw)';
        card.append(h('h2.heading', { text: 'Settings' }), SR.svg(SR.Orn.divider()), h('div.card-body', SR.Screens.settingsPanel()),
          h('div.card-actions', UI.button({ id: 'close', label: 'Done', key: 'Esc', primary: true, center: true }, () => api.close())));
      });
    },

    /* ---------------- feedback helpers ---------------- */
    lockedFeedback(btn, tipHost, help) {
      SR.Audio.play('locked');
      if (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); }
      if (tipHost && help) { tipHost.innerHTML = ''; tipHost.append(h('div.lock-tip', { text: help })); }
    },
    focus(el, preventVisible) { if (!el) return; try { el.focus({ preventScroll: true, focusVisible: !preventVisible }); } catch (e) { el.focus(); } },

    /* ---------------- fullscreen ---------------- */
    isFullscreen() { return window.native && window.native.isDesktop ? !!G.settings.fullscreen : !!document.fullscreenElement; },
    async setFullscreen(on) {
      try {
        if (window.native && window.native.isDesktop) { const v = await window.native.setFullscreen(on); G.settings.fullscreen = !!v; }
        else if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen();
        else if (!on && document.fullscreenElement) await document.exitFullscreen();
      } catch (e) { UI.toast('Fullscreen is not available here'); }
      G.settings.fullscreen = this.isFullscreen(); G.saveSettings(); SR.bus.emit('fullscreen');
    },
    toggleFullscreen() { this.setFullscreen(!this.isFullscreen()); },
    bindNative() {
      document.addEventListener('fullscreenchange', () => { if (!(window.native && window.native.isDesktop)) { G.settings.fullscreen = !!document.fullscreenElement; G.saveSettings(); SR.bus.emit('fullscreen'); } });
      if (window.native && window.native.isDesktop) {
        window.native.onFullscreen((v) => { G.settings.fullscreen = !!v; G.saveSettings(); SR.bus.emit('fullscreen'); });
        if (G.settings.fullscreen) window.native.setFullscreen(true);
      }
    },

    /* ---------------- input ---------------- */
    bindInput() {
      window.addEventListener('mousedown', () => { this.keyboardMode = false; }, true);
      // every button press leaves a tiny ink blot where it was pressed (keyboard presses blot from the centre)
      window.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('button'); if (b && !b.disabled) UI.inkBlot(b, e.clientX, e.clientY); }, true);
      window.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.tagName === 'BUTTON') { const r = document.activeElement.getBoundingClientRect(); UI.inkBlot(document.activeElement, r.left + r.width / 2, r.top + r.height / 2); }
      }, true);
      window.addEventListener('keydown', (e) => this.onKey(e));
      window.addEventListener('contextmenu', (e) => e.preventDefault());
      document.addEventListener('focusin', (e) => { if (this.keyboardMode && e.target.matches('.opt, .tab, .lvl, .note-card, .tip, .toggle button, .seg button')) SR.Audio.play('focus'); });
    },
    activeLayer() { return this.overlays.length ? this.overlays[this.overlays.length - 1].card : document.getElementById('screen'); },
    onKey(e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) this.keyboardMode = true;
      // global keys
      if (e.key === 'F11' || (e.key === 'Enter' && e.altKey)) { e.preventDefault(); this.toggleFullscreen(); return; }
      if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) { e.preventDefault(); return; } // no accidental reloads mid-case
      if (this.name === 'splash' || this.name === 'chapter') { if (!e.repeat && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) { e.preventDefault(); this.current.onKey(e); } return; }
      if (this.transitioning) { e.preventDefault(); return; }
      if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !(e.target && e.target.tagName === 'INPUT')) { this.toggleMute(); return; }
      const layer = this.activeLayer();
      const top = this.overlays[this.overlays.length - 1];
      if (top) {
        if (top.onKey && top.onKey(e)) { e.preventDefault(); return; }
        if (e.key === 'Escape') { e.preventDefault(); top.close(); return; }
      } else if (this.current && this.current.onKey && this.current.onKey(e)) { e.preventDefault(); return; }
      // number keys pick options in the active layer
      if (/^[1-9]$/.test(e.key) && !e.repeat) {
        const btn = layer.querySelector(`.opt .opt-key`) && [...layer.querySelectorAll('.opt')].find((b) => { const k = b.querySelector('.opt-key'); return k && k.textContent === e.key && !b.closest('.waiting'); });
        if (btn) { e.preventDefault(); btn.click(); return; }
      }
      if (e.key === 'Escape' && (this.name === 'files' || this.name === 'settings')) { e.preventDefault(); SR.Audio.play('back'); this.go('menu'); return; }
      // arrow navigation among focusables in the active layer
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (e.target && e.target.tagName === 'INPUT' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
        const items = [...layer.querySelectorAll('button:not([disabled]), input')].filter((b) => b.offsetParent !== null && !b.closest('.waiting'));
        if (!items.length) return;
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        const dir = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1;
        const next = i < 0 ? (layer.querySelector('.opt.primary:not(.locked)') || items[0]) : items[(i + dir + items.length) % items.length];
        this.focus(next);
        return;
      }
      if (e.key === 'Enter' && (!document.activeElement || document.activeElement === document.body)) {
        const p = layer.querySelector('.opt.primary:not(.locked)');
        if (p && !p.closest('.waiting')) { e.preventDefault(); p.click(); }
      }
    },
    toggleMute() {
      const s = G.settings;
      if (s.master > 0) { s._lastMaster = s.master; s.master = 0; UI.toast('Sound muted · press M to unmute'); }
      else { s.master = s._lastMaster || 0.8; UI.toast('Sound on'); }
      G.saveSettings(); SR.Audio.applyVolumes();
    },
  };

  /* ---------------- notebook pages ---------------- */
  function clueList(r) {
    if (!r.clues.length) return h('div.empty', { text: 'No clues yet. Seth’s last line is the only lead: “Ask about the tree.”' });
    const ul = h('ul.clue-list');
    r.clues.slice().reverse().forEach((id) => {
      const c = ST.CLUES[id]; const isNew = r.newClues.includes(id);
      ul.append(h('li' + (isNew ? '.new' : ''), h('div.ico', UI.icon(c.icon)), h('div', h('div.t', { text: c.text }), h('div.s', { text: c.src }, isNew ? h('span.newtag', { text: '· new' }) : null))));
    });
    return ul;
  }
  function peopleGrid(r) {
    const g = h('div.people');
    ST.PEOPLE.forEach((p) => {
      if (p.needs && !r.flags[p.needs]) return;
      const notes = (p.more || []).filter(([f]) => r.flags[f]).map(([, t]) => h('em', { text: ' ' + t }));
      g.append(h('div.person', UI.mirror(p.art), h('div.n', { text: p.name }), h('div.r', { text: p.role }), h('div.b', { text: p.base }, notes)));
    });
    return g;
  }
  const OBJECTIVES = {
    1: 'Find your first clue to Seth’s last line: “Ask about the tree.”',
    2: `Gather at least 4 Evidence in Clanton before your ${ST.VISITS} visits run out. Keep Threat below 5.`,
    3: 'Answer the threat, then connect the clues that explain the sycamore.',
    4: 'Decide: settle tonight, or face the jury tomorrow.',
    5: 'Win the jury. 6+ belief upholds the will; 7+ with the whole truth brings justice.',
  };
  function casePage(r) {
    const progress = r.level === 2 ? `${ST.VISITS - r.visits} of ${ST.VISITS} visits left.` : r.level === 5 ? `Round ${r.round} of 3 · jury belief ${r.jury}/8.` : '';
    return h('div.case-grid',
      h('div', h('h4', { text: 'Objective' }), h('p', { text: OBJECTIVES[r.level] + (progress ? ' ' + progress : '') })),
      h('div', h('h4', { text: 'Your record' }), h('p', { text: `◈ Evidence ${r.stats.evidence}   ❦ Trust ${r.stats.trust}   ⚠ Threat ${r.stats.threat}/5` })),
      h('div', h('h4', { text: '◈ Evidence' }), h('p', { text: 'What you can prove. You need 4 to leave Clanton, and it sets how much the jury believes you at the start of the trial.' })),
      h('div', h('h4', { text: '❦ Trust' }), h('p', { text: 'How far people will go for you. Ozzie opens his files at Trust 2; Lettie takes the stand at Trust 3.' })),
      h('div', h('h4', { text: '⚠ Threat' }), h('p', { text: 'How much attention you draw. Confrontations and digging raise it. At 5, you are run out of town.' })),
      h('div', h('h4', { text: 'Controls' }), h('div.keys', h('kbd', { text: '1–5' }), h('span', { text: 'Choose' }), h('kbd', { text: 'N' }), h('span', { text: 'Notebook' }), h('kbd', { text: 'H' }), h('span', { text: 'Hint' }), h('kbd', { text: 'Esc' }), h('span', { text: 'Pause' }), h('kbd', { text: 'F11' }), h('span', { text: 'Fullscreen' }))));
  }

  SR.App = App;
  window.addEventListener('DOMContentLoaded', () => App.boot());
})();
