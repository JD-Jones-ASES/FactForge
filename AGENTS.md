# FactForge — Agent Rules

## Goal

Modular math practice site: relation packs where the player is given *n−1* facts and supplies the remaining fact. Prefer **exact** grading (ℚ, π, radicals); soft form hints for unreduced fractions unless form is the task. **Builder** at `/builder` exports URL/JSON presets (static, no server).

## Engineering level

**L2 — Product-shaped (lean)**

Shared engine + pack registry + iterative content; one static deployable, no backend.

## Stack

- Astro + React islands + TypeScript + pnpm
- Pure domain under `src/lib/**` (no UI imports)
- Vitest (math/engine/packs) + Playwright smoke
- CSS design tokens; themes **Ink** (default) + **Paper** (`data-theme`)

## Commands

- `pnpm dev` — local site
- `pnpm test` — unit tests
- `pnpm build` — production build (`ASTRO_BASE=/FactForge` for Pages check)
- `pnpm test:e2e` — Playwright smoke

## Notes for agents

### Packs & engine

- Packs: `src/lib/packs/*.ts` → register in `src/lib/engine/registry.ts`
- Default grade: exact `Frac` / symbolic π / string table — **not** float
- **Exceptions:** `right-trig` uses `gradeApprox` (±0.05); figures may use float **layout only**
- Soft form: `correct_form_hint` when value OK but unreduced (unless pack requires form)
- Choice packs: `inputKind() === 'choice'` + `answerChoices()` → chip UI in PlayApp
- Insert bar: `src/lib/engine/inserts.ts` (pack-aware π, √, y=, …)
- Hub badges: `src/lib/engine/hubMeta.ts`

### Figures

- Optional `figure` on `DisplayModel`; render in `FigureView.tsx`
- Labels: prefer clear wedges + leaders; clamp into viewBox; **don’t over-tune**
- To inspect a figure: Playwright screenshot of `[data-testid=figure-view]`

### Product rules (locked)

- Systems graph: mark intersection as **P only** — never leak `(?, y)` or `(x, ?)`
- Circles: exact π form (`6π`), not decimal π
- Unit circle: discrete table + **Undefined**; optional sec/csc/cot + radians labels
- All in-app links use `withBase(...)` for GitHub Pages base path `/FactForge/`
- No accounts, no backend, no spaced-repetition server stack

### Inspiration only

cyber-math-flashcards, fraction-flashcards, factoring — concept only, not code forks.
