import type { RelationPack, DisplayModel } from '../engine/types';
import { type Rng } from '../math';
import {
  parseApproxNumber,
  gradeApprox,
  formatTenths,
  formatThousandths,
} from '../math/approx';

/**
 * Right-triangle trig (calculator mode).
 * Generate integer legs or 30-45-60 friendly; grade with ±0.05 tolerance.
 */
export type RightTrigConfig = {
  mode: 'exact-angles' | 'calculator' | 'both';
};

type Problem = {
  prompt: string;
  trueValue: number;
  adj: number;
  opp: number;
  hyp: number;
  theta: number;
  ask: 'side' | 'angle';
};

function ipow(x: number) {
  return x * x;
}

export const rightTrigPack: RelationPack<RightTrigConfig> = {
  id: 'right-trig',
  title: 'Right-triangle trig',
  blurb: 'SOH-CAH-TOA with a figure. Enter decimals to the tenths (±0.05 OK).',
  band: 'Trig',
  slots: [{ id: 'ans', kind: 'rational', label: 'Answer' }],
  configSchema: [
    {
      key: 'mode',
      label: 'Difficulty',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'exact-angles', label: '30° / 45° / 60°' },
        { value: 'calculator', label: 'Calculator angles' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { mode: 'both' };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'exact-angles' ||
      raw.mode === 'calculator' ||
      raw.mode === 'both'
        ? raw.mode
        : 'both';
    return { mode };
  },
  generate(config, rng) {
    const mode =
      config.mode === 'both'
        ? rng.bool()
          ? 'exact-angles'
          : 'calculator'
        : config.mode;

    let theta: number;
    let adj: number;
    let opp: number;
    let hyp: number;

    if (mode === 'exact-angles') {
      theta = rng.pick([30, 45, 60]);
      // scale so sides are nice-ish
      const scale = rng.int(4, 12);
      if (theta === 45) {
        adj = scale;
        opp = scale;
        hyp = scale * Math.SQRT2;
      } else if (theta === 30) {
        opp = scale;
        hyp = 2 * scale;
        adj = scale * Math.sqrt(3);
      } else {
        // 60
        adj = scale;
        hyp = 2 * scale;
        opp = scale * Math.sqrt(3);
      }
    } else {
      theta = rng.int(20, 70);
      adj = rng.int(5, 15);
      opp = adj * Math.tan((theta * Math.PI) / 180);
      hyp = Math.hypot(adj, opp);
    }

    // What to ask — always consistent with computed sides
    const askKind = rng.pick(['opp', 'adj', 'hyp', 'theta'] as const);
    let prompt: string;
    let trueValue: number;
    let ask: 'side' | 'angle' = 'side';

    if (askKind === 'theta') {
      ask = 'angle';
      trueValue = theta;
      prompt = `Right triangle: adjacent = ${formatTenths(adj)}, opposite = ${formatTenths(opp)}. Find θ (degrees).`;
    } else if (askKind === 'opp') {
      trueValue = opp;
      prompt = `Right triangle: θ = ${theta}°, adjacent = ${formatTenths(adj)}. Find the opposite side.`;
    } else if (askKind === 'adj') {
      trueValue = adj;
      prompt = `Right triangle: θ = ${theta}°, opposite = ${formatTenths(opp)}. Find the adjacent side.`;
    } else {
      trueValue = hyp;
      prompt = `Right triangle: θ = ${theta}°, adjacent = ${formatTenths(adj)}. Find the hypotenuse.`;
    }

    return {
      slots: {
        ans: { t: 'frac', v: { n: Math.round(trueValue), d: 1 } },
      },
      hidden: 'ans',
      meta: {
        prompt,
        trueValue,
        adj,
        opp,
        hyp,
        theta,
        ask,
      } satisfies Problem & Record<string, unknown>,
    };
  },
  check(instance, rawInput, _config) {
    const parsed = parseApproxNumber(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    const trueValue = Number(instance.meta?.trueValue);
    if (gradeApprox(trueValue, parsed.value, 0.05)) {
      return { status: 'correct', message: 'Correct (within ±0.05)' };
    }
    return {
      status: 'incorrect',
      message: `Not within ±0.05 of ${formatTenths(trueValue)}`,
      expectedDisplay: `${formatTenths(trueValue)} (≈ ${formatThousandths(trueValue)})`,
    };
  },
  format(instance): DisplayModel {
    const adj = Number(instance.meta?.adj);
    const opp = Number(instance.meta?.opp);
    const hyp = Number(instance.meta?.hyp);
    const theta = Number(instance.meta?.theta);
    const ask = String(instance.meta?.ask ?? 'side');
    return {
      prompt: String(instance.meta?.prompt ?? 'Solve'),
      pieces: [
        {
          kind: 'text',
          text:
            ask === 'angle'
              ? `θ = ?°`
              : `θ = ${theta}°`,
        },
      ],
      figure: {
        kind: 'right-triangle',
        adj,
        opp,
        hyp,
        thetaDeg: theta,
        hideTheta: ask === 'angle',
      },
    };
  },
  expectedDisplay(instance) {
    const v = Number(instance.meta?.trueValue);
    return formatTenths(v);
  },
  inputKind() {
    return 'rational';
  },
};

void ipow;
