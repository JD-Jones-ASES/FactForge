import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, fromInt, formatFrac, sub, div, type Rng } from '../math';
import { gradeRationalAnswer } from '../engine/grade';
import { type Fn, formatFn, evalFn } from './func-eval';

/**
 * Average rate of change (secant slope) of f on [p, q]:
 * (f(q) − f(p)) / (q − p). Calculus readiness — the limit of this is f′.
 */
export type AvgRateConfig = {
  types: FnType[];
  width: number;
  source: 'formula' | 'table' | 'both';
};

type FnType = 'linear' | 'quadratic' | 'cubic';
const ALL_TYPES: FnType[] = ['linear', 'quadratic', 'cubic'];

function sampleFn(type: FnType, rng: Rng): Fn {
  switch (type) {
    case 'linear':
      return { type, a: rng.pick([1, -1, 2, -2, 3, 4, -3]), b: rng.int(-6, 6) };
    case 'quadratic':
      return { type, a: rng.pick([1, 1, -1, 2, -2]), b: rng.int(-4, 4), c: rng.int(-6, 6) };
    case 'cubic':
      return { type, a: rng.pick([1, -1, 2]), c: rng.int(-5, 5) };
  }
}

export const avgRatePack: RelationPack<AvgRateConfig> = {
  id: 'avg-rate',
  title: 'Average rate of change',
  blurb: 'Secant slope (f(q) − f(p)) / (q − p) from a formula or a table.',
  band: 'Functions',
  slots: [
    { id: 'fn', kind: 'expression', label: 'Function' },
    { id: 'answer', kind: 'rational', label: 'Rate' },
  ],
  configSchema: [
    {
      key: 'types',
      label: 'Function types',
      type: 'multi-ops',
      options: [
        { value: 'linear', label: 'ax + b' },
        { value: 'quadratic', label: 'ax² + bx + c' },
        { value: 'cubic', label: 'ax³ + c' },
      ],
      default: ['quadratic'],
    },
    {
      key: 'width',
      label: 'Interval width',
      type: 'range-select',
      options: [
        { value: '1', label: '1 (adjacent integers)' },
        { value: '3', label: 'up to 3' },
        { value: '6', label: 'up to 6' },
      ],
      default: '3',
    },
    {
      key: 'source',
      label: 'Given as',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'formula', label: 'Formula f(x) = …' },
        { value: 'table', label: 'Table of values' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { types: ['quadratic'], width: 3, source: 'both' };
  },
  parseConfig(raw) {
    const types = Array.isArray(raw.types)
      ? (raw.types.filter((t) => ALL_TYPES.includes(t as FnType)) as FnType[])
      : (['quadratic'] as FnType[]);
    const source =
      raw.source === 'formula' || raw.source === 'table' || raw.source === 'both' ? raw.source : 'both';
    return {
      types: types.length ? types : ['quadratic'],
      width: Math.min(10, Math.max(1, Number(raw.width) || 3)),
      source,
    };
  },
  generate(config, rng) {
    const type = rng.pick(config.types);
    const f = sampleFn(type, rng);
    const p = rng.int(-5, 5);
    const q = p + rng.int(1, config.width);
    const fp = evalFn(f, fromInt(p))!;
    const fq = evalFn(f, fromInt(q))!;
    const rate = div(sub(fq, fp), fromInt(q - p));
    const source = config.source === 'both' ? (rng.bool() ? 'formula' : 'table') : config.source;
    let fnText: string;
    if (source === 'formula') {
      fnText = formatFn(f, 'f');
    } else {
      // table of x from p−1 … q+1 (clamped to 5 columns)
      const xs: number[] = [];
      for (let x = p - 1; x <= q + 1 && xs.length < 6; x++) xs.push(x);
      fnText = xs.map((x) => `f(${x}) = ${formatFrac(evalFn(f, fromInt(x))!)}`).join('   ');
    }
    return {
      slots: {
        fn: { t: 'expr', v: fnText },
        answer: { t: 'frac', v: rate },
      },
      hidden: 'answer',
      meta: { f, p, q, source },
    };
  },
  check(instance, rawInput) {
    return gradeRationalAnswer((instance.slots.answer as { v: Frac }).v, rawInput);
  },
  format(instance): DisplayModel {
    const p = Number(instance.meta?.p);
    const q = Number(instance.meta?.q);
    return {
      prompt: `Average rate of change of f on [${p}, ${q}]  =  (f(${q}) − f(${p})) / (${q} − ${p})`,
      pieces: [
        { kind: 'slot', slotId: 'fn', text: String(instance.slots.fn!.v), hidden: false },
        { kind: 'text', text: '   rate = ' },
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
