import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  type BinaryOp,
  ALL_OPS,
  OP_SYMBOLS,
  applyOp,
  parseOp,
  type Rng,
} from '../math';

export type IntegerOpsConfig = {
  ops: BinaryOp[];
  max: number;
  hideMode: 'result' | 'operand' | 'both';
  allowNegative: boolean;
};

const RANGE_OPTIONS = [
  { value: '5', label: '1–5' },
  { value: '10', label: '1–10' },
  { value: '12', label: '1–12' },
  { value: '15', label: '1–15' },
  { value: '20', label: '1–20' },
];

function randInt(rng: Rng, max: number, allowNeg: boolean): number {
  const n = rng.int(1, max);
  if (allowNeg && rng.bool(0.25)) return -n;
  return n;
}

function genPair(
  config: IntegerOpsConfig,
  rng: Rng,
): { op: BinaryOp; left: Frac; right: Frac; result: Frac } {
  const op = rng.pick(config.ops.length ? config.ops : (['+'] as BinaryOp[]));
  const max = config.max;
  let leftN = randInt(rng, max, config.allowNegative);
  let rightN = randInt(rng, max, config.allowNegative);

  if (op === '-') {
    // keep result in a reasonable band; swap so often non-negative when no neg
    if (!config.allowNegative && rightN > leftN) [leftN, rightN] = [rightN, leftN];
  }
  if (op === '/') {
    // exact division: pick quotient and divisor, form dividend
    const divisor = rng.int(1, max);
    const quotient = rng.int(1, max);
    leftN = divisor * quotient;
    rightN = divisor;
  }
  if (op === '*' && Math.abs(leftN * rightN) > max * max) {
    leftN = rng.int(1, Math.min(max, 12));
    rightN = rng.int(1, Math.min(max, 12));
  }

  const left = fromInt(leftN);
  const right = fromInt(rightN);
  const result = applyOp(op, left, right);
  return { op, left, right, result };
}

function pickHidden(config: IntegerOpsConfig, rng: Rng): 'left' | 'right' | 'result' {
  if (config.hideMode === 'result') return 'result';
  if (config.hideMode === 'operand') return rng.bool() ? 'left' : 'right';
  return rng.pick(['left', 'right', 'result'] as const);
}

export const integerOpsPack: RelationPack<IntegerOpsConfig> = {
  id: 'integer-ops',
  title: 'Integer ops',
  blurb: 'Missing addend, factor, or sum — four operations over integers.',
  band: 'Arithmetic',
  slots: [
    { id: 'left', kind: 'integer', label: 'Left' },
    { id: 'op', kind: 'operator', label: 'Operation' },
    { id: 'right', kind: 'integer', label: 'Right' },
    { id: 'result', kind: 'integer', label: 'Result' },
  ],
  configSchema: [
    {
      key: 'ops',
      label: 'Operations',
      type: 'multi-ops',
      options: ALL_OPS.map((o) => ({ value: o, label: OP_SYMBOLS[o] })),
      default: ['+', '-', '*'],
    },
    {
      key: 'max',
      label: 'Number range',
      type: 'range-select',
      options: RANGE_OPTIONS,
      default: '10',
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
      key: 'allowNegative',
      label: 'Allow negatives',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return {
      ops: ['+', '-', '*'],
      max: 10,
      hideMode: 'both',
      allowNegative: false,
    };
  },
  parseConfig(raw) {
    const ops = Array.isArray(raw.ops)
      ? (raw.ops.filter((o) => ALL_OPS.includes(o as BinaryOp)) as BinaryOp[])
      : ['+', '-', '*'];
    const max = Number(raw.max) || 10;
    const hideMode =
      raw.hideMode === 'result' || raw.hideMode === 'operand' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    return {
      ops: ops.length ? ops : ['+'],
      max: Math.min(50, Math.max(3, max)),
      hideMode,
      allowNegative: Boolean(raw.allowNegative),
    };
  },
  generate(config, rng) {
    let attempt = 0;
    while (attempt++ < 40) {
      try {
        const { op, left, right, result } = genPair(config, rng);
        if (!Number.isSafeInteger(result.n) || result.d !== 1) continue;
        const hidden = pickHidden(config, rng);
        return {
          slots: {
            left: { t: 'frac', v: left },
            op: { t: 'op', v: op },
            right: { t: 'frac', v: right },
            result: { t: 'frac', v: result },
          },
          hidden,
        };
      } catch {
        /* retry */
      }
    }
    // fallback
    return {
      slots: {
        left: { t: 'frac', v: fromInt(2) },
        op: { t: 'op', v: '+' },
        right: { t: 'frac', v: fromInt(3) },
        result: { t: 'frac', v: fromInt(5) },
      },
      hidden: 'result',
    };
  },
  check(instance, rawInput, _config) {
    const hidden = instance.hidden;
    if (hidden === 'op') {
      const op = parseOp(rawInput);
      if (!op) return { status: 'parse_error', message: 'Enter +, −, ×, or ÷' };
      const expected = instance.slots.op!.v as string;
      if (op === expected) return { status: 'correct', message: 'Correct' };
      return {
        status: 'incorrect',
        message: 'Not quite',
        expectedDisplay: OP_SYMBOLS[expected as BinaryOp],
      };
    }

    const parsed = parseRational(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };

    const expected = (instance.slots[hidden] as { t: 'frac'; v: Frac }).v;
    // integers: unreduced like 4/2 is form hint if they typed a fraction
    const status = gradeRational(expected, parsed, { requireReduced: false });
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Right value — prefer ${formatFrac(expected)}`,
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
      prompt: 'Find the missing number',
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
    const h = instance.hidden;
    if (h === 'op') return OP_SYMBOLS[instance.slots.op!.v as BinaryOp];
    return formatFrac((instance.slots[h] as { v: Frac }).v);
  },
  inputKind(instance) {
    return instance.hidden === 'op' ? 'operator' : 'integer';
  },
};
