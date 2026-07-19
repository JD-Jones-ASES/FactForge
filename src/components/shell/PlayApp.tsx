import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { getPack } from '../../lib/engine/registry';
import {
  createSession,
  submitAnswer,
  nextProblem,
  accuracy,
  type PlaySession,
} from '../../lib/engine/session';
import type { RelationPack } from '../../lib/engine/types';
import {
  encodeConfigParam,
  parsePresetJson,
  readPresetFromSearch,
} from '../../lib/engine/presets';
import { withBase } from '../../lib/basePath';
import { ConfigForm } from './ConfigForm';
import { ShareBar } from './ShareBar';
import { FigureView } from '../display/FigureView';
import { AnswerInsertBar } from '../inputs/AnswerInsertBar';
import { applyInsert, insertsFor } from '../../lib/engine/inserts';

type Props = { packId: string };

function loadStoredConfig(pack: RelationPack): Record<string, unknown> {
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

function StatsBar({ session, now }: { session: PlaySession; now: number }) {
  const elapsed = Math.max(0, Math.floor((now - session.stats.startMs) / 1000));
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <div className="stats-bar" aria-live="polite">
      <span>
        Time <strong>{`${m}:${String(s).padStart(2, '0')}`}</strong>
      </span>
      <span>
        Streak <strong>{session.stats.streak}</strong>
      </span>
      <span>
        Accuracy <strong>{accuracy(session.stats)}%</strong> (
        {session.stats.correct}/{session.stats.attempts})
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
  const [bootstrapped, setBootstrapped] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const answerRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const showAnswerRef = useRef<HTMLButtonElement>(null);

  const startWithConfig = useCallback(
    (config: Record<string, unknown>) => {
      if (!pack) return;
      const parsed = pack.parseConfig(config);
      try {
        localStorage.setItem(
          `factforge-config:${pack.id}`,
          JSON.stringify(parsed),
        );
      } catch {
        /* ignore */
      }
      setConfigRaw(parsed as Record<string, unknown>);
      setSession(createSession(pack, parsed));
      setAnswer('');
      setShowAnswer(false);
      setPhase('play');
      setNow(Date.now());
    },
    [pack],
  );

  useEffect(() => {
    if (!pack || bootstrapped) return;
    const { config: urlConfig, autoPlay } = readPresetFromSearch(
      window.location.search,
    );
    let next = loadStoredConfig(pack);
    if (urlConfig) {
      next = pack.parseConfig({
        ...(pack.defaultConfig() as Record<string, unknown>),
        ...urlConfig,
      }) as Record<string, unknown>;
    }
    setConfigRaw(next);
    setBootstrapped(true);
    if (autoPlay && urlConfig) {
      queueMicrotask(() => startWithConfig(next));
    }
  }, [pack, bootstrapped, startWithConfig]);

  useEffect(() => {
    if (!pack || !bootstrapped || phase !== 'config') return;
    const c = encodeConfigParam(
      pack.parseConfig(configRaw) as Record<string, unknown>,
    );
    const url = new URL(window.location.href);
    url.searchParams.set('c', c);
    url.searchParams.delete('play');
    window.history.replaceState({}, '', url.toString());
  }, [pack, configRaw, bootstrapped, phase]);

  useEffect(() => {
    if (phase !== 'play') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const canAdvance =
    session?.lastResult?.status === 'correct' ||
    session?.lastResult?.status === 'correct_form_hint';

  useEffect(() => {
    if (phase !== 'play' || !session) return;
    const last = session.lastResult;
    if (
      last &&
      (last.status === 'correct' || last.status === 'correct_form_hint')
    ) {
      nextRef.current?.focus();
      return;
    }
    answerRef.current?.focus();
    if (last?.status === 'incorrect' || last?.status === 'parse_error') {
      answerRef.current?.select();
    }
  }, [phase, session?.current, session?.lastResult, session?.stats.attempts]);

  useEffect(() => {
    if (phase === 'config' && bootstrapped) {
      startRef.current?.focus();
    }
  }, [phase, bootstrapped]);

  const onSubmitAnswer = useCallback(() => {
    if (!answer.trim()) return;
    setSession((s) => (s ? submitAnswer(s, answer) : s));
    setShowAnswer(false);
  }, [answer]);

  const onNext = useCallback(() => {
    setSession((s) => (s ? nextProblem(s) : s));
    setAnswer('');
    setShowAnswer(false);
  }, []);

  const goSetup = useCallback(() => {
    setPhase('config');
    setSession(null);
    setAnswer('');
    setShowAnswer(false);
  }, []);

  const onPlayKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (answer.trim() && !canAdvance) {
        setAnswer('');
        answerRef.current?.focus();
      } else {
        goSetup();
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      if (canAdvance) onNext();
      else if (answer.trim()) onSubmitAnswer();
    }
    if (
      e.key === '?' &&
      !canAdvance &&
      session?.lastResult?.status === 'incorrect'
    ) {
      if (!(e.target as HTMLElement).matches('input, textarea')) {
        setShowAnswer(true);
      }
    }
  };

  const onImport = () => {
    if (!pack) return;
    const doc = parsePresetJson(importText);
    if (!doc) {
      setImportMsg('Invalid preset JSON');
      return;
    }
    if (doc.packId !== pack.id) {
      setImportMsg(`This JSON is for pack “${doc.packId}”`);
      return;
    }
    const parsed = pack.parseConfig(doc.config) as Record<string, unknown>;
    setConfigRaw(parsed);
    setImportMsg('Preset applied');
    setImportText('');
  };

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
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              startWithConfig(configRaw);
            }}
          >
            <ConfigForm
              pack={pack}
              value={configRaw}
              onChange={setConfigRaw}
              idPrefix="play"
            />
            <p className="kbd-hint">
              <kbd>Tab</kbd> moves · <kbd>Space</kbd> toggles chips ·{' '}
              <kbd>Enter</kbd> starts
            </p>
            <div className="btn-row">
              <button
                ref={startRef}
                type="submit"
                className="btn btn-primary"
                data-testid="start-play"
              >
                Start
              </button>
            </div>
          </form>
          <ShareBar
            packId={pack.id}
            config={pack.parseConfig(configRaw) as Record<string, unknown>}
          />
          <details className="import-details">
            <summary>Import JSON preset</summary>
            <textarea
              className="import-area"
              rows={4}
              placeholder='{ "v": 1, "packId": "…", "config": { … } }'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              aria-label="Preset JSON"
            />
            <div className="btn-row">
              <button type="button" className="btn btn-ghost" onClick={onImport}>
                Apply
              </button>
              {importMsg && <span className="hint-text">{importMsg}</span>}
            </div>
          </details>
        </section>
      </div>
    );
  }

  const display = pack.format(session.current);
  const last = session.lastResult;
  const parsedConfig = pack.parseConfig(configRaw) as Record<string, unknown>;
  const inputKind = pack.inputKind(session.current);
  const insertTokens = insertsFor(pack.id, inputKind);
  const choices =
    inputKind === 'choice' && pack.answerChoices
      ? pack.answerChoices(session.current)
      : null;

  const insertToken = (token: string) => {
    const el = answerRef.current;
    const start = el?.selectionStart ?? answer.length;
    const end = el?.selectionEnd ?? answer.length;
    const { value: next, caret } = applyInsert(answer, start, end, token);
    setAnswer(next);
    requestAnimationFrame(() => {
      const input = answerRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="play-shell" onKeyDown={onPlayKeyDown}>
      <div className="play-header">
        <div>
          <p className="pack-band">{pack.band}</p>
          <h1>{pack.title}</h1>
        </div>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-ghost" onClick={goSetup}>
            Setup
          </button>
          <a
            className="btn btn-ghost"
            href={withBase('/')}
            style={{ textDecoration: 'none' }}
          >
            Hub
          </a>
        </div>
      </div>

      <StatsBar session={session} now={now} />
      <ShareBar packId={pack.id} config={parsedConfig} />

      <section className="panel" aria-live="polite">
        <p className="prompt">{display.prompt}</p>
        {display.figure && <FigureView figure={display.figure} />}
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

        {choices && choices.length > 0 ? (
          <div
            className="choice-bar"
            role="listbox"
            aria-label="Answer choices"
            data-testid="choice-bar"
          >
            {choices.map((c) => (
              <button
                key={c.value}
                type="button"
                role="option"
                className="chip"
                aria-selected={answer === c.value}
                disabled={!!canAdvance}
                onClick={() => {
                  setAnswer(c.value);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <AnswerInsertBar
            tokens={insertTokens}
            disabled={!!canAdvance}
            onInsert={insertToken}
          />
        )}

        <div className="answer-row">
          <input
            ref={answerRef}
            className="answer-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              choices ? 'Pick a chip or type…' : 'Your answer'
            }
            value={answer}
            data-testid="answer-input"
            disabled={!!canAdvance}
            aria-label="Answer"
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canAdvance) onNext();
                else onSubmitAnswer();
              }
            }}
          />
          {!canAdvance ? (
            <button
              type="button"
              className="btn btn-primary"
              data-testid="submit-answer"
              onClick={onSubmitAnswer}
            >
              Check
            </button>
          ) : (
            <button
              ref={nextRef}
              type="button"
              className="btn btn-primary"
              data-testid="next-problem"
              onClick={onNext}
            >
              Next
            </button>
          )}
        </div>

        <p className="kbd-hint">
          <kbd>Enter</kbd> {canAdvance ? 'next problem' : 'check answer'} ·{' '}
          <kbd>Esc</kbd> {answer.trim() && !canAdvance ? 'clear' : 'setup'}
          {!canAdvance && last?.status === 'incorrect' ? (
            <>
              {' '}
              · <kbd>?</kbd> show answer
            </>
          ) : null}
        </p>

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
              ref={showAnswerRef}
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
