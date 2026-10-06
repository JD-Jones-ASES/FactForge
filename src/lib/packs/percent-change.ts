import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac, mul, add, gcd, type Rng } from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Percent change: new = old · (1 + p/100). Decreases are negative p.
 * Hide the percent, the new value, or the original.
 */
export type PercentChangeConfig = {
  maxOld: number;
  hideMode: 'p' | 'new' | 'old' | 'both';
  direction: 'increase' | 'decrease' | 'both';
};

const UP = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150, 200];
const DOWN = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80];

export const percentChangePack: RelationPack<PercentChangeConfig> = {
  id: 'percent-change',
  title: 'Percent change',
  blurb: 'Increase or decrease: find the % change, the new value, or the original.',
  band: 'Proportional',
  slots: [
    { id: 'old', kind: 'rational', label: 'Original' },
    { id: 'p', kind: 'rational', label: 'Percent change' },
    { id: 'new', kind: 'rational', label: 'New value' },
  ],
  configSchema: [
    {
      key: 'maxOld',
      label: 'Original size',
      type: 'range-select',
      options: [
        { value: '100', label: '≤100' },
        { value: '400', label: '≤400' },
        { value: '1000', label: '≤1000' },
      ],
      default: '400',
    },
    {
      key: 'hideMode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'p', label: 'Percent change' },
        { value: 'new', label: 'New value' },
        { value: 'old', label: 'Original value' },
      ],
      default: 'both',
    },
    {
      key: 'direction',
      label: 'Direction',
      type: 'select',
      options: [
        { value: 'both', label: 'Increase and decrease' },
        { value: 'increase', label: 'Increase only' },
        { value: 'decrease', label: 'Decrease only' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { maxOld: 400, hideMode: 'both', direction: 'both' };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'p' || raw.hideMode === 'new' || raw.hideMode === 'old' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    const direction =
      raw.direction === 'increase' || raw.direction === 'decrease' || raw.direction === 'both'
        ? raw.direction
        : 'both';
    return { maxOld: Math.min(5000, Math.max(50, Number(raw.maxOld) || 400)), hideMode, direction };
  },
  generate(config, rng) {
    for (let i = 0; i < 50; i++) {
      const up =
        config.direction === 'increase' ? true : config.direction === 'decrease' ? false : rng.bool();
      const pAbs = rng.pick(up ? UP : DOWN);
      const p = up ? pAbs : -pAbs;
      const step = 100 / gcd(pAbs, 100);
      const mult = rng.int(1, Math.max(1, Math.floor(config.maxOld / step)));
      const oldN = step * mult;
      if (oldN > config.maxOld) continue;
      const oldV = fromInt(oldN);
      const newV = add(oldV, mul(oldV, frac(p, 100)));
      const hidden: string =
        config.hideMode === 'both' ? rng.pick(['p', 'new', 'old'] as const) : config.hideMode;
      return {
        slots: {
          old: { t: 'frac', v: oldV },
          p: { t: 'frac', v: fromInt(p) },
          new: { t: 'frac', v: newV },
        },
        hidden,
      };
    }
    return {
      slots: {
        old: { t: 'frac', v: fromInt(80) },
        p: { t: 'frac', v: fromInt(25) },
        new: { t: 'frac', v: fromInt(100) },
      },
      hidden: 'new',
    };
  },
  check(instance, rawInput) {
    const expected = fracSlot(instance.slots, instance.hidden);
    if (instance.hidden !== 'p') return gradeRationalAnswer(expected, rawInput);
    let s = rawInput.trim().toLowerCase();
    // "20% decrease" / "decrease of 20%" / "down 20%" → negative
    const says = (re: RegExp) => re.test(s);
    const dec = says(/decrease|down|loss|drop/);
    const inc = says(/increase|up|gain|rise/);
    s = s.replace(/[a-z]+/g, '').replace(/\s+of\s+/g, '').trim();
    s = s.replace(/^\+/, '');
    if (dec && !s.startsWith('-') && !s.startsWith('−')) s = `-${s}`;
    if (inc) s = s.replace(/^[-−]/, '');
    return gradeRationalAnswer(expected, s, { suffix: '%' });
  },
  format(instance): DisplayModel {
    const h = instance.hidden;
    const p = fracSlot(instance.slots, 'p');
    const show = (id: string) => (h === id ? '?' : formatFrac(fracSlot(instance.slots, id)));
    const pText =
      h === 'p'
        ? '?'
        : `${p.n < 0 ? '−' : '+'}${formatFrac({ n: Math.abs(p.n), d: p.d })}%`;
    const prompt =
      h === 'p'
        ? 'Find the percent change (negative for a decrease)'
        : h === 'new'
          ? `Apply a ${p.n < 0 ? 'decrease' : 'increase'} of ${formatFrac({ n: Math.abs(p.n), d: p.d })}%`
          : `Find the original value before a ${p.n < 0 ? 'decrease' : 'increase'} of ${formatFrac({ n: Math.abs(p.n), d: p.d })}%`;
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'old', text: show('old'), hidden: h === 'old' },
        { kind: 'text', text: '  →  ' },
        { kind: 'slot', slotId: 'new', text: show('new'), hidden: h === 'new' },
        { kind: 'text', text: '   change: ' },
        { kind: 'slot', slotId: 'p', text: pText, hidden: h === 'p' },
      ],
    };
  },
  expectedDisplay(instance) {
    const v: Frac = fracSlot(instance.slots, instance.hidden);
    if (instance.hidden === 'p') return `${formatFrac(v)}%`;
    return formatFrac(v);
  },
  inputKind() {
    return 'rational';
  },
};
