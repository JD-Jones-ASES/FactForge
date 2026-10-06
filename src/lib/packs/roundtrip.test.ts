import { describe, expect, it } from 'vitest';
import { createRng } from '../math/rng';
import { listPacks } from '../engine/registry';

/**
 * Every pack must accept its own expected answer for many seeded instances
 * under default config and under each select option. This catches
 * generator/grader drift without pack-specific fixtures.
 */
function normalize(s: string): string {
  return s.replace(/−/g, '-').replace(/°/g, '');
}

describe('pack round-trip (expectedDisplay is accepted by check)', () => {
  for (const pack of listPacks()) {
    it(`${pack.id} — default config`, () => {
      const config = pack.parseConfig(pack.defaultConfig() as Record<string, unknown>);
      const rng = createRng(2024);
      for (let i = 0; i < 40; i++) {
        const inst = pack.generate(config, rng);
        const display = pack.format(inst);
        expect(display.prompt.length).toBeGreaterThan(0);
        expect(display.pieces.length).toBeGreaterThan(0);
        const ans = pack.expectedDisplay(inst, config);
        expect(ans.length, `${pack.id} empty expected`).toBeGreaterThan(0);
        const res = pack.check(inst, normalize(ans), config);
        expect(res.status, `${pack.id}: "${ans}" → ${res.message}`).toMatch(/^correct/);
      }
    });

    it(`${pack.id} — every select option`, () => {
      const base = pack.defaultConfig() as Record<string, unknown>;
      for (const field of pack.configSchema) {
        if (field.type !== 'select' && field.type !== 'range-select') continue;
        for (const opt of field.options ?? []) {
          const raw = { ...base, [field.key]: opt.value };
          const config = pack.parseConfig(raw);
          const rng = createRng(77);
          for (let i = 0; i < 12; i++) {
            const inst = pack.generate(config, rng);
            const ans = pack.expectedDisplay(inst, config);
            const res = pack.check(inst, normalize(ans), config);
            expect(
              res.status,
              `${pack.id} [${field.key}=${opt.value}]: "${ans}" → ${res.message}`,
            ).toMatch(/^correct/);
          }
        }
      }
    });

    it(`${pack.id} — toggles on`, () => {
      const base = pack.defaultConfig() as Record<string, unknown>;
      const raw = { ...base };
      for (const field of pack.configSchema) {
        if (field.type === 'toggle') raw[field.key] = true;
        if (field.type === 'multi-ops') raw[field.key] = (field.options ?? []).map((o) => o.value);
      }
      const config = pack.parseConfig(raw);
      const rng = createRng(9);
      for (let i = 0; i < 25; i++) {
        const inst = pack.generate(config, rng);
        const ans = pack.expectedDisplay(inst, config);
        const res = pack.check(inst, normalize(ans), config);
        expect(res.status, `${pack.id} [all on]: "${ans}" → ${res.message}`).toMatch(/^correct/);
      }
    });
  }
});
