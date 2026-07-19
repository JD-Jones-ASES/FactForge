import { describe, expect, it } from 'vitest';
import { applyInsert, insertsFor } from './inserts';

describe('insertsFor', () => {
  it('gives π for circles', () => {
    const tokens = insertsFor('circles', 'expression');
    expect(tokens.some((t) => t.insert === 'π')).toBe(true);
  });

  it('gives y= and x for linear-write', () => {
    const tokens = insertsFor('linear-write', 'expression');
    expect(tokens.some((t) => t.insert === 'y=')).toBe(true);
    expect(tokens.some((t) => t.insert === 'x')).toBe(true);
    expect(tokens.some((t) => t.insert === '/')).toBe(true);
  });

  it('gives √ for rationalize', () => {
    const tokens = insertsFor('rationalize', 'expression');
    expect(tokens.some((t) => t.insert === '√')).toBe(true);
  });
});

describe('applyInsert', () => {
  it('inserts at caret', () => {
    expect(applyInsert('y=', 2, 2, '2x')).toEqual({
      value: 'y=2x',
      caret: 4,
    });
    expect(applyInsert('ab', 1, 1, 'π')).toEqual({ value: 'aπb', caret: 2 });
  });
});
