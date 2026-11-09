import { REAL_FLOOR, REAL_WIRE, REAL_BOUNDS } from './real/layout';
import { BARCA_FLOOR, BARCA_WIRE } from './barcelona/layout';
import { CITY_FLOOR, CITY_WIRE } from './city/layout';
import { ARSENAL_CAVE, ARSENAL_ORIGIN, ARSENAL_SCALE } from './arsenal/layout';
import { RED_CAVE } from './cave';
import { BLUES_CAVE, CHELSEA_ORIGIN, CHELSEA_SCALE } from './chelsea/layout';
import {
  caveEntrance,
  CAVES,
  CORRIDOR_HALF_WIDTH,
  descentStart,
  grandMetres,
  grandWire,
  type CaveId,
} from './grandHall';
import { KOP_TUNNEL, LIVERPOOL_ORIGIN, LIVERPOOL_SCALE } from './liverpool/layout';
import type { MapId, Point } from './world';

export const UNITED_WIRE = { origin: { x: 2048, y: 2180 }, scale: 0.0125 };
export const REFUGE_WIRE = { origin: { x: 2000, y: 2000 }, scale: 0.025 };
export const REFUGE_BOUNDS = { l: 1760, r: 2240, t: 1520, b: 2160 };
export type RefugeId = Exclude<CaveId, 'liverpool' | 'united' | 'arsenal' | 'chelsea' | 'city' | 'barcelona' | 'real'>;
export type ConnectedZone = 'plaza' | CaveId;
export const isCaveZone = (map: unknown): map is CaveId => CAVES.some((cave) => cave.id === map);
export const isConnectedZone = (map: MapId): map is ConnectedZone =>
  map === 'plaza' || isCaveZone(map);
export const isRefuge = (map: MapId): map is RefugeId =>
  isCaveZone(map) &&
  map !== 'united' &&
  map !== 'arsenal' &&
  map !== 'chelsea' &&
  map !== 'liverpool' &&
  map !== 'city' &&
  map !== 'barcelona' &&
  map !== 'real';

const legacyRooms = {
  real: { ...REAL_WIRE, bottom: REAL_BOUNDS.b, floor: REAL_FLOOR, runout: 4 },
  barcelona: { ...BARCA_WIRE, bottom: BARCA_WIRE.origin.y, floor: BARCA_FLOOR, runout: 2 },
  // Wide halls overlap in plan, so keep their roofs clear of the floor above.
  city: { ...CITY_WIRE, bottom: CITY_WIRE.origin.y, floor: CITY_FLOOR, runout: 3 },
  arsenal: {
    origin: ARSENAL_ORIGIN,
    scale: ARSENAL_SCALE,
    bottom: ARSENAL_CAVE.bounds.b,
    floor: -17,
    runout: 10,
  },
  chelsea: {
    origin: CHELSEA_ORIGIN,
    scale: CHELSEA_SCALE,
    bottom: BLUES_CAVE.bounds.b,
    floor: -15,
    runout: 8,
  },
  united: { ...UNITED_WIRE, bottom: RED_CAVE.bounds.b, floor: -32, runout: 2 },
};

const refugeFloors: Record<RefugeId, number> = {
  bayern: 13.6,
  psg: 13.6,
};

export type CaveConnection = {
  id: CaveId;
  origin: Point;
  scale: number;
  offset: readonly [number, number, number];
  rampStart: number;
  rampEnd: number;
  roomMouth: number;
};

export const CAVE_CONNECTIONS = Object.fromEntries(
  CAVES.map((cave) => {
    const gate = caveEntrance(cave);
    if (cave.id === 'liverpool') {
      const offset = [
        gate.x - KOP_TUNNEL.x,
        gate.height - KOP_TUNNEL.steps * KOP_TUNNEL.rise,
        gate.z - KOP_TUNNEL.door,
      ] as const;
      return [
        cave.id,
        {
          id: cave.id,
          origin: LIVERPOOL_ORIGIN,
          scale: LIVERPOOL_SCALE,
          offset,
          rampStart: offset[2] + KOP_TUNNEL.landingStart,
          rampEnd: offset[2] + KOP_TUNNEL.stairStart,
          roomMouth: offset[2] + KOP_TUNNEL.start,
        },
      ];
    }
    const room =
      cave.id in legacyRooms
        ? legacyRooms[cave.id as keyof typeof legacyRooms]
        : {
            ...REFUGE_WIRE,
            bottom: REFUGE_BOUNDS.b,
            floor: refugeFloors[cave.id as RefugeId],
            runout: 2,
          };
    const rampStart = descentStart(cave);
    const rampEnd = rampStart - Math.max(4, (cave.height - room.floor) / 0.86);
    const roomMouth = rampEnd - room.runout;
    return [
      cave.id,
      {
        id: cave.id,
        origin: room.origin,
        scale: room.scale,
        offset: [gate.x, room.floor, roomMouth - (room.bottom - room.origin.y) * room.scale],
        rampStart,
        rampEnd,
        roomMouth,
      },
    ];
  }),
) as Record<CaveId, CaveConnection>;

export const caveOffset = (map: MapId) =>
  isCaveZone(map) ? CAVE_CONNECTIONS[map].offset : ([0, 0, 0] as const);

/** All outdoor and refuge movement uses the same wire origin and metres scale. */
export function toWorldPoint(map: MapId, p: Point): Point {
  if (!isCaveZone(map)) return p;
  const { origin, scale, offset } = CAVE_CONNECTIONS[map];
  return grandWire((p.x - origin.x) * scale + offset[0], (p.y - origin.y) * scale + offset[2]);
}

export function fromWorldPoint(map: MapId, p: Point): Point {
  if (!isCaveZone(map)) return p;
  const { x, z } = grandMetres(p);
  const { origin, scale, offset } = CAVE_CONNECTIONS[map];
  return { x: (x - offset[0]) / scale + origin.x, y: (z - offset[2]) / scale + origin.y };
}

export function corridorSurface(map: CaveId, point: Point) {
  if (map === 'liverpool') return undefined;
  const c = CAVES.find((cave) => cave.id === map)!;
  const gate = caveEntrance(c);
  const { x, z } = grandMetres(toWorldPoint(map, point));
  const { rampStart, rampEnd, roomMouth, offset } = CAVE_CONNECTIONS[map];
  if (z < roomMouth - 0.001 || z > gate.z + 0.001 || Math.abs(x - gate.x) > CORRIDOR_HALF_WIDTH)
    return undefined;
  const fraction = Math.max(0, Math.min(1, (z - rampEnd) / (rampStart - rampEnd)));
  return (gate.height - offset[1]) * fraction;
}

export function zoneAtDoor(
  zone: ConnectedZone,
  x: number,
  z: number,
  height?: number,
): ConnectedZone {
  for (const cave of CAVES) {
    if (zone !== 'plaza' && zone !== cave.id) continue;
    const gate = caveEntrance(cave);
    if (
      Math.abs(x - gate.x) > CORRIDOR_HALF_WIDTH ||
      Math.abs(z - gate.z) > 2 ||
      (height !== undefined && Math.abs(height - gate.height) > 1.3)
    )
      continue;
    return z < gate.z ? cave.id : 'plaza';
  }
  return zone;
}
