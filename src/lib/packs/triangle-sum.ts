import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  type Rng,
} from '../math';

/**
 * A + B + C = 180° (triangle angle sum). Integer degrees only.
 */
export type TriangleSumConfig = {
  minAngle: number;
  hideMode: 'any' | 'largest';
};

function parseAngleInput(raw: string) {
  const s = raw.trim().replace(/°/g, '').replace(/\s+/g, '');
  return parseRational(s);
}

export const triangleSumPack: RelationPack<TriangleSumConfig> = {
  id: 'triangle-sum',
  title: 'Triangle angles',
  blurb: 'A + B + C = 180°. Find the missing angle — with a figure.',
  band: 'Geometry',
  slots: [
    { id: 'A', kind: 'integer', label: '∠A' },
    { id: 'B', kind: 'integer', label: '∠B' },
    { id: 'C', kind: 'integer', label: '∠C' },
  ],
  configSchema: [
    {
      key: 'minAngle',
      label: 'Smallest angle ≥',
      type: 'range-select',
      options: [
        { value: '20', label: '20°' },
        { value: '30', label: '30°' },
        { value: '40', label: '40°' },
      ],
      default: '30',
    },
    {
      key: 'hideMode',
      label: 'Hide',
      type: 'select',
      options: [
        { value: 'any', label: 'Any angle' },
        { value: 'largest', label: 'Largest angle' },
      ],
      default: 'any',
    },
  ],
  defaultConfig() {
    return { minAngle: 30, hideMode: 'any' };
  },
  parseConfig(raw) {
    return {
      minAngle: Math.min(50, Math.max(15, Number(raw.minAngle) || 30)),
      hideMode: raw.hideMode === 'largest' ? 'largest' : 'any',
    };
  },
  generate(config, rng) {
    const min = config.minAngle;
    for (let i = 0; i < 60; i++) {
      const A = rng.int(min, 120);
      const B = rng.int(min, 180 - min - A);
      const C = 180 - A - B;
      if (C < min || C > 150) continue;
      // valid triangle: all positive (guaranteed)
      let hidden: 'A' | 'B' | 'C';
      if (config.hideMode === 'largest') {
        if (A >= B && A >= C) hidden = 'A';
        else if (B >= A && B >= C) hidden = 'B';
        else hidden = 'C';
      } else {
        hidden = rng.pick(['A', 'B', 'C'] as const);
      }
      return {
        slots: {
          A: { t: 'frac', v: fromInt(A) },
          B: { t: 'frac', v: fromInt(B) },
          C: { t: 'frac', v: fromInt(C) },
        },
        hidden,
        meta: { A, B, C },
      };
    }
    return {
      slots: {
        A: { t: 'frac', v: fromInt(50) },
        B: { t: 'frac', v: fromInt(60) },
        C: { t: 'frac', v: fromInt(70) },
      },
      hidden: 'C',
      meta: { A: 50, B: 60, C: 70 },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseAngleInput(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct — prefer ${formatFrac(expected)}°`,
        expectedDisplay: `${formatFrac(expected)}°`,
      };
    }
    // Accept if A+B+C still 180 with their value (unique anyway)
    return {
      status: 'incorrect',
      message: 'Not quite — angles in a triangle sum to 180°',
      expectedDisplay: `${formatFrac(expected)}°`,
    };
  },
  format(instance): DisplayModel {
    const A = (instance.slots.A as { v: Frac }).v.n;
    const B = (instance.slots.B as { v: Frac }).v.n;
    const C = (instance.slots.C as { v: Frac }).v.n;
    const h = instance.hidden;
    const lab = (id: 'A' | 'B' | 'C', v: number) =>
      h === id ? '?' : String(v);
    return {
      prompt: `Find ∠${h}`,
      pieces: [
        { kind: 'text', text: '∠A + ∠B + ∠C = 180°' },
      ],
      figure: {
        kind: 'triangle-angles',
        labels: {
          A: lab('A', A),
          B: lab('B', B),
          C: lab('C', C),
        },
        measures: { A, B, C },
      },
    };
  },
  expectedDisplay(instance) {
    return `${formatFrac((instance.slots[instance.hidden] as { v: Frac }).v)}°`;
  },
  inputKind() {
    return 'integer';
  },
};
