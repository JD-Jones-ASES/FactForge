import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac } from '../math';
import { gradeRationalAnswer, fracSlot, leadTerm, signedTerm } from '../engine/grade';
import { parseSolutionSet, solutionSetsEqual, formatSolutionSet } from '../expr/solutions';

/**
 * Absolute value: evaluate |a − b| style expressions, or solve |ax + b| = c
 * (two solutions; c = 0 gives one).
 */
export type AbsValueConfig = {
  max: number;
  mode: 'evaluate' | 'solve' | 'both';
  coeff: boolean;
};

export const absValuePack: RelationPack<AbsValueConfig> = {
  id: 'abs-value',
  title: 'Absolute value',
  blurb: 'Evaluate |a − b|, or solve |ax + b| = c for both solutions.',
  band: 'Algebra',
  slots: [
    { id: 'expr', kind: 'expression', label: 'Expression' },
    { id: 'answer', kind: 'expression', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '10', label: '≤10' },
        { value: '15', label: '≤15' },
      ],
      default: '10',
    },
    {
      key: 'mode',
      label: 'Task',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'evaluate', label: 'Evaluate' },
        { value: 'solve', label: 'Solve |ax + b| = c' },
      ],
      default: 'both',
    },
    {
      key: 'coeff',
      label: 'Coefficient on x (fractional solutions)',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return { max: 10, mode: 'both', coeff: false };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'evaluate' || raw.mode === 'solve' || raw.mode === 'both' ? raw.mode : 'both';
    return { max: Math.min(30, Math.max(3, Number(raw.max) || 10)), mode, coeff: Boolean(raw.coeff) };
  },
  generate(config, rng) {
    const M = config.max;
    const mode = config.mode === 'both' ? (rng.bool() ? 'evaluate' : 'solve') : config.mode;
    if (mode === 'evaluate') {
      const a = rng.int(-M, M);
      const b = rng.int(-M, M);
      const variant = rng.int(0, 3);
      let expr: string;
      let value: number;
      if (variant === 0) {
        expr = `|${leadTerm(a)}${signedTerm(-b)}|`;
        value = Math.abs(a - b);
      } else if (variant === 1) {
        expr = `|${leadTerm(a)}| − |${leadTerm(b)}|`;
        value = Math.abs(a) - Math.abs(b);
      } else if (variant === 2) {
        expr = `−|${leadTerm(a)}|${signedTerm(b)}`;
        value = -Math.abs(a) + b;
      } else {
        const k = rng.int(2, 4);
        expr = `${k}|${leadTerm(a)}${signedTerm(b)}|`;
        value = k * Math.abs(a + b);
      }
      return {
        slots: {
          expr: { t: 'expr', v: expr },
          answer: { t: 'frac', v: fromInt(value) },
        },
        hidden: 'answer',
        meta: { mode },
      };
    }
    // solve |ax + b| = c
    const a = config.coeff ? rng.pick([2, 3, 4, -2, -3]) : 1;
    const b = rng.int(-M, M);
    const c = rng.bool(0.12) ? 0 : rng.int(1, M);
    const s1: Frac = frac(c - b, a);
    const s2: Frac = frac(-c - b, a);
    const sols = c === 0 ? [s1] : [s1, s2];
    return {
      slots: {
        expr: { t: 'expr', v: `|${leadTerm(a, 'x')}${signedTerm(b)}| = ${c}` },
        answer: { t: 'expr', v: formatSolutionSet(sols) },
      },
      hidden: 'answer',
      meta: { mode, sols },
    };
  },
  check(instance, rawInput) {
    const mode = String(instance.meta?.mode);
    if (mode === 'evaluate') return gradeRationalAnswer(fracSlot(instance.slots, 'answer'), rawInput);
    const sols = instance.meta?.sols as Frac[];
    const parsed = parseSolutionSet(rawInput);
    if (!parsed) return { status: 'parse_error', message: 'List the solutions, e.g. x = 2, −8' };
    if (solutionSetsEqual(parsed, sols)) return { status: 'correct', message: 'Correct' };
    const partial = parsed.length === 1 && sols.length === 2 && sols.some((s) => s.n * parsed[0]!.d === parsed[0]!.n * s.d);
    return {
      status: 'incorrect',
      message: partial ? 'That is one solution — |…| = c has two cases, ± c' : 'Not quite',
      expectedDisplay: formatSolutionSet(sols),
    };
  },
  format(instance): DisplayModel {
    const mode = String(instance.meta?.mode);
    return {
      prompt: mode === 'evaluate' ? 'Evaluate' : 'Solve for x (list every solution)',
      pieces: [
        { kind: 'slot', slotId: 'expr', text: String(instance.slots.expr!.v), hidden: false },
        { kind: 'text', text: mode === 'evaluate' ? ' = ' : '   ⇒   ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    const mode = String(instance.meta?.mode);
    if (mode === 'evaluate') return formatFrac(fracSlot(instance.slots, 'answer'));
    return String(instance.slots.answer!.v);
  },
  inputKind(instance) {
    return instance.meta?.mode === 'evaluate' ? 'integer' : 'expression';
  },
};
