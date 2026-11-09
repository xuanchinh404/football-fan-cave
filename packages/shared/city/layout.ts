import type { Point, Rect } from '../world';

export const CITY_WIRE = { origin: { x: 2000, y: 2000 }, scale: 0.025 };
// Leave the entire vaulted ceiling below the neighbouring United cave.
export const CITY_FLOOR = -51;
export const cityWire = (x: number, z: number): Point => ({
  x: CITY_WIRE.origin.x + x / CITY_WIRE.scale,
  y: CITY_WIRE.origin.y + z / CITY_WIRE.scale,
});
export const cityMetres = (p: Point) => ({
  x: (p.x - CITY_WIRE.origin.x) * CITY_WIRE.scale,
  z: (p.y - CITY_WIRE.origin.y) * CITY_WIRE.scale,
});

export const CITY_HALL = { left: -15, right: 15, north: -28, south: 0, ceiling: 13.15 };
export const CITY_LINK = { left: 15, right: 20, north: -18.4, south: -11.6 };
export const CITY_MUSEUM = { left: 20, right: 42, north: -29, south: -1 };
export const CITY_MUSEUM_AXIS = -15;
export const CITY_MUSEUM_WIDTH = 28;
export const CITY_MUSEUM_DEPTH = 22;
export const CITY_STAIR = { width: 8.4, foot: -16, landing: -21, rise: 1.35, steps: 9 };
export const CITY_SEAT_DIRECTION = Math.PI;
export const CITY_SEATS = [-13, -11.6, -10.2, -8.8].map((x) => cityWire(x, -18.9));
export const CITY_SCORE = cityWire(0, -25.05);
export const CITY_NEWS = cityWire(-11, -22.2);
export const museumPoint = (x: number, z: number): Point =>
  cityWire(CITY_MUSEUM.left - z, CITY_MUSEUM_AXIS + x);

export const CITY_BOUNDS = {
  l: cityWire(CITY_HALL.left, 0).x,
  r: cityWire(CITY_MUSEUM.right, 0).x,
  t: cityWire(0, CITY_MUSEUM.north).y,
  b: CITY_WIRE.origin.y,
};

type Block = { x: number; z: number; w: number; d: number; h: number };
const museumBlock = (x: number, z: number, w: number, d: number, h: number): Block => ({
  x: CITY_MUSEUM.left - z, z: CITY_MUSEUM_AXIS + x, w: d, d: w, h,
});
export const CITY_BLOCKS: Block[] = [
  { x: -10.9, z: -17.8, w: 6, d: 1.55, h: 1.2 },
  { x: -11, z: -20.55, w: 2, d: 1.28, h: 0.61 },
  { x: -11, z: -24.7, w: 7.8, d: 1.35, h: 2.1 },
  { x: 0, z: -27.5, w: 8.4, d: 1, h: 6 },
  museumBlock(-9.7, -17.4, 3.25, 2.3, 4.2),
  museumBlock(0, -20.8, 16.6, 1.9, 4.65),
  museumBlock(-13.35, -20.25, 1.3, 2.45, 3.8),
];
export const CITY_OBSTACLES: Rect[] = CITY_BLOCKS.map(({ x, z, w, d }) => ({
  ...cityWire(x - w / 2, z - d / 2), w: w / CITY_WIRE.scale, h: d / CITY_WIRE.scale,
}));

export function cityWalkable(p: Point) {
  const { x, z } = cityMetres(p);
  return [CITY_HALL, CITY_LINK, CITY_MUSEUM].some(({ left, right, north, south }) =>
    x >= left - 0.001 && x <= right + 0.001 && z >= north - 0.001 && z <= south + 0.001,
  ) && !CITY_BLOCKS.some(({ x: bx, z: bz, w, d }) =>
    Math.abs(x - bx) < w / 2 && Math.abs(z - bz) < d / 2,
  );
}

export function cityGround(p: Point) {
  if (!cityWalkable(p)) return undefined;
  const { x, z } = cityMetres(p);
  const { width, foot, landing, rise } = CITY_STAIR;
  if (Math.abs(x) > width / 2) return 0;
  return rise * Math.max(0, Math.min(1, (foot - z) / (foot - landing)));
}

export function cityArea(p: Point) {
  const { x, z } = cityMetres(p);
  if (x >= CITY_MUSEUM.left) return 'museum';
  if (x > CITY_HALL.right) return 'link';
  if (z > CITY_HALL.south) return 'tunnel';
  if (x < -6.6 && z < -13) return 'lounge';
  return 'hall';
}
