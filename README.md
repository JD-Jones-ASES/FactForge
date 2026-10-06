# FactForge

**v0.15** · Modular math drills built around one idea: **given *n*−1 facts about a relation, find the remaining fact.**

Middle school arithmetic through the high school topics that feed into calculus — functions, logs, sequences, trig identities, inverse trig — with knobs to tailor each drill. Most packs grade **exactly** over rationals (plus π, radicals, and discrete unit-circle values). Equivalent answers count; unreduced fractions get a gentle form nudge unless reducing is the point.

**Live site:** [https://jd-jones-ases.github.io/FactForge/](https://jd-jones-ases.github.io/FactForge/)

Sibling projects: [Algebra Lab](https://github.com/JD-Jones-ASES/Algebra-Lab) · [Linear Algebra Lab](https://github.com/JD-Jones-ASES/Linear-Algebra-Lab)

## Features

| Area | Highlights |
|------|------------|
| **Hub** | Band-grouped packs, jump links, trait badges, resume last pack |
| **Play shell** | Setup → drill → grade · keyboard (Enter / Esc / ?) · streak & accuracy |
| **Insert bar** | Pack-aware tokens (`π`, `√`, `y=`, `°`, …) |
| **Builder** | `/builder` — knobs → shareable setup/play URL or JSON (static, no account) |
| **Themes** | **Ink** (default dark) and **Paper** (light) |
| **Figures** | SVG for geometry (angles, polygons, 2-D shapes, sectors), systems graphs, parabolas, unit circle, right triangles |
| **Presets** | `?c=<base64url>&play=1` on any pack |

## Packs (55)

| Band | Packs |
|------|--------|
| Arithmetic | Integer ops · Order of operations · Decimal ops |
| Fractions | Fraction ops · Reduce & equivalent · Mixed ↔ improper · Fraction / decimal / percent |
| Number structure | GCF & LCM · Prime factorization · Exponent rules · Scientific notation |
| Proportional | Proportions · Percent of · Percent change |
| Algebra | Linear equations · Linear inequalities · Absolute value · Slope & intercepts · Write a line · Linear systems · Expand · Factor · Solve quadratics · Powers · Roots · Simplify radicals · Rationalize |
| Functions | Function notation & composition · Parabola vertex · Average rate of change · Logarithms · Sequences |
| Geometry | Triangle · Linear pair · Vertical · Complementary · Supplementary · Exterior · Transversal · Polygon angles · Area & perimeter · Circles · Arcs & sectors · Volume & surface area · Pythagorean · Distance & midpoint |
| Trig | Special right triangles · Degrees ↔ radians · Reference & coterminal angles · Unit circle (choice chips + Undefined) · Trig ratios from one ratio · Inverse trig (choice chips) · Right-triangle trig (±0.05) |
| Data | Mean / median / mode / range · Factorials, permutations & combinations |

Every pack exposes config knobs (operand ranges, sub-skills, angle units, which fact is hidden, …) that the **Builder** turns into shareable preset links.

## Stack

- [Astro](https://astro.build) + React islands + TypeScript
- Exact ℚ helpers under `src/lib/math/`
- Relation engine under `src/lib/engine/`
- Vitest (unit) + Playwright (smoke e2e)
- pnpm

**Level:** product-shaped lean static site — no server, no accounts.

## Requirements

- Node.js ≥ 22.12
- pnpm

## Run

```bash
pnpm install
pnpm dev
```

```bash
pnpm test        # Vitest
pnpm test:e2e    # Playwright smoke (starts its own dev server)
pnpm build
pnpm preview
```

First-time e2e browsers (if needed):

```bash
pnpm exec playwright install chromium
```

GitHub Pages uses base path `/FactForge/`. Local check:

```bash
ASTRO_BASE=/FactForge pnpm build
```

## Project layout

| Path | Role |
|------|------|
| `src/lib/engine/` | Pack registry, session, presets, insert bar |
| `src/lib/math/` | Exact fractions, π forms, approx grading, RNG |
| `src/lib/packs/` | One file per relation pack |
| `src/lib/geom/` | Figure layout helpers |
| `src/components/` | Play shell, builder, figures, inputs |
| `e2e/` | Playwright smoke |
| `AGENTS.md` | Conventions for coding agents |
| `ROADMAP.md` | Shipped vs later ideas |

## Add a pack

1. `src/lib/packs/my-pack.ts` implementing `RelationPack`
2. Register in `src/lib/engine/registry.ts`
3. Optional figure kind in `FigureView` + `FigureSpec`
4. Optional inserts in `src/lib/engine/inserts.ts`
5. Optional hub badges in `src/lib/engine/hubMeta.ts`

## Deploy

Push to `main` runs **Deploy GitHub Pages** (`.github/workflows/pages.yml`): unit tests, then build with `ASTRO_BASE=/FactForge`, then deploy.

## Inspiration (not copies)

Earlier flashcard experiments shaped the drill loop:

- [cyber-math-flashcards](https://github.com/JD-Jones-ASES/cyber-math-flashcards)
- [fraction-flashcards](https://github.com/JD-Jones-ASES/fraction-flashcards)
- [factoring](https://github.com/JD-Jones-ASES/factoring)

## License

MIT © 2026 JD Jones
