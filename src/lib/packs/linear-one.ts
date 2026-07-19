import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  add,
  mul,
  type Rng,
} from '../math';

/**
 * Relation: a·x + b = c  (one- and two-step linear).
 * Generate by sampling a, x, b then c = a*x+b so x is always rational unique.
 */
export type LinearOneConfig = {
  maxCoeff: number;
  hideMode: 'x' | 'c' | 'both';
  allowFractionX: boolean;
};

function sampleInt(rng: Rng, max: number, allowZero: boolean): number {
  if (allowZero) return rng.int(-max, max);
  let n = 0;
  while (n === 0) n = rng.int(-max, max);
  return n;
}

export const linearOnePack: RelationPack<LinearOneConfig> = {
  id: 'linear-one',
  title: 'Linear equations',
  blurb: 'Solve ax + b = c, or find a missing piece of the equation.',
  band: 'Algebra',
  slots: [
    { id: 'a', kind: 'rational', label: 'a' },
    { id: 'x', kind: 'rational', label: 'x' },
    { id: 'b', kind: 'rational', label: 'b' },
    { id: 'c', kind: 'rational', label: 'c' },
  ],
  configSchema: [
    {
      key: 'maxCoeff',
      label: 'Coefficient size',
      type: 'range-select',
      options: [
        { value: '5', label: 'Small (≤5)' },
        { value: '10', label: 'Medium (≤10)' },
        { value: '12', label: 'Larger (≤12)' },
      ],
      default: '8',
    },
    {
      key: 'hideMode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'x', label: 'Solve for x' },
        { value: 'c', label: 'Evaluate right side' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'x',
    },
    {
      key: 'allowFractionX',
      label: 'Allow fractional x',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return { maxCoeff: 8, hideMode: 'x', allowFractionX: false };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'x' || raw.hideMode === 'c' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'x';
    return {
      maxCoeff: Math.min(20, Math.max(3, Number(raw.maxCoeff) || 8)),
      hideMode,
      allowFractionX: Boolean(raw.allowFractionX),
    };
  },
  generate(config, rng) {
    const max = config.maxCoeff;
    for (let i = 0; i < 50; i++) {
      const aN = sampleInt(rng, max, false);
      const bN = sampleInt(rng, max, true);
      let x: Frac;
      if (config.allowFractionX && rng.bool(0.35)) {
        x = frac(sampleInt(rng, max, false), rng.int(2, Math.min(6, max)));
      } else {
        x = fromInt(sampleInt(rng, max, true));
      }
      const a = fromInt(aN);
      const b = fromInt(bN);
      const c = add(mul(a, x), b);

      let hidden: string =
        config.hideMode === 'both' ? (rng.bool() ? 'x' : 'c') : config.hideMode;
      // if a=1 and b=0, still fine
      return {
        slots: {
          a: { t: 'frac', v: a },
          x: { t: 'frac', v: x },
          b: { t: 'frac', v: b },
          c: { t: 'frac', v: c },
        },
        hidden,
      };
    }
    return {
      slots: {
        a: { t: 'frac', v: fromInt(2) },
        x: { t: 'frac', v: fromInt(3) },
        b: { t: 'frac', v: fromInt(1) },
        c: { t: 'frac', v: fromInt(7) },
      },
      hidden: 'x',
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseRational(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct value — prefer ${formatFrac(expected)}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const a = (instance.slots.a as { v: Frac }).v;
    const x = (instance.slots.x as { v: Frac }).v;
    const b = (instance.slots.b as { v: Frac }).v;
    const c = (instance.slots.c as { v: Frac }).v;
    const h = instance.hidden;

    const aStr = formatFrac(a);
    const ax =
      a.n === 1 && a.d === 1
        ? 'x'
        : a.n === -1 && a.d === 1
          ? '−x'
          : `${aStr}x`;

    const bStr = formatFrac(b);
    const bPart =
      b.n === 0
        ? ''
        : b.n > 0
          ? ` + ${bStr}`
          : ` − ${formatFrac({ n: Math.abs(b.n), d: b.d })}`;

    const left = `${ax}${bPart}`;
    const right = formatFrac(c);
    const xDisp = formatFrac(x);

    if (h === 'x') {
      return {
        prompt: 'Solve for x',
        pieces: [
          { kind: 'text', text: left },
          { kind: 'text', text: ' = ' },
          { kind: 'slot', slotId: 'c', text: right, hidden: false },
        ],
      };
    }

    // Evaluate right-hand side given x
    return {
      prompt: `Given x = ${xDisp}, evaluate`,
      pieces: [
        { kind: 'text', text: left },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'c', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots[instance.hidden] as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
