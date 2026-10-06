import type { RelationPack, DisplayModel } from '../engine/types';
import { frac, fromInt, type Rng } from '../math';
import { parsePiExpr, formatPiExpr, eqPi, type PiExpr } from '../math/pi';
import { gradeRationalAnswer } from '../engine/grade';

/**
 * Volume and surface area of solids. Curved solids keep exact π
 * (V = 18π), prisms are plain rationals.
 */
export type VolumeConfig = {
  solids: Solid[];
  find: 'volume' | 'surface' | 'both';
  max: number;
};

type Solid = 'prism' | 'cube' | 'cylinder' | 'cone' | 'sphere';
const ALL_SOLIDS: Solid[] = ['prism', 'cube', 'cylinder', 'cone', 'sphere'];

type Problem = {
  solid: Solid;
  measure: 'volume' | 'surface';
  dims: string;
  formula: string;
  value: PiExpr;
};

function build(solid: Solid, measure: 'volume' | 'surface', rng: Rng, max: number): Problem | null {
  const r = () => rng.int(2, max);
  if (solid === 'cube') {
    const s = r();
    return measure === 'volume'
      ? { solid, measure, dims: `s = ${s}`, formula: 'V = s³', value: { coeff: fromInt(s ** 3), hasPi: false } }
      : { solid, measure, dims: `s = ${s}`, formula: 'SA = 6s²', value: { coeff: fromInt(6 * s * s), hasPi: false } };
  }
  if (solid === 'prism') {
    const l = r();
    const w = r();
    const h = r();
    return measure === 'volume'
      ? { solid, measure, dims: `l = ${l}, w = ${w}, h = ${h}`, formula: 'V = l · w · h', value: { coeff: fromInt(l * w * h), hasPi: false } }
      : {
          solid,
          measure,
          dims: `l = ${l}, w = ${w}, h = ${h}`,
          formula: 'SA = 2(lw + lh + wh)',
          value: { coeff: fromInt(2 * (l * w + l * h + w * h)), hasPi: false },
        };
  }
  const rad = rng.int(1, Math.min(max, 10));
  if (solid === 'cylinder') {
    const h = r();
    return measure === 'volume'
      ? { solid, measure, dims: `r = ${rad}, h = ${h}`, formula: 'V = πr²h', value: { coeff: fromInt(rad * rad * h), hasPi: true } }
      : {
          solid,
          measure,
          dims: `r = ${rad}, h = ${h}`,
          formula: 'SA = 2πr² + 2πrh',
          value: { coeff: fromInt(2 * rad * rad + 2 * rad * h), hasPi: true },
        };
  }
  if (solid === 'cone') {
    if (measure !== 'volume') return null;
    const h = r();
    return { solid, measure, dims: `r = ${rad}, h = ${h}`, formula: 'V = ⅓πr²h', value: { coeff: frac(rad * rad * h, 3), hasPi: true } };
  }
  // sphere
  return measure === 'volume'
    ? { solid, measure, dims: `r = ${rad}`, formula: 'V = ⁴⁄₃πr³', value: { coeff: frac(4 * rad ** 3, 3), hasPi: true } }
    : { solid, measure, dims: `r = ${rad}`, formula: 'SA = 4πr²', value: { coeff: fromInt(4 * rad * rad), hasPi: true } };
}

export const volumePack: RelationPack<VolumeConfig> = {
  id: 'volume',
  title: 'Volume & surface area',
  blurb: 'Prisms, cubes, cylinders, cones, spheres — exact π forms.',
  band: 'Geometry',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'expression', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'solids',
      label: 'Solids',
      type: 'multi-ops',
      options: [
        { value: 'prism', label: 'Rectangular prism' },
        { value: 'cube', label: 'Cube' },
        { value: 'cylinder', label: 'Cylinder' },
        { value: 'cone', label: 'Cone' },
        { value: 'sphere', label: 'Sphere' },
      ],
      default: ALL_SOLIDS,
    },
    {
      key: 'find',
      label: 'Measure',
      type: 'select',
      options: [
        { value: 'volume', label: 'Volume' },
        { value: 'surface', label: 'Surface area' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'volume',
    },
    {
      key: 'max',
      label: 'Dimension size',
      type: 'range-select',
      options: [
        { value: '6', label: '≤6' },
        { value: '10', label: '≤10' },
        { value: '15', label: '≤15' },
      ],
      default: '8',
    },
  ],
  defaultConfig() {
    return { solids: ALL_SOLIDS, find: 'volume', max: 8 };
  },
  parseConfig(raw) {
    const solids = Array.isArray(raw.solids)
      ? (raw.solids.filter((s) => ALL_SOLIDS.includes(s as Solid)) as Solid[])
      : ALL_SOLIDS;
    const find = raw.find === 'volume' || raw.find === 'surface' || raw.find === 'both' ? raw.find : 'volume';
    return { solids: solids.length ? solids : ['prism'], find, max: Math.min(30, Math.max(3, Number(raw.max) || 8)) };
  },
  generate(config, rng) {
    for (let i = 0; i < 60; i++) {
      const solid = rng.pick(config.solids);
      const measure = config.find === 'both' ? (rng.bool() ? 'volume' : 'surface') : config.find;
      const p = build(solid, measure, rng, config.max);
      if (!p) continue;
      return {
        slots: {
          given: { t: 'expr', v: `${p.formula}   ${p.dims}` },
          answer: { t: 'expr', v: formatPiExpr(p.value) },
        },
        hidden: 'answer',
        meta: { ...p },
      };
    }
    const p = build('cube', 'volume', rng, 5)!;
    return {
      slots: {
        given: { t: 'expr', v: `${p.formula}   ${p.dims}` },
        answer: { t: 'expr', v: formatPiExpr(p.value) },
      },
      hidden: 'answer',
      meta: { ...p },
    };
  },
  check(instance, rawInput) {
    const expected = instance.meta?.value as PiExpr;
    if (!expected.hasPi) {
      return gradeRationalAnswer(expected.coeff, rawInput, { formHints: false });
    }
    const parsed = parsePiExpr(rawInput);
    if (!parsed.ok) return { status: 'parse_error', message: parsed.message };
    if (eqPi(parsed.value, expected)) return { status: 'correct', message: 'Correct' };
    if (!parsed.value.hasPi && parsed.value.coeff.n === expected.coeff.n && parsed.value.coeff.d === expected.coeff.d) {
      return { status: 'incorrect', message: 'Keep the π — write the exact form', expectedDisplay: formatPiExpr(expected) };
    }
    return { status: 'incorrect', message: 'Use exact π form (e.g. 18π), not a decimal', expectedDisplay: formatPiExpr(expected) };
  },
  format(instance): DisplayModel {
    const m = instance.meta as unknown as Problem;
    const label = m.measure === 'volume' ? 'V = ' : 'SA = ';
    const name = m.solid === 'prism' ? 'rectangular prism' : m.solid;
    return {
      prompt: `Find the ${m.measure === 'volume' ? 'volume' : 'surface area'} of the ${name}`,
      pieces: [
        { kind: 'slot', slotId: 'given', text: `${m.formula}    ${m.dims}    ${label}`, hidden: false },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatPiExpr(instance.meta?.value as PiExpr);
  },
  inputKind(instance) {
    return (instance.meta?.value as PiExpr).hasPi ? 'expression' : 'rational';
  },
};
