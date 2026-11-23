# Sycamore Row

A Southern Gothic mystery in five levels, for Windows PC.
Ford County, Mississippi, 1988: Seth Hubbard hangs himself from a sycamore and leaves nearly everything
to Lettie Lang in a handwritten will. You are the lawyer he chose. Find out what happened at the tree.

## Play

| Level | | What you do |
|---|---|---|
| I · The Sycamore | single lancet window | Prologue, then pick where to start. Your first clue. |
| II · Clanton | twin lancets + roundel | 8 visits around town. Earn Trust, gather Evidence, keep Threat below 5. Need 4 Evidence to move on. |
| III · Pressure | leaded quarries, cracked | Answer a threat, then link two notes on the deduction board (two tries). |
| IV · The Night Before | quatrefoil | Take the settlement, or go to trial. |
| V · The Trial | triple lancet | Three rounds, one move each. The jury meter decides the verdict. |

Six endings: Justice Served · The Will Stands · Hung Jury · The Will Fails · The Quiet Deal · Run Out of Town.
Locked choices always say what they need, and clicking one explains how to earn it.

**Controls** — mouse, or keyboard: `1–5` choose · `↑ ↓` move · `Enter` confirm · `Space` finish text ·
`N` notebook · `H` hint · `Esc` pause/back · `S` skip prologue · `A–D` pick notes on the board ·
`F11` / `Alt+Enter` fullscreen · `M` mute.

The game autosaves after every choice. **Continue** resumes exactly where you left off; **Case Files** lets you
replay any level you have reached (from the record you had when you got there) and shows the endings gallery.

## Run it

Windows desktop app (Electron):

```powershell
npm install
npm start
```

If `npm start` reports that Electron failed to install, re-run its download step: `node node_modules/electron/install.js`.

In a browser (no install needed): run `npm run web` and open http://localhost:5173, or just open `index.html`.

Build a Windows installer + portable `.exe`:

```powershell
npm install --save-dev electron-builder
npm run dist
```

## Project layout

```
index.html            entry page (loads everything below in order)
electron/             Windows shell: window state, fullscreen, quit, locked-down security
src/util.js           DOM helper, seeded RNG, event bus
src/story.js          all story text and rules: scenes as (run) → view functions, clues, people, endings, hints
src/state.js          game engine: effects API, autosave/continue, level snapshots, progress, settings
src/audio.js          procedural WebAudio: ambience per level + every feedback sound (no audio files)
src/art/kit.js        drawing kit: light layer, silhouettes, rooms, objects
src/art/people.js     the cast as detailed silhouettes (Seth, Lettie, Ozzie, Harry Rex, Lanier, the Hubbards, Isaac Reed…)
src/art/render.js     compositor: dithers lamplight to 1-bit bone white, lays silhouettes and linework on top
src/art/scenes*.js    ~55 scene illustrations + character portraits
src/ornaments.js      scene picture frame + level crests, Gothic window silhouettes, sycamore-leaf corners, arcade bands, frame cracks, stars
src/ui.js             components: lancet buttons, HUD, art window, word reveal, clue box, meters
src/screens.js        splash, menu, chapter cards, game, deduction board, case files, settings, results
src/app.js            router + transitions, overlays (notebook, hint, pause, confirm), input, fullscreen, boot
styles/               design tokens and all styling; fonts bundled in assets/fonts (SIL OFL)
tools/                dev server, art preview page, icon generator
```

Game logic never touches the DOM: the UI renders whatever `Game.view()` returns and sends choices to `Game.choose()`.

## Style rules (keep these consistent)

* **Palette:** near-black `--ink` and bone white `--lamp` (plus dimmer bone greys for secondary text), with one
  accent: blood red (`--blood`, `--blood-hi`). Red is reserved for danger, discovery and the case thread: Threat, new
  clues, the deduction thread and pins, the eight-point star. Never use it for body text or large fills.
* **Tokens only:** every colour comes from the CSS custom properties in `styles/main.css`. Canvas code reads them with
  `SR.token()`; SVG uses `var(--…)`; texture images (damask, grain, arcade bands) are masks over a `--lamp` fill.
* **Red budget:** about three red marks per screen at most. Dividers and other ornament stars are bone (`starPath(…, 'bone')`);
  red stars are kept for title sparkles and the clue burst.
* **Red text:** use `--blood-text`, never `--blood-hi`. It keeps ≥ 4.5:1 on `--panel` and `--panel-2`.
* **Informational small text** uses `--lamp-dim` (6.5:1). `--lamp-mute` is only for disabled or decorative marks.
* **Texture:** printed-poster grain with faint vertical scratches, a faint sycamore damask, and a heavy vignette. Lace scallops trim the HUD and bottom bar.
* **Frames:** gameplay and ending art sits in the cusped **picture frame** (bead ring, moulding band, leaf corners) with
  the level's window silhouette as a crest. No window tracery crosses scene art. Character portraits are window-free
  halftone busts in **oval mirror** frames (hairline, ink gap, bead ring). Every overlay card uses the same double
  hairline, keystrip and four corner ornaments.
* **Shape language:** Gothic Revival pointed arches. Buttons are lancet-shaped and meters are lancet cells. Each level
  has its own window silhouette, used as an icon (HUD, case files, chapter cards, frame crest).
* **Dialogue:** whenever a character speaks, the line goes in a `say` field (never quoted inside narration), and the UI shows
  the dialogue strip: oval mirror on the left, name in Cinzel, small-caps role, line in italics. The speaker's rim light breathes.
* **Evidence:** the deduction board is a corkboard of torn, pinned bone-paper notes. Links are a red thread drawn pin
  to pin. A wrong pair snaps and falls; the right pair pulses and burns in.
* **Threat is physical:** each point bleeds more red into the vignette, adds a hairline crack to the outer frame, and
  hurries the motes. At 4 or more the ambience warps and skips like a worn record.
* **Transitions:** screens change through an ink-wipe (blots spread, then the next screen shows through spreading holes).
* **Endings:** a wall of hung, worn picture frames (3×2). Undiscovered endings hang cracked and empty with a one-line riddle.
* **Feedback:** brief and quiet, under 600 ms: a red star burst for a new clue, a bone "+1 TRUST" stamp, an ink blot on every press.
* **Accessibility:** every animation honours Reduce motion (CSS collapses to instant; JS effects check `SR.reducedMotion()`).
  High contrast drops grain, damask, lace and red glow, but Threat stays solid red.
* **Light:** one bone-white light source per scene, rendered as 1-bit dithered lamplight.
* **People and objects:** crisp black silhouettes with a thin pale rim light. Each character keeps the same silhouette everywhere.
* **Ornament:** sycamore leaves and seed-balls (corners, dividers, wallpaper, finials, frame corners), plus the eight-point star, drawn with the same thin line.
* **Type:** UnifrakturCook for titles and initials, Cinzel for headings and buttons, IM Fell English for story text.
