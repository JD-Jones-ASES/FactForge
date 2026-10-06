import type { RelationPack, DisplayModel } from '../engine/types';
import { fromInt, type Rng } from '../math';
import { gradeRationalAnswer, fracSlot, sup } from '../engine/grade';

/**
 * Prime factorization: N = 2³·3² (and the reverse: evaluate a prime-power
 * product). Factor answers are graded as multisets of primes, so
 * 2·2·2·3·3, 2^3*3^2, and 3²·2³ all count.
 */
export type PrimeFactorConfig = {
  max: number;
  mode: 'factor' | 'evaluate' | 'both';
};

const PRIMES = [2, 3, 5, 7, 11, 13];

export function isPrime(n: number): boolean {
  if (n < 2 || !Number.isInteger(n)) return false;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
  return true;
}

export function primeFactors(n: number): Map<number, number> {
  const out = new Map<number, number>();
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    while (m % p === 0) {
      out.set(p, (out.get(p) ?? 0) + 1);
      m /= p;
    }
  }
  if (m > 1) out.set(m, (out.get(m) ?? 0) + 1);
  return out;
}

export function formatFactorization(f: Map<number, number>): string {
  return [...f.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, k]) => (k === 1 ? String(p) : `${p}${sup(k)}`))
    .join(' · ');
}

const SUP_TO_DIGIT: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

/** Parse "2^3 * 3^2", "2·2·2·3·3", "2³×3²" → multiset of (base, exponent). */
export function parseFactorProduct(input: string): Map<number, number> | null {
  let s = input.trim().replace(/\s+/g, '');
  if (!s) return null;
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (run) => '^' + [...run].map((c) => SUP_TO_DIGIT[c]).join(''));
  s = s.replace(/[·×x*]/gi, '*').replace(/\*\*/g, '^');
  const terms = s.split('*').filter((t) => t.length > 0);
  if (terms.length === 0) return null;
  const out = new Map<number, number>();
  for (const t of terms) {
    const m = t.match(/^(\d+)(?:\^(\d+))?$/);
    if (!m) return null;
    const base = parseInt(m[1]!, 10);
    const exp = m[2] ? parseInt(m[2], 10) : 1;
    if (base < 1 || exp < 0) return null;
    out.set(base, (out.get(base) ?? 0) + exp);
  }
  return out;
}

function productOf(f: Map<number, number>): number {
  let v = 1;
  for (const [p, k] of f) v *= p ** k;
  return v;
}

export const primeFactorPack: RelationPack<PrimeFactorConfig> = {
  id: 'prime-factor',
  title: 'Prime factorization',
  blurb: 'Write 72 as 2³·3², or evaluate a prime-power product.',
  band: 'Number structure',
  slots: [
    { id: 'n', kind: 'integer', label: 'Number' },
    { id: 'factored', kind: 'expression', label: 'Factorization' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '60', label: '≤60' },
        { value: '150', label: '≤150' },
        { value: '400', label: '≤400' },
      ],
      default: '150',
    },
    {
      key: 'mode',
      label: 'Task',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'factor', label: 'Factor into primes' },
        { value: 'evaluate', label: 'Evaluate the product' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { max: 150, mode: 'both' };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'factor' || raw.mode === 'evaluate' || raw.mode === 'both'
        ? raw.mode
        : 'both';
    return { max: Math.min(1000, Math.max(20, Number(raw.max) || 150)), mode };
  },
  generate(config, rng) {
    for (let i = 0; i < 60; i++) {
      const count = rng.int(2, 5);
      let n = 1;
      for (let k = 0; k < count; k++) {
        const p = rng.pick(PRIMES.slice(0, n > 30 ? 3 : PRIMES.length));
        if (n * p > config.max) break;
        n *= p;
      }
      if (n < 4 || isPrime(n)) continue;
      const f = primeFactors(n);
      const hidden = config.mode === 'both' ? (rng.bool() ? 'factored' : 'n') : config.mode === 'factor' ? 'factored' : 'n';
      return {
        slots: {
          n: { t: 'frac', v: fromInt(n) },
          factored: { t: 'expr', v: formatFactorization(f) },
        },
        hidden,
        meta: { n, factors: [...f.entries()] },
      };
    }
    const f = primeFactors(72);
    return {
      slots: {
        n: { t: 'frac', v: fromInt(72) },
        factored: { t: 'expr', v: formatFactorization(f) },
      },
      hidden: 'factored',
      meta: { n: 72, factors: [...f.entries()] },
    };
  },
  check(instance, rawInput) {
    const n = fracSlot(instance.slots, 'n').n;
    const expected = formatFactorization(primeFactors(n));
    if (instance.hidden === 'n') {
      return gradeRationalAnswer(fromInt(n), rawInput);
    }
    const parsed = parseFactorProduct(rawInput);
    if (!parsed) {
      return {
        status: 'parse_error',
        message: 'Try forms like 2^3 * 3^2 or 2·2·2·3·3',
      };
    }
    if (productOf(parsed) !== n) {
      return { status: 'incorrect', message: `Product is not ${n}`, expectedDisplay: expected };
    }
    const nonPrime = [...parsed.keys()].find((b) => !isPrime(b));
    if (nonPrime !== undefined) {
      return {
        status: 'incorrect',
        message: `${nonPrime} is not prime — keep factoring`,
        expectedDisplay: expected,
      };
    }
    return { status: 'correct', message: 'Fully factored — correct' };
  },
  format(instance): DisplayModel {
    const n = fracSlot(instance.slots, 'n').n;
    const factored = String(instance.slots.factored!.v);
    if (instance.hidden === 'n') {
      return {
        prompt: 'Evaluate the prime-power product',
        pieces: [
          { kind: 'slot', slotId: 'factored', text: factored, hidden: false },
          { kind: 'text', text: ' = ' },
          { kind: 'slot', slotId: 'n', text: '?', hidden: true },
        ],
      };
    }
    return {
      prompt: 'Write the prime factorization',
      pieces: [
        { kind: 'slot', slotId: 'n', text: String(n), hidden: false },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'factored', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    const n = fracSlot(instance.slots, 'n').n;
    return instance.hidden === 'n' ? String(n) : formatFactorization(primeFactors(n));
  },
  inputKind(instance) {
    return instance.hidden === 'n' ? 'integer' : 'expression';
  },
};
