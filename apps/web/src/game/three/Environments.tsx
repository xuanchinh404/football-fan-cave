import { lazy, Suspense, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { BARCA_HALL, BARCA_MUSEUM } from '../../../../../packages/shared/barcelona/layout';
import type { Vector3 } from 'three';
import LiverpoolCaveScene from './liverpool/LiverpoolCaveScene';
import { CAVE_CONNECTIONS, isRefuge } from '../../../../../packages/shared/caveConnections';
import { CITY_HALL, CITY_MUSEUM } from '../../../../../packages/shared/city/layout';
import { CAVE_GATES } from '../../../../../packages/shared/caveGates';
import { type CaveId } from '../../../../../packages/shared/grandHall';
import { CaveCorridor, ClubRefuge } from './ConnectedCaves';
import { GrandHall, type Quality } from './GrandHall';
import type { SceneId } from './worldLayout';

const LiverpoolMuseumScene = lazy(() => import('./liverpool/LiverpoolMuseumScene'));
const ArsenalCave = lazy(() => import('./ArsenalCave').then((m) => ({ default: m.ArsenalCave })));
const ArsenalMuseum = lazy(() =>
  import('./ArsenalMuseum').then((m) => ({ default: m.ArsenalMuseum })),
);
const ChelseaCave = lazy(() => import('./ChelseaCave').then((m) => ({ default: m.ChelseaCave })));
const ChelseaMuseum = lazy(() =>
  import('./ChelseaMuseum').then((m) => ({ default: m.ChelseaMuseum })),
);
const RedDevilsCave = lazy(() =>
  import('./RedDevilsCave').then((m) => ({ default: m.RedDevilsCave })),
);
const RedDevilsMuseum = lazy(() =>
  import('./RedDevilsMuseum').then((m) => ({ default: m.RedDevilsMuseum })),
);
const CityCave = lazy(() => import('./city/CityCaveScene'));
const BarcelonaCave = lazy(() => import('./barcelona/BarcelonaCave'));
const RealCave = lazy(() => import('./real/RealCaveScene'));
const detailed = { real: RealCave, barcelona: BarcelonaCave, city: CityCave, united: RedDevilsCave, arsenal: ArsenalCave, chelsea: ChelseaCave };
type DetailedId = keyof typeof detailed;
const detailedIds = Object.keys(detailed) as DetailedId[];

function nearbyRooms(feet: Vector3, mounted: readonly CaveId[]) {
  return detailedIds.filter((id) => {
    const gate = CAVE_GATES.find((g) => g.id === id)!;
    const room = CAVE_CONNECTIONS[id];
    // Load the detailed room before reaching its door. Keep it while the camera can
    // look along the straight corridor or from any point in the room.
    const retained = mounted.includes(id);
    if (feet.y < room.offset[1] - (retained ? 3 : 2)) return false;
    if (id === 'barcelona') {
      const [x, , z] = room.offset;
      return feet.x > x + BARCA_HALL.left - 8 && feet.x < x + BARCA_MUSEUM.right + 8 &&
        feet.z > z + BARCA_MUSEUM.north - 8 && feet.z < gate.origin[2] + 22;
    }
    if (id === 'real') {
      return feet.x > gate.origin[0] - 22 && feet.x < gate.origin[0] + (retained ? 54 : 49) &&
        feet.y < room.offset[1] + (retained ? 31 : 26) &&
        feet.z > room.roomMouth - 38 && feet.z < room.roomMouth + (retained ? 48 : 39);
    }
    if (id === 'city') {
      const [x, y, z] = room.offset;
      const margin = retained ? 8 : 5;
      // The long descent hides the hall from the avenue and adjacent caves.
      // Mount near the bottom and retain while it can still be seen from the tunnel.
      return (
        feet.x > x + CITY_HALL.left - margin &&
        feet.x < x + CITY_MUSEUM.right + margin &&
        feet.y < y + (retained ? 28 : 22) &&
        feet.z > z + CITY_MUSEUM.north - margin &&
        feet.z < room.roomMouth + (retained ? 34 : 27)
      );
    }
    return (
      Math.abs(feet.x - gate.origin[0]) < (retained ? 32 : 23) &&
      feet.z < gate.origin[2] + (retained ? 42 : 29) &&
      feet.z > room.roomMouth - 62
    );
  });
}

function insideBarca(foot: Vector3) {
  const [x, y, z] = CAVE_CONNECTIONS.barcelona.offset;
  return foot.x >= x + BARCA_HALL.left && foot.x <= x + BARCA_MUSEUM.right &&
    foot.y >= y - 0.15 && foot.y <= y + 4 &&
    foot.z >= z + BARCA_MUSEUM.north && (foot.z < z - 7 || (foot.x > x + BARCA_HALL.right && foot.z < z));
}

function ConnectedRooms({ quality, player }: { quality: Quality; player: () => Vector3 }) {
  const [active, setActive] = useState(() => nearbyRooms(player(), []));
  const [barcaEnclosed, setBarcaEnclosed] = useState(() => insideBarca(player()));
  useFrame(() => {
    const feet = player();
    const enclosed = insideBarca(feet);
    if (enclosed !== barcaEnclosed) setBarcaEnclosed(enclosed);
    const next = nearbyRooms(feet, active);
    if (next.length !== active.length || next.some((id, i) => id !== active[i])) setActive(next);
  });
  return (
    <>
      <GrandHall quality={quality} player={player} hideExterior={barcaEnclosed} />
      <group position={CAVE_CONNECTIONS.liverpool.offset} visible={!barcaEnclosed}>
        <LiverpoolCaveScene quality={quality} />
      </group>
      {CAVE_GATES.filter((gate) => gate.id !== 'liverpool').map((gate) => (
        <group key={gate.id} visible={!barcaEnclosed || gate.id === 'barcelona'}><CaveCorridor gate={gate} /></group>
      ))}
      {CAVE_GATES.filter((gate) => isRefuge(gate.id)).map(
        (gate) =>
          isRefuge(gate.id) && (
            <group key={gate.id} position={CAVE_CONNECTIONS[gate.id].offset} visible={!barcaEnclosed}>
              <ClubRefuge club={gate.id} />
            </group>
          ),
      )}
      {active.map((id) => {
        const Room = detailed[id];
        return (
          <group key={id} position={CAVE_CONNECTIONS[id].offset} visible={!barcaEnclosed || id === 'barcelona'}>
            <Suspense fallback={null}>
              <Room quality={quality} />
            </Suspense>
          </group>
        );
      })}
    </>
  );
}

export function Environment({
  map,
  quality = 'medium',
  player,
}: {
  map: SceneId;
  quality?: Quality;
  player: () => Vector3;
}) {
  if (map === 'liverpool-museum') return <LiverpoolMuseumScene quality={quality} />;
  if (map === 'arsenal-museum') return <ArsenalMuseum quality={quality} />;
  if (map === 'chelsea-museum') return <ChelseaMuseum quality={quality} />;
  if (map === 'hall-of-legends') return <RedDevilsMuseum quality={quality} />;
  return <ConnectedRooms quality={quality} player={player} />;
}
