import { frac, type Frac, formatFrac, eq, parseRational } from './frac';

/** Value of the form q · π (or plain rational if hasPi is false). */
export type PiExpr = { coeff: Frac; hasPi: boolean };

export function formatPiExpr(e: PiExpr): string {
  if (!e.hasPi) return formatFrac(e.coeff);
  if (e.coeff.n === 0) return '0';
  if (e.coeff.n === 1 && e.coeff.d === 1) return 'π';
  if (e.coeff.n === -1 && e.coeff.d === 1) return '−π';
  return `${formatFrac(e.coeff)}π`;
}

export function piExpr(coeff: Frac | number, hasPi = true): PiExpr {
  const c = typeof coeff === 'number' ? frac(coeff, 1) : coeff;
  return { coeff: c, hasPi };
}

export function eqPi(a: PiExpr, b: PiExpr): boolean {
  return a.hasPi === b.hasPi && eq(a.coeff, b.coeff);
}

/**
 * Parse kπ / k*pi / pi / rational.
 * Does not accept decimal approximations of π.
 */
export function parsePiExpr(
  input: string,
): { ok: true; value: PiExpr } | { ok: false; message: string } {
  let s = input
    .trim()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/π/g, 'pi')
    .toLowerCase();
  if (!s) return { ok: false, message: 'Enter a value (use π for pi)' };

  if (s === 'pi' || s === '+pi') return { ok: true, value: piExpr(1, true) };
  if (s === '-pi') return { ok: true, value: piExpr(-1, true) };

  // k*pi or kpi
  const kpi = s.match(/^([+-]?\d+(?:\/\d+)?)\*?pi$/);
  if (kpi) {
    const r = parseRational(kpi[1]!);
    if (!r.ok) return { ok: false, message: r.message };
    return { ok: true, value: { coeff: r.value, hasPi: true } };
  }

  // pi*k
  const pik = s.match(/^pi\*?([+-]?\d+(?:\/\d+)?)$/);
  if (pik) {
    const r = parseRational(pik[1]!);
    if (!r.ok) return { ok: false, message: r.message };
    return { ok: true, value: { coeff: r.value, hasPi: true } };
  }

  // plain rational (no pi)
  const r = parseRational(s);
  if (r.ok) return { ok: true, value: { coeff: r.value, hasPi: false } };

  return {
    ok: false,
    message: 'Use forms like 6π, 3/2 π, or an integer (no decimal π)',
  };
}
