import { describe, expect, it } from 'vitest';
import {
  parseApproxNumber,
  gradeApprox,
  formatTenths,
} from './approx';

describe('approx grading', () => {
  it('parses decimals', () => {
    expect(parseApproxNumber('3.5').ok && parseApproxNumber('3.5').value).toBe(
      3.5,
    );
    expect(parseApproxNumber('−2.1').ok && parseApproxNumber('−2.1').value).toBe(
      -2.1,
    );
  });

  it('uses ±0.05 band', () => {
    expect(gradeApprox(3.5, 3.45)).toBe(true);
    expect(gradeApprox(3.5, 3.56)).toBe(false);
  });

  it('formats tenths', () => {
    expect(formatTenths(3.14159)).toBe('3.1');
  });
});
