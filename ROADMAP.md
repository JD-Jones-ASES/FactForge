# FactForge roadmap

## Ideal build order (static-first)

This is the ordering we *should* have followed and now continue:

| Phase | What | Why first |
|-------|------|-----------|
| **0** | Engine + shell skeleton | One play loop, many packs |
| **1** | **Keyboard / focus law** | Human friction kills drills; Enter = next normal action |
| **2** | **URL + JSON presets** | Multiplies every pack (share, deep link, future builder) without content work |
| **3** | Seed packs (arithmetic → algebra) | Prove content plugs into shell |
| **4** | Expand packs on the same engine | Curriculum surface area |
| **5** | Light builder UI over presets | Snap-together without new pack modules |
| **6** | Theme packs (token rebinds) | Skin, not structure |
| **7** | Geometry + figures | Needs display/graphics capability; after static text relations are thick |

**Not on this path:** backends, accounts, FSRS, adaptive server state.

## Done

### v0.1

- Relation engine + pack registry
- Five seed packs + Ink theme + exact ℚ grading

### v0.2 (this cut)

- Keyboard: form Enter to start, focus handoff answer ↔ Next, Esc clear/setup, hints
- Skip link, setup as real `<form>`
- URL `?c=` / `?play=1` presets + setup/play/JSON share + import JSON
- Packs: **GCF & LCM**, **Proportions**, **Percent of** (8 total)

## Next (still static)

1. More packs: expand↔factor reverse, integer powers/roots (exact), one-step with hide-coefficient, order-of-ops (bounded)
2. Builder page: pick template + knobs → export link/JSON (UI over existing codecs)
3. Optional second theme (cyber / sakura tokens only)
4. Geometry relations **when** we add a figure layer (SVG islands): angle chase, triangle sum, parallel lines, circle arc/central — same missing-fact engine

## Deliberately not FactForge

- QuestMath-style server progress / FSRS / ChatGPT Sites
- Full CAS / unrestricted symbolic algebra
