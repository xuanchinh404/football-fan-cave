import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { Box } from './Models';
import { GOLD, Plaque, RoomReflections, type V3 } from './IndoorKit';
import { BlenderAsset, type Placement } from './BlenderAsset';
import { ChelseaShell } from './ChelseaKit';

export const CRIMSON = '#8f162e';
export const WINE = '#411424';
export function FortressLight({ museum, shadow }: { museum?: boolean; shadow: boolean }) {
  return (
    <>
      <RoomReflections intensity={museum ? 0.7 : 0.44} />
      <color attach="background" args={['#251521']} />
      <fog attach="fog" args={['#34202c', 32, 77]} />
      <hemisphereLight args={['#fff1d6', '#493148', 1.34]} />
      <directionalLight
        position={[5, 12, 10]}
        color="#ffe5b4"
        intensity={1.6}
        castShadow={shadow}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-bottom={-26}
        shadow-camera-top={26}
        shadow-normalBias={0.06}
      />
      <pointLight position={[0, 7, -10]} color="#ff9a50" intensity={150} distance={24} />
      <pointLight position={[-12, 5, 5]} color="#ffc384" intensity={110} distance={18} />
      {museum && <pointLight position={[8, 6, -6]} color="#ffc98e" intensity={150} distance={20} />}
    </>
  );
}
export function FortressShell({ museum, children }: { museum?: boolean; children?: ReactNode }) {
  return (
    <ChelseaShell map={museum ? 'arsenal-museum' : 'arsenal'} museum={museum} warm>
      {children}
    </ChelseaShell>
  );
}
export function FortressGate({
  position,
  scale = 0.77,
  reverse = false,
  title,
  subtitle,
}: {
  position: V3;
  scale?: number;
  reverse?: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <group position={position} rotation={[0, reverse ? Math.PI : 0, 0]}>
      <BlenderAsset
        asset="gunners-arch"
        placements={[{ position: [0, 0, 0], scale }]}
        cameraSolid
      />
      <Plaque
        position={[0, 8.82 * scale, 0.8]}
        width={8.4 * scale}
        height={1.48}
        lines={[title, subtitle]}
        background={WINE}
      />
      <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.13, 40]} />
        <meshBasicMaterial color="#ffbc6d" />
      </mesh>
    </group>
  );
}
export function CrimsonRug({
  position,
  width,
  depth,
}: {
  position: V3;
  width: number;
  depth: number;
}) {
  return (
    <group position={position}>
      <Box size={[width, 0.035, depth]} color={CRIMSON} solid={false} />
      {[-1, 1].map((side) => (
        <Box
          key={side}
          position={[side * (width / 2 - 0.14), 0.025, 0]}
          size={[0.055, 0.016, depth - 0.16]}
          color={GOLD}
          solid={false}
        />
      ))}
    </group>
  );
}
export function CannonMedallion({ position, radius = 3.5 }: { position: V3; radius?: number }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#8d1230" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[radius - 0.18, radius - 0.11, 64]} />
        <meshStandardMaterial color={GOLD} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <ringGeometry args={[radius - 0.37, radius - 0.33, 64]} />
        <meshStandardMaterial color={GOLD} />
      </mesh>
      <BlenderAsset
        asset="gunners-emblem"
        placements={[{ position: [0, -0.85, 0.018], scale: 1.15 }]}
        shadow={false}
      />
    </group>
  );
}
export function RedStandards({ positions }: { positions: V3[] }) {
  const cloth = useMemo(() => {
    const mesh = new THREE.PlaneGeometry(2.22, 3.85, 20, 18);
    const a = mesh.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i),
        y = a.getY(i);
      a.setXYZ(
        i,
        x,
        y - Math.max(0, -y - 0.85) * (0.47 - Math.abs(x) * 0.3),
        0.16 * Math.cos(x * 8) + 0.11 * Math.sin(y * 1.5),
      );
    }
    mesh.computeVertexNormals();
    return mesh;
  }, []);
  return (
    <>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={cloth} castShadow>
            <meshStandardMaterial color="#ac1436" roughness={0.58} side={THREE.DoubleSide} />
          </mesh>
          <Box size={[2.61, 0.12, 0.18]} position={[0, 1.96, 0]} color={GOLD} solid={false} />
          {[-1, 1].map((s) => (
            <Box
              key={s}
              size={[0.07, 3.77, 0.06]}
              position={[s * 1.055, 0.02, 0.065]}
              color={GOLD}
              solid={false}
            />
          ))}
        </group>
      ))}
      <BlenderAsset
        asset="gunners-emblem"
        placements={positions.map(([x, y, z]) => ({
          position: [x, y - 0.38, z + 0.2],
          scale: 0.45,
        }))}
        shadow={false}
      />
    </>
  );
}
export function FortressPiers({ placements }: { placements: Placement[] }) {
  return (
    <>
      {placements.map(({ position }, i) => (
        <group key={i} position={position}>
          <mesh position={[0, 4.35, 0]} castShadow receiveShadow userData={{ cameraSolid: true }}>
            <cylinderGeometry args={[0.46, 0.56, 8.25, 12]} />
            <meshStandardMaterial color="#7f6874" roughness={0.7} />
          </mesh>
          {[0.2, 0.44, 8.25, 8.53].map((y, k) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <cylinderGeometry args={[0.68, 0.73, k % 2 ? 0.22 : 0.32, 12]} />
              <meshStandardMaterial color={GOLD} metalness={0.58} roughness={0.3} />
            </mesh>
          ))}
          <Box position={[0, 8.73, 0]} size={[1.4, 0.23, 1.4]} color="#8f7780" />
        </group>
      ))}
    </>
  );
}

export function ScarletDrapes({ position }: { position: V3 }) {
  const drape = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(4.2, 0.9, 32, 8);
    const a = geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i),
        y = a.getY(i),
        t = (x + 2.1) / 4.2;
      a.setXYZ(
        i,
        x,
        y * (0.65 + Math.sin(t * Math.PI) * 0.44) - Math.sin(t * Math.PI) * 0.83,
        Math.cos(x * 7 + y * 4) * 0.095 + Math.sin(t * Math.PI) * 0.22,
      );
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  return (
    <group position={position}>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 3.15, -0.19, 0.15]}
          rotation={[0, 0, -side * 0.27]}
          geometry={drape}
        >
          <meshStandardMaterial color="#a41331" roughness={0.56} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
