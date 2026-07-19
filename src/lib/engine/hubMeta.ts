/**
 * Hub presentation metadata — derived from pack ids so packs stay pure.
 */

export type HubBadge = 'figure' | 'chips' | 'approx' | 'exact';

const FIGURE = new Set([
  'triangle-sum',
  'linear-pair',
  'vertical-angles',
  'complementary',
  'supplementary',
  'exterior-angle',
  'transversal',
  'circles',
  'linear-write',
  'linear-system',
  'unit-circle',
  'right-trig',
  'pythagorean',
]);

const CHIPS = new Set(['unit-circle']);

const APPROX = new Set(['right-trig']);

export function hubBadges(packId: string): HubBadge[] {
  const out: HubBadge[] = [];
  if (FIGURE.has(packId)) out.push('figure');
  if (CHIPS.has(packId)) out.push('chips');
  if (APPROX.has(packId)) out.push('approx');
  else out.push('exact');
  return out;
}

export const BADGE_LABEL: Record<HubBadge, string> = {
  figure: 'Figure',
  chips: 'Choices',
  approx: 'Approx',
  exact: 'Exact',
};

export const LAST_PACK_KEY = 'factforge-last-pack';
