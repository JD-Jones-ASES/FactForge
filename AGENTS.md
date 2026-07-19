# FactForge — Agent Rules

Parent process: `~/Documents/Grok-Brain` (see that vault’s AGENTS.md).

## Goal

Modular math practice site: relation packs where the player is given *n−1* facts and supplies the remaining fact. Exact rationals, equivalent-answer grading, soft form hints (e.g. unreduced fractions). Structure for many packs; custom builder is v1.1+.

## Engineering level

**L2 — Product-shaped (lean)**

Rationale: shared engine + pack registry + iterative content; still one static deployable, no server.

## Stack

- Astro + React islands + TypeScript + pnpm
- Pure domain under `src/lib/**` (no UI imports)
- Vitest for math/engine/packs; Playwright smoke for hub/play
- CSS design tokens; default theme **Ink** (`data-theme="ink"`)

## Commands

- `pnpm dev` — local site
- `pnpm test` — unit tests
- `pnpm build` — production build
- `pnpm test:e2e` — Playwright smoke

## Notes for Grok

- Packs live in `src/lib/packs/` and register in `src/lib/engine/registry.ts`
- Grading uses exact `Frac` equality, never float
- Soft form: `correct_form_hint` when value is right but unreduced (unless pack requires reduced form)
- Inspiration only: cyber-math-flashcards, fraction-flashcards, factoring, QuestMath five-slot concept — not those stacks
- Do not enterprise-ify; no D1/auth/FSRS in this product
- Public GitHub Pages only when JD explicitly approves
