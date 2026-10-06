import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac, type Rng } from '../math';
import { gradeRationalAnswer, fracSlot, sup } from '../engine/grade';

/**
 * Exponent rules: product, quotient, power-of-a-power, zero and negative
 * exponents. Hidden piece is the resulting exponent (integer) or, for
 * negative-exponent evaluation, an exact rational value.
 */
export type ExponentLawsConfig = {
  rules: Rule[];
  maxExp: number;
  negatives: boolean;
  base: 'variable' | 'number' | 'both';
};

type Rule = 'product' | 'quotient' | 'power' | 'zero' | 'negative';
const ALL_RULES: Rule[] = ['product', 'quotient', 'power', 'zero', 'negative'];

function expDisp(e: number): string {
  return sup(e < 0 ? `−${Math.abs(e)}` : String(e));
}

export const exponentLawsPack: RelationPack<ExponentLawsConfig> = {
  id: 'exponent-laws',
  title: 'Exponent rules',
  blurb: 'xᵃ·xᵇ, xᵃ/xᵇ, (xᵃ)ᵇ, x⁰, x⁻ⁿ — find the missing exponent or value.',
  band: 'Number structure',
  slots: [
    { id: 'expr', kind: 'expression', label: 'Expression' },
    { id: 'answer', kind: 'rational', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'rules',
      label: 'Rules',
      type: 'multi-ops',
      options: [
        { value: 'product', label: 'xᵃ · xᵇ' },
        { value: 'quotient', label: 'xᵃ ÷ xᵇ' },
        { value: 'power', label: '(xᵃ)ᵇ' },
        { value: 'zero', label: 'x⁰' },
        { value: 'negative', label: 'x⁻ⁿ' },
      ],
      default: ['product', 'quotient', 'power'],
    },
    {
      key: 'maxExp',
      label: 'Max exponent',
      type: 'range-select',
      options: [
        { value: '5', label: '≤5' },
        { value: '8', label: '≤8' },
        { value: '12', label: '≤12' },
      ],
      default: '8',
    },
    {
      key: 'negatives',
      label: 'Negative exponents in results',
      type: 'toggle',
      default: false,
      help: 'Quotients may yield x⁻², products may include x⁻³ factors.',
    },
    {
      key: 'base',
      label: 'Base',
      type: 'select',
      options: [
        { value: 'variable', label: 'Variable (x, y, a…)' },
        { value: 'number', label: 'Numeric (2, 3, 5…)' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'variable',
    },
  ],
  defaultConfig() {
    return { rules: ['product', 'quotient', 'power'], maxExp: 8, negatives: false, base: 'variable' };
  },
  parseConfig(raw) {
    const rules = Array.isArray(raw.rules)
      ? (raw.rules.filter((r) => ALL_RULES.includes(r as Rule)) as Rule[])
      : (['product', 'quotient', 'power'] as Rule[]);
    const base =
      raw.base === 'number' || raw.base === 'both' || raw.base === 'variable'
        ? raw.base
        : 'variable';
    return {
      rules: rules.length ? rules : ['product'],
      maxExp: Math.min(15, Math.max(3, Number(raw.maxExp) || 8)),
      negatives: Boolean(raw.negatives),
      base,
    };
  },
  generate(config, rng) {
    const rule = rng.pick(config.rules);
    const useNumber =
      config.base === 'number' || (config.base === 'both' && rng.bool());
    const base = useNumber ? String(rng.pick([2, 3, 5, 10])) : rng.pick(['x', 'y', 'a', 'm']);
    const M = config.maxExp;
    const pickExp = () => {
      const e = rng.int(1, M);
      return config.negatives && rng.bool(0.3) ? -e : e;
    };

    let expr = '';
    let answer: Frac;
    let askValue = false;

    if (rule === 'product') {
      const a = pickExp();
      const b = pickExp();
      expr = `${base}${expDisp(a)} · ${base}${expDisp(b)}`;
      answer = fromInt(a + b);
    } else if (rule === 'quotient') {
      let a = rng.int(1, M);
      let b = rng.int(1, M);
      if (!config.negatives && b > a) [a, b] = [b, a];
      if (a === b && !config.negatives) a = b + 1;
      expr = `${base}${expDisp(a)} ÷ ${base}${expDisp(b)}`;
      answer = fromInt(a - b);
    } else if (rule === 'power') {
      const a = rng.int(2, Math.min(M, 6));
      const b = rng.int(2, Math.min(M, 5));
      const inner = config.negatives && rng.bool(0.3) ? -a : a;
      expr = `(${base}${expDisp(inner)})${expDisp(b)}`;
      answer = fromInt(inner * b);
    } else if (rule === 'zero') {
      const k = rng.int(2, 9);
      const variant = rng.int(0, 2);
      askValue = true;
      if (variant === 0) {
        expr = `${base}⁰`;
        answer = fromInt(1);
      } else if (variant === 1) {
        expr = `${k}${base}⁰`;
        answer = fromInt(k);
      } else {
        expr = `(${k}${base})⁰`;
        answer = fromInt(1);
      }
    } else {
      // negative exponent: evaluate numerically
      const b = rng.pick([2, 3, 4, 5, 10]);
      const n = rng.int(1, 3);
      askValue = true;
      if (rng.bool(0.25)) {
        expr = `(1/${b})${expDisp(-n)}`;
        answer = fromInt(b ** n);
      } else {
        expr = `${b}${expDisp(-n)}`;
        answer = frac(1, b ** n);
      }
    }

    return {
      slots: {
        expr: { t: 'expr', v: expr },
        answer: { t: 'frac', v: answer },
      },
      hidden: 'answer',
      meta: { rule, base, askValue },
    };
  },
  check(instance, rawInput) {
    const expected = fracSlot(instance.slots, 'answer');
    return gradeRationalAnswer(expected, rawInput.replace(/^\^/, ''));
  },
  format(instance): DisplayModel {
    const expr = String(instance.slots.expr!.v);
    const base = String(instance.meta?.base ?? 'x');
    const askValue = Boolean(instance.meta?.askValue);
    if (askValue) {
      return {
        prompt: 'Evaluate',
        pieces: [
          { kind: 'slot', slotId: 'expr', text: expr, hidden: false },
          { kind: 'text', text: ' = ' },
          { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
        ],
      };
    }
    return {
      prompt: 'Find the missing exponent',
      pieces: [
        { kind: 'slot', slotId: 'expr', text: expr, hidden: false },
        { kind: 'text', text: ` = ${base}` },
        { kind: 'slot', slotId: 'answer', text: '⁽?⁾', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac(fracSlot(instance.slots, 'answer'));
  },
  inputKind(instance) {
    return instance.meta?.askValue ? 'rational' : 'integer';
  },
};
