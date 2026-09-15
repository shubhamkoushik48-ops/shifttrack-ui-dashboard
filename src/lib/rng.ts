// Deterministic PRNG (mulberry32) so mock data is stable across reloads/SSR.
export function mulberry32(seed: number) {
  "use client";
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0;
    t = (t ^ (t >>> 14)) >>> 0;
    return t / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
}

export function makeRng(seed: number): Rng {
  const rng = mulberry32(seed);
  return {
    next: rng,
    int(minInclusive: number, maxInclusive: number) {
      return Math.floor(rng() * (maxInclusive - minInclusive + 1)) + minInclusive;
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(rng() * arr.length)]!;
    },
    chance(p: number): boolean {
      return rng() < p;
    },
  };
}

export function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
