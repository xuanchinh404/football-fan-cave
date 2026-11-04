// Metres, Y-up. This is the authoritative layout shared by rendering and Socket.IO validation.
export const GRAND_SCALE = 0.025;
export const GRAND_ORIGIN = { x: 3000, y: 3000 };
export const GRAND_BOUNDS = { left: -55, right: 55, top: -58, bottom: 40 };
export const grandWire = (x: number, z: number) => ({
  x: x / GRAND_SCALE + GRAND_ORIGIN.x,
  y: z / GRAND_SCALE + GRAND_ORIGIN.y,
});
export const grandMetres = (p: { x: number; y: number }) => ({
  x: (p.x - GRAND_ORIGIN.x) * GRAND_SCALE,
  z: (p.y - GRAND_ORIGIN.y) * GRAND_SCALE,
});
export const CAVES = [
  {
    id: 'bayern',
    name: 'Hang Bayern Munich',
    short: 'Hang Bayern',
    x: -33,
    z: -53,
    height: 15,
    tier: 3,
    color: '#ff2275',
    symbol: 'B',
    available: false,
  },
  {
    id: 'psg',
    name: 'Hang PSG',
    short: 'Hang PSG',
    x: 33,
    z: -53,
    height: 15,
    tier: 3,
    color: '#3874ff',
    symbol: 'P',
    available: false,
  },
  {
    id: 'real',
    name: 'Hang Real Madrid',
    short: 'Hang Real Madrid',
    x: -45,
    z: -30,
    height: 7,
    tier: 2,
    color: '#ffe8a1',
    symbol: 'R',
    available: false,
  },
  {
    id: 'arsenal',
    name: 'Hang Pháo Thủ',
    short: 'Hang Pháo Thủ',
    x: -30,
    z: -29,
    height: 7,
    tier: 2,
    color: '#ff6338',
    symbol: 'A',
    available: false,
  },
  {
    id: 'liverpool',
    name: 'Hang The Kop',
    short: 'Hang The Kop',
    x: -15,
    z: -30.5,
    height: 7,
    tier: 2,
    color: '#ff3159',
    symbol: 'L',
    available: false,
  },
  {
    id: 'united',
    name: 'Hang Quỷ Đỏ',
    short: 'HANG QUỶ ĐỎ',
    x: 0,
    z: -32,
    height: 7,
    tier: 2,
    color: '#ff452c',
    symbol: '♆',
    available: true,
  },
  {
    id: 'chelsea',
    name: 'Hang The Blues',
    short: 'Hang The Blues',
    x: 15,
    z: -30,
    height: 7,
    tier: 2,
    color: '#4169ff',
    symbol: 'C',
    available: false,
  },
  {
    id: 'city',
    name: 'Hang Citizens',
    short: 'Hang Citizens',
    x: 30,
    z: -29,
    height: 7,
    tier: 2,
    color: '#17e1ff',
    symbol: 'M',
    available: false,
  },
  {
    id: 'barcelona',
    name: 'Hang Barcelona',
    short: 'Hang Barcelona',
    x: 45,
    z: -30,
    height: 7,
    tier: 2,
    color: '#d334ff',
    symbol: 'F',
    available: false,
  },
] as const;
export type CaveId = (typeof CAVES)[number]['id'];
export type Surface = {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  south: number;
  north: number;
  kind: 'plaza' | 'terrace' | 'stairs' | 'bridge';
};
export const GRAND_SURFACES: Surface[] = [
  { id: 'plaza', x: 0, z: 16, w: 110, d: 48, south: 0, north: 0, kind: 'plaza' },
  { id: 'avenue', x: 0, z: -29.5, w: 110, d: 15, south: 7, north: 7, kind: 'terrace' },
  { id: 'main-stairs', x: 0, z: -15, w: 10, d: 14, south: 0, north: 7, kind: 'stairs' },
  { id: 'west-bridge', x: -41, z: -15, w: 6, d: 14, south: 0, north: 7, kind: 'bridge' },
  { id: 'east-bridge', x: 41, z: -15, w: 6, d: 14, south: 0, north: 7, kind: 'bridge' },
  { id: 'bayern-ascent', x: -37.5, z: -42, w: 5.5, d: 10, south: 7, north: 15, kind: 'stairs' },
  { id: 'psg-ascent', x: 37.5, z: -42, w: 5.5, d: 10, south: 7, north: 15, kind: 'stairs' },
  { id: 'bayern-terrace', x: -33, z: -52.5, w: 34, d: 11, south: 15, north: 15, kind: 'terrace' },
  { id: 'psg-terrace', x: 33, z: -52.5, w: 34, d: 11, south: 15, north: 15, kind: 'terrace' },
];
export function surfaceHeight(s: Surface, z: number) {
  return s.south + ((s.north - s.south) * (s.z + s.d / 2 - z)) / s.d;
}
export function grandHeight(x: number, z: number): number | undefined {
  const s = GRAND_SURFACES.find(
    (s) =>
      x >= s.x - s.w / 2 - 0.001 &&
      x <= s.x + s.w / 2 + 0.001 &&
      z >= s.z - s.d / 2 - 0.001 &&
      z <= s.z + s.d / 2 + 0.001,
  );
  return s ? surfaceHeight(s, z) : undefined;
}
export type GrandSolid = {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  base: number;
  round?: boolean;
};
export const GRAND_TREES = [
  [-48, 31],
  [-41, 35],
  [-30, 30],
  [-47, 13],
  [-18, 31],
  [43, 31],
  [51, 22],
  [48, -4],
  [-49, -20],
  [-20, -34],
  [20, -35],
  [-49, -50],
  [49, -50],
  [-20, -51],
  [20, -51],
];
export const GRAND_LAMPS = [
  ...Array.from({ length: 24 }, (_, i) => ({ x: i % 2 ? -9 : 9, z: 34 - Math.floor(i / 2) * 3.5 })),
  ...CAVES.flatMap((c) => [-1, 1].map((side) => ({ x: c.x + side * 6, z: c.z + 3 }))),
];
export const GRAND_CLIFFS: { x: number; y: number; z: number; scale: [number, number, number] }[] =
  [];
for (let i = 0; i < 16; i++)
  GRAND_CLIFFS.push({ x: -58 + i * 7.5, y: 6 + Math.sin(i * 3) * 2, z: -38, scale: [5.5, 11, 6] });
for (let i = 0; i < 12; i++)
  GRAND_CLIFFS.push({ x: -59 + i * 11, y: 12 + Math.sin(i) * 2, z: -61, scale: [9, 18, 9] });
for (let i = 0; i < 9; i++)
  for (const side of [-1, 1])
    GRAND_CLIFFS.push({ x: side * 59, y: 2 + Math.sin(i) * 2, z: -42 + i * 10, scale: [7, 13, 8] });
const cliffs = GRAND_CLIFFS.filter((p) => p.z !== -38 || Math.abs(Math.abs(p.x) - 37.5) > 9);
GRAND_CLIFFS.splice(0, GRAND_CLIFFS.length, ...cliffs);
export const GRAND_SOLIDS: GrandSolid[] = [
  { id: 'golden-ball', x: 0, z: 3, w: 6.6, d: 6.6, h: 2.1, base: 0, round: true },
  ...[-1, 1].flatMap((side) => [
    { id: `photo-pillar-${side}`, x: -15 + side * 2.523, z: 8.7, w: 0.64, d: 1.4, h: 3.5, base: 0 },
    {
      id: `photo-tripod-${side}`,
      x: -15 + side * 4,
      z: 12,
      w: 0.18,
      d: 0.18,
      h: 2.4,
      base: 0,
      round: true,
    },
  ]),
  { id: 'score', x: 0, z: -5.9, w: 8, d: 0.65, h: 2.2, base: 3.7 },
  { id: 'score-left', x: -4.5, z: -5.9, w: 0.3, d: 0.3, h: 5, base: 0 },
  { id: 'score-right', x: 4.5, z: -5.9, w: 0.3, d: 0.3, h: 5, base: 0 },
  { id: 'arena-back', x: -32, z: -1, w: 15, d: 0.6, h: 7, base: 0 },
  { id: 'arena-west', x: -39.2, z: 3.7, w: 0.5, d: 9, h: 4, base: 0 },
  { id: 'arena-east', x: -24.8, z: 3.7, w: 0.5, d: 9, h: 4, base: 0 },
  { id: 'prediction-orb', x: 24, z: -1.5, w: 2.4, d: 2.4, h: 2, base: 0, round: true },
  { id: 'ranking', x: 31, z: 2.4, w: 5, d: 0.7, h: 6.4, base: 0 },
  ...[
    [-24, 19],
    [-14, 19],
    [31, 14],
    [41, 14],
    [48, 5],
  ].map(([x, z], i) => ({ id: `stall-${i}`, x, z, w: 5.5, d: 3.2, h: 1.25, base: 0 })),
  ...[
    [18, 28],
    [25, 29],
    [32, 27],
  ].map(([x, z], i) => ({ id: `table-${i}`, x, z, w: 2, d: 2, h: 1.1, base: 0, round: true })),
  ...GRAND_LAMPS.filter((p) => grandHeight(p.x, p.z) !== undefined).map((p, i) => ({
    id: `lamp-${i}`,
    x: p.x,
    z: p.z,
    w: 0.25,
    d: 0.25,
    h: 3.5,
    base: grandHeight(p.x, p.z)!,
    round: true,
  })),
  ...GRAND_TREES.filter(([x, z]) => grandHeight(x, z) !== undefined).map(([x, z], i) => ({
    id: `tree-${i}`,
    x,
    z,
    w: 0.8,
    d: 0.8,
    h: 4,
    base: grandHeight(x, z)!,
    round: true,
  })),
  ...GRAND_CLIFFS.map((p, i) => ({
    id: `cliff-${i}`,
    x: p.x,
    z: p.z,
    w: p.scale[0] * 2.05,
    d: p.scale[2] * 1.5,
    h: p.scale[1] * 2.6,
    base: p.y - p.scale[1] * 1.3,
  })),
  ...[-1, 1].flatMap((x) =>
    [-1, 1].flatMap((z) => [
      {
        id: `arena-column-${x}-${z}`,
        x: -32 + x * 5.6,
        z: 2 + z * 4.2,
        w: 0.65,
        d: 0.65,
        h: 7,
        base: 0,
        round: true,
      },
      {
        id: `temple-column-${x}-${z}`,
        x: 24 + x * 4,
        z: -1 + z * 3,
        w: 0.46,
        d: 0.46,
        h: 5,
        base: 0,
        round: true,
      },
    ]),
  ),
  ...[-1, 1].map((side) => ({
    id: `arena-bench-${side}`,
    x: -32 + side * 5.6,
    z: 3,
    w: 2.1,
    d: 7,
    h: 0.25,
    base: 1.175,
  })),
  ...[
    [18, 28],
    [25, 29],
    [32, 27],
  ].flatMap(([x, z], i) =>
    Array.from({ length: 4 }, (_, j) => ({
      id: `chair-${i}-${j}`,
      x: x + Math.cos((j * Math.PI) / 2) * 1.6,
      z: z - Math.sin((j * Math.PI) / 2) * 1.6,
      w: 0.7,
      d: 0.7,
      h: 0.65,
      base: 0,
    })),
  ),
  ...[-1, 1].map((side) => ({
    id: `entrance-${side}`,
    x: side * 4.35 * 1.3,
    z: 37.6,
    w: 1.5,
    d: 3,
    h: 5,
    base: 0,
  })),
  ...[-1, 1].map((side) => ({
    id: `goal-${side}`,
    x: 14 + side * 4,
    z: 9,
    w: 0.14,
    d: 0.14,
    h: 3,
    base: 0,
  })),
  ...CAVES.map((c) => ({
    id: `${c.id}-rear`,
    x: c.x,
    z: c.z - 1.4,
    w: 7,
    d: 0.4,
    h: 8,
    base: c.height,
  })),
  ...CAVES.flatMap((c) => {
    const scale = c.id === 'united' || c.tier === 3 ? 1.2 : 1;
    return [-1, 1].map((side) => ({
      id: `${c.id}-pillar-${side}`,
      x: c.x + side * 4.35 * scale,
      z: c.z,
      w: 1.1 * scale,
      d: 2.4 * scale,
      h: 5.5 * scale,
      base: c.height,
    }));
  }),
];
export function grandWalkable(x: number, z: number, radius = 0.33) {
  if (
    grandHeight(x, z) === undefined ||
    x < -55 + radius ||
    x > 55 - radius ||
    z > 40 - radius ||
    z < -58 + radius
  )
    return false;
  return !GRAND_SOLIDS.some(
    (o) =>
      o.base <= (grandHeight(x, z) || 0) + 2.1 &&
      (o.round
        ? Math.hypot(x - o.x, z - o.z) < o.w / 2 + radius
        : Math.abs(x - o.x) < o.w / 2 + radius && Math.abs(z - o.z) < o.d / 2 + radius),
  );
}
export const GRAND_PLACES = [
  { id: 'statue', label: 'Tượng bóng vàng', x: 0, z: 7, kind: 'statue' },
  { id: 'score', label: 'Kết quả bóng đá · Demo', x: 0, z: -4, kind: 'score' },
  { id: 'arena', label: 'Đấu Trường Cà Khịa', x: -32, z: 7, kind: 'event' },
  { id: 'prediction', label: 'Đền Dự Đoán · Miễn phí', x: 24, z: 3, kind: 'board' },
  { id: 'photo', label: 'Góc Chụp Ảnh', x: -15, z: 10, kind: 'photo' },
  { id: 'minigame', label: 'Sân Minigame · Sút bóng', x: 14, z: 18, kind: 'minigame' },
  { id: 'shop', label: 'Quầy Cà Khịa', x: 41, z: 17, kind: 'shop' },
  { id: 'topup', label: 'Quầy Nạp Xu', x: 31, z: 17, kind: 'wallet' },
  { id: 'outfit', label: 'Quầy Trang Phục', x: -24, z: 22, kind: 'wallet' },
  { id: 'effects', label: 'Quầy Hiệu Ứng', x: -14, z: 22, kind: 'wallet' },
  { id: 'vip', label: 'Quầy VIP', x: 48, z: 8, kind: 'wallet' },
  { id: 'lounge', label: 'Khu Giao Lưu Fan', x: 25, z: 26, kind: 'event' },
  { id: 'ranking', label: 'Bảng Xếp Hạng Hang · Demo', x: 31, z: 4.5, kind: 'ranking' },
] as const;
