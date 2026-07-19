import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  mul,
  div,
  eq,
  type Rng,
} from '../math';

/**
 * p% of b = c  ⇔  (p/100)·b = c
 */
export type PercentOfConfig = {
  maxBase: number;
  hideMode: 'c' | 'p' | 'b' | 'both';
};

const NICE_P = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100];

function gcdSimple(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/** Parse answer; strip trailing % when finding the percent. */
function parseAnswer(raw: string, hidden: string) {
  let s = raw.trim();
  if (hidden === 'p' && s.endsWith('%')) s = s.slice(0, -1).trim();
  return parseRational(s);
}

export const percentOfPack: RelationPack<PercentOfConfig> = {
  id: 'percent-of',
  title: 'Percent of',
  blurb: 'p% of b = c — find the missing piece over exact rationals.',
  band: 'Proportional',
  slots: [
    { id: 'p', kind: 'rational', label: 'Percent' },
    { id: 'b', kind: 'rational', label: 'Base' },
    { id: 'c', kind: 'rational', label: 'Result' },
  ],
  configSchema: [
    {
      key: 'maxBase',
      label: 'Base size',
      type: 'range-select',
      options: [
        { value: '40', label: '≤40' },
        { value: '100', label: '≤100' },
        { value: '200', label: '≤200' },
      ],
      default: '100',
    },
    {
      key: 'hideMode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'c', label: 'Result (p% of b)' },
        { value: 'p', label: 'Percent' },
        { value: 'b', label: 'Base' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'c',
    },
  ],
  defaultConfig() {
    return { maxBase: 100, hideMode: 'c' };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'c' ||
      raw.hideMode === 'p' ||
      raw.hideMode === 'b' ||
      raw.hideMode === 'both'
        ? raw.hideMode
        : 'c';
    return {
      maxBase: Math.min(500, Math.max(20, Number(raw.maxBase) || 100)),
      hideMode,
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 50; i++) {
      const pN = rng.pick(NICE_P);
      const step = 100 / gcdSimple(pN, 100);
      const mult = rng.int(1, Math.max(1, Math.floor(config.maxBase / step)));
      const bN = step * mult;
      if (bN < 1 || bN > config.maxBase) continue;
      const p = fromInt(pN);
      const b = fromInt(bN);
      const c = mul(div(p, fromInt(100)), b);
      const hidden: string =
        config.hideMode === 'both'
          ? rng.pick(['p', 'b', 'c'] as const)
          : config.hideMode;
      return {
        slots: {
          p: { t: 'frac', v: p },
          b: { t: 'frac', v: b },
          c: { t: 'frac', v: c },
        },
        hidden,
      };
    }
    return {
      slots: {
        p: { t: 'frac', v: fromInt(25) },
        b: { t: 'frac', v: fromInt(80) },
        c: { t: 'frac', v: fromInt(20) },
      },
      hidden: 'c',
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseAnswer(rawInput, instance.hidden);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct value — prefer ${formatFrac(expected)}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    // Accept any value that makes the percent relation hold
    const slots = { ...instance.slots };
    slots[instance.hidden] = { t: 'frac', v: parsed.value };
    const pv = (slots.p as { v: Frac }).v;
    const bv = (slots.b as { v: Frac }).v;
    const cv = (slots.c as { v: Frac }).v;
    try {
      if (eq(mul(div(pv, fromInt(100)), bv), cv)) {
        return { status: 'correct', message: 'Correct' };
      }
    } catch {
      /* zero division */
    }
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay:
        instance.hidden === 'p'
          ? `${formatFrac(expected)}%`
          : formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const p = (instance.slots.p as { v: Frac }).v;
    const b = (instance.slots.b as { v: Frac }).v;
    const c = (instance.slots.c as { v: Frac }).v;
    const h = instance.hidden;
    const pText = h === 'p' ? '?' : `${formatFrac(p)}%`;
    const bText = h === 'b' ? '?' : formatFrac(b);
    const cText = h === 'c' ? '?' : formatFrac(c);
    return {
      prompt: 'Find the missing value',
      pieces: [
        { kind: 'slot', slotId: 'p', text: pText, hidden: h === 'p' },
        { kind: 'text', text: ' of ' },
        { kind: 'slot', slotId: 'b', text: bText, hidden: h === 'b' },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'c', text: cText, hidden: h === 'c' },
      ],
    };
  },
  expectedDisplay(instance) {
    const v = (instance.slots[instance.hidden] as { v: Frac }).v;
    if (instance.hidden === 'p') return `${formatFrac(v)}%`;
    return formatFrac(v);
  },
  inputKind() {
    return 'rational';
  },
};
