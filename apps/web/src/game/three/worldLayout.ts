import { REAL_BOUNDS, REAL_WIRE } from '../../../../../packages/shared/real/layout';
import { BARCA_BOUNDS, BARCA_WIRE } from '../../../../../packages/shared/barcelona/layout';
import { CITY_BOUNDS, CITY_WIRE } from '../../../../../packages/shared/city/layout';
import {
  caveOffset,
  isConnectedZone,
  REFUGE_BOUNDS,
  REFUGE_WIRE,
  UNITED_WIRE,
  type ConnectedZone,
} from '../../../../../packages/shared/caveConnections';
import {
  KOP_CAVE,
  KOP_MUSEUM,
  LIVERPOOL_ORIGIN,
  LIVERPOOL_SCALE,
} from '../../../../../packages/shared/liverpool/layout';
import {
  ARSENAL_CAVE,
  ARSENAL_MUSEUM,
  ARSENAL_ORIGIN,
  ARSENAL_SCALE,
} from '../../../../../packages/shared/arsenal/layout';
import {
  BLUES_CAVE,
  BLUES_MUSEUM,
  CHELSEA_ORIGIN,
  CHELSEA_SCALE,
} from '../../../../../packages/shared/chelsea/layout';
import { GRAND_ORIGIN, GRAND_SCALE, GRAND_BOUNDS } from '../../../../../packages/shared/grandHall';
import {
  interactions,
  obstacles,
  type Interaction,
  type MapId,
  type Point,
} from '../../../../../packages/shared/world';
import { HALL } from '../../../../../packages/shared/museum';
import { MU_MUSEUM_ORIGIN, MU_MUSEUM_SCALE } from '../../../../../packages/shared/museum/hall';
import { RED_CAVE } from '../../../../../packages/shared/cave';

export type SceneId =
  | ConnectedZone
  | 'hall-of-legends'
  | 'chelsea-museum'
  | 'arsenal-museum'
  | 'liverpool-museum';
// Interaction layouts retain local wire coordinates. The connected areas share a world transform.
const refugeLayout = { ...REFUGE_WIRE, bounds: REFUGE_BOUNDS };
export const layouts = {
  bayern: refugeLayout,
  psg: refugeLayout,
  real: { ...REAL_WIRE, bounds: REAL_BOUNDS },
  city: { ...CITY_WIRE, bounds: CITY_BOUNDS },
  barcelona: { ...BARCA_WIRE, bounds: BARCA_BOUNDS },
  liverpool: { scale: LIVERPOOL_SCALE, origin: LIVERPOOL_ORIGIN, bounds: KOP_CAVE.bounds },
  'liverpool-museum': {
    scale: LIVERPOOL_SCALE,
    origin: LIVERPOOL_ORIGIN,
    bounds: KOP_MUSEUM.bounds,
  },
  arsenal: { scale: ARSENAL_SCALE, origin: ARSENAL_ORIGIN, bounds: ARSENAL_CAVE.bounds },
  'arsenal-museum': { scale: ARSENAL_SCALE, origin: ARSENAL_ORIGIN, bounds: ARSENAL_MUSEUM.bounds },

  chelsea: { scale: CHELSEA_SCALE, origin: CHELSEA_ORIGIN, bounds: BLUES_CAVE.bounds },
  'chelsea-museum': { scale: CHELSEA_SCALE, origin: CHELSEA_ORIGIN, bounds: BLUES_MUSEUM.bounds },
  plaza: {
    scale: GRAND_SCALE,
    origin: GRAND_ORIGIN,
    bounds: {
      l: GRAND_BOUNDS.left / GRAND_SCALE + GRAND_ORIGIN.x,
      r: GRAND_BOUNDS.right / GRAND_SCALE + GRAND_ORIGIN.x,
      t: GRAND_BOUNDS.top / GRAND_SCALE + GRAND_ORIGIN.y,
      b: GRAND_BOUNDS.bottom / GRAND_SCALE + GRAND_ORIGIN.y,
    },
  },
  'hall-of-legends': { scale: MU_MUSEUM_SCALE, origin: MU_MUSEUM_ORIGIN, bounds: HALL.bounds },
  united: { ...UNITED_WIRE, bounds: RED_CAVE.bounds },
} as const;
export function toScene(map: SceneId, p: Point): [number, number] {
  const { scale, origin } = layouts[map];
  return [(p.x - origin.x) * scale, (p.y - origin.y) * scale];
}
export function toNetwork(map: SceneId, x: number, z: number): Point {
  const { scale, origin } = layouts[map];
  return { x: x / scale + origin.x, y: z / scale + origin.y };
}
export function worldPosition(map: SceneId, p: Point, height: number): [number, number, number] {
  const [x, z] = toScene(map, p);
  const [dx, dy, dz] = caveOffset(map);
  return [x + dx, height + dy, z + dz];
}

export function zonePosition(
  map: SceneId,
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  const [dx, dy, dz] = caveOffset(map);
  return [x - dx, y - dy, z - dz];
}

export function sceneBounds(map: SceneId) {
  const { bounds } = layouts[map];
  const [left, top] = toScene(map, { x: bounds.l, y: bounds.t });
  const [right, bottom] = toScene(map, { x: bounds.r, y: bounds.b });
  return { left, right, top, bottom };
}
export function sceneObstacles(map: SceneId) {
  return obstacles(map).map((o, index) => {
    const [x, z] = toScene(map, { x: o.x + o.w / 2, y: o.y + o.h / 2 });
    const height =
      'height' in o
        ? Number(o.height)
        : map === 'hall-of-legends'
          ? 3.3
          : index === 0
            ? 1.6
            : index === 2
              ? 5
              : [4, 7, 8, 9, 10, 14, 15].includes(index)
                ? 10
                : index >= 16
                  ? 8
                  : index === 11
                    ? 0.65
                    : 2.4;
    return { x, z, w: o.w * layouts[map].scale, d: o.h * layouts[map].scale, index, height };
  });
}
export function playtestInteractions(map: MapId): Interaction[] {
  if (!(map in layouts)) return [];
  return interactions(map).filter(
    (p) =>
      !(p.kind === 'portal' && p.target && isConnectedZone(map) && isConnectedZone(p.target)) &&
      !(
        map === 'united' &&
        ['fun', 'fun-back', 'event-gate', 'event-back', 'photo', 'event'].includes(p.id)
      ),
  );
}
export function playtestNear(map: MapId, p: Point) {
  return playtestInteractions(map).reduce<Interaction | undefined>((best, item) => {
    const distance = Math.hypot(item.x - p.x, item.y - p.y);
    return distance < Math.min(125, item.inspectRadius ?? 125) && (!best || distance < Math.hypot(best.x - p.x, best.y - p.y))
      ? item
      : best;
  }, undefined);
}
