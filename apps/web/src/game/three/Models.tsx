import { AvatarStoreExtras } from '../../store/avatarStore';
import type { Loadout } from '../../../../../packages/shared/store/state';
import { PlayerAvatar3D } from './PlayerAvatar3D';
import { AssetModel } from './AssetModel';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

type V3 = [number, number, number];
export function Box({
  position = [0, 0, 0],
  size,
  color,
  solid = true,
  rotation,
}: {
  position?: V3;
  size: V3;
  color: string;
  solid?: boolean;
  rotation?: V3;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      userData={{ cameraSolid: solid }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}
export function Label({
  text,
  position,
  width = 4,
  color = '#f9e6ab',
  background = '#202a2c',
}: {
  text: string;
  position: V3;
  width?: number;
  color?: string;
  background?: string;
}) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#b39960';
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, 1014, 150);
    ctx.fillStyle = color;
    ctx.font = 'bold 54px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 84, 960);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text, color, background]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, width / 6.4]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
    </mesh>
  );
}
export function Trophy({ position = [0, 0, 0], scale = 1 }: { position?: V3; scale?: number }) {
  const gold = <meshStandardMaterial color="#efbd56" metalness={0.78} roughness={0.24} />;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.26, 8]} />
        {gold}
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.25, 0.8, 12]} />
        {gold}
      </mesh>
      <mesh position={[0, 1.22, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.16, 0.75, 16, 1, true]} />
        {gold}
      </mesh>
      <mesh position={[0, 1.61, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.64, 0.055, 8, 24]} />
        {gold}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.6, 1.2, 0]} scale={[0.65, 1, 1]} castShadow>
          <torusGeometry args={[0.4, 0.075, 8, 18]} />
          {gold}
        </mesh>
      ))}
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.4, 0.13, 0.4, 16]} />
        <meshStandardMaterial color="#c48a31" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}
export function Torch({ position }: { position: V3 }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flame.current)
      flame.current.scale.y = 1 + Math.sin(clock.elapsedTime * 9 + position[0]) * 0.14;
  });
  return (
    <group position={position}>
      <Box size={[0.14, 1.1, 0.14]} position={[0, 0.55, 0]} color="#372b2b" solid={false} />
      <mesh position={[0, 1.15, 0]}>
        <coneGeometry args={[0.24, 0.32, 6]} />
        <meshStandardMaterial color="#a27c3c" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={flame} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#ffe99a" emissive="#ff8b22" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}
export function Arch({ position, red = true }: { position: V3; red?: boolean }) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box size={[0.85, 2.8, 1.5]} position={[s * 2.25, 1.4, 0]} color="#565c61" />
            <Box size={[1.1, 0.3, 1.8]} position={[s * 2.25, 0.15, 0]} color="#89918d" />
          </group>
        ))}
        <Box size={[5.2, 0.7, 1.5]} position={[0, 5, 0]} color="#626467" />
      </RigidBody>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh position={[0, 2.8, 0]} castShadow userData={{ cameraSolid: true }}>
          <torusGeometry args={[2.25, 0.43, 5, 14, Math.PI]} />
          <meshStandardMaterial color="#85847f" roughness={0.95} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 2.5, -0.4]}>
        <planeGeometry args={[3.6, 4.8]} />
        <meshStandardMaterial
          color={red ? '#a82037' : '#75a5b4'}
          emissive={red ? '#b82638' : '#599cc0'}
          emissiveIntensity={0.65}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Label
        text={red ? 'HANG QUỶ ĐỎ' : 'ĐẠI SẢNH CHUNG'}
        position={[0, 5.02, 0.82]}
        width={5.2}
        background={red ? '#641f30' : '#203b45'}
      />
      {[-1, 1].map((s) => (
        <Torch key={s} position={[s * 3, 0, 0.9]} />
      ))}
      <pointLight
        position={[0, 2.2, 0.6]}
        intensity={red ? 22 : 14}
        color={red ? '#ff6572' : '#a4e7ff'}
        distance={8}
        decay={2}
      />
    </group>
  );
}
export function Character({
  color = '#cf243f',
  name,
  moving = false,
  direction = Math.PI,
  running = false,
  gesture,
  jumping = false,
  seated = false,
  hideTemplateCrest,
  loadout,
  storeEffects,
}: {
  color?: string;
  name: string;
  moving?: boolean;
  direction?: number;
  running?: boolean;
  jumping?: boolean;
  seated?: boolean;
  gesture?: string;
  hideTemplateCrest?: boolean;
  loadout?: Loadout;
  storeEffects?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (root.current)
      root.current.rotation.y +=
        Math.atan2(
          Math.sin(direction - root.current.rotation.y),
          Math.cos(direction - root.current.rotation.y),
        ) * Math.min(1, dt * 14);
  });
  return (
    <group>
      <group ref={root}>
        <PlayerAvatar3D
          hideTemplateCrest={hideTemplateCrest}
          loadout={loadout}
          teamColor={color}
          motion={
            seated
              ? 'SitIdle'
              : gesture === 'Throw'
                ? 'Throw'
                : jumping
                ? 'Jump'
                : moving
                  ? running
                    ? 'Run'
                    : 'Walk'
                  : gesture || 'Idle'
          }
          fallback={
            <AssetModel
              asset="fan-chibi"
              tint={color}
              animation={seated ? 'Sit' : gesture || (moving ? (running ? 'Run' : 'Walk') : 'Idle')}
              scale={0.86}
              solid={false}
            />
          }
        />
      </group>
      <AvatarStoreExtras loadout={loadout} facing={direction} effects={storeEffects} />
      {name && <NameTag name={name} color={color} />}
    </group>
  );
}
function NameTag({ name, color }: { name: string; color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    group.current?.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={group} position={[0, 2.5, 0]}>
      <Label text={name} position={[0, 0, 0]} width={2.1} color={color} />
    </group>
  );
}
