/**
 * Geometry layout helpers — float OK for drawing only, not for grading.
 */

export type Pt = { x: number; y: number };

const VIEW = 240;
const LABEL_MARGIN = 18;

/** Place a triangle with given interior angles (degrees) via law of sines. */
export function triangleVertices(
  angleA: number,
  angleB: number,
  angleC: number,
): { A: Pt; B: Pt; C: Pt } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(toRad(angleA));
  const c = Math.sin(toRad(angleC));

  // B at origin, C on +x, A in upper half-plane (angle at B = angleB)
  const B: Pt = { x: 0, y: 0 };
  const C: Pt = { x: a, y: 0 };
  const A: Pt = {
    x: c * Math.cos(toRad(angleB)),
    y: c * Math.sin(toRad(angleB)),
  };

  return normalizeTriangle(A, B, C);
}

/**
 * Fit triangle into a padded box so exterior labels stay inside the SVG border.
 * pad is large enough for angle labels (~“120°”) and vertex letters.
 */
function normalizeTriangle(A: Pt, B: Pt, C: Pt): { A: Pt; B: Pt; C: Pt } {
  const pts = [A, B, C];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  // Generous padding so exterior labels do not clip the frame
  const pad = 52;
  const size = VIEW;
  const scale = (size - 2 * pad) / Math.max(w, h);
  const map = (p: Pt): Pt => ({
    x: pad + (p.x - minX) * scale + (size - 2 * pad - w * scale) / 2,
    y: size - pad - (p.y - minY) * scale - (size - 2 * pad - h * scale) / 2,
  });
  return { A: map(A), B: map(B), C: map(C) };
}

/** Point outside the angle for a measure label; clamped into the viewBox. */
export function exteriorLabelPoint(
  vertex: Pt,
  p1: Pt,
  p2: Pt,
  dist = 26,
  viewSize = VIEW,
): Pt {
  const v1 = unit(sub(p1, vertex));
  const v2 = unit(sub(p2, vertex));
  let bx = v1.x + v2.x;
  let by = v1.y + v2.y;
  const len = Math.hypot(bx, by) || 1;
  bx /= len;
  by /= len;
  const raw = {
    x: vertex.x - bx * dist,
    y: vertex.y - by * dist,
  };
  return clampPt(raw, viewSize, LABEL_MARGIN);
}

/** Vertex letter slightly outside, shorter than angle labels. */
export function vertexLetterPoint(
  vertex: Pt,
  p1: Pt,
  p2: Pt,
  dist = 14,
  viewSize = VIEW,
): Pt {
  return exteriorLabelPoint(vertex, p1, p2, dist, viewSize);
}

export function clampPt(p: Pt, size: number, margin: number): Pt {
  return {
    x: Math.min(size - margin, Math.max(margin, p.x)),
    y: Math.min(size - margin, Math.max(margin, p.y)),
  };
}

export const FIGURE_VIEW_SIZE = VIEW;

function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

function unit(v: Pt): Pt {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
