import type { RelationPack, DisplayModel } from '../engine/types';
import { type Rng } from '../math';

/**
 * Discrete unit-circle values for sin/cos/tan at standard angles.
 * Answers are exact unicode strings or "Undefined".
 */
export type UnitCircleConfig = {
  functions: string[]; // sin, cos, tan
};

type Entry = {
  deg: number;
  sin: string;
  cos: string;
  tan: string; // or Undefined
};

const TABLE: Entry[] = [
  { deg: 0, sin: '0', cos: '1', tan: '0' },
  { deg: 30, sin: '1/2', cos: '√3/2', tan: '1/√3' },
  { deg: 45, sin: '√2/2', cos: '√2/2', tan: '1' },
  { deg: 60, sin: '√3/2', cos: '1/2', tan: '√3' },
  { deg: 90, sin: '1', cos: '0', tan: 'Undefined' },
  { deg: 120, sin: '√3/2', cos: '−1/2', tan: '−√3' },
  { deg: 135, sin: '√2/2', cos: '−√2/2', tan: '−1' },
  { deg: 150, sin: '1/2', cos: '−√3/2', tan: '−1/√3' },
  { deg: 180, sin: '0', cos: '−1', tan: '0' },
  { deg: 210, sin: '−1/2', cos: '−√3/2', tan: '1/√3' },
  { deg: 225, sin: '−√2/2', cos: '−√2/2', tan: '1' },
  { deg: 240, sin: '−√3/2', cos: '−1/2', tan: '√3' },
  { deg: 270, sin: '−1', cos: '0', tan: 'Undefined' },
  { deg: 300, sin: '−√3/2', cos: '1/2', tan: '−√3' },
  { deg: 315, sin: '−√2/2', cos: '√2/2', tan: '−1' },
  { deg: 330, sin: '−1/2', cos: '√3/2', tan: '−1/√3' },
  { deg: 360, sin: '0', cos: '1', tan: '0' },
];

/** Canonical choice set for chips. */
export const UNIT_CIRCLE_CHOICES = [
  '0',
  '1',
  '−1',
  '1/2',
  '−1/2',
  '√2/2',
  '−√2/2',
  '√3/2',
  '−√3/2',
  '√3',
  '−√3',
  '1/√3',
  '−1/√3',
  'Undefined',
];

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
  return [...out];
}

export const unitCirclePack: RelationPack<UnitCircleConfig> = {
  id: 'unit-circle',
  title: 'Unit circle',
  blurb: 'sin / cos / tan at standard angles — exact values or Undefined.',
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
      ],
      default: ['sin', 'cos', 'tan'],
    },
  ],
  defaultConfig() {
    return { functions: ['sin', 'cos', 'tan'] };
  },
  parseConfig(raw) {
    const allowed = ['sin', 'cos', 'tan'];
    const functions = Array.isArray(raw.functions)
      ? (raw.functions as string[]).filter((f) => allowed.includes(f))
      : ['sin', 'cos', 'tan'];
    return { functions: functions.length ? functions : ['sin'] };
  },
  generate(config, rng) {
    const fn = rng.pick(
      config.functions.length ? config.functions : (['sin'] as string[]),
    ) as 'sin' | 'cos' | 'tan';
    const row = rng.pick(TABLE);
    const val =
      fn === 'sin' ? row.sin : fn === 'cos' ? row.cos : row.tan;
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
        choices: UNIT_CIRCLE_CHOICES,
        accepted: alts(val),
      },
    };
  },
  check(instance, rawInput, _config) {
    const accepted = (instance.meta?.accepted as string[]) ?? [];
    const n = normAns(rawInput);
    if (!n) return { status: 'parse_error', message: 'Pick or enter a value' };
    // compare with normalized accepted
    const hit = accepted.some((a) => normAns(a) === n);
    if (hit) return { status: 'correct', message: 'Correct' };
    // also match without unicode minus
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
    return {
      prompt: 'Evaluate on the unit circle',
      pieces: [
        {
          kind: 'text',
          text: `${fn}(${deg}°) = `,
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
