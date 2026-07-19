import { describe, expect, it } from 'vitest';
import { parsePiExpr, formatPiExpr, piExpr, eqPi } from './pi';
import { frac } from './frac';

describe('parsePiExpr', () => {
  it('parses kπ forms', () => {
    const a = parsePiExpr('6π');
    expect(a.ok).toBe(true);
    if (a.ok) expect(a.value).toEqual(piExpr(6, true));
    const b = parsePiExpr('6*pi');
    expect(b.ok).toBe(true);
    if (b.ok) expect(b.value).toEqual(piExpr(6, true));
    const c = parsePiExpr('π');
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.value).toEqual(piExpr(1, true));
    const d = parsePiExpr('3/2π');
    expect(d.ok).toBe(true);
    if (d.ok) {
      expect(d.value).toEqual({
        coeff: frac(3, 2),
        hasPi: true,
      });
    }
  });

  it('rejects bare decimals for pi products', () => {
    // plain rational still ok
    const six = parsePiExpr('6');
    expect(six.ok).toBe(true);
    if (six.ok) expect(six.value.hasPi).toBe(false);
  });

  it('formats', () => {
    expect(formatPiExpr(piExpr(6))).toBe('6π');
    expect(formatPiExpr(piExpr(1))).toBe('π');
    expect(eqPi(piExpr(2), piExpr(2))).toBe(true);
  });
});
