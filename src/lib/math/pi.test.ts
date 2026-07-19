import { describe, expect, it } from 'vitest';
import { parsePiExpr, formatPiExpr, piExpr, eqPi } from './pi';
import { frac } from './frac';

describe('parsePiExpr', () => {
  it('parses kπ forms', () => {
    expect(parsePiExpr('6π').ok && parsePiExpr('6π').value).toEqual(
      piExpr(6, true),
    );
    expect(parsePiExpr('6*pi').ok && parsePiExpr('6*pi').value).toEqual(
      piExpr(6, true),
    );
    expect(parsePiExpr('π').ok && parsePiExpr('π').value).toEqual(
      piExpr(1, true),
    );
    expect(parsePiExpr('3/2π').ok && parsePiExpr('3/2π').value).toEqual({
      coeff: frac(3, 2),
      hasPi: true,
    });
  });

  it('rejects bare decimals for pi products', () => {
    // plain rational still ok
    expect(parsePiExpr('6').ok).toBe(true);
    expect(parsePiExpr('6').value?.hasPi).toBe(false);
  });

  it('formats', () => {
    expect(formatPiExpr(piExpr(6))).toBe('6π');
    expect(formatPiExpr(piExpr(1))).toBe('π');
    expect(eqPi(piExpr(2), piExpr(2))).toBe(true);
  });
});
