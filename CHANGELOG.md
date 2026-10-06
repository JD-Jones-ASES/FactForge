# Changelog

## 0.15.0

- 30 new packs (25 → 55) spanning middle-school arithmetic through pre-calculus
  - Arithmetic / number: order of operations, decimal ops, mixed ↔ improper, fraction / decimal / percent, prime factorization, exponent rules, scientific notation, percent change
  - Algebra: linear inequalities, absolute value, slope & intercepts, simplify radicals, solve quadratics, parabola vertex
  - Functions (new band): function notation & composition, average rate of change, logarithms, arithmetic & geometric sequences
  - Geometry: polygon angles, area & perimeter, volume & surface area (exact π), arcs & sectors, distance & midpoint
  - Trig: special right triangles, degrees ↔ radians, reference & coterminal angles, trig ratios from one ratio, inverse trig (choice chips, principal ranges)
  - Data (new band): mean / median / mode / range, factorials / permutations / combinations
- Shared math: exact radicals (`a√b/c`), terminating decimals, solution-set / point / inequality parsers; `kπ/d` parsing and display
- Figures: parabola, 2-D shapes, regular polygons, circle sectors; unit-circle label/caption overrides
- Hub: Functions and Data bands; insert bars for every new pack; round-trip invariant test (each pack accepts its own expected answer under every config option)

## 0.14.1

- CI: `pnpm typecheck` (`tsc --noEmit`) before unit/build
- e2e: catalog-driven hub + play load for every registered pack

## 0.14.0

- Hub: sticky band jump, pack trait badges, resume last pack
- Play: clearer form-hint feedback; more discoverable show-answer
- Packs: supplementary angles; Pythagorean theorem (integer triples)
- Unit circle: sec / csc / cot; degrees / radians / mix
- Public docs and GitHub Pages deploy under `/FactForge/`

## 0.13.0

- Linear systems with graph (intersection labeled **P** only)
- Unit circle (sin/cos/tan) and right-triangle trig (±0.05)
- Transversal label layout polish

## 0.10.0 – 0.12.0

- Geometry figure layer; circles with exact π; rationalize; write-a-line
- Insert bar; roots radical notation

## 0.1.0 – 0.7.0

- Relation engine, keyboard shell, URL/JSON presets, builder
- Arithmetic through algebra packs; Ink + Paper themes
