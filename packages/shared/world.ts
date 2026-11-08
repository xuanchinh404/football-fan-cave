import type { Loadout } from './store/state';
import { CITY_OBSTACLES, cityGround, cityWalkable, cityWire } from './city/layout';
import { cityInteractions } from './city/content';
import { corridorSurface, isCaveZone, isRefuge, REFUGE_BOUNDS, REFUGE_WIRE } from './caveConnections';
import { KOP_CAVE, KOP_MUSEUM, insideLiverpoolFootprint, liverpoolGround, liverpoolWire } from './liverpool/layout';
import { liverpoolExhibits } from './liverpool/content';
import { ARSENAL_CAVE, ARSENAL_MUSEUM, arsenalGround, gunnersWire } from './arsenal/layout';
import { arsenalExhibits } from './arsenal/content';
import { BLUES_CAVE, BLUES_MUSEUM, bluesWire, bluesGround } from './chelsea/layout';
import { chelseaExhibits } from './chelsea/content';
import {
  CAVES,
  GRAND_PLACES,
  GRAND_SOLIDS,
  GRAND_ORIGIN,
  GRAND_SCALE,
  grandWire,
  grandMetres,
  grandHeight,
  grandWalkable,
  type CaveId,
} from './grandHall';
import { HALL } from './museum/index';
import { hallExit, hallObstacles, hallStations } from './museum/hall';
import { RED_CAVE } from './cave';
export type TeamId = 'united' | 'arsenal' | 'liverpool' | 'chelsea' | 'city' | 'common';
export type MapId =
  | 'plaza'
  | 'hall-of-legends'
  | 'chelsea-museum'
  | 'arsenal-museum'
  | 'liverpool-museum'
  | TeamId
  | CaveId;
export type Point = { x: number; y: number };
export type Profile = { nickname: string; team: TeamId; avatar: number };
export type Player = Profile &
  Point & {
    id: string;
    map: MapId;
    direction: number;
    moving: boolean;
    motion?: 'Run' | 'Jump';
    airOffset?: number;
    height?: number;
    seated?: boolean;
    loadout?: Loadout;
  };
export type ChatMessage = {
  id: string;
  playerId: string;
  nickname: string;
  team: TeamId;
  text: string;
  time: number;
  system?: boolean;
  map?: MapId;
  channel?: 'room' | 'nearby';
};
export const TEAMS: {
  id: TeamId;
  name: string;
  short: string;
  color: string;
  icon: string;
  tagline: string;
}[] = [
  {
    id: 'united',
    name: 'Hang Quỷ Đỏ',
    short: 'Quỷ Đỏ',
    color: '#ff493b',
    icon: '♆',
    tagline: 'Phong độ là nhất thời. Tình yêu là mãi mãi.',
  },
  {
    id: 'arsenal',
    name: 'Hang Pháo Thủ',
    short: 'Pháo Thủ',
    color: '#ff6c37',
    icon: '➶',
    tagline: 'Giữ lửa đam mê, chờ ngày nâng cúp.',
  },
  {
    id: 'liverpool',
    name: 'Hang Liverpool',
    short: 'The Kop',
    color: '#ff457b',
    icon: '♜',
    tagline: 'Bạn sẽ không bao giờ đi một mình.',
  },
  {
    id: 'chelsea',
    name: 'Hang The Blues',
    short: 'The Blues',
    color: '#4088ff',
    icon: '♞',
    tagline: 'Sắc xanh không bao giờ phai.',
  },
  {
    id: 'city',
    name: 'Hang Citizens',
    short: 'Citizens',
    color: '#38e4f5',
    icon: '✦',
    tagline: 'Bầu trời xanh, câu chuyện mới.',
  },
  {
    id: 'common',
    name: 'Trung lập',
    short: 'Trung lập',
    color: '#c470ff',
    icon: '◈',
    tagline: 'Khác màu áo, chung nhịp đập.',
  },
];
export const MAP_SIZE = { width: 6000, height: 5000 };
export const SPAWN = grandWire(0, 27);
export const SPEED = 220;
export const RUN_SPEED = 330;
export type Interaction = Point & {
  id: string;
  label: string;
  inspectRadius?: number;
  kind:
    | 'portal'
    | 'shop'
    | 'score'
    | 'support'
    | 'event'
    | 'seat'
    | 'statue'
    | 'board'
    | 'passage'
    | 'photo'
    | 'exhibit'
    | 'minigame'
    | 'wallet'
    | 'ranking';
  target?: MapId;
  destination?: Point;
};
export const PORTALS: Interaction[] = CAVES.map((c) => ({
  ...grandWire(c.x, c.z + 0.9),
  id: c.id,
  label: c.name,
  kind: 'portal',
  target: c.id,
}));
export const isOpenCave = (map: MapId | undefined) =>
  CAVES.some((cave) => cave.id === map && cave.available);
export type Rect = { x: number; y: number; w: number; h: number };
export function interactions(map: MapId): Interaction[] {
  if (map === 'city') return cityInteractions;
  if (isRefuge(map)) return [];
  if (map === 'liverpool-museum')
    return [
      ...liverpoolExhibits.map((e) => ({
        ...liverpoolWire(e.approach.x, e.approach.z),
        id: e.id,
        label: 'Khám phá · ' + e.heading,
        kind: 'exhibit' as const,
        ...(e.type === 'manager' ? { inspectRadius: 240 } : {}),
      })),
      {
        ...KOP_MUSEUM.exit,
        id: 'kop-museum-exit',
        label: 'Về Hang Liverpool',
        kind: 'portal',
        target: 'liverpool',
      },
    ];
  if (map === 'liverpool')
    return [
      {
        ...KOP_CAVE.entry,
        id: 'kop-museum-entry',
        label: 'Vào Phòng Truyền Thống Liverpool',
        kind: 'portal',
        target: 'liverpool-museum',
      },
      { ...KOP_CAVE.score, id: 'kop-score', label: 'Bảng trận đấu · DEMO', kind: 'score' },
      ...KOP_CAVE.seats.map((p, i) => ({
        ...p,
        id: 'kop-seat-' + i,
        label: 'Ngồi / đứng dậy',
        kind: 'seat' as const,
      })),
    ];
  if (map === 'arsenal-museum')
    return [
      ...arsenalExhibits.map((e) => ({
        id: e.id,
        label: 'Khám phá · ' + e.heading,
        kind: 'exhibit' as const,
        ...(e.type === 'manager' ? { inspectRadius: 240 } : {}),
        ...gunnersWire(e.approach?.x ?? e.x, e.approach?.z ?? e.z + 1.65),
      })),
      {
        id: 'arsenal-museum-exit',
        ...ARSENAL_MUSEUM.exit,
        label: 'Về Hang Arsenal',
        kind: 'portal',
        target: 'arsenal',
      },
    ];
  if (map === 'arsenal')
    return [
      {
        id: 'arsenal-museum-entry',
        ...ARSENAL_CAVE.entry,
        label: 'Vào Phòng Truyền Thống Arsenal',
        kind: 'portal',
        target: 'arsenal-museum',
      },
      {
        id: 'arsenal-exit',
        ...ARSENAL_CAVE.exit,
        label: 'Ra Hang · Đại Sảnh Chung',
        kind: 'portal',
        target: 'plaza',
      },
      { id: 'arsenal-score', ...ARSENAL_CAVE.score, label: 'Tỷ số minh họa · DEMO', kind: 'score' },
      ...ARSENAL_CAVE.seats.map((p, i) => ({
        ...p,
        id: 'arsenal-seat-' + i,
        label: 'Ngồi / đứng dậy',
        kind: 'seat' as const,
      })),
    ];

  if (map === 'chelsea-museum')
    return [
      ...chelseaExhibits.map((e) => ({
        id: e.id,
        label: 'Khám phá · ' + e.heading,
        ...bluesWire(
          e.x,
          e.z +
            (e.id.startsWith('blues-manager-') ? 0 : e.id === 'blues-drogba-statue' ? 2.4 : 1.65),
        ),
        ...(e.id.startsWith('blues-manager-') ? { inspectRadius: 240 } : {}),
        kind: 'exhibit' as const,
      })),
      {
        id: 'blues-museum-exit',
        ...bluesWire(0, 19.5),
        label: 'Quay về Hang The Blues',
        kind: 'portal',
        target: 'chelsea',
      },
    ];
  if (map === 'chelsea')
    return [
      {
        id: 'blues-museum-entry',
        ...bluesWire(10, -21),
        label: 'Vào Phòng Truyền Thống Chelsea',
        kind: 'portal',
        target: 'chelsea-museum',
      },
      {
        id: 'blues-exit',
        ...bluesWire(0, 15),
        label: 'Cổng Ra Hang · Đại Sảnh Chung',
        kind: 'portal',
        target: 'plaza',
      },
      { id: 'blues-score', ...bluesWire(0, -3.5), label: 'Kết quả minh họa · DEMO', kind: 'score' },
      {
        id: 'blues-board',
        ...bluesWire(12, 4.7),
        label: 'Hôm nay trong Hang The Blues',
        kind: 'board',
      },
      ...BLUES_CAVE.seats.map((p, i) => ({
        ...p,
        id: 'blues-seat-' + i,
        label: 'Ngồi / đứng dậy',
        kind: 'seat' as const,
      })),
    ];
  if (map === 'hall-of-legends')
    return [
      ...hallStations.map(({ title, ...station }) => ({
        ...station,
        label: 'Khám phá · ' + title.vi,
        kind: 'exhibit' as const,
      })),
      { ...hallExit, label: 'Quay về Hang Quỷ Đỏ', kind: 'portal', target: 'united' },
      { id: 'hall-photo', x: 2100, y: 3010, label: 'Chụp ảnh kỷ niệm', kind: 'photo' },
    ];
  if (map === 'united')
    return [
      {
        id: 'hall-entry',
        x: 2048,
        y: 1100,
        label: 'Lối vào Phòng Truyền Thống',
        kind: 'portal',
        target: 'hall-of-legends',
      },
      {
        x: 2048,
        y: 2750,
        id: 'exit',
        label: 'Cổng Ra Hang · Đại Sảnh Chung',
        kind: 'portal',
        target: 'plaza',
      },
      { x: 3190, y: 1810, id: 'shop', label: 'Mở Quầy Cà Khịa', kind: 'shop' },
      { x: 920, y: 1320, id: 'score', label: 'Thông tin trận đấu · DEMO', kind: 'score' },
      {
        x: 2048,
        y: 1810,
        id: 'statue',
        label: 'Sảnh Trú Ẩn · Câu chuyện của hang',
        kind: 'statue',
      },
      { x: 1560, y: 2000, id: 'board', label: 'Bảng hoạt động trong hang', kind: 'board' },
      {
        x: 1040,
        y: 720,
        id: 'fun',
        label: 'Vào khu giải trí',
        kind: 'passage',
        destination: { x: 840, y: 540 },
      },
      {
        x: 840,
        y: 640,
        id: 'fun-back',
        label: 'Trở lại sảnh chính',
        kind: 'passage',
        destination: { x: 1040, y: 910 },
      },
      { x: 700, y: 490, id: 'photo', label: 'Góc chụp ảnh · tạo dáng', kind: 'photo' },
      {
        x: 3100,
        y: 710,
        id: 'event-gate',
        label: 'Vào khu sự kiện',
        kind: 'passage',
        destination: { x: 3260, y: 530 },
      },
      {
        x: 3260,
        y: 640,
        id: 'event-back',
        label: 'Trở lại sảnh chính',
        kind: 'passage',
        destination: { x: 3100, y: 900 },
      },
      { x: 3460, y: 530, id: 'event', label: 'Lịch hoạt động cộng đồng', kind: 'event' },
      ...RED_CAVE.seats.map((p, i) => ({
        ...p,
        id: `seat-${i}`,
        label: 'Ngồi / đứng dậy',
        kind: 'seat' as const,
      })),
    ];
  return map === 'plaza'
    ? [
        ...PORTALS.filter((portal) => portal.id !== 'liverpool'),
        ...GRAND_PLACES.map((p) => ({
          ...grandWire(p.x, p.z),
          id: p.id,
          label: p.label,
          kind: p.kind,
        })),
      ]
    : [
        { x: 1200, y: 1510, id: 'exit', label: 'Về quảng trường', kind: 'portal', target: 'plaza' },
        { x: 1630, y: 860, id: 'shop', label: 'Quầy Cà Khịa', kind: 'shop' },
        { x: 770, y: 850, id: 'score', label: 'Bảng tin cộng đồng', kind: 'score' },
        { x: 1200, y: 460, id: 'event', label: 'Phòng truyền thống', kind: 'event' },
      ];
}
export function spawn(map: MapId): Point {
  if (map === 'city') return cityWire(0, -4);
  if (isRefuge(map)) return { ...REFUGE_WIRE.origin };
  if (map === 'liverpool') return KOP_CAVE.spawn;
  if (map === 'liverpool-museum') return KOP_MUSEUM.spawn;
  if (map === 'arsenal') return { ...ARSENAL_CAVE.spawn };
  if (map === 'arsenal-museum') return { ...ARSENAL_MUSEUM.spawn };
  if (map === 'chelsea') return { ...BLUES_CAVE.spawn };
  if (map === 'chelsea-museum') return { ...BLUES_MUSEUM.spawn };
  return map === 'hall-of-legends'
    ? { ...HALL.spawn }
    : map === 'united'
      ? { ...RED_CAVE.spawn }
      : map === 'plaza'
        ? { ...SPAWN }
        : { x: 1200, y: 1370 };
}
export function obstacles(map: MapId): Rect[] {
  if (map === 'city') return CITY_OBSTACLES;
  if (isRefuge(map)) {
    const { origin, scale } = REFUGE_WIRE;
    return [-4.9, 4.9].map((x) => ({
      x: origin.x + (x - 0.68) / scale, y: origin.y - 7.95 / scale, w: 1.36 / scale, h: 4.5 / scale,
    }));
  }
  if (map === 'liverpool') return KOP_CAVE.obstacles;
  if (map === 'liverpool-museum') return KOP_MUSEUM.obstacles;
  if (map === 'arsenal') return ARSENAL_CAVE.obstacles;
  if (map === 'arsenal-museum') return ARSENAL_MUSEUM.obstacles;
  if (map === 'chelsea') return BLUES_CAVE.obstacles;
  if (map === 'chelsea-museum') return BLUES_MUSEUM.obstacles;
  if (map === 'hall-of-legends') return hallObstacles;
  if (map === 'united') return RED_CAVE.obstacles.map((o) => ({ ...o }));
  return map === 'plaza'
    ? GRAND_SOLIDS.map((o) => ({
        ...grandWire(o.x - o.w / 2, o.z - o.d / 2),
        w: o.w / GRAND_SCALE,
        h: o.d / GRAND_SCALE,
      }))
    : [
        { x: 1090, y: 430, w: 220, h: 145 },
        { x: 690, y: 735, w: 180, h: 80 },
        { x: 1540, y: 730, w: 200, h: 90 },
        { x: 680, y: 1040, w: 200, h: 70 },
        { x: 1540, y: 1040, w: 200, h: 70 },
      ];
}
export function walkable(map: MapId, x: number, y: number) {
  if (map === 'plaza') {
    const p = grandMetres({ x, y });
    return grandWalkable(p.x, p.z);
  }
  if (isCaveZone(map) && corridorSurface(map, { x, y }) !== undefined) return true;
  if (map === 'city') return cityWalkable({ x, y });
  if (map === 'liverpool' && !insideLiverpoolFootprint({ x, y })) return false;
  const b =
    isRefuge(map) ? REFUGE_BOUNDS : map === 'liverpool'
      ? KOP_CAVE.bounds
      : map === 'liverpool-museum'
        ? KOP_MUSEUM.bounds
        : map === 'arsenal'
          ? ARSENAL_CAVE.bounds
          : map === 'arsenal-museum'
            ? ARSENAL_MUSEUM.bounds
            : map === 'chelsea'
              ? BLUES_CAVE.bounds
              : map === 'chelsea-museum'
                ? BLUES_MUSEUM.bounds
                : map === 'hall-of-legends'
                  ? HALL.bounds
                  : map === 'united'
                    ? RED_CAVE.bounds
                    : { l: 580, r: 1820, t: 420, b: 1550 };
  return (
    x >= b.l &&
    x <= b.r &&
    y >= b.t &&
    y <= b.b &&
    !obstacles(map).some(
      (o) => x > o.x - 13 && x < o.x + o.w + 13 && y > o.y - 8 && y < o.y + o.h + 8,
    )
  );
}
export function move(map: MapId, point: Point, dx: number, dy: number): Point {
  let { x, y } = point;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
  for (let i = 0; i < steps; i++) {
    if (walkable(map, x + dx / steps, y)) x += dx / steps;
    if (walkable(map, x, y + dy / steps)) y += dy / steps;
  }
  return { x, y };
}
export function clearPath(map: MapId, a: Point, b: Point) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8));
  let previousHeight = groundHeight(map, a);
  for (let i = 1; i <= steps; i++) {
    const point = { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps };
    const h = groundHeight(map, point);
    if (h === undefined || previousHeight === undefined || Math.abs(h - previousHeight) > 0.25)
      return false;
    previousHeight = h;
    if (!walkable(map, a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps))
      return false;
  }
  return true;
}
export function near(map: MapId, p: Point) {
  let closest: Interaction | undefined;
  let distance = 125;
  for (const item of interactions(map)) {
    const d = Math.hypot(item.x - p.x, item.y - p.y);
    if (d < Math.min(distance, item.inspectRadius ?? 125)) {
      closest = item;
      distance = d;
    }
  }
  return closest;
}
export function validMap(value: unknown): value is MapId {
  return (
    value === 'plaza' ||
    value === 'hall-of-legends' ||
    value === 'chelsea-museum' ||
    value === 'arsenal-museum' ||
    value === 'liverpool-museum' ||
    TEAMS.some((t) => t.id === value) ||
    CAVES.some((c) => c.id === value)
  );
}
export function cleanText(value: unknown, max = 180): string {
  return typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001f<>]/g, '')
        .trim()
        .slice(0, max)
    : '';
}
export function validProfile(value: any): Profile | null {
  if (!value || !TEAMS.some((t) => t.id === value.team)) return null;
  const nickname = cleanText(value.nickname, 20);
  if (nickname.length < 2) return null;
  return {
    nickname,
    team: value.team,
    avatar: Number.isInteger(value.avatar) ? Math.max(0, Math.min(3, value.avatar)) : 0,
  };
}
export const EMOJIS = ['⚽', '😂', '🔥', '❤️', '🏆', '🍅'];
export const STICKERS = [
  'Phong độ là nhất thời 😎',
  'Hẹn mùa sau nhé! 😂',
  'Vào hang có anh em! ❤️',
  'Trận sau mình làm lại ⚽',
];

export function mapSize(map: MapId) {
  return map === 'hall-of-legends'
    ? { width: HALL.width, height: HALL.height }
    : map === 'united'
      ? { width: RED_CAVE.width, height: RED_CAVE.height }
      : MAP_SIZE;
}
export function roomKey(map: MapId) {
  if (map === 'liverpool') return 'cave:liverpool';
  if (map === 'liverpool-museum') return 'museum:liverpool';
  if (map === 'arsenal') return 'cave:arsenal';
  if (map === 'arsenal-museum') return 'museum:arsenal';
  if (map === 'chelsea') return 'cave:chelsea';
  if (map === 'chelsea-museum') return 'museum:chelsea';
  return map === 'hall-of-legends'
    ? 'cave:red-devils:hall-of-legends'
    : map === 'united'
      ? 'cave:red-devils'
      : map;
}
export function plazaReturn(from: MapId): Point {
  const p = PORTALS.find((p) => p.target === from);
  return p ? { x: p.x, y: p.y + 110 } : spawn('plaza');
}

export function groundHeight(map: MapId, p: Point) {
  if (isCaveZone(map)) {
    const corridor = corridorSurface(map, p);
    if (corridor !== undefined) return corridor;
  }
  if (map === 'city') return cityGround(p);
  if (map === 'liverpool') return liverpoolGround(p);
  if (map === 'chelsea') return bluesGround(p);
  if (map === 'arsenal') return arsenalGround(p);
  if (map !== 'plaza') return 0;
  const q = grandMetres(p);
  return grandHeight(q.x, q.z);
}

/** Shared arrival positions keep offline and authoritative transitions identical. */
export function arrival(from: MapId, target: MapId): Point {
  if (target === 'plaza') return plazaReturn(from);
  if (from === 'liverpool-museum' && target === 'liverpool')
    return { ...KOP_CAVE.returnFromMuseum };
  if (from === 'hall-of-legends' && target === 'united') return { x: 2048, y: 1100 };
  if (from === 'arsenal-museum' && target === 'arsenal')
    return { ...ARSENAL_CAVE.returnFromMuseum };
  if (from === 'chelsea-museum' && target === 'chelsea') return { ...BLUES_CAVE.returnFromMuseum };
  return spawn(target);
}
