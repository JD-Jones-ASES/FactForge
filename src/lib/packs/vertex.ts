import type { RelationPack, DisplayModel } from '../engine/types';
import { fromInt, formatFrac } from '../math';
import { formatQuadratic, parseQuadratic, quadsEqual, type Quadratic } from '../expr/quadratic';
import { parsePoint, formatPoint } from '../expr/solutions';
import { gradeRationalAnswer, leadTerm, signedTerm } from '../engine/grade';

/**
 * Parabolas: vertex, axis of symmetry, y-intercept from y = ax² + bx + c,
 * and expanding vertex form a(x − h)² + k back to standard form.
 * Generated from integer (h, k) so every answer is exact.
 */
export type VertexConfig = {
  mode: Mode | 'both';
  leading: 'one' | 'any';
};

type Mode = 'vertex' | 'axis' | 'y-int' | 'to-standard';
const MODES: Mode[] = ['vertex', 'axis', 'y-int', 'to-standard'];

function vertexFormText(a: number, h: number, k: number): string {
  const inner = h === 0 ? 'x' : `x${signedTerm(-h)}`;
  const sq = h === 0 ? 'x²' : `(${inner})²`;
  const lead = a === 1 ? sq : a === -1 ? `−${sq}` : `${leadTerm(a)}${sq}`;
  return `y = ${lead}${signedTerm(k)}`;
}

export const vertexPack: RelationPack<VertexConfig> = {
  id: 'vertex',
  title: 'Parabola vertex',
  blurb: 'Vertex, axis of symmetry, y-intercept — or expand a(x − h)² + k.',
  band: 'Functions',
  slots: [
    { id: 'given', kind: 'expression', label: 'Equation' },
    { id: 'answer', kind: 'expression', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'vertex', label: 'Vertex (h, k)' },
        { value: 'axis', label: 'Axis of symmetry' },
        { value: 'y-int', label: 'y-intercept' },
        { value: 'to-standard', label: 'Vertex form → standard form' },
      ],
      default: 'both',
    },
    {
      key: 'leading',
      label: 'Leading coefficient',
      type: 'select',
      options: [
        { value: 'one', label: '±1' },
        { value: 'any', label: '±1, ±2, ±3' },
      ],
      default: 'one',
    },
  ],
  defaultConfig() {
    return { mode: 'both', leading: 'one' };
  },
  parseConfig(raw) {
    const mode = MODES.includes(raw.mode as Mode) || raw.mode === 'both' ? (raw.mode as Mode | 'both') : 'both';
    return { mode, leading: raw.leading === 'any' ? 'any' : 'one' };
  },
  generate(config, rng) {
    const mode: Mode = config.mode === 'both' ? rng.pick(MODES) : config.mode;
    const a = config.leading === 'any' ? rng.pick([1, -1, 2, -2, 3, -3]) : rng.pick([1, -1]);
    const h = rng.int(-5, 5);
    const k = rng.int(-8, 8);
    const q: Quadratic = { A: a, B: -2 * a * h, C: a * h * h + k };
    const standard = `y = ${formatQuadratic(q)}`;
    const given = mode === 'to-standard' ? vertexFormText(a, h, k) : standard;
    let answer: string;
    if (mode === 'vertex') answer = formatPoint([fromInt(h), fromInt(k)]);
    else if (mode === 'axis') answer = `x = ${formatFrac(fromInt(h))}`;
    else if (mode === 'y-int') answer = formatFrac(fromInt(q.C));
    else answer = formatQuadratic(q);
    return {
      slots: {
        given: { t: 'expr', v: given },
        answer: { t: 'expr', v: answer },
      },
      hidden: 'answer',
      meta: { mode, a, h, k, q },
    };
  },
  check(instance, rawInput) {
    const mode = instance.meta?.mode as Mode;
    const h = Number(instance.meta?.h);
    const k = Number(instance.meta?.k);
    const q = instance.meta?.q as Quadratic;
    if (mode === 'vertex') {
      const pt = parsePoint(rawInput);
      if (!pt) return { status: 'parse_error', message: 'Write the vertex as (h, k)' };
      const ok = pt[0].d === 1 && pt[1].d === 1 && pt[0].n === h && pt[1].n === k;
      if (ok) return { status: 'correct', message: 'Correct' };
      const hOnly = pt[0].d === 1 && pt[0].n === h;
      return {
        status: 'incorrect',
        message: hOnly ? 'h is right — evaluate y at x = h for k' : 'Not quite — h = −b / 2a',
        expectedDisplay: formatPoint([fromInt(h), fromInt(k)]),
      };
    }
    if (mode === 'axis') {
      const s = rawInput.replace(/^\s*x\s*=\s*/i, '');
      const res = gradeRationalAnswer(fromInt(h), s);
      if (res.status === 'incorrect') return { ...res, expectedDisplay: `x = ${h}` };
      return res;
    }
    if (mode === 'y-int') {
      const pt = parsePoint(rawInput);
      if (pt) {
        if (pt[0].n !== 0) {
          return { status: 'incorrect', message: 'The y-intercept has x = 0', expectedDisplay: String(q.C) };
        }
        return gradeRationalAnswer(fromInt(q.C), formatFrac(pt[1]).replace(/−/g, '-'));
      }
      return gradeRationalAnswer(fromInt(q.C), rawInput);
    }
    const parsed = parseQuadratic(rawInput.replace(/^\s*y\s*=\s*/i, ''));
    if (!parsed) return { status: 'parse_error', message: 'Try forms like x² − 4x + 7 or 2x^2+3x-1' };
    if (quadsEqual(parsed, q)) return { status: 'correct', message: 'Correct expansion' };
    return { status: 'incorrect', message: 'Not the expanded form', expectedDisplay: formatQuadratic(q) };
  },
  format(instance): DisplayModel {
    const mode = instance.meta?.mode as Mode;
    const a = Number(instance.meta?.a);
    const h = Number(instance.meta?.h);
    const k = Number(instance.meta?.k);
    const prompt =
      mode === 'vertex'
        ? 'Find the vertex (h, k)'
        : mode === 'axis'
          ? 'Find the axis of symmetry'
          : mode === 'y-int'
            ? 'Find the y-intercept'
            : 'Expand to standard form y = ax² + bx + c';
    const label = mode === 'vertex' ? 'vertex = ' : mode === 'axis' ? 'axis: ' : mode === 'y-int' ? 'y-int = ' : 'y = ';
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'given', text: String(instance.slots.given!.v), hidden: false },
        { kind: 'text', text: `;   ${label}` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure: { kind: 'parabola', a, h, k, markVertex: mode !== 'vertex' && mode !== 'axis' },
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer!.v);
  },
  inputKind(instance) {
    const mode = instance.meta?.mode as Mode;
    return mode === 'y-int' ? 'rational' : 'expression';
  },
};
