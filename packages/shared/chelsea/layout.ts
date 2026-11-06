/** Metres converted to the existing authoritative network coordinate system. */
export const CHELSEA_SCALE = 0.025;
export const CHELSEA_ORIGIN = { x: 2000, y: 2000 };
export const bluesWire = (x: number, z: number) => ({
  x: 2000 + x / CHELSEA_SCALE,
  y: 2000 + z / CHELSEA_SCALE,
});
export const bluesMetres = (p: { x: number; y: number }) => ({
  x: (p.x - 2000) * CHELSEA_SCALE,
  z: (p.y - 2000) * CHELSEA_SCALE,
});
const rect = (x: number, z: number, w: number, d: number, height = 3) => ({
  ...bluesWire(x - w / 2, z - d / 2),
  w: w / CHELSEA_SCALE,
  h: d / CHELSEA_SCALE,
  height,
});
export const BLUES_CAVE = {
  bounds: { l: 1280, r: 2720, t: 1080, b: 2680 },
  spawn: bluesWire(0, 10),
  returnFromMuseum: bluesWire(10, -17.5),
  obstacles: [
    rect(-5.6, -10, 24.8, 1, 11),
    rect(15.6, -10, 4.8, 1, 11),
    rect(6.8, -16.3, 0.8, 12, 8),
    rect(13.2, -16.3, 0.8, 12, 8),
    rect(0, -6, 5, 2.8, 1.1),
    rect(-4.8, -6, 2.4, 3.4, 4),
    rect(4.8, -6, 2.4, 3.4, 4),
    rect(-11, 1.8, 6.4, 1.6, 1.6),
    rect(-11, 6.8, 6.4, 1.6, 1.6),
    rect(-11, 4.3, 3.1, 1.5, 0.7),
    rect(12, 3, 4.8, 1.4, 3),
    ...[-16, 16].flatMap((x) => [-6, 6, 12].map((z) => rect(x, z, 1.6, 1.6, 10))),
  ],
  seats: [-12.8, -11, -9.2].map((x) => bluesWire(x, 3)),
  zones: [
    { id: 'refuge', label: 'Sảnh Trú Ẩn', ...bluesWire(0, 3) },
    { id: 'lounge', label: 'Góc Tâm Sự Fan', ...bluesWire(-11, 4) },
    { id: 'passage', label: 'Phòng Truyền Thống', ...bluesWire(10, -16) },
    { id: 'exit', label: 'Cổng Ra Hang', ...bluesWire(0, 15) },
  ],
};
export const TROPHY_SPOTS = Array.from({ length: 12 }, (_, i) => ({
  x: -12 + (i % 5) * 6,
  z: i < 5 ? -8 : i < 10 ? 2 : 12,
}));
export const LEGEND_SPOTS = Array.from({ length: 9 }, (_, i) => ({ x: -19, z: -17 + i * 4 }));
export const HISTORY_SPOTS = Array.from({ length: 9 }, (_, i) => ({ x: 19, z: -17 + i * 4 }));
export const BLUES_MUSEUM = {
  bounds: { l: 1120, r: 2880, t: 1000, b: 2840 },
  spawn: bluesWire(0, 16),
  obstacles: [
    ...TROPHY_SPOTS.map((p) => rect(p.x, p.z, 2.9, 2.1, 3.8)),
    ...LEGEND_SPOTS.map((p) => rect(p.x, p.z, 1.8, 1.8, 3.6)),
    ...HISTORY_SPOTS.map((p) => rect(p.x, p.z, 1.6, 2.3, 3.4)),
    rect(-11, -19, 4.4, 3.2, 5.6),
    ...Array.from({ length: 10 }, (_, i) => rect(-15.3 + i * 3.4, -23.7, 2.7, 1.2, 4)),
    ...[-16, 16].flatMap((x) => [-11, 8].map((z) => rect(x, z, 1.4, 1.4, 10))),
    rect(6, 12, 5, 1.8, 3.5),
    rect(12, 12, 5, 1.8, 3.5),
  ],
  zones: [
    { id: 'trophies', label: 'Danh hiệu & Cúp', ...bluesWire(0, 0) },
    { id: 'managers', label: 'Các đời HLV', ...bluesWire(0, -21) },
    { id: 'legends', label: 'Huyền thoại', ...bluesWire(-17, 0) },
    { id: 'history', label: 'Dòng thời gian', ...bluesWire(17, 0) },
    { id: 'matches', label: 'Trận đấu để đời', ...bluesWire(8, 14) },
  ],
};
export function bluesGround(p: { x: number; y: number }) {
  const { x, z } = bluesMetres(p);
  if (x < 7.2 || x > 12.8 || z > -8.5) return 0;
  if (z <= -10) return 0.6;
  return Math.min(0.6, Math.floor((-8.5 - z) / 0.375 + 1) * 0.15);
}
