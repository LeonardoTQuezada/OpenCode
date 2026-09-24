# AGENTS.md

Static, dependency-free Pac-Man clone. Vanilla JS/HTML/CSS, no build step, no test suite, no `package.json`.

## Running

Open `src/index.html` directly in a browser (`file://` works — no fetch/ES modules). Entry point is `src/index.html`, which loads scripts in a strict order via plain `<script>` tags:

```
src/js/maze.js   → game.js   → render.js   → main.js
```

Do not reorder these. The files share state through `window` globals (`MAZE`, `TUNNEL_ROW`, `PACMAN_START`, `GHOST_STARTS`, `createGame`, `update`, `DIRS`, `draw`); breaking the load order breaks everything.

## Architecture

- `maze.js` — 28×31 grid (level 1 geometry), parsed from ASCII strings. **`MAZE` is pristine and read-only**; each `createGame()` copies it into `game.grid`, which is the only thing that may be mutated (dots eaten). Cell encoding: `1` wall, `2` dot, `0` empty traversable, `3` pen door. Maze is vertically symmetric about the column boundary between 13 and 14.
- `game.js` — state + rules. Pacman blocked by wall and door (`3`); ghosts blocked only by wall (`1`). Tunnel row is `14` (open borders wrap). Speeds are fractional cells/frame (`PACMAN_SPEED=0.125`, `GHOST_SPEED=0.1`); actors only turn/decide when grid-aligned.
- `render.js` — canvas drawing, `TILE=20` (canvas 560×620 = 28×31 tiles). Reads `game.grid`, never `MAZE`, so eaten dots disappear.
- `main.js` — rAF loop, keyboard (arrows set `nextDir`), overlay/screens.

Coordinates are cell `(x,y)` with origin top-left, `x ∈ [0,27]`, `y ∈ [0,30]`.

## Conventions

- No new syntax transforms: assume ES5-flavored style (var-less `const`/`let`, but no modules, no arrow-free guarantees). Keep the existing style when editing.
- UI strings and `README.md` are in **Spanish** — match the user's prompt language when responding; keep game-facing strings in Spanish.

## Spec-driven workflow

This repo is a learning project for spec-driven development. Two skills are installed via `skills-lock.json` (source `klerith/fernando-skills`) under `.agents/skills/`:

- `/spec <feature>` — guided spec designer. Writes specs to `specs/NN-slug.md` (directory created on first use), state starts `Draft`. Never writes code. Ask in blocks, build section by section.
- `/spec-impl NN-slug` — implements an `Approved` spec; creates/switches to a `spec-NN-slug` git branch (configurable via `specs/.spec-config.yml`, `AutoCreateBranch` defaults `true`).

When a spec exists, trust it as the contract; do not improvise scope during implementation.