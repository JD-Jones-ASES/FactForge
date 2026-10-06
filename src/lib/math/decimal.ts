import { type Frac, frac } from './frac';

/** True when a/b has a terminating decimal expansion (denominator 2ᵃ·5ᵇ). */
export function isTerminating(f: Frac): boolean {
  let d = f.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

/** Number of decimal places needed for an exact expansion (null if repeating). */
export function decimalPlaces(f: Frac): number | null {
  if (!isTerminating(f)) return null;
  let d = f.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) {
    d /= 2;
    twos++;
  }
  while (d % 5 === 0) {
    d /= 5;
    fives++;
  }
  return Math.max(twos, fives);
}

/**
 * Exact decimal string for a terminating rational ("0.75", "−3.2", "12").
 * `minPlaces` pads with zeros (useful for money-like displays).
 */
export function formatDecimal(f: Frac, minPlaces = 0): string {
  const places = decimalPlaces(f);
  if (places === null) throw new Error('formatDecimal: repeating decimal');
  const k = Math.max(places, minPlaces);
  const scale = 10 ** k;
  const scaled = Math.round((Math.abs(f.n) * scale) / f.d);
  const whole = Math.floor(scaled / scale);
  const fracPart = scaled % scale;
  const sign = f.n < 0 ? '−' : '';
  if (k === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${String(fracPart).padStart(k, '0')}`;
}

/** Build a fraction from a decimal with `places` digits after the point. */
export function fromDecimalDigits(scaledInt: number, places: number): Frac {
  return frac(scaledInt, 10 ** places);
}

/** Count digits after the decimal point in a plain decimal string. */
export function countPlaces(s: string): number {
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}
