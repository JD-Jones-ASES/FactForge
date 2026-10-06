import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, type Rng } from '../math';
import { formatQuadratic, type Quadratic } from '../expr/quadratic';
import { parseSolutionSet, solutionSetsEqual, formatSolutionSet } from '../expr/solutions';
import { leadTerm, signedTerm } from '../engine/grade';

/**
 * Solve factorable quadratics: integer or rational roots, optional
 * leading coefficient, optional double root, optional non-zero right side.
 */
export type SolveQuadConfig = {
  leading: 'one' | 'any';
  roots: 'integer' | 'rational';
  doubleRoot: boolean;
  rearranged: boolean;
};

function nz(rng: Rng, max: number): number {
  let n = 0;
  while (n === 0) n = rng.int(-max, max);
  return n;
}

export const solveQuadPack: RelationPack<SolveQuadConfig> = {
  id: 'solve-quad',
  title: 'Solve quadratics',
  blurb: 'x² + bx + c = 0 → both solutions. Factor, or use the formula.',
  band: 'Algebra',
  slots: [
    { id: 'eq', kind: 'expression', label: 'Equation' },
    { id: 'answer', kind: 'expression', label: 'Solutions' },
  ],
  configSchema: [
    {
      key: 'leading',
      label: 'Leading coefficient',
      type: 'select',
      options: [
        { value: 'one', label: '1' },
        { value: 'any', label: '≠ 1 allowed' },
      ],
      default: 'one',
    },
    {
      key: 'roots',
      label: 'Solutions',
      type: 'select',
      options: [
        { value: 'integer', label: 'Integers' },
        { value: 'rational', label: 'Fractions allowed' },
      ],
      default: 'integer',
    },
    { key: 'doubleRoot', label: 'Allow repeated root', type: 'toggle', default: true },
    {
      key: 'rearranged',
      label: 'Not always = 0',
      type: 'toggle',
      default: false,
      help: 'e.g. x² + 5x = −6 — move everything to one side first.',
    },
  ],
  defaultConfig() {
    return { leading: 'one', roots: 'integer', doubleRoot: true, rearranged: false };
  },
  parseConfig(raw) {
    return {
      leading: raw.leading === 'any' ? 'any' : 'one',
      roots: raw.roots === 'rational' ? 'rational' : 'integer',
      doubleRoot: raw.doubleRoot !== false,
      rearranged: Boolean(raw.rearranged),
    };
  },
  generate(config, rng) {
    // roots p1/q1 and p2/q2 → (q1 x − p1)(q2 x − p2) · k
    const q1 = config.roots === 'rational' && rng.bool(0.6) ? rng.int(2, 4) : 1;
    const q2 = config.roots === 'rational' && rng.bool(0.4) ? rng.int(2, 4) : 1;
    let p1 = rng.int(-7, 7);
    let p2 = rng.int(-7, 7);
    if (q1 > 1 && p1 % q1 === 0) p1 += 1;
    if (q2 > 1 && p2 % q2 === 0) p2 += 1;
    let r1 = frac(p1, q1);
    let r2 = frac(p2, q2);
    const sameRoot = r1.n === r2.n && r1.d === r2.d;
    if (sameRoot && !(config.doubleRoot && rng.bool(0.5))) {
      p2 = p1 + (rng.bool() ? 1 : -1) * q2;
      r2 = frac(p2, q2);
    }
    r1 = frac(p1, q1);

    // rational roots force a leading coefficient of q1·q2 regardless of the knob
    let k = 1;
    if (config.leading === 'any' && q1 * q2 === 1) k = rng.pick([2, 3, -1, -2]);
    const A = k * q1 * q2;
    const B = k * (-(q1 * p2) - q2 * p1);
    const C = k * p1 * p2;
    const q: Quadratic = { A, B, C };

    let eq: string;
    if (config.rearranged && rng.bool(0.6) && C !== 0) {
      // move constant: Ax² + Bx = −C
      eq = `${leadTerm(A, 'x²')}${signedTerm(B, 'x')} = ${leadTerm(-C)}`;
    } else {
      eq = `${formatQuadratic(q)} = 0`;
    }
    const sols = [r1, r2];
    return {
      slots: {
        eq: { t: 'expr', v: eq },
        answer: { t: 'expr', v: formatSolutionSet(sols) },
      },
      hidden: 'answer',
      meta: { q, sols },
    };
  },
  check(instance, rawInput) {
    const sols = instance.meta?.sols as Frac[];
    const parsed = parseSolutionSet(rawInput);
    if (!parsed) {
      return { status: 'parse_error', message: 'List the solutions, e.g. x = 2, −3 (or 2, -3)' };
    }
    if (solutionSetsEqual(parsed, sols)) return { status: 'correct', message: 'Correct' };
    const expected = formatSolutionSet(sols);
    const uniq = new Set(sols.map((s) => `${s.n}/${s.d}`));
    if (parsed.length === 1 && uniq.size === 2 && sols.some((s) => s.n === parsed[0]!.n && s.d === parsed[0]!.d)) {
      return { status: 'incorrect', message: 'That is one solution — there is another', expectedDisplay: expected };
    }
    const negated = parsed.map((v) => ({ n: -v.n, d: v.d }));
    if (solutionSetsEqual(negated, sols)) {
      return { status: 'incorrect', message: 'Signs are flipped — (x − r) = 0 means x = r', expectedDisplay: expected };
    }
    return { status: 'incorrect', message: 'Not quite', expectedDisplay: expected };
  },
  format(instance): DisplayModel {
    return {
      prompt: 'Solve for x (list every solution)',
      pieces: [
        { kind: 'slot', slotId: 'eq', text: String(instance.slots.eq!.v), hidden: false },
        { kind: 'text', text: '   ⇒   ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer!.v);
  },
  inputKind() {
    return 'expression';
  },
};
