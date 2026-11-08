import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { AdditiveBlending, Group } from 'three';
import { PlacedGlb, type Placement } from '../BlenderAsset';
import type { Quality } from '../GrandHall';
import { InteriorColliders, RoomReflections, type V3 } from '../IndoorKit';
import { sceneBounds, type SceneId } from '../worldLayout';
import { KOP_TUNNEL } from '../../../../../../packages/shared/liverpool/layout';

export function LiverpoolAsset({
  asset,
  placements,
  shadow = false,
  required = false,
}: {
  asset: string;
  placements: readonly Placement[];
  shadow?: boolean;
  required?: boolean;
}) {
  return (
    <PlacedGlb
      asset={asset}
      url={`/models/liverpool/${asset}.glb`}
      placements={placements}
      shadow={shadow}
      required={required}
    />
  );
}

export function LiverpoolLayout({
  map,
  children,
}: {
  map: Extract<SceneId, 'liverpool' | 'liverpool-museum'>;
  children?: ReactNode;
}) {
  const b = sceneBounds(map);
  const w = (b.right - b.left) / 2;
  const sideEnd = map === 'liverpool' ? 15.8 : b.bottom;
  const sideDepth = (sideEnd - b.top) / 2;
  const sideCenter = (sideEnd + b.top) / 2;
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w, 0.32, sideDepth]} position={[0, -0.32, sideCenter]} />
        {map === 'liverpool' && (
          <CuboidCollider
            args={[KOP_TUNNEL.width / 2, 0.32, (b.bottom - sideEnd) / 2]}
            position={[KOP_TUNNEL.x, -0.32, (b.bottom + sideEnd) / 2]}
          />
        )}
        {[b.left - 0.2, b.right + 0.2].map((x) => (
          <CuboidCollider key={x} args={[0.2, 6, sideDepth + 0.4]} position={[x, 6, sideCenter]} />
        ))}
        {(map === 'liverpool' ? [b.top - 0.2] : [b.top - 0.2, b.bottom + 0.2]).map((edge) => (
          <CuboidCollider key={edge} args={[w + 0.4, 6, 0.2]} position={[0, 6, edge]} />
        ))}
        {children}
      </RigidBody>
      <InteriorColliders map={map} />
    </>
  );
}

const caveLights: V3[] = [
  [0, 7.5, -7],
  [-12.5, 4.7, -8.8],
  [12, 4.5, -9.8],
  [12, 3.9, -21.4],
  [13.5, 4.5, 16.3],
  [-12, 4.2, 6.3],
];
const museumLights: V3[] = [
  [0, 7.5, -2],
  [-14, 5, -1],
  [16.2, 5.9, 0.5],
  [0, 7.5, -16],
  [0, 6, 13],
];
export function LiverpoolLighting({
  museum = false,
  quality,
}: {
  museum?: boolean;
  quality: Quality;
}) {
  const shadows = quality !== 'low';
  return (
    <>
      {museum && (
        <>
          <RoomReflections intensity={0.65} />
          <color attach="background" args={['#26141e']} />
          <fog attach="fog" args={['#422131', 29, 67]} />
          <hemisphereLight args={['#ffe7cb', '#713b54', 0.88]} />
          <directionalLight
            position={[5, 12, 8]}
            color="#ffe0ba"
            intensity={0.98}
            castShadow={shadows}
            shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={18}
            shadow-camera-bottom={-18}
            shadow-camera-far={47}
            shadow-normalBias={0.035}
          />
        </>
      )}
      {(museum ? museumLights : caveLights).map((p, i) => (
        <pointLight
          key={i}
          position={p}
          intensity={museum ? 85 : i === 0 ? 190 : 112}
          color={museum || i % 2 ? '#ffbd69' : '#ff5667'}
          distance={i === 3 && !museum ? 14 : 22}
          decay={2}
        />
      ))}
    </>
  );
}

export function Embers({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: reduced ? 35 : 88 }, (_, i) => [
          Math.sin(i * 4.3) * 19,
          0.5 + ((i * 17) % 37) * 0.23,
          Math.cos(i * 3.9) * 13 + 2,
        ]).flat(),
      ),
    [reduced],
  );
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = Math.sin(clock.elapsedTime * 0.36) * 0.35;
  });
  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ff8e4e"
          size={0.075}
          transparent
          opacity={0.48}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
