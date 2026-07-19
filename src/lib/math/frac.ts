/**
 * Exact rational arithmetic (ℚ).
 * Fractions are always stored reduced with positive denominator.
 */

export type Frac = Readonly<{ n: number; d: number }>;

export const ZERO: Frac = Object.freeze({ n: 0, d: 1 });
export const ONE: Frac = Object.freeze({ n: 1, d: 1 });
export const NEG_ONE: Frac = Object.freeze({ n: -1, d: 1 });

export function gcd(a: number, b: number): number {
  a = Math.abs(a | 0);
  b = Math.abs(b | 0);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
}

/** Build a reduced fraction. Denominator must be non-zero. */
export function frac(n: number, d = 1): Frac {
  if (!Number.isFinite(n) || !Number.isFinite(d)) {
    throw new Error('frac: non-finite');
  }
  if (d === 0) throw new Error('frac: division by zero');
  n = Math.trunc(n);
  d = Math.trunc(d);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  if (n === 0) return ZERO;
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function fromInt(n: number): Frac {
  return frac(n, 1);
}

export function isZero(a: Frac): boolean {
  return a.n === 0;
}

export function isOne(a: Frac): boolean {
  return a.n === 1 && a.d === 1;
}

export function isInteger(a: Frac): boolean {
  return a.d === 1;
}

export function eq(a: Frac, b: Frac): boolean {
  return a.n === b.n && a.d === b.d;
}

export function neg(a: Frac): Frac {
  if (a.n === 0) return ZERO;
  return { n: -a.n, d: a.d };
}

export function abs(a: Frac): Frac {
  return a.n < 0 ? neg(a) : a;
}

export function add(a: Frac, b: Frac): Frac {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Frac, b: Frac): Frac {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Frac, b: Frac): Frac {
  return frac(a.n * b.n, a.d * b.d);
}

export function inv(a: Frac): Frac {
  if (a.n === 0) throw new Error('inv: zero');
  return frac(a.d, a.n);
}

export function div(a: Frac, b: Frac): Frac {
  return mul(a, inv(b));
}

export function cmp(a: Frac, b: Frac): number {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left === right ? 0 : left < right ? -1 : 1;
}

/** True if raw n/d equals reduced form (already reduced, d > 0). */
export function isReducedForm(n: number, d: number): boolean {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return false;
  if (d < 0) return false;
  if (n === 0) return d === 1;
  return gcd(n, d) === 1;
}

/**
 * Format for UI (unicode-friendly plain text).
 * Integers as "3"; proper/improper as "3/4" or "5/2"; negatives with leading −.
 */
export function formatFrac(a: Frac, opts?: { mixed?: boolean }): string {
  const sign = a.n < 0 ? '−' : '';
  const n = Math.abs(a.n);
  const d = a.d;
  if (d === 1) return `${sign}${n}`;
  if (opts?.mixed && n > d) {
    const whole = Math.floor(n / d);
    const rem = n % d;
    if (rem === 0) return `${sign}${whole}`;
    return `${sign}${whole} ${rem}/${d}`;
  }
  return `${sign}${n}/${d}`;
}

/**
 * Parse a rational from user text.
 * Accepts: integers, n/d, mixed "1 1/2", unicode −, optional leading +, finite decimals.
 * Returns { value, rawN, rawD, reduced } for form checks.
 */
export type ParseRationalOk = {
  ok: true;
  value: Frac;
  /** Numerator/denominator as typed (before reduction), for form hints. */
  rawN: number;
  rawD: number;
  reduced: boolean;
};

export type ParseRationalErr = { ok: false; message: string };

export type ParseRationalResult = ParseRationalOk | ParseRationalErr;

export function parseRational(input: string): ParseRationalResult {
  let s = input.trim().replace(/−/g, '-').replace(/⁄/g, '/');
  if (!s) return { ok: false, message: 'Enter a number' };

  // mixed: optional sign, whole, space, n/d
  const mixed = s.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    const whole = parseInt(mixed[2]!, 10);
    const n = parseInt(mixed[3]!, 10);
    const d = parseInt(mixed[4]!, 10);
    if (d === 0) return { ok: false, message: 'Denominator cannot be 0' };
    const rawN = sign * (whole * d + n);
    const rawD = d;
    const value = frac(rawN, rawD);
    return {
      ok: true,
      value,
      rawN,
      rawD: Math.abs(rawD),
      reduced: isReducedForm(Math.abs(rawN), Math.abs(rawD)) && rawD > 0,
    };
  }

  // fraction n/d
  const slash = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  if (slash) {
    let rawN = parseInt(slash[1]!, 10);
    let rawD = parseInt(slash[2]!, 10);
    if (rawD === 0) return { ok: false, message: 'Denominator cannot be 0' };
    if (rawD < 0) {
      rawN = -rawN;
      rawD = -rawD;
    }
    const value = frac(rawN, rawD);
    return {
      ok: true,
      value,
      rawN,
      rawD,
      reduced: isReducedForm(rawN, rawD),
    };
  }

  // integer
  const intMatch = s.match(/^([+-]?\d+)$/);
  if (intMatch) {
    const rawN = parseInt(intMatch[1]!, 10);
    return {
      ok: true,
      value: fromInt(rawN),
      rawN,
      rawD: 1,
      reduced: true,
    };
  }

  // finite decimal (limited places to stay exact in safe integers)
  const dec = s.match(/^([+-]?)(\d*)\.(\d+)$/);
  if (dec) {
    const sign = dec[1] === '-' ? -1 : 1;
    const whole = dec[2] || '0';
    const fracPart = dec[3]!;
    if (fracPart.length > 9) {
      return { ok: false, message: 'Too many decimal places' };
    }
    const rawD = 10 ** fracPart.length;
    const rawN = sign * (parseInt(whole, 10) * rawD + parseInt(fracPart, 10));
    const value = frac(rawN, rawD);
    return {
      ok: true,
      value,
      rawN,
      rawD,
      reduced: isReducedForm(rawN, rawD),
    };
  }

  return {
    ok: false,
    message: 'Use an integer, fraction (a/b), mixed (1 1/2), or decimal',
  };
}

/** Grade a rational answer with optional soft unreduced hint. */
export function gradeRational(
  expected: Frac,
  parsed: ParseRationalOk,
  opts?: { requireReduced?: boolean },
): 'correct' | 'correct_form_hint' | 'incorrect' {
  if (!eq(parsed.value, expected)) return 'incorrect';
  if (opts?.requireReduced) {
    return parsed.reduced ? 'correct' : 'incorrect';
  }
  if (!parsed.reduced) return 'correct_form_hint';
  return 'correct';
}
