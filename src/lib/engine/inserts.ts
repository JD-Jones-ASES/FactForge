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
const CARET: InsertToken = { label: '^', insert: '^', title: 'Exponent' };
const DOT: InsertToken = { label: '·', insert: '·', title: 'Times' };
const COMMA: InsertToken = { label: ',', insert: ', ', title: 'Separator' };
const EQ: InsertToken = { label: 'x=', insert: 'x = ', title: 'x equals' };
const LT: InsertToken = { label: '<', insert: '<', title: 'Less than' };
const GT: InsertToken = { label: '>', insert: '>', title: 'Greater than' };
const LE: InsertToken = { label: '≤', insert: '≤', title: 'Less or equal' };
const GE: InsertToken = { label: '≥', insert: '≥', title: 'Greater or equal' };
const PCT: InsertToken = { label: '%', insert: '%', title: 'Percent' };
const E10: InsertToken = { label: '×10^', insert: ' × 10^', title: 'Times ten to the' };

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
  supplementary: [DEG],
  'exterior-angle': [DEG],
  'linear-system': [SLASH, MINUS],
  'right-trig': [SLASH, MINUS, DEG],
  'unit-circle': [SQRT, SLASH, MINUS, PI],
  pythagorean: [MINUS],
  // Arithmetic / number
  'order-ops': [MINUS, SLASH],
  'decimal-ops': [MINUS],
  'mixed-improper': [SLASH, MINUS],
  'frac-dec-pct': [SLASH, PCT, MINUS],
  'prime-factor': [CARET, DOT, LPAREN, RPAREN],
  'exponent-laws': [CARET, SLASH, MINUS],
  'sci-notation': [E10, MINUS],
  'percent-change': [PCT, MINUS, SLASH],
  // Algebra
  'linear-ineq': [X, LT, GT, LE, GE, SLASH, MINUS],
  'abs-value': [EQ, COMMA, SLASH, MINUS],
  'slope-intercepts': [SLASH, MINUS, LPAREN, RPAREN, COMMA],
  'simplify-radical': [SQRT, SLASH, MINUS],
  'solve-quad': [EQ, COMMA, SLASH, MINUS],
  vertex: [LPAREN, RPAREN, COMMA, X, X2, PLUS, MINUS, SLASH],
  // Functions
  'func-eval': [SLASH, MINUS],
  'avg-rate': [SLASH, MINUS],
  logs: [SLASH, MINUS],
  sequences: [SLASH, MINUS],
  // Geometry
  'polygon-angles': [DEG, SLASH],
  'area-perimeter': [SLASH, MINUS],
  volume: [PI, SLASH],
  'arc-sector': [PI, SLASH, DEG],
  'distance-midpoint': [SQRT, LPAREN, RPAREN, COMMA, SLASH, MINUS],
  // Trig
  'special-right': [SQRT, SLASH, MINUS],
  'deg-rad': [PI, SLASH, DEG, MINUS],
  'ref-angle': [PI, SLASH, DEG, MINUS],
  'trig-identity': [SLASH, MINUS],
  // Data
  'data-stats': [SLASH, MINUS],
  counting: [],
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
