import type { RelationPack, DisplayModel } from '../engine/types';
import type { Rng } from '../math';
import {
  type FactoredForm,
  expand,
  formatQuadratic,
  formatFactored,
  parseQuadratic,
  quadsEqual,
} from '../expr/quadratic';

export type ExpandQuadConfig = {
  difficulty: 'easy' | 'hard';
  commonFactor: boolean;
};

function sampleFactors(config: ExpandQuadConfig, rng: Rng): FactoredForm {
  const easy = config.difficulty === 'easy';
  const b = easy ? 1 : rng.int(1, 4);
  const d = easy ? 1 : rng.int(1, 4);
  const c = rng.int(-6, 6);
  const e = rng.int(-6, 6);
  const a = config.commonFactor ? rng.int(1, 4) : 1;
  return {
    leading: a,
    factors: [
      { coeff: b, constant: c },
      { coeff: d, constant: e },
    ],
  };
}

export const expandQuadPack: RelationPack<ExpandQuadConfig> = {
  id: 'expand-quad',
  title: 'Expand quadratics',
  blurb: 'Expand k(ax+b)(cx+d). Equivalent expanded forms accepted.',
  band: 'Algebra',
  slots: [
    { id: 'factored', kind: 'expression', label: 'Factored' },
    { id: 'expanded', kind: 'expression', label: 'Expanded' },
  ],
  configSchema: [
    {
      key: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      options: [
        { value: 'easy', label: 'Leading factors 1' },
        { value: 'hard', label: 'Harder coefficients' },
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
      if (q.A === 0) continue;
      return {
        slots: {
          factored: { t: 'expr', v: formatFactored(f), meta: f },
          expanded: { t: 'expr', v: formatQuadratic(q), meta: q },
        },
        hidden: 'expanded',
        meta: { quadratic: q, factors: f },
      };
    }
    const f: FactoredForm = {
      leading: 1,
      factors: [
        { coeff: 1, constant: 2 },
        { coeff: 1, constant: 3 },
      ],
    };
    const q = expand(f);
    return {
      slots: {
        factored: { t: 'expr', v: formatFactored(f), meta: f },
        expanded: { t: 'expr', v: formatQuadratic(q), meta: q },
      },
      hidden: 'expanded',
      meta: { quadratic: q, factors: f },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseQuadratic(rawInput);
    if (!parsed) {
      return {
        status: 'parse_error',
        message: 'Try forms like x² + 5x + 6 or 2x^2 − 3x + 1',
      };
    }
    const expected = instance.meta?.quadratic as {
      A: number;
      B: number;
      C: number;
    };
    if (quadsEqual(expected, parsed)) {
      return { status: 'correct', message: 'Correct expansion' };
    }
    return {
      status: 'incorrect',
      message: 'Not the expanded form',
      expectedDisplay: formatQuadratic(expected),
    };
  },
  format(instance): DisplayModel {
    const factored = instance.slots.factored!.v as string;
    return {
      prompt: 'Expand the product',
      pieces: [
        { kind: 'slot', slotId: 'factored', text: factored, hidden: false },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'expanded', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatQuadratic(
      instance.meta?.quadratic as { A: number; B: number; C: number },
    );
  },
  inputKind() {
    return 'expression';
  },
};
