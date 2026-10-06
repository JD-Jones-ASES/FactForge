import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, fromInt, formatFrac, add, mul, div, type Rng } from '../math';
import { gradeRationalAnswer, leadTerm, signedTerm } from '../engine/grade';

/**
 * Function notation: evaluate f(k), compose f(g(k)), or solve f(k) = v for
 * linear f. Functions are small polynomials or a simple rational a/(x + b).
 */
export type FuncEvalConfig = {
  types: FnType[];
  max: number;
  composition: boolean;
  solveInput: boolean;
};

type FnType = 'linear' | 'quadratic' | 'cubic' | 'rational';
const ALL_TYPES: FnType[] = ['linear', 'quadratic', 'cubic', 'rational'];

export type Fn =
  | { type: 'linear'; a: number; b: number }
  | { type: 'quadratic'; a: number; b: number; c: number }
  | { type: 'cubic'; a: number; c: number }
  | { type: 'rational'; a: number; b: number };

export function formatFn(f: Fn, name: string, variable = 'x'): string {
  const x = variable;
  switch (f.type) {
    case 'linear':
      return `${name}(${x}) = ${leadTerm(f.a, x)}${signedTerm(f.b)}`;
    case 'quadratic':
      return `${name}(${x}) = ${leadTerm(f.a, `${x}²`)}${signedTerm(f.b, x)}${signedTerm(f.c)}`;
    case 'cubic':
      return `${name}(${x}) = ${leadTerm(f.a, `${x}³`)}${signedTerm(f.c)}`;
    case 'rational':
      return `${name}(${x}) = ${f.a} / (${x}${signedTerm(f.b)})`;
  }
}

export function evalFn(f: Fn, x: Frac): Frac | null {
  switch (f.type) {
    case 'linear':
      return add(mul(fromInt(f.a), x), fromInt(f.b));
    case 'quadratic':
      return add(add(mul(fromInt(f.a), mul(x, x)), mul(fromInt(f.b), x)), fromInt(f.c));
    case 'cubic':
      return add(mul(fromInt(f.a), mul(x, mul(x, x))), fromInt(f.c));
    case 'rational': {
      const den = add(x, fromInt(f.b));
      if (den.n === 0) return null;
      return div(fromInt(f.a), den);
    }
  }
}

function nz(rng: Rng, max: number): number {
  let n = 0;
  while (n === 0) n = rng.int(-max, max);
  return n;
}

function sampleFn(type: FnType, rng: Rng, max: number): Fn {
  const small = Math.min(max, 5);
  switch (type) {
    case 'linear':
      return { type, a: nz(rng, small), b: rng.int(-max, max) };
    case 'quadratic':
      return { type, a: rng.pick([1, 1, -1, 2, -2, 3]), b: rng.int(-small, small), c: rng.int(-max, max) };
    case 'cubic':
      return { type, a: rng.pick([1, 1, -1, 2]), c: rng.int(-max, max) };
    case 'rational':
      return { type, a: nz(rng, 12), b: rng.int(-small, small) };
  }
}

export const funcEvalPack: RelationPack<FuncEvalConfig> = {
  id: 'func-eval',
  title: 'Function notation',
  blurb: 'Evaluate f(k), compose f(g(k)), or solve f(k) = v — exact values.',
  band: 'Functions',
  slots: [
    { id: 'fn', kind: 'expression', label: 'Function' },
    { id: 'answer', kind: 'rational', label: 'Value' },
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
        { value: 'rational', label: 'a / (x + b)' },
      ],
      default: ['linear', 'quadratic'],
    },
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '5', label: '≤5' },
        { value: '8', label: '≤8' },
        { value: '12', label: '≤12' },
      ],
      default: '8',
    },
    {
      key: 'composition',
      label: 'Compositions f(g(k))',
      type: 'toggle',
      default: false,
    },
    {
      key: 'solveInput',
      label: 'Solve f(k) = v for k (linear only)',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return { types: ['linear', 'quadratic'], max: 8, composition: false, solveInput: false };
  },
  parseConfig(raw) {
    const types = Array.isArray(raw.types)
      ? (raw.types.filter((t) => ALL_TYPES.includes(t as FnType)) as FnType[])
      : (['linear', 'quadratic'] as FnType[]);
    return {
      types: types.length ? types : ['linear'],
      max: Math.min(20, Math.max(3, Number(raw.max) || 8)),
      composition: Boolean(raw.composition),
      solveInput: Boolean(raw.solveInput),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 60; i++) {
      const type = rng.pick(config.types);
      const f = sampleFn(type, rng, config.max);
      const k = fromInt(rng.int(-config.max, config.max));

      if (config.solveInput && type === 'linear' && rng.bool(0.4)) {
        const v = evalFn(f, k)!;
        return {
          slots: {
            fn: { t: 'expr', v: formatFn(f, 'f') },
            answer: { t: 'frac', v: k },
          },
          hidden: 'answer',
          meta: { kind: 'solve', f, v },
        };
      }

      if (config.composition && rng.bool(0.45)) {
        const g = sampleFn(rng.pick(config.types), rng, config.max);
        const inner = evalFn(g, k);
        if (!inner) continue;
        const outer = evalFn(f, inner);
        if (!outer) continue;
        if (Math.abs(outer.n) > 5000) continue;
        return {
          slots: {
            fn: { t: 'expr', v: `${formatFn(f, 'f')},   ${formatFn(g, 'g')}` },
            answer: { t: 'frac', v: outer },
          },
          hidden: 'answer',
          meta: { kind: 'compose', f, g, k },
        };
      }

      const v = evalFn(f, k);
      if (!v) continue;
      return {
        slots: {
          fn: { t: 'expr', v: formatFn(f, 'f') },
          answer: { t: 'frac', v },
        },
        hidden: 'answer',
        meta: { kind: 'evaluate', f, k },
      };
    }
    const f: Fn = { type: 'linear', a: 2, b: 1 };
    return {
      slots: {
        fn: { t: 'expr', v: formatFn(f, 'f') },
        answer: { t: 'frac', v: fromInt(7) },
      },
      hidden: 'answer',
      meta: { kind: 'evaluate', f, k: fromInt(3) },
    };
  },
  check(instance, rawInput) {
    const expected = (instance.slots.answer as { v: Frac }).v;
    return gradeRationalAnswer(expected, rawInput.replace(/^\s*[a-z]\s*=\s*/i, ''));
  },
  format(instance): DisplayModel {
    const kind = String(instance.meta?.kind);
    const fnText = String(instance.slots.fn!.v);
    if (kind === 'solve') {
      const v = instance.meta?.v as Frac;
      return {
        prompt: `Find k so that f(k) = ${formatFrac(v)}`,
        pieces: [
          { kind: 'slot', slotId: 'fn', text: fnText, hidden: false },
          { kind: 'text', text: `   f(k) = ${formatFrac(v)}  ⇒  k = ` },
          { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
        ],
      };
    }
    const k = formatFrac(instance.meta?.k as Frac);
    const kText = k.startsWith('−') ? `(${k})` : k;
    if (kind === 'compose') {
      return {
        prompt: 'Evaluate the composition (inside first)',
        pieces: [
          { kind: 'slot', slotId: 'fn', text: fnText, hidden: false },
          { kind: 'text', text: `   f(g(${kText})) = ` },
          { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
        ],
      };
    }
    return {
      prompt: 'Evaluate the function',
      pieces: [
        { kind: 'slot', slotId: 'fn', text: fnText, hidden: false },
        { kind: 'text', text: `   f(${kText}) = ` },
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
