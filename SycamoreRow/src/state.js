/* Sycamore Row — game state, rules engine, persistence. No DOM. */
(function () {
  'use strict';
  const SR = window.SR;
  const ST = SR.Story;

  /* ---------------- storage ---------------- */
  const PREFIX = 'sycamore-row.';
  const Store = {
    get(k, fallback) { try { const v = localStorage.getItem(PREFIX + k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) { /* ignore */ } },
  };

  const DEFAULT_SETTINGS = { fullscreen: false, master: 0.8, ambience: 0.55, sfx: 0.8, largeText: false, highContrast: false, reduceMotion: false, textSpeed: 'fast' };
  const DEFAULT_PROGRESS = { endings: {}, levelStarts: {}, reached: 0, stars: {}, runs: 0 };

  const Game = {
    run: null,
    settings: Object.assign({}, DEFAULT_SETTINGS, Store.get('settings', {})),
    progress: Object.assign({}, DEFAULT_PROGRESS, Store.get('progress', {})),

    /* ---------- settings & progress ---------- */
    saveSettings() { Store.set('settings', this.settings); },
    saveProgress() { Store.set('progress', this.progress); },
    hasProgress() { return !!(this.hasSave() || this.progress.reached > 0 || Object.keys(this.progress.endings).length); },
    eraseAll() {
      Store.del('run'); Store.del('progress');
      this.run = null; this.progress = SR.clone(DEFAULT_PROGRESS);
    },

    /* ---------- runs ---------- */
    hasSave() { const r = Store.get('run', null); return !!(r && r.v === 1 && ST.SCENES[r.scene]); },
    savedSummary() {
      const r = Store.get('run', null); if (!r || !ST.SCENES[r.scene]) return null;
      return `Level ${r.level} · ${ST.LEVELS[r.level].name} — Day ${r.day}, ${ST.timeLabel(r)}`;
    },
    newRun() {
      const seed = Math.floor(Math.random() * 1e9);
      this.run = {
        v: 1, seed, scene: 'P1', arg: { card: 0 }, level: 1, day: 1,
        stats: { evidence: 0, trust: 1, threat: 0 }, visits: 0, done: {}, flags: {}, clues: [], newClues: [],
        last: {}, path: [], stars: {}, jury: 0, round: 1, moves: [], tries: 2, threatEvent: null, l2Evidence: 0,
      };
      this.progress.runs += 1;
      this.snapshot(1);
      this.save();
      return this.run;
    },
    load() {
      const r = Store.get('run', null);
      if (!r || r.v !== 1 || !ST.SCENES[r.scene]) return null;
      this.run = r; return r;
    },
    save() {
      if (!this.run || this.run.ended) return;
      this.run.savedAt = Date.now();
      Store.set('run', this.run);
      SR.bus.emit('saved');
    },
    snapshot(level) {
      const snap = SR.clone(this.run); snap.scene = ST.LEVEL_START[level]; snap.arg = level === 1 ? { card: 0 } : {};
      this.progress.levelStarts[level] = snap;
      this.progress.reached = Math.max(this.progress.reached, level);
      this.saveProgress();
    },
    canReplay(level) { return !!this.progress.levelStarts[level]; },
    replayLevel(level) {
      const snap = this.progress.levelStarts[level]; if (!snap) return false;
      this.run = SR.clone(snap); this.run.ended = false;
      this.save(); return true;
    },

    /* ---------- view & choices ---------- */
    view() {
      const r = this.run; const fn = ST.SCENES[r.scene];
      const v = fn(r);
      v.scene = r.scene; v.level = r.level;
      v.hint = ST.HINTS[r.scene] || 'Read the scene carefully. Locked choices tell you what they need.';
      v.options = (v.options || []).filter((o) => !o.hidden || o.id === v.skip).map((o, i) => o);
      return v;
    },
    /** Apply a choice. Returns { locked } or { events, result, ended }. */
    choose(optId, extra) {
      const r = this.run; const v = ST.SCENES[r.scene](r);
      const opt = (v.options || []).find((o) => o.id === optId);
      if (!opt) return { invalid: true };
      if (opt.locked) return { locked: opt.locked, help: opt.lockHelp };
      const fx = makeFx(this, r);
      const fromScene = r.scene; const fromLevel = r.level;
      const result = opt.act(r, fx, extra);
      fx._after.forEach((f) => f());
      // choice log, for the results case board ("which choice sent you down this branch")
      if (!opt.back && !/^(next|map|go|r2|r3|verdict|results|board|dusk|lost)$/.test(opt.id) && !/^C[2-6]$/.test(opt.id)) {
        const dThreat = fx.events.filter((e) => e.type === 'stat' && e.k === 'threat').reduce((a, e) => a + e.d, 0);
        (r.log = r.log || []).push({ scene: fromScene, level: fromLevel, id: opt.id, label: opt.label, dThreat, gain: fromLevel === 5 && r.last ? r.last.gain : undefined });
      }
      if (fx._level) this.startLevel(fx._level);
      if (fx._replay) { this.replayLevel(fx._replay); return { events: fx.events, replay: fx._replay }; }
      if (fx._ending) { this.finish(fx._ending); return { events: fx.events, ended: fx._ending, result }; }
      if (fx._go) { r.scene = fx._go.scene; r.arg = fx._go.arg || {}; }
      if (fx._level) this.snapshot(fx._level);
      this.save();
      return { events: fx.events, result, go: fx._go, stay: fx._stay };
    },
    startLevel(n) {
      const r = this.run;
      if (r.level === 1 && n === 2) r.stars[1] = 3;
      r.level = n;
      if (n === 2) { r.day = 1; r.visits = 0; r.l2Evidence = r.stats.evidence; }
      if (n === 3) { // someone has noticed your digging: the threat itself raises Threat
        r.day = 3; r.tries = 2; r.threatEvent = SR.rng(r.seed)() < 0.5 ? 'note' : 'brick';
        r.stats.threat = Math.min(ST.THREAT_MAX - 1, r.stats.threat + 1);
      }
      if (n === 4) r.day = 4;
      if (n === 5) { r.day = 5; r.jury = ST.startBelief(r); r.round = 1; r.moves = []; }
    },
    finish(endingId) {
      const r = this.run;
      r.ending = endingId; r.ended = true;
      if (endingId === 'runout' || endingId === 'deal') r.path.push(endingId === 'runout' ? 'Run out of town' : 'The quiet deal');
      this.progress.endings[endingId] = true;
      for (const k in r.stars) this.progress.stars[k] = Math.max(this.progress.stars[k] || 0, r.stars[k]);
      this.saveProgress();
      Store.del('run');
      r.scene = 'E1';
    },
    markCluesSeen() { if (this.run) { this.run.newClues = []; this.save(); } },
  };

  function makeFx(game, r) {
    const fx = {
      events: [], _after: [],
      stat(k, d) {
        const old = r.stats[k]; const max = k === 'threat' ? ST.THREAT_MAX : 99;
        r.stats[k] = SR.clamp(old + d, 0, max);
        const real = r.stats[k] - old;
        fx.events.push({ type: 'stat', k, d: real });
      },
      clue(id) { if (!r.clues.includes(id)) { r.clues.push(id); r.newClues.push(id); fx.events.push({ type: 'clue', id }); } },
      flag(f, v = true) { r.flags[f] = v; },
      path(s) { r.path.push(s); },
      visit() { r.visits += 1; r.day = r.visits >= 4 ? 2 : 1; },
      go(scene, arg, opts) { fx._go = { scene, arg, opts: opts || {} }; },
      stay() { fx._stay = true; },
      level(n) { fx._level = n; },
      replay(n) { fx._replay = n; },
      ending(id) { fx._ending = id; },
      after(f) { fx._after.push(f); },
    };
    return fx;
  }

  /* ---------------- results (E1) ---------------- */
  Game.resultsView = function () {
    const r = this.run; const E = ST.ENDINGS[r.ending];
    const levels = [1, 2, 3, 4, 5].map((n) => ({ n, name: ST.LEVELS[n].name, stars: r.stars[n] == null ? null : r.stars[n] }));
    // the case board: one entry per clue group; found shows what you found, missed shows the first of the group
    const board = ST.CASE_BOARD.map((group) => {
      const found = group.find((id) => r.clues.includes(id));
      return { id: found || group[0], text: ST.CLUE_SHORT[found || group[0]], found: !!found };
    });
    const caseBoard = { clues: board, found: board.filter((c) => c.found).length, total: board.length, branch: ST.branchFor(r) };
    return { ending: r.ending, title: E.title, text: E.text, art: E.art, stats: Object.assign({}, r.stats), levels, path: r.path.slice(), caseBoard,
      gallery: ST.ENDING_ORDER.map((id) => ({ id, title: ST.ENDINGS[id].title, art: ST.ENDINGS[id].art, hint: ST.ENDINGS[id].hint, riddle: ST.ENDINGS[id].riddle, seen: !!this.progress.endings[id], current: id === r.ending })) };
  };

  SR.Store = Store;
  SR.Game = Game;
})();
