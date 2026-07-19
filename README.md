# FactForge

Modular math games built around one idea: **given *n*−1 facts about a relation, find the remaining fact.**

Middle-school arithmetic through intro algebra, over a large subset of the rationals, with **equivalent-answer** grading and gentle form hints (e.g. “correct — reduce to ½”).

## Engineering level: L2 — Product-shaped (lean)

One static site, a pluggable **relation engine**, and **packs** that plug into a shared play shell. Hub is band-grouped; **Builder** exports shareable preset URLs.

## Stack

- Astro + React islands + TypeScript + pnpm
- Exact ℚ arithmetic (`src/lib/math`)
- Vitest (domain) + Playwright (smoke)

## Run

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
pnpm build
pnpm test:e2e   # needs browsers: pnpm exec playwright install chromium
```

## Packs (v0.10)

| Band | Packs |
|------|--------|
| Arithmetic | Integer ops |
| Fractions | Fraction ops, Reduce & equivalent |
| Number structure | GCF & LCM |
| Proportional | Proportions, Percent of |
| Algebra | Rationalize, Linear solve, Write a line, Factor, Expand, Powers, Roots |
| Geometry | Triangle, Linear pair, Vertical, Complementary, Exterior, Transversal, Circles |

**Builder:** `/builder` · **Themes:** Ink / Paper · Circles need exact **π** (e.g. `6π`)

Next up: systems + graphs, unit circle (Undefined), right-triangle trig (±0.05).

## Keyboard

- **Setup:** `Tab` through options · `Space` toggles chips · `Enter` starts  
- **Play:** `Enter` checks or advances · `Esc` clears answer / returns to setup · `?` shows answer after a miss  
- **Insert bar:** pack-aware symbols (`π`, `√`, `y=`, `/`, `°`, …) insert at the caret — no need to hunt unicode  

Also make sure parse for circles accepts "pi" when typed - already does. Insert uses π unicode.

Improve transversal format prompt to mention A B C D positions.

## Share presets (static)

On any pack setup/play page:

- **Setup link** / **Play link** — `?c=<base64url config>&play=1`
- **JSON** — `{ "v": 1, "packId", "config" }` import under Setup  

No server; links are the entire game.

## Theme

Default theme pack: **Ink** — dark, high contrast, single teal accent. Future themes only rebind CSS tokens.

## Add a pack

1. Create `src/lib/packs/my-pack.ts` implementing `RelationPack`
2. Register in `src/lib/engine/registry.ts`
3. Hub and `/play/[packId]` pick it up automatically

## Inspiration (not copies)

- [cyber-math-flashcards](https://github.com/JD-Jones-ASES/cyber-math-flashcards)
- [fraction-flashcards](https://github.com/JD-Jones-ASES/fraction-flashcards)
- [factoring](https://github.com/JD-Jones-ASES/factoring)

QuestMath’s five-slot idea is conceptual inspiration only; FactForge is a separate static product.

## License

MIT © JD Jones
