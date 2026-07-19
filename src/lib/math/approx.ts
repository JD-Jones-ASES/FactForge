/**
 * Approximate numeric grading for calculator-style packs (right-triangle trig).
 * Accept if |user − true| ≤ 0.05 (half a tenth).
 */

export type ApproxParse =
  | { ok: true; value: number }
  | { ok: false; message: string };

export function parseApproxNumber(input: string): ApproxParse {
  let s = input.trim().replace(/−/g, '-').replace(/,/g, '').replace(/°/g, '');
  if (!s) return { ok: false, message: 'Enter a number' };
  // allow trailing junk like "units"
  s = s.replace(/[^\d.eE+\-].*$/, '').trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, message: 'Enter a decimal number' };
  return { ok: true, value: n };
}

export function gradeApprox(
  trueValue: number,
  user: number,
  tol = 0.05,
): boolean {
  return Math.abs(user - trueValue) <= tol + 1e-12;
}

/** Display expected to 1 decimal place (UI convention). */
export function formatTenths(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r.toFixed(1);
}

/** Finer display for hints. */
export function formatThousandths(n: number): string {
  return (Math.round(n * 1000) / 1000).toFixed(3);
}
