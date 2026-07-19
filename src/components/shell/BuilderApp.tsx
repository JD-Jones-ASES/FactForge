import { useMemo, useState } from 'react';
import { listPacks, getPack } from '../../lib/engine/registry';
import {
  packPresetPath,
  stringifyPreset,
  toPresetDocument,
} from '../../lib/engine/presets';
import { withBase } from '../../lib/basePath';
import { ConfigForm } from './ConfigForm';

/**
 * Light snap-together UI: pick pack + knobs → shareable setup/play links + JSON.
 */
export function BuilderApp() {
  const packs = useMemo(() => listPacks(), []);
  const [packId, setPackId] = useState(packs[0]?.id ?? 'integer-ops');
  const pack = getPack(packId)!;
  const [configRaw, setConfigRaw] = useState<Record<string, unknown>>(
    () => pack.defaultConfig() as Record<string, unknown>,
  );
  const [note, setNote] = useState<string | null>(null);

  const onPickPack = (id: string) => {
    const p = getPack(id);
    if (!p) return;
    setPackId(id);
    setConfigRaw(p.defaultConfig() as Record<string, unknown>);
  };

  const config = pack.parseConfig(configRaw) as Record<string, unknown>;
  const setupPath = packPresetPath(packId, config, { play: false });
  const playPath = packPresetPath(packId, config, { play: true });
  const json = stringifyPreset(toPresetDocument(packId, config));

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(null), 2000);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} copied`);
    } catch {
      flash('Copy failed');
    }
  };

  return (
    <div className="play-shell">
      <div className="play-header">
        <div>
          <p className="pack-band">Builder</p>
          <h1>Snap a custom drill</h1>
          <p className="hint-text">
            Pick a pack, set knobs, export a setup or play link. Fully static —
            the URL is the game.
          </p>
        </div>
        <a href={withBase('/')}>← Hub</a>
      </div>

      <section className="panel">
        <h2>1 · Pack</h2>
        <div className="chip-row" role="listbox" aria-label="Pack">
          {packs.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={p.id === packId}
              onClick={() => onPickPack(p.id)}
            >
              {p.title}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>2 · Knobs</h2>
        <ConfigForm
          pack={pack}
          value={configRaw}
          onChange={setConfigRaw}
          idPrefix="builder"
        />
      </section>

      <section className="panel">
        <h2>3 · Export</h2>
        <div className="btn-row">
          <a className="btn btn-primary" href={withBase(playPath)}>
            Open play link
          </a>
          <a className="btn btn-ghost" href={withBase(setupPath)}>
            Open setup
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              copy(`${window.location.origin}${withBase(playPath)}`, 'Play URL')
            }
          >
            Copy play URL
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => copy(json, 'JSON')}
          >
            Copy JSON
          </button>
        </div>
        {note && (
          <p className="share-note" role="status">
            {note}
          </p>
        )}
        <pre
          className="import-area"
          style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}
        >
          {json}
        </pre>
        <p className="kbd-hint">
          Play URLs use <code className="mono">?c=…&amp;play=1</code> — same
          codec as in-pack Share.
        </p>
      </section>
    </div>
  );
}
