import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, type PiExpr, formatPiExpr, parsePiExpr, eqPi } from '../math';

/**
 * Inverse trig of special values, respecting principal ranges:
 *   arcsin, arctan → [−90°, 90°]      arccos → [0°, 180°]
 * Answers are discrete angles (chips) in degrees or exact radians.
 */
export type InverseTrigConfig = {
  functions: InvFn[];
  unit: 'degrees' | 'radians' | 'both';
  /** Include negative inputs (answers outside Quadrant I). */
  negatives: boolean;
};

type InvFn = 'arcsin' | 'arccos' | 'arctan';
const ALL_FNS: InvFn[] = ['arcsin', 'arccos', 'arctan'];

/** Quadrant-I special values; each row is the value at `deg`. */
const Q1: { deg: number; sin: string; cos: string; tan: string }[] = [
  { deg: 0, sin: '0', cos: '1', tan: '0' },
  { deg: 30, sin: '1/2', cos: '√3/2', tan: '√3/3' },
  { deg: 45, sin: '√2/2', cos: '√2/2', tan: '1' },
  { deg: 60, sin: '√3/2', cos: '1/2', tan: '√3' },
  { deg: 90, sin: '1', cos: '0', tan: 'Undefined' },
];

/** Degrees in each principal range that come up as answers. */
const RANGE_DEG: Record<InvFn, number[]> = {
  arcsin: [-90, -60, -45, -30, 0, 30, 45, 60, 90],
  arccos: [0, 30, 45, 60, 90, 120, 135, 150, 180],
  arctan: [-60, -45, -30, 0, 30, 45, 60],
};

function radStr(deg: number): string {
  return formatPiExpr({ coeff: frac(deg, 180), hasPi: true });
}

function angleStr(deg: number, unit: 'degrees' | 'radians'): string {
  if (unit === 'degrees') return `${deg < 0 ? '−' : ''}${Math.abs(deg)}°`;
  return radStr(deg);
}

function refAngle(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d;
}

function normDeg(s: string): number | null {
  const t = s.trim().replace(/−/g, '-').replace(/°/g, '').replace(/\s+/g, '');
  if (!/^[+-]?\d+$/.test(t)) return null;
  return parseInt(t, 10);
}

export const inverseTrigPack: RelationPack<InverseTrigConfig> = {
  id: 'inverse-trig',
  title: 'Inverse trig',
  blurb: 'arcsin, arccos, arctan of special values — principal range, degrees or radians.',
  band: 'Trig',
  slots: [
    { id: 'given', kind: 'expression', label: 'Value' },
    { id: 'answer', kind: 'choice', label: 'Angle' },
  ],
  configSchema: [
    {
      key: 'functions',
      label: 'Functions',
      type: 'multi-ops',
      options: [
        { value: 'arcsin', label: 'arcsin (sin⁻¹)' },
        { value: 'arccos', label: 'arccos (cos⁻¹)' },
        { value: 'arctan', label: 'arctan (tan⁻¹)' },
      ],
      default: ALL_FNS,
    },
    {
      key: 'unit',
      label: 'Angle unit',
      type: 'select',
      options: [
        { value: 'degrees', label: 'Degrees' },
        { value: 'radians', label: 'Radians' },
        { value: 'both', label: 'Mix ° / rad' },
      ],
      default: 'degrees',
    },
    { key: 'negatives', label: 'Negative inputs (principal-range signs)', type: 'toggle', default: true },
  ],
  defaultConfig() {
    return { functions: ALL_FNS, unit: 'degrees', negatives: true };
  },
  parseConfig(raw) {
    const functions = Array.isArray(raw.functions)
      ? (raw.functions.filter((f) => ALL_FNS.includes(f as InvFn)) as InvFn[])
      : ALL_FNS;
    const unit = raw.unit === 'degrees' || raw.unit === 'radians' || raw.unit === 'both' ? raw.unit : 'degrees';
    return { functions: functions.length ? functions : ALL_FNS, unit, negatives: raw.negatives !== false };
  },
  generate(config, rng) {
    const fn = rng.pick(config.functions);
    const unit = config.unit === 'both' ? (rng.bool() ? 'degrees' : 'radians') : config.unit;
    const key = fn === 'arcsin' ? 'sin' : fn === 'arccos' ? 'cos' : 'tan';
    const rows = Q1.filter((r) => r[key] !== 'Undefined');
    const row = rng.pick(rows);
    let value = row[key];
    let deg = row.deg;
    const negatable = value !== '0';
    if (config.negatives && negatable && rng.bool()) {
      value = `−${value}`;
      // arcsin/arctan are odd; arccos(−v) = 180° − arccos(v).
      deg = fn === 'arccos' ? 180 - deg : -deg;
    }
    const answer = angleStr(deg, unit);
    return {
      slots: {
        given: { t: 'expr', v: `${fn}(${value})` },
        answer: { t: 'choice', v: answer },
      },
      hidden: 'answer',
      meta: { fn, unit, value, deg },
    };
  },
  check(instance, rawInput) {
    const fn = instance.meta?.fn as InvFn;
    const unit = String(instance.meta?.unit);
    const deg = Number(instance.meta?.deg);
    const target = angleStr(deg, unit as 'degrees' | 'radians');
    const rangeNote =
      fn === 'arccos' ? 'arccos returns angles in [0°, 180°]' : `${fn} returns angles in [−90°, 90°]`;

    let inputDeg: number | null = null;
    if (unit === 'degrees') {
      inputDeg = normDeg(rawInput);
      if (inputDeg === null) return { status: 'parse_error', message: 'Enter an angle in degrees, e.g. −30°' };
    } else {
      const parsed = parsePiExpr(rawInput);
      if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
      const expected: PiExpr = { coeff: frac(deg, 180), hasPi: true };
      if (eqPi(parsed.value, expected)) return { status: 'correct', message: 'Correct' };
      if (parsed.value.hasPi) {
        inputDeg = (parsed.value.coeff.n * 180) / parsed.value.coeff.d;
      } else if (parsed.value.coeff.n === 0) {
        inputDeg = 0;
      }
    }
    if (inputDeg === deg) return { status: 'correct', message: 'Correct' };
    if (inputDeg !== null && refAngle(inputDeg) === refAngle(deg)) {
      return { status: 'incorrect', message: `Right reference angle, but ${rangeNote}`, expectedDisplay: target };
    }
    return { status: 'incorrect', message: `Not quite — ${rangeNote}`, expectedDisplay: target };
  },
  format(instance): DisplayModel {
    const given = String(instance.slots.given.v);
    const unit = String(instance.meta?.unit);
    return {
      prompt: `Evaluate (principal value, in ${unit})`,
      pieces: [
        { kind: 'text', text: `${given} = ` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer.v);
  },
  inputKind() {
    return 'choice';
  },
  answerChoices(instance) {
    const fn = instance.meta?.fn as InvFn;
    const unit = instance.meta?.unit as 'degrees' | 'radians';
    return RANGE_DEG[fn].map((d) => {
      const s = angleStr(d, unit);
      return { value: s, label: s };
    });
  },
};
