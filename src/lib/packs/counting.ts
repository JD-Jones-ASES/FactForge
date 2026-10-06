import type { RelationPack, DisplayModel } from '../engine/types';
import { fromInt } from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Counting: n!, permutations P(n, r), combinations C(n, r) — exact integers.
 */
export type CountingConfig = {
  kinds: Kind[];
  maxN: number;
};

type Kind = 'factorial' | 'perm' | 'comb';
const ALL_KINDS: Kind[] = ['factorial', 'perm', 'comb'];

export function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function permutations(n: number, r: number): number {
  let v = 1;
  for (let i = 0; i < r; i++) v *= n - i;
  return v;
}

export function combinations(n: number, r: number): number {
  return permutations(n, r) / factorial(r);
}

export const countingPack: RelationPack<CountingConfig> = {
  id: 'counting',
  title: 'Factorials & combinations',
  blurb: 'n!, P(n, r), C(n, r) — groundwork for binomial expansion and probability.',
  band: 'Data',
  slots: [
    { id: 'expr', kind: 'expression', label: 'Expression' },
    { id: 'value', kind: 'integer', label: 'Value' },
  ],
  configSchema: [
    {
      key: 'kinds',
      label: 'Include',
      type: 'multi-ops',
      options: [
        { value: 'factorial', label: 'n!' },
        { value: 'perm', label: 'P(n, r)' },
        { value: 'comb', label: 'C(n, r)' },
      ],
      default: ['factorial', 'perm', 'comb'],
    },
    {
      key: 'maxN',
      label: 'Max n',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '8', label: '≤8' },
        { value: '10', label: '≤10' },
      ],
      default: '8',
    },
  ],
  defaultConfig() {
    return { kinds: ALL_KINDS, maxN: 8 };
  },
  parseConfig(raw) {
    const kinds = Array.isArray(raw.kinds)
      ? (raw.kinds.filter((k) => ALL_KINDS.includes(k as Kind)) as Kind[])
      : ALL_KINDS;
    return { kinds: kinds.length ? kinds : ['comb'], maxN: Math.min(12, Math.max(3, Number(raw.maxN) || 8)) };
  },
  generate(config, rng) {
    const kind = rng.pick(config.kinds);
    const n = rng.int(kind === 'factorial' ? 0 : 2, config.maxN);
    let expr: string;
    let value: number;
    if (kind === 'factorial') {
      expr = `${n}!`;
      value = factorial(n);
    } else {
      const r = rng.int(1, Math.min(n, 4));
      if (kind === 'perm') {
        expr = `P(${n}, ${r})`;
        value = permutations(n, r);
      } else {
        expr = `C(${n}, ${r})`;
        value = combinations(n, r);
      }
    }
    return {
      slots: {
        expr: { t: 'expr', v: expr },
        value: { t: 'frac', v: fromInt(value) },
      },
      hidden: 'value',
      meta: { kind, n },
    };
  },
  check(instance, rawInput) {
    return gradeRationalAnswer(fracSlot(instance.slots, 'value'), rawInput);
  },
  format(instance): DisplayModel {
    const kind = String(instance.meta?.kind ?? 'comb');
    const prompt =
      kind === 'factorial'
        ? 'Evaluate the factorial'
        : kind === 'perm'
          ? 'Ordered arrangements: evaluate P(n, r) = n! / (n − r)!'
          : 'Unordered selections: evaluate C(n, r) = n! / (r!(n − r)!)';
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'expr', text: String(instance.slots.expr!.v), hidden: false },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'value', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(fracSlot(instance.slots, 'value').n);
  },
  inputKind() {
    return 'integer';
  },
};
