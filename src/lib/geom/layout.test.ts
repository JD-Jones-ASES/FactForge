import { describe, expect, it } from 'vitest';
import { triangleVertices } from './layout';

describe('triangleVertices', () => {
  it('returns three distinct points in viewBox range', () => {
    const { A, B, C } = triangleVertices(50, 60, 70);
    const pts = [A, B, C];
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(220);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(220);
    }
    // not collapsed
    const area =
      Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2;
    expect(area).toBeGreaterThan(100);
  });
});
