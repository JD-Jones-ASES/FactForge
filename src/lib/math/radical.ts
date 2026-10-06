import { type Frac, frac, fromInt, eq, formatFrac, parseRational, mul } from './frac';

/**
 * Exact radical values of the form coef · √rad with coef ∈ ℚ and rad a
 * positive integer. Canonical form keeps rad square-free (rad = 1 means
 * the value is rational).
 */
export type Radical = Readonly<{ coef: Frac; rad: number }>;

/** Pull every perfect-square factor out of the radicand. */
export function simplifyRadical(coef: Frac, rad: number): Radical {
  if (!Number.isInteger(rad) || rad < 0) throw new Error('radical: bad radicand');
  if (rad === 0 || coef.n === 0) return { coef: fromInt(0), rad: 1 };
  let outside = 1;
  let inside = rad;
  for (let p = 2; p * p <= inside; p++) {
    while (inside % (p * p) === 0) {
      inside /= p * p;
      outside *= p;
    }
  }
  return { coef: mul(coef, fromInt(outside)), rad: inside };
}

/** Simplified √n. */
export function sqrtRadical(n: number): Radical {
  return simplifyRadical(fromInt(1), n);
}

export function radicalIsRational(r: Radical): boolean {
  return r.rad === 1 || r.coef.n === 0;
}

export function eqRadical(a: Radical, b: Radical): boolean {
  const sa = simplifyRadical(a.coef, a.rad);
  const sb = simplifyRadical(b.coef, b.rad);
  return eq(sa.coef, sb.coef) && (sa.coef.n === 0 || sa.rad === sb.rad);
}

export function radicalToNumber(r: Radical): number {
  return (r.coef.n / r.coef.d) * Math.sqrt(r.rad);
}

/**
 * Format as "5√3", "√3/2", "5√3/2", "−2√5", or a plain fraction when rational.
 */
export function formatRadical(r: Radical): string {
  const s = simplifyRadical(r.coef, r.rad);
  if (radicalIsRational(s)) return formatFrac(s.coef);
  const sign = s.coef.n < 0 ? '−' : '';
  const n = Math.abs(s.coef.n);
  const d = s.coef.d;
  const head = n === 1 ? `√${s.rad}` : `${n}√${s.rad}`;
  return d === 1 ? `${sign}${head}` : `${sign}${head}/${d}`;
}

export type ParseRadicalResult =
  | { ok: true; value: Radical; /** radicand as typed had no square factor */ simplified: boolean }
  | { ok: false; message: string };

/**
 * Parse "a√b", "a√b/c", "√b", "a*sqrt(b)/c", "(a√b)/c", or a plain rational.
 */
export function parseRadical(input: string): ParseRadicalResult {
  let s = input
    .trim()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/sqrt/gi, '√')
    .replace(/[·×*]/g, '')
    .replace(/√\((\d+)\)/g, '√$1');
  if (!s) return { ok: false, message: 'Enter a value (use √ for roots)' };

  // strip one layer of parens around numerator: (5√3)/2
  s = s.replace(/^\(([^()]*)\)(\/\d+)?$/, '$1$2');
  // strip parens around the whole denominator
  s = s.replace(/\/\((\d+)\)$/, '/$1');

  if (!s.includes('√')) {
    const r = parseRational(s);
    if (!r.ok) return r;
    return { ok: true, value: { coef: r.value, rad: 1 }, simplified: true };
  }

  const m = s.match(/^([+-]?)(\d+)?(?:\/(\d+))?√(\d+)(?:\/(\d+))?$/);
  if (!m) {
    return {
      ok: false,
      message: 'Use forms like 5√3, √2/2, or 3√5/2',
    };
  }
  const sign = m[1] === '-' ? -1 : 1;
  const a = m[2] ? parseInt(m[2], 10) : 1;
  const preDen = m[3] ? parseInt(m[3], 10) : 1;
  const rad = parseInt(m[4]!, 10);
  const postDen = m[5] ? parseInt(m[5], 10) : 1;
  if (preDen === 0 || postDen === 0) {
    return { ok: false, message: 'Denominator cannot be 0' };
  }
  if (rad === 0) {
    return { ok: true, value: { coef: fromInt(0), rad: 1 }, simplified: true };
  }
  const coef = frac(sign * a, preDen * postDen);
  const simplifiedRad = sqrtRadical(rad).rad;
  return {
    ok: true,
    value: simplifyRadical(coef, rad),
    simplified: simplifiedRad === rad,
  };
}
