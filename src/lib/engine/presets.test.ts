import { describe, expect, it } from 'vitest';
import {
  encodeConfigParam,
  decodeConfigParam,
  parsePresetJson,
  stringifyPreset,
  toPresetDocument,
  packPresetPath,
  readPresetFromSearch,
} from './presets';

describe('presets', () => {
  it('round-trips config via base64url', () => {
    const config = { ops: ['+', '*'], max: 12, hideMode: 'both' };
    const enc = encodeConfigParam(config);
    expect(enc).not.toMatch(/[+/=]/);
    expect(decodeConfigParam(enc)).toEqual(config);
  });

  it('parses JSON preset documents', () => {
    const doc = toPresetDocument('integer-ops', { max: 10 });
    const text = stringifyPreset(doc);
    const back = parsePresetJson(text);
    expect(back).toEqual(doc);
    expect(parsePresetJson('{bad')).toBeNull();
    expect(parsePresetJson('{"v":2,"packId":"x","config":{}}')).toBeNull();
  });

  it('builds pack paths and reads search', () => {
    const path = packPresetPath('fraction-ops', { maxDenom: 5 }, { play: true });
    expect(path).toMatch(/^\/play\/fraction-ops\?c=/);
    expect(path).toContain('play=1');
    const q = path.split('?')[1]!;
    const { config, autoPlay } = readPresetFromSearch(q);
    expect(autoPlay).toBe(true);
    expect(config).toEqual({ maxDenom: 5 });
  });
});
