import { parseRational, type ParseRationalResult } from './frac';

/** Parse angle input: optional degree symbol, whitespace. */
export function parseAngleInput(raw: string): ParseRationalResult {
  const s = raw.trim().replace(/°/g, '').replace(/\s+/g, '');
  return parseRational(s);
}
