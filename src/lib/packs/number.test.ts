import { describe, expect, it } from 'vitest';
import { getPack } from '../engine/registry';
import { frac, formatDecimal, parseRadical, formatRadical, sqrtRadical } from '../math';
import { parseFactorProduct, primeFactors, formatFactorization } from './prime-factor';
import { parseSci } from './sci-notation';
import {
  parseSolutionSet,
  solutionSetsEqual,
  parsePoint,
  parseInequality,
} from '../expr/solutions';

describe('math helpers', () => {
  it('formats terminating decimals exactly', () => {
    expect(formatDecimal(frac(3, 4))).toBe('0.75');
    expect(formatDecimal(frac(-32, 10))).toBe('−3.2');
    expect(formatDecimal(frac(12, 1))).toBe('12');
    expect(formatDecimal(frac(1, 8))).toBe('0.125');
  });

  it('simplifies and parses radicals', () => {
    expect(formatRadical(sqrtRadical(72))).toBe('6√2');
    expect(formatRadical(sqrtRadical(49))).toBe('7');
    const p = parseRadical('3√8');
    expect(p.ok && formatRadical(p.value)).toBe('6√2');
    expect(p.ok && p.simplified).toBe(false);
    const q = parseRadical('5*sqrt(3)/2');
    expect(q.ok && formatRadical(q.value)).toBe('5√3/2');
    const r = parseRadical('(√2)/2');
    expect(r.ok && formatRadical(r.value)).toBe('√2/2');
  });

  it('parses solution sets, points, inequalities', () => {
    expect(solutionSetsEqual(parseSolutionSet('x = 2, -3')!, [frac(-3), frac(2)])).toBe(true);
    expect(solutionSetsEqual(parseSolutionSet('{-3, 2}')!, [frac(2), frac(-3)])).toBe(true);
    expect(solutionSetsEqual(parseSolutionSet('x=2 or x=-3')!, [frac(2), frac(-3)])).toBe(true);
    expect(solutionSetsEqual(parseSolutionSet('±3')!, [frac(3), frac(-3)])).toBe(true);
    expect(parsePoint('(1/2, -3)')).toEqual([frac(1, 2), frac(-3)]);
    expect(parseInequality('x ≥ -2')).toEqual({ variable: 'x', op: '>=', bound: frac(-2) });
    expect(parseInequality('3 > x')).toEqual({ variable: 'x', op: '<', bound: frac(3) });
  });
});

describe('order-ops', () => {
  it('grades integer values', () => {
    const pack = getPack('order-ops')!;
    const inst = {
      slots: { expr: { t: 'expr' as const, v: '2 + 3 × 4' }, result: { t: 'frac' as const, v: frac(14) } },
      hidden: 'result',
    };
    expect(pack.check(inst, '14', pack.defaultConfig()).status).toBe('correct');
    expect(pack.check(inst, '20', pack.defaultConfig()).status).toBe('incorrect');
  });
});

describe('decimal-ops', () => {
  it('accepts equivalent decimals without form hints', () => {
    const pack = getPack('decimal-ops')!;
    const inst = {
      slots: {
        left: { t: 'frac' as const, v: frac(15, 10) },
        op: { t: 'op' as const, v: '+' },
        right: { t: 'frac' as const, v: frac(25, 100) },
        result: { t: 'frac' as const, v: frac(175, 100) },
      },
      hidden: 'result',
    };
    expect(pack.check(inst, '1.75', pack.defaultConfig()).status).toBe('correct');
    expect(pack.check(inst, '1.750', pack.defaultConfig()).status).toBe('correct');
    expect(pack.check(inst, '7/4', pack.defaultConfig()).status).toBe('correct');
    const wrong = pack.check(inst, '1.65', pack.defaultConfig());
    expect(wrong.status).toBe('incorrect');
    expect(wrong.expectedDisplay).toBe('1.75');
  });
});

describe('mixed-improper', () => {
  it('requires the requested form', () => {
    const pack = getPack('mixed-improper')!;
    const config = pack.defaultConfig();
    const base = {
      slots: { given: { t: 'frac' as const, v: frac(7, 3) }, answer: { t: 'frac' as const, v: frac(7, 3) } },
      hidden: 'answer',
    };
    const toMixed = { ...base, meta: { mode: 'to-mixed' } };
    expect(pack.check(toMixed, '2 1/3', config).status).toBe('correct');
    expect(pack.check(toMixed, '7/3', config).status).toBe('incorrect');
    expect(pack.check(toMixed, '1 4/3', config).status).toBe('incorrect');
    const toImproper = { ...base, meta: { mode: 'to-improper' } };
    expect(pack.check(toImproper, '7/3', config).status).toBe('correct');
    expect(pack.check(toImproper, '14/6', config).status).toBe('correct_form_hint');
    expect(pack.check(toImproper, '2 1/3', config).status).toBe('incorrect');
  });
});

describe('frac-dec-pct', () => {
  it('grades each target representation', () => {
    const pack = getPack('frac-dec-pct')!;
    const config = pack.defaultConfig();
    const base = {
      slots: { given: { t: 'frac' as const, v: frac(3, 4) }, answer: { t: 'frac' as const, v: frac(3, 4) } },
      hidden: 'answer',
    };
    expect(pack.check({ ...base, meta: { mode: 'frac-dec' } }, '0.75', config).status).toBe('correct');
    expect(pack.check({ ...base, meta: { mode: 'frac-dec' } }, '.75', config).status).toBe('correct');
    expect(pack.check({ ...base, meta: { mode: 'frac-dec' } }, '3/4', config).status).toBe('incorrect');
    expect(pack.check({ ...base, meta: { mode: 'frac-pct' } }, '75%', config).status).toBe('correct');
    expect(pack.check({ ...base, meta: { mode: 'frac-pct' } }, '75', config).status).toBe('correct');
    expect(pack.check({ ...base, meta: { mode: 'frac-pct' } }, '0.75', config).status).toBe('incorrect');
    expect(pack.check({ ...base, meta: { mode: 'dec-frac' } }, '3/4', config).status).toBe('correct');
    expect(pack.check({ ...base, meta: { mode: 'dec-frac' } }, '6/8', config).status).toBe('correct_form_hint');
    expect(pack.check({ ...base, meta: { mode: 'pct-frac' } }, '0.75', config).status).toBe('incorrect');
  });
});

describe('prime-factor', () => {
  it('accepts any prime multiset ordering and rejects composite factors', () => {
    const pack = getPack('prime-factor')!;
    const config = pack.defaultConfig();
    const f = primeFactors(72);
    expect(formatFactorization(f)).toBe('2³ · 3²');
    const inst = {
      slots: { n: { t: 'frac' as const, v: frac(72) }, factored: { t: 'expr' as const, v: '2³ · 3²' } },
      hidden: 'factored',
      meta: { n: 72 },
    };
    expect(pack.check(inst, '2^3 * 3^2', config).status).toBe('correct');
    expect(pack.check(inst, '3² × 2³', config).status).toBe('correct');
    expect(pack.check(inst, '2·2·2·3·3', config).status).toBe('correct');
    expect(pack.check(inst, '8 * 9', config).status).toBe('incorrect');
    expect(pack.check(inst, '2^3 * 3', config).status).toBe('incorrect');
    expect(parseFactorProduct('2**3*3**2')?.get(2)).toBe(3);
  });
});

describe('sci-notation', () => {
  it('parses several notations and enforces mantissa range', () => {
    const pack = getPack('sci-notation')!;
    const config = pack.defaultConfig();
    expect(parseSci('3.4e5')).toEqual({ mantissa: frac(34, 10), exp: 5 });
    expect(parseSci('3.4 × 10⁵')).toEqual({ mantissa: frac(34, 10), exp: 5 });
    const inst = {
      slots: { given: { t: 'expr' as const, v: '340000' }, answer: { t: 'expr' as const, v: '3.4 × 10⁵' } },
      hidden: 'answer',
      meta: { mode: 'to-sci', mantissa: frac(34, 10), exp: 5 },
    };
    expect(pack.check(inst, '3.4x10^5', config).status).toBe('correct');
    expect(pack.check(inst, '34 x 10^4', config).status).toBe('incorrect');
    expect(pack.check(inst, '3.4 * 10^6', config).status).toBe('incorrect');
    const std = { ...inst, meta: { mode: 'to-standard', mantissa: frac(34, 10), exp: -3 } };
    expect(pack.check(std, '0.0034', config).status).toBe('correct');
  });
});

describe('exponent-laws', () => {
  it('grades exponents and negative-exponent values', () => {
    const pack = getPack('exponent-laws')!;
    const config = pack.defaultConfig();
    const inst = {
      slots: { expr: { t: 'expr' as const, v: 'x⁴ · x³' }, answer: { t: 'frac' as const, v: frac(7) } },
      hidden: 'answer',
      meta: { rule: 'product', base: 'x', askValue: false },
    };
    expect(pack.check(inst, '7', config).status).toBe('correct');
    expect(pack.check(inst, '12', config).status).toBe('incorrect');
    const neg = {
      slots: { expr: { t: 'expr' as const, v: '2⁻³' }, answer: { t: 'frac' as const, v: frac(1, 8) } },
      hidden: 'answer',
      meta: { rule: 'negative', base: '2', askValue: true },
    };
    expect(pack.check(neg, '1/8', config).status).toBe('correct');
    expect(pack.check(neg, '0.125', config).status).toBe('correct_form_hint');
    expect(pack.check(neg, '-8', config).status).toBe('incorrect');
  });
});
