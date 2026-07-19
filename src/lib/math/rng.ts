/** Mulberry32 — small seeded PRNG for reproducible tests. */
export type Rng = {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
  pick<T>(items: readonly T[]): T;
  bool(p?: number): boolean;
};

export function createRng(seed = Date.now() >>> 0): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      if (max < min) [min, max] = [max, min];
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(items) {
      if (items.length === 0) throw new Error('pick: empty');
      return items[Math.floor(next() * items.length)]!;
    },
    bool(p = 0.5) {
      return next() < p;
    },
  };
}
