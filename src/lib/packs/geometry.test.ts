import { describe, expect, it } from 'vitest';
import { getPack } from '../engine/registry';
import { frac, fromInt } from '../math';
import { parsePiExpr } from '../math/pi';
import { createRng } from '../math/rng';

describe('pi parsing extensions', () => {
  it('accepts kπ/d forms', () => {
    expect(parsePiExpr('3π/2')).toEqual({ ok: true, value: { coeff: frac(3, 2), hasPi: true } });
    expect(parsePiExpr('π/6')).toEqual({ ok: true, value: { coeff: frac(1, 6), hasPi: true } });
    expect(parsePiExpr('(5pi)/4')).toEqual({ ok: true, value: { coeff: frac(5, 4), hasPi: true } });
    expect(parsePiExpr('-π/3')).toEqual({ ok: true, value: { coeff: frac(-1, 3), hasPi: true } });
  });
});

describe('polygon-angles', () => {
  it('whole-degree mode avoids fractional regular angles', () => {
    const pack = getPack('polygon-angles')!;
    const config = pack.parseConfig({ mode: 'interior', maxSides: 20, integerOnly: true });
    const rng = createRng(1);
    for (let i = 0; i < 40; i++) {
      const inst = pack.generate(config, rng);
      const v = (inst.slots.answer as { v: { n: number; d: number } }).v;
      expect(v.d).toBe(1);
      const n = Number(inst.meta?.n);
      expect(v.n * n).toBe((n - 2) * 180);
    }
    expect(pack.check(pack.generate(config, rng), '900/7', config).status).toBe('incorrect');
  });
});

describe('area-perimeter', () => {
  it('dimension mode hides a side and the figure marks it', () => {
    const pack = getPack('area-perimeter')!;
    const config = pack.parseConfig({ shapes: ['rectangle', 'trapezoid'], hideMode: 'dimension' });
    const rng = createRng(6);
    for (let i = 0; i < 20; i++) {
      const inst = pack.generate(config, rng);
      expect(inst.meta?.hidden).not.toBe('value');
      const d = pack.format(inst);
      expect(d.figure?.kind).toBe('shape-2d');
      expect(d.prompt).toMatch(/Find/);
    }
  });
  it('accepts decimal half-areas without a form hint', () => {
    const pack = getPack('area-perimeter')!;
    const inst = {
      slots: { given: { t: 'expr' as const, v: 'A = ½ · b · h' }, answer: { t: 'frac' as const, v: frac(15, 2) } },
      hidden: 'answer',
      meta: { shape: 'triangle', measure: 'area', dims: { b: 5, h: 3 }, value: frac(15, 2), hidden: 'value', formula: 'A = ½ · b · h' },
    };
    expect(pack.check(inst, '7.5', pack.defaultConfig()).status).toBe('correct');
    expect(pack.check(inst, '15/2', pack.defaultConfig()).status).toBe('correct');
  });
});

describe('volume', () => {
  it('requires exact π for curved solids', () => {
    const pack = getPack('volume')!;
    const inst = {
      slots: { given: { t: 'expr' as const, v: 'V = πr²h   r = 3, h = 2' }, answer: { t: 'expr' as const, v: '18π' } },
      hidden: 'answer',
      meta: { solid: 'cylinder', measure: 'volume', dims: 'r = 3, h = 2', formula: 'V = πr²h', value: { coeff: fromInt(18), hasPi: true } },
    };
    const config = pack.defaultConfig();
    expect(pack.check(inst, '18π', config).status).toBe('correct');
    expect(pack.check(inst, '18pi', config).status).toBe('correct');
    const noPi = pack.check(inst, '18', config);
    expect(noPi.status).toBe('incorrect');
    expect(noPi.message).toMatch(/Keep the π/);
    expect(pack.check(inst, '56.55', config).status).toBe('incorrect');
  });
});

describe('arc-sector', () => {
  it('distinguishes arc length from area and grades radians', () => {
    const pack = getPack('arc-sector')!;
    const config = pack.defaultConfig();
    const inst = {
      slots: { given: { t: 'expr' as const, v: 'r = 6,  θ = 60°' }, answer: { t: 'expr' as const, v: '2π' } },
      hidden: 'answer',
      meta: {
        find: 'arc',
        unit: 'degrees',
        r: 6,
        deg: 60,
        arc: { coeff: fromInt(2), hasPi: true },
        area: { coeff: fromInt(6), hasPi: true },
      },
    };
    expect(pack.check(inst, '2π', config).status).toBe('correct');
    const area = pack.check(inst, '6π', config);
    expect(area.status).toBe('incorrect');
    expect(area.message).toMatch(/sector area/);
    const angle = { ...inst, meta: { ...inst.meta, find: 'angle', unit: 'radians' } };
    expect(pack.check(angle, 'π/3', config).status).toBe('correct');
    expect(pack.check(angle, '60', config).status).toBe('incorrect');
    expect(pack.format(inst).figure?.kind).toBe('sector');
  });
});

describe('distance-midpoint', () => {
  const pack = getPack('distance-midpoint')!;
  const config = pack.defaultConfig();
  it('grades exact distances with a soft simplification hint', () => {
    const inst = {
      slots: { points: { t: 'expr' as const, v: '(1, 2) and (5, 10)' }, answer: { t: 'expr' as const, v: '4√5' } },
      hidden: 'answer',
      meta: { mode: 'distance', x1: 1, y1: 2, x2: 5, y2: 10, dist: { coef: fromInt(4), rad: 5 }, mid: [frac(3), frac(6)] },
    };
    expect(pack.check(inst, '4√5', config).status).toBe('correct');
    expect(pack.check(inst, '√80', config).status).toBe('correct_form_hint');
    expect(pack.check(inst, '9', config).status).toBe('incorrect');
  });
  it('grades midpoints and endpoints as points', () => {
    const inst = {
      slots: { points: { t: 'expr' as const, v: '(1, 2) and (4, 7)' }, answer: { t: 'expr' as const, v: '(5/2, 9/2)' } },
      hidden: 'answer',
      meta: { mode: 'midpoint', x1: 1, y1: 2, x2: 4, y2: 7, dist: { coef: fromInt(1), rad: 34 }, mid: [frac(5, 2), frac(9, 2)] },
    };
    expect(pack.check(inst, '(2.5, 4.5)', config).status).toBe('correct');
    expect(pack.check(inst, '(9/2, 5/2)', config).message).toMatch(/swapped/);
    const ep = { ...inst, meta: { ...inst.meta, mode: 'endpoint' } };
    expect(pack.check(ep, '(4, 7)', config).status).toBe('correct');
  });
});

describe('special-right', () => {
  it('produces the classic ratios exactly', () => {
    const pack = getPack('special-right')!;
    const config = pack.parseConfig({ triangles: ['30'], given: 'hyp' });
    const rng = createRng(2);
    for (let i = 0; i < 20; i++) {
      const inst = pack.generate(config, rng);
      const all = inst.meta?.all as Record<string, { coef: { n: number; d: number }; rad: number }>;
      const n = Number(inst.meta?.n);
      // hyp = n → short = n/2, long = (n/2)√3
      expect(all.short!.coef.n / all.short!.coef.d).toBeCloseTo(n / 2);
      expect(all.long!.rad).toBe(3);
      expect(pack.format(inst).figure?.kind).toBe('right-triangle');
    }
    const inst = {
      slots: { given: { t: 'expr' as const, v: 'hyp = 7' }, answer: { t: 'expr' as const, v: '7√2/2' } },
      hidden: 'answer',
      meta: {
        tri: '45',
        givenSide: 'hyp',
        askSide: 'short',
        n: 7,
        answer: { coef: frac(7, 2), rad: 2 },
        all: {},
      },
    };
    expect(pack.check(inst, '7√2/2', pack.defaultConfig()).status).toBe('correct');
    expect(pack.check(inst, '7/√2', pack.defaultConfig()).message).toMatch(/Rationalize/);
  });
});
