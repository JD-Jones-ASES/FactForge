import type { CheckResult } from './types';
import { type Frac, formatFrac, parseRational, gradeRational } from '../math/frac';

export type RationalGradeOpts = {
  /** Text appended to the expected display, e.g. "°" or "%". */
  suffix?: string;
  /** Characters stripped from the input before parsing (default: °, %, commas). */
  strip?: RegExp;
  /** When false, unreduced-but-equal answers count as fully correct. */
  formHints?: boolean;
  /** Custom "not quite" message. */
  wrongMessage?: string;
};

/**
 * Shared exact-ℚ grading used by most numeric packs:
 * parse → exact compare → soft form hint for unreduced input.
 */
export function gradeRationalAnswer(
  expected: Frac,
  rawInput: string,
  opts: RationalGradeOpts = {},
): CheckResult {
  const strip = opts.strip ?? /[°%,\s]/g;
  const parsed = parseRational(rawInput.replace(strip, ''));
  if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
  const suffix = opts.suffix ?? '';
  const display = `${formatFrac(expected)}${suffix}`;
  const status = gradeRational(expected, parsed);
  if (status === 'correct') return { status, message: 'Correct' };
  if (status === 'correct_form_hint') {
    if (opts.formHints === false) return { status: 'correct', message: 'Correct' };
    return {
      status,
      message: `Correct value — prefer ${display}`,
      expectedDisplay: display,
    };
  }
  return {
    status: 'incorrect',
    message: opts.wrongMessage ?? 'Not quite',
    expectedDisplay: display,
  };
}

/** Unwrap a `{ t: 'frac', v }` slot. */
export function fracSlot(slots: Record<string, { v: unknown }>, id: string): Frac {
  return (slots[id] as { v: Frac }).v;
}

/** Unicode superscript for small integer exponents (handles negatives). */
const SUP: Record<string, string> = {
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
  '-': '⁻',
  '−': '⁻',
};

export function sup(n: number | string): string {
  return [...String(n)].map((ch) => SUP[ch] ?? ch).join('');
}

/** "+ 3" / "− 3" for building polynomial text (empty for zero). */
export function signedTerm(n: number, term = ''): string {
  if (n === 0) return '';
  const abs = Math.abs(n);
  const body = term ? (abs === 1 ? term : `${abs}${term}`) : String(abs);
  return `${n < 0 ? ' − ' : ' + '}${body}`;
}

/** Leading term like "x²", "−3x", "5" (no leading plus). */
export function leadTerm(n: number, term = ''): string {
  const abs = Math.abs(n);
  const body = term ? (abs === 1 ? term : `${abs}${term}`) : String(abs);
  return n < 0 ? `−${body}` : body;
}
