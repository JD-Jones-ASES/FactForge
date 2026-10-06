import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  fromInt,
  type Radical,
  sqrtRadical,
  parseRadical,
  formatRadical,
  eqRadical,
} from '../math';
import { parsePoint, formatPoint } from '../expr/solutions';

/**
 * Coordinate geometry: distance (exact simplified radical), midpoint,
 * or the missing endpoint given a midpoint.
 */
export type DistanceMidpointConfig = {
  mode: 'distance' | 'midpoint' | 'endpoint' | 'both';
  max: number;
  triplesOnly: boolean;
};

const TRIPLES: [number, number][] = [
  [3, 4],
  [4, 3],
  [6, 8],
  [8, 6],
  [5, 12],
  [12, 5],
  [9, 12],
  [8, 15],
];

export const distanceMidpointPack: RelationPack<DistanceMidpointConfig> = {
  id: 'distance-midpoint',
  title: 'Distance & midpoint',
  blurb: 'Between two points: exact distance (5, 2√5, √13), midpoint, or the missing endpoint.',
  band: 'Geometry',
  slots: [
    { id: 'points', kind: 'expression', label: 'Points' },
    { id: 'answer', kind: 'expression', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'distance', label: 'Distance' },
        { value: 'midpoint', label: 'Midpoint' },
        { value: 'endpoint', label: 'Other endpoint from midpoint' },
      ],
      default: 'both',
    },
    {
      key: 'max',
      label: 'Coordinate size',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '9', label: '≤9' },
        { value: '12', label: '≤12' },
      ],
      default: '9',
    },
    {
      key: 'triplesOnly',
      label: 'Whole-number distances only',
      type: 'toggle',
      default: false,
      help: 'Uses Pythagorean triples (3-4-5, 5-12-13…).',
    },
  ],
  defaultConfig() {
    return { mode: 'both', max: 9, triplesOnly: false };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'distance' || raw.mode === 'midpoint' || raw.mode === 'endpoint' || raw.mode === 'both'
        ? raw.mode
        : 'both';
    return { mode, max: Math.min(20, Math.max(3, Number(raw.max) || 9)), triplesOnly: Boolean(raw.triplesOnly) };
  },
  generate(config, rng) {
    const M = config.max;
    const mode = config.mode === 'both' ? rng.pick(['distance', 'midpoint', 'endpoint'] as const) : config.mode;
    const x1 = rng.int(-M, M);
    const y1 = rng.int(-M, M);
    let dx: number;
    let dy: number;
    if (mode === 'distance' && config.triplesOnly) {
      const t = rng.pick(TRIPLES.filter(([a, b]) => a <= 2 * M && b <= 2 * M));
      dx = t[0] * (rng.bool() ? 1 : -1);
      dy = t[1] * (rng.bool() ? 1 : -1);
    } else {
      dx = rng.int(-M, M);
      dy = rng.int(-M, M);
      if (dx === 0 && dy === 0) dx = 3;
      // midpoint questions: even deltas keep integer midpoints half the time
      if (mode !== 'distance' && rng.bool(0.5)) {
        dx -= dx % 2;
        dy -= dy % 2;
        if (dx === 0 && dy === 0) dx = 2;
      }
    }
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const dist = sqrtRadical(dx * dx + dy * dy);
    const mid: [Frac, Frac] = [frac(x1 + x2, 2), frac(y1 + y2, 2)];
    let points: string;
    let answer: string;
    if (mode === 'distance') {
      points = `(${x1}, ${y1}) and (${x2}, ${y2})`;
      answer = formatRadical(dist);
    } else if (mode === 'midpoint') {
      points = `(${x1}, ${y1}) and (${x2}, ${y2})`;
      answer = formatPoint(mid);
    } else {
      points = `endpoint (${x1}, ${y1}), midpoint ${formatPoint(mid)}`;
      answer = `(${x2}, ${y2})`;
    }
    return {
      slots: {
        points: { t: 'expr', v: points },
        answer: { t: 'expr', v: answer },
      },
      hidden: 'answer',
      meta: { mode, x1, y1, x2, y2, dist, mid },
    };
  },
  check(instance, rawInput) {
    const mode = String(instance.meta?.mode);
    if (mode === 'distance') {
      const expected = instance.meta?.dist as Radical;
      const parsed = parseRadical(rawInput);
      if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
      const target = formatRadical(expected);
      if (!eqRadical(parsed.value, expected)) {
        return { status: 'incorrect', message: 'Not quite — d = √((Δx)² + (Δy)²)', expectedDisplay: target };
      }
      if (!parsed.simplified) {
        return { status: 'correct_form_hint', message: `Correct — simplified form is ${target}`, expectedDisplay: target };
      }
      return { status: 'correct', message: 'Correct' };
    }
    const expected: [Frac, Frac] =
      mode === 'midpoint'
        ? (instance.meta?.mid as [Frac, Frac])
        : [fromInt(Number(instance.meta?.x2)), fromInt(Number(instance.meta?.y2))];
    const pt = parsePoint(rawInput);
    if (!pt) return { status: 'parse_error', message: 'Write a point like (3, −2)' };
    const ok = pt[0].n === expected[0].n && pt[0].d === expected[0].d && pt[1].n === expected[1].n && pt[1].d === expected[1].d;
    if (ok) return { status: 'correct', message: 'Correct' };
    const swapped = pt[0].n === expected[1].n && pt[0].d === expected[1].d && pt[1].n === expected[0].n && pt[1].d === expected[0].d;
    return {
      status: 'incorrect',
      message: swapped ? 'Coordinates are swapped — (x, y)' : mode === 'midpoint' ? 'Average the x’s and the y’s' : 'The midpoint is the average: solve for the other endpoint',
      expectedDisplay: formatPoint(expected),
    };
  },
  format(instance): DisplayModel {
    const mode = String(instance.meta?.mode);
    const x1 = Number(instance.meta?.x1);
    const y1 = Number(instance.meta?.y1);
    const x2 = Number(instance.meta?.x2);
    const y2 = Number(instance.meta?.y2);
    const mid = instance.meta?.mid as [Frac, Frac];
    const prompt =
      mode === 'distance'
        ? 'Find the exact distance between the points'
        : mode === 'midpoint'
          ? 'Find the midpoint'
          : 'Find the other endpoint';
    const label = mode === 'distance' ? 'd = ' : mode === 'midpoint' ? 'M = ' : 'B = ';
    const span = Math.max(8, Math.abs(x1) + 1, Math.abs(x2) + 1, Math.abs(y1) + 1, Math.abs(y2) + 1);
    const points =
      mode === 'endpoint'
        ? [
            { x: x1, y: y1, label: 'A' },
            { x: mid[0].n / mid[0].d, y: mid[1].n / mid[1].d, label: 'M' },
          ]
        : [
            { x: x1, y: y1, label: 'A' },
            { x: x2, y: y2, label: 'B' },
          ];
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'points', text: String(instance.slots.points!.v), hidden: false },
        { kind: 'text', text: `    ${label}` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure: {
        kind: 'line-2d',
        lines: [],
        points,
        xMin: -span,
        xMax: span,
        yMin: -span,
        yMax: span,
      },
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer!.v);
  },
  inputKind() {
    return 'expression';
  },
};
