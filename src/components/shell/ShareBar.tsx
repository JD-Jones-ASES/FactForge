import { useState } from 'react';
import {
  packPresetPath,
  stringifyPreset,
  toPresetDocument,
} from '../../lib/engine/presets';
import { withBase } from '../../lib/basePath';

export function ShareBar({
  packId,
  config,
}: {
  packId: string;
  config: Record<string, unknown>;
}) {
  const [note, setNote] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(null), 2000);
  };

  const copyLink = async (play: boolean) => {
    const path = packPresetPath(packId, config, { play });
    const url = `${window.location.origin}${withBase(path)}`;
    try {
      await navigator.clipboard.writeText(url);
      flash(play ? 'Play link copied' : 'Setup link copied');
    } catch {
      flash('Could not copy — select from address bar');
    }
  };

  const copyJson = async () => {
    const doc = toPresetDocument(packId, config);
    try {
      await navigator.clipboard.writeText(stringifyPreset(doc));
      flash('JSON preset copied');
    } catch {
      flash('Could not copy JSON');
    }
  };

  return (
    <div className="share-bar">
      <span className="share-label">Share</span>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => copyLink(false)}
      >
        Setup link
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => copyLink(true)}
      >
        Play link
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copyJson}>
        JSON
      </button>
      {note && (
        <span className="share-note" role="status">
          {note}
        </span>
      )}
    </div>
  );
}
