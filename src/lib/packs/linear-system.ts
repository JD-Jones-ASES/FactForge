import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  type Rng,
} from '../math';

/**
 * 2×2 unique rational solution: generate (x0,y0) and two lines through it.
 * Hide x or y.
 */
export type LinearSystemConfig = {
  max: number;
  hideMode: 'x' | 'y' | 'both';
};

type Line = { m: Frac; b: Frac };

function lineThrough(m: Frac, x: Frac, y: Frac): Line {
  const mx = frac(m.n * x.n, m.d * x.d);
  const b = frac(y.n * mx.d - mx.n * y.d, y.d * mx.d);
  return { m, b };
}

function formatEq(L: Line, name: string): string {
  const { m, b } = L;
  let body: string;
  if (m.n === 0) body = formatFrac(b);
  else if (m.n === 1 && m.d === 1) body = 'x';
  else if (m.n === -1 && m.d === 1) body = '−x';
  else body = `${formatFrac(m)}x`;
  if (m.n !== 0) {
    if (b.n === 0) body = body;
    else if (b.n > 0) body = `${body} + ${formatFrac(b)}`;
    else body = `${body} − ${formatFrac({ n: Math.abs(b.n), d: b.d })}`;
  }
  return `${name}: y = ${body}`;
}

function randNonzero(rng: Rng, max: number): number {
  let n = 0;
  while (n === 0) n = rng.int(-max, max);
  return n;
}

export const linearSystemPack: RelationPack<LinearSystemConfig> = {
  id: 'linear-system',
  title: 'Linear systems',
  blurb: 'Solve 2×2 systems with a unique rational solution — with a graph.',
  band: 'Algebra',
  slots: [
    { id: 'x', kind: 'rational', label: 'x' },
    { id: 'y', kind: 'rational', label: 'y' },
  ],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '5', label: '≤5' },
        { value: '8', label: '≤8' },
        { value: '10', label: '≤10' },
      ],
      default: '6',
    },
    {
      key: 'hideMode',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix x / y' },
        { value: 'x', label: 'x only' },
        { value: 'y', label: 'y only' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { max: 6, hideMode: 'both' };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'x' || raw.hideMode === 'y' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    return {
      max: Math.min(12, Math.max(3, Number(raw.max) || 6)),
      hideMode,
    };
  },
  generate(config, rng) {
    const max = config.max;
    const x0 = fromInt(rng.int(-max, max));
    const y0 = fromInt(rng.int(-max, max));
    const m1 = frac(randNonzero(rng, max), rng.bool(0.25) ? rng.int(2, 3) : 1);
    let m2 = frac(randNonzero(rng, max), rng.bool(0.25) ? rng.int(2, 3) : 1);
    // ensure different slopes
    while (m2.n * m1.d === m1.n * m2.d) {
      m2 = frac(randNonzero(rng, max), 1);
    }
    const L1 = lineThrough(m1, x0, y0);
    const L2 = lineThrough(m2, x0, y0);
    const hidden: string =
      config.hideMode === 'both' ? (rng.bool() ? 'x' : 'y') : config.hideMode;
    return {
      slots: {
        x: { t: 'frac', v: x0 },
        y: { t: 'frac', v: y0 },
      },
      hidden,
      meta: {
        L1,
        L2,
        eq1: formatEq(L1, 'ℓ₁'),
        eq2: formatEq(L2, 'ℓ₂'),
        x0,
        y0,
      },
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
    const eq1 = String(instance.meta?.eq1 ?? '');
    const eq2 = String(instance.meta?.eq2 ?? '');
    const x0 = instance.meta?.x0 as Frac;
    const y0 = instance.meta?.y0 as Frac;
    const L1 = instance.meta?.L1 as Line;
    const L2 = instance.meta?.L2 as Line;
    const h = instance.hidden;
    return {
      prompt: h === 'x' ? 'Find x at the intersection' : 'Find y at the intersection',
      pieces: [
        { kind: 'text', text: `${eq1}   ·   ${eq2}` },
      ],
      figure: {
        kind: 'line-2d',
        lines: [
          { m: L1.m.n / L1.m.d, b: L1.b.n / L1.b.d },
          { m: L2.m.n / L2.m.d, b: L2.b.n / L2.b.d },
        ],
        points: [
          {
            x: x0.n / x0.d,
            y: y0.n / y0.d,
            label: h === 'x' ? `(?, ${formatFrac(y0)})` : `(${formatFrac(x0)}, ?)`,
          },
        ],
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10,
      },
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots[instance.hidden] as { v: Frac }).v);
  },
  inputKind() {
    return 'rational';
  },
};
