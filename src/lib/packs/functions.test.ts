import { describe, expect, it } from 'vitest';
import { getPack } from '../engine/registry';
import { frac, fromInt } from '../math';
import { createRng } from '../math/rng';
import { evalFn, formatFn } from './func-eval';

describe('func-eval', () => {
  it('formats and evaluates functions exactly', () => {
    expect(formatFn({ type: 'quadratic', a: 2, b: -3, c: 1 }, 'f')).toBe('f(x) = 2x² − 3x + 1');
    expect(formatFn({ type: 'rational', a: 6, b: -2 }, 'g')).toBe('g(x) = 6 / (x − 2)');
    expect(evalFn({ type: 'quadratic', a: 2, b: -3, c: 1 }, fromInt(-2))).toEqual(frac(15));
    expect(evalFn({ type: 'rational', a: 6, b: -2 }, fromInt(2))).toBeNull();
    expect(evalFn({ type: 'rational', a: 6, b: -2 }, fromInt(6))).toEqual(frac(3, 2));
  });
  it('composition and solve modes self-check', () => {
    const pack = getPack('func-eval')!;
    const config = pack.parseConfig({
      types: ['linear', 'quadratic', 'cubic', 'rational'],
      composition: true,
      solveInput: true,
    });
    const rng = createRng(8);
    const kinds = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const inst = pack.generate(config, rng);
      kinds.add(String(inst.meta?.kind));
      const ans = pack.expectedDisplay(inst, config).replace(/−/g, '-');
      expect(pack.check(inst, `k = ${ans}`, config).status).toMatch(/^correct/);
    }
    expect(kinds).toContain('compose');
    expect(kinds).toContain('solve');
  });
});

describe('avg-rate', () => {
  it('matches the secant slope of the generated function', () => {
    const pack = getPack('avg-rate')!;
    const config = pack.parseConfig({ types: ['linear', 'quadratic', 'cubic'], source: 'table' });
    const rng = createRng(3);
    for (let i = 0; i < 30; i++) {
      const inst = pack.generate(config, rng);
      const f = inst.meta?.f as Parameters<typeof evalFn>[0];
      const p = Number(inst.meta?.p);
      const q = Number(inst.meta?.q);
      const fp = evalFn(f, fromInt(p))!;
      const fq = evalFn(f, fromInt(q))!;
      const rate = (inst.slots.answer as { v: { n: number; d: number } }).v;
      // rate · (q − p) = f(q) − f(p)  (all integers here)
      expect((rate.n / rate.d) * (q - p)).toBeCloseTo(fq.n / fq.d - fp.n / fp.d, 9);
      expect(String(inst.slots.fn!.v)).toMatch(/f\(/);
    }
  });
});

describe('logs', () => {
  const pack = getPack('logs')!;
  it('evaluates, inverts, and handles fractional / negative results', () => {
    const config = pack.defaultConfig();
    const inst = {
      slots: { b: { t: 'frac' as const, v: frac(2) }, x: { t: 'frac' as const, v: frac(8) }, y: { t: 'frac' as const, v: frac(3) } },
      hidden: 'y',
      meta: { b: 2 },
    };
    expect(pack.check(inst, '3', config).status).toBe('correct');
    expect(pack.check(inst, '4', config).status).toBe('incorrect');
    const text = pack.format(inst).pieces.map((p) => p.text).join('');
    expect(text).toContain('log₂');
    const frac32 = pack.parseConfig({ bases: ['2', '3'], fractional: true, negatives: true, hideMode: 'both' });
    const rng = createRng(4);
    let sawFraction = false;
    let sawNegative = false;
    for (let i = 0; i < 80; i++) {
      const g = pack.generate(frac32, rng);
      const b = (g.slots.b as { v: { n: number } }).v.n;
      const x = (g.slots.x as { v: { n: number; d: number } }).v;
      const y = (g.slots.y as { v: { n: number; d: number } }).v;
      // b^y = x exactly: b^(n/d) = x ⇔ b^n = x^d
      expect(Math.pow(b, y.n / y.d)).toBeCloseTo(x.n / x.d, 6);
      if (y.d !== 1) sawFraction = true;
      if (y.n < 0) sawNegative = true;
    }
    expect(sawFraction).toBe(true);
    expect(sawNegative).toBe(true);
  });
});

describe('sequences', () => {
  it('partial sums and nth terms agree with the recurrence', () => {
    const pack = getPack('sequences')!;
    const config = pack.parseConfig({ kind: 'both', find: 'sum', fractions: true });
    const rng = createRng(13);
    for (let i = 0; i < 30; i++) {
      const inst = pack.generate(config, rng);
      const { kind, n, a1, step } = inst.meta as {
        kind: string;
        n: number;
        a1: { n: number; d: number };
        step: { n: number; d: number };
      };
      let sum = 0;
      let t = a1.n / a1.d;
      for (let k = 1; k <= n; k++) {
        sum += t;
        t = kind === 'arithmetic' ? t + step.n / step.d : t * (step.n / step.d);
      }
      const ans = (inst.slots.answer as { v: { n: number; d: number } }).v;
      expect(ans.n / ans.d).toBeCloseTo(sum, 6);
    }
  });
});
