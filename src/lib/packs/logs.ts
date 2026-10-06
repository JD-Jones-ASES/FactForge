import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, fromInt, formatFrac } from '../math';
import { gradeRationalAnswer, fracSlot, sup } from '../engine/grade';

/**
 * Logarithms as the inverse of powers: log_b(x) = y ⇔ bʸ = x.
 * Hide y (evaluate), x (exponentiate), or b. Optional negative and
 * fractional exponents (log₂(1/8) = −3, log₄ 8 = 3/2).
 */
export type LogsConfig = {
  bases: number[];
  hideMode: 'y' | 'x' | 'b' | 'both';
  negatives: boolean;
  fractional: boolean;
};

const ALL_BASES = [2, 3, 4, 5, 10];

const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};

export function subscript(n: number | string): string {
  return [...String(n)].map((c) => SUB[c] ?? c).join('');
}

export const logsPack: RelationPack<LogsConfig> = {
  id: 'logs',
  title: 'Logarithms',
  blurb: 'log_b x = y ⇔ bʸ = x. Find the missing base, argument, or exponent.',
  band: 'Functions',
  slots: [
    { id: 'b', kind: 'integer', label: 'Base' },
    { id: 'x', kind: 'rational', label: 'Argument' },
    { id: 'y', kind: 'rational', label: 'Value' },
  ],
  configSchema: [
    {
      key: 'bases',
      label: 'Bases',
      type: 'multi-ops',
      options: ALL_BASES.map((b) => ({ value: String(b), label: String(b) })),
      default: ['2', '3', '10'],
    },
    {
      key: 'hideMode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'y', label: 'Evaluate the log' },
        { value: 'x', label: 'Argument (bʸ)' },
        { value: 'b', label: 'Base' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'y',
    },
    {
      key: 'negatives',
      label: 'Negative results (fraction arguments)',
      type: 'toggle',
      default: false,
      help: 'log₂(1/8) = −3',
    },
    {
      key: 'fractional',
      label: 'Fractional results',
      type: 'toggle',
      default: false,
      help: 'log₄ 8 = 3/2',
    },
  ],
  defaultConfig() {
    return { bases: [2, 3, 10], hideMode: 'y', negatives: false, fractional: false };
  },
  parseConfig(raw) {
    const bases = Array.isArray(raw.bases)
      ? raw.bases.map((b) => Number(b)).filter((b) => ALL_BASES.includes(b))
      : [2, 3, 10];
    const hideMode =
      raw.hideMode === 'y' || raw.hideMode === 'x' || raw.hideMode === 'b' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'y';
    return {
      bases: bases.length ? bases : [2],
      hideMode,
      negatives: Boolean(raw.negatives),
      fractional: Boolean(raw.fractional),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 60; i++) {
      const b = rng.pick(config.bases);
      const hidden: 'y' | 'x' | 'b' =
        config.hideMode === 'both' ? rng.pick(['y', 'x', 'b'] as const) : config.hideMode;
      if (config.fractional && rng.bool(0.4) && hidden !== 'b') {
        // Composite base rᵏ built from the chosen base's prime; x = rᵐ → y = m/k
        const r = b === 4 ? 2 : b;
        const k = rng.pick(r === 10 ? [2, 3] : r === 5 ? [2] : [2, 3]);
        const shownBase = r ** k;
        let m = rng.int(1, r === 10 ? 4 : 5);
        if (m % k === 0) m += 1;
        const negative = config.negatives && rng.bool(0.3);
        const y = frac(negative ? -m : m, k);
        const x = negative ? frac(1, r ** m) : fromInt(r ** m);
        if (!Number.isSafeInteger(x.n) || !Number.isSafeInteger(x.d)) continue;
        return {
          slots: {
            b: { t: 'frac', v: fromInt(shownBase) },
            x: { t: 'frac', v: x },
            y: { t: 'frac', v: y },
          },
          hidden,
          meta: { b: shownBase },
        };
      }
      const maxExp = b === 10 ? 6 : b === 2 ? 8 : b >= 5 ? 3 : 4;
      let e = rng.int(hidden === 'b' ? 2 : 0, maxExp);
      if (config.negatives && rng.bool(0.4) && e > 0) e = -e;
      if (hidden === 'b' && Math.abs(e) < 2) e = 2;
      const y = fromInt(e);
      const x = e >= 0 ? fromInt(b ** e) : frac(1, b ** -e);
      return {
        slots: {
          b: { t: 'frac', v: fromInt(b) },
          x: { t: 'frac', v: x },
          y: { t: 'frac', v: y },
        },
        hidden,
        meta: { b },
      };
    }
    return {
      slots: {
        b: { t: 'frac', v: fromInt(2) },
        x: { t: 'frac', v: fromInt(8) },
        y: { t: 'frac', v: fromInt(3) },
      },
      hidden: 'y',
      meta: { b: 2 },
    };
  },
  check(instance, rawInput) {
    return gradeRationalAnswer(fracSlot(instance.slots, instance.hidden), rawInput);
  },
  format(instance): DisplayModel {
    const b = fracSlot(instance.slots, 'b').n;
    const x = formatFrac(fracSlot(instance.slots, 'x'));
    const y = formatFrac(fracSlot(instance.slots, 'y'));
    const h = instance.hidden;
    const xText = h === 'x' ? '?' : x.includes('/') ? `(${x})` : x;
    const head = h === 'b' ? 'log₍?₎' : b === 10 ? 'log' : `log${subscript(b)}`;
    const power = y.includes('/') ? `^(${y})` : sup(y);
    const prompt =
      h === 'y'
        ? 'Evaluate the logarithm'
        : h === 'x'
          ? `Find the argument: ${b}${power} = ?`
          : `Find the base: b${power} = ${x}`;
    return {
      prompt,
      pieces: [
        { kind: 'text', text: `${head} ` },
        { kind: 'slot', slotId: 'x', text: xText, hidden: h === 'x' },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'y', text: h === 'y' ? '?' : y, hidden: h === 'y' },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac(fracSlot(instance.slots, instance.hidden));
  },
  inputKind(instance) {
    return instance.hidden === 'b' ? 'integer' : 'rational';
  },
};
