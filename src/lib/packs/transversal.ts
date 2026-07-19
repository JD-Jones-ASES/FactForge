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
 * Parallel lines + transversal.
 * A = upper-left interior, B = upper-right interior,
 * C = lower-left interior, D = lower-right interior.
 * A = D (alternate interior), B = C (alternate interior),
 * A + B = 180°, C + D = 180°, A + C = 180° (consecutive), etc.
 */
export type TransversalConfig = {
  minAngle: number;
};

export const transversalPack: RelationPack<TransversalConfig> = {
  id: 'transversal',
  title: 'Parallel + transversal',
  blurb: 'Angle chase with parallel lines cut by a transversal.',
  band: 'Geometry',
  slots: [
    { id: 'A', kind: 'integer', label: '∠A' },
    { id: 'B', kind: 'integer', label: '∠B' },
    { id: 'C', kind: 'integer', label: '∠C' },
    { id: 'D', kind: 'integer', label: '∠D' },
  ],
  configSchema: [
    {
      key: 'minAngle',
      label: 'Acute seed ≥',
      type: 'range-select',
      options: [
        { value: '35', label: '35°' },
        { value: '40', label: '40°' },
        { value: '45', label: '45°' },
      ],
      default: '40',
    },
  ],
  defaultConfig() {
    return { minAngle: 40 };
  },
  parseConfig(raw) {
    return {
      minAngle: Math.min(70, Math.max(30, Number(raw.minAngle) || 40)),
    };
  },
  generate(config, rng) {
    const min = config.minAngle;
    const A = rng.int(min, 180 - min);
    const B = 180 - A;
    const C = B; // alternate exterior/interior pairing with our labeling
    const D = A;
    const hidden = rng.pick(['A', 'B', 'C', 'D'] as const);
    return {
      slots: {
        A: { t: 'frac', v: fromInt(A) },
        B: { t: 'frac', v: fromInt(B) },
        C: { t: 'frac', v: fromInt(C) },
        D: { t: 'frac', v: fromInt(D) },
      },
      hidden,
      meta: { A, B, C, D },
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
      message:
        'Not quite — with ∥ lines, alternate interiors are equal; consecutive interiors sum to 180°',
      expectedDisplay: `${formatFrac(expected)}°`,
    };
  },
  format(instance): DisplayModel {
    const A = (instance.slots.A as { v: Frac }).v.n;
    const B = (instance.slots.B as { v: Frac }).v.n;
    const C = (instance.slots.C as { v: Frac }).v.n;
    const D = (instance.slots.D as { v: Frac }).v.n;
    const h = instance.hidden;
    const lab = (id: string, v: number) => (h === id ? '?' : String(v));
    return {
      prompt: `Find ∠${h}`,
      pieces: [
        {
          kind: 'text',
          text: 'Alternate interiors equal · consecutive interiors sum to 180°',
        },
      ],
      figure: {
        kind: 'parallel-transversal',
        labels: {
          A: lab('A', A),
          B: lab('B', B),
          C: lab('C', C),
          D: lab('D', D),
        },
        seedDeg: A,
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
