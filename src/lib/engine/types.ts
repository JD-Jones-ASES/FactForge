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

export type DisplayModel = {
  pieces: DisplayPiece[];
  prompt: string;
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
};

export type SessionStats = {
  startMs: number;
  correct: number;
  attempts: number;
  streak: number;
  maxStreak: number;
  formHints: number;
};
