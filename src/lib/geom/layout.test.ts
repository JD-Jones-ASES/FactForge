import { describe, expect, it } from 'vitest';
import {
  triangleVertices,
  exteriorLabelPoint,
  FIGURE_VIEW_SIZE,
  clampPt,
} from './layout';

describe('triangleVertices', () => {
  it('returns three distinct points in viewBox range', () => {
    const { A, B, C } = triangleVertices(50, 60, 70);
    const pts = [A, B, C];
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(FIGURE_VIEW_SIZE);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(FIGURE_VIEW_SIZE);
    }
    const area =
      Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2;
    expect(area).toBeGreaterThan(100);
  });

  it('keeps exterior labels inside the frame', () => {
    const { A, B, C } = triangleVertices(30, 40, 110);
    for (const [v, p1, p2] of [
      [A, B, C],
      [B, A, C],
      [C, A, B],
    ] as const) {
      const lab = exteriorLabelPoint(v, p1, p2, 30, FIGURE_VIEW_SIZE);
      expect(lab.x).toBeGreaterThanOrEqual(14);
      expect(lab.x).toBeLessThanOrEqual(FIGURE_VIEW_SIZE - 14);
      expect(lab.y).toBeGreaterThanOrEqual(14);
      expect(lab.y).toBeLessThanOrEqual(FIGURE_VIEW_SIZE - 14);
    }
  });
});

describe('clampPt', () => {
  it('clamps to margins', () => {
    expect(clampPt({ x: -5, y: 300 }, 240, 18)).toEqual({ x: 18, y: 222 });
  });
});
