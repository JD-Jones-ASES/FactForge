import { describe, expect, it } from 'vitest';
import { getPack } from '../engine/registry';
import { frac } from '../math';
import { createRng } from '../math/rng';

describe('linear-ineq', () => {
  const pack = getPack('linear-ineq')!;
  const config = pack.defaultConfig();
  const inst = {
    slots: { eq: { t: 'expr' as const, v: '−2x + 1 < 7' }, answer: { t: 'expr' as const, v: 'x > −3' } },
    hidden: 'answer',
    meta: { a: -2, b: 1, displayedOp: '<', solutionOp: '>', bound: frac(-3) },
  };
  it('accepts equivalent spellings and flags the missing flip', () => {
    expect(pack.check(inst, 'x > -3', config).status).toBe('correct');
    expect(pack.check(inst, '-3 < x', config).status).toBe('correct');
    const flipped = pack.check(inst, 'x < -3', config);
    expect(flipped.status).toBe('incorrect');
    expect(flipped.message).toMatch(/flips/);
    expect(pack.check(inst, 'x ≥ -3', config).status).toBe('incorrect');
  });
});

describe('slope-intercepts', () => {
  const pack = getPack('slope-intercepts')!;
  const config = pack.defaultConfig();
  it('accepts intercepts as a number or a point', () => {
    const inst = {
      slots: { given: { t: 'expr' as const, v: '2x + 3y = 12' }, answer: { t: 'frac' as const, v: frac(6) } },
      hidden: 'answer',
      meta: { mode: 'x-int', A: 2, B: 3, C: 12 },
    };
    expect(pack.check(inst, '6', config).status).toBe('correct');
    expect(pack.check(inst, '(6, 0)', config).status).toBe('correct');
    expect(pack.check(inst, '(0, 6)', config).status).toBe('incorrect');
    expect(pack.check(inst, '4', config).status).toBe('incorrect');
  });
  it('slope from points is exact', () => {
    const rng = createRng(5);
    const c = pack.parseConfig({ mode: 'slope-points' });
    for (let i = 0; i < 20; i++) {
      const inst = pack.generate(c, rng);
      const { x1, y1, x2, y2 } = inst.meta as Record<string, number>;
      const m = (inst.slots.answer as { v: { n: number; d: number } }).v;
      expect(m.n * (x2 - x1)).toBe(m.d * (y2 - y1));
    }
  });
});

describe('abs-value', () => {
  const pack = getPack('abs-value')!;
  const config = pack.defaultConfig();
  it('solves |x + b| = c with both cases', () => {
    const inst = {
      slots: { expr: { t: 'expr' as const, v: '|x + 3| = 5' }, answer: { t: 'expr' as const, v: 'x = −8, 2' } },
      hidden: 'answer',
      meta: { mode: 'solve', sols: [frac(2), frac(-8)] },
    };
    expect(pack.check(inst, '2, -8', config).status).toBe('correct');
    expect(pack.check(inst, 'x = -8 or x = 2', config).status).toBe('correct');
    const partial = pack.check(inst, '2', config);
    expect(partial.status).toBe('incorrect');
    expect(partial.message).toMatch(/one solution/);
  });
});

describe('simplify-radical', () => {
  const pack = getPack('simplify-radical')!;
  const config = pack.defaultConfig();
  const inst = {
    slots: { given: { t: 'expr' as const, v: '√72' }, answer: { t: 'expr' as const, v: '6√2' } },
    hidden: 'answer',
    meta: { N: 72, k: 1, simplified: { coef: frac(6), rad: 2 } },
  };
  it('requires a square-free radicand', () => {
    expect(pack.check(inst, '6√2', config).status).toBe('correct');
    expect(pack.check(inst, '6sqrt(2)', config).status).toBe('correct');
    const unsimplified = pack.check(inst, '3√8', config);
    expect(unsimplified.status).toBe('incorrect');
    expect(unsimplified.message).toMatch(/perfect-square/);
    expect(pack.check(inst, '√72', config).status).toBe('incorrect');
    expect(pack.check(inst, '6√3', config).status).toBe('incorrect');
  });
});

describe('solve-quad', () => {
  const pack = getPack('solve-quad')!;
  const config = pack.defaultConfig();
  it('grades solution sets and hints sign flips', () => {
    const inst = {
      slots: { eq: { t: 'expr' as const, v: 'x² − x − 6 = 0' }, answer: { t: 'expr' as const, v: 'x = −2, 3' } },
      hidden: 'answer',
      meta: { q: { A: 1, B: -1, C: -6 }, sols: [frac(3), frac(-2)] },
    };
    expect(pack.check(inst, 'x = 3, -2', config).status).toBe('correct');
    expect(pack.check(inst, '{-2, 3}', config).status).toBe('correct');
    const flipped = pack.check(inst, '-3, 2', config);
    expect(flipped.status).toBe('incorrect');
    expect(flipped.message).toMatch(/Signs/);
  });
  it('generated equations really have the listed roots', () => {
    const rng = createRng(21);
    const c = pack.parseConfig({ leading: 'any', roots: 'rational', rearranged: true });
    for (let i = 0; i < 30; i++) {
      const inst = pack.generate(c, rng);
      const q = inst.meta?.q as { A: number; B: number; C: number };
      for (const r of inst.meta?.sols as { n: number; d: number }[]) {
        // A r² + B r + C = 0 with r = n/d → A n² + B n d + C d² = 0
        expect(q.A * r.n * r.n + q.B * r.n * r.d + q.C * r.d * r.d).toBe(0);
      }
    }
  });
});

describe('vertex', () => {
  const pack = getPack('vertex')!;
  const config = pack.defaultConfig();
  it('grades vertex points and expansions', () => {
    const v = {
      slots: { given: { t: 'expr' as const, v: 'y = x² − 4x + 7' }, answer: { t: 'expr' as const, v: '(2, 3)' } },
      hidden: 'answer',
      meta: { mode: 'vertex', a: 1, h: 2, k: 3, q: { A: 1, B: -4, C: 7 } },
    };
    expect(pack.check(v, '(2, 3)', config).status).toBe('correct');
    expect(pack.check(v, '2, 3', config).status).toBe('correct');
    const hOnly = pack.check(v, '(2, 7)', config);
    expect(hOnly.status).toBe('incorrect');
    expect(hOnly.message).toMatch(/h is right/);
    const exp = { ...v, meta: { ...v.meta, mode: 'to-standard' } };
    expect(pack.check(exp, 'x^2 - 4x + 7', config).status).toBe('correct');
    expect(pack.check(exp, 'y = x² − 4x + 7', config).status).toBe('correct');
    const axis = { ...v, meta: { ...v.meta, mode: 'axis' } };
    expect(pack.check(axis, 'x = 2', config).status).toBe('correct');
    expect(pack.check(axis, '2', config).status).toBe('correct');
    expect(pack.format(v).figure?.kind).toBe('parabola');
  });
});
