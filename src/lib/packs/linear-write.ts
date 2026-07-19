import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  frac,
  fromInt,
  formatFrac,
  parseRational,
  eq,
  neg,
  inv,
  type Rng,
} from '../math';

/**
 * Write the equation of a line from two points, point+slope, parallel, or perp.
 * Graded as y = mx + b (exact ℚ).
 */
export type LinearWriteConfig = {
  max: number;
  mode: 'two-points' | 'point-slope' | 'parallel' | 'perp' | 'both';
};

type Line = { m: Frac; b: Frac };

function formatLine(L: Line): string {
  const { m, b } = L;
  if (m.n === 0) return `y = ${formatFrac(b)}`;
  let ms: string;
  if (m.n === 1 && m.d === 1) ms = 'x';
  else if (m.n === -1 && m.d === 1) ms = '−x';
  else ms = `${formatFrac(m)}x`;
  if (b.n === 0) return `y = ${ms}`;
  if (b.n > 0) return `y = ${ms} + ${formatFrac(b)}`;
  return `y = ${ms} − ${formatFrac({ n: Math.abs(b.n), d: b.d })}`;
}

function formatSlope(m: Frac): string {
  if (m.n === 1 && m.d === 1) return 'x';
  if (m.n === -1 && m.d === 1) return '−x';
  return `${formatFrac(m)}x`;
}

/** Parse y=mx+b (unicode minus OK). */
export function parseLine(input: string): Line | null {
  let s = input.trim().replace(/−/g, '-').replace(/\s+/g, '').toLowerCase();
  if (!s) return null;
  if (!s.startsWith('y=')) s = `y=${s}`;
  const body = s.slice(2);

  if (!body.includes('x')) {
    const r = parseRational(body);
    if (!r.ok) return null;
    return { m: fromInt(0), b: r.value };
  }

  const m = body.match(/^([+-]?(?:\d+\/\d+|\d+)?)x([+-]\d+(?:\/\d+)?)?$/);
  if (!m) return null;
  let mStr = m[1]!;
  if (mStr === '' || mStr === '+') mStr = '1';
  if (mStr === '-') mStr = '-1';
  const mR = parseRational(mStr);
  if (!mR.ok) return null;
  let b: Frac = fromInt(0);
  if (m[2]) {
    const bR = parseRational(m[2]);
    if (!bR.ok) return null;
    b = bR.value;
  }
  return { m: mR.value, b };
}

function lineThrough(m: Frac, x: Frac, y: Frac): Line {
  const mx = frac(m.n * x.n, m.d * x.d);
  const b = frac(y.n * mx.d - mx.n * y.d, y.d * mx.d);
  return { m, b };
}

function yOnLine(L: Line, x: Frac): Frac {
  const mx = frac(L.m.n * x.n, L.m.d * x.d);
  return frac(mx.n * L.b.d + L.b.n * mx.d, mx.d * L.b.d);
}

function linesEqual(a: Line, b: Line): boolean {
  return eq(a.m, b.m) && eq(a.b, b.b);
}

function randNonzero(rng: Rng, max: number): number {
  let n = 0;
  while (n === 0) n = rng.int(-max, max);
  return n;
}

export const linearWritePack: RelationPack<LinearWriteConfig> = {
  id: 'linear-write',
  title: 'Write a line',
  blurb: 'Equation of a line from points, slope, parallel, or perpendicular.',
  band: 'Algebra',
  slots: [{ id: 'line', kind: 'expression', label: 'Equation' }],
  configSchema: [
    {
      key: 'max',
      label: 'Number size',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '9', label: '≤9' },
        { value: '12', label: '≤12' },
      ],
      default: '8',
    },
    {
      key: 'mode',
      label: 'Given',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'two-points', label: 'Two points' },
        { value: 'point-slope', label: 'Point + slope' },
        { value: 'parallel', label: 'Point + parallel line' },
        { value: 'perp', label: 'Point + perpendicular line' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { max: 8, mode: 'both' };
  },
  parseConfig(raw) {
    const mode =
      raw.mode === 'two-points' ||
      raw.mode === 'point-slope' ||
      raw.mode === 'parallel' ||
      raw.mode === 'perp' ||
      raw.mode === 'both'
        ? raw.mode
        : 'both';
    return {
      max: Math.min(15, Math.max(3, Number(raw.max) || 8)),
      mode,
    };
  },
  generate(config, rng) {
    const max = config.max;
    const mode =
      config.mode === 'both'
        ? rng.pick(['two-points', 'point-slope', 'parallel', 'perp'] as const)
        : config.mode;

    const x1 = fromInt(rng.int(-max, max));
    const y1 = fromInt(rng.int(-max, max));

    if (mode === 'perp') {
      let m0 = frac(randNonzero(rng, max), rng.bool(0.35) ? rng.int(2, 4) : 1);
      const mPerp = neg(inv(m0));
      const L = lineThrough(mPerp, x1, y1);
      const b0 = fromInt(rng.int(-max, max));
      const given = `Through (${formatFrac(x1)}, ${formatFrac(y1)}), ⊥ to y = ${formatSlope(m0)}${b0.n === 0 ? '' : b0.n > 0 ? ` + ${formatFrac(b0)}` : ` − ${formatFrac({ n: Math.abs(b0.n), d: 1 })}`}`;
      return {
        slots: { line: { t: 'expr', v: formatLine(L) } },
        hidden: 'line',
        meta: { line: L, given, mode },
      };
    }

    const m = frac(randNonzero(rng, max), rng.bool(0.3) ? rng.int(2, 4) : 1);
    const L = lineThrough(m, x1, y1);

    let given = '';
    if (mode === 'two-points') {
      let x2n = rng.int(-max, max);
      if (x2n === x1.n) x2n += 1;
      const x2 = fromInt(x2n);
      const y2 = yOnLine(L, x2);
      given = `Passes through (${formatFrac(x1)}, ${formatFrac(y1)}) and (${formatFrac(x2)}, ${formatFrac(y2)})`;
    } else if (mode === 'point-slope') {
      given = `Slope ${formatFrac(m)}, through (${formatFrac(x1)}, ${formatFrac(y1)})`;
    } else {
      // parallel
      const b0 = fromInt(rng.int(-max, max));
      const ref =
        b0.n === 0
          ? `y = ${formatSlope(m)}`
          : `y = ${formatSlope(m)}${b0.n > 0 ? ` + ${formatFrac(b0)}` : ` − ${formatFrac({ n: Math.abs(b0.n), d: 1 })}`}`;
      given = `Through (${formatFrac(x1)}, ${formatFrac(y1)}), ∥ to ${ref}`;
    }

    return {
      slots: { line: { t: 'expr', v: formatLine(L) } },
      hidden: 'line',
      meta: { line: L, given, mode },
    };
  },
  check(instance, rawInput, _config) {
    const expected = instance.meta?.line as Line;
    const parsed = parseLine(rawInput);
    if (!parsed) {
      return {
        status: 'parse_error',
        message: 'Try y = mx + b (or y = mx, y = b)',
      };
    }
    if (linesEqual(parsed, expected)) {
      return { status: 'correct', message: 'Correct' };
    }
    return {
      status: 'incorrect',
      message: 'Not the same line',
      expectedDisplay: formatLine(expected),
    };
  },
  format(instance): DisplayModel {
    const given = String(instance.meta?.given ?? '');
    const L = instance.meta?.line as Line;
    return {
      prompt: 'Write the equation of the line (slope-intercept form)',
      pieces: [
        { kind: 'text', text: given },
        { kind: 'text', text: '  →  ' },
        { kind: 'slot', slotId: 'line', text: '?', hidden: true },
      ],
      figure: {
        kind: 'line-2d',
        lines: [{ m: L.m.n / L.m.d, b: L.b.n / L.b.d }],
        xMin: -8,
        xMax: 8,
        yMin: -8,
        yMax: 8,
      },
    };
  },
  expectedDisplay(instance) {
    return formatLine(instance.meta?.line as Line);
  },
  inputKind() {
    return 'expression';
  },
};
