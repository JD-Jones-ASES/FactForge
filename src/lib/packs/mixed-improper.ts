import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, formatFrac, parseRational, eq, type Rng } from '../math';

/**
 * Mixed number ↔ improper fraction. Form is the task, so the target form
 * is required (value-only matches get a pointed hint).
 */
export type MixedImproperConfig = {
  mode: 'to-mixed' | 'to-improper' | 'both';
  maxDenom: number;
};

function sample(rng: Rng, maxDenom: number): Frac {
  const d = rng.int(2, maxDenom);
  const whole = rng.int(1, 9);
  let part = rng.int(1, d - 1);
  // keep the fractional part reduced so the mixed form is canonical
  for (let i = 0; i < 10 && gcdSmall(part, d) !== 1; i++) part = rng.int(1, d - 1);
  if (gcdSmall(part, d) !== 1) return frac(whole * 2 + 1, 2);
  return frac(whole * d + part, d);
}

function gcdSmall(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

const MIXED_RE = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;
const IMPROPER_RE = /^([+-]?\d+)\s*\/\s*(\d+)$/;

export const mixedImproperPack: RelationPack<MixedImproperConfig> = {
  id: 'mixed-improper',
  title: 'Mixed ↔ improper',
  blurb: 'Convert 7/3 ↔ 2 1/3. The requested form is required.',
  band: 'Fractions',
  slots: [
    { id: 'given', kind: 'rational', label: 'Given' },
    { id: 'answer', kind: 'rational', label: 'Converted' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Direction',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'to-mixed', label: 'Improper → mixed' },
        { value: 'to-improper', label: 'Mixed → improper' },
      ],
      default: 'both',
    },
    {
      key: 'maxDenom',
      label: 'Max denominator',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '10', label: '≤10' },
        { value: '12', label: '≤12' },
      ],
      default: '10',
    },
  ],
  defaultConfig() {
    return { mode: 'both', maxDenom: 10 };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'to-mixed' || raw.mode === 'to-improper' || raw.mode === 'both'
        ? raw.mode
        : 'both';
    return { mode, maxDenom: Math.min(20, Math.max(2, Number(raw.maxDenom) || 10)) };
  },
  generate(config, rng) {
    const value = sample(rng, config.maxDenom);
    const mode =
      config.mode === 'both' ? (rng.bool() ? 'to-mixed' : 'to-improper') : config.mode;
    return {
      slots: {
        given: { t: 'frac', v: value },
        answer: { t: 'frac', v: value },
      },
      hidden: 'answer',
      meta: { mode },
    };
  },
  check(instance, rawInput) {
    const expected = (instance.slots.answer as { v: Frac }).v;
    const mode = String(instance.meta?.mode ?? 'to-mixed');
    const s = rawInput.trim().replace(/−/g, '-');
    const parsed = parseRational(s);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const target =
      mode === 'to-mixed' ? formatFrac(expected, { mixed: true }) : formatFrac(expected);
    if (!eq(parsed.value, expected)) {
      return { status: 'incorrect', message: 'Not the same value', expectedDisplay: target };
    }
    if (mode === 'to-mixed') {
      const m = s.match(MIXED_RE);
      if (!m) {
        return {
          status: 'incorrect',
          message: 'Right value — but write it as a mixed number (whole and part)',
          expectedDisplay: target,
        };
      }
      const part = parseInt(m[3]!, 10);
      const den = parseInt(m[4]!, 10);
      if (part >= den || gcdSmall(part, den) !== 1) {
        return {
          status: 'incorrect',
          message: 'Mixed number needs a proper, reduced fraction part',
          expectedDisplay: target,
        };
      }
      return { status: 'correct', message: 'Correct' };
    }
    const im = s.match(IMPROPER_RE);
    if (!im) {
      return {
        status: 'incorrect',
        message: 'Right value — but write it as a single fraction n/d',
        expectedDisplay: target,
      };
    }
    if (!parsed.reduced) {
      return {
        status: 'correct_form_hint',
        message: `Correct — lowest terms is ${target}`,
        expectedDisplay: target,
      };
    }
    return { status: 'correct', message: 'Correct' };
  },
  format(instance): DisplayModel {
    const v = (instance.slots.given as { v: Frac }).v;
    const mode = String(instance.meta?.mode ?? 'to-mixed');
    const given = mode === 'to-mixed' ? formatFrac(v) : formatFrac(v, { mixed: true });
    return {
      prompt: mode === 'to-mixed' ? 'Write as a mixed number' : 'Write as an improper fraction',
      pieces: [
        { kind: 'slot', slotId: 'given', text: given, hidden: false },
        { kind: 'text', text: '  →  ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    const v = (instance.slots.answer as { v: Frac }).v;
    const mode = String(instance.meta?.mode ?? 'to-mixed');
    return mode === 'to-mixed' ? formatFrac(v, { mixed: true }) : formatFrac(v);
  },
  inputKind() {
    return 'rational';
  },
};
