/**
 * Shareable pack presets — URL query + JSON, fully static (no server).
 *
 * Query shape on /play/[packId]:
 *   ?c=<base64url JSON of config>
 *   &play=1   → skip setup and start immediately
 *
 * JSON export: { packId, config, v: 1 }
 */

export type PresetDocument = {
  v: 1;
  packId: string;
  config: Record<string, unknown>;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(bin)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  if (typeof atob !== 'undefined') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export function encodeConfigParam(config: Record<string, unknown>): string {
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeConfigParam(param: string): Record<string, unknown> | null {
  try {
    const bytes = base64UrlToBytes(param.trim());
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json) as unknown;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    return obj as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function toPresetDocument(
  packId: string,
  config: Record<string, unknown>,
): PresetDocument {
  return { v: 1, packId, config };
}

export function stringifyPreset(doc: PresetDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parsePresetJson(text: string): PresetDocument | null {
  try {
    const obj = JSON.parse(text) as Partial<PresetDocument>;
    if (!obj || typeof obj !== 'object') return null;
    if (obj.v !== 1) return null;
    if (typeof obj.packId !== 'string' || !obj.packId) return null;
    if (!obj.config || typeof obj.config !== 'object' || Array.isArray(obj.config))
      return null;
    return {
      v: 1,
      packId: obj.packId,
      config: obj.config as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

/** Build path+query for a pack preset (root-app path; call withBase at render). */
export function packPresetPath(
  packId: string,
  config: Record<string, unknown>,
  opts?: { play?: boolean },
): string {
  const c = encodeConfigParam(config);
  const play = opts?.play ? '&play=1' : '';
  return `/play/${packId}?c=${encodeURIComponent(c)}${play}`;
}

export function readPresetFromSearch(
  search: string,
): { config: Record<string, unknown> | null; autoPlay: boolean } {
  const q = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const c = q.get('c');
  const config = c ? decodeConfigParam(c) : null;
  const autoPlay = q.get('play') === '1' || q.get('play') === 'true';
  return { config, autoPlay };
}
