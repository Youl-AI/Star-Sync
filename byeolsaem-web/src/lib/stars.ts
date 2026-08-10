import { mulberry32 } from "./random";

export interface Star { x: number; y: number; z: number; size: number; phase: number }

export function generateStars(count: number, seed: number): Star[] {
  const r = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: r() * 2 - 1,
    y: r() * 2 - 1,
    z: r() * 2 - 1,
    size: 0.5 + r() * 1.5,
    phase: r() * Math.PI * 2,
  }));
}
