import { GRAND_ORIGIN, GRAND_SCALE, GRAND_BOUNDS } from '../../../../../packages/shared/grandHall';
import {
  interactions,
  obstacles,
  type Interaction,
  type MapId,
  type Point,
} from '../../../../../packages/shared/world';
import { RED_CAVE } from '../../../../../packages/shared/cave';

export type SceneId = 'plaza' | 'united';
// Keep the existing authoritative Socket.IO room coordinates. Only the renderer uses metres.
export const layouts = {
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
  united: { scale: 0.0125, origin: { x: 2048, y: 2180 }, bounds: RED_CAVE.bounds },
} as const;
export function toScene(map: SceneId, p: Point): [number, number] {
  const { scale, origin } = layouts[map];
  return [(p.x - origin.x) * scale, (p.y - origin.y) * scale];
}
export function toNetwork(map: SceneId, x: number, z: number): Point {
  const { scale, origin } = layouts[map];
  return { x: x / scale + origin.x, y: z / scale + origin.y };
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
    return { x, z, w: o.w * layouts[map].scale, d: o.h * layouts[map].scale, index };
  });
}
export function playtestInteractions(map: MapId): Interaction[] {
  if (map === 'plaza') return interactions(map);
  if (map === 'united')
    return interactions(map).filter((p) =>
      ['exit', 'shop', 'score', 'statue', 'board'].includes(p.id),
    );
  return [];
}
export function playtestNear(map: MapId, p: Point) {
  return playtestInteractions(map).reduce<Interaction | undefined>((best, item) => {
    const distance = Math.hypot(item.x - p.x, item.y - p.y);
    return distance < 125 && (!best || distance < Math.hypot(best.x - p.x, best.y - p.y))
      ? item
      : best;
  }, undefined);
}
