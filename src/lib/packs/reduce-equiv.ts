import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  formatFrac,
  parseRational,
  gradeRational,
  gcd,
  eq,
  type Rng,
} from '../math';

export type ReduceEquivConfig = {
  mode: 'reduce' | 'equivalent' | 'both';
  maxDenom: number;
};

function unreducedSample(rng: Rng, maxDenom: number): { raw: Frac; displayN: number; displayD: number } {
  // Build k*a / k*b with k>1 so the shown form is unreduced
  for (let i = 0; i < 30; i++) {
    const a = rng.int(1, Math.max(2, maxDenom));
    const b = rng.int(2, maxDenom);
    if (gcd(a, b) !== 1 && rng.bool(0.5)) continue;
    const k = rng.int(2, 5);
    const displayN = a * k;
    const displayD = b * k;
    if (displayD > maxDenom * 5) continue;
    return { raw: frac(displayN, displayD), displayN, displayD };
  }
  return { raw: frac(2, 4), displayN: 2, displayD: 4 };
}

export const reduceEquivPack: RelationPack<ReduceEquivConfig> = {
  id: 'reduce-equiv',
  title: 'Reduce & equivalent',
  blurb: 'Simplify fractions, or supply any equivalent form — form can matter.',
  band: 'Fractions',
  slots: [
    { id: 'given', kind: 'rational', label: 'Given' },
    { id: 'answer', kind: 'rational', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { value: 'reduce', label: 'Reduce to lowest terms' },
        { value: 'equivalent', label: 'Any equivalent fraction' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'both',
    },
    {
      key: 'maxDenom',
      label: 'Difficulty (denom)',
      type: 'range-select',
      options: [
        { value: '8', label: 'Gentle' },
        { value: '12', label: 'Standard' },
        { value: '20', label: 'Harder' },
      ],
      default: '12',
    },
  ],
  defaultConfig() {
    return { mode: 'both', maxDenom: 12 };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'reduce' || raw.mode === 'equivalent' || raw.mode === 'both'
        ? raw.mode
        : 'both';
    return {
      mode,
      maxDenom: Math.min(30, Math.max(4, Number(raw.maxDenom) || 12)),
    };
  },
  generate(config, rng) {
    const mode =
      config.mode === 'both'
        ? rng.bool()
          ? 'reduce'
          : 'equivalent'
        : config.mode;
    const sample = unreducedSample(rng, config.maxDenom);
    return {
      slots: {
        given: {
          t: 'frac',
          v: sample.raw,
        },
        answer: { t: 'frac', v: sample.raw },
      },
      hidden: 'answer',
      meta: {
        mode,
        displayN: sample.displayN,
        displayD: sample.displayD,
      },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseRational(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };

    const expected = (instance.slots.answer as { v: Frac }).v;
    const mode = (instance.meta?.mode as string) ?? 'reduce';

    if (mode === 'reduce') {
      const status = gradeRational(expected, parsed, { requireReduced: true });
      if (status === 'correct') return { status, message: 'Fully reduced — correct' };
      if (eq(parsed.value, expected) && !parsed.reduced) {
        return {
          status: 'incorrect',
          message: `Almost — reduce fully to ${formatFrac(expected)}`,
          expectedDisplay: formatFrac(expected),
        };
      }
      return {
        status: 'incorrect',
        message: 'Not quite',
        expectedDisplay: formatFrac(expected),
      };
    }

    // equivalent: any equal value is fine; unreduced soft-hint optional
    if (!eq(parsed.value, expected)) {
      return {
        status: 'incorrect',
        message: 'Not equivalent',
        expectedDisplay: formatFrac(expected),
      };
    }
    return { status: 'correct', message: 'Equivalent — correct' };
  },
  format(instance): DisplayModel {
    const dn = instance.meta?.displayN as number | undefined;
    const dd = instance.meta?.displayD as number | undefined;
    const given =
      dn !== undefined && dd !== undefined
        ? `${dn}/${dd}`.replace(/^-/, '−')
        : formatFrac((instance.slots.given as { v: Frac }).v);
    const mode = (instance.meta?.mode as string) ?? 'reduce';
    const prompt =
      mode === 'reduce'
        ? 'Write in lowest terms'
        : 'Write any equivalent fraction';
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'given', text: given, hidden: false },
        { kind: 'text', text: '  →  ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots.answer as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
