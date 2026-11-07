export const ARSENAL_SCALE = 0.025;
export const ARSENAL_ORIGIN = { x: 2000, y: 2000 };
export const gunnersWire = (x: number, z: number) => ({
  x: ARSENAL_ORIGIN.x + x / ARSENAL_SCALE,
  y: ARSENAL_ORIGIN.y + z / ARSENAL_SCALE,
});
const bounds = (left: number, right: number, top: number, bottom: number) => ({
  l: gunnersWire(left, top).x,
  r: gunnersWire(right, bottom).x,
  t: gunnersWire(left, top).y,
  b: gunnersWire(right, bottom).y,
});
type Footprint = { x: number; z: number; width: number; depth: number; height: number };
const rect = ({ x, z, width, depth, height }: Footprint) => ({
  ...gunnersWire(x - width / 2, z - depth / 2),
  w: width / ARSENAL_SCALE,
  h: depth / ARSENAL_SCALE,
  height,
});
const footprint = (
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
): Footprint => ({ x, z, width, depth, height });

export const FORTRESS_PARTITIONS = [
  footprint(-6.2, -14.5, 29.6, 1.2, 12),
  footprint(18.2, -14.5, 5.6, 1.2, 12),
  footprint(8.6, -21.4, 0.75, 13, 9),
  footprint(15.4, -21.4, 0.75, 13, 9),
];
export const FORTRESS_STAIRS = Array.from({ length: 6 }, (_, i) => ({
  x: 0,
  z: -5.2 - i * 0.55,
  width: 7.2,
  depth: 0.55,
  height: (i + 1) * 0.15,
}));
export const CANNON_PLATFORM = footprint(0, -11.25, 7.2, 6.5, 0.9);
export const STAIR_RAILS = [-3.85, 3.85].map((x) => footprint(x, -9.6, 0.44, 9.4, 1.8));
export const FORTRESS_COLUMNS = [-18, 18].flatMap((x) =>
  [-9, 2, 12].map((z) => footprint(x, z, 1.42, 1.42, 9)),
);
const gatePosts = (x: number, z: number, scale: number) =>
  [-1, 1].map((side) =>
    footprint(x + side * 4.23 * scale, z, 1.52 * scale, 1.54 * scale, 4.5 * scale),
  );
export const FORTRESS_CANNONS = [-5.8, 5.8].map((x) => footprint(x, -9.6, 3.2, 2.6, 2.1));
export const FORTRESS_LOUNGE = [
  footprint(-13, 4.2, 5.7, 1.8, 1.7),
  footprint(-13, 9.3, 5.7, 1.8, 1.7),
  footprint(-13, 7.16, 2.85, 1.35, 0.7),
];
export const SCORE_BOARD = footprint(9.3, 1.2, 4.5, 1.3, 3.6);
export const ARSENAL_CAVE = {
  bounds: bounds(-21, 21, -28, 19),
  spawn: gunnersWire(0, 11),
  entry: gunnersWire(12, -25.6),
  exit: gunnersWire(0, 17),
  returnFromMuseum: gunnersWire(12, -21.3),
  score: gunnersWire(SCORE_BOARD.x, SCORE_BOARD.z + 1.45),
  seats: [-14.8, -13, -11.2].map((x) => gunnersWire(x, 5.53)),
  obstacles: [
    ...FORTRESS_PARTITIONS,
    ...FORTRESS_COLUMNS,
    ...FORTRESS_CANNONS,
    ...STAIR_RAILS,
    ...FORTRESS_LOUNGE,
    SCORE_BOARD,
    footprint(0, -12.2, 3.65, 2.1, 4.3),
    ...gatePosts(12, -14.15, 0.77),
    ...gatePosts(0, 17, 0.77),
    ...gatePosts(-13, 1.65, 0.78),
    ...gatePosts(0, -13.18, 1.08),
  ].map(rect),
  zones: [
    { id: 'refuge', label: 'Pháo Thủ Trú Ẩn', ...gunnersWire(0, -1) },
    { id: 'lounge', label: 'Góc Tâm Sự Fan', ...gunnersWire(-13, 7) },
    { id: 'passage', label: 'Phòng Truyền Thống', ...gunnersWire(12, -21) },
    { id: 'exit', label: 'Ra Hang', ...gunnersWire(0, 17) },
  ],
};
export function arsenalGround(p: { x: number; y: number }) {
  const x = (p.x - ARSENAL_ORIGIN.x) * ARSENAL_SCALE;
  const z = (p.y - ARSENAL_ORIGIN.y) * ARSENAL_SCALE;
  if (Math.abs(x) > CANNON_PLATFORM.width / 2 || z > -4.925 || z < -14.5) return 0;
  return (
    FORTRESS_STAIRS.find((s) => z >= s.z - s.depth / 2 - 1e-8)?.height ?? CANNON_PLATFORM.height
  );
}

export const ARSENAL_CUP_SPOTS = [
  { x: -4, z: -4 },
  { x: 4, z: -4 },
  { x: 10, z: -4 },
  { x: -9, z: -11 },
  { x: -3, z: -11 },
  { x: 6, z: -11 },
];
export const ARSENAL_COACH_SPOTS = Array.from({ length: 8 }, (_, i) => ({
  x: -14 + 4 * i,
  z: -21.8,
}));
export const ARSENAL_LEGEND_SPOTS = Array.from({ length: 9 }, (_, i) => ({
  x: -18.7,
  z: -8 + i * 3.1,
}));
export const ARSENAL_HISTORY_SPOTS = Array.from({ length: 10 }, (_, i) => ({
  x: 18.7,
  z: -17 + i * 3.25,
}));
export const ARSENAL_MATCH_SPOTS = [-6, 5.5, 11].map((x) => ({ x, z: 8.5 }));
export const ARSENAL_STATUE = { x: -13, z: -13.6 };
export const ARSENAL_RECORDS = { x: 16, z: 15.5 };
export const ARSENAL_ARCHIVE = { x: -13, z: 15.5 };
export const HERITAGE_COLUMNS = [-16, 16].flatMap((x) =>
  [-17, -4, 8].map((z) => footprint(x, z, 1.35, 1.35, 9)),
);
export const ARSENAL_MUSEUM = {
  bounds: bounds(-22, 22, -24, 22),
  spawn: gunnersWire(0, 16.2),
  exit: gunnersWire(0, 20.4),
  obstacles: [
    ...ARSENAL_CUP_SPOTS.map((p) => footprint(p.x, p.z, 2.9, 2.1, 3.85)),
    ...ARSENAL_COACH_SPOTS.map((p) => footprint(p.x, p.z, 2.7, 1.2, 4)),
    ...ARSENAL_LEGEND_SPOTS.map((p) => footprint(p.x, p.z, 1.8, 1.8, 3.2)),
    ...ARSENAL_HISTORY_SPOTS.map((p) => footprint(p.x, p.z, 1.65, 1.65, 3.3)),
    ...ARSENAL_MATCH_SPOTS.map((p) => footprint(p.x, p.z, 4.2, 1.4, 3)),
    footprint(ARSENAL_STATUE.x, ARSENAL_STATUE.z, 3.8, 2.7, 4.4),
    footprint(ARSENAL_RECORDS.x, ARSENAL_RECORDS.z, 2.85, 1.15, 2.9),
    footprint(ARSENAL_ARCHIVE.x, ARSENAL_ARCHIVE.z, 2.85, 1.15, 2.9),
    ...HERITAGE_COLUMNS,
    ...gatePosts(0, 20.4, 0.77),
  ].map(rect),
  zones: [
    { id: 'trophies', label: 'Danh hiệu & Cúp', ...gunnersWire(0, -5) },
    { id: 'managers', label: 'Các đời HLV', ...gunnersWire(0, -20) },
    { id: 'legends', label: 'Huyền thoại CLB', ...gunnersWire(-18, 3) },
    { id: 'matches', label: 'Những trận đấu để đời', ...gunnersWire(5.5, 10.5) },
    { id: 'history', label: 'Dòng thời gian', ...gunnersWire(18, 0) },
    { id: 'records', label: 'Kỷ lục & Thống kê', ...gunnersWire(16, 17) },
    { id: 'archive', label: 'Thư viện ảnh', ...gunnersWire(-13, 17) },
    { id: 'exit', label: 'Về Hang Arsenal', ...gunnersWire(0, 20.4) },
  ],
};
