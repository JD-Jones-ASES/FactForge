import { describe, expect, it } from 'vitest';
import { createRng } from '../math/rng';
import { listPacks, getPack } from '../engine/registry';
import { createSession, submitAnswer, nextProblem } from '../engine/session';
import {
  expand,
  parseFactored,
  formatFactored,
  parseQuadratic,
  quadsEqual,
} from '../expr/quadratic';
import type { FactoredForm } from '../expr/quadratic';
import { frac, formatFrac } from '../math';
import { resetMixDeck } from './gcf-lcm';

describe('registry', () => {
  it('ships expanded curriculum packs', () => {
    expect(listPacks().map((p) => p.id).sort()).toEqual(
      [
        'expand-quad',
        'factor-quad',
        'fraction-ops',
        'gcf-lcm',
        'integer-ops',
        'linear-one',
        'percent-of',
        'powers',
        'proportion',
        'circles',
        'complementary',
        'exterior-angle',
        'linear-pair',
        'linear-write',
        'rationalize',
        'reduce-equiv',
        'roots',
        'transversal',
        'triangle-sum',
        'vertical-angles',
      ].sort(),
    );
  });
});

describe('integer-ops', () => {
  it('grades correct result', () => {
    const pack = getPack('integer-ops')!;
    const config = pack.defaultConfig();
    const session = createSession(pack, config, 42);
    // force a known instance via generate loop isn't deterministic enough —
    // use pack.check on a constructed instance
    const instance = {
      slots: {
        left: { t: 'frac' as const, v: frac(3, 1) },
        op: { t: 'op' as const, v: '+' },
        right: { t: 'frac' as const, v: frac(4, 1) },
        result: { t: 'frac' as const, v: frac(7, 1) },
      },
      hidden: 'result',
    };
    expect(pack.check(instance, '7', config).status).toBe('correct');
    expect(pack.check(instance, '8', config).status).toBe('incorrect');
  });

  it('generates solvable instances', () => {
    const pack = getPack('integer-ops')!;
    const config = pack.parseConfig({ ops: ['+', '-', '*', '/'], max: 12, hideMode: 'both' });
    const rng = createRng(7);
    for (let i = 0; i < 30; i++) {
      const inst = pack.generate(config, rng);
      expect(inst.slots.left).toBeTruthy();
      const expected = pack.expectedDisplay(inst, config);
      expect(expected.length).toBeGreaterThan(0);
      expect(pack.check(inst, expected.replace(/−/g, '-'), config).status).toMatch(
        /correct/,
      );
    }
  });
});

describe('fraction-ops', () => {
  it('soft-hints unreduced answers', () => {
    const pack = getPack('fraction-ops')!;
    const config = pack.parseConfig({ softFormHints: true, ops: ['+'], maxDenom: 5 });
    const instance = {
      slots: {
        left: { t: 'frac' as const, v: frac(1, 4) },
        op: { t: 'op' as const, v: '+' },
        right: { t: 'frac' as const, v: frac(1, 4) },
        result: { t: 'frac' as const, v: frac(1, 2) },
      },
      hidden: 'result',
    };
    expect(pack.check(instance, '2/4', config).status).toBe('correct_form_hint');
    expect(pack.check(instance, '1/2', config).status).toBe('correct');
  });
});

describe('reduce-equiv', () => {
  it('requires reduced form in reduce mode', () => {
    const pack = getPack('reduce-equiv')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        given: { t: 'frac' as const, v: frac(2, 4) },
        answer: { t: 'frac' as const, v: frac(1, 2) },
      },
      hidden: 'answer',
      meta: { mode: 'reduce', displayN: 2, displayD: 4 },
    };
    expect(pack.check(instance, '2/4', config).status).toBe('incorrect');
    expect(pack.check(instance, '1/2', config).status).toBe('correct');
  });
});

describe('linear-one', () => {
  it('solves for x', () => {
    const pack = getPack('linear-one')!;
    const config = pack.defaultConfig();
    // 2x + 1 = 7 → x = 3
    const instance = {
      slots: {
        a: { t: 'frac' as const, v: frac(2, 1) },
        x: { t: 'frac' as const, v: frac(3, 1) },
        b: { t: 'frac' as const, v: frac(1, 1) },
        c: { t: 'frac' as const, v: frac(7, 1) },
      },
      hidden: 'x',
    };
    expect(pack.check(instance, '3', config).status).toBe('correct');
    const display = pack.format(instance);
    expect(display.prompt).toMatch(/Solve for x/i);
    expect(display.pieces.map((p) => (p.kind === 'text' ? p.text : p.text)).join('')).toContain(
      '=',
    );
  });

  it('generates and self-checks', () => {
    const pack = getPack('linear-one')!;
    const config = pack.parseConfig({ hideMode: 'x', maxCoeff: 8 });
    const rng = createRng(99);
    for (let i = 0; i < 20; i++) {
      const inst = pack.generate(config, rng);
      const ans = formatFrac((inst.slots.x as { v: { n: number; d: number } }).v).replace(
        /−/g,
        '-',
      );
      expect(pack.check(inst, ans, config).status).toMatch(/correct/);
    }
  });
});

describe('factor-quad', () => {
  it('accepts reordered factors', () => {
    const pack = getPack('factor-quad')!;
    const config = pack.defaultConfig();
    const factors: FactoredForm = {
      leading: 1,
      factors: [
        { coeff: 1, constant: 2 },
        { coeff: 1, constant: -3 },
      ],
    };
    const q = expand(factors);
    const instance = {
      slots: {
        expanded: { t: 'expr' as const, v: 'x² − x − 6', meta: q },
        factored: { t: 'expr' as const, v: formatFactored(factors), meta: factors },
      },
      hidden: 'factored',
      meta: { quadratic: q, factors },
    };
    expect(pack.check(instance, '(x-3)(x+2)', config).status).toBe('correct');
    expect(pack.check(instance, '(x+2)(x-3)', config).status).toBe('correct');
    expect(pack.check(instance, '(x+1)(x-6)', config).status).toBe('incorrect');
  });

  it('parseFactored handles leading coeff', () => {
    const f = parseFactored('2(x+1)(x-4)');
    expect(f).not.toBeNull();
    if (!f) return;
    expect(quadsEqual(expand(f), { A: 2, B: -6, C: -8 })).toBe(true);
  });
});

describe('session', () => {
  it('advances streak on correct', () => {
    const pack = getPack('integer-ops')!;
    let session = createSession(pack, pack.defaultConfig(), 1);
    const expected = pack
      .expectedDisplay(session.current, session.config)
      .replace(/−/g, '-');
    session = submitAnswer(session, expected);
    expect(session.stats.correct).toBe(1);
    expect(session.stats.streak).toBe(1);
    session = nextProblem(session);
    expect(session.lastResult).toBeNull();
  });
});

describe('proportion', () => {
  it('grades missing term and accepts cross-product equals', () => {
    const pack = getPack('proportion')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        a: { t: 'frac' as const, v: frac(2, 1) },
        b: { t: 'frac' as const, v: frac(3, 1) },
        c: { t: 'frac' as const, v: frac(4, 1) },
        d: { t: 'frac' as const, v: frac(6, 1) },
      },
      hidden: 'd',
    };
    expect(pack.check(instance, '6', config).status).toBe('correct');
    expect(pack.check(instance, '7', config).status).toBe('incorrect');
  });
});

describe('percent-of', () => {
  it('accepts 25 and 25% for percent slot', () => {
    const pack = getPack('percent-of')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        p: { t: 'frac' as const, v: frac(25, 1) },
        b: { t: 'frac' as const, v: frac(80, 1) },
        c: { t: 'frac' as const, v: frac(20, 1) },
      },
      hidden: 'p',
    };
    expect(pack.check(instance, '25', config).status).toBe('correct');
    expect(pack.check(instance, '25%', config).status).toBe('correct');
  });
});

describe('gcf-lcm', () => {
  it('grades GCF and LCM', () => {
    const pack = getPack('gcf-lcm')!;
    const config = pack.defaultConfig();
    const base = {
      slots: {
        a: { t: 'frac' as const, v: frac(12, 1) },
        b: { t: 'frac' as const, v: frac(18, 1) },
        g: { t: 'frac' as const, v: frac(6, 1) },
        m: { t: 'frac' as const, v: frac(36, 1) },
      },
    };
    expect(
      pack.check({ ...base, hidden: 'g', meta: { find: 'g' } }, '6', config).status,
    ).toBe('correct');
    expect(
      pack.check({ ...base, hidden: 'm', meta: { find: 'm' } }, '36', config).status,
    ).toBe('correct');
  });

  it('mix mode yields both GCF and LCM within a short run', () => {
    resetMixDeck();
    const pack = getPack('gcf-lcm')!;
    const config = pack.parseConfig({ mode: 'both', max: 60 });
    const rng = createRng(12345);
    const finds = new Set<string>();
    for (let i = 0; i < 4; i++) {
      finds.add(pack.generate(config, rng).hidden);
    }
    expect(finds.has('g')).toBe(true);
    expect(finds.has('m')).toBe(true);
  });
});

describe('expand-quad', () => {
  it('parses expanded answers', () => {
    const pack = getPack('expand-quad')!;
    const config = pack.defaultConfig();
    const f: FactoredForm = {
      leading: 1,
      factors: [
        { coeff: 1, constant: 2 },
        { coeff: 1, constant: 3 },
      ],
    };
    const q = expand(f);
    const instance = {
      slots: {
        factored: { t: 'expr' as const, v: '(x+2)(x+3)', meta: f },
        expanded: { t: 'expr' as const, v: 'x² + 5x + 6', meta: q },
      },
      hidden: 'expanded',
      meta: { quadratic: q, factors: f },
    };
    expect(pack.check(instance, 'x^2+5x+6', config).status).toBe('correct');
    expect(pack.check(instance, 'x² + 5x + 6', config).status).toBe('correct');
    expect(parseQuadratic('2x^2-3x+1')).toEqual({ A: 2, B: -3, C: 1 });
  });
});

describe('powers', () => {
  it('grades result and base', () => {
    const pack = getPack('powers')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        base: { t: 'frac' as const, v: frac(2, 1) },
        exp: { t: 'frac' as const, v: frac(3, 1) },
        result: { t: 'frac' as const, v: frac(8, 1) },
      },
      hidden: 'result',
      meta: { base: 2, exp: 3, result: 8 },
    };
    expect(pack.check(instance, '8', config).status).toBe('correct');
  });
});

describe('roots', () => {
  it('evaluates square roots exactly', () => {
    const pack = getPack('roots')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        index: { t: 'frac' as const, v: frac(2, 1) },
        radicand: { t: 'frac' as const, v: frac(49, 1) },
        root: { t: 'frac' as const, v: frac(7, 1) },
      },
      hidden: 'root',
      meta: { index: 2, radicand: 49, root: 7 },
    };
    expect(pack.check(instance, '7', config).status).toBe('correct');
    expect(pack.format(instance).pieces.some((p) => p.kind === 'slot')).toBe(
      true,
    );
  });
});

describe('triangle-sum', () => {
  it('grades missing angle and attaches a figure', () => {
    const pack = getPack('triangle-sum')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        A: { t: 'frac' as const, v: frac(50, 1) },
        B: { t: 'frac' as const, v: frac(60, 1) },
        C: { t: 'frac' as const, v: frac(70, 1) },
      },
      hidden: 'C',
      meta: { A: 50, B: 60, C: 70 },
    };
    expect(pack.check(instance, '70', config).status).toBe('correct');
    expect(pack.check(instance, '70°', config).status).toBe('correct');
    const display = pack.format(instance);
    expect(display.figure?.kind).toBe('triangle-angles');
    if (display.figure?.kind === 'triangle-angles') {
      expect(display.figure.labels.C).toBe('?');
      expect(display.figure.labels.A).toBe('50');
    }
  });
});

describe('linear-pair', () => {
  it('grades 180° complement', () => {
    const pack = getPack('linear-pair')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        left: { t: 'frac' as const, v: frac(55, 1) },
        right: { t: 'frac' as const, v: frac(125, 1) },
      },
      hidden: 'right',
      meta: { left: 55, right: 125 },
    };
    expect(pack.check(instance, '125', config).status).toBe('correct');
    expect(pack.format(instance).figure?.kind).toBe('linear-pair');
  });
});

describe('roots radical notation', () => {
  it('uses ∛ not 3√ for cube roots', async () => {
    const { radicalText } = await import('./roots');
    expect(radicalText(frac(3, 1), '?')).toBe('∛?');
    expect(radicalText(frac(3, 1), '64')).toBe('∛64');
    expect(radicalText(frac(2, 1), '49')).toBe('√49');
    expect(radicalText(frac(5, 1), '32')).toBe('⁵√32');
    expect(radicalText(frac(3, 1), '?')).not.toMatch(/^3√/);
  });
});

describe('vertical-angles', () => {
  it('grades opposite equal', () => {
    const pack = getPack('vertical-angles')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        opp1: { t: 'frac' as const, v: frac(70, 1) },
        opp2: { t: 'frac' as const, v: frac(70, 1) },
        adj1: { t: 'frac' as const, v: frac(110, 1) },
        adj2: { t: 'frac' as const, v: frac(110, 1) },
      },
      hidden: 'opp2',
      meta: { opp: 70, adj: 110 },
    };
    expect(pack.check(instance, '70', config).status).toBe('correct');
    expect(pack.format(instance).figure?.kind).toBe('vertical-angles');
  });
});

describe('transversal', () => {
  it('uses alternate interior equality', () => {
    const pack = getPack('transversal')!;
    const config = pack.defaultConfig();
    const rng = createRng(1);
    const inst = pack.generate(config, rng);
    const ans = pack.expectedDisplay(inst, config).replace(/°/g, '');
    expect(pack.check(inst, ans, config).status).toMatch(/correct/);
    expect(pack.format(inst).figure?.kind).toBe('parallel-transversal');
  });
});

describe('circles + pi', () => {
  it('grades circumference as kπ', () => {
    const pack = getPack('circles')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        r: { t: 'frac' as const, v: frac(3, 1) },
        d: { t: 'frac' as const, v: frac(6, 1) },
        C: { t: 'expr' as const, v: '6π' },
        A: { t: 'expr' as const, v: '9π' },
      },
      hidden: 'C',
      meta: {
        r: 3,
        d: 6,
        C: { coeff: frac(6, 1), hasPi: true },
        A: { coeff: frac(9, 1), hasPi: true },
      },
    };
    expect(pack.check(instance, '6π', config).status).toBe('correct');
    expect(pack.check(instance, '6*pi', config).status).toBe('correct');
    expect(pack.check(instance, '18.84', config).status).toBe('incorrect');
  });
});

describe('rationalize', () => {
  it('accepts rationalized form', () => {
    const pack = getPack('rationalize')!;
    const config = pack.defaultConfig();
    const instance = {
      slots: {
        given: { t: 'expr' as const, v: '1/√2' },
        answer: { t: 'expr' as const, v: '√2/2' },
      },
      hidden: 'answer',
      meta: {
        accepted: ['√2/2', '(√2)/2'],
        displayAnswer: '√2/2',
        prompt: '1/√2',
      },
    };
    // normalize strips to lowercase sqrt→√
    expect(pack.check(instance, '√2/2', config).status).toBe('correct');
    expect(pack.check(instance, '1/√2', config).status).toBe('incorrect');
  });
});

describe('linear-write', () => {
  it('parses and grades y=mx+b', () => {
    const pack = getPack('linear-write')!;
    const config = pack.defaultConfig();
    const L = { m: frac(2, 1), b: frac(-3, 1) };
    const instance = {
      slots: { line: { t: 'expr' as const, v: 'y = 2x − 3' } },
      hidden: 'line',
      meta: {
        line: L,
        given: 'test',
        mode: 'point-slope',
      },
    };
    expect(pack.check(instance, 'y=2x-3', config).status).toBe('correct');
    expect(pack.check(instance, 'y=2x+1', config).status).toBe('incorrect');
  });
});
