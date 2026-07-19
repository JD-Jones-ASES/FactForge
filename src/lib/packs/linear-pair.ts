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
 * Adjacent angles on a straight line: L + R = 180°.
 */
export type LinearPairConfig = {
  minAngle: number;
};

function parseAngleInput(raw: string) {
  const s = raw.trim().replace(/°/g, '').replace(/\s+/g, '');
  return parseRational(s);
}

export const linearPairPack: RelationPack<LinearPairConfig> = {
  id: 'linear-pair',
  title: 'Linear pair',
  blurb: 'Adjacent angles on a line sum to 180°. Find the missing angle.',
  band: 'Geometry',
  slots: [
    { id: 'left', kind: 'integer', label: 'Left' },
    { id: 'right', kind: 'integer', label: 'Right' },
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
      default: '25',
    },
  ],
  defaultConfig() {
    return { minAngle: 25 };
  },
  parseConfig(raw) {
    return {
      minAngle: Math.min(60, Math.max(15, Number(raw.minAngle) || 25)),
    };
  },
  generate(config, rng) {
    const min = config.minAngle;
    const left = rng.int(min, 180 - min);
    const right = 180 - left;
    const hidden = rng.bool() ? 'left' : 'right';
    return {
      slots: {
        left: { t: 'frac', v: fromInt(left) },
        right: { t: 'frac', v: fromInt(right) },
      },
      hidden,
      meta: { left, right },
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
      message: 'Not quite — adjacent angles on a line sum to 180°',
      expectedDisplay: `${formatFrac(expected)}°`,
    };
  },
  format(instance): DisplayModel {
    const left = (instance.slots.left as { v: Frac }).v.n;
    const right = (instance.slots.right as { v: Frac }).v.n;
    const h = instance.hidden;
    return {
      prompt: 'Find the missing angle',
      pieces: [
        {
          kind: 'text',
          text: `${h === 'left' ? '?' : left}° + ${h === 'right' ? '?' : right}° = 180°`,
        },
      ],
      figure: {
        kind: 'linear-pair',
        leftLabel: h === 'left' ? '?' : String(left),
        rightLabel: h === 'right' ? '?' : String(right),
        leftDeg: left,
        rightDeg: right,
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
