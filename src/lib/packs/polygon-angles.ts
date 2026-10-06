import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, fromInt, formatFrac, type Frac } from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Polygon angles: interior sum (n − 2)·180°, one interior angle of a
 * regular n-gon, one exterior angle 360°/n, or n from a regular angle.
 */
export type PolygonAnglesConfig = {
  mode: Mode | 'both';
  maxSides: number;
  integerOnly: boolean;
};

type Mode = 'sum' | 'interior' | 'exterior' | 'sides';
const MODES: Mode[] = ['sum', 'interior', 'exterior', 'sides'];
const NAMES: Record<number, string> = {
  3: 'triangle',
  4: 'quadrilateral',
  5: 'pentagon',
  6: 'hexagon',
  7: 'heptagon',
  8: 'octagon',
  9: 'nonagon',
  10: 'decagon',
  12: 'dodecagon',
};

export const polygonAnglesPack: RelationPack<PolygonAnglesConfig> = {
  id: 'polygon-angles',
  title: 'Polygon angles',
  blurb: 'Interior sum (n − 2)·180°, regular interior / exterior angles, or find n.',
  band: 'Geometry',
  slots: [
    { id: 'n', kind: 'integer', label: 'Sides' },
    { id: 'answer', kind: 'rational', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'mode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'sum', label: 'Interior angle sum' },
        { value: 'interior', label: 'One interior angle (regular)' },
        { value: 'exterior', label: 'One exterior angle (regular)' },
        { value: 'sides', label: 'Number of sides from an angle' },
      ],
      default: 'both',
    },
    {
      key: 'maxSides',
      label: 'Max sides',
      type: 'range-select',
      options: [
        { value: '8', label: '≤8' },
        { value: '12', label: '≤12' },
        { value: '20', label: '≤20' },
      ],
      default: '12',
    },
    {
      key: 'integerOnly',
      label: 'Whole-degree answers only',
      type: 'toggle',
      default: true,
      help: 'Off: a regular heptagon has 900/7° interior angles.',
    },
  ],
  defaultConfig() {
    return { mode: 'both', maxSides: 12, integerOnly: true };
  },
  parseConfig(raw) {
    const mode = MODES.includes(raw.mode as Mode) || raw.mode === 'both' ? (raw.mode as Mode | 'both') : 'both';
    return {
      mode,
      maxSides: Math.min(30, Math.max(5, Number(raw.maxSides) || 12)),
      integerOnly: raw.integerOnly !== false,
    };
  },
  generate(config, rng) {
    const mode: Mode = config.mode === 'both' ? rng.pick(MODES) : config.mode;
    for (let i = 0; i < 60; i++) {
      const n = rng.int(3, config.maxSides);
      const sum = fromInt((n - 2) * 180);
      const interior = frac((n - 2) * 180, n);
      const exterior = frac(360, n);
      if (config.integerOnly && mode !== 'sum' && (interior.d !== 1 || exterior.d !== 1)) continue;
      const answer: Frac =
        mode === 'sum' ? sum : mode === 'interior' ? interior : mode === 'exterior' ? exterior : fromInt(n);
      return {
        slots: {
          n: { t: 'frac', v: fromInt(n) },
          answer: { t: 'frac', v: answer },
        },
        hidden: 'answer',
        meta: { mode, n, interior, exterior, givenExterior: mode === 'sides' && rng.bool(0.4) },
      };
    }
    return {
      slots: {
        n: { t: 'frac', v: fromInt(6) },
        answer: { t: 'frac', v: fromInt(720) },
      },
      hidden: 'answer',
      meta: { mode: 'sum', n: 6, interior: fromInt(120), exterior: fromInt(60), givenExterior: false },
    };
  },
  check(instance, rawInput) {
    const mode = instance.meta?.mode as Mode;
    return gradeRationalAnswer(fracSlot(instance.slots, 'answer'), rawInput, {
      suffix: mode === 'sides' ? '' : '°',
      formHints: false,
    });
  },
  format(instance): DisplayModel {
    const mode = instance.meta?.mode as Mode;
    const n = Number(instance.meta?.n);
    const interior = formatFrac(instance.meta?.interior as Frac);
    const exterior = formatFrac(instance.meta?.exterior as Frac);
    const name = NAMES[n] ?? `${n}-gon`;
    if (mode === 'sides') {
      const givenExterior = Boolean(instance.meta?.givenExterior);
      return {
        prompt: `A regular polygon has ${givenExterior ? 'exterior' : 'interior'} angles of ${givenExterior ? exterior : interior}°. How many sides?`,
        pieces: [
          { kind: 'text', text: 'n = ' },
          { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
        ],
        figure: {
          kind: 'regular-polygon',
          sides: n,
          interiorLabel: givenExterior ? undefined : interior,
          exteriorLabel: givenExterior ? exterior : undefined,
        },
      };
    }
    const prompt =
      mode === 'sum'
        ? `Sum of the interior angles of a ${name} (n = ${n})`
        : mode === 'interior'
          ? `One interior angle of a regular ${name} (n = ${n})`
          : `One exterior angle of a regular ${name} (n = ${n})`;
    return {
      prompt,
      pieces: [
        { kind: 'text', text: mode === 'sum' ? '(n − 2) · 180° = ' : mode === 'interior' ? 'interior = ' : 'exterior = ' },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure: {
        kind: 'regular-polygon',
        sides: n,
        interiorLabel: mode === 'interior' ? '?' : undefined,
        exteriorLabel: mode === 'exterior' ? '?' : undefined,
      },
    };
  },
  expectedDisplay(instance) {
    const mode = instance.meta?.mode as Mode;
    const v = formatFrac(fracSlot(instance.slots, 'answer'));
    return mode === 'sides' ? v : `${v}°`;
  },
  inputKind(instance) {
    return instance.meta?.mode === 'sides' ? 'integer' : 'rational';
  },
};
