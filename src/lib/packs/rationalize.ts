import type { RelationPack, DisplayModel } from '../engine/types';
import { type Rng } from '../math';

/**
 * Rationalize simple denominators.
 * Patterns: a/√b → (a√b)/b ; √a/√b → √(ab)/b when a,b square-free-ish small.
 */
export type RationalizeConfig = {
  max: number;
};

type Problem = {
  prompt: string;
  /** Canonical accepted answers (normalized). */
  accepted: string[];
  displayAnswer: string;
};

function norm(s: string): string {
  return s
    .trim()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/·/g, '')
    .replace(/\*/g, '')
    .toLowerCase()
    .replace(/sqrt/g, '√');
}

function makeProblems(max: number, rng: Rng): Problem {
  // pick square-free-ish b from small list
  const radicals = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15].filter((n) => n <= max + 5);
  const b = rng.pick(radicals.length ? radicals : [2, 3, 5]);
  const a = rng.int(1, Math.min(max, 9));

  if (rng.bool(0.55)) {
    // a/√b
    const num = a === 1 ? `√${b}` : `${a}√${b}`;
    const den = String(b);
    const displayAnswer = a === 1 ? `√${b}/${b}` : `${a}√${b}/${b}`;
    const accepted = [
      norm(displayAnswer),
      norm(`(${num})/${den}`),
      norm(`${num}/${den}`),
    ];
    if (a === 1) accepted.push(norm(`√${b}/${b}`));
    return {
      prompt: a === 1 ? `1/√${b}` : `${a}/√${b}`,
      accepted,
      displayAnswer,
    };
  }

  // √a / √b with a != b
  let a2 = rng.pick([2, 3, 5, 6, 7, 10]);
  while (a2 === b) a2 = rng.pick([2, 3, 5, 6, 7, 10]);
  // √a/√b = √(ab)/b
  const ab = a2 * b;
  const displayAnswer = `√${ab}/${b}`;
  return {
    prompt: `√${a2}/√${b}`,
    accepted: [
      norm(displayAnswer),
      norm(`√(${ab})/${b}`),
      norm(`(√${ab})/${b}`),
      // also √(a/b) if integer? rare
    ],
    displayAnswer,
  };
}

export const rationalizePack: RelationPack<RationalizeConfig> = {
  id: 'rationalize',
  title: 'Rationalize denominators',
  blurb: 'Rewrite so no radical remains in the denominator. Form matters.',
  band: 'Algebra',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'expression', label: 'Rationalized' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '6', label: 'Gentle' },
        { value: '10', label: 'Standard' },
        { value: '15', label: 'Harder' },
      ],
      default: '10',
    },
  ],
  defaultConfig() {
    return { max: 10 };
  },
  parseConfig(raw) {
    return { max: Math.min(20, Math.max(4, Number(raw.max) || 10)) };
  },
  generate(config, rng) {
    const p = makeProblems(config.max, rng);
    return {
      slots: {
        given: { t: 'expr', v: p.prompt },
        answer: { t: 'expr', v: p.displayAnswer },
      },
      hidden: 'answer',
      meta: { accepted: p.accepted, displayAnswer: p.displayAnswer, prompt: p.prompt },
    };
  },
  check(instance, rawInput, _config) {
    const accepted = (instance.meta?.accepted as string[]) ?? [];
    const n = norm(rawInput);
    if (!n) return { status: 'parse_error', message: 'Enter an expression' };
    // reject if still has radical in denominator roughly: /√
    if (/\/√/.test(n) || /\/\s*√/.test(rawInput)) {
      return {
        status: 'incorrect',
        message: 'Still has a radical in the denominator',
        expectedDisplay: String(instance.meta?.displayAnswer ?? ''),
      };
    }
    if (accepted.includes(n)) {
      return { status: 'correct', message: 'Rationalized — correct' };
    }
    // allow √b*a/b reorder a√b/b
    const loose = accepted.some((a) => {
      // strip parens compare multisets hard — simple includes variants already
      return n === a;
    });
    if (loose) return { status: 'correct', message: 'Correct' };
    return {
      status: 'incorrect',
      message: 'Not the expected rationalized form',
      expectedDisplay: String(instance.meta?.displayAnswer ?? ''),
    };
  },
  format(instance): DisplayModel {
    const prompt = String(instance.meta?.prompt ?? instance.slots.given?.v ?? '');
    return {
      prompt: 'Rationalize the denominator',
      pieces: [
        { kind: 'slot', slotId: 'given', text: prompt, hidden: false },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(instance.meta?.displayAnswer ?? '');
  },
  inputKind() {
    return 'expression';
  },
};
