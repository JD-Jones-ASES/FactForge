import type { RelationPack, DisplayModel } from '../engine/types';
import {
  fromInt,
  type Radical,
  simplifyRadical,
  parseRadical,
  formatRadical,
  eqRadical,
  sqrtRadical,
} from '../math';

/**
 * Simplify √N (or k√N) to a√b with b square-free. Form is the task:
 * a value-equal but unsimplified answer is marked wrong with a pointer.
 */
export type SimplifyRadicalConfig = {
  max: number;
  coefficient: boolean;
  perfectSquares: boolean;
};

export const simplifyRadicalPack: RelationPack<SimplifyRadicalConfig> = {
  id: 'simplify-radical',
  title: 'Simplify radicals',
  blurb: '√72 → 6√2. Pull out every perfect-square factor.',
  band: 'Algebra',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'expression', label: 'Simplified' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Radicand size',
      type: 'range-select',
      options: [
        { value: '100', label: '≤100' },
        { value: '200', label: '≤200' },
        { value: '500', label: '≤500' },
      ],
      default: '200',
    },
    {
      key: 'coefficient',
      label: 'Coefficient in front (3√8)',
      type: 'toggle',
      default: false,
    },
    {
      key: 'perfectSquares',
      label: 'Include perfect squares',
      type: 'toggle',
      default: false,
      help: '√49 → 7',
    },
  ],
  defaultConfig() {
    return { max: 200, coefficient: false, perfectSquares: false };
  },
  parseConfig(raw) {
    return {
      max: Math.min(1000, Math.max(20, Number(raw.max) || 200)),
      coefficient: Boolean(raw.coefficient),
      perfectSquares: Boolean(raw.perfectSquares),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 80; i++) {
      const sq = rng.pick([2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10]);
      const free = config.perfectSquares && rng.bool(0.2) ? 1 : rng.pick([2, 3, 5, 6, 7, 10, 11, 13, 14, 15]);
      const N = sq * sq * free;
      if (N > config.max || N < 8) continue;
      const k = config.coefficient && rng.bool(0.6) ? rng.int(2, 5) : 1;
      const simplified = simplifyRadical(fromInt(k), N);
      return {
        slots: {
          given: { t: 'expr', v: k === 1 ? `√${N}` : `${k}√${N}` },
          answer: { t: 'expr', v: formatRadical(simplified) },
        },
        hidden: 'answer',
        meta: { N, k, simplified },
      };
    }
    const simplified = sqrtRadical(72);
    return {
      slots: {
        given: { t: 'expr', v: '√72' },
        answer: { t: 'expr', v: formatRadical(simplified) },
      },
      hidden: 'answer',
      meta: { N: 72, k: 1, simplified },
    };
  },
  check(instance, rawInput) {
    const expected = instance.meta?.simplified as Radical;
    const parsed = parseRadical(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const target = formatRadical(expected);
    if (!eqRadical(parsed.value, expected)) {
      return { status: 'incorrect', message: 'Not the same value', expectedDisplay: target };
    }
    if (!parsed.simplified) {
      return {
        status: 'incorrect',
        message: 'Right value — but the radicand still has a perfect-square factor',
        expectedDisplay: target,
      };
    }
    return { status: 'correct', message: 'Fully simplified — correct' };
  },
  format(instance): DisplayModel {
    return {
      prompt: 'Simplify the radical',
      pieces: [
        { kind: 'slot', slotId: 'given', text: String(instance.slots.given!.v), hidden: false },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatRadical(instance.meta?.simplified as Radical);
  },
  inputKind() {
    return 'expression';
  },
};
