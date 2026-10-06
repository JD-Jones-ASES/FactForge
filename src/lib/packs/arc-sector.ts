import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, fromInt, mul } from '../math';
import { parsePiExpr, formatPiExpr, eqPi, type PiExpr } from '../math/pi';
import { gradeRationalAnswer } from '../engine/grade';

/**
 * Arc length s = (θ/360)·2πr and sector area A = (θ/360)·πr² in exact π.
 * In radians mode the angle is given as kπ and s = rθ directly.
 */
export type ArcSectorConfig = {
  find: 'arc' | 'area' | 'angle' | 'both';
  unit: 'degrees' | 'radians' | 'both';
  maxR: number;
};

const DEGS = [30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300];

function radLabel(deg: number): string {
  return formatPiExpr({ coeff: frac(deg, 180), hasPi: true });
}

export const arcSectorPack: RelationPack<ArcSectorConfig> = {
  id: 'arc-sector',
  title: 'Arcs & sectors',
  blurb: 'Arc length and sector area from a central angle — degrees or radians, exact π.',
  band: 'Geometry',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'expression', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'find',
      label: 'Find',
      type: 'select',
      options: [
        { value: 'both', label: 'Mix' },
        { value: 'arc', label: 'Arc length' },
        { value: 'area', label: 'Sector area' },
        { value: 'angle', label: 'Central angle from arc length' },
      ],
      default: 'both',
    },
    {
      key: 'unit',
      label: 'Angle unit',
      type: 'select',
      options: [
        { value: 'degrees', label: 'Degrees' },
        { value: 'radians', label: 'Radians' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'degrees',
    },
    {
      key: 'maxR',
      label: 'Max radius',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '12', label: '≤12' },
        { value: '20', label: '≤20' },
      ],
      default: '12',
    },
  ],
  defaultConfig() {
    return { find: 'both', unit: 'degrees', maxR: 12 };
  },
  parseConfig(raw) {
    const find =
      raw.find === 'arc' || raw.find === 'area' || raw.find === 'angle' || raw.find === 'both' ? raw.find : 'both';
    const unit =
      raw.unit === 'degrees' || raw.unit === 'radians' || raw.unit === 'both' ? raw.unit : 'degrees';
    return { find, unit, maxR: Math.min(30, Math.max(2, Number(raw.maxR) || 12)) };
  },
  generate(config, rng) {
    const find = config.find === 'both' ? rng.pick(['arc', 'area', 'angle'] as const) : config.find;
    const unit = config.unit === 'both' ? (rng.bool() ? 'degrees' : 'radians') : config.unit;
    const r = rng.int(1, config.maxR);
    const deg = rng.pick(DEGS);
    const fracTurn = frac(deg, 360);
    const arc: PiExpr = { coeff: mul(fracTurn, fromInt(2 * r)), hasPi: true };
    const area: PiExpr = { coeff: mul(fracTurn, fromInt(r * r)), hasPi: true };
    const angleLabel = unit === 'degrees' ? `${deg}°` : radLabel(deg);
    let answer: string;
    if (find === 'arc') answer = formatPiExpr(arc);
    else if (find === 'area') answer = formatPiExpr(area);
    else answer = unit === 'degrees' ? `${deg}°` : radLabel(deg);
    return {
      slots: {
        given: { t: 'expr', v: `r = ${r},  θ = ${find === 'angle' ? '?' : angleLabel}` },
        answer: { t: 'expr', v: answer },
      },
      hidden: 'answer',
      meta: { find, unit, r, deg, arc, area },
    };
  },
  check(instance, rawInput) {
    const find = String(instance.meta?.find);
    const unit = String(instance.meta?.unit);
    const deg = Number(instance.meta?.deg);
    if (find === 'angle') {
      if (unit === 'degrees') return gradeRationalAnswer(fromInt(deg), rawInput, { suffix: '°' });
      const parsed = parsePiExpr(rawInput);
      if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
      const expected: PiExpr = { coeff: frac(deg, 180), hasPi: true };
      if (eqPi(parsed.value, expected)) return { status: 'correct', message: 'Correct' };
      return { status: 'incorrect', message: 'Not quite — θ = s / r in radians', expectedDisplay: radLabel(deg) };
    }
    const expected = instance.meta?.[find] as PiExpr;
    const parsed = parsePiExpr(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    if (eqPi(parsed.value, expected)) return { status: 'correct', message: 'Correct' };
    const other = instance.meta?.[find === 'arc' ? 'area' : 'arc'] as PiExpr;
    if (eqPi(parsed.value, other)) {
      return {
        status: 'incorrect',
        message: find === 'arc' ? 'That is the sector area — arc length uses 2πr' : 'That is the arc length — area uses πr²',
        expectedDisplay: formatPiExpr(expected),
      };
    }
    return { status: 'incorrect', message: 'Use exact π form (e.g. 3π/2)', expectedDisplay: formatPiExpr(expected) };
  },
  format(instance): DisplayModel {
    const find = String(instance.meta?.find);
    const unit = String(instance.meta?.unit);
    const r = Number(instance.meta?.r);
    const deg = Number(instance.meta?.deg);
    const arc = formatPiExpr(instance.meta?.arc as PiExpr);
    const angleLabel = unit === 'degrees' ? `${deg}°` : radLabel(deg);
    const prompt =
      find === 'arc'
        ? unit === 'degrees'
          ? 'Arc length  s = (θ / 360°) · 2πr'
          : 'Arc length  s = r · θ'
        : find === 'area'
          ? unit === 'degrees'
            ? 'Sector area  A = (θ / 360°) · πr²'
            : 'Sector area  A = ½ · r² · θ'
          : `Find the central angle in ${unit} from the arc length s = ${arc}`;
    const label = find === 'arc' ? 's = ' : find === 'area' ? 'A = ' : 'θ = ';
    return {
      prompt,
      pieces: [
        { kind: 'slot', slotId: 'given', text: String(instance.slots.given!.v), hidden: false },
        { kind: 'text', text: `;   ${label}` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure: {
        kind: 'sector',
        deg,
        angleLabel: find === 'angle' ? '?' : angleLabel,
        rLabel: `r = ${r}`,
        emphasis: find === 'area' ? 'area' : 'arc',
      },
    };
  },
  expectedDisplay(instance) {
    return String(instance.slots.answer!.v);
  },
  inputKind(instance) {
    return instance.meta?.find === 'angle' && instance.meta?.unit === 'degrees' ? 'integer' : 'expression';
  },
};
