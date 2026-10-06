import type { RelationPack } from './types';
import { integerOpsPack } from '../packs/integer-ops';
import { fractionOpsPack } from '../packs/fraction-ops';
import { reduceEquivPack } from '../packs/reduce-equiv';
import { gcfLcmPack } from '../packs/gcf-lcm';
import { proportionPack } from '../packs/proportion';
import { percentOfPack } from '../packs/percent-of';
import { linearOnePack } from '../packs/linear-one';
import { factorQuadPack } from '../packs/factor-quad';
import { expandQuadPack } from '../packs/expand-quad';
import { powersPack } from '../packs/powers';
import { rootsPack } from '../packs/roots';
import { triangleSumPack } from '../packs/triangle-sum';
import { linearPairPack } from '../packs/linear-pair';
import { verticalAnglesPack } from '../packs/vertical-angles';
import { complementaryPack } from '../packs/complementary';
import { supplementaryPack } from '../packs/supplementary';
import { exteriorAnglePack } from '../packs/exterior-angle';
import { transversalPack } from '../packs/transversal';
import { circlesPack } from '../packs/circles';
import { rationalizePack } from '../packs/rationalize';
import { linearWritePack } from '../packs/linear-write';
import { linearSystemPack } from '../packs/linear-system';
import { unitCirclePack } from '../packs/unit-circle';
import { rightTrigPack } from '../packs/right-trig';
import { pythagoreanPack } from '../packs/pythagorean';
import { orderOpsPack } from '../packs/order-ops';
import { decimalOpsPack } from '../packs/decimal-ops';
import { mixedImproperPack } from '../packs/mixed-improper';
import { fracDecPctPack } from '../packs/frac-dec-pct';
import { primeFactorPack } from '../packs/prime-factor';
import { exponentLawsPack } from '../packs/exponent-laws';
import { sciNotationPack } from '../packs/sci-notation';
import { percentChangePack } from '../packs/percent-change';
import { dataStatsPack } from '../packs/data-stats';
import { countingPack } from '../packs/counting';
import { linearIneqPack } from '../packs/linear-ineq';
import { slopeInterceptsPack } from '../packs/slope-intercepts';
import { absValuePack } from '../packs/abs-value';
import { simplifyRadicalPack } from '../packs/simplify-radical';
import { solveQuadPack } from '../packs/solve-quad';
import { vertexPack } from '../packs/vertex';
import { funcEvalPack } from '../packs/func-eval';
import { avgRatePack } from '../packs/avg-rate';
import { logsPack } from '../packs/logs';
import { sequencesPack } from '../packs/sequences';
import { polygonAnglesPack } from '../packs/polygon-angles';
import { areaPerimeterPack } from '../packs/area-perimeter';
import { volumePack } from '../packs/volume';
import { arcSectorPack } from '../packs/arc-sector';
import { distanceMidpointPack } from '../packs/distance-midpoint';
import { specialRightPack } from '../packs/special-right';
import { degRadPack } from '../packs/deg-rad';
import { refAnglePack } from '../packs/ref-angle';
import { trigIdentityPack } from '../packs/trig-identity';
import { inverseTrigPack } from '../packs/inverse-trig';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const packs: RelationPack<any>[] = [
  integerOpsPack,
  orderOpsPack,
  decimalOpsPack,
  fractionOpsPack,
  reduceEquivPack,
  mixedImproperPack,
  fracDecPctPack,
  gcfLcmPack,
  primeFactorPack,
  exponentLawsPack,
  sciNotationPack,
  proportionPack,
  percentOfPack,
  percentChangePack,
  linearOnePack,
  linearIneqPack,
  absValuePack,
  slopeInterceptsPack,
  linearWritePack,
  linearSystemPack,
  expandQuadPack,
  factorQuadPack,
  solveQuadPack,
  powersPack,
  rootsPack,
  simplifyRadicalPack,
  rationalizePack,
  funcEvalPack,
  vertexPack,
  avgRatePack,
  logsPack,
  sequencesPack,
  triangleSumPack,
  linearPairPack,
  verticalAnglesPack,
  complementaryPack,
  supplementaryPack,
  exteriorAnglePack,
  transversalPack,
  polygonAnglesPack,
  areaPerimeterPack,
  circlesPack,
  arcSectorPack,
  volumePack,
  pythagoreanPack,
  distanceMidpointPack,
  specialRightPack,
  degRadPack,
  refAnglePack,
  unitCirclePack,
  trigIdentityPack,
  inverseTrigPack,
  rightTrigPack,
  dataStatsPack,
  countingPack,
];

export function listPacks(): RelationPack[] {
  return packs;
}

export function getPack(id: string): RelationPack | undefined {
  return packs.find((p) => p.id === id);
}

export function packIds(): string[] {
  return packs.map((p) => p.id);
}
