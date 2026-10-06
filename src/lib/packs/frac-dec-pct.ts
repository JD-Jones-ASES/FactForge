import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  fromInt,
  mul,
  formatFrac,
  parseRational,
  eq,
  formatDecimal,
  type Rng,
} from '../math';

/**
 * Convert between fraction, decimal, and percent (terminating values only).
 * The requested representation is required; value-only matches are hinted.
 */
export type FracDecPctConfig = {
  mode: Mode | 'both';
  denoms: 'friendly' | 'all';
};

type Rep = 'fraction' | 'decimal' | 'percent';
type Mode = 'frac-dec' | 'frac-pct' | 'dec-frac' | 'dec-pct' | 'pct-frac' | 'pct-dec';

const MODES: Mode[] = ['frac-dec', 'frac-pct', 'dec-frac', 'dec-pct', 'pct-frac', 'pct-dec'];

const FRIENDLY = [2, 4, 5, 10, 20, 25, 50, 100];
const ALL = [2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 100, 200];

function reps(mode: Mode): { from: Rep; to: Rep } {
  const [f, t] = mode.split('-') as [string, string];
  const map: Record<string, Rep> = { frac: 'fraction', dec: 'decimal', pct: 'percent' };
  return { from: map[f]!, to: map[t]! };
}

function sample(rng: Rng, denoms: number[]): Frac {
  for (let i = 0; i < 30; i++) {
    const d = rng.pick(denoms);
    const n = rng.int(1, d - 1);
    const f = frac(n, d);
    if (f.d === 1) continue;
    return f;
  }
  return frac(3, 4);
}

function show(v: Frac, rep: Rep): string {
  if (rep === 'fraction') return formatFrac(v);
  if (rep === 'decimal') return formatDecimal(v);
  return `${formatDecimal(mul(v, fromInt(100)))}%`;
}

export const fracDecPctPack: RelationPack<FracDecPctConfig> = {
  id: 'frac-dec-pct',
  title: 'Fraction · decimal · percent',
  blurb: 'Convert between the three forms — 3/4 = 0.75 = 75%.',
  band: 'Fractions',
  slots: [
    { id: 'given', kind: 'rational', label: 'Given' },
    { id: 'answer', kind: 'rational', label: 'Converted' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Conversion',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'frac-dec', label: 'Fraction → decimal' },
        { value: 'frac-pct', label: 'Fraction → percent' },
        { value: 'dec-frac', label: 'Decimal → fraction' },
        { value: 'dec-pct', label: 'Decimal → percent' },
        { value: 'pct-frac', label: 'Percent → fraction' },
        { value: 'pct-dec', label: 'Percent → decimal' },
      ],
      default: 'both',
    },
    {
      key: 'denoms',
      label: 'Denominators',
      type: 'select',
      options: [
        { value: 'friendly', label: 'Halves, quarters, fifths, tenths…' },
        { value: 'all', label: 'Also eighths, sixteenths, 40ths…' },
      ],
      default: 'friendly',
    },
  ],
  defaultConfig() {
    return { mode: 'both', denoms: 'friendly' };
  },
  parseConfig(raw) {
    const mode = MODES.includes(raw.mode as Mode) || raw.mode === 'both' ? (raw.mode as Mode | 'both') : 'both';
    return { mode, denoms: raw.denoms === 'all' ? 'all' : 'friendly' };
  },
  generate(config, rng) {
    const mode = config.mode === 'both' ? rng.pick(MODES) : config.mode;
    const v = sample(rng, config.denoms === 'all' ? ALL : FRIENDLY);
    return {
      slots: {
        given: { t: 'frac', v },
        answer: { t: 'frac', v },
      },
      hidden: 'answer',
      meta: { mode },
    };
  },
  check(instance, rawInput) {
    const v = (instance.slots.answer as { v: Frac }).v;
    const { to } = reps((instance.meta?.mode as Mode) ?? 'frac-dec');
    const target = show(v, to);
    let s = rawInput.trim().replace(/−/g, '-');
    const hadPercent = s.endsWith('%');
    if (hadPercent) s = s.slice(0, -1).trim();
    const parsed = parseRational(s);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };

    if (to === 'percent') {
      const asPct = mul(v, fromInt(100));
      if (eq(parsed.value, asPct)) return { status: 'correct', message: 'Correct' };
      if (eq(parsed.value, v) && !hadPercent) {
        return {
          status: 'incorrect',
          message: 'That is the decimal/fraction value — a percent is 100× larger',
          expectedDisplay: target,
        };
      }
      return { status: 'incorrect', message: 'Not quite', expectedDisplay: target };
    }

    if (!eq(parsed.value, v)) {
      if (hadPercent && eq(mul(parsed.value, frac(1, 100)), v)) {
        return {
          status: 'incorrect',
          message: `Right value as a percent — but write it as a ${to}`,
          expectedDisplay: target,
        };
      }
      return { status: 'incorrect', message: 'Not quite', expectedDisplay: target };
    }
    const typedFraction = s.includes('/');
    const typedDecimal = s.includes('.');
    if (to === 'decimal' && typedFraction) {
      return {
        status: 'incorrect',
        message: 'Right value — but write it as a decimal',
        expectedDisplay: target,
      };
    }
    if (to === 'fraction' && typedDecimal) {
      return {
        status: 'incorrect',
        message: 'Right value — but write it as a fraction',
        expectedDisplay: target,
      };
    }
    if (to === 'fraction' && !parsed.reduced) {
      return {
        status: 'correct_form_hint',
        message: `Correct — lowest terms is ${target}`,
        expectedDisplay: target,
      };
    }
    return { status: 'correct', message: 'Correct' };
  },
  format(instance): DisplayModel {
    const v = (instance.slots.given as { v: Frac }).v;
    const { from, to } = reps((instance.meta?.mode as Mode) ?? 'frac-dec');
    return {
      prompt: `Write as a ${to}`,
      pieces: [
        { kind: 'slot', slotId: 'given', text: show(v, from), hidden: false },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    const v = (instance.slots.answer as { v: Frac }).v;
    const { to } = reps((instance.meta?.mode as Mode) ?? 'frac-dec');
    return show(v, to);
  },
  inputKind() {
    return 'rational';
  },
};
