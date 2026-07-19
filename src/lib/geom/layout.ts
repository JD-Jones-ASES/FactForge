/**
 * Geometry layout helpers — float OK for drawing only, not for grading.
 */

export type Pt = { x: number; y: number };

/** Place a triangle with given interior angles (degrees) via law of sines. */
export function triangleVertices(
  angleA: number,
  angleB: number,
  angleC: number,
): { A: Pt; B: Pt; C: Pt } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  // sides opposite A,B,C
  const a = Math.sin(toRad(angleA));
  const b = Math.sin(toRad(angleB));
  const c = Math.sin(toRad(angleC));

  // B at origin, C on +x axis, A in upper half-plane
  const B: Pt = { x: 0, y: 0 };
  const C: Pt = { x: a, y: 0 };
  // angle at B is angleB; side BA = c, BC = a
  const A: Pt = {
    x: c * Math.cos(toRad(angleB)),
    y: c * Math.sin(toRad(angleB)),
  };

  // Normalize into viewBox-friendly coords
  return normalizeTriangle(A, B, C);
}

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
  const pad = 28;
  const size = 220;
  const scale = (size - 2 * pad) / Math.max(w, h);
  const map = (p: Pt): Pt => ({
    x: pad + (p.x - minX) * scale + (size - 2 * pad - w * scale) / 2,
    y: size - pad - (p.y - minY) * scale - (size - 2 * pad - h * scale) / 2,
  });
  return { A: map(A), B: map(B), C: map(C) };
}

/** Point slightly outside the angle for a label. */
export function exteriorLabelPoint(
  vertex: Pt,
  p1: Pt,
  p2: Pt,
  dist = 22,
): Pt {
  const v1 = unit(sub(p1, vertex));
  const v2 = unit(sub(p2, vertex));
  // bisector outward: - (v1+v2) if interior is between v1,v2 for triangle
  let bx = v1.x + v2.x;
  let by = v1.y + v2.y;
  const len = Math.hypot(bx, by) || 1;
  bx /= len;
  by /= len;
  // point outside: opposite bisector of interior
  return {
    x: vertex.x - bx * dist,
    y: vertex.y - by * dist,
  };
}

function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

function unit(v: Pt): Pt {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
