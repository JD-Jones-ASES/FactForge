import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, fromInt, type PiExpr, formatPiExpr, parsePiExpr, eqPi } from '../math';
import { gradeRationalAnswer } from '../engine/grade';

/**
 * Angles in standard position: quadrant, reference angle, and coterminal angles.
 * Degrees are exact integers; radians are exact multiples of π.
 */
export type RefAngleConfig = {
  tasks: Task[];
  unit: 'degrees' | 'radians' | 'both';
  /** Include angles outside [0, 360) (negative or > 1 turn). */
  beyondOneTurn: boolean;
};

type Task = 'quadrant' | 'reference' | 'coterminal';
const ALL_TASKS: Task[] = ['quadrant', 'reference', 'coterminal'];

/** Non-axis unit-circle angles (axis angles have no quadrant). */
const SPECIAL = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];

function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function quadrantOf(deg: number): 1 | 2 | 3 | 4 | null {
  const d = mod360(deg);
  if (d % 90 === 0) return null;
  return (Math.floor(d / 90) + 1) as 1 | 2 | 3 | 4;
}

export function referenceAngle(deg: number): number {
  const d = mod360(deg);
  if (d <= 90) return d;
  if (d <= 180) return 180 - d;
  if (d <= 270) return d - 180;
  return 360 - d;
}

function rad(deg: number): PiExpr {
  return { coeff: frac(deg, 180), hasPi: true };
}

function angleStr(deg: number, unit: 'degrees' | 'radians'): string {
  if (unit === 'degrees') return `${deg < 0 ? '−' : ''}${Math.abs(deg)}°`;
  return formatPiExpr(rad(deg));
}

const ROMAN = ['I', 'II', 'III', 'IV'];

export const refAnglePack: RelationPack<RefAngleConfig> = {
  id: 'ref-angle',
  title: 'Reference & coterminal angles',
  blurb: 'Quadrant, reference angle, and coterminal angle in [0°, 360°) — degrees or radians.',
  band: 'Trig',
  slots: [
    { id: 'angle', kind: 'expression', label: 'Angle' },
    { id: 'answer', kind: 'expression', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'tasks',
      label: 'Find',
      type: 'multi-ops',
      options: [
        { value: 'quadrant', label: 'Quadrant' },
        { value: 'reference', label: 'Reference angle' },
        { value: 'coterminal', label: 'Coterminal in [0, 360°)' },
      ],
      default: ALL_TASKS,
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
    { key: 'beyondOneTurn', label: 'Angles beyond one turn / negative', type: 'toggle', default: true },
  ],
  defaultConfig() {
    return { tasks: ALL_TASKS, unit: 'degrees', beyondOneTurn: true };
  },
  parseConfig(raw) {
    const tasks = Array.isArray(raw.tasks)
      ? (raw.tasks.filter((t) => ALL_TASKS.includes(t as Task)) as Task[])
      : ALL_TASKS;
    const unit = raw.unit === 'degrees' || raw.unit === 'radians' || raw.unit === 'both' ? raw.unit : 'degrees';
    return { tasks: tasks.length ? tasks : ALL_TASKS, unit, beyondOneTurn: raw.beyondOneTurn !== false };
  },
  generate(config, rng) {
    const task = rng.pick(config.tasks);
    const unit = config.unit === 'both' ? (rng.bool() ? 'degrees' : 'radians') : config.unit;
    const base = rng.pick(SPECIAL);
    let deg = base;
    // Coterminal questions only make sense off the base turn.
    if (task === 'coterminal' || (config.beyondOneTurn && rng.bool())) {
      const turns = rng.pick([-2, -1, 1, 2]);
      deg = base + 360 * turns;
    }
    const q = quadrantOf(deg)!;
    const ref = referenceAngle(deg);
    const cot = mod360(deg);
    const answer =
      task === 'quadrant' ? ROMAN[q - 1]! : task === 'reference' ? angleStr(ref, unit) : angleStr(cot, unit);
    return {
      slots: {
        angle: { t: 'expr', v: angleStr(deg, unit) },
        answer: { t: 'expr', v: answer },
      },
      hidden: 'answer',
      meta: { task, unit, deg, q, ref, cot },
    };
  },
  check(instance, rawInput) {
    const task = String(instance.meta?.task);
    const unit = String(instance.meta?.unit);
    const q = Number(instance.meta?.q);
    if (task === 'quadrant') {
      const s = rawInput.trim().toUpperCase().replace(/^Q(UADRANT)?\s*/, '');
      const idx = ROMAN.indexOf(s) >= 0 ? ROMAN.indexOf(s) + 1 : /^[1-4]$/.test(s) ? Number(s) : 0;
      if (!idx) return { status: 'parse_error', message: 'Enter a quadrant: I, II, III, IV (or 1–4)' };
      if (idx === q) return { status: 'correct', message: 'Correct' };
      return { status: 'incorrect', message: 'Not that quadrant', expectedDisplay: ROMAN[q - 1]! };
    }
    const targetDeg = Number(task === 'reference' ? instance.meta?.ref : instance.meta?.cot);
    if (unit === 'degrees') {
      return gradeRationalAnswer(fromInt(targetDeg), rawInput, {
        suffix: '°',
        wrongMessage:
          task === 'reference'
            ? 'Reference angle is the acute angle to the x-axis'
            : 'Add or subtract 360° until the angle is in [0°, 360°)',
      });
    }
    const parsed = parsePiExpr(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = rad(targetDeg);
    if (eqPi(parsed.value, expected)) return { status: 'correct', message: 'Correct' };
    return {
      status: 'incorrect',
      message:
        task === 'reference'
          ? 'Reference angle is the acute angle to the x-axis'
          : 'Add or subtract 2π until the angle is in [0, 2π)',
      expectedDisplay: formatPiExpr(expected),
    };
  },
  format(instance): DisplayModel {
    const task = String(instance.meta?.task);
    const unit = String(instance.meta?.unit);
    const deg = Number(instance.meta?.deg);
    const angle = String(instance.slots.angle.v);
    const prompt =
      task === 'quadrant'
        ? 'Which quadrant does the terminal side lie in?'
        : task === 'reference'
          ? 'Find the reference angle'
          : `Find the coterminal angle in ${unit === 'degrees' ? '[0°, 360°)' : '[0, 2π)'}`;
    const label = task === 'quadrant' ? 'Quadrant ' : task === 'reference' ? "θ' = " : 'θ ≡ ';
    const model: DisplayModel = {
      prompt,
      pieces: [
        { kind: 'text', text: `θ = ${angle};   ${label}` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
    // The drawn terminal side would give away the quadrant, so only show it for the other tasks.
    if (task !== 'quadrant') {
      model.figure = {
        kind: 'unit-circle',
        deg: mod360(deg),
        fn: 'θ',
        label: angle,
        caption: `θ = ${angle} in standard position`,
      };
    }
    return model;
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer.v);
  },
  inputKind() {
    return 'expression';
  },
};
