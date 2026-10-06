import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, type Frac, formatFrac, parseRational, eq, neg } from '../math';
import { gradeRationalAnswer } from '../engine/grade';

/**
 * Given one trig ratio and the quadrant, find another exactly.
 * Built on Pythagorean triples so every ratio is a signed rational:
 *   sin θ = −5/13, θ in Q III  →  cos θ = −12/13, tan θ = 5/12, …
 */
export type TrigIdentityConfig = {
  /** Functions that may be asked for. */
  find: FnKey[];
  /** Functions that may be given. */
  given: 'sin-cos' | 'sin-cos-tan' | 'all';
  quadrants: 'first' | 'all';
};

type FnKey = 'sin' | 'cos' | 'tan' | 'sec' | 'csc' | 'cot';
const ALL_FNS: FnKey[] = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'];

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
];

/** Signs of (x, y) by quadrant. */
const QUAD_SIGN: Record<number, [number, number]> = {
  1: [1, 1],
  2: [-1, 1],
  3: [-1, -1],
  4: [1, -1],
};
const ROMAN = ['I', 'II', 'III', 'IV'];

/** All six ratios for a point (x, y) at distance r from the origin. */
export function ratiosFor(x: number, y: number, r: number): Record<FnKey, Frac> {
  return {
    sin: frac(y, r),
    cos: frac(x, r),
    tan: frac(y, x),
    sec: frac(r, x),
    csc: frac(r, y),
    cot: frac(x, y),
  };
}

export const trigIdentityPack: RelationPack<TrigIdentityConfig> = {
  id: 'trig-identity',
  title: 'Trig ratios from one ratio',
  blurb: 'Given sin θ = −5/13 in Q III, find cos θ, tan θ, … exactly via Pythagorean identities.',
  band: 'Trig',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given ratio' },
    { id: 'answer', kind: 'rational', label: 'Ratio' },
  ],
  configSchema: [
    {
      key: 'find',
      label: 'Find',
      type: 'multi-ops',
      options: ALL_FNS.map((f) => ({ value: f, label: f })),
      default: ['sin', 'cos', 'tan'],
    },
    {
      key: 'given',
      label: 'Given ratio',
      type: 'select',
      options: [
        { value: 'sin-cos', label: 'sin or cos' },
        { value: 'sin-cos-tan', label: 'sin, cos, or tan' },
        { value: 'all', label: 'Any of the six' },
      ],
      default: 'sin-cos',
    },
    {
      key: 'quadrants',
      label: 'Quadrants',
      type: 'select',
      options: [
        { value: 'first', label: 'Quadrant I only (all positive)' },
        { value: 'all', label: 'All four (watch signs)' },
      ],
      default: 'all',
    },
  ],
  defaultConfig() {
    return { find: ['sin', 'cos', 'tan'], given: 'sin-cos', quadrants: 'all' };
  },
  parseConfig(raw) {
    const find: FnKey[] = Array.isArray(raw.find)
      ? (raw.find.filter((f) => ALL_FNS.includes(f as FnKey)) as FnKey[])
      : ['sin', 'cos', 'tan'];
    const given =
      raw.given === 'sin-cos' || raw.given === 'sin-cos-tan' || raw.given === 'all' ? raw.given : 'sin-cos';
    const quadrants = raw.quadrants === 'first' ? 'first' : 'all';
    return { find: find.length ? find : ['cos'], given, quadrants };
  },
  generate(config, rng) {
    const [a, b, r] = rng.pick(TRIPLES);
    const [lx, ly] = rng.bool() ? [a, b] : [b, a];
    const q = config.quadrants === 'first' ? 1 : rng.int(1, 4);
    const [sx, sy] = QUAD_SIGN[q]!;
    const ratios = ratiosFor(sx * lx, sy * ly, r);
    const givenPool: FnKey[] =
      config.given === 'sin-cos' ? ['sin', 'cos'] : config.given === 'sin-cos-tan' ? ['sin', 'cos', 'tan'] : ALL_FNS;
    const givenFn = rng.pick(givenPool);
    const askable = config.find.filter((f) => f !== givenFn);
    const askFn = askable.length ? rng.pick(askable) : rng.pick(ALL_FNS.filter((f) => f !== givenFn));
    return {
      slots: {
        given: { t: 'expr', v: `${givenFn} θ = ${formatFrac(ratios[givenFn])}, Q${ROMAN[q - 1]}` },
        answer: { t: 'frac', v: ratios[askFn] },
      },
      hidden: 'answer',
      meta: { givenFn, askFn, q, ratios },
    };
  },
  check(instance, rawInput) {
    const expected = (instance.slots.answer as { v: Frac }).v;
    const q = Number(instance.meta?.q);
    const parsed = parseRational(rawInput);
    if (parsed.ok && !eq(parsed.value, expected) && eq(parsed.value, neg(expected))) {
      return {
        status: 'incorrect',
        message: `Right size, wrong sign — check the signs of x and y in Quadrant ${ROMAN[q - 1]}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    return gradeRationalAnswer(expected, rawInput, {
      wrongMessage: 'Not quite — sketch the reference triangle and use x² + y² = r²',
    });
  },
  format(instance): DisplayModel {
    const askFn = String(instance.meta?.askFn);
    const given = String(instance.slots.given.v);
    return {
      prompt: 'Find the exact value (use the Pythagorean identity and the quadrant signs)',
      pieces: [
        { kind: 'text', text: `${given}.   ${askFn} θ = ` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots.answer as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
