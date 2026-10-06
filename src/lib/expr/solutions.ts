import { type Frac, parseRational, formatFrac, cmp, eq } from '../math/frac';

/**
 * Parsing helpers for multi-valued answers: solution sets, points, and
 * inequalities. All values exact over ℚ.
 */

/** Parse "x = 2, −3" / "{2, -3}" / "x=2 or x=-3" / "2;-3" → sorted unique Frac[]. */
export function parseSolutionSet(input: string): Frac[] | null {
  let s = input
    .trim()
    .replace(/−/g, '-')
    .replace(/[{}\[\]()]/g, ' ')
    .replace(/\b(or|and)\b/gi, ',')
    .replace(/[a-z]\s*=/gi, ',')
    .replace(/;/g, ',');
  const parts = s
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  const out: Frac[] = [];
  for (const p of parts) {
    // "±3" shorthand
    const pm = p.match(/^±\s*(.+)$/) ?? p.match(/^\+\/-\s*(.+)$/);
    if (pm) {
      const r = parseRational(pm[1]!);
      if (!r.ok) return null;
      out.push(r.value, { n: -r.value.n, d: r.value.d });
      continue;
    }
    const r = parseRational(p);
    if (!r.ok) return null;
    out.push(r.value);
  }
  return dedupeSorted(out);
}

export function dedupeSorted(values: Frac[]): Frac[] {
  const sorted = [...values].sort(cmp);
  const out: Frac[] = [];
  for (const v of sorted) {
    if (out.length === 0 || !eq(out[out.length - 1]!, v)) out.push(v);
  }
  return out;
}

export function solutionSetsEqual(a: Frac[], b: Frac[]): boolean {
  const sa = dedupeSorted(a);
  const sb = dedupeSorted(b);
  return sa.length === sb.length && sa.every((v, i) => eq(v, sb[i]!));
}

export function formatSolutionSet(values: Frac[], variable = 'x'): string {
  const sorted = dedupeSorted(values);
  if (sorted.length === 1) return `${variable} = ${formatFrac(sorted[0]!)}`;
  return `${variable} = ${sorted.map((v) => formatFrac(v)).join(', ')}`;
}

/** Parse "(h, k)" or "h, k" → [h, k]. */
export function parsePoint(input: string): [Frac, Frac] | null {
  const s = input.trim().replace(/−/g, '-').replace(/^\(/, '').replace(/\)$/, '');
  const parts = s.split(/[,;]/).map((p) => p.trim());
  if (parts.length !== 2) return null;
  const a = parseRational(parts[0]!);
  const b = parseRational(parts[1]!);
  if (!a.ok || !b.ok) return null;
  return [a.value, b.value];
}

export function formatPoint(p: readonly [Frac, Frac]): string {
  return `(${formatFrac(p[0])}, ${formatFrac(p[1])})`;
}

export type IneqOp = '<' | '<=' | '>' | '>=';

export type Inequality = { variable: string; op: IneqOp; bound: Frac };

const FLIP: Record<IneqOp, IneqOp> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

export function flipIneq(op: IneqOp): IneqOp {
  return FLIP[op];
}

/** Parse "x < 3", "x≥-2", "3 > x" (reversed is normalised to variable-first). */
export function parseInequality(input: string): Inequality | null {
  const s = input
    .trim()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/=</g, '<=')
    .replace(/=>/g, '>=')
    .toLowerCase();
  let m = s.match(/^([a-z])(<=|>=|<|>)(.+)$/);
  if (m) {
    const r = parseRational(m[3]!);
    if (!r.ok) return null;
    return { variable: m[1]!, op: m[2] as IneqOp, bound: r.value };
  }
  m = s.match(/^(.+?)(<=|>=|<|>)([a-z])$/);
  if (m) {
    const r = parseRational(m[1]!);
    if (!r.ok) return null;
    return { variable: m[3]!, op: flipIneq(m[2] as IneqOp), bound: r.value };
  }
  return null;
}

const OP_DISPLAY: Record<IneqOp, string> = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };

export function formatInequality(q: Inequality): string {
  return `${q.variable} ${OP_DISPLAY[q.op]} ${formatFrac(q.bound)}`;
}

export function inequalitiesEqual(a: Inequality, b: Inequality): boolean {
  return a.op === b.op && eq(a.bound, b.bound);
}
