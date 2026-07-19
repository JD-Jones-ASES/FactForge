import { type Frac, add, sub, mul, div, isZero } from './frac';

export type BinaryOp = '+' | '-' | '*' | '/';

export const OP_SYMBOLS: Record<BinaryOp, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

export const ALL_OPS: BinaryOp[] = ['+', '-', '*', '/'];

export function applyOp(op: BinaryOp, a: Frac, b: Frac): Frac {
  switch (op) {
    case '+':
      return add(a, b);
    case '-':
      return sub(a, b);
    case '*':
      return mul(a, b);
    case '/':
      if (isZero(b)) throw new Error('division by zero');
      return div(a, b);
  }
}

/** Solve for the missing operand given a ⊕ b = c. */
export function solveLeft(op: BinaryOp, right: Frac, result: Frac): Frac {
  switch (op) {
    case '+':
      return sub(result, right);
    case '-':
      return add(result, right);
    case '*':
      if (isZero(right)) throw new Error('cannot solve');
      return div(result, right);
    case '/':
      return mul(result, right);
  }
}

export function solveRight(op: BinaryOp, left: Frac, result: Frac): Frac {
  switch (op) {
    case '+':
      return sub(result, left);
    case '-':
      return sub(left, result);
    case '*':
      if (isZero(left)) throw new Error('cannot solve');
      return div(result, left);
    case '/':
      if (isZero(result)) throw new Error('cannot solve');
      return div(left, result);
  }
}

export function parseOp(input: string): BinaryOp | null {
  const s = input.trim().toLowerCase();
  if (s === '+' || s === 'plus' || s === 'add') return '+';
  if (s === '-' || s === '−' || s === 'minus' || s === 'sub') return '-';
  if (s === '*' || s === '×' || s === 'x' || s === '·' || s === 'mul' || s === 'times')
    return '*';
  if (s === '/' || s === '÷' || s === ':' || s === 'div') return '/';
  return null;
}
