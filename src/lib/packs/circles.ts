import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  gradeRational,
  parseRational,
  type Rng,
} from '../math';
import { parsePiExpr, formatPiExpr, piExpr, eqPi, type PiExpr } from '../math/pi';

/**
 * d = 2r, C = 2πr, A = πr² — hide one of r, d, C, A.
 * Integer r for clean answers; C and A graded as exact π expressions.
 */
export type CirclesConfig = {
  maxR: number;
  hideMode: 'r' | 'd' | 'C' | 'A' | 'both';
};

export const circlesPack: RelationPack<CirclesConfig> = {
  id: 'circles',
  title: 'Circle measures',
  blurb: 'r, d, C = 2πr, A = πr² — exact π forms required.',
  band: 'Geometry',
  slots: [
    { id: 'r', kind: 'rational', label: 'radius' },
    { id: 'd', kind: 'rational', label: 'diameter' },
    { id: 'C', kind: 'expression', label: 'circumference' },
    { id: 'A', kind: 'expression', label: 'area' },
  ],
  configSchema: [
    {
      key: 'maxR',
      label: 'Max radius',
      type: 'range-select',
      options: [
        { value: '8', label: '≤8' },
        { value: '12', label: '≤12' },
        { value: '20', label: '≤20' },
      ],
      default: '10',
    },
    {
      key: 'hideMode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'r', label: 'Radius' },
        { value: 'd', label: 'Diameter' },
        { value: 'C', label: 'Circumference' },
        { value: 'A', label: 'Area' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { maxR: 10, hideMode: 'both' };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'r' ||
      raw.hideMode === 'd' ||
      raw.hideMode === 'C' ||
      raw.hideMode === 'A' ||
      raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    return {
      maxR: Math.min(30, Math.max(3, Number(raw.maxR) || 10)),
      hideMode,
    };
  },
  generate(config, rng) {
    const r = rng.int(1, config.maxR);
    const d = 2 * r;
    const C: PiExpr = piExpr(fromInt(2 * r), true);
    const A: PiExpr = piExpr(fromInt(r * r), true);
    const hidden: string =
      config.hideMode === 'both'
        ? rng.pick(['r', 'd', 'C', 'A'] as const)
        : config.hideMode;
    return {
      slots: {
        r: { t: 'frac', v: fromInt(r) },
        d: { t: 'frac', v: fromInt(d) },
        C: { t: 'expr', v: formatPiExpr(C), meta: C },
        A: { t: 'expr', v: formatPiExpr(A), meta: A },
      },
      hidden,
      meta: { r, d, C, A },
    };
  },
  check(instance, rawInput, _config) {
    const h = instance.hidden;
    if (h === 'r' || h === 'd') {
      const parsed = parseRational(rawInput);
      if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
      const expected = (instance.slots[h] as { v: Frac }).v;
      const status = gradeRational(expected, parsed);
      if (status === 'correct') return { status, message: 'Correct' };
      if (status === 'correct_form_hint') {
        return {
          status,
          message: `Correct — prefer ${formatFrac(expected)}`,
          expectedDisplay: formatFrac(expected),
        };
      }
      return {
        status: 'incorrect',
        message: 'Not quite',
        expectedDisplay: formatFrac(expected),
      };
    }
    const expected = instance.meta?.[h] as PiExpr;
    const parsed = parsePiExpr(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    if (eqPi(parsed.value, expected)) {
      return { status: 'correct', message: 'Correct' };
    }
    // same numeric if they forgot pi? incorrect with hint
    return {
      status: 'incorrect',
      message: 'Use exact π form (e.g. 6π), not a decimal',
      expectedDisplay: formatPiExpr(expected),
    };
  },
  format(instance): DisplayModel {
    const r = (instance.slots.r as { v: Frac }).v.n;
    const d = (instance.slots.d as { v: Frac }).v.n;
    const C = formatPiExpr(instance.meta?.C as PiExpr);
    const A = formatPiExpr(instance.meta?.A as PiExpr);
    const h = instance.hidden;
    const show = (id: string, v: string) => (h === id ? '?' : v);
    return {
      prompt: `Find ${h === 'r' ? 'radius r' : h === 'd' ? 'diameter d' : h === 'C' ? 'circumference C' : 'area A'}`,
      pieces: [
        {
          kind: 'text',
          text: `r = ${show('r', String(r))},  d = ${show('d', String(d))},  C = ${show('C', C)},  A = ${show('A', A)}`,
        },
      ],
      figure: {
        kind: 'circle-rd',
        rLabel: h === 'r' ? '?' : String(r),
        dLabel: h === 'd' ? '?' : String(d),
        showR: true,
        showD: h === 'd' || h === 'r',
      },
    };
  },
  expectedDisplay(instance) {
    const h = instance.hidden;
    if (h === 'r' || h === 'd') {
      return formatFrac((instance.slots[h] as { v: Frac }).v);
    }
    return formatPiExpr(instance.meta?.[h] as PiExpr);
  },
  inputKind(instance) {
    return instance.hidden === 'C' || instance.hidden === 'A'
      ? 'expression'
      : 'rational';
  },
};
