import { BANTER_TARGET, GRAND_SOLIDS, grandHeight } from '../grandHall';
import type { Product } from './catalog';

export type XYZ = [number, number, number];
export type Flight = {
  id: string;
  sku: string;
  owner: string;
  origin: XYZ;
  velocity: XYZ;
  delay: number;
};
export type Impact = {
  id: string;
  sku: string;
  owner: string;
  point: XYZ;
  target?: string;
  surface: 'wall' | 'floor' | 'target' | 'avatar';
};
export const gravity = 12;
export const flightLifetime = 2.3;
export const practiceTarget = BANTER_TARGET;
export const inArena = (x: number, z: number) => x > -38.7 && x < -25.3 && z > -0.6 && z < 8;
const speeds: Partial<Record<Product['visual'], number>> = {
  water: 15,
  egg: 16,
  roll: 12,
  cake: 11,
  pie: 14,
  foam: 17,
};

export function throwVelocity(aim: XYZ, visual: Product['visual']): XYZ | undefined {
  if (!aim.every(Number.isFinite)) return;
  const horizontal = Math.hypot(aim[0], aim[2]);
  if (horizontal < 0.1 || Math.hypot(...aim) > 2) return;
  const speed = speeds[visual] ?? 14;
  return [
    (speed * aim[0]) / horizontal,
    2.1 + speed * Math.max(-0.42, Math.min(0.7, aim[1])),
    (speed * aim[2]) / horizontal,
  ];
}
export function flightPoint(flight: Flight, age: number): XYZ {
  return [
    flight.origin[0] + age * flight.velocity[0],
    flight.origin[1] + age * flight.velocity[1] - 0.5 * gravity * age ** 2,
    flight.origin[2] + age * flight.velocity[2],
  ];
}
export function surfaceAt([x, y, z]: XYZ): Impact['surface'] | undefined {
  const target = practiceTarget;
  if (Math.abs(z - target.z) < 0.24 && Math.hypot(x - target.x, y - target.y) < target.radius)
    return 'target';
  if (y <= (grandHeight(x, z) ?? -2) + 0.12) return 'floor';
  if (
    GRAND_SOLIDS.some(
      (s) =>
        y >= s.base - 0.12 &&
        y <= s.base + s.h + 0.12 &&
        (s.round
          ? Math.hypot(x - s.x, z - s.z) <= s.w / 2 + 0.12
          : Math.abs(x - s.x) <= s.w / 2 + 0.12 && Math.abs(z - s.z) <= s.d / 2 + 0.12),
    )
  )
    return 'wall';
}
