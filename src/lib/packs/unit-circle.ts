import type { RelationPack, DisplayModel } from '../engine/types';
import { type Rng } from '../math';

/**
 * Discrete unit-circle values for sin/cos/tan/sec/csc/cot at standard angles.
 * Answers are exact unicode strings or "Undefined".
 */
export type UnitCircleConfig = {
  functions: string[];
  /** degrees | radians | both */
  angleUnit: 'degrees' | 'radians' | 'both';
};

type FnKey = 'sin' | 'cos' | 'tan' | 'sec' | 'csc' | 'cot';

type Entry = {
  deg: number;
  sin: string;
  cos: string;
  tan: string;
  sec: string;
  csc: string;
  cot: string;
};

const TABLE: Entry[] = [
  {
    deg: 0,
    sin: '0',
    cos: '1',
    tan: '0',
    sec: '1',
    csc: 'Undefined',
    cot: 'Undefined',
  },
  {
    deg: 30,
    sin: '1/2',
    cos: '√3/2',
    tan: '1/√3',
    sec: '2/√3',
    csc: '2',
    cot: '√3',
  },
  {
    deg: 45,
    sin: '√2/2',
    cos: '√2/2',
    tan: '1',
    sec: '√2',
    csc: '√2',
    cot: '1',
  },
  {
    deg: 60,
    sin: '√3/2',
    cos: '1/2',
    tan: '√3',
    sec: '2',
    csc: '2/√3',
    cot: '1/√3',
  },
  {
    deg: 90,
    sin: '1',
    cos: '0',
    tan: 'Undefined',
    sec: 'Undefined',
    csc: '1',
    cot: '0',
  },
  {
    deg: 120,
    sin: '√3/2',
    cos: '−1/2',
    tan: '−√3',
    sec: '−2',
    csc: '2/√3',
    cot: '−1/√3',
  },
  {
    deg: 135,
    sin: '√2/2',
    cos: '−√2/2',
    tan: '−1',
    sec: '−√2',
    csc: '√2',
    cot: '−1',
  },
  {
    deg: 150,
    sin: '1/2',
    cos: '−√3/2',
    tan: '−1/√3',
    sec: '−2/√3',
    csc: '2',
    cot: '−√3',
  },
  {
    deg: 180,
    sin: '0',
    cos: '−1',
    tan: '0',
    sec: '−1',
    csc: 'Undefined',
    cot: 'Undefined',
  },
  {
    deg: 210,
    sin: '−1/2',
    cos: '−√3/2',
    tan: '1/√3',
    sec: '−2/√3',
    csc: '−2',
    cot: '√3',
  },
  {
    deg: 225,
    sin: '−√2/2',
    cos: '−√2/2',
    tan: '1',
    sec: '−√2',
    csc: '−√2',
    cot: '1',
  },
  {
    deg: 240,
    sin: '−√3/2',
    cos: '−1/2',
    tan: '√3',
    sec: '−2',
    csc: '−2/√3',
    cot: '1/√3',
  },
  {
    deg: 270,
    sin: '−1',
    cos: '0',
    tan: 'Undefined',
    sec: 'Undefined',
    csc: '−1',
    cot: '0',
  },
  {
    deg: 300,
    sin: '−√3/2',
    cos: '1/2',
    tan: '−√3',
    sec: '2',
    csc: '−2/√3',
    cot: '−1/√3',
  },
  {
    deg: 315,
    sin: '−√2/2',
    cos: '√2/2',
    tan: '−1',
    sec: '√2',
    csc: '−√2',
    cot: '−1',
  },
  {
    deg: 330,
    sin: '−1/2',
    cos: '√3/2',
    tan: '−1/√3',
    sec: '2/√3',
    csc: '−2',
    cot: '−√3',
  },
  {
    deg: 360,
    sin: '0',
    cos: '1',
    tan: '0',
    sec: '1',
    csc: 'Undefined',
    cot: 'Undefined',
  },
];

const RAD_LABEL: Record<number, string> = {
  0: '0',
  30: 'π/6',
  45: 'π/4',
  60: 'π/3',
  90: 'π/2',
  120: '2π/3',
  135: '3π/4',
  150: '5π/6',
  180: 'π',
  210: '7π/6',
  225: '5π/4',
  240: '4π/3',
  270: '3π/2',
  300: '5π/3',
  315: '7π/4',
  330: '11π/6',
  360: '2π',
};

/** Canonical choice set for chips (covers primary + reciprocal functions). */
export const UNIT_CIRCLE_CHOICES = [
  '0',
  '1',
  '−1',
  '2',
  '−2',
  '1/2',
  '−1/2',
  '√2',
  '−√2',
  '√2/2',
  '−√2/2',
  '√3',
  '−√3',
  '√3/2',
  '−√3/2',
  '1/√3',
  '−1/√3',
  '2/√3',
  '−2/√3',
  'Undefined',
];

const ALL_FNS: FnKey[] = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'];

function normAns(s: string): string {
  return s
    .trim()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/sqrt/gi, '√')
    .replace(/infinity|inf/gi, 'Undefined')
    .replace(/undefined/gi, 'Undefined')
    .replace(/-/g, '−'); // display minus
}

function alts(canonical: string): string[] {
  const n = normAns(canonical);
  const out = new Set<string>([n, canonical]);
  // √3/3 = 1/√3
  if (n === '1/√3' || n === '√3/3') {
    out.add('1/√3');
    out.add('√3/3');
  }
  if (n === '−1/√3' || n === '−√3/3') {
    out.add('−1/√3');
    out.add('−√3/3');
  }
  // 2√3/3 = 2/√3
  if (n === '2/√3' || n === '2√3/3') {
    out.add('2/√3');
    out.add('2√3/3');
  }
  if (n === '−2/√3' || n === '−2√3/3') {
    out.add('−2/√3');
    out.add('−2√3/3');
  }
  return [...out];
}

function valueOf(row: Entry, fn: FnKey): string {
  return row[fn];
}

function angleDisplay(deg: number, unit: 'degrees' | 'radians'): string {
  if (unit === 'radians') return RAD_LABEL[deg] ?? `${deg}°`;
  return `${deg}°`;
}

export const unitCirclePack: RelationPack<UnitCircleConfig> = {
  id: 'unit-circle',
  title: 'Unit circle',
  blurb:
    'sin / cos / tan / sec / csc / cot at standard angles — exact values or Undefined.',
  band: 'Trig',
  slots: [
    { id: 'fn', kind: 'choice', label: 'Function' },
    { id: 'deg', kind: 'integer', label: 'Degrees' },
    { id: 'val', kind: 'choice', label: 'Value' },
  ],
  configSchema: [
    {
      key: 'functions',
      label: 'Functions',
      type: 'multi-ops',
      options: [
        { value: 'sin', label: 'sin' },
        { value: 'cos', label: 'cos' },
        { value: 'tan', label: 'tan' },
        { value: 'sec', label: 'sec' },
        { value: 'csc', label: 'csc' },
        { value: 'cot', label: 'cot' },
      ],
      default: ['sin', 'cos', 'tan'],
    },
    {
      key: 'angleUnit',
      label: 'Angle unit',
      type: 'select',
      options: [
        { value: 'degrees', label: 'Degrees' },
        { value: 'radians', label: 'Radians' },
        { value: 'both', label: 'Mix ° / rad' },
      ],
      default: 'degrees',
    },
  ],
  defaultConfig() {
    return { functions: ['sin', 'cos', 'tan'], angleUnit: 'degrees' };
  },
  parseConfig(raw) {
    const allowed = ALL_FNS as string[];
    const functions = Array.isArray(raw.functions)
      ? (raw.functions as string[]).filter((f) => allowed.includes(f))
      : ['sin', 'cos', 'tan'];
    const angleUnit =
      raw.angleUnit === 'radians' ||
      raw.angleUnit === 'both' ||
      raw.angleUnit === 'degrees'
        ? raw.angleUnit
        : 'degrees';
    return {
      functions: functions.length ? functions : ['sin'],
      angleUnit,
    };
  },
  generate(config, rng) {
    const fn = rng.pick(
      config.functions.length ? config.functions : (['sin'] as string[]),
    ) as FnKey;
    const row = rng.pick(TABLE);
    const val = valueOf(row, fn);
    const unit: 'degrees' | 'radians' =
      config.angleUnit === 'both'
        ? rng.bool()
          ? 'degrees'
          : 'radians'
        : config.angleUnit === 'radians'
          ? 'radians'
          : 'degrees';
    return {
      slots: {
        fn: { t: 'choice', v: fn },
        deg: { t: 'int', v: row.deg },
        val: { t: 'choice', v: val },
      },
      hidden: 'val',
      meta: {
        fn,
        deg: row.deg,
        val,
        unit,
        angleLabel: angleDisplay(row.deg, unit),
        choices: UNIT_CIRCLE_CHOICES,
        accepted: alts(val),
      },
    };
  },
  check(instance, rawInput, _config) {
    const accepted = (instance.meta?.accepted as string[]) ?? [];
    const n = normAns(rawInput);
    if (!n) return { status: 'parse_error', message: 'Pick or enter a value' };
    const hit = accepted.some((a) => normAns(a) === n);
    if (hit) return { status: 'correct', message: 'Correct' };
    const n2 = n.replace(/−/g, '-');
    if (accepted.some((a) => normAns(a).replace(/−/g, '-') === n2)) {
      return { status: 'correct', message: 'Correct' };
    }
    return {
      status: 'incorrect',
      message: 'Not the unit-circle value',
      expectedDisplay: String(instance.meta?.val ?? ''),
    };
  },
  format(instance): DisplayModel {
    const fn = String(instance.meta?.fn ?? 'sin');
    const deg = Number(instance.meta?.deg ?? 0);
    const angleLabel = String(
      instance.meta?.angleLabel ?? angleDisplay(deg, 'degrees'),
    );
    return {
      prompt: 'Evaluate on the unit circle',
      pieces: [
        {
          kind: 'text',
          text: `${fn}(${angleLabel}) = `,
        },
        { kind: 'slot', slotId: 'val', text: '?', hidden: true },
      ],
      figure: {
        kind: 'unit-circle',
        deg,
        fn,
      },
    };
  },
  expectedDisplay(instance) {
    return String(instance.meta?.val ?? '');
  },
  inputKind() {
    return 'choice';
  },
  answerChoices() {
    return UNIT_CIRCLE_CHOICES.map((v) => ({ value: v, label: v }));
  },
};
