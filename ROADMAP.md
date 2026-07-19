# FactForge roadmap

## Ideal build order (static-first)

| Phase | What | Status |
|-------|------|--------|
| 0–5 | Engine, keyboard, presets, packs, builder | **Done** |
| 6 | Theme packs (Ink + Paper) | **Done** |
| 7 | Geometry + figures | **Done v0.7** (foundation + 2 packs) |

## Done

- **v0.1–0.6** — platform, 11 number packs, themes, builder
- **v0.7**
  - `FigureSpec` on `DisplayModel` + `FigureView` SVG island
  - Layout helpers (law of sines triangle; linear pair sketch)
  - Packs: **Triangle angles**, **Linear pair** (Geometry band)
  - Exact integer degree grading; `°` accepted in input

## Next (optional)

1. More geometry: vertical angles, complementary pair, exterior angle
2. Shared angle-parse helper if more packs share it
3. Ship hygiene (private remote / Pages) on request
4. Stop bulk number packs unless a new relation type appears

## Deliberately not

- Backend progression, full CAS, drag-to-measure geometry (v1 is static figures)
