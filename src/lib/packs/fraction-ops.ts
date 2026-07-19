import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  formatFrac,
  parseRational,
  gradeRational,
  type BinaryOp,
  ALL_OPS,
  OP_SYMBOLS,
  applyOp,
  isZero,
  type Rng,
} from '../math';

export type FractionOpsConfig = {
  ops: BinaryOp[];
  maxDenom: number;
  hideMode: 'result' | 'operand' | 'both';
  softFormHints: boolean;
};

function randFrac(rng: Rng, maxDenom: number): Frac {
  const d = rng.int(1, maxDenom);
  const n = rng.int(1, d * 2); // allow improper
  return frac(n, d);
}

function gen(
  config: FractionOpsConfig,
  rng: Rng,
): { op: BinaryOp; left: Frac; right: Frac; result: Frac } {
  const op = rng.pick(config.ops.length ? config.ops : (['+'] as BinaryOp[]));
  let left = randFrac(rng, config.maxDenom);
  let right = randFrac(rng, config.maxDenom);

  if (op === '/' && isZero(right)) right = frac(1, rng.int(1, config.maxDenom));
  if (op === '-') {
    // often keep non-negative result for gentler drills
    const r = applyOp('-', left, right);
    if (r.n < 0) [left, right] = [right, left];
  }

  const result = applyOp(op, left, right);
  return { op, left, right, result };
}

function pickHidden(config: FractionOpsConfig, rng: Rng): 'left' | 'right' | 'result' {
  if (config.hideMode === 'result') return 'result';
  if (config.hideMode === 'operand') return rng.bool() ? 'left' : 'right';
  return rng.pick(['left', 'right', 'result'] as const);
}

export const fractionOpsPack: RelationPack<FractionOpsConfig> = {
  id: 'fraction-ops',
  title: 'Fraction ops',
  blurb: 'Add, subtract, multiply, divide fractions — equivalent answers welcome.',
  band: 'Fractions',
  slots: [
    { id: 'left', kind: 'rational', label: 'Left' },
    { id: 'op', kind: 'operator', label: 'Operation' },
    { id: 'right', kind: 'rational', label: 'Right' },
    { id: 'result', kind: 'rational', label: 'Result' },
  ],
  configSchema: [
    {
      key: 'ops',
      label: 'Operations',
      type: 'multi-ops',
      options: ALL_OPS.map((o) => ({ value: o, label: OP_SYMBOLS[o] })),
      default: ['+', '-', '*', '/'],
    },
    {
      key: 'maxDenom',
      label: 'Max denominator',
      type: 'range-select',
      options: [
        { value: '5', label: '1–5' },
        { value: '10', label: '1–10' },
        { value: '12', label: '1–12' },
        { value: '15', label: '1–15' },
      ],
      default: '5',
    },
    {
      key: 'hideMode',
      label: 'Hide',
      type: 'select',
      options: [
        { value: 'result', label: 'Result only' },
        { value: 'operand', label: 'Operand only' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'both',
    },
    {
      key: 'softFormHints',
      label: 'Nudge unreduced answers',
      type: 'toggle',
      default: true,
      help: 'Accepts 2/4 as 1/2 but points out reduction.',
    },
  ],
  defaultConfig() {
    return {
      ops: ['+', '-', '*', '/'],
      maxDenom: 5,
      hideMode: 'both',
      softFormHints: true,
    };
  },
  parseConfig(raw) {
    const ops = Array.isArray(raw.ops)
      ? (raw.ops.filter((o) => ALL_OPS.includes(o as BinaryOp)) as BinaryOp[])
      : (['+', '-', '*', '/'] as BinaryOp[]);
    const maxDenom = Number(raw.maxDenom) || 5;
    const hideMode =
      raw.hideMode === 'result' || raw.hideMode === 'operand' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    return {
      ops: ops.length ? ops : ['+'],
      maxDenom: Math.min(20, Math.max(2, maxDenom)),
      hideMode,
      softFormHints: raw.softFormHints !== false,
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 40; i++) {
      try {
        const { op, left, right, result } = gen(config, rng);
        if (!Number.isSafeInteger(result.n) || !Number.isSafeInteger(result.d)) continue;
        return {
          slots: {
            left: { t: 'frac', v: left },
            op: { t: 'op', v: op },
            right: { t: 'frac', v: right },
            result: { t: 'frac', v: result },
          },
          hidden: pickHidden(config, rng),
        };
      } catch {
        /* retry */
      }
    }
    return {
      slots: {
        left: { t: 'frac', v: frac(1, 2) },
        op: { t: 'op', v: '+' },
        right: { t: 'frac', v: frac(1, 3) },
        result: { t: 'frac', v: frac(5, 6) },
      },
      hidden: 'result',
    };
  },
  check(instance, rawInput, config) {
    const parsed = parseRational(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };

    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed, {
      requireReduced: !config.softFormHints ? false : false,
    });

    // When softFormHints off, treat unreduced as full correct
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      if (!config.softFormHints) return { status: 'correct', message: 'Correct' };
      return {
        status: 'correct_form_hint',
        message: `Correct value — reduced form is ${formatFrac(expected)}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const left = formatFrac((instance.slots.left as { v: Frac }).v);
    const right = formatFrac((instance.slots.right as { v: Frac }).v);
    const result = formatFrac((instance.slots.result as { v: Frac }).v);
    const op = OP_SYMBOLS[instance.slots.op!.v as BinaryOp];
    const h = instance.hidden;
    const blank = '?';
    return {
      prompt: 'Find the missing fraction',
      pieces: [
        { kind: 'slot', slotId: 'left', text: h === 'left' ? blank : left, hidden: h === 'left' },
        { kind: 'text', text: ` ${op} ` },
        {
          kind: 'slot',
          slotId: 'right',
          text: h === 'right' ? blank : right,
          hidden: h === 'right',
        },
        { kind: 'text', text: ' = ' },
        {
          kind: 'slot',
          slotId: 'result',
          text: h === 'result' ? blank : result,
          hidden: h === 'result',
        },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots[instance.hidden] as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
