import type { SlotKind } from './types';

export type InsertToken = {
  /** Button label (unicode OK). */
  label: string;
  /** Text inserted at the caret. */
  insert: string;
  title?: string;
};

const PI: InsertToken = { label: 'π', insert: 'π', title: 'Pi' };
const SQRT: InsertToken = { label: '√', insert: '√', title: 'Square root' };
const CBRT: InsertToken = { label: '∛', insert: '∛', title: 'Cube root' };
const SLASH: InsertToken = { label: '/', insert: '/', title: 'Fraction bar' };
const LPAREN: InsertToken = { label: '(', insert: '(', title: 'Open paren' };
const RPAREN: InsertToken = { label: ')', insert: ')', title: 'Close paren' };
const PLUS: InsertToken = { label: '+', insert: '+', title: 'Plus' };
const MINUS: InsertToken = { label: '−', insert: '-', title: 'Minus' };
const DEG: InsertToken = { label: '°', insert: '°', title: 'Degree' };
const YEQ: InsertToken = { label: 'y=', insert: 'y=', title: 'y equals' };
const X: InsertToken = { label: 'x', insert: 'x', title: 'x' };
const X2: InsertToken = { label: 'x²', insert: 'x^2', title: 'x squared' };

/** Pack-specific insert rows (shown first, then kind defaults). */
const PACK_INSERTS: Record<string, InsertToken[]> = {
  circles: [PI, SLASH, LPAREN, RPAREN],
  rationalize: [SQRT, CBRT, SLASH, LPAREN, RPAREN, PLUS, MINUS],
  roots: [SQRT, CBRT, SLASH, LPAREN, RPAREN],
  'linear-write': [YEQ, X, SLASH, PLUS, MINUS, LPAREN, RPAREN],
  'linear-one': [SLASH, PLUS, MINUS, X],
  'factor-quad': [X, LPAREN, RPAREN, PLUS, MINUS],
  'expand-quad': [X, X2, LPAREN, RPAREN, PLUS, MINUS],
  powers: [SLASH, PLUS, MINUS],
  transversal: [DEG],
  'triangle-sum': [DEG],
  'linear-pair': [DEG],
  'vertical-angles': [DEG],
  complementary: [DEG],
  'exterior-angle': [DEG],
  'linear-system': [SLASH, MINUS],
  'right-trig': [SLASH, MINUS, DEG],
  'unit-circle': [SQRT, SLASH, MINUS],
};

function kindDefaults(kind: SlotKind): InsertToken[] {
  switch (kind) {
    case 'expression':
      return [PI, SQRT, CBRT, SLASH, LPAREN, RPAREN, PLUS, MINUS, YEQ, X];
    case 'rational':
      return [SLASH, MINUS, PI, SQRT];
    case 'integer':
      return [MINUS, DEG];
    case 'operator':
      return [
        PLUS,
        MINUS,
        { label: '×', insert: '*', title: 'Times' },
        SLASH,
      ];
    case 'choice':
      return [];
    default:
      return [];
  }
}

/**
 * Build insert toolbar for the current pack + answer kind.
 */
export function insertsFor(packId: string, kind: SlotKind): InsertToken[] {
  const pack = PACK_INSERTS[packId] ?? [];
  const base = kindDefaults(kind);
  const seen = new Set<string>();
  const out: InsertToken[] = [];
  for (const t of [...pack, ...base]) {
    const key = `${t.insert}|${t.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Insert `token` into `value` at selection [start, end]. */
export function applyInsert(
  value: string,
  start: number,
  end: number,
  token: string,
): { value: string; caret: number } {
  const next = value.slice(0, start) + token + value.slice(end);
  return { value: next, caret: start + token.length };
}
