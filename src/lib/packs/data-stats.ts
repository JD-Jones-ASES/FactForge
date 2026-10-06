import type { RelationPack, DisplayModel } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac, formatDecimal, isTerminating } from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Mean, median, mode, range of a small integer data set — exact ℚ.
 * Mode questions only use sets with a unique mode.
 */
export type DataStatsConfig = {
  stats: Stat[];
  size: number;
  max: number;
};

type Stat = 'mean' | 'median' | 'mode' | 'range';
const ALL_STATS: Stat[] = ['mean', 'median', 'mode', 'range'];

function computeStats(data: number[]): { mean: Frac; median: Frac; mode: number | null; range: number } {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = frac(sum, n);
  const median =
    n % 2 === 1
      ? fromInt(sorted[(n - 1) / 2]!)
      : frac(sorted[n / 2 - 1]! + sorted[n / 2]!, 2);
  const counts = new Map<number, number>();
  for (const v of sorted) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = 0;
  let mode: number | null = null;
  let tie = false;
  for (const [v, c] of counts) {
    if (c > best) {
      best = c;
      mode = v;
      tie = false;
    } else if (c === best) tie = true;
  }
  if (tie || best < 2) mode = null;
  return { mean, median, mode, range: sorted[n - 1]! - sorted[0]! };
}

export const dataStatsPack: RelationPack<DataStatsConfig> = {
  id: 'data-stats',
  title: 'Mean · median · mode · range',
  blurb: 'Summarize a small data set — exact means (fractions welcome).',
  band: 'Data',
  slots: [
    { id: 'data', kind: 'expression', label: 'Data' },
    { id: 'answer', kind: 'rational', label: 'Statistic' },
  ],
  configSchema: [
    {
      key: 'stats',
      label: 'Statistics',
      type: 'multi-ops',
      options: ALL_STATS.map((s) => ({ value: s, label: s })),
      default: ['mean', 'median', 'mode', 'range'],
    },
    {
      key: 'size',
      label: 'Data points',
      type: 'range-select',
      options: [
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
        { value: '8', label: '8' },
      ],
      default: '6',
    },
    {
      key: 'max',
      label: 'Value size',
      type: 'range-select',
      options: [
        { value: '10', label: '≤10' },
        { value: '20', label: '≤20' },
        { value: '50', label: '≤50' },
      ],
      default: '20',
    },
  ],
  defaultConfig() {
    return { stats: ['mean', 'median', 'mode', 'range'], size: 6, max: 20 };
  },
  parseConfig(raw) {
    const stats = Array.isArray(raw.stats)
      ? (raw.stats.filter((s) => ALL_STATS.includes(s as Stat)) as Stat[])
      : ALL_STATS;
    return {
      stats: stats.length ? stats : ['mean'],
      size: Math.min(10, Math.max(3, Number(raw.size) || 6)),
      max: Math.min(100, Math.max(5, Number(raw.max) || 20)),
    };
  },
  generate(config, rng) {
    const stat = rng.pick(config.stats);
    for (let i = 0; i < 60; i++) {
      const data: number[] = [];
      for (let k = 0; k < config.size; k++) data.push(rng.int(1, config.max));
      // plant a repeated value so modes are common
      if (rng.bool(0.7)) data[rng.int(0, config.size - 1)] = data[rng.int(0, config.size - 1)]!;
      const s = computeStats(data);
      if (stat === 'mode' && s.mode === null) continue;
      if (stat === 'mean' && rng.bool(0.5) && s.mean.d !== 1) continue; // half the means are integers
      const answer =
        stat === 'mean' ? s.mean : stat === 'median' ? s.median : stat === 'mode' ? fromInt(s.mode!) : fromInt(s.range);
      return {
        slots: {
          data: { t: 'expr', v: data.join(', ') },
          answer: { t: 'frac', v: answer },
        },
        hidden: 'answer',
        meta: { stat, data },
      };
    }
    return {
      slots: {
        data: { t: 'expr', v: '4, 7, 7, 10, 12' },
        answer: { t: 'frac', v: fromInt(8) },
      },
      hidden: 'answer',
      meta: { stat: 'mean', data: [4, 7, 7, 10, 12] },
    };
  },
  check(instance, rawInput) {
    const expected = fracSlot(instance.slots, 'answer');
    const stat = String(instance.meta?.stat ?? 'mean');
    const res = gradeRationalAnswer(expected, rawInput, {
      formHints: stat !== 'mean' && stat !== 'median',
    });
    if (res.status === 'incorrect' && expected.d !== 1 && isTerminating(expected)) {
      return { ...res, expectedDisplay: `${formatFrac(expected)} = ${formatDecimal(expected)}` };
    }
    return res;
  },
  format(instance): DisplayModel {
    const stat = String(instance.meta?.stat ?? 'mean');
    return {
      prompt: `Find the ${stat}`,
      pieces: [
        { kind: 'slot', slotId: 'data', text: String(instance.slots.data!.v), hidden: false },
        { kind: 'text', text: `   ${stat} = ` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac(fracSlot(instance.slots, 'answer'));
  },
  inputKind() {
    return 'rational';
  },
};
