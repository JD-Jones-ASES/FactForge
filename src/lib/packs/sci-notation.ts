import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  fromInt,
  mul,
  eq,
  parseRational,
  formatDecimal,
  type Rng,
} from '../math';
import { gradeRationalAnswer, sup } from '../engine/grade';

/**
 * Scientific notation ↔ standard form, exact over ℚ.
 * Value = m × 10ⁿ with 1 ≤ m < 10; standard answers may be decimals.
 */
export type SciNotationConfig = {
  mode: 'to-sci' | 'to-standard' | 'both';
  digits: number;
  negatives: boolean;
};

type Sci = { mantissa: Frac; exp: number };

function pow10(n: number): Frac {
  return n >= 0 ? fromInt(10 ** n) : frac(1, 10 ** -n);
}

function valueOf(s: Sci): Frac {
  return mul(s.mantissa, pow10(s.exp));
}

export function formatSci(s: Sci): string {
  return `${formatDecimal(s.mantissa)} × 10${sup(s.exp < 0 ? `−${-s.exp}` : s.exp)}`;
}

/** Parse "3.4 × 10^5", "3.4x10^5", "3.4e5", "3.4*10⁵" → Sci (mantissa as typed). */
export function parseSci(input: string): Sci | null {
  let s = input.trim().replace(/−/g, '-').replace(/\s+/g, '').toLowerCase();
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (run) => {
    const map: Record<string, string> = {
      '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
      '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-',
    };
    return '^' + [...run].map((c) => map[c] ?? c).join('');
  });
  const m =
    s.match(/^([+-]?[\d.]+)(?:[x×*·]10\^?\(?([+-]?\d+)\)?|e([+-]?\d+))$/) ??
    s.match(/^([+-]?[\d.]+)[x×*·]10$/);
  if (!m) return null;
  const mant = parseRational(m[1]!);
  if (!mant.ok) return null;
  const expStr = m[2] ?? m[3] ?? '0';
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return null;
  return { mantissa: mant.value, exp };
}

function mantissaInRange(m: Frac): boolean {
  const v = Math.abs(m.n / m.d);
  return v >= 1 && v < 10;
}

export const sciNotationPack: RelationPack<SciNotationConfig> = {
  id: 'sci-notation',
  title: 'Scientific notation',
  blurb: '3.4 × 10⁵ ↔ 340 000 — mantissa between 1 and 10.',
  band: 'Number structure',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'expression', label: 'Converted' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Direction',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'to-sci', label: 'Standard → scientific' },
        { value: 'to-standard', label: 'Scientific → standard' },
      ],
      default: 'both',
    },
    {
      key: 'digits',
      label: 'Significant digits',
      type: 'range-select',
      options: [
        { value: '1', label: '1 (e.g. 4 × 10⁵)' },
        { value: '2', label: '2 (e.g. 4.3 × 10⁵)' },
        { value: '3', label: '3 (e.g. 4.37 × 10⁵)' },
      ],
      default: '2',
    },
    {
      key: 'negatives',
      label: 'Negative exponents (small numbers)',
      type: 'toggle',
      default: true,
    },
  ],
  defaultConfig() {
    return { mode: 'both', digits: 2, negatives: true };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'to-sci' || raw.mode === 'to-standard' || raw.mode === 'both'
        ? raw.mode
        : 'both';
    return {
      mode,
      digits: Math.min(4, Math.max(1, Number(raw.digits) || 2)),
      negatives: raw.negatives !== false,
    };
  },
  generate(config, rng) {
    const mode = config.mode === 'both' ? (rng.bool() ? 'to-sci' : 'to-standard') : config.mode;
    const places = config.digits - 1;
    const lead = rng.int(1, 9);
    let rest = places > 0 ? rng.int(0, 10 ** places - 1) : 0;
    // avoid trailing zero in the mantissa so the digit count is honest
    if (places > 0 && rest % 10 === 0) rest += 1;
    const mantissa = frac(lead * 10 ** places + rest, 10 ** places);
    let exp = rng.int(1, 7);
    if (config.negatives && rng.bool(0.45)) exp = -rng.int(1, 6);
    const sci: Sci = { mantissa, exp };
    const value = valueOf(sci);
    return {
      slots: {
        given: { t: 'expr', v: mode === 'to-sci' ? formatDecimal(value) : formatSci(sci) },
        answer: { t: 'expr', v: mode === 'to-sci' ? formatSci(sci) : formatDecimal(value) },
      },
      hidden: 'answer',
      meta: { mode, mantissa, exp },
    };
  },
  check(instance, rawInput) {
    const mode = String(instance.meta?.mode ?? 'to-sci');
    const sci: Sci = {
      mantissa: instance.meta?.mantissa as Frac,
      exp: Number(instance.meta?.exp ?? 0),
    };
    const value = valueOf(sci);
    if (mode === 'to-standard') {
      const res = gradeRationalAnswer(value, rawInput, { formHints: false });
      if (res.status === 'incorrect') return { ...res, expectedDisplay: formatDecimal(value) };
      return res;
    }
    const parsed = parseSci(rawInput);
    if (!parsed) {
      return {
        status: 'parse_error',
        message: 'Try forms like 3.4 × 10^5, 3.4x10^5, or 3.4e5',
      };
    }
    if (!eq(valueOf(parsed), value)) {
      return { status: 'incorrect', message: 'Not the same value', expectedDisplay: formatSci(sci) };
    }
    if (!mantissaInRange(parsed.mantissa)) {
      return {
        status: 'incorrect',
        message: 'Right value — but the mantissa must be at least 1 and less than 10',
        expectedDisplay: formatSci(sci),
      };
    }
    return { status: 'correct', message: 'Correct' };
  },
  format(instance): DisplayModel {
    const mode = String(instance.meta?.mode ?? 'to-sci');
    return {
      prompt: mode === 'to-sci' ? 'Write in scientific notation' : 'Write in standard form',
      pieces: [
        { kind: 'slot', slotId: 'given', text: String(instance.slots.given!.v), hidden: false },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer!.v);
  },
  inputKind() {
    return 'expression';
  },
};
