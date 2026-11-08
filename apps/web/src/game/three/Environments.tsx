import { lazy, Suspense, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Vector3 } from 'three';
import LiverpoolCaveScene from './liverpool/LiverpoolCaveScene';
import { CAVE_CONNECTIONS, isRefuge } from '../../../../../packages/shared/caveConnections';
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
const detailed = { city: CityCave, united: RedDevilsCave, arsenal: ArsenalCave, chelsea: ChelseaCave };
type DetailedId = keyof typeof detailed;
const detailedIds = Object.keys(detailed) as DetailedId[];

function nearbyRooms(feet: Vector3, mounted: readonly CaveId[]) {
  return detailedIds.filter((id) => {
    const gate = CAVE_GATES.find((g) => g.id === id)!;
    const room = CAVE_CONNECTIONS[id];
    // Load the detailed room before reaching its door. Keep it while the camera can
    // look along the straight corridor or from any point in the room.
    const retained = mounted.includes(id);
    if (id === 'city' && feet.y < CAVE_CONNECTIONS.city.offset[1] + 2) {
      return feet.x > gate.origin[0] - 20 && feet.x < gate.origin[0] + 48 &&
        feet.z > room.roomMouth - 36 && feet.z < gate.origin[2];
    }
    return (
      Math.abs(feet.x - gate.origin[0]) < (id === 'city' ? (retained ? 26 : 21) : retained ? 32 : 23) &&
      feet.z < gate.origin[2] + (retained ? 42 : 29) &&
      feet.z > room.roomMouth - 62
    );
  });
}

function ConnectedRooms({ quality, player }: { quality: Quality; player: () => Vector3 }) {
  const [active, setActive] = useState(() => nearbyRooms(player(), []));
  useFrame(() => {
    const next = nearbyRooms(player(), active);
    if (next.length !== active.length || next.some((id, i) => id !== active[i])) setActive(next);
  });
  return (
    <>
      <GrandHall quality={quality} />
      <group position={CAVE_CONNECTIONS.liverpool.offset}>
        <LiverpoolCaveScene quality={quality} />
      </group>
      {CAVE_GATES.filter((gate) => gate.id !== 'liverpool').map((gate) => (
        <CaveCorridor key={gate.id} gate={gate} />
      ))}
      {CAVE_GATES.filter((gate) => isRefuge(gate.id)).map(
        (gate) =>
          isRefuge(gate.id) && (
            <group key={gate.id} position={CAVE_CONNECTIONS[gate.id].offset}>
              <ClubRefuge club={gate.id} />
            </group>
          ),
      )}
      {active.map((id) => {
        const Room = detailed[id];
        return (
          <group key={id} position={CAVE_CONNECTIONS[id].offset}>
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
