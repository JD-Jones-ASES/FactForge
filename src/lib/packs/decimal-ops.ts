import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  mul,
  sub,
  add,
  formatDecimal,
  isTerminating,
  type BinaryOp,
  ALL_OPS,
  OP_SYMBOLS,
  applyOp,
  type Rng,
} from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Decimal arithmetic over exact ℚ — every operand and result terminates,
 * so grading is exact and the display never rounds.
 */
export type DecimalOpsConfig = {
  ops: BinaryOp[];
  places: number;
  hideMode: 'result' | 'operand' | 'both';
};

function randDecimal(rng: Rng, places: number): Frac {
  const scale = 10 ** places;
  const n = rng.int(1, 20 * scale);
  return frac(n, scale);
}

function gen(cfg: DecimalOpsConfig, rng: Rng) {
  const op = rng.pick(cfg.ops.length ? cfg.ops : (['+'] as BinaryOp[]));
  let left = randDecimal(rng, cfg.places);
  let right = randDecimal(rng, rng.int(1, cfg.places));
  if (op === '-') {
    if (sub(left, right).n < 0) [left, right] = [right, left];
  }
  if (op === '*') {
    // keep products readable: one factor small
    right = frac(rng.int(2, 12), rng.bool() ? 10 : 1);
  }
  if (op === '/') {
    // exact: choose quotient and divisor, build dividend
    const quotient = randDecimal(rng, cfg.places);
    const divisor = frac(rng.int(2, 12), rng.bool() ? 10 : 1);
    left = mul(quotient, divisor);
    right = divisor;
  }
  const result = applyOp(op, left, right);
  return { op, left, right, result };
}

export const decimalOpsPack: RelationPack<DecimalOpsConfig> = {
  id: 'decimal-ops',
  title: 'Decimal ops',
  blurb: 'Add, subtract, multiply, divide decimals — place value stays exact.',
  band: 'Arithmetic',
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
      key: 'places',
      label: 'Decimal places',
      type: 'range-select',
      options: [
        { value: '1', label: 'Tenths' },
        { value: '2', label: 'Hundredths' },
        { value: '3', label: 'Thousandths' },
      ],
      default: '2',
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
      default: 'result',
    },
  ],
  defaultConfig() {
    return { ops: ['+', '-', '*', '/'], places: 2, hideMode: 'result' };
  },
  parseConfig(raw) {
    const ops = Array.isArray(raw.ops)
      ? (raw.ops.filter((o) => ALL_OPS.includes(o as BinaryOp)) as BinaryOp[])
      : (['+', '-', '*', '/'] as BinaryOp[]);
    const hideMode =
      raw.hideMode === 'result' || raw.hideMode === 'operand' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'result';
    return {
      ops: ops.length ? ops : ['+'],
      places: Math.min(3, Math.max(1, Number(raw.places) || 2)),
      hideMode,
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 40; i++) {
      try {
        const { op, left, right, result } = gen(config, rng);
        if (!isTerminating(result) || !isTerminating(left) || !isTerminating(right)) continue;
        if (!Number.isSafeInteger(result.n) || !Number.isSafeInteger(result.d)) continue;
        const hidden =
          config.hideMode === 'result'
            ? 'result'
            : config.hideMode === 'operand'
              ? rng.bool()
                ? 'left'
                : 'right'
              : rng.pick(['left', 'right', 'result'] as const);
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
    return {
      slots: {
        left: { t: 'frac', v: frac(15, 10) },
        op: { t: 'op', v: '+' },
        right: { t: 'frac', v: frac(25, 100) },
        result: { t: 'frac', v: add(frac(15, 10), frac(25, 100)) },
      },
      hidden: 'result',
    };
  },
  check(instance, rawInput) {
    const expected = fracSlot(instance.slots, instance.hidden);
    const res = gradeRationalAnswer(expected, rawInput, { formHints: false });
    if (res.status === 'incorrect') {
      return { ...res, expectedDisplay: formatDecimal(expected) };
    }
    return res;
  },
  format(instance): DisplayModel {
    const h = instance.hidden;
    const show = (id: string) =>
      h === id ? '?' : formatDecimal(fracSlot(instance.slots, id));
    const op = OP_SYMBOLS[instance.slots.op!.v as BinaryOp];
    return {
      prompt: 'Find the missing decimal',
      pieces: [
        { kind: 'slot', slotId: 'left', text: show('left'), hidden: h === 'left' },
        { kind: 'text', text: ` ${op} ` },
        { kind: 'slot', slotId: 'right', text: show('right'), hidden: h === 'right' },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'result', text: show('result'), hidden: h === 'result' },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatDecimal(fracSlot(instance.slots, instance.hidden));
  },
  inputKind() {
    return 'rational';
  },
};
