import { describe, expect, it } from 'vitest';
import { createRng } from '../math/rng';
import { listPacks, getPack } from '../engine/registry';
import { createSession, submitAnswer, nextProblem } from '../engine/session';
import { expand, parseFactored, formatFactored, quadsEqual } from '../expr/quadratic';
import type { FactoredForm } from '../expr/quadratic';
import { frac, formatFrac } from '../math';

describe('registry', () => {
  it('ships five seed packs', () => {
    expect(listPacks().map((p) => p.id).sort()).toEqual(
      [
        'factor-quad',
        'fraction-ops',
        'integer-ops',
        'linear-one',
        'reduce-equiv',
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
