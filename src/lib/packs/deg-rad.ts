import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, fromInt, type PiExpr, formatPiExpr, parsePiExpr, eqPi, mul } from '../math';
import { gradeRationalAnswer } from '../engine/grade';

/**
 * Convert between degrees and exact radian measure (multiples of π).
 *   degrees → radians:  θ · π/180
 *   radians → degrees:  θ · 180/π
 */
export type DegRadConfig = {
  direction: 'to-rad' | 'to-deg' | 'both';
  /** Which angle set to draw from. */
  angles: 'special' | 'multiples15' | 'any';
  allowNegative: boolean;
};

const SPECIAL = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];

function radiansFor(deg: number): PiExpr {
  return { coeff: frac(deg, 180), hasPi: true };
}

export const degRadPack: RelationPack<DegRadConfig> = {
  id: 'deg-rad',
  title: 'Degrees ↔ radians',
  blurb: 'Convert between degrees and exact radian measure (π/6, 5π/4, …).',
  band: 'Trig',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given angle' },
    { id: 'answer', kind: 'expression', label: 'Converted angle' },
  ],
  configSchema: [
    {
      key: 'direction',
      label: 'Direction',
      type: 'select',
      options: [
        { value: 'to-rad', label: 'Degrees → radians' },
        { value: 'to-deg', label: 'Radians → degrees' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'both',
    },
    {
      key: 'angles',
      label: 'Angles',
      type: 'select',
      options: [
        { value: 'special', label: 'Unit-circle angles' },
        { value: 'multiples15', label: 'Multiples of 15°' },
        { value: 'any', label: 'Any multiple of 5°' },
      ],
      default: 'special',
    },
    { key: 'allowNegative', label: 'Negative angles', type: 'toggle', default: false },
  ],
  defaultConfig() {
    return { direction: 'both', angles: 'special', allowNegative: false };
  },
  parseConfig(raw) {
    const direction =
      raw.direction === 'to-rad' || raw.direction === 'to-deg' || raw.direction === 'both' ? raw.direction : 'both';
    const angles =
      raw.angles === 'special' || raw.angles === 'multiples15' || raw.angles === 'any' ? raw.angles : 'special';
    return { direction, angles, allowNegative: raw.allowNegative === true };
  },
  generate(config, rng) {
    const direction = config.direction === 'both' ? (rng.bool() ? 'to-rad' : 'to-deg') : config.direction;
    let deg: number;
    if (config.angles === 'special') deg = rng.pick(SPECIAL);
    else if (config.angles === 'multiples15') deg = 15 * rng.int(0, 24);
    else deg = 5 * rng.int(0, 72);
    if (config.allowNegative && deg !== 0 && rng.bool()) deg = -deg;
    const rad = radiansFor(deg);
    const degStr = `${deg < 0 ? '−' : ''}${Math.abs(deg)}°`;
    const radStr = formatPiExpr(rad);
    return {
      slots: {
        given: { t: 'expr', v: direction === 'to-rad' ? degStr : radStr },
        answer: { t: 'expr', v: direction === 'to-rad' ? radStr : degStr },
      },
      hidden: 'answer',
      meta: { direction, deg, rad },
    };
  },
  check(instance, rawInput) {
    const direction = String(instance.meta?.direction);
    const deg = Number(instance.meta?.deg);
    if (direction === 'to-deg') {
      return gradeRationalAnswer(fromInt(deg), rawInput, {
        suffix: '°',
        wrongMessage: 'Multiply the radian measure by 180/π',
      });
    }
    const expected = instance.meta?.rad as PiExpr;
    const parsed = parsePiExpr(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    if (eqPi(parsed.value, expected)) return { status: 'correct', message: 'Correct' };
    const target = formatPiExpr(expected);
    if (!parsed.value.hasPi) {
      return { status: 'incorrect', message: 'Radian measure here is a multiple of π — include π', expectedDisplay: target };
    }
    // Common slip: multiplied by 180/π instead of π/180.
    const inverted: PiExpr = { coeff: mul(fromInt(deg), frac(180, 1)), hasPi: true };
    if (eqPi(parsed.value, inverted)) {
      return { status: 'incorrect', message: 'Multiply by π/180, not 180/π', expectedDisplay: target };
    }
    return { status: 'incorrect', message: 'Not quite — multiply degrees by π/180', expectedDisplay: target };
  },
  format(instance): DisplayModel {
    const direction = String(instance.meta?.direction);
    const given = String(instance.slots.given.v);
    return {
      prompt: direction === 'to-rad' ? 'Convert to radians (exact, in terms of π)' : 'Convert to degrees',
      pieces: [
        { kind: 'text', text: `${given} = ` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
        { kind: 'text', text: direction === 'to-rad' ? ' rad' : '' },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer.v);
  },
  inputKind() {
    return 'expression';
  },
};
