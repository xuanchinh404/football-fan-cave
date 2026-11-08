import { AVENUE_NORTH, KOP_ENTRANCE } from '../grandHall';

export const LIVERPOOL_SCALE = 0.025;
export const LIVERPOOL_ORIGIN = { x: 2000, y: 2000 };
export const liverpoolWire = (x: number, z: number) => ({
  x: LIVERPOOL_ORIGIN.x + x / LIVERPOOL_SCALE,
  y: LIVERPOOL_ORIGIN.y + z / LIVERPOOL_SCALE,
});
const bounds = (left: number, right: number, top: number, bottom: number) => ({
  l: liverpoolWire(left, top).x,
  r: liverpoolWire(right, bottom).x,
  t: liverpoolWire(left, top).y,
  b: liverpoolWire(right, bottom).y,
});
const solid = (x: number, z: number, w: number, d: number, height: number) => ({
  ...liverpoolWire(x - w / 2, z - d / 2),
  w: w / LIVERPOOL_SCALE,
  h: d / LIVERPOOL_SCALE,
  height,
});
const zone = (id: string, label: string, x: number, z: number) => ({
  id,
  label,
  ...liverpoolWire(x, z),
});

export const KOP_STAIRS = Array.from({ length: 5 }, (_, i) => ({
  z: -4.25 - i * 0.5,
  depth: 0.5,
  width: 7.6,
  height: (i + 1) * 0.16,
}));
export const KOP_DAIS = { z: -9.25, width: 7.6, depth: 5.5, height: 0.8 };
const stairDepth = 0.34;
const stairCount = 32;
const door = 33.5;
const landingStart = door + AVENUE_NORTH - KOP_ENTRANCE.z;
export const KOP_TUNNEL = {
  x: 13,
  start: 14.9,
  end: door,
  width: 7.5,
  stairStart: landingStart - stairCount * stairDepth,
  landingStart,
  stepDepth: stairDepth,
  rise: 0.25,
  steps: stairCount,
  door,
  arrival: 30.7,
} as const;
export const KOP_EXIT_STAIRS = Array.from({ length: KOP_TUNNEL.steps }, (_, i) => ({
  z: KOP_TUNNEL.stairStart + (i + 0.5) * KOP_TUNNEL.stepDepth,
  depth: KOP_TUNNEL.stepDepth,
  height: (i + 1) * KOP_TUNNEL.rise,
}));
export function insideLiverpoolFootprint(p: { x: number; y: number }) {
  const x = (p.x - LIVERPOOL_ORIGIN.x) * LIVERPOOL_SCALE;
  const z = (p.y - LIVERPOOL_ORIGIN.y) * LIVERPOOL_SCALE;
  return z <= KOP_TUNNEL.start + 1.6 || Math.abs(x - KOP_TUNNEL.x) < KOP_TUNNEL.width / 2 - 0.28;
}
export function liverpoolGround(p: { x: number; y: number }) {
  const x = (p.x - LIVERPOOL_ORIGIN.x) * LIVERPOOL_SCALE;
  const z = (p.y - LIVERPOOL_ORIGIN.y) * LIVERPOOL_SCALE;
  if (Math.abs(x - KOP_TUNNEL.x) <= KOP_TUNNEL.width / 2 && z >= KOP_TUNNEL.stairStart)
    return (
      Math.min(KOP_TUNNEL.steps, (z - KOP_TUNNEL.stairStart) / KOP_TUNNEL.stepDepth) * KOP_TUNNEL.rise
    );
  if (Math.abs(x) > 3.8 || z > -4 || z < -12) return 0;
  return KOP_STAIRS.find((step) => z >= step.z - 0.25)?.height ?? KOP_DAIS.height;
}

export const KOP_SOFA_SPOTS = [
  { x: -13, z: -11.6, plum: false },
  { x: -13, z: 2.6, plum: true },
  { x: -16.5, z: 6, plum: false, side: true },
];
export const KOP_TABLES = [
  { x: -13, z: -8.6 },
  { x: -13, z: 5.6 },
];
export const KOP_CAVE = {
  bounds: bounds(-20, 20, -28, KOP_TUNNEL.end),
  spawn: liverpoolWire(KOP_TUNNEL.x, KOP_TUNNEL.arrival),
  entry: liverpoolWire(12, -26.2),
  exit: liverpoolWire(KOP_TUNNEL.x, KOP_TUNNEL.door - 1.25),
  returnFromMuseum: liverpoolWire(12, -22.8),
  score: liverpoolWire(0, -8.2),
  seats: KOP_SOFA_SPOTS.flatMap(({ x, z, side }) =>
    [-0.85, 0.85].map((offset) =>
      side ? liverpoolWire(x + 0.94, z + offset) : liverpoolWire(x + offset, z + 0.94),
    ),
  ),
  obstacles: [
    // Refuge wall, with a clear opening at x=12 into the heritage corridor.
    solid(-5.35, -13.8, 29.3, 1.2, 12),
    solid(17.35, -13.8, 5.3, 1.2, 12),
    solid(8.9, -21.1, 0.8, 13.8, 8),
    solid(15.1, -21.1, 0.8, 13.8, 8),
    // Two enclosed sides of the fan room and the posts of its entry arch.
    solid(-18.1, -10, 0.8, 7.1, 5),
    solid(-7.9, -10, 0.8, 7.1, 5),
    ...[-16.5, -9.5].map((x) => solid(x, -6.2, 1.15, 1.05, 4.3)),
    ...[-16.65, -9.35].map((x) => solid(x, 10.3, 1.15, 1.05, 4.3)),
    ...[9.25, 16.75].map((x) => solid(x, 15.8, 1.15, 1.1, 4.4)),
    solid(-5.65, 15.8, 28.7, 1.2, 9),
    solid(18.6, 15.8, 2.8, 1.2, 9),

    ...[-1, 1].map((side) => solid(KOP_TUNNEL.x + side * 3.25, (KOP_TUNNEL.stairStart + landingStart) / 2, 0.4, stairCount * stairDepth, 7)),
    ...[-4.06, 4.06].map((x) => solid(x, -8, 0.48, 8.1, 1.7)),
    solid(0, -11, 4.2, 1.55, 5),
    ...KOP_SOFA_SPOTS.map(({ x, z, side }) =>
      solid(x, z, side ? 1.08 : 3.6, side ? 3.6 : 1.08, 1.45),
    ),
    ...KOP_TABLES.map(({ x, z }) => solid(x, z, 1.8, 0.95, 0.68)),
  ],
  zones: [
    zone('refuge', 'Sảnh Trú Ẩn', 0, -2),
    zone('support', 'Góc Tâm Sự', -13, -8),
    zone('lounge', 'Lounge Fan', -13, 5),
    zone('heritage', 'Phòng Truyền Thống', 12, -20),
    zone('exit', 'Đường hầm ra hang', 13, 24.5),
  ],
};

export const KOP_CUPS = Array.from({ length: 7 }, (_, i) => ({ x: (i - 3) * 3.2, z: -4 }));
export const KOP_COACHES = Array.from({ length: 10 }, (_, i) => ({
  x: (i - 4.5) * 3.45,
  z: -12.8,
}));
export const KOP_LEGENDS = Array.from({ length: 6 }, (_, i) => ({ x: -20, z: 12 - i * 3.8 }));
export const KOP_TIMELINE = Array.from({ length: 10 }, (_, i) => ({ x: (i - 4.5) * 4, z: -21 }));
export const KOP_SHANKLY = { x: -15, z: -3.8 };
export const KOP_ISTANBUL = { x: 16.7, z: -3.5 };
export const KOP_SHIELD = { x: 16.7, z: 5.1 };
export const KOP_COLUMNS = [-21.6, 21.6].flatMap((x) => [-17, -6, 4, 14].map((z) => ({ x, z })));
export const KOP_MUSEUM = {
  bounds: bounds(-23, 23, -23, 22),
  spawn: liverpoolWire(0, 15),
  exit: liverpoolWire(0, 20.2),
  obstacles: [
    ...KOP_CUPS.map(({ x, z }) => solid(x, z, 2.9, 2.1, 3.85)),
    ...KOP_LEGENDS.map(({ x, z }) => solid(x, z, 1.52, 2.12, 3.25)),
    ...KOP_TIMELINE.map(({ x, z }) => solid(x, z, 2.95, 1.15, 2.9)),
    ...KOP_COLUMNS.map(({ x, z }) => solid(x, z, 1.2, 1.2, 10)),
    solid(KOP_SHANKLY.x, KOP_SHANKLY.z, 3.3, 2.8, 5),
    solid(KOP_ISTANBUL.x, KOP_ISTANBUL.z, 5.9, 2.4, 5.4),
    solid(KOP_SHIELD.x, KOP_SHIELD.z, 2.9, 2.1, 3.85),
    ...[-3.3, 3.3].map((x) => solid(x, 20.2, 1.15, 1.1, 5)),
    ...[-13.4, 13.4].map((x) => solid(x, 20.2, 19, 1.2, 10)),
  ],
  zones: [
    zone('cups', 'Danh hiệu & Cúp', 0, -1.5),
    zone('coaches', 'HLV tiêu biểu', 0, -10),
    zone('legends', 'Huyền thoại', -18.5, 7),
    zone('shankly', 'Bill Shankly', -15, -1),
    zone('istanbul', 'Istanbul 2005', 16.5, 0),
    zone('timeline', 'Dòng thời gian', 0, -18),
    zone('exit', 'Về Hang Liverpool', 0, 20.2),
  ],
};

/** The side sofa faces east. The two sofas against rear walls face south. */
export function kopSeatFacing(p: { x: number; y: number }) {
  return p.x < liverpoolWire(-14.4, 0).x ? Math.PI / 2 : 0;
}
