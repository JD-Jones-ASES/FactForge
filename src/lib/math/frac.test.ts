import { describe, expect, it } from 'vitest';
import {
  frac,
  eq,
  add,
  mul,
  div,
  parseRational,
  gradeRational,
  formatFrac,
  isReducedForm,
} from './frac';

describe('frac', () => {
  it('reduces on create', () => {
    expect(frac(2, 4)).toEqual({ n: 1, d: 2 });
    expect(frac(-6, 9)).toEqual({ n: -2, d: 3 });
    expect(frac(3, -6)).toEqual({ n: -1, d: 2 });
  });

  it('does exact arithmetic', () => {
    expect(eq(add(frac(1, 2), frac(1, 3)), frac(5, 6))).toBe(true);
    expect(eq(mul(frac(2, 3), frac(3, 4)), frac(1, 2))).toBe(true);
    expect(eq(div(frac(1, 2), frac(1, 4)), frac(2, 1))).toBe(true);
  });

  it('formats with unicode minus', () => {
    expect(formatFrac(frac(-3, 4))).toBe('−3/4');
    expect(formatFrac(frac(5, 1))).toBe('5');
  });
});

describe('parseRational', () => {
  it('parses integers fractions mixed decimals', () => {
    expect(parseRational('3').ok && parseRational('3').value).toEqual({ n: 3, d: 1 });
    const f = parseRational('2/4');
    expect(f.ok).toBe(true);
    if (f.ok) {
      expect(eq(f.value, frac(1, 2))).toBe(true);
      expect(f.reduced).toBe(false);
    }
    const m = parseRational('1 1/2');
    expect(m.ok && eq(m.value, frac(3, 2))).toBe(true);
    const d = parseRational('0.5');
    expect(d.ok && eq(d.value, frac(1, 2))).toBe(true);
  });
});

describe('gradeRational', () => {
  it('soft-hints unreduced when allowed', () => {
    const parsed = parseRational('2/4');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(gradeRational(frac(1, 2), parsed)).toBe('correct_form_hint');
    expect(gradeRational(frac(1, 2), parsed, { requireReduced: true })).toBe('incorrect');
  });

  it('accepts reduced form', () => {
    const parsed = parseRational('1/2');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(gradeRational(frac(1, 2), parsed)).toBe('correct');
  });
});

describe('isReducedForm', () => {
  it('detects reduction', () => {
    expect(isReducedForm(1, 2)).toBe(true);
    expect(isReducedForm(2, 4)).toBe(false);
  });
});
