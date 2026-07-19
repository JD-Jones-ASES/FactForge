import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  gcd,
  lcm,
  type Rng,
} from '../math';

/**
 * Number structure: gcd(a,b)=g and/or lcm(a,b)=m with a·b = g·m.
 */
export type GcfLcmConfig = {
  max: number;
  mode: 'gcd' | 'lcm' | 'both';
};

export const gcfLcmPack: RelationPack<GcfLcmConfig> = {
  id: 'gcf-lcm',
  title: 'GCF & LCM',
  blurb: 'Find the greatest common factor or least common multiple of a pair.',
  band: 'Number structure',
  slots: [
    { id: 'a', kind: 'integer', label: 'a' },
    { id: 'b', kind: 'integer', label: 'b' },
    { id: 'g', kind: 'integer', label: 'GCF' },
    { id: 'm', kind: 'integer', label: 'LCM' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '30', label: '≤30' },
        { value: '60', label: '≤60' },
        { value: '100', label: '≤100' },
      ],
      default: '60',
    },
    {
      key: 'mode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'gcd', label: 'GCF only' },
        { value: 'lcm', label: 'LCM only' },
        { value: 'both', label: 'Mix GCF / LCM' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { max: 60, mode: 'both' };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'gcd' || raw.mode === 'lcm' || raw.mode === 'both'
        ? raw.mode
        : 'both';
    return {
      max: Math.min(200, Math.max(12, Number(raw.max) || 60)),
      mode,
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 50; i++) {
      // coprime multipliers times g
      const g = rng.int(1, Math.min(12, config.max));
      let u = rng.int(1, 8);
      let v = rng.int(1, 8);
      // force coprime u,v for cleaner structure
      while (gcd(u, v) !== 1) {
        u = rng.int(1, 8);
        v = rng.int(1, 8);
      }
      const a = g * u;
      const b = g * v;
      if (a > config.max || b > config.max) continue;
      const m = lcm(a, b);
      const find: 'g' | 'm' =
        config.mode === 'both'
          ? rng.bool()
            ? 'g'
            : 'm'
          : config.mode === 'gcd'
            ? 'g'
            : 'm';
      return {
        slots: {
          a: { t: 'frac', v: fromInt(a) },
          b: { t: 'frac', v: fromInt(b) },
          g: { t: 'frac', v: fromInt(g) },
          m: { t: 'frac', v: fromInt(m) },
        },
        hidden: find,
        meta: { find },
      };
    }
    return {
      slots: {
        a: { t: 'frac', v: fromInt(12) },
        b: { t: 'frac', v: fromInt(18) },
        g: { t: 'frac', v: fromInt(6) },
        m: { t: 'frac', v: fromInt(36) },
      },
      hidden: 'g',
      meta: { find: 'g' },
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
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const a = formatFrac((instance.slots.a as { v: Frac }).v);
    const b = formatFrac((instance.slots.b as { v: Frac }).v);
    const find = (instance.meta?.find as string) ?? instance.hidden;
    if (find === 'g' || instance.hidden === 'g') {
      return {
        prompt: 'Find the GCF (greatest common factor)',
        pieces: [
          { kind: 'text', text: 'GCF(' },
          { kind: 'slot', slotId: 'a', text: a, hidden: false },
          { kind: 'text', text: ', ' },
          { kind: 'slot', slotId: 'b', text: b, hidden: false },
          { kind: 'text', text: ') = ' },
          { kind: 'slot', slotId: 'g', text: '?', hidden: true },
        ],
      };
    }
    return {
      prompt: 'Find the LCM (least common multiple)',
      pieces: [
        { kind: 'text', text: 'LCM(' },
        { kind: 'slot', slotId: 'a', text: a, hidden: false },
        { kind: 'text', text: ', ' },
        { kind: 'slot', slotId: 'b', text: b, hidden: false },
        { kind: 'text', text: ') = ' },
        { kind: 'slot', slotId: 'm', text: '?', hidden: true },
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
