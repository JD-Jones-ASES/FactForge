import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  type Rng,
} from '../math';

/**
 * b^e = r over small integers (exact). Hide base, exponent, or result.
 */
export type PowersConfig = {
  maxBase: number;
  maxExp: number;
  hideMode: 'result' | 'base' | 'exp' | 'both';
  allowNegBase: boolean;
};

function ipow(base: number, exp: number): number | null {
  if (exp < 0) return null;
  let r = 1;
  for (let i = 0; i < exp; i++) {
    r *= base;
    if (!Number.isSafeInteger(r)) return null;
  }
  return r;
}

export const powersPack: RelationPack<PowersConfig> = {
  id: 'powers',
  title: 'Powers',
  blurb: 'Missing piece in bᵉ = r — small exact integer powers.',
  band: 'Algebra',
  slots: [
    { id: 'base', kind: 'integer', label: 'Base' },
    { id: 'exp', kind: 'integer', label: 'Exponent' },
    { id: 'result', kind: 'integer', label: 'Result' },
  ],
  configSchema: [
    {
      key: 'maxBase',
      label: 'Max |base|',
      type: 'range-select',
      options: [
        { value: '5', label: '≤5' },
        { value: '8', label: '≤8' },
        { value: '12', label: '≤12' },
      ],
      default: '8',
    },
    {
      key: 'maxExp',
      label: 'Max exponent',
      type: 'range-select',
      options: [
        { value: '3', label: '≤3' },
        { value: '4', label: '≤4' },
        { value: '5', label: '≤5' },
      ],
      default: '4',
    },
    {
      key: 'hideMode',
      label: 'Hide',
      type: 'select',
      options: [
        { value: 'result', label: 'Result only' },
        { value: 'base', label: 'Base only' },
        { value: 'exp', label: 'Exponent only' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'both',
    },
    {
      key: 'allowNegBase',
      label: 'Negative bases',
      type: 'toggle',
      default: false,
    },
  ],
  defaultConfig() {
    return {
      maxBase: 8,
      maxExp: 4,
      hideMode: 'both',
      allowNegBase: false,
    };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'result' ||
      raw.hideMode === 'base' ||
      raw.hideMode === 'exp' ||
      raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    return {
      maxBase: Math.min(20, Math.max(2, Number(raw.maxBase) || 8)),
      maxExp: Math.min(6, Math.max(2, Number(raw.maxExp) || 4)),
      hideMode,
      allowNegBase: Boolean(raw.allowNegBase),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 60; i++) {
      let base = rng.int(2, config.maxBase);
      if (config.allowNegBase && rng.bool(0.3)) base = -base;
      // exp 0 always 1 — sometimes include
      const exp =
        rng.bool(0.12) && config.hideMode !== 'exp' ? 0 : rng.int(2, config.maxExp);
      // when hiding exp, prefer unique-ish roots (positive bases)
      if (config.hideMode === 'exp' || (config.hideMode === 'both' && rng.bool(0.3))) {
        // will pick hide later
      }
      const result = ipow(base, exp);
      if (result === null) continue;
      // when hiding base with even exp, sign ambiguous — prefer positive base
      let hidden: string;
      if (config.hideMode === 'both') {
        hidden = rng.pick(['base', 'exp', 'result'] as const);
      } else {
        hidden = config.hideMode;
      }
      if (hidden === 'base' && exp % 2 === 0 && base < 0) continue;
      if (hidden === 'exp' && base < 0) continue; // log not unique in integers easily
      if (hidden === 'exp' && base === 1) continue;
      if (hidden === 'base' && exp === 0) continue;

      return {
        slots: {
          base: { t: 'frac', v: fromInt(base) },
          exp: { t: 'frac', v: fromInt(exp) },
          result: { t: 'frac', v: fromInt(result) },
        },
        hidden,
        meta: { base, exp, result },
      };
    }
    return {
      slots: {
        base: { t: 'frac', v: fromInt(2) },
        exp: { t: 'frac', v: fromInt(3) },
        result: { t: 'frac', v: fromInt(8) },
      },
      hidden: 'result',
      meta: { base: 2, exp: 3, result: 8 },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseRational(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct — prefer ${formatFrac(expected)}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    // When hiding base with odd exp, accept negative if powers match
    if (instance.hidden === 'base') {
      const exp = (instance.slots.exp as { v: Frac }).v.n;
      const result = (instance.slots.result as { v: Frac }).v.n;
      const guess = parsed.value.n;
      if (parsed.value.d === 1 && exp >= 0) {
        const got = ipow(guess, exp);
        if (got === result) return { status: 'correct', message: 'Correct' };
      }
    }
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const base = (instance.slots.base as { v: Frac }).v;
    const exp = (instance.slots.exp as { v: Frac }).v;
    const result = (instance.slots.result as { v: Frac }).v;
    const h = instance.hidden;
    const baseText = h === 'base' ? '?' : formatFrac(base);
    const expText = h === 'exp' ? '?' : formatFrac(exp);
    const resText = h === 'result' ? '?' : formatFrac(result);
    // unicode superscript for small digits when shown
    const supMap: Record<string, string> = {
      '0': '⁰',
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶',
      '7': '⁷',
      '8': '⁸',
      '9': '⁹',
      '−': '⁻',
      '-': '⁻',
    };
    const toSup = (s: string) =>
      [...s].map((ch) => supMap[ch] ?? ch).join('');
    const expDisp = h === 'exp' ? '?' : toSup(expText);
    const baseDisp =
      h === 'base'
        ? '?'
        : base.n < 0
          ? `(${baseText})`
          : baseText;

    return {
      prompt: 'Find the missing value',
      pieces: [
        { kind: 'slot', slotId: 'base', text: baseDisp, hidden: h === 'base' },
        {
          kind: 'slot',
          slotId: 'exp',
          text: h === 'exp' ? '⁽?⁾' : expDisp,
          hidden: h === 'exp',
        },
        { kind: 'text', text: ' = ' },
        {
          kind: 'slot',
          slotId: 'result',
          text: resText,
          hidden: h === 'result',
        },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots[instance.hidden] as { v: Frac }).v);
  },
  inputKind() {
    return 'integer';
  },
};
