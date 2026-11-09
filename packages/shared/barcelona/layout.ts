import type { Point, Rect } from '../world';

export const BARCA_WIRE = { origin: { x: 2000, y: 2000 }, scale: 0.025 };
export const BARCA_FLOOR = -1;
export const barcaWire = (x: number, z: number): Point => ({
  x: BARCA_WIRE.origin.x + x / BARCA_WIRE.scale,
  y: BARCA_WIRE.origin.y + z / BARCA_WIRE.scale,
});
export const barcaMetres = (p: Point) => ({
  x: (p.x - BARCA_WIRE.origin.x) * BARCA_WIRE.scale,
  z: (p.y - BARCA_WIRE.origin.y) * BARCA_WIRE.scale,
});

// The western wall clears the adjacent Man City access tunnel.
export const BARCA_HALL = { left: -11, right: 19, north: -28, south: 0 };
export const BARCA_LINK = { left: 19, right: 25, north: -18.3, south: -11.7 };
export const BARCA_MUSEUM = { left: 25, right: 49, north: -30, south: 0 };
export const BARCA_ROOMS = [BARCA_HALL, BARCA_LINK, BARCA_MUSEUM];
export const BARCA_BOUNDS = {
  l: barcaWire(BARCA_HALL.left, 0).x,
  r: barcaWire(BARCA_MUSEUM.right, 0).x,
  t: barcaWire(0, BARCA_MUSEUM.north).y,
  b: BARCA_WIRE.origin.y,
};
export const BARCA_AXIS = -15;
export const museumPoint = (x: number, z: number) =>
  barcaWire(BARCA_MUSEUM.left - z, BARCA_AXIS + x);

export const BARCA_STAIR = { width: 6.2, foot: -17, landing: -22.6, rise: 1.4, steps: 9 };
export const BARCA_SOFA = { x: -7.25, z: -18.5, w: 5.85, d: 1.3, h: 1.14 };
export const BARCA_TABLE = { x: -7.25, z: -21.5, w: 1.85, d: 1.85, h: 0.67 };
export const BARCA_SEAT_DIRECTION = Math.PI;
export const BARCA_SEATS = [-9.35, -7.95, -6.55, -5.15].map((x) => barcaWire(x, -19.59));
export const BARCA_CUP_X = [-7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8];
export const BARCA_CUP_WALL = -22.3;
export const BARCA_STATUE = { x: -10.9, z: -14.2, w: 1.9, d: 1.8, h: 3.4 };
const museumBlock = (x: number, z: number, w: number, d: number, h: number) => ({
  x: BARCA_MUSEUM.left - z,
  z: BARCA_AXIS + x,
  w: d,
  d: w,
  h,
});
export const BARCA_STAIR_SIDES = [-1, 1].map((side) => ({
  x: (side * BARCA_STAIR.width) / 2,
  z: (BARCA_STAIR.foot + BARCA_HALL.north) / 2,
  w: 0.22,
  d: BARCA_STAIR.foot - BARCA_HALL.north,
  h: 1.95,
}));
export const BARCA_BLOCKS = [
  ...BARCA_STAIR_SIDES,
  BARCA_SOFA,
  BARCA_TABLE,
  { x: -6.85, z: -26.75, w: 6.6, d: 0.8, h: 1.35 },
  museumBlock(0, BARCA_CUP_WALL, 18, 1.56, 3.24),
  museumBlock(BARCA_STATUE.x, BARCA_STATUE.z, BARCA_STATUE.w, BARCA_STATUE.d, BARCA_STATUE.h),
];
export const BARCA_OBSTACLES: Rect[] = BARCA_BLOCKS.map(({ x, z, w, d }) => ({
  ...barcaWire(x - w / 2, z - d / 2),
  w: w / BARCA_WIRE.scale,
  h: d / BARCA_WIRE.scale,
}));

export function barcaWalkable(p: Point) {
  const { x, z } = barcaMetres(p);
  return (
    BARCA_ROOMS.some(
      ({ left, right, north, south }) =>
        x >= left - 0.001 && x <= right + 0.001 && z >= north - 0.001 && z <= south + 0.001,
    ) &&
    !BARCA_BLOCKS.some(
      ({ x: bx, z: bz, w, d }) => Math.abs(x - bx) < w / 2 && Math.abs(z - bz) < d / 2,
    )
  );
}

export function barcaGround(p: Point) {
  if (!barcaWalkable(p)) return undefined;
  const { x, z } = barcaMetres(p);
  const { width, foot, landing, rise } = BARCA_STAIR;
  return Math.abs(x) <= width / 2
    ? rise * Math.max(0, Math.min(1, (foot - z) / (foot - landing)))
    : 0;
}

export function barcaArea(p: Point) {
  const { x, z } = barcaMetres(p);
  if (z > BARCA_HALL.south) return 'tunnel';
  if (x >= BARCA_MUSEUM.left) return 'museum';
  if (x > BARCA_HALL.right) return 'passage';
  if (x < -3.6 && z < -15) return 'lounge';
  return 'hall';
}
