/* Sycamore Row — screens. Each screen returns { el, onKey?, onEnter?, cleanup? }. */
(function () {
  'use strict';
  const SR = window.SR;
  const { h, UI } = SR;
  const ST = SR.Story;
  const G = SR.Game;
  const Screens = {};
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  const TAGLINE = { 1: 'A will, a ladder, a tree.', 2: 'Eight visits. Every door costs time.', 3: 'Someone wants you to stop.', 4: 'One envelope. One choice.', 5: 'Twelve strangers. Three rounds.' };
  const LEVEL_DESC = {
    1: 'Seth Hubbard’s death, his handwritten will, and your first clue.',
    2: 'Eight visits around Clanton to gather Evidence and earn Trust.',
    3: 'Answer a threat, then piece together what happened in 1964.',
    4: 'The settlement offer arrives the night before the trial.',
    5: 'Three rounds before the jury, and the verdict.',
  };

  /* ================================================================ splash */
  Screens.splash = () => {
    const leaf = SR.svg(`<svg class="leafmark" viewBox="0 0 100 100" aria-hidden="true">${SR.Orn.leaf(50, 88, 0.85, 0)}</svg>`);
    const el = h('div.screen.splash', h('div.inner.fade-in', leaf, SR.Orn.sparkTitle(h('h1.title', { text: 'Sycamore Row' })), h('p.subtitle', { text: 'A Southern Gothic mystery in five levels' }), h('div.press', { text: 'Press any key' })));
    return { el, onKey: () => { SR.App.unlockAudio(); SR.App.go('menu'); return true; }, onClick: () => { SR.App.unlockAudio(); SR.App.go('menu'); } };
  };

  /* ================================================================ main menu */
  Screens.menu = () => {
    SR.Audio.mood('menu');
    const gw = SR.Orn.greatWindow();
    SR.Art.drawInto(gw.canvas, 'hero');
    const has = G.hasSave(); const summary = G.savedSummary();
    const opts = [
      { id: 'continue', label: 'Continue', sub: has ? summary : null, primary: has, locked: has ? null : 'no case in progress', lockHelp: 'Start a new case first — the game saves automatically after every choice.' },
      { id: 'new', label: 'New case', sub: has ? 'Begin again from the prologue' : 'Begin at the sycamore', primary: !has },
      { id: 'files', label: 'Case files', sub: 'Replay levels · endings gallery' },
      { id: 'settings', label: 'Settings', sub: 'Display, sound, text and accessibility' },
    ];
    if (window.native && window.native.isDesktop) opts.push({ id: 'quit', label: 'Quit to desktop' });
    const list = h('div.options');
    const tip = h('div');
    const pick = async (o, btn) => {
      if (o.locked) return SR.App.lockedFeedback(btn, tip, o.lockHelp);
      if (o.id === 'continue') { SR.Audio.play('confirm'); G.load(); SR.App.startGame(true); }
      if (o.id === 'new') {
        if (has && !(await SR.App.confirm('Begin a new case?', 'Your case in progress will be closed. Endings you have seen and levels you have reached stay in your Case Files.', 'Begin anew'))) return;
        SR.Audio.play('confirm'); G.newRun(); SR.App.startGame(false);
      }
      if (o.id === 'files') { SR.Audio.play('select'); SR.App.go('files'); }
      if (o.id === 'settings') { SR.Audio.play('select'); SR.App.go('settings'); }
      if (o.id === 'quit') { SR.Audio.play('back'); setTimeout(() => window.native.quit(), 250); }
    };
    opts.forEach((o, i) => list.append(UI.button(Object.assign({ key: String(i + 1) }, o), pick)));
    const el = h('div.screen.menu',
      h('div.hero', gw.el),
      h('div.side.fade-in', h('div.eyebrow', { text: 'Ford County, Mississippi · 1988' }), SR.Orn.sparkTitle(h('h1.title', { text: 'Sycamore Row' })), h('p.subtitle', { text: 'A Southern Gothic mystery in five levels' }),
        SR.svg(SR.Orn.divider('branch')), list, tip),
      h('div.menu-foot', h('span', { text: 'v1.0' }), h('span', { text: '↑ ↓ choose · Enter confirm · F11 fullscreen' })));
    return { el, focusFirst: list.querySelector('.opt.primary') || list.querySelector('.opt') };
  };

  /* ================================================================ chapter card */
  Screens.chapter = ({ level, then }) => {
    SR.Audio.play('page');
    const icon = SR.Orn.windowIcon(SR.Orn.LEVEL_WINDOW[level], 'lit');
    icon.classList.add('chapter-icon');
    const el = h('div.screen.splash', h('div.inner.fade-in', icon, h('div.eyebrow', { text: `Level ${ROMAN[level]}` }), SR.Orn.sparkTitle(h('h1.title', { text: ST.LEVELS[level].name, style: { fontSize: '5.6rem' } })), h('p.subtitle', { text: TAGLINE[level] }), h('div.press', { text: 'Press any key', style: { marginTop: '1rem' } })));
    let gone = false; const go = () => { if (gone) return; gone = true; then(); };
    const timer = setTimeout(go, 2600);
    return { el, onKey: () => { go(); return true; }, onClick: go, cleanup: () => clearTimeout(timer) };
  };

  /* ================================================================ the game */
  Screens.game = () => {
    const run = G.run;
    let hud = UI.hud(run);
    let frameLevel = run.level;
    let win = UI.artFrame(frameLevel);
    const artCol = h('div.art-col', win.el);
    const textCol = h('div.text-col');
    const skipHost = h('div.skip-host');
    const stage = h('div.stage', artCol, textCol);
    const notebookBtn = UI.button({ id: 'nb', label: 'Notebook', key: 'N', small: true, badge: run.newClues.length > 0 }, () => SR.App.openNotebook());
    const hintBtn = UI.button({ id: 'hint', label: 'Hint', key: 'H', small: true }, () => SR.App.openHint());
    const menuBtn = UI.button({ id: 'menu', label: 'Menu', key: 'Esc', small: true }, () => SR.App.openPause());
    const saved = h('span.saved', { text: '❦ Saved' });
    const where = h('span');
    const bottom = h('div.bottombar', h('div.left', notebookBtn, hintBtn, menuBtn), h('div.status', where, saved));
    const root = h('div.screen.game', hud, h('div', { style: { position: 'relative', minHeight: 0, display: 'grid' } }, stage, skipHost), bottom);

    let busy = false; let revealer = null; let view = null; let selected = []; let optionsEl = null; let tipEl = null;
    const offSaved = SR.bus.on('saved', () => { saved.classList.add('on'); clearTimeout(saved._t); saved._t = setTimeout(() => saved.classList.remove('on'), 1600); });

    function refreshHud(events) {
      const nh = UI.hud(G.run); hud.replaceWith(nh); hud = nh;
      SR.App.setThreat(G.run.stats.threat);
      (events || []).forEach((e) => { if (e.type === 'stat') UI.bumpStat(hud, e.k, e.d); });
      const b = notebookBtn.querySelector('.badge');
      if (G.run.newClues.length && !b) notebookBtn.append(h('span.badge')); else if (!G.run.newClues.length && b) b.remove();
    }

    function render(first) {
      view = G.view(); selected = [];
      SR.Audio.mood(ST.LEVELS[view.level].mood);
      SR.App.setThreat(G.run.stats.threat);
      // the frame's crest carries the level's window silhouette
      if (view.level !== frameLevel) { frameLevel = view.level; const nw = UI.artFrame(frameLevel); win.el.replaceWith(nw.el); win = nw; }
      UI.showArt(win, view.art, first);
      where.textContent = `Day ${G.run.day} · ${ST.timeLabel(G.run)}`;

      textCol.innerHTML = ''; skipHost.innerHTML = '';
      const col = h('div.fade-in');
      if (view.sub) col.append(h('div.eyebrow', { text: view.sub }));
      col.append(h('h2.heading', { text: view.heading }), SR.svg(SR.Orn.divider()));
      if (view.meter) col.append(UI.meter(view.meter));
      const story = UI.storyText(view.text); col.append(story);
      const dlg = view.say ? UI.dialogue(view.say) : null;
      if (dlg) { dlg.classList.add('pending'); col.append(dlg); }
      const after = h('div');
      if (view.tips) after.append(h('div.tips', view.tips.map((t) => {
        const b = h('button.tip', { type: 'button', 'aria-expanded': 'false' }, h('div.q', { text: `${{ evidence: '◈', trust: '❦', threat: '⚠' }[t.k]}  ${t.q}` }), h('div.a', { text: t.a }));
        b.addEventListener('click', () => { const o = b.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); SR.Audio.play(o ? 'page' : 'close'); });
        b.addEventListener('mouseenter', () => SR.Audio.play('hover'));
        return b;
      })));
      if (view.kind === 'board') after.append(buildBoard());
      const clueEl = view.clue ? UI.clueBox(view.clue) : null;
      if (clueEl) after.append(clueEl);
      if (view.chips && view.chips.length) after.append(UI.chips(view.chips));
      if (view.note) after.append(h('div.note', { text: view.note }));
      if (view.stars != null) after.append(UI.stars(view.stars));
      if (view.pager) { const pg = h('div.pager', { 'aria-label': `Card ${view.pager.i + 1} of ${view.pager.n}` }); for (let i = 0; i < view.pager.n; i++) { const s = h('span'); s.append(SR.Orn.windowIcon('lancet', i <= view.pager.i ? 'lit' : 'open')); pg.append(s); } after.append(pg); }
      after.style.display = 'none';
      col.append(after);
      optionsEl = h('div.options.waiting');
      const visible = view.options.filter((o) => o.id !== view.skip);
      visible.forEach((o, i) => optionsEl.append(UI.button(Object.assign({ key: String(i + 1) }, o), pick)));
      tipEl = h('div');
      col.append(optionsEl, tipEl);
      textCol.append(col);
      if (view.skip) {
        const sk = h('button.skip-link', { type: 'button', text: 'Skip prologue  ›' });
        sk.addEventListener('click', () => pick(view.options.find((o) => o.id === view.skip)));
        skipHost.append(sk);
      }
      const dLine = dlg && dlg.querySelector('.d-line');
      revealer = UI.revealChain([story, dLine], (el) => { if (el === dLine) { dlg.classList.remove('pending'); SR.Audio.play('voice'); } });
      revealer.done.then(() => {
        if (!textCol.contains(story)) return;
        after.style.display = '';
        if (clueEl) setTimeout(() => { SR.Audio.play('clue'); UI.starBurst(clueEl); }, 150);
        optionsEl.classList.remove('waiting');
        if (SR.App.keyboardMode) SR.App.focus(optionsEl.querySelector('.opt.primary:not(.locked)') || optionsEl.querySelector('.opt:not(.locked)'));
        revealer = null;
      });
      if (view.scene === 'T1') setTimeout(() => SR.Audio.play('threat'), 600);
      SR.Art.preload(nextArts());
    }
    function nextArts() {
      const r = G.run; const ids = [];
      if (r.scene === 'P1') ids.push('the_will', 'clanton_night', 'crossroads');
      if (r.scene === 'P2') ids.push('lettie_door', 'seth_drawer', 'scarred_tree');
      if (r.level === 2) ids.push('town_map', 'lettie_porch', 'sheriff_office', 'law_office', 'records_room', 'confront');
      if (r.level === 3) ids.push('r_ignored', 'r_deputy', 'r_public', 'clue_board', 'tree_land', 'torn_notes');
      if (r.level >= 4) ids.push('courthouse_dawn', 'courtroom', 'witness_stand', 'closing', 'm_expert', 'm_lettie', 'm_deeds');
      return ids;
    }

    /* ---- the deduction board: torn notes pinned to cork, joined by a red thread ---- */
    let boardEl = null; let threadPts = null;
    function tornEdge(R) { // jagged top edge as a clip-path polygon
      const pts = ['0% 100%', '0% ' + (4 + R() * 6).toFixed(1) + '%'];
      for (let x = 6; x < 100; x += 5 + R() * 5) pts.push(`${x.toFixed(1)}% ${(R() * 9).toFixed(1)}%`);
      pts.push('100% ' + (3 + R() * 6).toFixed(1) + '%', '100% 100%');
      return `polygon(${pts.join(', ')})`;
    }
    function buildBoard() {
      boardEl = h('div.board', { role: 'group', 'aria-label': 'Clue board' });
      view.cards.forEach((c, i) => {
        const R = SR.rng(G.run.seed + c.id);
        const paper = h('span.paper', { style: { clipPath: tornEdge(R) } }, h('span.note-text', { text: c.text }), h('span.num', { text: String.fromCharCode(65 + i) }));
        const b = h('button.note-card', { type: 'button', dataset: { id: c.id }, 'aria-pressed': 'false', 'aria-label': `Note ${String.fromCharCode(65 + i)}: ${c.text}`,
          style: { '--rot': ((R() - 0.5) * 5.5).toFixed(2) + 'deg', '--dx': ((R() - 0.5) * 0.8).toFixed(2) + 'rem', '--dy': ((R() - 0.5) * 0.6).toFixed(2) + 'rem' } },
        paper, h('span.pin'));
        b.addEventListener('mouseenter', () => SR.Audio.play('hover'));
        b.addEventListener('click', () => toggleCard(c.id, b));
        boardEl.append(b);
      });
      boardEl.append(SR.svg('<svg class="board-string" aria-hidden="true"></svg>'));
      return h('div', boardEl, h('div.tries', { text: view.tries >= 2 ? 'Two tries · pick two notes, then Link them (or press A–D)' : 'Last try — choose carefully' }));
    }
    function toggleCard(id, b) {
      if (busy) return;
      const i = selected.indexOf(id);
      if (i >= 0) selected.splice(i, 1); else { if (selected.length >= 2) selected.shift(); selected.push(id); }
      boardEl.querySelectorAll('.note-card').forEach((n) => { const on = selected.includes(n.dataset.id); n.classList.toggle('sel', on); n.setAttribute('aria-pressed', String(on)); });
      SR.Audio.play(selected.includes(id) ? 'select' : 'back');
      drawString(true);
      const link = optionsEl.querySelector('[data-id="link"]');
      if (link) { link.querySelector('.opt-sub').textContent = selected.length === 2 ? 'Pin these two together' : `Pick ${2 - selected.length} more note${selected.length === 1 ? '' : 's'}`; }
    }
    /** Draw a sagging thread from pin to pin, animating it out of the first pin. */
    function drawString(animate) {
      const s = boardEl.querySelector('.board-string'); s.innerHTML = ''; threadPts = null;
      if (selected.length !== 2) return;
      const box = boardEl.getBoundingClientRect();
      const [a, b] = selected.map((id) => { const r = boardEl.querySelector(`[data-id="${id}"] .pin`).getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; });
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.min(40, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.12)]; // gravity sag
      if (Math.abs(b[0] - a[0]) < 40) mid[0] += box.width * 0.07; // a vertical thread bows out past the notes' text
      threadPts = { a, b, mid };
      s.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      s.innerHTML = `<path class="thread" d="M${a[0]},${a[1]} Q${mid[0]},${mid[1] + 8} ${b[0]},${b[1]}" pathLength="1"/>`;
      if (animate && !SR.reducedMotion()) s.firstChild.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 320, easing: 'ease-out' });
    }
    /** Wrong pair: the thread snaps in the middle and both halves fall. */
    async function snapThread() {
      const s = boardEl.querySelector('.board-string'); if (!threadPts) return;
      const { a, b, mid } = threadPts;
      s.innerHTML = `<path class="thread" d="M${a[0]},${a[1]} Q${(a[0] + mid[0]) / 2},${mid[1] + 4} ${mid[0] - 3},${mid[1]}"/><path class="thread" d="M${b[0]},${b[1]} Q${(b[0] + mid[0]) / 2},${mid[1] + 4} ${mid[0] + 3},${mid[1]}"/>`;
      SR.Audio.play('snap');
      if (SR.reducedMotion()) { s.innerHTML = ''; return; }
      const [p1, p2] = s.children;
      p1.style.transformOrigin = `${a[0]}px ${a[1]}px`; p2.style.transformOrigin = `${b[0]}px ${b[1]}px`;
      const fall = (el, dir) => el.animate([{ transform: 'rotate(0)', opacity: 1 }, { transform: `rotate(${dir * 38}deg)`, opacity: 1, offset: 0.55 }, { transform: `rotate(${dir * 62}deg) translateY(1.2rem)`, opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.4,0,.9,.6)', fill: 'forwards' }).finished;
      await Promise.all([fall(p1, a[0] < b[0] ? 1 : -1), fall(p2, a[0] < b[0] ? -1 : 1)]).catch(() => {});
    }
    /** Right pair: the thread pulses once, then burns in. */
    async function burnThread() {
      const p = boardEl.querySelector('.board-string .thread'); if (!p) return;
      p.classList.add('burnt');
      if (SR.reducedMotion()) return;
      await p.animate([{ strokeWidth: 1.8, filter: 'drop-shadow(0 0 0 transparent)' }, { strokeWidth: 4.5, filter: 'drop-shadow(0 0 6px var(--blood-glow))', offset: 0.35 }, { strokeWidth: 2.6 }], { duration: 560, easing: 'ease-out' }).finished.catch(() => {});
    }

    /* ---- choosing ---- */
    async function pick(o, btn) {
      if (!o || busy) return;
      if (revealer) { revealer.finish(); return; }
      if (o.locked) { SR.App.lockedFeedback(btn, tipEl, o.lockHelp); return; }
      if (o.needsPair && selected.length !== 2) { SR.App.lockedFeedback(btn, tipEl, 'Pick two notes on the board first.'); return; }
      busy = true;
      SR.Audio.play(o.primary ? 'confirm' : (o.back ? 'back' : 'select'));
      const prevLevel = G.run.level;
      const res = G.choose(o.id, o.needsPair ? selected.slice() : undefined);
      feedbackSounds(res.events || []);
      if (res.ended) { await SR.wait(350); busy = false; SR.App.go('results', null, { slow: true }); return; }
      if (res.replay) { busy = false; UI.toast('Clanton begins again — Day 1, Morning'); SR.App.startGame(false, { chapter: res.replay }); return; }
      if (o.needsPair && res.result) { // the thread decides
        if (res.result.ok) { await burnThread(); SR.Audio.play('insight'); }
        else { boardEl.classList.add('wrong'); await snapThread(); }
      }
      if (res.stay) { // wrong link, one try left
        tipEl.innerHTML = ''; tipEl.append(h('div.lock-tip', { text: 'The thread won’t hold — these two notes don’t explain the tree. One more try.' }));
        await SR.wait(900); busy = false; render(false); return;
      }
      if (G.run.level !== prevLevel) { busy = false; SR.App.startGame(false, { chapter: G.run.level }); return; }
      const soft = res.go && res.go.opts && res.go.opts.soft;
      if (soft) SR.Audio.play('page');
      await crossfade();
      refreshHud(res.events);
      render(false);
      const trust = (res.events || []).find((e) => e.type === 'stat' && e.k === 'trust' && e.d);
      if (trust) setTimeout(() => UI.stamp(win.el, `${trust.d > 0 ? '+' : '−'}${Math.abs(trust.d)} Trust`), 260);
      busy = false;
    }
    function feedbackSounds(events) {
      const threatUp = events.some((e) => e.type === 'stat' && e.k === 'threat' && e.d > 0);
      const up = events.some((e) => e.type === 'stat' && e.d > 0 && e.k !== 'threat') || events.some((e) => e.type === 'stat' && e.k === 'threat' && e.d < 0);
      const down = events.some((e) => e.type === 'stat' && e.d < 0 && e.k !== 'threat');
      if (threatUp) setTimeout(() => SR.Audio.play('threat'), 120);
      else if (down) setTimeout(() => SR.Audio.play('down'), 120);
      else if (up) setTimeout(() => SR.Audio.play('up'), 180);
    }
    async function crossfade() {
      if (SR.reducedMotion()) return;
      const anim = textCol.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
      await anim.finished.catch(() => {}); anim.cancel();
    }

    function onKey(e) {
      if (revealer && (e.key === ' ' || e.key === 'Enter')) { revealer.finish(); return true; }
      const k = e.key.toLowerCase();
      if (k === 'n') { SR.App.openNotebook(); return true; }
      if (k === 'h') { SR.App.openHint(); return true; }
      if (k === 'escape') { SR.App.openPause(); return true; }
      if (view && view.skip && k === 's') { pick(view.options.find((o) => o.id === view.skip)); return true; }
      if (view && view.kind === 'board' && /^[a-d]$/.test(k)) { const b = boardEl.querySelectorAll('.note-card')[k.charCodeAt(0) - 97]; if (b) toggleCard(b.dataset.id, b); return true; }
      return false;
    }

    return {
      el: root,
      onEnter: () => { render(true); },
      onKey,
      onClickStage: () => { if (revealer) revealer.finish(); },
      cleanup: () => { offSaved(); },
      rerender: () => { refreshHud([]); render(true); },
    };
  };

  /* ================================================================ results */
  Screens.results = () => {
    const R = G.resultsView();
    SR.Audio.mood(ST.ENDINGS[R.ending].mood);
    setTimeout(() => { SR.Audio.play(R.ending === 'justice' || R.ending === 'stands' ? 'gavel' : 'fail'); setTimeout(() => SR.Audio.play('stinger', R.ending), 700); }, 300);
    const win = UI.artFrame(0);
    const artCol = h('div.art-col', win.el);
    const seen = R.gallery.filter((g) => g.seen).length;
    const summary = h('div.summary');
    const starStr = (n) => { const s = h('span.v'); if (n == null) { s.append(h('span.off', { text: '—' })); return s; } for (let i = 0; i < 3; i++) s.append(h('span' + (i < n ? '' : '.off'), { text: i < n ? '★' : '☆' })); return s; };
    summary.append(h('span.k', { text: 'Final record' }), h('span.v', { text: `◈ ${R.stats.evidence} Evidence · ❦ ${R.stats.trust} Trust · ⚠ ${R.stats.threat} Threat`, style: { letterSpacing: '.04em', color: 'var(--lamp-hi)' } }));
    R.levels.forEach((l) => summary.append(h('span.k', { text: `Level ${ROMAN[l.n]} · ${l.name}` }), starStr(l.stars)));
    const list = h('div.options');
    const pick = (o) => {
      if (o.id === 'again') { SR.Audio.play('confirm'); G.newRun(); SR.App.startGame(false); }
      if (o.id === 'files') { SR.Audio.play('select'); SR.App.go('files'); }
      if (o.id === 'menu') { SR.Audio.play('back'); SR.App.go('menu'); }
    };
    [{ id: 'again', label: 'Play again', sub: 'A new case from the prologue', primary: true }, { id: 'files', label: 'Case files', sub: 'Replay any level' }, { id: 'menu', label: 'Main menu' }]
      .forEach((o, i) => list.append(UI.button(Object.assign({ key: String(i + 1) }, o), pick)));
    // the case board: found clues pinned sharp, missed ones blurred, and the turning point on its own note
    const CB = R.caseBoard;
    const caseBoard = h('section.caseboard', { 'aria-label': 'Case board' },
      h('div.cb-head', h('span', { text: 'Case board' }), h('span.cb-count', { text: `${CB.found} of ${CB.total} clues found` })),
      h('ul.cb-list', CB.clues.map((c) => h('li' + (c.found ? '' : '.missed'), { 'aria-label': c.found ? c.text : 'Missed clue' }, h('span.cb-pin'), h('span.cb-text', { text: c.text, 'aria-hidden': c.found ? null : 'true' }), c.found ? null : h('span.cb-tag', { text: 'missed' })))),
      h('div.cb-turn', h('span.cb-pin.red'), h('div', h('div.cb-turn-k', { text: 'The turning point' }), h('div.cb-turn-l', { text: CB.branch.label }), h('div.cb-turn-w', { text: CB.branch.why }))));
    const el = h('div.screen.results',
      h('div.left', artCol, h('div.left-foot', summary, h('div.path', h('b', { text: 'Your path' }), R.path.join('  →  ') || '—'))),
      h('div.right.fade-in', h('div.eyebrow', { text: `Ending · ${seen} of 6 discovered` }), h('h1.ending-name', { text: R.title }), SR.svg(SR.Orn.divider()),
        h('p.story', { text: R.text, style: { minHeight: 0 } }), caseBoard, list));
    return { el, onEnter: () => { UI.showArt(win, R.art); if (R.ending === 'runout') SR.App.setThreat(ST.THREAT_MAX); }, focusFirst: list.querySelector('.opt.primary') };
  };

  /** The endings as a wall of hung, worn picture frames (3×2). Undiscovered ones hang cracked and empty. */
  const BRACKETS = '<svg class="pf-brackets" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">'
    + [[0, 0, 1, 1], [100, 0, -1, 1], [100, 125, -1, -1], [0, 125, 1, -1]].map(([x, y, sx, sy]) => `<path d="M${x},${y + sy * 13} V${y} H${x + sx * 13}"/><circle cx="${x + sx * 4.5}" cy="${y + sy * 4.5}" r="1.3"/>`).join('') + '</svg>';
  function portraitWall(items) {
    const wall = h('div.pwall', { role: 'list', 'aria-label': 'Endings gallery' });
    items.forEach((it) => {
      const R = SR.rng('wall' + it.id);
      const pic = h('div.pf-pic');
      if (it.seen) { const c = h('canvas', { width: 480, height: 320 }); requestAnimationFrame(() => SR.Art.drawInto(c, it.art)); pic.append(c); }
      else pic.append(SR.svg(`<svg class="pf-crack" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true"><path d="${crackPath(R)}"/></svg>`));
      const frame = h('div.pframe' + (it.seen ? '' : '.empty') + (it.current ? '.current' : ''), { style: { '--tilt': ((R() - 0.5) * 3.2).toFixed(2) + 'deg' } },
        h('span.pf-cord', { 'aria-hidden': 'true' }), pic, SR.svg(BRACKETS));
      wall.append(h('div.pw-item', { role: 'listitem', 'aria-label': it.seen ? it.title : `Undiscovered ending. ${it.riddle}` }, frame,
        h('div.pw-plaque', { text: it.seen ? it.title : 'Undiscovered' }),
        h('div.pw-riddle', { text: it.seen ? '' : it.riddle })));
    });
    return wall;
  }
  function crackPath(R) { // glass cracked from one blow, off-centre
    const cx = 30 + R() * 40; const cy = 35 + R() * 50; let d = '';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + R() * 0.5; let x = cx; let y = cy; d += `M${cx.toFixed(1)},${cy.toFixed(1)}`;
      for (let s = 0; s < 4; s++) { x += Math.cos(a + (R() - 0.5) * 0.7) * (8 + R() * 10); y += Math.sin(a + (R() - 0.5) * 0.7) * (8 + R() * 12); d += ` L${x.toFixed(1)},${y.toFixed(1)}`; }
    }
    const ring = []; for (let i = 0; i <= 9; i++) { const a = (i / 9) * Math.PI * 2; ring.push(`${(cx + Math.cos(a) * (6 + R() * 3)).toFixed(1)},${(cy + Math.sin(a) * (7 + R() * 3)).toFixed(1)}`); }
    return d + ' M' + ring.join(' L');
  }

  function galleryEl(items, compact) {
    const g = h('div.gallery' + (compact ? '' : '.with-hints'));
    items.forEach((it) => {
      const thumb = h('div.thumb');
      if (it.seen) { const c = h('canvas', { width: 480, height: 320 }); SR.Art.drawInto(c, it.art); thumb.append(c, SR.svg(`<svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="${SR.Orn.WINDOWS.lancet.clip}" class="win-outline"/></svg>`)); }
      else thumb.append(SR.svg(`<svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="${SR.Orn.WINDOWS.lancet.clip}"/></svg>`));
      g.append(h('div.tile' + (it.seen ? '' : '.locked') + (it.current ? '.current' : ''), { title: it.seen ? it.title : `Locked — ${it.hint}` }, thumb, h('div.tt', { text: it.seen ? it.title : 'Locked' }), compact ? null : h('div.hint', { text: it.seen ? '' : it.hint })));
    });
    return g;
  }

  /* ================================================================ case files */
  Screens.files = () => {
    SR.Audio.mood('menu');
    const facade = h('div.facade', { role: 'listbox', 'aria-label': 'Levels' });
    const detail = h('div.lvl-detail');
    let sel = Math.max(1, Math.min(5, G.progress.reached || 1));
    const btns = [];
    for (let n = 1; n <= 5; n++) {
      const ok = G.canReplay(n); const st = G.progress.stars[n];
      const stars = h('div.st'); for (let i = 0; i < 3; i++) stars.append(h('span' + (st != null && i < st ? '' : '.off'), { text: st != null && i < st ? '★' : '☆' }));
      const b = h('button.lvl' + (ok ? '' : '.locked'), { type: 'button', role: 'option', dataset: { n } }, SR.Orn.windowIcon(SR.Orn.LEVEL_WINDOW[n], ok ? 'lit' : 'dark'), h('div.ln', { text: `Level ${ROMAN[n]}` }), h('div.nm', { text: ST.LEVELS[n].name }), stars);
      b.addEventListener('click', () => { sel = n; SR.Audio.play('select'); update(); });
      b.addEventListener('mouseenter', () => SR.Audio.play('hover'));
      b.addEventListener('dblclick', () => replay(n));
      btns.push(b); facade.append(b);
    }
    const tip = h('div');
    async function replay(n) {
      if (!G.canReplay(n)) return;
      if (G.hasSave() && !(await SR.App.confirm(`Replay Level ${ROMAN[n]}?`, 'This replaces your case in progress with the start of the level, as you last reached it.', 'Replay'))) return;
      SR.Audio.play('confirm'); G.replayLevel(n); SR.App.startGame(false, { chapter: n });
    }
    function update() {
      btns.forEach((b, i) => { b.classList.toggle('sel', i + 1 === sel); b.setAttribute('aria-selected', String(i + 1 === sel)); });
      detail.innerHTML = '';
      const ok = G.canReplay(sel);
      detail.append(h('p', { text: ok ? LEVEL_DESC[sel] : `Reach Level ${ROMAN[sel]} in a case to unlock it here.` }),
        UI.button({ id: 'replay', label: `Replay Level ${ROMAN[sel]}`, sub: ok ? ST.LEVELS[sel].name : null, primary: ok, locked: ok ? null : `reach Level ${ROMAN[sel]}`, center: true, key: 'Enter', lockHelp: 'Play a case until you reach this level.' }, (o, b) => (o.locked ? SR.App.lockedFeedback(b, tip, o.lockHelp) : replay(sel))), tip);
    }
    update();
    const back = UI.button({ id: 'back', label: 'Back', sub: 'Main menu', key: 'Esc', center: true }, () => { SR.Audio.play('back'); SR.App.go('menu'); });
    const seen = ST.ENDING_ORDER.filter((id) => G.progress.endings[id]).length;
    const wall = portraitWall(ST.ENDING_ORDER.map((id) => ({ id, title: ST.ENDINGS[id].title, art: ST.ENDINGS[id].art, riddle: ST.ENDINGS[id].riddle, seen: !!G.progress.endings[id] })));
    const el = h('div.screen.sub.files.fade-in', h('div.eyebrow', { text: 'Sycamore Row' }), h('h1.heading', { text: 'Case Files' }), SR.svg(SR.Orn.divider()),
      h('div.files-grid',
        h('section.files-col', h('div.gallery-title', { text: 'Levels' }), facade, detail, h('div.sub-actions', back)),
        h('section.files-col', h('div.gallery-title', { text: `Endings · ${seen} of 6 hung on the wall` }), wall)));
    return {
      el, focusFirst: btns[sel - 1],
      onKey: (e) => {
        if (e.key === 'Escape') { SR.Audio.play('back'); SR.App.go('menu'); return true; }
        if (document.activeElement && document.activeElement.classList.contains('lvl')) {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { sel = SR.clamp(sel + (e.key === 'ArrowRight' ? 1 : -1), 1, 5); update(); SR.App.focus(btns[sel - 1]); SR.Audio.play('focus'); return true; }
          if (e.key === 'Enter' || e.key === ' ') { const n = Number(document.activeElement.dataset.n); sel = n; update(); replay(n); return true; }
        }
        return false;
      },
    };
  };

  /* ================================================================ settings */
  Screens.settingsPanel = function () {
    const S = G.settings;
    const row = (lab, desc, ctrl) => h('div.set-row', h('div', h('div.lab', { text: lab }), desc ? h('div.desc', { text: desc }) : null), ctrl);
    const toggle = (key, onChange) => {
      const wrap = h('div.toggle', { role: 'radiogroup', 'aria-label': key });
      const mk = (val, label) => { const b = h('button', { type: 'button', role: 'radio', text: label }); b.addEventListener('click', () => { S[key] = val; G.saveSettings(); sync(); onChange && onChange(val); SR.Audio.play('select'); }); b.addEventListener('mouseenter', () => SR.Audio.play('hover')); return b; };
      const on = mk(true, 'On'); const off = mk(false, 'Off'); wrap.append(on, off);
      const sync = () => { on.classList.toggle('on', !!S[key]); off.classList.toggle('on', !S[key]); on.setAttribute('aria-checked', String(!!S[key])); off.setAttribute('aria-checked', String(!S[key])); };
      sync(); wrap._sync = sync; return wrap;
    };
    const slider = (key) => {
      const out = h('output'); const inp = h('input', { type: 'range', min: 0, max: 100, step: 5, value: Math.round(S[key] * 100), 'aria-label': key });
      const sync = () => { out.textContent = inp.value + '%'; inp.style.setProperty('--p', inp.value + '%'); };
      inp.addEventListener('input', () => { S[key] = inp.value / 100; sync(); SR.Audio.applyVolumes(); });
      inp.addEventListener('change', () => { G.saveSettings(); SR.Audio.play('select'); });
      sync(); return h('div.slider', inp, out);
    };
    const seg = (key, options) => {
      const wrap = h('div.seg', { role: 'radiogroup' });
      const bs = options.map(([val, label]) => { const b = h('button', { type: 'button', role: 'radio', text: label }); b.addEventListener('click', () => { S[key] = val; G.saveSettings(); sync(); SR.Audio.play('select'); }); return b; });
      const sync = () => bs.forEach((b, i) => { b.classList.toggle('on', S[key] === options[i][0]); b.setAttribute('aria-checked', String(S[key] === options[i][0])); });
      wrap.append(...bs); sync(); return wrap;
    };
    const fs = toggle('fullscreen', (v) => SR.App.setFullscreen(v));
    const offFs = SR.bus.on('fullscreen', () => { if (!document.contains(fs)) return offFs(); fs._sync(); });
    const erase = h('button.danger-btn', { type: 'button', text: 'Erase…', disabled: G.hasProgress() ? null : true, title: G.hasProgress() ? '' : 'Nothing to erase yet' });
    erase.addEventListener('click', async () => {
      if (!(await SR.App.confirm('Erase all progress?', 'Your case in progress, reached levels and discovered endings will be permanently deleted. Settings are kept. This cannot be undone.', 'Erase everything', 'Keep my progress', true))) return;
      G.eraseAll(); erase.disabled = true; UI.toast('All progress erased'); SR.Audio.play('back');
      SR.bus.emit('erased');
    });
    return h('div.settings',
      h('div.set-group', h('h4', { text: 'Display' }),
        row('Fullscreen', 'F11 or Alt+Enter at any time', fs),
        row('Reduce motion', 'Calmer transitions, no drifting motes', toggle('reduceMotion', () => SR.App.applySettings())),
        h('h4', { text: 'Text' }),
        row('Large text', 'Bigger story text and choices', toggle('largeText', () => SR.App.applySettings())),
        row('Text speed', 'How quickly story text appears', seg('textSpeed', [['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']])),
        row('High contrast', 'Brighter lines, no grain or vignette', toggle('highContrast', () => SR.App.applySettings()))),
      h('div.set-group', h('h4', { text: 'Sound' }),
        row('Master volume', null, slider('master')),
        row('Ambience', 'Wind, cicadas, crickets, the courthouse clock', slider('ambience')),
        row('Effects', 'Choices, clues and the gavel', slider('sfx')),
        h('h4', { text: 'Data' }),
        row('Erase all progress', 'Saves, unlocked levels and endings', erase),
        h('h4', { text: 'Controls' }),
        h('div.keys', { style: { padding: '.3rem .6rem' } },
          h('kbd', { text: '1–5' }), h('span', { text: 'Choose an option' }), h('kbd', { text: '↑ ↓' }), h('span', { text: 'Move between options · Enter to confirm' }),
          h('kbd', { text: 'N / H' }), h('span', { text: 'Notebook / Hint' }), h('kbd', { text: 'Esc' }), h('span', { text: 'Pause menu · back' }), h('kbd', { text: 'M' }), h('span', { text: 'Mute / unmute' }))));
  };
  Screens.settings = () => {
    SR.Audio.mood('menu');
    const back = UI.button({ id: 'back', label: 'Back', sub: 'Main menu', key: 'Esc', center: true }, () => { SR.Audio.play('back'); SR.App.go('menu'); });
    const el = h('div.screen.sub.fade-in', h('div.eyebrow', { text: 'Sycamore Row' }), h('h1.heading', { text: 'Settings' }), SR.svg(SR.Orn.divider()), Screens.settingsPanel(), h('div.sub-actions', back));
    return { el, onKey: (e) => { if (e.key === 'Escape') { SR.Audio.play('back'); SR.App.go('menu'); return true; } return false; } };
  };

  SR.Screens = Screens;
})();
