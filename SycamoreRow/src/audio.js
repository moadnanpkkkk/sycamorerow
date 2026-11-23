/* Sycamore Row — procedural audio. Every sound is synthesised with WebAudio: ambience beds
 * (wind, cicadas, crickets, courthouse clock, organ drone) and short feedback cues. */
(function () {
  'use strict';
  const SR = window.SR;
  let ctx = null; let master; let ambBus; let sfxBus; let noiseBuf;
  let current = null; let currentMood = null; let lastHover = 0;
  // warped-record effect for high Threat: pitch wow on every bed + needle skips on the ambience
  let skipGain; let wowDepth; let wowRate; let warpWanted = false; let skipTimer = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(ctx.destination);
    master = ctx.createGain(); master.connect(comp);
    skipGain = ctx.createGain(); skipGain.connect(master);
    ambBus = ctx.createGain(); ambBus.connect(skipGain);
    const wow = ctx.createOscillator(); wow.frequency.value = 0.55; wow.start();
    wowDepth = ctx.createGain(); wowDepth.gain.value = 0; wow.connect(wowDepth);   // cents, for oscillator detune
    wowRate = ctx.createGain(); wowRate.gain.value = 0; wow.connect(wowRate);      // ratio, for noise playbackRate
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) { // pinkish noise
      const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
    }
    applyVolumes();
    if (currentMood) { const m = currentMood; currentMood = null; mood(m); }
    if (warpWanted) { warpWanted = false; setWarp(true); }
    return true;
  }

  /** Threat 4+: the ambience wobbles and skips like a warped record. */
  function setWarp(on) {
    if (!ctx) { warpWanted = on; return; }
    if (on === warpWanted && (on ? skipTimer : !skipTimer)) return;
    warpWanted = on;
    const t = ctx.currentTime;
    wowDepth.gain.setTargetAtTime(on ? 38 : 0, t, 0.8);
    wowRate.gain.setTargetAtTime(on ? 0.045 : 0, t, 0.8);
    clearTimeout(skipTimer); skipTimer = null;
    skipGain.gain.cancelScheduledValues(t); skipGain.gain.setTargetAtTime(1, t, 0.05);
    if (!on) return;
    const skip = () => {
      if (!warpWanted) return;
      if (ctx.state === 'running') {
        const s = ctx.currentTime; const g = skipGain.gain;
        // the needle jumps: two short drop-outs, the second shorter
        g.setValueAtTime(1, s); g.setValueAtTime(0.0001, s + 0.01); g.setValueAtTime(1, s + 0.08);
        g.setValueAtTime(0.0001, s + 0.2); g.setValueAtTime(1, s + 0.245);
        burst(s + 0.01, 0.02, 1800, 3, 0.05, 'bandpass', ambBus);
      }
      skipTimer = setTimeout(skip, 2200 + Math.random() * 2600);
    };
    skipTimer = setTimeout(skip, 900);
  }
  function applyVolumes() {
    if (!ctx) return; const s = SR.Game.settings;
    master.gain.setTargetAtTime(s.master, ctx.currentTime, 0.05);
    ambBus.gain.setTargetAtTime(s.ambience, ctx.currentTime, 0.1);
    sfxBus.gain.setTargetAtTime(s.sfx, ctx.currentTime, 0.05);
  }
  const now = () => ctx.currentTime;
  function noise(loop = true) { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = loop; return n; }
  function env(g, t, a, peak, dcy, sus = 0) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + dcy); }
  function tone(freq, t, dur, type = 'sine', peak = 0.2, out = sfxBus, attack = 0.005) {
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    o.connect(g); g.connect(out); env(g, t, attack, peak, dur); o.start(t); o.stop(t + attack + dur + 0.05); return o;
  }
  function bell(freq, t, dur = 1.6, peak = 0.12) { [1, 2.76, 5.4].forEach((m, i) => tone(freq * m, t, dur / (i + 1), 'sine', peak / (i + 1.4))); }
  function burst(t, dur, freq, q, peak, type = 'bandpass', out = sfxBus) {
    const n = noise(false); const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); n.connect(f); f.connect(g); g.connect(out); env(g, t, 0.003, peak, dur); n.start(t, Math.random() * 2); n.stop(t + dur + 0.05);
    return f;
  }

  /* ---------------- feedback cues ---------------- */
  const SFX = {
    hover() { const t = now(); if (t - lastHover < 0.045) return; lastHover = t; burst(t, 0.03, 2600, 4, 0.05); },
    focus() { SFX.hover(); },
    select() { const t = now(); burst(t, 0.05, 900, 2, 0.18); tone(392, t, 0.25, 'triangle', 0.09); tone(588, t + 0.03, 0.3, 'sine', 0.05); },
    confirm() { const t = now(); burst(t, 0.06, 700, 1.5, 0.16); tone(196, t, 0.9, 'triangle', 0.14); tone(294, t + 0.02, 0.8, 'sine', 0.08); bell(784, t + 0.05, 1.2, 0.05); },
    back() { const t = now(); burst(t, 0.05, 600, 2, 0.12); tone(294, t, 0.25, 'triangle', 0.08); tone(220, t + 0.06, 0.3, 'triangle', 0.07); },
    locked() { const t = now(); tone(92, t, 0.25, 'sine', 0.3); burst(t, 0.12, 300, 1, 0.16, 'lowpass'); tone(233, t + 0.02, 0.18, 'square', 0.025); tone(220, t + 0.12, 0.2, 'square', 0.022); },
    page() { const t = now(); const f = burst(t, 0.38, 1400, 0.8, 0.12); f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.32); },
    clue() { const t = now(); const f = burst(t, 0.3, 3000, 3, 0.08); f.frequency.setValueAtTime(2200, t); f.frequency.linearRampToValueAtTime(4200, t + 0.28); bell(1046, t + 0.25, 1.6, 0.07); bell(1568, t + 0.38, 1.4, 0.05); },
    up() { const t = now(); bell(659, t, 1, 0.07); bell(988, t + 0.12, 1.2, 0.07); },
    down() { const t = now(); tone(330, t, 0.4, 'triangle', 0.08); tone(247, t + 0.14, 0.6, 'triangle', 0.08); },
    threat() {
      const t = now(); tone(58, t, 0.22, 'sine', 0.45); tone(54, t + 0.28, 0.3, 'sine', 0.38);
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
      o1.type = o2.type = 'sawtooth'; o1.frequency.value = 73; o2.frequency.value = 77.5; f.type = 'lowpass'; f.frequency.value = 380;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(sfxBus); env(g, t, 0.5, 0.07, 1.4); o1.start(t); o2.start(t); o1.stop(t + 2.2); o2.stop(t + 2.2);
    },
    insight() { const t = now(); [587, 698, 880, 1175, 1397].forEach((f, i) => bell(f, t + i * 0.11, 1.8, 0.06)); },
    gavel() { const t = now(); [0, 0.32].forEach((d) => { tone(120, t + d, 0.25, 'sine', 0.5); burst(t + d, 0.06, 1800, 1, 0.3); tone(240, t + d, 0.12, 'triangle', 0.12); }); },
    fail() { const t = now(); [220, 196, 165].forEach((f, i) => { const o = tone(f, t + i * 0.32, 0.9, 'sawtooth', 0.04); }); tone(82, t, 2, 'sine', 0.12); },
    open() { SFX.page(); },
    thunk() { // a rubber stamp hitting paper
      const t = now(); tone(110, t, 0.12, 'sine', 0.22); burst(t, 0.05, 700, 1.2, 0.12, 'lowpass');
    },
    ink() { // a low, wet swell as the ink spreads
      const t = now(); const f = burst(t, 0.42, 260, 0.9, 0.09, 'lowpass'); f.frequency.setValueAtTime(180, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.36);
    },
    snap() { // a taut thread parting, then the slack falling
      const t = now(); tone(880, t, 0.06, 'triangle', 0.08); burst(t, 0.03, 4200, 2, 0.14);
      const f = burst(t + 0.05, 0.3, 900, 1.2, 0.05); f.frequency.setValueAtTime(900, t + 0.05); f.frequency.exponentialRampToValueAtTime(260, t + 0.34);
    },
    voice() { // a soft, wordless murmur when someone starts to speak
      const t = now();
      [0, 0.11, 0.2].forEach((d, i) => { const f = burst(t + d, 0.09, 420 + i * 90, 5, 0.035); f.frequency.setValueAtTime(380 + i * 70, t + d); f.frequency.linearRampToValueAtTime(520 + i * 40, t + d + 0.08); });
    },
    close() { const t = now(); const f = burst(t, 0.25, 1200, 0.8, 0.08); f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.22); },
    stinger(kind) {
      const t = now(); const good = kind === 'justice' || kind === 'stands';
      const chord = good ? [147, 220, 294, 370, 440] : [147, 220, 262, 311];
      chord.forEach((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.connect(sfxBus); env(g, t + i * 0.08, 1.2, 0.06, 3.5); o.start(t); o.stop(t + 6); });
      if (good) bell(880, t + 0.6, 2.4, 0.06);
    },
  };

  /* ---------------- ambience beds ---------------- */
  function drone(out, notes, cutoff, vol) {
    const nodes = []; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = vol; f.connect(g); g.connect(out);
    const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 0.05; lg.gain.value = cutoff * 0.35; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo);
    notes.forEach((n, i) => { [0, 0.18].forEach((det) => { const o = ctx.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = n * (1 + det / 100); wowDepth.connect(o.detune); o.connect(f); o.start(); nodes.push(o); }); });
    return nodes;
  }
  function wind(out, vol, freq = 400) {
    const n = noise(); wowRate.connect(n.playbackRate); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = vol; n.connect(f); f.connect(g); g.connect(out);
    const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = freq * 0.5; lfo.connect(lg); lg.connect(f.frequency);
    const lfo2 = ctx.createOscillator(); const lg2 = ctx.createGain(); lfo2.frequency.value = 0.11; lg2.gain.value = vol * 0.6; lfo2.connect(lg2); lg2.connect(g.gain);
    n.start(0, Math.random() * 2); lfo.start(); lfo2.start(); return [n, lfo, lfo2];
  }
  function insects(out, vol, freq, rate, depth) {
    const n = noise(); wowRate.connect(n.playbackRate); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 6;
    const g = ctx.createGain(); g.gain.value = 0; const am = ctx.createOscillator(); am.type = 'square'; am.frequency.value = rate;
    const amg = ctx.createGain(); amg.gain.value = vol * depth; am.connect(amg); amg.connect(g.gain);
    const base = ctx.createConstantSource ? ctx.createConstantSource() : null;
    if (base) { base.offset.value = vol * (1 - depth); base.connect(g.gain); base.start(); }
    n.connect(f); f.connect(g); g.connect(out); n.start(0, Math.random() * 2); am.start();
    const slow = ctx.createOscillator(); const sg = ctx.createGain(); slow.frequency.value = 0.09; sg.gain.value = vol * 0.5; slow.connect(sg); sg.connect(g.gain); slow.start();
    return [n, am, slow].concat(base ? [base] : []);
  }
  function scheduler(out, fn, every, jitter) {
    let alive = true; let timer;
    const loop = () => { if (!alive) return; try { fn(out); } catch (e) { /* ignore */ } timer = setTimeout(loop, (every + Math.random() * jitter) * 1000); };
    timer = setTimeout(loop, (1 + Math.random() * jitter) * 1000);
    return { stop() { alive = false; clearTimeout(timer); } };
  }
  const BEDS = {
    menu(out) { return [drone(out, [73.4, 110, 146.8, 174.6], 600, 0.05), wind(out, 0.16, 350), scheduler(out, (o) => bellAmb(o, 293.7), 16, 10)]; },
    dusk(out) { return [drone(out, [73.4, 110, 164.8], 500, 0.04), wind(out, 0.2, 320), insects(out, 0.03, 4600, 18, 0.6)]; },
    town(out) { return [drone(out, [87.3, 130.8], 420, 0.025), wind(out, 0.08, 500), insects(out, 0.05, 5200, 38, 0.8), scheduler(out, (o) => bellAmb(o, 220), 30, 12)]; },
    night(out) { return [drone(out, [65.4, 98, 155.6], 380, 0.045), wind(out, 0.18, 280), insects(out, 0.035, 4300, 7, 0.95)]; },
    trial(out) { return [drone(out, [73.4, 110, 155.6], 360, 0.035), scheduler(out, tick, 1, 0), wind(out, 0.04, 700)]; },
    dawn(out) { return [drone(out, [73.4, 110, 146.8, 185, 220], 900, 0.04), wind(out, 0.1, 500), scheduler(out, (o) => bellAmb(o, 440), 9, 6)]; },
    grey(out) { return [drone(out, [65.4, 98, 116.5], 300, 0.045), wind(out, 0.2, 260)]; },
  };
  function bellAmb(out, f) { const t = now(); [1, 2.76, 5.4].forEach((m, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = f * m; o.connect(g); g.connect(out); env(g, t, 0.01, 0.05 / (i + 1), 4 / (i + 1)); o.start(t); o.stop(t + 5); }); }
  function tick(out) { const t = now(); const n = noise(false); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = 8; const g = ctx.createGain(); n.connect(f); f.connect(g); g.connect(out); env(g, t, 0.001, 0.12, 0.03); n.start(t, Math.random()); n.stop(t + 0.06); }

  function mood(name) {
    if (name === currentMood) return;
    currentMood = name;
    if (!ctx) return;
    const t = now();
    if (current) {
      const old = current; old.gain.gain.setTargetAtTime(0.0001, t, 0.6);
      setTimeout(() => { old.parts.flat().forEach((p) => { try { p.stop ? p.stop() : null; } catch (e) { /* already stopped */ } }); old.gain.disconnect(); }, 3000);
    }
    const bed = BEDS[name]; if (!bed) { current = null; return; }
    const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(ambBus); g.gain.setTargetAtTime(1, t, 0.9);
    current = { gain: g, parts: bed(g) };
  }

  function play(name, arg) { if (!ctx || ctx.state !== 'running') return; const f = SFX[name]; if (f) try { f(arg); } catch (e) { /* audio is best-effort */ } }

  SR.Audio = { init, play, mood, applyVolumes, setWarp, ready: () => !!ctx };
})();
