import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac, add, mul } from '../math';
import {
  type IneqOp,
  parseInequality,
  formatInequality,
  flipIneq,
  inequalitiesEqual,
} from '../expr/solutions';
import { leadTerm, signedTerm } from '../engine/grade';

/**
 * Solve ax + b ⋚ c. Dividing by a negative a flips the inequality — the
 * main thing this pack is for.
 */
export type LinearIneqConfig = {
  maxCoeff: number;
  negativeCoeff: boolean;
  strictness: 'strict' | 'inclusive' | 'both';
  fractionBound: boolean;
};

const STRICT: IneqOp[] = ['<', '>'];
const INCLUSIVE: IneqOp[] = ['<=', '>='];
const OP_TEXT: Record<IneqOp, string> = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };

export const linearIneqPack: RelationPack<LinearIneqConfig> = {
  id: 'linear-ineq',
  title: 'Linear inequalities',
  blurb: 'Solve ax + b < c — remember the flip when dividing by a negative.',
  band: 'Algebra',
  slots: [
    { id: 'eq', kind: 'expression', label: 'Inequality' },
    { id: 'answer', kind: 'expression', label: 'Solution' },
  ],
  configSchema: [
    {
      key: 'maxCoeff',
      label: 'Coefficient size',
      type: 'range-select',
      options: [
        { value: '5', label: '≤5' },
        { value: '9', label: '≤9' },
        { value: '12', label: '≤12' },
      ],
      default: '9',
    },
    {
      key: 'negativeCoeff',
      label: 'Negative x-coefficients',
      type: 'toggle',
      default: true,
      help: 'Forces the sign flip.',
    },
    {
      key: 'strictness',
      label: 'Symbols',
      type: 'select',
      options: [
        { value: 'both', label: '<  >  ≤  ≥' },
        { value: 'strict', label: '<  > only' },
        { value: 'inclusive', label: '≤  ≥ only' },
      ],
      default: 'both',
    },
    { key: 'fractionBound', label: 'Fractional answers', type: 'toggle', default: false },
  ],
  defaultConfig() {
    return { maxCoeff: 9, negativeCoeff: true, strictness: 'both', fractionBound: false };
  },
  parseConfig(raw) {
    const strictness =
      raw.strictness === 'strict' || raw.strictness === 'inclusive' || raw.strictness === 'both'
        ? raw.strictness
        : 'both';
    return {
      maxCoeff: Math.min(20, Math.max(3, Number(raw.maxCoeff) || 9)),
      negativeCoeff: raw.negativeCoeff !== false,
      strictness,
      fractionBound: Boolean(raw.fractionBound),
    };
  },
  generate(config, rng) {
    const M = config.maxCoeff;
    let a = rng.int(1, M);
    if (config.negativeCoeff && rng.bool(0.5)) a = -a;
    const b = rng.int(-M, M);
    const bound: Frac = config.fractionBound && rng.bool(0.4)
      ? frac(rng.int(-M, M) || 1, rng.int(2, 4))
      : fromInt(rng.int(-M, M));
    const ops =
      config.strictness === 'strict' ? STRICT : config.strictness === 'inclusive' ? INCLUSIVE : [...STRICT, ...INCLUSIVE];
    const displayedOp = rng.pick(ops);
    const c = add(mul(fromInt(a), bound), fromInt(b));
    const solutionOp = a < 0 ? flipIneq(displayedOp) : displayedOp;
    const eq = `${leadTerm(a, 'x')}${signedTerm(b)} ${OP_TEXT[displayedOp]} ${formatFrac(c)}`;
    return {
      slots: {
        eq: { t: 'expr', v: eq },
        answer: { t: 'expr', v: formatInequality({ variable: 'x', op: solutionOp, bound }) },
      },
      hidden: 'answer',
      meta: { a, b, c, displayedOp, solutionOp, bound },
    };
  },
  check(instance, rawInput) {
    const expected = {
      variable: 'x',
      op: instance.meta?.solutionOp as IneqOp,
      bound: instance.meta?.bound as Frac,
    };
    const parsed = parseInequality(rawInput);
    if (!parsed) {
      return { status: 'parse_error', message: 'Write a solution like x < 3 or x ≥ −2' };
    }
    if (inequalitiesEqual(parsed, expected)) return { status: 'correct', message: 'Correct' };
    const flippedOnly = parsed.op === flipIneq(expected.op) && parsed.bound.n * expected.bound.d === expected.bound.n * parsed.bound.d;
    return {
      status: 'incorrect',
      message: flippedOnly
        ? Number(instance.meta?.a) < 0
          ? 'Right boundary — dividing by a negative flips the inequality'
          : 'Right boundary — but the direction is backwards'
        : 'Not quite',
      expectedDisplay: formatInequality(expected),
    };
  },
  format(instance): DisplayModel {
    return {
      prompt: 'Solve for x',
      pieces: [
        { kind: 'slot', slotId: 'eq', text: String(instance.slots.eq!.v), hidden: false },
        { kind: 'text', text: '   ⇒   ' },
        { kind: 'slot', slotId: 'answer', text: 'x ? ?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer!.v);
  },
  inputKind() {
    return 'expression';
  },
};
