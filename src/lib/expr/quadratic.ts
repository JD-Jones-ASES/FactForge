/**
 * Minimal quadratic factoring support.
 * Forms: k(ax+b)(cx+d) with integer coeffs.
 */

export type LinearFactor = { coeff: number; constant: number };

export type FactoredForm = {
  leading: number;
  factors: [LinearFactor, LinearFactor];
};

export type Quadratic = { A: number; B: number; C: number };

export function expand(f: FactoredForm): Quadratic {
  const [f1, f2] = f.factors;
  const a = f.leading;
  const A = a * f1.coeff * f2.coeff;
  const B = a * (f1.coeff * f2.constant + f1.constant * f2.coeff);
  const C = a * f1.constant * f2.constant;
  return { A, B, C };
}

export function formatQuadratic(q: Quadratic): string {
  const parts: string[] = [];
  const { A, B, C } = q;

  if (A === 1) parts.push('x²');
  else if (A === -1) parts.push('−x²');
  else parts.push(`${A}x²`.replace(/^-/, '−'));

  if (B !== 0) {
    const abs = Math.abs(B);
    const term = abs === 1 ? 'x' : `${abs}x`;
    if (B > 0) parts.push(`+ ${term}`);
    else parts.push(`− ${term}`);
  }

  if (C !== 0) {
    if (C > 0) parts.push(`+ ${C}`);
    else parts.push(`− ${Math.abs(C)}`);
  }

  return parts.join(' ').replace(/^- /, '−');
}

export function formatLinear(f: LinearFactor): string {
  const { coeff, constant } = f;
  let body = '';
  if (coeff === 1) body = 'x';
  else if (coeff === -1) body = '−x';
  else body = `${coeff}x`.replace(/^-/, '−');

  if (constant === 0) return body;
  if (constant > 0) return `${body} + ${constant}`;
  return `${body} − ${Math.abs(constant)}`;
}

export function formatFactored(f: FactoredForm): string {
  const [f1, f2] = f.factors;
  const body = `(${formatLinear(f1)})(${formatLinear(f2)})`;
  if (f.leading === 1) return body;
  if (f.leading === -1) return `−${body}`;
  return `${f.leading}${body}`.replace(/^-/, '−');
}

/**
 * Parse factored form: optional leading coeff, two linear factors in parens.
 * Accepts (x+2)(x-3), 2(x+1)(3x-1), -(x-1)(x+2), (2x+1)x, etc.
 */
export function parseFactored(input: string): FactoredForm | null {
  let s = input.trim().replace(/\s+/g, '').replace(/−/g, '-').toLowerCase();
  if (!s) return null;

  let leading = 1;
  // leading coefficient or sign before first (
  const leadMatch = s.match(/^([+-]?\d*)\(/);
  if (leadMatch) {
    const raw = leadMatch[1]!;
    if (raw === '' || raw === '+') leading = 1;
    else if (raw === '-') leading = -1;
    else leading = parseInt(raw, 10);
    if (Number.isNaN(leading)) return null;
    s = s.slice(raw.length);
  } else if (s.startsWith('-')) {
    leading = -1;
    s = s.slice(1);
  }

  const factors: LinearFactor[] = [];
  // (ax+b) or (ax-b) or (x) or (ax)
  const parenRe = /\(([+-]?\d*)x([+-]\d+)?\)|(\(([+-]?\d+)\))/g;
  // Also bare trailing/leading x factors without full paren pairs handled below

  // Prefer fully parenthesized linears
  const parenFactors = [...s.matchAll(/\(([^()]*)\)/g)].map((m) => m[1]!);
  if (parenFactors.length === 0) return null;

  for (const body of parenFactors) {
    const lin = parseLinearBody(body);
    if (!lin) return null;
    factors.push(lin);
  }

  // leftover multiplier like "x" outside parens — rare; reject for simplicity if extra junk
  let stripped = s;
  for (const m of s.matchAll(/\([^()]*\)/g)) {
    stripped = stripped.replace(m[0], '');
  }
  stripped = stripped.replace(/[×*·]/g, '');
  if (stripped && stripped !== '+' && stripped !== '-') {
    // bare x or nx
    const bare = parseLinearBody(stripped);
    if (bare) factors.push(bare);
    else if (stripped !== '') return null;
  }

  if (factors.length !== 2) return null;
  return {
    leading,
    factors: [factors[0]!, factors[1]!],
  };
}

function parseLinearBody(body: string): LinearFactor | null {
  body = body.replace(/\s+/g, '');
  if (!body) return null;

  // pure constant
  if (/^[+-]?\d+$/.test(body)) {
    return { coeff: 0, constant: parseInt(body, 10) };
  }

  // ax+b, x+b, -x+b, ax, x, -x
  const m = body.match(/^([+-]?)(\d*)x(?:([+-]\d+))?$/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const coeffDigits = m[2];
  const coeff =
    coeffDigits === '' || coeffDigits === undefined
      ? sign * 1
      : sign * parseInt(coeffDigits, 10);
  const constant = m[3] ? parseInt(m[3], 10) : 0;
  if (Number.isNaN(coeff) || Number.isNaN(constant)) return null;
  return { coeff, constant };
}

export function quadsEqual(a: Quadratic, b: Quadratic): boolean {
  return a.A === b.A && a.B === b.B && a.C === b.C;
}

/**
 * Parse expanded Ax²+Bx+C forms.
 * Accepts x^2, x², 2x2, unicode minus, optional spaces, missing terms.
 */
export function parseQuadratic(input: string): Quadratic | null {
  let s = input
    .trim()
    .replace(/\s+/g, '')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/x2/gi, 'x^2')
    .toLowerCase();
  if (!s) return null;

  // Normalize: ensure leading sign for term splitting
  if (s[0] !== '+' && s[0] !== '-') s = '+' + s;

  let A = 0;
  let B = 0;
  let C = 0;
  const termRe = /([+-])([^+-]*)/g;
  let m: RegExpExecArray | null;
  let matched = false;
  while ((m = termRe.exec(s)) !== null) {
    matched = true;
    const sign = m[1] === '-' ? -1 : 1;
    const body = m[2]!;
    if (!body) return null;

    if (body.includes('x^2')) {
      const coef = body.replace('x^2', '');
      if (coef === '' || coef === '+') A = sign * 1;
      else if (coef === '-') A = sign * -1; // shouldn't happen after split
      else {
        const n = parseInt(coef, 10);
        if (Number.isNaN(n)) return null;
        A = sign * n;
      }
    } else if (body.includes('x')) {
      const coef = body.replace('x', '');
      if (coef === '' || coef === '+') B = sign * 1;
      else if (coef === '-') B = sign * -1;
      else {
        const n = parseInt(coef, 10);
        if (Number.isNaN(n)) return null;
        B = sign * n;
      }
    } else {
      const n = parseInt(body, 10);
      if (Number.isNaN(n)) return null;
      C = sign * n;
    }
  }
  if (!matched) return null;
  if (A === 0 && B === 0 && C === 0) return null;
  return { A, B, C };
}
