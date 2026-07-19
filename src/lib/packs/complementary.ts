import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  gradeRational,
  type Rng,
} from '../math';
import { parseAngleInput } from '../math/angle';

/** A + B = 90° (complementary). */
export type ComplementaryConfig = {
  minAngle: number;
};

export const complementaryPack: RelationPack<ComplementaryConfig> = {
  id: 'complementary',
  title: 'Complementary angles',
  blurb: 'Two angles that sum to 90°. Find the missing measure.',
  band: 'Geometry',
  slots: [
    { id: 'a', kind: 'integer', label: 'A' },
    { id: 'b', kind: 'integer', label: 'B' },
  ],
  configSchema: [
    {
      key: 'minAngle',
      label: 'Smallest angle ≥',
      type: 'range-select',
      options: [
        { value: '15', label: '15°' },
        { value: '20', label: '20°' },
        { value: '25', label: '25°' },
      ],
      default: '20',
    },
  ],
  defaultConfig() {
    return { minAngle: 20 };
  },
  parseConfig(raw) {
    return {
      minAngle: Math.min(40, Math.max(10, Number(raw.minAngle) || 20)),
    };
  },
  generate(config, rng) {
    const min = config.minAngle;
    const a = rng.int(min, 90 - min);
    const b = 90 - a;
    const hidden = rng.bool() ? 'a' : 'b';
    return {
      slots: {
        a: { t: 'frac', v: fromInt(a) },
        b: { t: 'frac', v: fromInt(b) },
      },
      hidden,
      meta: { a, b },
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
    return {
      status: 'incorrect',
      message: 'Not quite — complementary angles sum to 90°',
      expectedDisplay: `${formatFrac(expected)}°`,
    };
  },
  format(instance): DisplayModel {
    const a = (instance.slots.a as { v: Frac }).v.n;
    const b = (instance.slots.b as { v: Frac }).v.n;
    const h = instance.hidden;
    return {
      prompt: 'Find the missing angle',
      pieces: [
        {
          kind: 'text',
          text: `${h === 'a' ? '?' : a}° + ${h === 'b' ? '?' : b}° = 90°`,
        },
      ],
      figure: {
        kind: 'complementary',
        aLabel: h === 'a' ? '?' : String(a),
        bLabel: h === 'b' ? '?' : String(b),
        aDeg: a,
        bDeg: b,
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
