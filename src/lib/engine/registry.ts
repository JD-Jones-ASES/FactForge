import type { RelationPack } from './types';
import { integerOpsPack } from '../packs/integer-ops';
import { fractionOpsPack } from '../packs/fraction-ops';
import { reduceEquivPack } from '../packs/reduce-equiv';
import { gcfLcmPack } from '../packs/gcf-lcm';
import { proportionPack } from '../packs/proportion';
import { percentOfPack } from '../packs/percent-of';
import { linearOnePack } from '../packs/linear-one';
import { factorQuadPack } from '../packs/factor-quad';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const packs: RelationPack<any>[] = [
  integerOpsPack,
  fractionOpsPack,
  reduceEquivPack,
  gcfLcmPack,
  proportionPack,
  percentOfPack,
  linearOnePack,
  factorQuadPack,
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
