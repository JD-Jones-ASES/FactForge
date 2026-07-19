# FactForge — Agent Rules

Parent process: `~/Documents/Grok-Brain` (see that vault’s AGENTS.md).

## Goal

Modular math practice site: relation packs where the player is given *n−1* facts and supplies the remaining fact. Prefer **exact** grading (ℚ, π, radicals); soft form hints for unreduced fractions unless form is the task. Structure for many packs; **Builder** at `/builder` exports URL/JSON presets (static, no server).

## Engineering level

**L2 — Product-shaped (lean)**

Rationale: shared engine + pack registry + iterative content; still one static deployable, no server.

## Stack

- Astro + React islands + TypeScript + pnpm
- Pure domain under `src/lib/**` (no UI imports)
- Vitest (math/engine/packs) + Playwright smoke
- CSS design tokens; themes **Ink** (default) + **Paper** (`data-theme`)

## Commands

- `pnpm dev` — local site
- `pnpm test` — unit tests
- `pnpm build` — production build
- `pnpm test:e2e` — Playwright smoke (reuse server on :4321 if already up)

## Notes for Grok

### Packs & engine

- Packs: `src/lib/packs/*.ts` → register in `src/lib/engine/registry.ts`
- Default grade: exact `Frac` / symbolic π / string table — **not** float
- **Exceptions:** `right-trig` uses `gradeApprox` (±0.05); figures may use float **layout only**
- Soft form: `correct_form_hint` when value OK but unreduced (unless pack requires form)
- Choice packs: `inputKind() === 'choice'` + `answerChoices()` → chip UI in PlayApp
- Insert bar: `src/lib/engine/inserts.ts` (pack-aware π, √, y=, …)

### Figures

- Optional `figure` on `DisplayModel`; render in `FigureView.tsx`
- Labels: prefer clear wedges + leaders; clamp into viewBox; **don’t over-tune**
- **To “see” a figure:** Playwright screenshot of `[data-testid=figure-view]`, then `read_file` the PNG (multimodal). JD can also attach a screenshot.

### Product rules (locked)

- Systems graph: mark intersection as **P only** — never leak `(?, y)` or `(x, ?)`
- Circles: exact π form (`6π`), not decimal π
- Unit circle: discrete table + **Undefined**
- No QuestMath stack (no D1/auth/FSRS); no public Pages unless JD approves

### Inspiration only

cyber-math-flashcards, fraction-flashcards, factoring; QuestMath five-slot concept only.
