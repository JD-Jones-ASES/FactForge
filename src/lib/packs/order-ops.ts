import type { RelationPack, DisplayModel } from '../engine/types';
import { fromInt, type Rng } from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Order of operations: evaluate a short integer expression exactly.
 * Templates mix grouping, exponents, and the four operations; every
 * division is exact so the result is always an integer.
 */
export type OrderOpsConfig = {
  max: number;
  parens: boolean;
  exponents: boolean;
  allowNegative: boolean;
};

type Built = { text: string; value: number };

function neg(n: number): string {
  return n < 0 ? `(−${Math.abs(n)})` : String(n);
}

function templates(cfg: OrderOpsConfig, rng: Rng): Built[] {
  const M = cfg.max;
  const a = rng.int(2, M);
  const b = rng.int(2, M);
  const c = rng.int(2, M);
  const d = rng.int(2, Math.min(M, 6));
  const q = rng.int(2, Math.min(M, 9));
  const prod = d * q;
  const out: Built[] = [
    { text: `${a} + ${b} × ${c}`, value: a + b * c },
    { text: `${a} × ${b} − ${c}`, value: a * b - c },
    { text: `${prod} ÷ ${d} + ${c}`, value: q + c },
    { text: `${a} + ${prod} ÷ ${d} × ${c}`, value: a + q * c },
    { text: `${a} × ${b} + ${c} × ${d}`, value: a * b + c * d },
  ];
  if (cfg.parens) {
    out.push(
      { text: `(${a} + ${b}) × ${c}`, value: (a + b) * c },
      { text: `${a} × (${b} + ${c})`, value: a * (b + c) },
      { text: `(${prod} − ${d}) ÷ ${d}`, value: q - 1 },
      { text: `(${a + b} − ${a}) × ${c} + ${d}`, value: b * c + d },
      { text: `${a} − (${b} + ${c}) × ${d}`, value: a - (b + c) * d },
    );
  }
  if (cfg.exponents) {
    const e = rng.int(2, Math.min(M, 6));
    out.push(
      { text: `${a} + ${e}²`, value: a + e * e },
      { text: `${e}² − ${b} × ${c}`, value: e * e - b * c },
      { text: `${a} × ${e}² ÷ ${e}`, value: a * e },
      { text: `${d}³ − ${a}`, value: d * d * d - a },
    );
    if (cfg.parens) {
      out.push(
        { text: `(${a} + ${b})² − ${c}`, value: (a + b) ** 2 - c },
        { text: `${c} × (${e} − ${d})²`, value: c * (e - d) ** 2 },
        { text: `(${a} × ${b} − ${c})²`, value: (a * b - c) ** 2 },
      );
    }
  }
  if (cfg.allowNegative) {
    out.push(
      { text: `${neg(-a)} × ${b} + ${c}`, value: -a * b + c },
      { text: `${a} − ${b} × ${neg(-c)}`, value: a + b * c },
      { text: `${neg(-a)} − ${neg(-b)} × ${c}`, value: -a + b * c },
    );
    if (cfg.exponents) {
      out.push(
        { text: `${neg(-d)}² − ${a}`, value: d * d - a },
        { text: `−${d}² + ${a}`, value: -(d * d) + a },
      );
    }
  }
  return out;
}

export const orderOpsPack: RelationPack<OrderOpsConfig> = {
  id: 'order-ops',
  title: 'Order of operations',
  blurb: 'Evaluate with PEMDAS / BIDMAS — grouping, exponents, then × ÷, then + −.',
  band: 'Arithmetic',
  slots: [
    { id: 'expr', kind: 'expression', label: 'Expression' },
    { id: 'result', kind: 'integer', label: 'Value' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '9', label: '≤9' },
        { value: '12', label: '≤12' },
      ],
      default: '9',
    },
    { key: 'parens', label: 'Grouping symbols', type: 'toggle', default: true },
    { key: 'exponents', label: 'Exponents', type: 'toggle', default: true },
    {
      key: 'allowNegative',
      label: 'Negative numbers',
      type: 'toggle',
      default: false,
      help: 'Includes (−a) terms and −a² vs (−a)².',
    },
  ],
  defaultConfig() {
    return { max: 9, parens: true, exponents: true, allowNegative: false };
  },
  parseConfig(raw) {
    return {
      max: Math.min(20, Math.max(4, Number(raw.max) || 9)),
      parens: raw.parens !== false,
      exponents: raw.exponents !== false,
      allowNegative: Boolean(raw.allowNegative),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 40; i++) {
      const pick = rng.pick(templates(config, rng));
      if (!config.allowNegative && pick.value < 0) continue;
      if (!Number.isSafeInteger(pick.value)) continue;
      return {
        slots: {
          expr: { t: 'expr', v: pick.text },
          result: { t: 'frac', v: fromInt(pick.value) },
        },
        hidden: 'result',
      };
    }
    return {
      slots: {
        expr: { t: 'expr', v: '2 + 3 × 4' },
        result: { t: 'frac', v: fromInt(14) },
      },
      hidden: 'result',
    };
  },
  check(instance, rawInput) {
    return gradeRationalAnswer(fracSlot(instance.slots, 'result'), rawInput, {
      wrongMessage: 'Not quite — check the order: grouping, exponents, × ÷, + −',
    });
  },
  format(instance): DisplayModel {
    return {
      prompt: 'Evaluate',
      pieces: [
        { kind: 'slot', slotId: 'expr', text: String(instance.slots.expr!.v), hidden: false },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'result', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(fracSlot(instance.slots, 'result').n);
  },
  inputKind() {
    return 'integer';
  },
};
