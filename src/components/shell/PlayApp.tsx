import { useMemo, useState, useEffect, useCallback } from 'react';
import { getPack } from '../../lib/engine/registry';
import {
  createSession,
  submitAnswer,
  nextProblem,
  accuracy,
  type PlaySession,
} from '../../lib/engine/session';
import type { ConfigField, RelationPack } from '../../lib/engine/types';
import { withBase } from '../../lib/basePath';

type Props = { packId: string };

function loadConfig(pack: RelationPack, fields: ConfigField[]): Record<string, unknown> {
  const base = pack.defaultConfig() as Record<string, unknown>;
  try {
    const raw = localStorage.getItem(`factforge-config:${pack.id}`);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    return pack.parseConfig({ ...base, ...saved }) as Record<string, unknown>;
  } catch {
    return base;
  }
}

function ConfigForm({
  pack,
  value,
  onChange,
}: {
  pack: RelationPack;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <div className="config-grid">
      {pack.configSchema.map((field) => (
        <div className="config-field" key={field.key}>
          <label className="field-label">{field.label}</label>
          {field.type === 'multi-ops' && (
            <div className="chip-row" role="group" aria-label={field.label}>
              {(field.options ?? []).map((opt) => {
                const selected = Array.isArray(value[field.key])
                  ? (value[field.key] as string[]).includes(opt.value)
                  : false;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className="chip"
                    aria-pressed={selected}
                    onClick={() => {
                      const cur = Array.isArray(value[field.key])
                        ? [...(value[field.key] as string[])]
                        : [];
                      const next = selected
                        ? cur.filter((x) => x !== opt.value)
                        : [...cur, opt.value];
                      set(field.key, next.length ? next : [opt.value]);
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
          {(field.type === 'select' || field.type === 'range-select') && (
            <select
              className="select-input"
              value={String(value[field.key] ?? field.default)}
              onChange={(e) => {
                const v = e.target.value;
                // numeric range keys stored as numbers when they look numeric
                if (field.type === 'range-select' && /^\d+$/.test(v)) {
                  set(field.key, Number(v));
                } else {
                  set(field.key, v);
                }
              }}
            >
              {(field.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {field.type === 'toggle' && (
            <div className="chip-row">
              <button
                type="button"
                className="chip"
                aria-pressed={Boolean(value[field.key])}
                onClick={() => set(field.key, !value[field.key])}
              >
                {value[field.key] ? 'On' : 'Off'}
              </button>
            </div>
          )}
          {field.help && <p className="hint-text">{field.help}</p>}
        </div>
      ))}
    </div>
  );
}

function StatsBar({
  session,
  now,
}: {
  session: PlaySession;
  now: number;
}) {
  const elapsed = Math.max(0, Math.floor((now - session.stats.startMs) / 1000));
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <div className="stats-bar" aria-live="polite">
      <span>
        Time <strong>{m}:{String(s).padStart(2, '0')}</strong>
      </span>
      <span>
        Streak <strong>{session.stats.streak}</strong>
      </span>
      <span>
        Accuracy{' '}
        <strong>
          {accuracy(session.stats)}%
        </strong>{' '}
        ({session.stats.correct}/{session.stats.attempts})
      </span>
    </div>
  );
}

export function PlayApp({ packId }: Props) {
  const pack = useMemo(() => getPack(packId), [packId]);
  const [phase, setPhase] = useState<'config' | 'play'>('config');
  const [configRaw, setConfigRaw] = useState<Record<string, unknown>>(() =>
    pack ? (pack.defaultConfig() as Record<string, unknown>) : {},
  );
  const [session, setSession] = useState<PlaySession | null>(null);
  const [answer, setAnswer] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (!pack) return;
    setConfigRaw(loadConfig(pack, pack.configSchema));
  }, [pack]);

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = useCallback(() => {
    if (!pack) return;
    const config = pack.parseConfig(configRaw);
    try {
      localStorage.setItem(`factforge-config:${pack.id}`, JSON.stringify(config));
    } catch {
      /* ignore */
    }
    setSession(createSession(pack, config));
    setAnswer('');
    setShowAnswer(false);
    setPhase('play');
    setNow(Date.now());
  }, [pack, configRaw]);

  if (!pack) {
    return (
      <p>
        Unknown pack. <a href={withBase('/')}>Back to hub</a>
      </p>
    );
  }

  if (phase === 'config' || !session) {
    return (
      <div className="play-shell">
        <div className="play-header">
          <div>
            <p className="pack-band">{pack.band}</p>
            <h1>{pack.title}</h1>
            <p className="hint-text">{pack.blurb}</p>
          </div>
          <a href={withBase('/')}>← Hub</a>
        </div>
        <section className="panel">
          <h2>Setup</h2>
          <ConfigForm pack={pack} value={configRaw} onChange={setConfigRaw} />
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={start} data-testid="start-play">
              Start
            </button>
          </div>
        </section>
      </div>
    );
  }

  const display = pack.format(session.current);
  const last = session.lastResult;
  const canAdvance =
    last?.status === 'correct' || last?.status === 'correct_form_hint';

  const onSubmit = () => {
    if (!answer.trim()) return;
    setSession((s) => (s ? submitAnswer(s, answer) : s));
    setShowAnswer(false);
  };

  const onNext = () => {
    setSession((s) => (s ? nextProblem(s) : s));
    setAnswer('');
    setShowAnswer(false);
  };

  return (
    <div className="play-shell">
      <div className="play-header">
        <div>
          <p className="pack-band">{pack.band}</p>
          <h1>{pack.title}</h1>
        </div>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPhase('config');
              setSession(null);
            }}
          >
            Setup
          </button>
          <a className="btn btn-ghost" href={withBase('/')} style={{ textDecoration: 'none' }}>
            Hub
          </a>
        </div>
      </div>

      <StatsBar session={session} now={now} />

      <section className="panel" aria-live="polite">
        <p className="prompt">{display.prompt}</p>
        <div className="relation-display" data-testid="relation-display">
          {display.pieces.map((p, i) =>
            p.kind === 'text' ? (
              <span key={i}>{p.text}</span>
            ) : (
              <span key={i} className={p.hidden ? 'blank' : undefined}>
                {p.text}
              </span>
            ),
          )}
        </div>

        <div className="answer-row">
          <input
            className="answer-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoFocus
            placeholder="Your answer"
            value={answer}
            data-testid="answer-input"
            disabled={canAdvance}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canAdvance) onNext();
                else onSubmit();
              }
            }}
          />
          {!canAdvance ? (
            <button
              type="button"
              className="btn btn-primary"
              data-testid="submit-answer"
              onClick={onSubmit}
            >
              Check
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              data-testid="next-problem"
              onClick={onNext}
            >
              Next
            </button>
          )}
        </div>

        {last && (
          <div className={`feedback ${last.status}`} data-testid="feedback">
            {last.message}
            {last.expectedDisplay && last.status !== 'correct' && (
              <div className="hint-text">Expected: {last.expectedDisplay}</div>
            )}
          </div>
        )}

        <div className="btn-row" style={{ justifyContent: 'center' }}>
          {!canAdvance && last?.status === 'incorrect' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowAnswer(true)}
            >
              Show answer
            </button>
          )}
          {showAnswer && (
            <span className="mono" style={{ color: 'var(--fg-dim)' }}>
              {pack.expectedDisplay(session.current, session.config)}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
