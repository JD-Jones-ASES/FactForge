import type { CheckResult, Instance, RelationPack, SessionStats } from './types';
import { createRng, type Rng } from '../math/rng';

export type PlaySession<C extends Record<string, unknown> = Record<string, unknown>> = {
  pack: RelationPack<C>;
  config: C;
  stats: SessionStats;
  current: Instance;
  lastResult: CheckResult | null;
  rng: Rng;
};

export function createSession<C extends Record<string, unknown>>(
  pack: RelationPack<C>,
  config: C,
  seed?: number,
): PlaySession<C> {
  const rng = createRng(seed ?? Date.now() >>> 0);
  return {
    pack,
    config,
    stats: {
      startMs: Date.now(),
      correct: 0,
      attempts: 0,
      streak: 0,
      maxStreak: 0,
      formHints: 0,
    },
    current: pack.generate(config, rng),
    lastResult: null,
    rng,
  };
}

export function submitAnswer<C extends Record<string, unknown>>(
  session: PlaySession<C>,
  rawInput: string,
): PlaySession<C> {
  const result = session.pack.check(session.current, rawInput, session.config);
  const stats = { ...session.stats, attempts: session.stats.attempts + 1 };

  if (result.status === 'correct' || result.status === 'correct_form_hint') {
    stats.correct += 1;
    stats.streak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    if (result.status === 'correct_form_hint') stats.formHints += 1;
  } else if (result.status === 'incorrect') {
    stats.streak = 0;
  }
  // parse_error: no streak break, no attempt credit for wrong math — still counts as attempt

  return {
    ...session,
    stats,
    lastResult: result,
  };
}

export function nextProblem<C extends Record<string, unknown>>(
  session: PlaySession<C>,
): PlaySession<C> {
  return {
    ...session,
    current: session.pack.generate(session.config, session.rng),
    lastResult: null,
  };
}

export function accuracy(stats: SessionStats): number {
  if (stats.attempts === 0) return 0;
  return Math.round((100 * stats.correct) / stats.attempts);
}
