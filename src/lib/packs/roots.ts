import type { RelationPack, DisplayModel } from '../engine/types';
import {
  type Frac,
  fromInt,
  formatFrac,
  parseRational,
  gradeRational,
  type Rng,
} from '../math';

/**
 * Dual of powers: ⁿ√radicand = root  ⇔  root^index = radicand (exact integers).
 */
export type RootsConfig = {
  maxRoot: number;
  maxIndex: number;
  hideMode: 'root' | 'radicand' | 'index' | 'both';
};

function ipow(base: number, exp: number): number | null {
  if (exp < 0) return null;
  let r = 1;
  for (let i = 0; i < exp; i++) {
    r *= base;
    if (!Number.isSafeInteger(r)) return null;
  }
  return r;
}

/** Unicode superscript digits for nth-root index (not “3√” multiplication). */
const SUP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '−': '⁻',
  '-': '⁻',
};

function toSuperscript(s: string): string {
  return [...s].map((ch) => SUP[ch] ?? ch).join('');
}

/**
 * Principal nth root as unicode (never bare `3√` which reads as 3×√).
 * ² → √, ³ → ∛, ⁴ → ∜, else superscript-index + √.
 */
export function radicalText(index: Frac, radicandText: string): string {
  if (index.d !== 1) {
    return `${toSuperscript(formatFrac(index))}√${radicandText}`;
  }
  if (index.n === 2) return `√${radicandText}`;
  if (index.n === 3) return `∛${radicandText}`;
  if (index.n === 4) return `∜${radicandText}`;
  return `${toSuperscript(String(index.n))}√${radicandText}`;
}

export const rootsPack: RelationPack<RootsConfig> = {
  id: 'roots',
  title: 'Roots',
  blurb: 'Exact roots: ⁿ√a = b. Dual of the powers pack.',
  band: 'Algebra',
  slots: [
    { id: 'index', kind: 'integer', label: 'Index' },
    { id: 'radicand', kind: 'integer', label: 'Radicand' },
    { id: 'root', kind: 'integer', label: 'Root' },
  ],
  configSchema: [
    {
      key: 'maxRoot',
      label: 'Max |root|',
      type: 'range-select',
      options: [
        { value: '5', label: '≤5' },
        { value: '8', label: '≤8' },
        { value: '12', label: '≤12' },
      ],
      default: '8',
    },
    {
      key: 'maxIndex',
      label: 'Max index n',
      type: 'range-select',
      options: [
        { value: '3', label: '≤3 (√, ∛)' },
        { value: '4', label: '≤4' },
        { value: '5', label: '≤5' },
      ],
      default: '3',
    },
    {
      key: 'hideMode',
      label: 'Hide',
      type: 'select',
      options: [
        { value: 'root', label: 'Root only (evaluate)' },
        { value: 'radicand', label: 'Radicand only' },
        { value: 'index', label: 'Index only' },
        { value: 'both', label: 'Mix' },
      ],
      default: 'both',
    },
  ],
  defaultConfig() {
    return { maxRoot: 8, maxIndex: 3, hideMode: 'both' };
  },
  parseConfig(raw) {
    const hideMode =
      raw.hideMode === 'root' ||
      raw.hideMode === 'radicand' ||
      raw.hideMode === 'index' ||
      raw.hideMode === 'both'
        ? raw.hideMode
        : 'both';
    return {
      maxRoot: Math.min(20, Math.max(2, Number(raw.maxRoot) || 8)),
      maxIndex: Math.min(6, Math.max(2, Number(raw.maxIndex) || 3)),
      hideMode,
    };
  },
  generate(config, rng) {
    for (let i = 0; i < 50; i++) {
      const root = rng.int(2, config.maxRoot);
      const index = rng.int(2, config.maxIndex);
      const radicand = ipow(root, index);
      if (radicand === null) continue;

      const hidden: string =
        config.hideMode === 'both'
          ? rng.pick(['root', 'radicand', 'index'] as const)
          : config.hideMode;

      return {
        slots: {
          index: { t: 'frac', v: fromInt(index) },
          radicand: { t: 'frac', v: fromInt(radicand) },
          root: { t: 'frac', v: fromInt(root) },
        },
        hidden,
        meta: { index, radicand, root },
      };
    }
    return {
      slots: {
        index: { t: 'frac', v: fromInt(2) },
        radicand: { t: 'frac', v: fromInt(49) },
        root: { t: 'frac', v: fromInt(7) },
      },
      hidden: 'root',
      meta: { index: 2, radicand: 49, root: 7 },
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
    if (instance.hidden === 'root') {
      const index = (instance.slots.index as { v: Frac }).v.n;
      const rad = (instance.slots.radicand as { v: Frac }).v.n;
      if (parsed.value.d === 1) {
        const g = parsed.value.n;
        if (g > 0 && ipow(g, index) === rad) {
          return { status: 'correct', message: 'Correct' };
        }
      }
    }
    if (instance.hidden === 'radicand') {
      const index = (instance.slots.index as { v: Frac }).v.n;
      const root = (instance.slots.root as { v: Frac }).v.n;
      if (parsed.value.d === 1 && ipow(root, index) === parsed.value.n) {
        return { status: 'correct', message: 'Correct' };
      }
    }
    return {
      status: 'incorrect',
      message: 'Not quite',
      expectedDisplay: formatFrac(expected),
    };
  },
  format(instance): DisplayModel {
    const index = (instance.slots.index as { v: Frac }).v;
    const radicand = (instance.slots.radicand as { v: Frac }).v;
    const root = (instance.slots.root as { v: Frac }).v;
    const h = instance.hidden;
    const radStr = formatFrac(radicand);
    const rootStr = formatFrac(root);

    if (h === 'index') {
      return {
        prompt: 'Find the index n on the radical (ⁿ√a = b)',
        pieces: [
          { kind: 'text', text: 'ⁿ√' },
          { kind: 'slot', slotId: 'radicand', text: radStr, hidden: false },
          { kind: 'text', text: ' = ' },
          { kind: 'slot', slotId: 'root', text: rootStr, hidden: false },
        ],
      };
    }

    if (h === 'radicand') {
      return {
        prompt: 'Find the radicand',
        pieces: [
          {
            kind: 'slot',
            slotId: 'expr',
            text: radicalText(index, '?'),
            hidden: true,
          },
          { kind: 'text', text: ' = ' },
          { kind: 'slot', slotId: 'root', text: rootStr, hidden: false },
        ],
      };
    }

    // hide root
    return {
      prompt: 'Evaluate the root',
      pieces: [
        {
          kind: 'slot',
          slotId: 'expr',
          text: radicalText(index, radStr),
          hidden: false,
        },
        { kind: 'text', text: ' = ' },
        { kind: 'slot', slotId: 'root', text: '?', hidden: true },
      ],
    };
  },
  expectedDisplay(instance) {
    return formatFrac((instance.slots[instance.hidden] as { v: Frac }).v);
  },
  inputKind() {
    return 'integer';
  },
};
