import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, formatFrac } from '../math';
import { gradeRationalAnswer, leadTerm, signedTerm } from '../engine/grade';
import { parsePoint } from '../expr/solutions';

/**
 * Slope from two points; slope and intercepts of a line in standard form
 * Ax + By = C. All answers exact rationals.
 */
export type SlopeInterceptsConfig = {
  max: number;
  mode: 'slope-points' | 'slope-standard' | 'x-int' | 'y-int' | 'both';
};

type Mode = Exclude<SlopeInterceptsConfig['mode'], 'both'>;
const MODES: Mode[] = ['slope-points', 'slope-standard', 'x-int', 'y-int'];

export const slopeInterceptsPack: RelationPack<SlopeInterceptsConfig> = {
  id: 'slope-intercepts',
  title: 'Slope & intercepts',
  blurb: 'Slope from two points, or slope / x-intercept / y-intercept of Ax + By = C.',
  band: 'Algebra',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'rational', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '9', label: '≤9' },
        { value: '12', label: '≤12' },
      ],
      default: '9',
    },
    {
      key: 'mode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'slope-points', label: 'Slope from two points' },
        { value: 'slope-standard', label: 'Slope of Ax + By = C' },
        { value: 'x-int', label: 'x-intercept of Ax + By = C' },
        { value: 'y-int', label: 'y-intercept of Ax + By = C' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { max: 9, mode: 'both' };
  },
  parseConfig(raw) {
    const mode = MODES.includes(raw.mode as Mode) || raw.mode === 'both' ? (raw.mode as Mode | 'both') : 'both';
    return { max: Math.min(20, Math.max(3, Number(raw.max) || 9)), mode };
  },
  generate(config, rng) {
    const M = config.max;
    const mode: Mode = config.mode === 'both' ? rng.pick(MODES) : config.mode;
    const nz = () => {
      let n = 0;
      while (n === 0) n = rng.int(-M, M);
      return n;
    };

    if (mode === 'slope-points') {
      const x1 = rng.int(-M, M);
      const y1 = rng.int(-M, M);
      let x2 = rng.int(-M, M);
      if (x2 === x1) x2 = x1 + rng.pick([-1, 1, 2]);
      const y2 = rng.int(-M, M);
      const m = frac(y2 - y1, x2 - x1);
      return {
        slots: {
          given: { t: 'expr', v: `(${x1}, ${y1}) and (${x2}, ${y2})` },
          answer: { t: 'frac', v: m },
        },
        hidden: 'answer',
        meta: { mode, x1, y1, x2, y2 },
      };
    }

    const A = nz();
    const B = nz();
    const C = rng.int(-M, M);
    const given = `${leadTerm(A, 'x')}${signedTerm(B, 'y')} = ${C}`;
    let answer: Frac;
    if (mode === 'slope-standard') answer = frac(-A, B);
    else if (mode === 'x-int') answer = frac(C, A);
    else answer = frac(C, B);
    return {
      slots: {
        given: { t: 'expr', v: given },
        answer: { t: 'frac', v: answer },
      },
      hidden: 'answer',
      meta: { mode, A, B, C },
    };
  },
  check(instance, rawInput) {
    const expected = (instance.slots.answer as { v: Frac }).v;
    const mode = String(instance.meta?.mode);
    // intercepts may be given as points
    const pt = parsePoint(rawInput);
    if (pt && (mode === 'x-int' || mode === 'y-int')) {
      const [px, py] = pt;
      const coord = mode === 'x-int' ? px : py;
      const other = mode === 'x-int' ? py : px;
      if (other.n !== 0) {
        return {
          status: 'incorrect',
          message: mode === 'x-int' ? 'An x-intercept has y = 0' : 'A y-intercept has x = 0',
          expectedDisplay: formatFrac(expected),
        };
      }
      return gradeRationalAnswer(expected, formatFrac(coord).replace(/−/g, '-'));
    }
    return gradeRationalAnswer(expected, rawInput);
  },
  format(instance): DisplayModel {
    const mode = String(instance.meta?.mode);
    const prompt =
      mode === 'slope-points'
        ? 'Find the slope of the line through the points'
        : mode === 'slope-standard'
          ? 'Find the slope of the line'
          : mode === 'x-int'
            ? 'Find the x-intercept (where y = 0)'
            : 'Find the y-intercept (where x = 0)';
    const label = mode === 'x-int' ? 'x-int' : mode === 'y-int' ? 'y-int' : 'm';
    const given = String(instance.slots.given!.v);
    const figure =
      mode === 'slope-points'
        ? undefined
        : {
            kind: 'line-2d' as const,
            lines: [
              {
                m: -Number(instance.meta?.A) / Number(instance.meta?.B),
                b: Number(instance.meta?.C) / Number(instance.meta?.B),
              },
            ],
            xMin: -10,
            xMax: 10,
            yMin: -10,
            yMax: 10,
          };
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'given', text: given, hidden: false },
        { kind: 'text', text: `;   ${label} = ` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure,
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots.answer as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
