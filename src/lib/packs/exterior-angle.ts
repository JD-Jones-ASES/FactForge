import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  gradeRational,
  type Rng,
} from '../math';
import { parseAngleInput } from '../math/angle';

/**
 * Exterior angle equals sum of remote interior angles: E = A + B.
 * Also E + C = 180° where C is the adjacent interior angle.
 */
export type ExteriorAngleConfig = {
  minAngle: number;
};

export const exteriorAnglePack: RelationPack<ExteriorAngleConfig> = {
  id: 'exterior-angle',
  title: 'Exterior angle',
  blurb: 'Exterior angle = sum of remote interiors. Find the missing measure.',
  band: 'Geometry',
  slots: [
    { id: 'A', kind: 'integer', label: 'Remote A' },
    { id: 'B', kind: 'integer', label: 'Remote B' },
    { id: 'E', kind: 'integer', label: 'Exterior' },
  ],
  configSchema: [
    {
      key: 'minAngle',
      label: 'Smallest remote ≥',
      type: 'range-select',
      options: [
        { value: '20', label: '20°' },
        { value: '25', label: '25°' },
        { value: '30', label: '30°' },
      ],
      default: '25',
    },
  ],
  defaultConfig() {
    return { minAngle: 25 };
  },
  parseConfig(raw) {
    return {
      minAngle: Math.min(45, Math.max(15, Number(raw.minAngle) || 25)),
    };
  },
  generate(config, rng) {
    const min = config.minAngle;
    for (let i = 0; i < 40; i++) {
      const A = rng.int(min, 80);
      const B = rng.int(min, 80);
      const E = A + B;
      const C = 180 - E;
      if (C < min || C > 120) continue;
      const hidden = rng.pick(['A', 'B', 'E'] as const);
      return {
        slots: {
          A: { t: 'frac', v: fromInt(A) },
          B: { t: 'frac', v: fromInt(B) },
          E: { t: 'frac', v: fromInt(E) },
        },
        hidden,
        meta: { A, B, C, E },
      };
    }
    return {
      slots: {
        A: { t: 'frac', v: fromInt(40) },
        B: { t: 'frac', v: fromInt(55) },
        E: { t: 'frac', v: fromInt(95) },
      },
      hidden: 'E',
      meta: { A: 40, B: 55, C: 85, E: 95 },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseAngleInput(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct — prefer ${formatFrac(expected)}°`,
        expectedDisplay: `${formatFrac(expected)}°`,
      };
    }
    return {
      status: 'incorrect',
      message: 'Not quite — exterior = sum of the two remote interior angles',
      expectedDisplay: `${formatFrac(expected)}°`,
    };
  },
  format(instance): DisplayModel {
    const A = (instance.slots.A as { v: Frac }).v.n;
    const B = (instance.slots.B as { v: Frac }).v.n;
    const E = (instance.slots.E as { v: Frac }).v.n;
    const C = (instance.meta?.C as number) ?? 180 - E;
    const h = instance.hidden;
    const lab = (id: string, v: number) => (h === id ? '?' : String(v));
    return {
      prompt:
        h === 'E'
          ? 'Find the exterior angle'
          : `Find remote interior ∠${h}`,
      pieces: [
        {
          kind: 'text',
          text: 'E = A + B  (exterior angle theorem)',
        },
      ],
      figure: {
        kind: 'exterior-angle',
        labels: {
          A: lab('A', A),
          B: lab('B', B),
          E: lab('E', E),
        },
        measures: { A, B, C, E },
      },
    };
  },
  expectedDisplay(instance) {
    return `${formatFrac((instance.slots[instance.hidden] as { v: Frac }).v)}°`;
  },
  inputKind() {
    return 'integer';
  },
};
