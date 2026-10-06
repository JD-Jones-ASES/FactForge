import { describe, it, expect } from 'vitest';
import { createRng } from '../math';
import { degRadPack } from './deg-rad';
import { refAnglePack, quadrantOf, referenceAngle } from './ref-angle';
import { trigIdentityPack, ratiosFor } from './trig-identity';
import { inverseTrigPack } from './inverse-trig';
import { formatPiExpr, parsePiExpr } from '../math';
import { frac } from '../math';

describe('deg-rad', () => {
  it('formats fractional radians as kπ/d and accepts equivalent forms', () => {
    expect(formatPiExpr({ coeff: frac(150, 180), hasPi: true })).toBe('5π/6');
    expect(formatPiExpr({ coeff: frac(-45, 180), hasPi: true })).toBe('−π/4');
    const p = parsePiExpr('(5π)/6');
    expect(p.ok && p.value.coeff.n === 5 && p.value.coeff.d === 6).toBe(true);
  });

  it('flags the inverted conversion factor', () => {
    const rng = createRng(3);
    const cfg = { ...degRadPack.defaultConfig(), direction: 'to-rad' as const, allowNegative: false };
    for (let i = 0; i < 40; i++) {
      const inst = degRadPack.generate(cfg, rng);
      const deg = Number(inst.meta?.deg);
      if (deg === 0) continue;
      const res = degRadPack.check(inst, `${deg * 180}π`, cfg);
      expect(res.status).toBe('incorrect');
      expect(res.message).toMatch(/π\/180/);
      expect(degRadPack.check(inst, `${deg}π/180`, cfg).status).toBe('correct');
    }
  });

  it('converts radians to degrees exactly', () => {
    const rng = createRng(9);
    const cfg = { ...degRadPack.defaultConfig(), direction: 'to-deg' as const };
    const inst = degRadPack.generate(cfg, rng);
    const deg = Number(inst.meta?.deg);
    expect(degRadPack.check(inst, `${deg}`, cfg).status).toBe('correct');
    expect(degRadPack.check(inst, `${deg}°`, cfg).status).toBe('correct');
  });
});

describe('ref-angle', () => {
  it('computes quadrant and reference angle', () => {
    expect(quadrantOf(390)).toBe(1);
    expect(quadrantOf(-30)).toBe(4);
    expect(quadrantOf(210)).toBe(3);
    expect(quadrantOf(180)).toBeNull();
    expect(referenceAngle(150)).toBe(30);
    expect(referenceAngle(225)).toBe(45);
    expect(referenceAngle(-60)).toBe(60);
    expect(referenceAngle(750)).toBe(30);
  });

  it('accepts roman or arabic quadrant labels and hides the figure for quadrant tasks', () => {
    const rng = createRng(5);
    const cfg = { ...refAnglePack.defaultConfig(), tasks: ['quadrant' as const] };
    const inst = refAnglePack.generate(cfg, rng);
    const q = Number(inst.meta?.q);
    expect(refAnglePack.check(inst, ['I', 'II', 'III', 'IV'][q - 1]!, cfg).status).toBe('correct');
    expect(refAnglePack.check(inst, String(q), cfg).status).toBe('correct');
    expect(refAnglePack.check(inst, `Q${q}`, cfg).status).toBe('correct');
    expect(refAnglePack.check(inst, 'V', cfg).status).toBe('parse_error');
    expect(refAnglePack.format(inst).figure).toBeUndefined();
  });

  it('coterminal answers land in [0, 360) and radians grade exactly', () => {
    const rng = createRng(11);
    const cfg = { ...refAnglePack.defaultConfig(), tasks: ['coterminal' as const], unit: 'radians' as const };
    for (let i = 0; i < 20; i++) {
      const inst = refAnglePack.generate(cfg, rng);
      const cot = Number(inst.meta?.cot);
      expect(cot).toBeGreaterThanOrEqual(0);
      expect(cot).toBeLessThan(360);
      expect(refAnglePack.check(inst, `${cot}π/180`, cfg).status).toBe('correct');
      expect(refAnglePack.format(inst).figure?.kind).toBe('unit-circle');
    }
  });
});

describe('trig-identity', () => {
  it('builds all six ratios from a point', () => {
    const r = ratiosFor(-12, -5, 13);
    expect(r.sin).toEqual(frac(-5, 13));
    expect(r.cos).toEqual(frac(-12, 13));
    expect(r.tan).toEqual(frac(5, 12));
    expect(r.sec).toEqual(frac(-13, 12));
  });

  it('gives a sign hint when only the sign is wrong', () => {
    const rng = createRng(21);
    const cfg = trigIdentityPack.defaultConfig();
    let sawSignHint = false;
    for (let i = 0; i < 40; i++) {
      const inst = trigIdentityPack.generate(cfg, rng);
      const exp = inst.slots.answer.v as { n: number; d: number };
      expect(trigIdentityPack.check(inst, `${exp.n}/${exp.d}`, cfg).status).toBe('correct');
      const res = trigIdentityPack.check(inst, `${-exp.n}/${exp.d}`, cfg);
      expect(res.status).toBe('incorrect');
      if (/wrong sign/.test(res.message)) sawSignHint = true;
    }
    expect(sawSignHint).toBe(true);
  });

  it('keeps everything positive in quadrant I', () => {
    const rng = createRng(2);
    const cfg = { ...trigIdentityPack.defaultConfig(), quadrants: 'first' as const };
    for (let i = 0; i < 20; i++) {
      const inst = trigIdentityPack.generate(cfg, rng);
      const exp = inst.slots.answer.v as { n: number; d: number };
      expect(exp.n).toBeGreaterThan(0);
    }
  });
});

describe('inverse-trig', () => {
  it('respects principal ranges', () => {
    const rng = createRng(7);
    const cfg = inverseTrigPack.defaultConfig();
    for (let i = 0; i < 60; i++) {
      const inst = inverseTrigPack.generate(cfg, rng);
      const fn = String(inst.meta?.fn);
      const deg = Number(inst.meta?.deg);
      if (fn === 'arccos') {
        expect(deg).toBeGreaterThanOrEqual(0);
        expect(deg).toBeLessThanOrEqual(180);
      } else {
        expect(deg).toBeGreaterThanOrEqual(-90);
        expect(deg).toBeLessThanOrEqual(90);
      }
      const choices = inverseTrigPack.answerChoices!(inst).map((c) => c.value);
      expect(choices).toContain(inverseTrigPack.expectedDisplay(inst, cfg));
    }
  });

  it('hints when the reference angle is right but the range is wrong', () => {
    const rng = createRng(13);
    const cfg = { ...inverseTrigPack.defaultConfig(), functions: ['arcsin' as const], negatives: true };
    for (let i = 0; i < 30; i++) {
      const inst = inverseTrigPack.generate(cfg, rng);
      const deg = Number(inst.meta?.deg);
      if (deg >= 0) continue;
      const res = inverseTrigPack.check(inst, `${360 + deg}°`, cfg);
      expect(res.status).toBe('incorrect');
      expect(res.message).toMatch(/reference angle/);
      return;
    }
  });

  it('grades radians exactly, including equivalent forms', () => {
    const rng = createRng(17);
    const cfg = { ...inverseTrigPack.defaultConfig(), unit: 'radians' as const, negatives: false };
    const inst = inverseTrigPack.generate(cfg, rng);
    const deg = Number(inst.meta?.deg);
    expect(inverseTrigPack.check(inst, `${deg}π/180`, cfg).status).toBe('correct');
  });
});
