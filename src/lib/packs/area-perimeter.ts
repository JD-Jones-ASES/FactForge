import type { RelationPack, DisplayModel, FigureSpec } from '../engine/types';
import { type Frac, frac, fromInt, formatFrac, type Rng } from '../math';
import { gradeRationalAnswer, fracSlot } from '../engine/grade';

/**
 * Area and perimeter of basic shapes with a labelled figure. "Dimension"
 * mode gives the area/perimeter and hides a side instead.
 */
export type AreaPerimeterConfig = {
  shapes: Shape[];
  find: 'area' | 'perimeter' | 'both';
  hideMode: 'measure' | 'dimension' | 'both';
  max: number;
};

type Shape = 'rectangle' | 'square' | 'triangle' | 'parallelogram' | 'trapezoid';
const ALL_SHAPES: Shape[] = ['rectangle', 'square', 'triangle', 'parallelogram', 'trapezoid'];

type Problem = {
  shape: Shape;
  measure: 'area' | 'perimeter';
  /** Named dimensions in display order. */
  dims: Record<string, number>;
  value: Frac;
  /** Which dim (or 'value') is hidden. */
  hidden: string;
  formula: string;
};

function build(shape: Shape, measure: 'area' | 'perimeter', rng: Rng, max: number): Problem | null {
  const r = () => rng.int(2, max);
  if (shape === 'square') {
    const s = r();
    return measure === 'area'
      ? { shape, measure, dims: { s }, value: fromInt(s * s), hidden: 'value', formula: 'A = s²' }
      : { shape, measure, dims: { s }, value: fromInt(4 * s), hidden: 'value', formula: 'P = 4s' };
  }
  if (shape === 'rectangle') {
    const l = r();
    let w = r();
    if (w === l) w = l + 1;
    return measure === 'area'
      ? { shape, measure, dims: { l, w }, value: fromInt(l * w), hidden: 'value', formula: 'A = l · w' }
      : { shape, measure, dims: { l, w }, value: fromInt(2 * (l + w)), hidden: 'value', formula: 'P = 2l + 2w' };
  }
  if (shape === 'triangle') {
    if (measure === 'area') {
      const b = r();
      const h = r();
      return { shape, measure, dims: { b, h }, value: frac(b * h, 2), hidden: 'value', formula: 'A = ½ · b · h' };
    }
    for (let i = 0; i < 20; i++) {
      const a = r();
      const b = r();
      const c = r();
      if (a + b > c && a + c > b && b + c > a) {
        return { shape, measure, dims: { a, b, c }, value: fromInt(a + b + c), hidden: 'value', formula: 'P = a + b + c' };
      }
    }
    return null;
  }
  if (shape === 'parallelogram') {
    const b = r();
    if (measure === 'area') {
      const h = rng.int(2, Math.max(2, Math.min(max, b)));
      return { shape, measure, dims: { b, h }, value: fromInt(b * h), hidden: 'value', formula: 'A = b · h' };
    }
    const s = r();
    return { shape, measure, dims: { b, s }, value: fromInt(2 * (b + s)), hidden: 'value', formula: 'P = 2b + 2s' };
  }
  // trapezoid — area only
  if (measure !== 'area') return null;
  const b1 = r();
  let b2 = r();
  if (b2 === b1) b2 = b1 + 2;
  const h = r();
  return {
    shape,
    measure,
    dims: { b1, b2, h },
    value: frac((b1 + b2) * h, 2),
    hidden: 'value',
    formula: 'A = ½ · (b₁ + b₂) · h',
  };
}

const DIM_LABEL: Record<string, string> = {
  s: 'side s',
  l: 'length l',
  w: 'width w',
  b: 'base b',
  h: 'height h',
  a: 'side a',
  c: 'side c',
  b1: 'base b₁',
  b2: 'base b₂',
};

export const areaPerimeterPack: RelationPack<AreaPerimeterConfig> = {
  id: 'area-perimeter',
  title: 'Area & perimeter',
  blurb: 'Rectangles, squares, triangles, parallelograms, trapezoids — or find a missing side.',
  band: 'Geometry',
  slots: [
    { id: 'given', kind: 'expression', label: 'Given' },
    { id: 'answer', kind: 'rational', label: 'Answer' },
  ],
  configSchema: [
    {
      key: 'shapes',
      label: 'Shapes',
      type: 'multi-ops',
      options: ALL_SHAPES.map((s) => ({ value: s, label: s })),
      default: ALL_SHAPES,
    },
    {
      key: 'find',
      label: 'Measure',
      type: 'select',
      options: [
        { value: 'both', label: 'Area and perimeter' },
        { value: 'area', label: 'Area only' },
        { value: 'perimeter', label: 'Perimeter only' },
      ],
      default: 'both',
    },
    {
      key: 'hideMode',
      label: 'Hide',
      type: 'select',
      options: [
        { value: 'measure', label: 'The area / perimeter' },
        { value: 'dimension', label: 'A side (work backwards)' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'measure',
    },
    {
      key: 'max',
      label: 'Side size',
      type: 'range-select',
      options: [
        { value: '10', label: '≤10' },
        { value: '15', label: '≤15' },
        { value: '25', label: '≤25' },
      ],
      default: '12',
    },
  ],
  defaultConfig() {
    return { shapes: ALL_SHAPES, find: 'both', hideMode: 'measure', max: 12 };
  },
  parseConfig(raw) {
    const shapes = Array.isArray(raw.shapes)
      ? (raw.shapes.filter((s) => ALL_SHAPES.includes(s as Shape)) as Shape[])
      : ALL_SHAPES;
    const find = raw.find === 'area' || raw.find === 'perimeter' || raw.find === 'both' ? raw.find : 'both';
    const hideMode =
      raw.hideMode === 'measure' || raw.hideMode === 'dimension' || raw.hideMode === 'both'
        ? raw.hideMode
        : 'measure';
    return {
      shapes: shapes.length ? shapes : ['rectangle'],
      find,
      hideMode,
      max: Math.min(40, Math.max(4, Number(raw.max) || 12)),
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 60; i++) {
      const shape = rng.pick(config.shapes);
      const measure =
        config.find === 'both' ? (rng.bool() ? 'area' : 'perimeter') : config.find;
      const p = build(shape, measure, rng, config.max);
      if (!p) continue;
      const hideDim =
        config.hideMode === 'dimension' || (config.hideMode === 'both' && rng.bool());
      if (hideDim) {
        // hide one dimension; the answer is that dimension (always integer here)
        const keys = Object.keys(p.dims);
        p.hidden = rng.pick(keys);
      }
      const answer = p.hidden === 'value' ? p.value : fromInt(p.dims[p.hidden]!);
      return {
        slots: {
          given: { t: 'expr', v: p.formula },
          answer: { t: 'frac', v: answer },
        },
        hidden: 'answer',
        meta: { ...p },
      };
    }
    return {
      slots: {
        given: { t: 'expr', v: 'A = l · w' },
        answer: { t: 'frac', v: fromInt(24) },
      },
      hidden: 'answer',
      meta: { shape: 'rectangle', measure: 'area', dims: { l: 6, w: 4 }, value: fromInt(24), hidden: 'value', formula: 'A = l · w' },
    };
  },
  check(instance, rawInput) {
    return gradeRationalAnswer(fracSlot(instance.slots, 'answer'), rawInput, { formHints: false });
  },
  format(instance): DisplayModel {
    const m = instance.meta as unknown as Problem;
    const dims = m.dims;
    const show = (k: string) => (m.hidden === k ? '?' : String(dims[k]));
    const unitA = m.measure === 'area' ? ' (square units)' : '';
    const prompt =
      m.hidden === 'value'
        ? `Find the ${m.measure} of the ${m.shape}${unitA}`
        : `The ${m.shape} has ${m.measure} ${formatFrac(m.value)}. Find ${DIM_LABEL[m.hidden] ?? m.hidden}.`;
    const given = Object.keys(dims)
      .map((k) => `${k.replace('b1', 'b₁').replace('b2', 'b₂')} = ${show(k)}`)
      .join(',  ');
    const label = m.hidden === 'value' ? (m.measure === 'area' ? 'A = ' : 'P = ') : `${m.hidden.replace('b1', 'b₁').replace('b2', 'b₂')} = `;

    let figure: FigureSpec;
    if (m.shape === 'square') {
      figure = { kind: 'shape-2d', shape: 'square', base: dims.s!, height: dims.s!, labels: { base: show('s'), left: show('s') } };
    } else if (m.shape === 'rectangle') {
      figure = { kind: 'shape-2d', shape: 'rectangle', base: dims.l!, height: dims.w!, labels: { base: show('l'), left: show('w') } };
    } else if (m.shape === 'triangle') {
      figure =
        m.measure === 'area'
          ? { kind: 'shape-2d', shape: 'triangle', base: dims.b!, height: dims.h!, labels: { base: show('b'), height: show('h') } }
          : {
              kind: 'shape-2d',
              shape: 'triangle',
              base: dims.b!,
              height: Math.max(2, Math.min(dims.a!, dims.c!) * 0.8),
              labels: { base: show('b'), left: show('a'), right: show('c') },
            };
    } else if (m.shape === 'parallelogram') {
      figure =
        m.measure === 'area'
          ? { kind: 'shape-2d', shape: 'parallelogram', base: dims.b!, height: dims.h!, labels: { base: show('b'), height: show('h') } }
          : { kind: 'shape-2d', shape: 'parallelogram', base: dims.b!, height: dims.s! * 0.8, labels: { base: show('b'), right: show('s') } };
    } else {
      figure = {
        kind: 'shape-2d',
        shape: 'trapezoid',
        base: Math.max(dims.b1!, dims.b2!),
        top: Math.min(dims.b1!, dims.b2!),
        height: dims.h!,
        labels: {
          base: dims.b1! >= dims.b2! ? show('b1') : show('b2'),
          top: dims.b1! >= dims.b2! ? show('b2') : show('b1'),
          left: show('h'),
        },
      };
    }
    return {
      prompt,
      pieces: [
        { kind: 'text', text: `${m.formula}    ${given}    ${label}` },
        { kind: 'slot', slotId: 'answer', text: '?', hidden: true },
      ],
      figure,
    };
  },
  expectedDisplay(instance) {
    return formatFrac(fracSlot(instance.slots, 'answer'));
  },
  inputKind() {
    return 'rational';
  },
};
