import type { ReactNode } from 'react';
import * as THREE from 'three';
import { Box } from './Models';
import { GOLD, Plaque, type V3 } from './IndoorKit';
import { Exhibit } from './Exhibit';

type ManagerStation = { id: string; position: V3 };
export function ManagerGallery<T extends ManagerStation>({
  stations,
  children,
}: {
  stations: readonly T[];
  children: (station: T) => ReactNode;
}) {
  return (
    <group name="manager-gallery">
      {stations.map((station) => (
        <group key={station.id} position={station.position}>
          <Exhibit id={station.id}>{children(station)}</Exhibit>
        </group>
      ))}
    </group>
  );
}

export function TrophyCase({
  title,
  subtitle,
  children,
  warm = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  warm?: boolean;
}) {
  return (
    <group>
      <Box position={[0, 0.45, 0]} size={[2.9, 0.9, 2.1]} color={warm ? '#641b2a' : '#112c5a'} />
      <Box position={[0, 0.93, 0]} size={[2.98, 0.08, 2.18]} color={GOLD} />
      <group position={[0, 0.99, 0]}>{children}</group>
      <Plaque
        background={warm ? '#441017' : '#0a2253'}
        lines={[title, subtitle, 'E · Khám phá']}
        width={2.65}
        height={0.74}
        position={[0, 0.49, 1.08]}
      />
      {[-1, 1].flatMap((s) =>
        [-1, 1].map((t) => (
          <Box
            key={`${s}-${t}`}
            position={[s * 1.42, 2.35, t * 1.02]}
            size={[0.045, 2.8, 0.045]}
            color={GOLD}
          />
        )),
      )}
      <Box position={[0, 3.76, 0]} size={[2.98, 0.12, 2.18]} color={GOLD} />
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[2.85, 2.8, 2.05]} />
        <meshPhysicalMaterial
          color={warm ? '#ffdbab' : '#89baff'}
          transparent
          opacity={0.075}
          roughness={0.06}
          metalness={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 3.67, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color={warm ? '#ffdf9a' : '#cceeff'} />
      </mesh>
    </group>
  );
}
