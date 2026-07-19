import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  gradeRational,
  parseRational,
  type Rng,
} from '../math';

/**
 * a² + b² = c² over primitive / scaled integer triples.
 * Hide one of a, b, or c.
 */
export type PythagoreanConfig = {
  /** Max hypotenuse after scaling. */
  maxHyp: number;
};

/** Primitive triples (a ≤ b < c). */
const PRIMITIVES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [12, 35, 37],
  [9, 40, 41],
  [28, 45, 53],
  [11, 60, 61],
  [33, 56, 65],
  [16, 63, 65],
  [36, 77, 85],
  [39, 80, 89],
  [48, 55, 73],
  [13, 84, 85],
];

function triplesUpTo(maxHyp: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const [a0, b0, c0] of PRIMITIVES) {
    for (let k = 1; k * c0 <= maxHyp; k++) {
      out.push([a0 * k, b0 * k, c0 * k]);
    }
  }
  // also include a few multiples of 3-4-5 that hit common classroom sizes
  if (out.length === 0) {
    out.push([3, 4, 5]);
  }
  return out;
}

export const pythagoreanPack: RelationPack<PythagoreanConfig> = {
  id: 'pythagorean',
  title: 'Pythagorean theorem',
  blurb: 'a² + b² = c² for right triangles — find the missing side (integer triples).',
  band: 'Geometry',
  slots: [
    { id: 'a', kind: 'integer', label: 'a' },
    { id: 'b', kind: 'integer', label: 'b' },
    { id: 'c', kind: 'integer', label: 'c' },
  ],
  configSchema: [
    {
      key: 'maxHyp',
      label: 'Max hypotenuse',
      type: 'range-select',
      options: [
        { value: '25', label: '≤ 25' },
        { value: '50', label: '≤ 50' },
        { value: '100', label: '≤ 100' },
      ],
      default: '50',
    },
  ],
  defaultConfig() {
    return { maxHyp: 50 };
  },
  parseConfig(raw) {
    const n = Number(raw.maxHyp) || 50;
    return { maxHyp: Math.min(120, Math.max(13, n)) };
  },
  generate(config, rng) {
    const pool = triplesUpTo(config.maxHyp);
    const [a, b, c] = rng.pick(pool);
    // randomize which leg is a vs b for variety
    const legs = rng.bool() ? [a, b] : [b, a];
    const aa = legs[0]!;
    const bb = legs[1]!;
    const hidden = rng.pick(['a', 'b', 'c'] as const);
    return {
      slots: {
        a: { t: 'frac', v: fromInt(aa) },
        b: { t: 'frac', v: fromInt(bb) },
        c: { t: 'frac', v: fromInt(c) },
      },
      hidden,
      meta: { a: aa, b: bb, c },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseRational(rawInput.trim().replace(/°/g, ''));
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Value right — prefer ${formatFrac(expected)}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    return {
      status: 'incorrect',
      message: 'Not quite — use a² + b² = c²',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const a = Number(instance.meta?.a);
    const b = Number(instance.meta?.b);
    const c = Number(instance.meta?.c);
    const h = instance.hidden;
    const lab = (id: string, v: number) => (h === id ? '?' : String(v));
    return {
      prompt: 'Find the missing side of the right triangle',
      pieces: [
        {
          kind: 'text',
          text: `${lab('a', a)}² + ${lab('b', b)}² = ${lab('c', c)}²`,
        },
      ],
      figure: {
        kind: 'right-triangle',
        adj: a,
        opp: b,
        hyp: c,
        thetaDeg: 0,
        omitTheta: true,
        sideCaptions: {
          adj: lab('a', a),
          opp: lab('b', b),
          hyp: lab('c', c),
        },
      },
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots[instance.hidden] as { v: Frac }).v);
  },
  inputKind() {
    return 'integer';
  },
};
