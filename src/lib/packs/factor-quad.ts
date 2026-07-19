import type { RelationPack, DisplayModel } from '../engine/types';
import type { Rng } from '../math';
import {
  type FactoredForm,
  expand,
  formatQuadratic,
  formatFactored,
  parseFactored,
  quadsEqual,
} from '../expr/quadratic';

export type FactorQuadConfig = {
  difficulty: 'easy' | 'hard';
  commonFactor: boolean;
};

function sampleFactors(config: FactorQuadConfig, rng: Rng): FactoredForm {
  const easy = config.difficulty === 'easy';
  const b = easy ? 1 : rng.int(1, 4);
  const d = easy ? 1 : rng.int(1, 4);
  const c = rng.int(-6, 6);
  const e = rng.int(-6, 6);
  // avoid trivial (x)(x) always; allow some zeros
  const a = config.commonFactor ? rng.int(1, 4) : 1;
  // ensure not both constants zero with boring poly
  return {
    leading: a,
    factors: [
      { coeff: b, constant: c },
      { coeff: d, constant: e },
    ],
  };
}

export const factorQuadPack: RelationPack<FactorQuadConfig> = {
  id: 'factor-quad',
  title: 'Factor quadratics',
  blurb: 'Factor Ax² + Bx + C. Any equivalent factorization is accepted.',
  band: 'Algebra',
  slots: [
    { id: 'expanded', kind: 'expression', label: 'Expanded' },
    { id: 'factored', kind: 'expression', label: 'Factored' },
  ],
  configSchema: [
    {
      key: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      options: [
        { value: 'easy', label: 'Leading coeff 1' },
        { value: 'hard', label: 'Leading coeff ≠ 1' },
      ],
      default: 'easy',
    },
    {
      key: 'commonFactor',
      label: 'Include common factors',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return { difficulty: 'easy', commonFactor: false };
  },
  parseConfig(raw) {
    return {
      difficulty: raw.difficulty === 'hard' ? 'hard' : 'easy',
      commonFactor: Boolean(raw.commonFactor),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 40; i++) {
      const f = sampleFactors(config, rng);
      const q = expand(f);
      // skip zero polynomial and pure constants
      if (q.A === 0) continue;
      // skip if factors are (x+0)(x+0) style too boring sometimes ok
      return {
        slots: {
          expanded: {
            t: 'expr',
            v: formatQuadratic(q),
            meta: q,
          },
          factored: {
            t: 'expr',
            v: formatFactored(f),
            meta: f,
          },
        },
        hidden: 'factored',
        meta: { quadratic: q, factors: f },
      };
    }
    const f: FactoredForm = {
      leading: 1,
      factors: [
        { coeff: 1, constant: 2 },
        { coeff: 1, constant: -3 },
      ],
    };
    const q = expand(f);
    return {
      slots: {
        expanded: { t: 'expr', v: formatQuadratic(q), meta: q },
        factored: { t: 'expr', v: formatFactored(f), meta: f },
      },
      hidden: 'factored',
      meta: { quadratic: q, factors: f },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseFactored(rawInput);
    if (!parsed) {
      return {
        status: 'parse_error',
        message: 'Try forms like (x+2)(x−3) or 2(x+1)(x−4)',
      };
    }
    const qExpected = instance.meta?.quadratic as { A: number; B: number; C: number };
    const qGot = expand(parsed);
    if (quadsEqual(qExpected, qGot)) {
      return { status: 'correct', message: 'Correct factorization' };
    }
    return {
      status: 'incorrect',
      message: 'Does not expand to the given quadratic',
      expectedDisplay: formatFactored(instance.meta?.factors as FactoredForm),
    };
  },
  format(instance): DisplayModel {
    const expanded = instance.slots.expanded!.v as string;
    return {
      prompt: 'Factor the quadratic',
      pieces: [
        { kind: 'slot', slotId: 'expanded', text: expanded, hidden: false },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'factored', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFactored(instance.meta?.factors as FactoredForm);
  },
  inputKind() {
    return 'expression';
  },
};
