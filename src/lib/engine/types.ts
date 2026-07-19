import type { Frac } from '../math/frac';
import type { Rng } from '../math/rng';

export type SlotKind =
  | 'rational'
  | 'integer'
  | 'operator'
  | 'expression'
  | 'choice';

export type SlotDef = {
  id: string;
  kind: SlotKind;
  label: string;
  /** For choice slots (ops, etc.) */
  choices?: { value: string; label: string }[];
};

export type CheckStatus =
  | 'correct'
  | 'correct_form_hint'
  | 'incorrect'
  | 'parse_error';

export type CheckResult = {
  status: CheckStatus;
  message: string;
  /** Canonical answer display when wrong or form-hinted */
  expectedDisplay?: string;
};

export type ConfigFieldType =
  | 'multi-ops'
  | 'select'
  | 'toggle'
  | 'range-select';

export type ConfigField = {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: { value: string; label: string }[];
  default: unknown;
  help?: string;
};

/** Opaque slot values — packs own the structure. */
export type SlotValue =
  | { t: 'frac'; v: Frac }
  | { t: 'int'; v: number }
  | { t: 'op'; v: string }
  | { t: 'expr'; v: string; meta?: unknown }
  | { t: 'choice'; v: string };

export type Instance = {
  /** All slot values for a valid relation. */
  slots: Record<string, SlotValue>;
  /** Which slot is hidden for this problem. */
  hidden: string;
  /** Optional pack-specific metadata (e.g. true factors). */
  meta?: Record<string, unknown>;
};

export type DisplayPiece =
  | { kind: 'text'; text: string }
  | { kind: 'slot'; slotId: string; text: string; hidden: boolean };

/**
 * Optional static diagram for geometry packs.
 * Measures may be floats for layout only; grading stays exact integers.
 */
export type FigureSpec =
  | {
      kind: 'triangle-angles';
      /** Labels shown at vertices (use '?' for hidden). */
      labels: { A: string; B: string; C: string };
      /** Interior angles in degrees (for SVG layout). */
      measures: { A: number; B: number; C: number };
    }
  | {
      kind: 'linear-pair';
      leftLabel: string;
      rightLabel: string;
      leftDeg: number;
      rightDeg: number;
    }
  | {
      kind: 'vertical-angles';
      /** Opposite pair 1, opposite pair 2, and the two adjacent (linear) labels. */
      labels: { opp1: string; opp2: string; adj1: string; adj2: string };
      line1Deg: number;
      line2Deg: number;
    }
  | {
      kind: 'complementary';
      aLabel: string;
      bLabel: string;
      aDeg: number;
      bDeg: number;
    }
  | {
      kind: 'exterior-angle';
      labels: { A: string; B: string; E: string };
      measures: { A: number; B: number; C: number; E: number };
    }
  | {
      kind: 'parallel-transversal';
      /** Interior angles at the two intersections (left/right). */
      labels: { A: string; B: string; C: string; D: string };
      seedDeg: number;
    }
  | {
      kind: 'circle-rd';
      rLabel: string;
      dLabel: string;
      showR: boolean;
      showD: boolean;
    }
  | {
      kind: 'line-2d';
      /** Line as y = mx + b (float for draw only). */
      lines: { m: number; b: number; color?: string }[];
      /** Optional intersection / point markers. */
      points?: { x: number; y: number; label?: string }[];
      xMin?: number;
      xMax?: number;
      yMin?: number;
      yMax?: number;
    }
  | {
      kind: 'unit-circle';
      deg: number;
      fn: string;
    }
  | {
      kind: 'right-triangle';
      adj: number;
      opp: number;
      hyp: number;
      thetaDeg: number;
      hideTheta?: boolean;
      /** Hide θ label entirely (Pythagorean / pure side problems). */
      omitTheta?: boolean;
      /** Override default adj/opp/hyp captions (e.g. side lengths). */
      sideCaptions?: { adj: string; opp: string; hyp: string };
    };

/** Optional choice chip for packs with inputKind === 'choice'. */
export type AnswerChoice = { value: string; label: string };

export type DisplayModel = {
  pieces: DisplayPiece[];
  prompt: string;
  figure?: FigureSpec;
};

export type RelationPack<C extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  title: string;
  blurb: string;
  /** Hub badge, e.g. "Arithmetic" */
  band: string;
  slots: SlotDef[];
  configSchema: ConfigField[];
  defaultConfig(): C;
  parseConfig(raw: Record<string, unknown>): C;
  generate(config: C, rng: Rng): Instance;
  check(instance: Instance, rawInput: string, config: C): CheckResult;
  format(instance: Instance): DisplayModel;
  /** Expected answer for "show answer" / form hint target. */
  expectedDisplay(instance: Instance, config: C): string;
  /** Input kind for the current hidden slot. */
  inputKind(instance: Instance): SlotKind;
  /** Choice chips when inputKind is 'choice' (optional). */
  answerChoices?(instance: Instance): AnswerChoice[];
};

export type SessionStats = {
  startMs: number;
  correct: number;
  attempts: number;
  streak: number;
  maxStreak: number;
  formHints: number;
};
