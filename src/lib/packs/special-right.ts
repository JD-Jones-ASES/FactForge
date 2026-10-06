import type { RelationPack, DisplayModel } from '../engine/types';
import {
  fromInt,
  frac,
  type Radical,
  simplifyRadical,
  parseRadical,
  formatRadical,
  eqRadical,
  mulRadical,
  scaleRadical,
  radicalToNumber,
} from '../math';

/**
 * Special right triangles with exact sides:
 *   45-45-90 → legs x, hypotenuse x√2
 *   30-60-90 → short x, long x√3, hypotenuse 2x
 * One side is given; find another exactly (e.g. 5√3, 7√2/2).
 */
export type SpecialRightConfig = {
  triangles: Tri[];
  given: 'any' | 'leg' | 'hyp';
};

type Tri = '45' | '30';
const ALL_TRIS: Tri[] = ['45', '30'];

type Side = 'short' | 'long' | 'hyp';

export const specialRightPack: RelationPack<SpecialRightConfig> = {
  id: 'special-right',
  title: 'Special right triangles',
  blurb: '30-60-90 and 45-45-90: exact sides like 5√3 or 7√2/2.',
  band: 'Trig',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given side' },
    { id: 'answer', kind: 'expression', label: 'Side' },
  ],
  configSchema: [
    {
      key: 'triangles',
      label: 'Triangles',
      type: 'multi-ops',
      options: [
        { value: '45', label: '45-45-90' },
        { value: '30', label: '30-60-90' },
      ],
      default: ALL_TRIS,
    },
    {
      key: 'given',
      label: 'Given side',
      type: 'select',
      options: [
        { value: 'any', label: 'Any side' },
        { value: 'leg', label: 'A leg (multiply)' },
        { value: 'hyp', label: 'Hypotenuse (divide → rationalize)' },
      ],
      default: 'any',
    },
  ],
  defaultConfig() {
    return { triangles: ALL_TRIS, given: 'any' };
  },
  parseConfig(raw) {
    const triangles = Array.isArray(raw.triangles)
      ? (raw.triangles.filter((t) => ALL_TRIS.includes(t as Tri)) as Tri[])
      : ALL_TRIS;
    const given = raw.given === 'leg' || raw.given === 'hyp' || raw.given === 'any' ? raw.given : 'any';
    return { triangles: triangles.length ? triangles : ALL_TRIS, given };
  },
  generate(config, rng) {
    const tri = rng.pick(config.triangles);
    // Pick which side is given and make that side a clean integer.
    const sides: Side[] = tri === '45' ? ['short', 'hyp'] : ['short', 'long', 'hyp'];
    const legs = sides.filter((s) => s !== 'hyp');
    const givenSide: Side =
      config.given === 'hyp' ? 'hyp' : config.given === 'leg' ? rng.pick(legs) : rng.pick(sides);
    const n = rng.int(2, 12);
    const givenVal: Radical = { coef: fromInt(n), rad: 1 };

    // Express x (the short leg / 45° leg) from the given side.
    let x: Radical;
    if (tri === '45') {
      // hyp = x√2 → x = n/√2 = n√2/2
      x = givenSide === 'hyp' ? simplifyRadical(frac(n, 2), 2) : givenVal;
    } else if (givenSide === 'short') {
      x = givenVal;
    } else if (givenSide === 'long') {
      // long = x√3 → x = n/√3 = n√3/3
      x = simplifyRadical(frac(n, 3), 3);
    } else {
      x = { coef: frac(n, 2), rad: 1 };
    }

    const all: Record<Side, Radical> =
      tri === '45'
        ? { short: x, long: x, hyp: mulRadical(x, { coef: fromInt(1), rad: 2 }) }
        : { short: x, long: mulRadical(x, { coef: fromInt(1), rad: 3 }), hyp: scaleRadical(x, fromInt(2)) };

    const askable = sides.filter((s) => s !== givenSide);
    const askSide = rng.pick(askable);
    const answer = all[askSide];
    return {
      slots: {
        given: { t: 'expr', v: `${givenSide} = ${n}` },
        answer: { t: 'expr', v: formatRadical(answer) },
      },
      hidden: 'answer',
      meta: { tri, givenSide, askSide, n, answer, all },
    };
  },
  check(instance, rawInput) {
    const expected = instance.meta?.answer as Radical;
    const target = formatRadical(expected);
    if (/\/\s*√|\/\s*sqrt/i.test(rawInput)) {
      return { status: 'incorrect', message: 'Rationalize the denominator', expectedDisplay: target };
    }
    const parsed = parseRadical(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    if (eqRadical(parsed.value, expected)) {
      if (!parsed.simplified) {
        return { status: 'correct_form_hint', message: `Correct — simplest form is ${target}`, expectedDisplay: target };
      }
      return { status: 'correct', message: 'Correct' };
    }
    return { status: 'incorrect', message: 'Not quite', expectedDisplay: target };
  },
  format(instance): DisplayModel {
    const tri = String(instance.meta?.tri);
    const givenSide = instance.meta?.givenSide as Side;
    const askSide = instance.meta?.askSide as Side;
    const n = Number(instance.meta?.n);
    const all = instance.meta?.all as Record<Side, Radical>;
    const name = (s: Side) =>
      tri === '45' ? (s === 'hyp' ? 'hypotenuse' : 'leg') : s === 'hyp' ? 'hypotenuse' : s === 'short' ? 'short leg (opposite 30°)' : 'long leg (opposite 60°)';
    const cap = (s: Side) => (s === givenSide ? String(n) : s === askSide ? '?' : formatRadical(all[s]));
    const ratio = tri === '45' ? 'x : x : x√2' : 'x : x√3 : 2x';
    return {
      prompt: `${tri === '45' ? '45-45-90' : '30-60-90'} triangle (${ratio}). Given the ${name(givenSide)} = ${n}, find the ${name(askSide)}.`,
      pieces: [
        { kind: 'text', text: `${name(askSide)} = ` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure: {
        kind: 'right-triangle',
        adj: radicalToNumber(all.long),
        opp: radicalToNumber(all.short),
        hyp: radicalToNumber(all.hyp),
        thetaDeg: tri === '45' ? 45 : 30,
        sideCaptions: { adj: cap('long'), opp: cap('short'), hyp: cap('hyp') },
      },
    };
  },
  expectedDisplay(instance) {
    return formatRadical(instance.meta?.answer as Radical);
  },
  inputKind() {
    return 'expression';
  },
};
