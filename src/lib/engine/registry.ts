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
  rationalizePack,
  linearOnePack,
  linearWritePack,
  linearSystemPack,
  factorQuadPack,
  expandQuadPack,
  powersPack,
  rootsPack,
  triangleSumPack,
  linearPairPack,
  verticalAnglesPack,
  complementaryPack,
  supplementaryPack,
  exteriorAnglePack,
  transversalPack,
  circlesPack,
  pythagoreanPack,
  unitCirclePack,
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
