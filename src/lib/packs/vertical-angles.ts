import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  gradeRational,
  type Rng,
} from '../math';
import { parseAngleInput } from '../math/angle';

/**
 * Vertical angles are equal; adjacent angles form a linear pair (sum 180°).
 * Hide one of the four wedge measures.
 */
export type VerticalAnglesConfig = {
  minAngle: number;
};

export const verticalAnglesPack: RelationPack<VerticalAnglesConfig> = {
  id: 'vertical-angles',
  title: 'Vertical angles',
  blurb: 'Opposite angles equal; adjacent angles sum to 180°.',
  band: 'Geometry',
  slots: [
    { id: 'opp1', kind: 'integer', label: 'Opposite 1' },
    { id: 'opp2', kind: 'integer', label: 'Opposite 2' },
    { id: 'adj1', kind: 'integer', label: 'Adjacent 1' },
    { id: 'adj2', kind: 'integer', label: 'Adjacent 2' },
  ],
  configSchema: [
    {
      key: 'minAngle',
      label: 'Smallest angle ≥',
      type: 'range-select',
      options: [
        { value: '25', label: '25°' },
        { value: '35', label: '35°' },
        { value: '45', label: '45°' },
      ],
      default: '30',
    },
  ],
  defaultConfig() {
    return { minAngle: 30 };
  },
  parseConfig(raw) {
    return {
      minAngle: Math.min(70, Math.max(20, Number(raw.minAngle) || 30)),
    };
  },
  generate(config, rng) {
    const min = config.minAngle;
    const opp = rng.int(min, 180 - min);
    const adj = 180 - opp;
    const hidden = rng.pick(['opp1', 'opp2', 'adj1', 'adj2'] as const);
    return {
      slots: {
        opp1: { t: 'frac', v: fromInt(opp) },
        opp2: { t: 'frac', v: fromInt(opp) },
        adj1: { t: 'frac', v: fromInt(adj) },
        adj2: { t: 'frac', v: fromInt(adj) },
      },
      hidden,
      meta: { opp, adj },
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseAngleInput(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const expected = (instance.slots[instance.hidden] as { v: Frac }).v;
    const status = gradeRational(expected, parsed);
    if (status === 'correct') return { status, message: 'Correct' };
    if (status === 'correct_form_hint') {
      return {
        status,
        message: `Correct — prefer ${formatFrac(expected)}°`,
        expectedDisplay: `${formatFrac(expected)}°`,
      };
    }
    return {
      status: 'incorrect',
      message: 'Not quite — vertical angles are equal; adjacent sum to 180°',
      expectedDisplay: `${formatFrac(expected)}°`,
    };
  },
  format(instance): DisplayModel {
    const opp = (instance.slots.opp1 as { v: Frac }).v.n;
    const adj = (instance.slots.adj1 as { v: Frac }).v.n;
    const h = instance.hidden;
    const lab = (id: string, v: number) => (h === id ? '?' : String(v));
    return {
      prompt: 'Find the missing angle',
      pieces: [
        {
          kind: 'text',
          text: 'Vertical (opposite) angles are equal',
        },
      ],
      figure: {
        kind: 'vertical-angles',
        labels: {
          opp1: lab('opp1', opp),
          opp2: lab('opp2', opp),
          adj1: lab('adj1', adj),
          adj2: lab('adj2', adj),
        },
        // line orientations for a clean X
        line1Deg: 25,
        line2Deg: 25 + opp,
      },
    };
  },
  expectedDisplay(instance) {
    return `${formatFrac((instance.slots[instance.hidden] as { v: Frac }).v)}°`;
  },
  inputKind() {
    return 'integer';
  },
};
