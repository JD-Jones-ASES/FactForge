# FactForge

Modular math games built around one idea: **given *n*−1 facts about a relation, find the remaining fact.**

Middle school through intro algebra/trig, mostly exact ℚ (plus π, radicals, unit-circle values). Equivalent answers count; unreduced fractions get a gentle nudge unless reducing is the point.

## Engineering level: L2 — Product-shaped (lean)

One static site: pluggable **relation engine**, band-grouped hub, shared play shell, **Builder** (`/builder`) for shareable URL/JSON presets. No server, no accounts.

## Stack

- Astro + React islands + TypeScript + pnpm
- Exact ℚ under `src/lib/math` · Vitest + Playwright smoke
- Themes: **Ink** (default), **Paper** (header switcher)

## Run

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
pnpm build
pnpm test:e2e   # pnpm exec playwright install chromium once
```

## Packs (v0.13 · 23 packs)

| Band | Packs |
|------|--------|
| Arithmetic | Integer ops |
| Fractions | Fraction ops, Reduce & equivalent |
| Number structure | GCF & LCM |
| Proportional | Proportions, Percent of |
| Algebra | Rationalize, Linear equations, Write a line, Linear systems, Factor, Expand, Powers, Roots |
| Geometry | Triangle, Linear pair, Vertical, Complementary, Exterior, Transversal, Circles |
| Trig | Unit circle (chips + Undefined), Right-triangle trig (±0.05) |

**UX:** keyboard-first play · insert bar (`π`, `√`, `y=`, …) · share presets `?c=&play=1`

## Add a pack

1. `src/lib/packs/my-pack.ts` implementing `RelationPack`
2. Register in `src/lib/engine/registry.ts`
3. Optional figure kind in `FigureView` + `FigureSpec`
4. Optional inserts in `src/lib/engine/inserts.ts`

## Inspiration (not copies)

- [cyber-math-flashcards](https://github.com/JD-Jones-ASES/cyber-math-flashcards)
- [fraction-flashcards](https://github.com/JD-Jones-ASES/fraction-flashcards)
- [factoring](https://github.com/JD-Jones-ASES/factoring)

QuestMath is conceptual inspiration only (not the stack).

## License

MIT © JD Jones
