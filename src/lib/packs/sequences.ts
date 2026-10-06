import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac, add, mul, sub, div } from '../math';
import { gradeRationalAnswer } from '../engine/grade';
import { subscript } from './logs';

/**
 * Arithmetic and geometric sequences: next term, nth term, common
 * difference / ratio, or the sum of the first n terms — all exact.
 */
export type SequencesConfig = {
  kind: 'arithmetic' | 'geometric' | 'both';
  find: Find | 'both';
  fractions: boolean;
};

type Find = 'next' | 'nth' | 'common' | 'sum';
const FINDS: Find[] = ['next', 'nth', 'common', 'sum'];

function powFrac(r: Frac, n: number): Frac {
  let v = fromInt(1);
  for (let i = 0; i < n; i++) v = mul(v, r);
  return v;
}

export const sequencesPack: RelationPack<SequencesConfig> = {
  id: 'sequences',
  title: 'Sequences',
  blurb: 'Arithmetic & geometric: next term, aₙ, common difference / ratio, partial sums.',
  band: 'Functions',
  slots: [
    { id: 'terms', kind: 'expression', label: 'Terms' },
    { id: 'answer', kind: 'rational', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'kind',
      label: 'Sequence type',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'arithmetic', label: 'Arithmetic (+d)' },
        { value: 'geometric', label: 'Geometric (×r)' },
      ],
      default: 'both',
    },
    {
      key: 'find',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'next', label: 'Next term' },
        { value: 'nth', label: 'A later term aₙ' },
        { value: 'common', label: 'Common difference / ratio' },
        { value: 'sum', label: 'Sum of the first n terms' },
      ],
      default: 'both',
    },
    {
      key: 'fractions',
      label: 'Fractional ratios (×1/2, ×3/2)',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return { kind: 'both', find: 'both', fractions: false };
  },
  parseConfig(raw) {
    const kind =
      raw.kind === 'arithmetic' || raw.kind === 'geometric' || raw.kind === 'both' ? raw.kind : 'both';
    const find = FINDS.includes(raw.find as Find) || raw.find === 'both' ? (raw.find as Find | 'both') : 'both';
    return { kind, find, fractions: Boolean(raw.fractions) };
  },
  generate(config, rng) {
    const find: Find = config.find === 'both' ? rng.pick(FINDS) : config.find;
    const shown = 4;
    for (let attempt = 0; attempt < 30; attempt++) {
      const kind =
        config.kind === 'both' ? (rng.bool() ? 'arithmetic' : 'geometric') : config.kind;
      let a1: Frac;
      let step: Frac;
      if (kind === 'arithmetic') {
        a1 = fromInt(rng.int(-10, 15));
        let d = rng.int(-9, 12);
        if (d === 0) d = 3;
        step = fromInt(d);
      } else if (config.fractions && rng.bool(0.5)) {
        step = rng.pick([frac(1, 2), frac(1, 3), frac(3, 2), frac(-1, 2), frac(2, 3)]);
        a1 = fromInt(rng.pick([8, 16, 32, 64, 27, 81, 54, 48, 96]));
      } else {
        a1 = fromInt(rng.pick([1, 2, 3, 4, 5, 6, 8, 10, 16, 27, 32, 64, 81]));
        step = fromInt(rng.pick([2, 3, -2, 4, 5, -3, 10]));
      }
      const term = (n: number): Frac =>
        kind === 'arithmetic'
          ? add(a1, mul(fromInt(n - 1), step))
          : mul(a1, powFrac(step, n - 1));
      const terms: Frac[] = [];
      for (let n = 1; n <= shown; n++) terms.push(term(n));
      if (terms.some((t) => Math.abs(t.n) > 100000)) continue;

      let answer: Frac;
      let n = shown + 1;
      if (find === 'next') {
        answer = term(n);
      } else if (find === 'nth') {
        n = kind === 'arithmetic' ? rng.pick([8, 10, 12, 15, 20, 25]) : rng.pick([6, 7, 8]);
        answer = term(n);
      } else if (find === 'common') {
        answer = step;
      } else {
        n = kind === 'arithmetic' ? rng.pick([6, 8, 10, 12, 20]) : rng.pick([5, 6]);
        answer =
          kind === 'arithmetic'
            ? mul(frac(n, 2), add(a1, term(n)))
            : div(mul(a1, sub(powFrac(step, n), fromInt(1))), sub(step, fromInt(1)));
      }
      if (Math.abs(answer.n) > 1e8) continue;
      return {
        slots: {
          terms: { t: 'expr', v: `${terms.map((t) => formatFrac(t)).join(', ')}, …` },
          answer: { t: 'frac', v: answer },
        },
        hidden: 'answer',
        meta: { kind, find, n, a1, step },
      };
    }
    return {
      slots: {
        terms: { t: 'expr', v: '3, 7, 11, 15, …' },
        answer: { t: 'frac', v: fromInt(19) },
      },
      hidden: 'answer',
      meta: { kind: 'arithmetic', find: 'next', n: 5, a1: fromInt(3), step: fromInt(4) },
    };
  },
  check(instance, rawInput) {
    return gradeRationalAnswer((instance.slots.answer as { v: Frac }).v, rawInput.replace(/^\s*[a-z]\s*=\s*/i, ''));
  },
  format(instance): DisplayModel {
    const kind = String(instance.meta?.kind);
    const find = String(instance.meta?.find);
    const n = Number(instance.meta?.n);
    const label =
      find === 'next'
        ? `a${subscript(n)} = `
        : find === 'nth'
          ? `a${subscript(n)} = `
          : find === 'common'
            ? kind === 'arithmetic'
              ? 'd = '
              : 'r = '
            : `S${subscript(n)} = `;
    const prompt =
      find === 'next'
        ? `Find the next term of the ${kind} sequence`
        : find === 'nth'
          ? `Find term ${n} of the ${kind} sequence`
          : find === 'common'
            ? kind === 'arithmetic'
              ? 'Find the common difference d'
              : 'Find the common ratio r'
            : `Find the sum of the first ${n} terms`;
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'terms', text: String(instance.slots.terms!.v), hidden: false },
        { kind: 'text', text: `   ${label}` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots.answer as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
