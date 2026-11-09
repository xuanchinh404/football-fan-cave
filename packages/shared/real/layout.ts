import type { Interaction, Point } from '../world';

export const REAL_WIRE = { origin: { x: 2000, y: 2000 }, scale: 0.025 };
export const REAL_FLOOR = -47;
export const REAL_BOUNDS = { l: 1360, r: 3840, t: 840, b: 2160 };
export const REAL_SEAT_DIRECTION = 0;
export const realWire = (x: number, z: number) => ({
  x: REAL_WIRE.origin.x + x / REAL_WIRE.scale,
  y: REAL_WIRE.origin.y + z / REAL_WIRE.scale,
});
export const realMetres = (p: Point) => ({
  x: (p.x - REAL_WIRE.origin.x) * REAL_WIRE.scale,
  z: (p.y - REAL_WIRE.origin.y) * REAL_WIRE.scale,
});

export const REAL_ROOMS = {
  refuge: { left: -16, right: 16, front: 4, back: -26, height: 12 },
  passage: { left: 16, right: 22, front: -11, back: -17, height: 6 },
  museum: { left: 22, right: 46, front: 1, back: -29, height: 11 },
} as const;
export const REAL_STAIR = { left: -4.4, right: 4.4, front: -16.5, back: -21.3, rise: 1.28 };
export const REAL_STAGE = { ...REAL_STAIR, front: REAL_STAIR.back, back: -26 };
export const realGround = (p: Point) => {
  const { x, z } = realMetres(p);
  const stair = REAL_STAIR;
  return x >= stair.left && x <= stair.right && z >= REAL_STAGE.back
    ? stair.rise * Math.max(0, Math.min(1, (stair.front - z) / (stair.front - stair.back)))
    : 0;
};

export const REAL_SEATS = [-12.75, -11.35, -9.95, -8.55].map((x) => ({ x, z: -6.28 }));
export const REAL_CUP_WALL = [-10.8, -7.2, -3.6, 0, 3.6, 7.2, 10.8];
// Coordinates for the museum's local north-facing view, then rotate it east.
export const realMuseumPoint = (x: number, z: number) => ({ x: 22 - z, z: -14 + x });

export const REAL_FURNITURE = [
  { x: -10.65, z: -7.72, w: 6.5, d: 1.95, h: 1.25 },
  { x: -10.65, z: -3.25, w: 2.7, d: 1.7, h: 0.8 },
  { x: -10.65, z: -11, w: 7.3, d: 0.8, h: 4.9 },
  { x: -6.3, z: -20, w: 2.3, d: 2.2, h: 1.1 },
  { x: 6.3, z: -20, w: 2.3, d: 2.2, h: 1.1 },
  { ...realMuseumPoint(-10, -9.5), w: 2.3, d: 2.5, h: 1.15 },
  ...REAL_CUP_WALL.map((x) => ({ ...realMuseumPoint(x, -21.8), w: 1.5, d: 2.65, h: 2.5 })),
  ...[-1, 1].flatMap((side) =>
    [-4.5, -13.7, -22].map((z) => ({
      ...realMuseumPoint(side * 13.65, z),
      w: 1.25,
      d: 1.25,
      h: 7,
    })),
  ),
  ...[-1, 1].flatMap((side) =>
    [-1, -11, -23.5].map((z) => ({ x: side * 14.85, z, w: 1.25, d: 1.25, h: 7 })),
  ),
];

export function realWalkable(p: Point) {
  const { x, z } = realMetres(p);
  return (
    Object.values(REAL_ROOMS).some(
      (r) =>
        x >= r.left - 0.001 && x <= r.right + 0.001 && z <= r.front + 0.001 && z >= r.back - 0.001,
    ) &&
    !REAL_FURNITURE.some((b) => Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) &&
    !(z < REAL_STAIR.front - 0.25 && Math.abs(Math.abs(x) - REAL_STAIR.right) < 0.18)
  );
}

export function realArea(p: Point) {
  const { x, z } = realMetres(p);
  if (z > REAL_ROOMS.refuge.front) return 'tunnel';
  if (x >= REAL_ROOMS.museum.left) return 'museum';
  if (x > REAL_ROOMS.refuge.right) return 'passage';
  if (x < -7 && z > -13 && z < 0) return 'lounge';
  return 'refuge';
}

const station = (
  id: string,
  label: string,
  kind: Interaction['kind'],
  x: number,
  z: number,
  radius = 2.6,
): Interaction => ({ id, label, kind, ...realWire(x, z), inspectRadius: radius / REAL_WIRE.scale });
const museum = (id: string, label: string, x: number, z: number, radius?: number) => {
  const p = realMuseumPoint(x, z);
  return station(id, label, 'exhibit', p.x, p.z, radius);
};
export const realInteractions = [
  ...REAL_SEATS.map(({ x, z }, i) => station('real-seat-' + i, 'Ngồi sofa', 'seat', x, z, 1.35)),
  station('real-score', 'Kết quả trận gần nhất', 'score', 0, -15),
  station('real-lounge-score', 'Bảng tin Madridistas', 'score', -6.25, -9.5, 2.2),
  museum('real-ancelotti', 'Carlo Ancelotti', -10, -7.6),
  museum('real-coaches', 'Các đời HLV', 0, -18.05, 2.1),
  museum('real-legends', 'Huyền thoại CLB', -11.9, -15),
  museum('real-matches', 'Những trận đấu để đời', -11.9, -19.5),
  museum('real-timeline', 'Dòng thời gian lịch sử', 11.9, -10),
  museum('real-gallery', 'Thư viện ảnh', 11.9, -18),
  ...REAL_CUP_WALL.map((x, i) => museum('real-cup-' + i, 'Danh hiệu & Cúp', x, -20.25, 1.85)),
];
