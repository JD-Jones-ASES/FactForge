import { useEffect, useState } from 'react';
import { withBase } from '../../lib/basePath';
import { LAST_PACK_KEY } from '../../lib/engine/hubMeta';
import { getPack } from '../../lib/engine/registry';

/**
 * Client-only hub chrome: resume last pack from localStorage.
 */
export function HubExtras() {
  const [last, setLast] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    try {
      const id = localStorage.getItem(LAST_PACK_KEY);
      if (!id) return;
      const pack = getPack(id);
      if (pack) setLast({ id: pack.id, title: pack.title });
    } catch {
      /* ignore */
    }
  }, []);

  if (!last) return null;

  return (
    <p className="hub-resume" data-testid="hub-resume">
      <span className="hub-resume-label">Resume</span>{' '}
      <a href={withBase(`/play/${last.id}`)}>{last.title}</a>
    </p>
  );
}
