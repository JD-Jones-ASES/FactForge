import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  mul,
  eq,
  type Rng,
} from '../math';

/**
 * a : b = c : d  ⇔  a/b = c/d  ⇔  a·d = b·c
 * Generate from equal ratios k·(p:q).
 */
export type ProportionConfig = {
  max: number;
  hideMode: 'any' | 'extremes' | 'means';
};

function pickHidden(
  mode: ProportionConfig['hideMode'],
  rng: Rng,
): 'a' | 'b' | 'c' | 'd' {
  if (mode === 'extremes') return rng.bool() ? 'a' : 'd';
  if (mode === 'means') return rng.bool() ? 'b' : 'c';
  return rng.pick(['a', 'b', 'c', 'd'] as const);
}

export const proportionPack: RelationPack<ProportionConfig> = {
  id: 'proportion',
  title: 'Proportions',
  blurb: 'Missing term in a : b = c : d. Cross-products stay equal.',
  band: 'Proportional',
  slots: [
    { id: 'a', kind: 'rational', label: 'a' },
    { id: 'b', kind: 'rational', label: 'b' },
    { id: 'c', kind: 'rational', label: 'c' },
    { id: 'd', kind: 'rational', label: 'd' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '8', label: 'Small (≤8)' },
        { value: '12', label: 'Medium (≤12)' },
        { value: '20', label: 'Larger (≤20)' },
      ],
      default: '12',
    },
    {
      key: 'hideMode',
      label: 'Hide',
      type: 'select',
      options: [
        { value: 'any', label: 'Any term' },
        { value: 'extremes', label: 'Extremes (a or d)' },
        { value: 'means', label: 'Means (b or c)' },
      ],
      default: 'any',
    },
  ],
  defaultConfig() {
    return { max: 12, hideMode: 'any' };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'extremes' || raw.hideMode === 'means' || raw.hideMode === 'any'
        ? raw.hideMode
        : 'any';
    return {
      max: Math.min(40, Math.max(4, Number(raw.max) || 12)),
      hideMode,
    };
  },
  generate(config, rng) {
    const max = config.max;
    for (let i = 0; i < 40; i++) {
      const p = rng.int(1, max);
      const q = rng.int(1, max);
      const k1 = rng.int(1, Math.min(6, max));
      const k2 = rng.int(1, Math.min(6, max));
      const a = fromInt(p * k1);
      const b = fromInt(q * k1);
      const c = fromInt(p * k2);
      const d = fromInt(q * k2);
      // skip trivial all-equal boring sometimes ok
      if (a.n === 0 || b.n === 0 || c.n === 0 || d.n === 0) continue;
      return {
        slots: {
          a: { t: 'frac', v: a },
          b: { t: 'frac', v: b },
          c: { t: 'frac', v: c },
          d: { t: 'frac', v: d },
        },
        hidden: pickHidden(config.hideMode, rng),
      };
    }
    return {
      slots: {
        a: { t: 'frac', v: fromInt(2) },
        b: { t: 'frac', v: fromInt(3) },
        c: { t: 'frac', v: fromInt(4) },
        d: { t: 'frac', v: fromInt(6) },
      },
      hidden: 'd',
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseRational(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    // Also accept answers that restore proportion even if generator expected differs
    // (unique when three known) — grade against expected slot
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct value — prefer ${formatFrac(expected)}`,
        expectedDisplay: formatFrac(expected),
      };
    }
    // Verify cross-product if they entered something that still works
    const slots = { ...instance.slots };
    slots[instance.hidden] = { t: 'frac', v: parsed.value };
    const av = (slots.a as { v: Frac }).v;
    const bv = (slots.b as { v: Frac }).v;
    const cv = (slots.c as { v: Frac }).v;
    const dv = (slots.d as { v: Frac }).v;
    if (eq(mul(av, dv), mul(bv, cv))) {
      return { status: 'correct', message: 'Correct (proportion holds)' };
    }
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const f = (id: string) => {
      if (instance.hidden === id) return '?';
      return formatFrac((instance.slots[id] as { v: Frac }).v);
    };
    return {
      prompt: 'Find the missing term',
      pieces: [
        { kind: 'slot', slotId: 'a', text: f('a'), hidden: instance.hidden === 'a' },
        { kind: 'text', text: ' : ' },
        { kind: 'slot', slotId: 'b', text: f('b'), hidden: instance.hidden === 'b' },
        { kind: 'text', text: '  =  ' },
        { kind: 'slot', slotId: 'c', text: f('c'), hidden: instance.hidden === 'c' },
        { kind: 'text', text: ' : ' },
        { kind: 'slot', slotId: 'd', text: f('d'), hidden: instance.hidden === 'd' },
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
