/* Sycamore Row — story data and rules. Pure game logic: no DOM here.
 * Every scene is a function (run) → view model. Options carry an act(run, fx) that mutates state
 * through the fx effects API, so the UI only ever renders views and forwards choices. */
(function () {
  'use strict';
  const SR = window.SR;

  const LEVELS = {
    1: { name: 'The Sycamore', mood: 'dusk' },
    2: { name: 'Clanton', mood: 'town' },
    3: { name: 'Pressure', mood: 'night' },
    4: { name: 'The Night Before', mood: 'night' },
    5: { name: 'The Trial', mood: 'trial' },
  };
  const TIMES = ['Morning', 'Midday', 'Afternoon', 'Evening'];
  const VISITS = 8;
  const THREAT_MAX = 5;

  /* ------------------------------------------------------------------ clues */
  const CLUES = {
    c_photo_wall: { text: 'A photograph on Lettie’s wall — a man she will not name.', src: 'Lettie’s house', icon: 'photo' },
    c_carbon: { text: 'A carbon copy of the will, one date pencilled at the foot: 1964.', src: 'Seth’s office', icon: 'doc' },
    c_scar: { text: 'An old rope scar worn deep into the sycamore’s low branch.', src: 'The sycamore', icon: 'tree' },
    c_rinds_full: { text: 'Lettie’s father, Sylvester Rinds, lost his land — and his life — in 1964.', src: 'Lettie Lang', icon: 'person' },
    c_rinds_name: { text: 'A name Lettie let slip at the door: Rinds.', src: 'Lettie Lang', icon: 'person' },
    c_sundays: { text: 'Seth asked Lettie about her family, Sunday after Sunday.', src: 'Lettie Lang', icon: 'person' },
    c_promise: { text: 'Sheriff Walls will testify about the sycamore, under oath.', src: 'Ozzie Walls', icon: 'person' },
    c_ropephoto: { text: 'A 1964 photograph: the sycamore, a rope still on the branch.', src: 'Ozzie Walls', icon: 'photo' },
    c_playbook: { text: 'Lanier will argue “undue influence” — that Lettie worked on a dying man.', src: 'Harry Rex Vonner', icon: 'person' },
    c_debt: { text: 'Cleon Hubbard took the Rinds land over a debt nobody ever saw on paper.', src: 'Harry Rex Vonner', icon: 'doc' },
    c_deed: { text: 'The 1964 deed: Rinds’s signature, written in Cleon Hubbard’s hand.', src: 'County records', icon: 'doc' },
    c_file: { text: 'Rinds reported missing in 1964 by a sawmill boy, Isaac Reed. Case closed in two days.', src: 'County records', icon: 'doc' },
    c_lanier_knew: { text: 'Lanier knew about Seth’s new will before it was ever found.', src: 'Wade Lanier', icon: 'person' },
    c_family_admit: { text: 'Seth’s son blurted that his grandfather “won” the Rinds land.', src: 'The Hubbards', icon: 'person' },
    c_watermark: { text: 'The threat was written on Hubbard Lumber Co. paper.', src: 'Your office', icon: 'doc' },
    c_insight: { text: 'Insight — Cleon Hubbard hanged Sylvester Rinds and took his land. Seth held the lantern. The will is a debt repaid.', src: 'Your notes', icon: 'eye' },
  };

  // one-line names for the results case board; groups are alternatives (only one can be found)
  const CLUE_SHORT = {
    c_photo_wall: 'The photograph on Lettie’s wall', c_carbon: 'The carbon copy marked 1964', c_scar: 'The rope scar on the branch',
    c_rinds_full: 'Sylvester Rinds’s story', c_rinds_name: 'The name Rinds', c_sundays: 'Seth’s Sunday visits', c_promise: 'Ozzie’s promise',
    c_ropephoto: 'The 1964 rope photograph', c_playbook: 'Lanier’s playbook', c_debt: 'The unwritten debt', c_deed: 'The forged 1964 deed',
    c_file: 'The 1964 missing-person file', c_lanier_knew: 'Lanier knew early', c_family_admit: '“Won it fair”', c_watermark: 'The Hubbard Lumber watermark',
    c_insight: 'Insight: a debt repaid',
  };
  const CASE_BOARD = [['c_photo_wall', 'c_carbon', 'c_scar'], ['c_rinds_full', 'c_rinds_name'], ['c_sundays'], ['c_promise'], ['c_ropephoto'], ['c_playbook'],
    ['c_debt'], ['c_deed'], ['c_file'], ['c_lanier_knew'], ['c_family_admit'], ['c_watermark'], ['c_insight']];

  /** Which choice sent this run down its ending's branch, and why (reads the run's choice log). */
  function branchFor(run) {
    const log = run.log || []; const last = (pred) => log.slice().reverse().find(pred);
    switch (run.ending) {
      case 'runout': { const e = last((x) => x.dThreat > 0); return { label: e ? e.label : 'Drawing too much attention', why: 'Threat reached 5. Clanton decided you had asked enough questions.' }; }
      case 'deal': return { label: 'Take the settlement', why: 'You signed the night before trial, and the tree kept its secret.' };
      case 'justice': { const e = last((x) => x.id === 'truth' || x.id === 'reed'); return { label: e ? e.label : 'The whole truth', why: 'With the Insight and a witness from 1964, the jury heard all of it.' }; }
      case 'stands':
        if (!run.flags.insight) return { label: 'The clue board', why: 'The notes never came together. Without the Insight, the truth stayed half-told.' };
        if (!run.flags.file1964) return { label: 'Never opening the 1964 file', why: 'Without Isaac Reed’s name you could save the will, but not tell the whole truth.' };
        { const e = last((x) => x.level === 5); return { label: e ? e.label : 'The final word', why: `Jury belief ended at ${run.jury}/8: enough for the will, not for justice.` }; }
      default: { // hung / fails: the weakest move in court
        const moves = log.filter((x) => x.level === 5 && x.gain != null);
        const weak = moves.slice().sort((a, b) => a.gain - b.gain)[0];
        return { label: weak ? weak.label : 'The trial', why: `${weak ? `It moved the jury only ${weak.gain}. ` : ''}Belief ended at ${run.jury}/8.` };
      }
    }
  }

  /* ------------------------------------------------------------------ people */
  const PEOPLE = [
    { id: 'seth', name: 'Seth Hubbard', art: 'pt_seth', role: 'The deceased', base: 'Timber man. Hanged himself from the sycamore on his own land, one day after writing a new will by hand.', more: [['insight', 'In 1964 he held the lantern while his father did murder. He carried it for twenty-four years.']] },
    { id: 'lettie', name: 'Lettie Lang', art: 'pt_lettie', role: 'Housekeeper · heir', base: 'Kept Seth’s house for three years. Named in the new will to receive nearly everything.', more: [['rinds', 'Born a Rinds. Her father vanished in 1964, and the family land went with him.']] },
    { id: 'ozzie', name: 'Ozzie Walls', art: 'pt_ozzie', role: 'Sheriff of Ford County', base: 'Careful, patient, and always watching. Knows which questions get people hurt.', more: [['promise', 'Has promised to take the stand and tell what his father saw.']] },
    { id: 'harry', name: 'Harry Rex Vonner', art: 'pt_harry', role: 'Lawyer · friend', base: 'Divorce lawyer, gossip and drinker. Knows every lawyer in the county, and most of their sins.', more: [['lanier', 'Warned you: Lanier will call Lettie a schemer.']] },
    { id: 'lanier', name: 'Wade Lanier', art: 'pt_lanier', role: 'Counsel for the family', base: 'Hired from Jackson by Seth’s children. Smooth, expensive and very good at frightening juries.', more: [['lanierKnew', 'Knew about the new will before it surfaced. Someone told him.']] },
    { id: 'family', name: 'The Hubbard children', art: 'pt_children', role: 'Contesting the will', base: 'Seth’s son and daughter. Cut out of the new will, and furious about it.', more: [['familyAdmit', 'The son let slip that the Rinds land was “won”.']] },
    { id: 'reed', name: 'Isaac Reed', art: 'pt_reed', role: 'Witness, 1964', base: 'Ninety and nearly blind. Worked the Hubbard sawmill as a boy and reported Sylvester Rinds missing.', needs: 'file1964' },
  ];

  /* ------------------------------------------------------------------ speakers (dialogue strip) */
  const SPEAKERS = {
    lettie: { name: 'Lettie Lang', role: 'housekeeper · heir', art: 'pt_lettie' },
    ozzie: { name: 'Ozzie Walls', role: 'sheriff of Ford County', art: 'pt_ozzie' },
    harry: { name: 'Harry Rex Vonner', role: 'lawyer · friend', art: 'pt_harry' },
    lanier: { name: 'Wade Lanier', role: 'counsel for the family', art: 'pt_lanier' },
    son: { name: 'Seth’s son', role: 'contesting the will', art: 'pt_son' },
    reed: { name: 'Isaac Reed', role: 'witness, 1964', art: 'pt_reed' },
  };

  /* ------------------------------------------------------------------ endings */
  const ENDINGS = {
    justice: { title: 'Justice Served', art: 'e_justice', hint: 'Win the trial with the whole truth.', riddle: 'Where the rope once hung, let the whole truth be told.', mood: 'dawn',
      text: 'The verdict is unanimous. Seth’s will stands — and at the foreman’s request, the clerk writes one more name into the record: Sylvester Rinds. Lettie takes the eighty acres by the creek, and the sycamore with them.' },
    stands: { title: 'The Will Stands', art: 'e_stands', hint: 'Win the trial.', riddle: 'Twelve agree, and never learn why.', mood: 'dawn',
      text: 'Ten to two, the jury upholds the will. Lettie inherits, but Clanton never learns why Seth did it. Some truths win cases. This one only won money.' },
    hung: { title: 'Hung Jury', art: 'e_hung', hint: 'Leave the jury divided.', riddle: 'Six say yes, six say no, and the chairs stay warm.', mood: 'grey',
      text: 'Six and six. The judge declares a mistrial. Lanier is already talking about doing it all again next spring, and Lettie looks very tired.' },
    fails: { title: 'The Will Fails', art: 'e_fails', hint: 'Lose the trial.', riddle: 'Two pages, set aside in the rain.', mood: 'grey',
      text: 'The jury sides with the family. Seth’s two handwritten pages are set aside, and the old will stands. Lettie goes back to cleaning other people’s houses.' },
    deal: { title: 'The Quiet Deal', art: 'e_deal', hint: 'Accept the offer on the night before trial.', riddle: 'Sign by lamplight, and the tree keeps its secret.', mood: 'grey',
      text: 'You sign. Lettie gets a cheque and a handshake; the Hubbards keep the land. Nobody ever asks about the tree again — which is exactly what someone wanted.' },
    runout: { title: 'Run Out of Town', art: 'e_runout', hint: 'Let the Threat reach 5.', riddle: 'Headlights in the drive, three nights running.', mood: 'grey',
      text: 'Headlights in your drive, the third night running. You load the car before dawn. In the mirror, the courthouse clock keeps time in Clanton without you.' },
  };
  const ENDING_ORDER = ['justice', 'stands', 'hung', 'fails', 'deal', 'runout'];

  /* ------------------------------------------------------------------ hints */
  const HINTS = {
    P1: 'This is the prologue. Press Enter or click Next to read on, or Skip to go straight to your first choice.',
    P2: 'Any start is fine. Lettie’s house earns Trust; Seth’s office and the tree earn Evidence. Trust opens doors later.',
    P3: 'Your first clue is in the Notebook (N). Clanton is next — choose your visits carefully.',
    C1: 'You have 8 visits. Records stays locked until someone gives you a lead: a name, a debt or a photograph. Ozzie only opens up at Trust 2.',
    C2: 'Lettie shares more with people she trusts. Sitting with her first (Trust) makes her father’s story easier to hear.',
    C3: 'Sharing your theory earns Ozzie’s Trust and his promise to testify. The case file needs Trust 2.',
    C4: 'A drink earns Trust and warns you about Lanier. The estate earns Evidence — and a lead to the Records room.',
    C5: 'Deeds and the 1964 file are both strong Evidence. The file draws attention (Threat +1), but it names a witness.',
    C6: 'Confronting works best when you already hold leverage: know Lanier’s plan before facing him; hold the deeds before facing the family.',
    C7: 'Stats change after every visit. Watch the Threat pips — at 5 your case is over.',
    C8: 'You need 4 Evidence to move on. Otherwise replay Clanton and choose different doors.',
    T1: 'Ignoring keeps you working (Evidence) but raises Threat. Ozzie can protect you at Trust 2. Going public builds Trust but raises Threat. Lying low is safe, but costs you Evidence.',
    T2: 'Next, connect two clues that explain what happened at the sycamore.',
    T3: 'The question is about the tree in 1964. Link the note about the tree with the note about the land.',
    T4: 'This insight makes your closing words far stronger in court.',
    T5: 'No insight this time — you can still win, but the whole truth will be harder to tell.',
    N1: 'Taking the deal ends the case now. The trial is riskier — but it is the only road to the truth.',
    N2: 'Three rounds, one move each. Locked moves show what you needed to find in Clanton.',
    J1: 'The jury meter starts from your Evidence (5+ gives a head start, 7+ more) — but high Threat costs you a point. Strong witnesses move it further than paperwork.',
    J2: 'Each move adds to the jury’s belief. 6 or more wins; 7+ with the whole truth is the best ending.',
    J3: 'Witnesses from 1964 are the most powerful moves you have — if you found them.',
    J4: 'The whole truth needs both the Insight and the 1964 evidence.',
    J5: 'The verdict follows the jury meter.',
  };

  /* ------------------------------------------------------------------ helpers */
  const S = (run) => run.stats;
  const visitsLeft = (run) => VISITS - run.visits;
  const timeLabel = (run) => {
    if (run.level === 1) return 'Dawn';
    if (run.level === 2) return TIMES[Math.min(run.visits, VISITS - 1) % 4];
    if (run.level === 3) return 'Night';
    if (run.level === 4) return 'Midnight';
    return 'The trial';
  };
  const hasLead = (run) => !!(run.flags.lead);
  const placeLeft = (run, ids) => ids.filter((id) => !run.done[id]).length;

  function chipsFrom(events) { return events.filter((e) => e.type === 'stat' && e.d !== 0).map((e) => ({ k: e.k, d: e.d })); }

  /** Standard result screen: run.last holds what happened so a reload never re-applies effects. */
  function setResult(run, fx, r) {
    run.last = Object.assign({ clue: null, chips: [], note: null }, r);
    fx.after(() => { run.last.chips = chipsFrom(fx.events); });
  }

  /* ================================================================== SCENES */
  const SC = {};

  /* ---------------- Level 1 · The Sycamore ---------------- */
  const PROLOGUE = [
    { art: 'tree_dusk', heading: 'The Sycamore', text: 'October, 1988. Ford County, Mississippi. At the edge of his own land, Seth Hubbard climbed a ladder into an old sycamore — and did not come down.' },
    { art: 'the_will', heading: 'Two Pages', text: 'The day before, he mailed you two pages in his own unsteady hand. A new will. Nearly everything he owned, to Lettie Lang — the woman who kept his house.' },
    { art: 'clanton_night', heading: 'Clanton', text: 'His children want the will thrown out. The town wants to know why. You are the lawyer Seth chose, and whatever he meant is buried under that tree.' },
  ];
  SC.P1 = (run) => {
    const i = run.arg.card || 0; const c = PROLOGUE[i]; const last = i === PROLOGUE.length - 1;
    return {
      kind: 'cards', art: c.art, heading: c.heading, sub: 'Prologue', text: c.text, pager: { i, n: PROLOGUE.length },
      skip: last ? null : 'skip',
      options: [
        { id: 'next', label: last ? 'Begin' : 'Next', sub: last ? 'Open the case' : `Card ${i + 1} of ${PROLOGUE.length}`, primary: true,
          act: (r, fx) => { if (last) { fx.path('Read Seth’s last letter'); fx.go('P2'); } else fx.go('P1', { card: i + 1 }, { soft: true }); } },
        { id: 'skip', label: 'Skip prologue', hidden: true, act: (r, fx) => { fx.path('Skipped the prologue'); fx.go('P2'); } },
      ],
    };
  };
  SC.P2 = () => ({
    art: 'crossroads', heading: 'Where Do You Start?',
    text: 'At the bottom of the will, Seth added one line: “Ask about the tree.” You have a single morning before the funeral. Where do you go first?',
    tips: [
      { k: 'evidence', q: 'What is Evidence?', a: 'Facts you can prove in court. You need enough of it to reach the trial — and the jury trusts it.' },
      { k: 'trust', q: 'What is Trust?', a: 'How much Clanton’s people will tell you. Some doors only open once they trust you.' },
      { k: 'threat', q: 'What is Threat?', a: 'How much attention you are drawing. If Threat reaches 5, you are run out of town.' },
    ],
    options: [
      { id: 'lettie', label: 'Lettie’s house', sub: 'Meet the heir · Trust', act: (r, fx) => { fx.stat('trust', 1); fx.clue('c_photo_wall'); fx.flag('firstLettie'); fx.path('Began at Lettie’s door'); setResult(r, fx, { v: 'lettie' }); fx.go('P3'); } },
      { id: 'office', label: 'Seth’s office', sub: 'Search his desk · Evidence', act: (r, fx) => { fx.stat('evidence', 1); fx.clue('c_carbon'); fx.flag('carbon'); fx.path('Began in Seth’s office'); setResult(r, fx, { v: 'office' }); fx.go('P3'); } },
      { id: 'tree', label: 'The sycamore tree', sub: 'Walk out to the tree · Evidence', act: (r, fx) => { fx.stat('evidence', 1); fx.clue('c_scar'); fx.flag('scar'); fx.path('Began at the sycamore'); setResult(r, fx, { v: 'tree' }); fx.go('P3'); } },
    ],
  });
  const FIRST = {
    lettie: { art: 'lettie_door', text: 'Lettie speaks through the screen door and doesn’t open it. On the wall behind her hangs a photograph of a man in a hat.', say: ['lettie', 'Mr. Seth was good to me. That’s all I know.'], clue: 'c_photo_wall' },
    office: { art: 'seth_drawer', text: 'Under the ledgers in Seth’s desk lies a carbon copy of the will — and pencilled at the foot of it, pressed hard enough to tear the paper, a single year: 1964.', clue: 'c_carbon' },
    tree: { art: 'scarred_tree', text: 'The ladder is gone, but the bark remembers. On the lowest branch runs a deep, smooth groove — far older than Seth, worn there by a rope a long time ago.', clue: 'c_scar' },
  };
  SC.P3 = (run) => {
    const f = FIRST[run.last.v] || FIRST.tree;
    return { art: f.art, heading: 'Your First Clue', text: f.text, say: f.say, clue: f.clue, chips: run.last.chips,
      options: [{ id: 'go', label: 'Go to Clanton', sub: 'Level 2 begins', primary: true, act: (r, fx) => { fx.level(2); fx.go('C1'); } }] };
  };

  /* ---------------- Level 2 · Clanton ---------------- */
  const PLACES = {
    C2: ['lettie_father', 'lettie_tea'], C3: ['ozzie_theory', 'ozzie_file'], C4: ['harry_drink', 'harry_estate'],
    C5: ['records_deeds', 'records_1964'], C6: ['confront_lanier', 'confront_family'],
  };
  function placeOption(run, scene, label) {
    const left = placeLeft(run, PLACES[scene]);
    const locked = scene === 'C5' && !hasLead(run) ? 'needs a lead' : (left === 0 ? 'visited' : null);
    return { id: scene, label, sub: locked ? null : `${left} action${left === 1 ? '' : 's'} left`, locked, lockHelp: scene === 'C5' ? 'The records clerk won’t pull files without a name, a debt or a photograph to search for.' : 'You have done everything here.', act: (r, fx) => fx.go(scene) };
  }
  SC.C1 = (run) => ({
    art: 'town_map', heading: 'Clanton', sub: `Day ${run.day} · ${timeLabel(run)} · ${visitsLeft(run)} visit${visitsLeft(run) === 1 ? '' : 's'} left`,
    text: 'The courthouse clock strikes the hour over the square. Every visit costs time, and the whole town is watching where you go.',
    options: [placeOption(run, 'C2', 'Lettie’s house'), placeOption(run, 'C3', 'Sheriff Ozzie Walls'), placeOption(run, 'C4', 'Harry Rex Vonner'), placeOption(run, 'C5', 'County records'), placeOption(run, 'C6', 'Confront someone')],
  });

  function visitAction(run, id, label, sub, act, lock) {
    if (run.done[id]) return { id, label, sub: 'Already done', locked: 'done', lockHelp: 'You have already done this.' };
    return { id, label, sub, locked: lock ? lock.text : null, lockHelp: lock && lock.help,
      act: (r, fx) => { r.done[id] = true; fx.visit(); act(r, fx); fx.go('C7'); } };
  }
  const back = { id: 'back', label: 'Go back', sub: 'Return to the map · costs nothing', back: true, act: (r, fx) => fx.go('C1', null, { back: true }) };

  SC.C2 = (run) => ({
    art: 'lettie_porch', heading: 'Lettie’s House', sub: 'Two actions · each uses one visit',
    text: 'Lettie’s porch is swept clean. She sits with her hands folded in her lap, waiting to see what kind of lawyer you are.',
    options: [
      visitAction(run, 'lettie_father', 'Ask about her father', S(run).trust >= 2 ? 'Uses a visit · she trusts you' : 'Uses a visit · she may not open up', (r, fx) => {
        fx.flag('lead'); fx.flag('rinds');
        if (S(r).trust >= 2) { fx.stat('evidence', 1); fx.clue('c_rinds_full'); setResult(r, fx, { art: 'r_father', heading: 'Sylvester Rinds', text: 'Lettie looks at the photograph on the wall for a long while before she answers.', say: ['lettie', 'My daddy. Sylvester Rinds. We had eighty acres by the creek until 1964. Then we didn’t have him, and we didn’t have the land.'], clue: 'c_rinds_full' }); }
        else { fx.clue('c_rinds_name'); setResult(r, fx, { art: 'r_father_closed', heading: 'A Closed Door', text: 'Lettie stands to go inside. At the screen door she turns and gives you one more word, almost too quietly to hear: Rinds.', say: ['lettie', 'That’s family business.'], clue: 'c_rinds_name', note: 'Not enough Trust — she held back. But a name is a lead.' }); }
      }),
      visitAction(run, 'lettie_tea', 'Sit with her at the table', 'Uses a visit · Trust +1', (r, fx) => {
        fx.stat('trust', 1); fx.clue('c_sundays');
        setResult(r, fx, { art: 'r_tea', heading: 'Tea at the Table', text: 'She pours two cups and tells you about Seth’s Sunday visits to her kitchen.', say: ['lettie', 'He’d sit right there and ask about my people. Like he already knew the answers, and needed to hear them said out loud.'], clue: 'c_sundays' });
      }),
      back,
    ],
  });
  SC.C3 = (run) => ({
    art: 'sheriff_office', heading: 'Sheriff Ozzie Walls', sub: 'Two actions · each uses one visit',
    text: 'Ozzie Walls has been sheriff long enough to know which questions get people hurt. He listens far more than he talks.',
    options: [
      visitAction(run, 'ozzie_theory', 'Share your theory', 'Uses a visit · Trust +1', (r, fx) => {
        fx.stat('trust', 1); fx.flag('promise'); fx.clue('c_promise');
        setResult(r, fx, { art: 'r_promise', heading: 'The Sheriff’s Promise', text: 'Ozzie hears you out without a word, then nods once.', say: ['ozzie', 'You take this to a jury, I’ll tell them what my daddy told me about that tree. Under oath.'], clue: 'c_promise' });
      }),
      visitAction(run, 'ozzie_file', 'Ask for the case file', 'Uses a visit · Evidence +1', (r, fx) => {
        fx.stat('evidence', 1); fx.flag('photo'); fx.flag('lead'); fx.clue('c_ropephoto');
        setResult(r, fx, { art: 'r_photo', heading: 'The Rope-Scar Photograph', text: 'From a locked drawer Ozzie slides out a yellowed photograph: the sycamore, 1964, a rope still on the low branch.', say: ['ozzie', 'Nobody ever opened a case. Nobody was allowed to.'], clue: 'c_ropephoto' });
      }, S(run).trust < 2 ? { text: 'needs Trust 2', help: 'Ozzie won’t open his files to a stranger. Build Trust with Lettie, Ozzie or Harry Rex first.' } : null),
      back,
    ],
  });
  SC.C4 = (run) => ({
    art: 'law_office', heading: 'Harry Rex Vonner', sub: 'Two actions · each uses one visit',
    text: 'Harry Rex’s office smells of cigars and old paper. He knows every lawyer in the county and most of their sins.',
    options: [
      visitAction(run, 'harry_drink', 'Buy him a drink', 'Uses a visit · Trust +1', (r, fx) => {
        fx.stat('trust', 1); fx.flag('lanier'); fx.clue('c_playbook');
        setResult(r, fx, { art: 'r_drink', heading: 'A Drink with Harry Rex', text: 'Two bourbons in, Harry Rex leans across the table and lowers his voice.', say: ['harry', 'Lanier will say Lettie bewitched a sick old man. Undue influence. Have an answer ready, or he’ll eat you alive.'], clue: 'c_playbook' });
      }),
      visitAction(run, 'harry_estate', 'Ask about the estate', 'Uses a visit · Evidence +1', (r, fx) => {
        fx.stat('evidence', 1); fx.flag('debt'); fx.flag('lead'); fx.clue('c_debt');
        setResult(r, fx, { art: 'r_estate', heading: 'The Estate', text: 'Seth’s money came from timber, Harry Rex says — but the first eighty acres came from somewhere else.', say: ['harry', 'His daddy Cleon called in a debt. Nobody ever saw it written down.'], clue: 'c_debt' });
      }),
      back,
    ],
  });
  SC.C5 = (run) => ({
    art: 'records_room', heading: 'County Records', sub: 'Two actions · each uses one visit',
    text: 'Forty years of Ford County in tall green ledgers, and a clerk at the far end who notices everything you touch.',
    options: [
      visitAction(run, 'records_deeds', 'Pull the land deeds', 'Uses a visit · Evidence +1', (r, fx) => {
        fx.stat('evidence', 1); fx.flag('deeds'); fx.clue('c_deed');
        setResult(r, fx, { art: 'r_deeds', heading: 'The Land Deeds', text: 'The deed is dated September 1964: eighty acres, from Sylvester Rinds to Cleon Hubbard. The signature “S. Rinds” sits in Cleon’s own careful, looping hand.', clue: 'c_deed' });
      }),
      visitAction(run, 'records_1964', 'Open the 1964 file', 'Uses a visit · Evidence +1 · Threat +1', (r, fx) => {
        fx.stat('evidence', 1); fx.stat('threat', 1); fx.flag('file1964'); fx.clue('c_file');
        setResult(r, fx, { art: 'r_file1964', heading: 'The 1964 File', text: 'One thin folder: Sylvester Rinds, reported missing by a sawmill boy named Isaac Reed. Closed in two days. Someone signed it out last week — and the clerk is already on the telephone.', clue: 'c_file' });
      }),
      back,
    ],
  });
  SC.C6 = (run) => ({
    art: 'confront', heading: 'Confront Someone', sub: 'Two actions · each uses one visit',
    text: 'Pressing people for answers gets results. It also gets you noticed — and noticed is dangerous in a town this small.',
    options: [
      visitAction(run, 'confront_lanier', 'Confront Wade Lanier', run.flags.lanier ? 'Uses a visit · Threat +1 · you know his plan' : 'Uses a visit · Threat +1', (r, fx) => {
        fx.stat('threat', 1);
        if (r.flags.lanier) { fx.stat('evidence', 1); fx.flag('lanierKnew'); fx.clue('c_lanier_knew'); setResult(r, fx, { art: 'r_lanier', heading: 'Lanier Slips', text: 'You name his “undue influence” argument before he can. Lanier’s smile tightens — and in correcting you, he lets slip more than he meant to.', say: ['lanier', 'I knew about that will a week before anyone found — that is, I’d heard rumours. Small town.'], clue: 'c_lanier_knew' }); }
        else setResult(r, fx, { art: 'r_lanier', heading: 'Lanier Smiles', text: 'Lanier lets you talk until you run out of words. By evening, half the courthouse has heard you’re desperate.', say: ['lanier', 'Thank you for your time, counsellor. Truly. Give my regards to Miss Lang.'], note: 'You had no leverage. Harry Rex knows Lanier’s game.' });
      }),
      visitAction(run, 'confront_family', 'Confront the Hubbard children', run.flags.deeds ? 'Uses a visit · Threat +1 · you hold the deed' : 'Uses a visit · Threat +1', (r, fx) => {
        fx.stat('threat', 1);
        if (r.flags.deeds) { fx.stat('evidence', 1); fx.flag('familyAdmit'); fx.clue('c_family_admit'); setResult(r, fx, { art: 'r_hubbards', heading: '“Won It Fair”', text: 'You lay the deed on their porch rail. Seth’s son loses his temper — then hears what he has said, and goes pale.', say: ['son', 'Granddaddy won that land fair from those Rinds people!'], clue: 'c_family_admit' }); }
        else { fx.stat('trust', -1); setResult(r, fx, { art: 'r_slammed', heading: 'A Slammed Door', text: 'The neighbours are watching from their porches. The door slams, and the story is all over town by supper.', say: ['son', 'Vulture. Get off my daddy’s porch.'], note: 'Without proof in hand, you only looked cruel.' }); }
      }),
      back,
    ],
  });
  SC.C7 = (run) => {
    const L = run.last; const done = run.visits >= VISITS; const lost = S(run).threat >= THREAT_MAX;
    let opt;
    if (lost) opt = { id: 'lost', label: 'Headlights in the drive…', sub: 'Threat has reached 5', primary: true, act: (r, fx) => fx.ending('runout') };
    else if (done) opt = { id: 'dusk', label: 'Night falls on Clanton', sub: 'Your visits are spent · see where you stand', primary: true, act: (r, fx) => { fx.path(`Clanton: ${r.stats.evidence - r.l2Evidence >= 0 ? '+' : ''}${r.stats.evidence - r.l2Evidence} Evidence in ${VISITS} visits`); fx.go('C8'); } };
    else opt = { id: 'map', label: 'Back to the map', sub: `${visitsLeft(run)} visit${visitsLeft(run) === 1 ? '' : 's'} left · Day ${run.day}, ${timeLabel(run)}`, primary: true, act: (r, fx) => fx.go('C1') };
    return { art: L.art, heading: L.heading, sub: 'Visit result', text: L.text, say: L.say, clue: L.clue, chips: L.chips, note: L.note, options: [opt] };
  };
  SC.C8 = (run) => {
    const ok = S(run).evidence >= 4; const gained = S(run).evidence - run.l2Evidence;
    const stars = gained >= 6 ? 3 : gained >= 4 ? 2 : 1;
    return {
      art: ok ? 'clanton_night' : 'not_enough', heading: ok ? 'Clanton Falls Quiet' : 'Not Enough Proof', sub: 'Level 2 result', stars,
      text: ok ? 'Two days and eight doors. You have the shape of it now: a man, a tree, eighty acres, and a year nobody in Clanton wants to remember.'
        : 'You have rumours and a name, but nothing a jury would believe. Lanier would take it apart in an afternoon. You need at least 4 Evidence.',
      options: [
        { id: 'next', label: 'On to Pressure', sub: ok ? 'Level 3 · Evidence 4+' : null, primary: ok, locked: ok ? null : 'needs Evidence 4', lockHelp: 'You need at least 4 Evidence to move on. Replay Clanton and try different doors.',
          act: (r, fx) => { r.stars[2] = stars; fx.level(3); fx.go('T1'); } },
        { id: 'replay', label: 'Replay Clanton', sub: 'Restart Level 2 from the town map', primary: !ok, act: (r, fx) => fx.replay(2) },
      ],
    };
  };

  /* ---------------- Level 3 · Pressure ---------------- */
  const THREATS = {
    note: { art: 'note_door', heading: 'A Note on the Door', text: 'Nailed to your office door at dawn, in careful capitals: LET THE DEAD MAN’S MONEY GO HOME. Below it, smaller: LEAVE THE TREE ALONE.' },
    brick: { art: 'brick_window', heading: 'A Brick Through the Window', text: 'Glass across your desk, and a brick wrapped in a page of newspaper. The story under the string is about Seth Hubbard’s will.' },
  };
  SC.T1 = (run) => {
    const t = THREATS[run.threatEvent] || THREATS.note;
    return { art: t.art, heading: t.heading, sub: 'Threat event · Threat +1', text: t.text,
      options: [
        { id: 'ignore', label: 'Ignore it', sub: 'Keep working · Evidence +1 · Threat +1', act: (r, fx) => { fx.stat('evidence', 1); fx.stat('threat', 1); fx.clue('c_watermark'); fx.flag('watermark'); fx.path('Ignored the threat'); setResult(r, fx, { art: 'r_ignored', heading: 'Ignored', text: 'You sweep up and keep working by lamplight. Under the magnifier, the paper gives itself away: a faint watermark — Hubbard Lumber Co.', clue: 'c_watermark' }); fx.go('T2'); } },
        { id: 'sheriff', label: 'Tell Sheriff Walls', sub: 'Threat −1', locked: S(run).trust < 2 ? 'needs Trust 2' : null, lockHelp: 'Ozzie doesn’t know you well enough to put a deputy on your street. You needed Trust 2.',
          act: (r, fx) => { fx.stat('threat', -1); fx.flag('protected'); fx.path('Went to the sheriff'); setResult(r, fx, { art: 'r_deputy', heading: 'A Deputy on Your Street', text: 'Ozzie parks a cruiser outside your office all night. Nobody comes back. In the morning he has only one thing to say.', say: ['ozzie', 'They know I’m watching now.'] }); fx.go('T2'); } },
        { id: 'public', label: 'Go public', sub: 'Trust +1 · Threat +1', act: (r, fx) => { fx.stat('trust', 1); fx.stat('threat', 1); fx.path('Went public'); setResult(r, fx, { art: 'r_public', heading: 'The Town Hears of It', text: 'You give the Ford County Times everything. By noon, strangers stop Lettie on the square to shake her hand — and others cross the street to avoid her.' }); fx.go('T2'); } },
        { id: 'lie', label: 'Lie low for a day', sub: S(run).evidence > 0 ? 'Threat −1 · Evidence −1' : 'Threat −1', act: (r, fx) => { fx.stat('threat', -1); fx.stat('evidence', -1); fx.path('Lay low'); setResult(r, fx, { art: 'r_lowlying', heading: 'Curtains Drawn', text: 'You stay home with the curtains drawn and the telephone off the hook. Nothing happens. But a day is lost, and a witness you meant to see has left town for his sister’s.' }); fx.go('T2'); } },
      ] };
  };
  SC.T2 = (run) => {
    const L = run.last; const lost = S(run).threat >= THREAT_MAX;
    return { art: L.art, heading: L.heading, sub: 'Your reply', text: L.text, say: L.say, clue: L.clue, chips: L.chips,
      options: [lost ? { id: 'lost', label: 'Headlights in the drive…', sub: 'Threat has reached 5', primary: true, act: (r, fx) => fx.ending('runout') }
        : { id: 'board', label: 'Connect the clues', sub: 'Lay out what you know', primary: true, act: (r, fx) => fx.go('T3') }] };
  };

  /** The deduction board: two key notes (tree + land) always exist, worded from what you found. */
  function boardCards(run) {
    const f = run.flags;
    const tree = f.photo ? { id: 'tree', text: 'A 1964 photograph: a rope still hanging from the sycamore’s low branch.' }
      : f.scar ? { id: 'tree', text: 'An old rope groove worn deep into the sycamore’s low branch.' }
        : { id: 'tree', text: 'Seth chose the old sycamore — that tree, that branch — to die on.' };
    const land = f.deeds ? { id: 'land', text: 'The 1964 deed: the Rinds land signed over in Cleon Hubbard’s hand.' }
      : f.debt ? { id: 'land', text: 'Cleon Hubbard took the Rinds land over a debt no one ever saw.' }
        : run.clues.includes('c_rinds_full') ? { id: 'land', text: 'Sylvester Rinds lost his land, and his life, in 1964.' }
          : f.rinds ? { id: 'land', text: 'Lettie was born a Rinds. The Rinds once owned land near the tree.' }
            : { id: 'land', text: 'Seth pencilled “1964” at the foot of his will — the year the land changed hands.' };
    const red1 = f.lanier ? { id: 'red1', text: 'Lanier will argue Lettie unduly influenced a dying man.' } : { id: 'red1', text: 'Seth’s children were cut out of the new will.' };
    const red2 = { id: 'red2', text: 'Seth wrote the new will just one day before he died.' };
    const order = [tree, red1, land, red2];
    const R = SR.rng(run.seed + 3); // stable shuffle per run
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }
  SC.T3 = (run) => ({
    kind: 'board', art: 'clue_board', heading: 'Connect the Clues', sub: run.tries < 2 ? 'One more try' : 'Pick two notes',
    text: '“Ask about the tree.” Pin two notes together that explain what happened at the sycamore in 1964.',
    cards: boardCards(run), tries: run.tries,
    options: [{ id: 'link', label: 'Link them', sub: 'Pick two notes first', primary: true, needsPair: true,
      act: (r, fx, pair) => {
        const ok = pair && pair.includes('tree') && pair.includes('land');
        if (ok) { fx.stat('evidence', 1); fx.stat('trust', 1); fx.flag('insight'); fx.clue('c_insight'); fx.path('Understood the tree'); setResult(r, fx, {}); fx.go('T4'); return { ok: true }; }
        r.tries -= 1;
        if (r.tries <= 0) { fx.path('The pieces refused'); fx.go('T5'); return { ok: false, final: true }; }
        fx.stay(); return { ok: false };
      } }],
  });
  SC.T4 = (run) => ({
    art: 'tree_land', heading: 'Insight Unlocked', text: 'It was never a riddle. In 1964 Cleon Hubbard hanged Sylvester Rinds from the sycamore and took his eighty acres — and his son Seth held the lantern. The will isn’t madness. It’s a debt, repaid.',
    clue: 'c_insight', chips: run.last.chips,
    options: [{ id: 'go', label: 'Continue', sub: 'Level 4 · The Night Before', primary: true, act: (r, fx) => { r.stars[3] = r.stats.threat <= 3 ? 3 : 2; fx.level(4); fx.go('N1'); } }],
  });
  SC.T5 = () => ({
    art: 'torn_notes', heading: 'The Pieces Refuse', text: 'The notes stay only notes. Whatever Seth meant, you can’t prove it yet. You’ll walk into that courtroom carrying pieces.',
    options: [{ id: 'go', label: 'Continue', sub: 'Level 4 · The Night Before', primary: true, act: (r, fx) => { r.stars[3] = 1; fx.level(4); fx.go('N1'); } }],
  });

  /* ---------------- Level 4 · The Night Before ---------------- */
  SC.N1 = (run) => ({
    art: 'lamplit_desk', heading: 'The Night Before', meter: { label: 'Truth you can prove', value: Math.min(8, S(run).evidence), max: 8 },
    text: 'Past midnight, an envelope from Lanier: the family will pay Lettie a modest sum to walk away. Sign tonight and it ends. Refuse, and tomorrow twelve strangers decide.',
    options: [
      { id: 'deal', label: 'Take the settlement', sub: 'Ends the case tonight', act: (r, fx) => { r.stars[4] = 1; fx.path('Took the settlement'); fx.ending('deal'); } },
      { id: 'trial', label: 'Refuse and go to trial', sub: 'Level 5 · The Trial', primary: true, act: (r, fx) => { r.stars[4] = r.stats.evidence >= 6 ? 3 : 2; fx.path('Refused the deal'); fx.go('N2'); } },
    ],
  });
  SC.N2 = () => ({
    art: 'courthouse_dawn', heading: 'The Trial Awaits',
    text: 'You burn Lanier’s offer in the ashtray and watch the sun come up behind the courthouse. Lettie is already on the steps in her church dress, waiting for you.',
    options: [{ id: 'go', label: 'To the courtroom', sub: 'Three rounds · one move each', primary: true, act: (r, fx) => { fx.level(5); fx.go('J1'); } }],
  });

  /* ---------------- Level 5 · The Trial ---------------- */
  const startBelief = (run) => {
    let b = S(run).evidence >= 7 ? 2 : S(run).evidence >= 5 ? 1 : 0;
    if (S(run).threat >= 4) b -= 1;
    return Math.max(0, b);
  };
  function move(run, id, label, gain, result, lock) {
    const g = typeof gain === 'function' ? gain(run) : gain;
    return { id, label, sub: lock ? null : (g >= 3 ? 'A decisive move' : g >= 2 ? 'A strong move' : 'A steady move'), locked: lock ? lock.text : null, lockHelp: lock && lock.help,
      act: (r, fx) => { const before = r.jury; r.jury = Math.min(8, r.jury + g); r.moves.push(id); if (result.flag) fx.flag(result.flag); setResult(r, fx, Object.assign({}, result, { gain: r.jury - before, round: r.round })); fx.go('J2'); } };
  }
  SC.J1 = (run) => ({
    art: 'courtroom', heading: 'Round 1 · Seth’s Will', sub: 'Is the will valid?', meter: { label: 'Jury belief', value: run.jury, max: 8 },
    text: 'Lanier rises first: a dying man, a scheming housekeeper, a will scrawled in a fog of pain and pills. Your answer will set the tone for everything after.',
    options: [
      move(run, 'expert', 'Call the handwriting expert', 1, { art: 'm_expert', heading: 'The Handwriting Expert', text: 'A retired examiner from Jackson lays the will beside forty of Seth’s cheques. “Same hand. Shaky, but sure of itself.” The jury nods along — politely.' }),
      move(run, 'lettie', 'Put Lettie on the stand', (r) => (S(r).threat >= 3 ? 1 : 2), { art: 'm_lettie', heading: 'Lettie Testifies', text: 'Lettie tells them about Sunday visits and two cups of tea. In the second row of the jury box, a woman is wiping her eyes.', say: ['lettie', 'I never asked Mr. Seth for one thing. Not one.'] },
        S(run).trust < 3 ? { text: 'needs Trust 3', help: 'Lettie won’t face that courtroom for a lawyer she barely knows. You needed Trust 3.' } : null),
      move(run, 'deeds', 'Show the land deeds', (r) => (r.flags.deeds ? 3 : 2), { art: 'm_deeds', heading: 'The Deeds, Shown', text: 'You set the 1964 deed beside Cleon Hubbard’s old ledger. The same loops, the same slant. The courtroom goes very quiet.' },
        !run.flags.debt ? { text: 'needs the debt clue', help: 'Without Harry Rex’s story of the unwritten debt, the deeds are just old paper.' } : null),
    ],
  });
  SC.J2 = (run) => {
    const L = run.last; const r = run.round;
    const nexts = [
      { id: 'r2', label: 'Next round', sub: 'Round 2 · The truth', primary: true, act: (rr, fx) => { rr.round = 2; fx.go('J3'); } },
      { id: 'r3', label: 'Next round', sub: 'Round 3 · The final word', primary: true, act: (rr, fx) => { rr.round = 3; fx.go('J4'); } },
      { id: 'verdict', label: 'Hear the verdict', sub: 'The jury retires', primary: true, act: (rr, fx) => fx.go('J5') },
    ];
    return { art: L.art, heading: L.heading, sub: `Round ${r} · move result`, text: L.text, say: L.say, meter: { label: 'Jury belief', value: run.jury, max: 8, gain: L.gain },
      chips: L.gain ? [{ k: 'jury', d: L.gain }] : [], options: [nexts[r - 1]] };
  };
  SC.J3 = (run) => ({
    art: 'witness_stand', heading: 'Round 2 · The Truth', sub: 'What happened at the tree?', meter: { label: 'Jury belief', value: run.jury, max: 8 },
    text: 'Lanier has planted his doubt. Now the jury wants a reason — why would a rich white man leave everything to the woman who cleaned his house?',
    options: [
      move(run, 'sheriff', 'Call Sheriff Walls', 2, { art: 'm_sheriff', heading: 'Sheriff Walls', text: 'Ozzie takes the stand with his hat in his hands and speaks straight to the jury.', say: ['ozzie', 'My daddy was a deputy in ’64. He saw what was done at that sycamore, and he was ordered to forget it. He never did.'] },
        !run.flags.promise ? { text: 'needs Ozzie’s promise', help: 'Ozzie only promised to testify if you shared your theory with him in Clanton.' } : null),
      move(run, 'reed', 'Call the old man from the tree', 3, { art: 'm_oldman', heading: 'The Old Man from the Tree', text: 'Isaac Reed, ninety and nearly blind, was a boy at the Hubbard sawmill in 1964. The courtroom leans in to hear him.', say: ['reed', 'Two men at the sycamore that night. One was Cleon Hubbard. The other one held the lantern. That was Seth.'], flag: 'toldTruth' },
        !run.flags.file1964 ? { text: 'needs the 1964 file', help: 'Isaac Reed’s name was in the 1964 file in the County Records room.' } : null),
      move(run, 'counter', 'Counter Lanier’s tricks', (r) => (r.flags.lanier ? 2 : 1), { art: 'm_counter', heading: 'Countering Lanier', text: run.flags.lanier ? 'When Lanier says “undue influence”, you’re ready: Seth’s doctor, his banker and his barber all swear his mind was clear to the last.' : 'Lanier paints Lettie as a schemer. You object, and object again, and win some of them.', say: ['lanier', 'Undue influence, ladies and gentlemen. A dying man, and a woman in his kitchen.'] }),
    ],
  });
  SC.J4 = (run) => ({
    art: 'closing', heading: 'Round 3 · The Final Word', sub: 'Your closing argument', meter: { label: 'Jury belief', value: run.jury, max: 8 },
    text: 'The room is hot and very still. Twelve faces turn toward you for the last time. What do you leave them with?',
    options: [
      move(run, 'law', 'Argue the law', 1, { art: 'm_law', heading: 'Arguing the Law', text: 'You walk them through it: a will written wholly in the testator’s hand, signed and dated, is valid in Mississippi. It is correct. It is also cold.' }),
      move(run, 'truth', 'Tell the 1964 truth', (r) => (r.flags.insight ? 3 : 2), { art: 'm_truth', heading: 'The 1964 Truth', text: 'You tell them all of it — the debt that never was, the rope, the land, the son who held the lantern. Seth didn’t lose his mind. He found his conscience.', flag: 'toldTruth' },
        !run.flags.file1964 ? { text: 'needs the 1964 file', help: 'Without the 1964 file, the truth is only a story you can’t prove.' } : null),
      move(run, 'wish', 'Read Seth’s last wish', (r) => (r.flags.insight ? 2 : 1), { art: 'm_wish', heading: 'Seth’s Last Wish', text: run.flags.insight ? 'You read the final line of the will aloud — “Ask about the tree” — and then you tell them what the tree told you.' : 'You read the final line of the will aloud — “Ask about the tree.” It hangs in the air, unanswered.' }),
    ],
  });
  function verdict(run) {
    const full = !!(run.flags.insight && run.flags.toldTruth);
    if (run.jury >= 7 && full) return 'justice';
    if (run.jury >= 6) return 'stands';
    if (run.jury >= 4) return 'hung';
    return 'fails';
  }
  SC.J5 = (run) => {
    const v = verdict(run); const E = ENDINGS[v];
    const line = { justice: 'Unanimous. The will stands — and the truth with it.', stands: 'The will stands.', hung: 'The jury cannot agree.', fails: 'The will is set aside.' }[v];
    return { art: E.art, heading: 'The Verdict', sub: 'The jury returns', meter: { label: 'Jury belief', value: run.jury, max: 8 }, verdict: v,
      text: `The foreman stands with a folded slip of paper. ${line}`,
      options: [{ id: 'results', label: 'See how it ends', sub: E.title, primary: true, act: (r, fx) => { r.stars[5] = { justice: 3, stands: 2, hung: 1, fails: 0 }[v]; fx.path(`Verdict: ${E.title}`); fx.ending(v); } }] };
  };

  /* ------------------------------------------------------------------ starts */
  const LEVEL_START = { 1: 'P1', 2: 'C1', 3: 'T1', 4: 'N1', 5: 'J1' };

  SR.Story = { LEVELS, LEVEL_START, CLUES, CLUE_SHORT, CASE_BOARD, branchFor, PEOPLE, SPEAKERS, ENDINGS, ENDING_ORDER, HINTS, SCENES: SC, VISITS, THREAT_MAX, timeLabel, startBelief, verdict };
})();
