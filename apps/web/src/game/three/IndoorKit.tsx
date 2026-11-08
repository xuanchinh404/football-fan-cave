import { CORRIDOR_HALF_WIDTH } from '../../../../../packages/shared/grandHall';
import { useEffect, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';
import { Box, Label, Torch } from './Models';
import { sceneBounds, sceneObstacles, type SceneId } from './worldLayout';

export type V3 = [number, number, number];
export const GOLD = '#d9a441';
/** Small object labels are canvas textures; the architecture and exhibits are meshes. */
export function Plaque({
  lines,
  width = 4,
  height = 1.5,
  position = [0, 0, 0],
  dark = false,
  background,
  maxFontSize = 76,
}: {
  lines: string[];
  width?: number;
  height?: number;
  position?: V3;
  dark?: boolean;
  background?: string;
  maxFontSize?: number;
}) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round((1024 * height) / width);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = background || (dark ? '#171119' : '#5b1723');
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#d5a34c';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, c.width - 16, c.height - 16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? '#ffdb83' : '#f1e0bf';
      ctx.font = `${i === 0 ? 'bold ' : ''}${Math.min(maxFontSize, ((c.height - 35) / lines.length) * 0.68)}px Arial`;
      ctx.fillText(line, 512, 20 + ((c.height - 40) / lines.length) * (i + 0.5), 950);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [lines.join('|'), width, height, dark, background, maxFontSize]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={position}>
      <Box size={[width + 0.1, height + 0.1, 0.18]} color={GOLD} />
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}
export function RoomReflections({ intensity }: { intensity: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl),
      room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.04),
      previous = scene.environment;
    const oldIntensity = scene.environmentIntensity;
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = oldIntensity;
      target.dispose();
      generator.dispose();
      room.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
}
export function IndoorLight({
  museum = false,
  shadows = true,
  blue = false,
}: {
  museum?: boolean;
  shadows?: boolean;
  blue?: boolean;
}) {
  return (
    <>
      {museum && <>
      <RoomReflections intensity={museum ? 0.5 : 0.28} />
      <color attach="background" args={[blue ? '#08162d' : museum ? '#21151d' : '#1c101d']} />
      <fog
        attach="fog"
        args={[blue ? '#10254a' : museum ? '#291d25' : '#27131c', blue ? 32 : 27, blue ? 85 : 72]}
      />
      <hemisphereLight
        args={[
          blue ? '#b8dbff' : '#f6d5c4',
          blue ? '#172846' : '#482137',
          blue ? 1.2 : museum ? 0.65 : 0.4,
        ]}
      />
      <directionalLight
        position={[3, 10, 7]}
        color="#ffe1b6"
        intensity={1.1}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-far={50}
        shadow-normalBias={0.05}
      />
      </>}
      {[
        [-10, -10],
        [10, -10],
        [-10, 8],
        [10, 8],
      ].map(([x, z], i) => (
        <pointLight
          key={i}
          position={[x, 5.5, z]}
          color={blue ? '#8bbaff' : museum ? '#ffc779' : '#ff7850'}
          intensity={museum ? 100 : 85}
          distance={28}
          decay={2}
        />
      ))}
    </>
  );
}
/** Solid room wall with a centered opening for the connected corridor. */
export function RoomFront({ left, right, z, height, depth, color, opening }: {
  left: number; right: number; z: number; height: number; depth: number; color: string; opening?: boolean;
}) {
  const half = CORRIDOR_HALF_WIDTH;
  const sections = opening ? [
    { left, right: -half, bottom: 0, top: height },
    { left: half, right, bottom: 0, top: height },
    { left: -half, right: half, bottom: 4.7, top: height },
  ] : [{ left, right, bottom: 0, top: height }];
  return <RigidBody type="fixed" colliders="cuboid">
    {sections.map((section) => <Box key={section.left + section.bottom}
      position={[(section.left + section.right) / 2, (section.bottom + section.top) / 2, z]}
      size={[section.right - section.left, section.top - section.bottom, depth]} color={color}
    />)}
  </RigidBody>;
}
export function IndoorShell({
  map,
  museum = false,
  paving = true,
}: {
  map: SceneId;
  museum?: boolean;
  paving?: boolean;
}) {
  const b = sceneBounds(map),
    w = b.right - b.left,
    d = b.bottom - b.top,
    cx = (b.left + b.right) / 2,
    cz = (b.top + b.bottom) / 2;
  return (
    <group name={`${map}-shell`}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2 + 0.8, 0.4, d / 2 + 0.8]} position={[cx, -0.4, cz]} />
        <CuboidCollider args={[0.4, 6, d / 2 + 0.8]} position={[b.left - 0.4, 6, cz]} />
        <CuboidCollider args={[0.4, 6, d / 2 + 0.8]} position={[b.right + 0.4, 6, cz]} />
        <CuboidCollider args={[w / 2 + 0.8, 6, 0.4]} position={[cx, 6, b.top - 0.4]} />
        <CuboidCollider args={[w / 2 + 0.8, 0.3, d / 2 + 0.8]} position={[cx, 11.8, cz]} />
      </RigidBody>
      <Box
        position={[cx, -0.2, cz]}
        size={[w, 0.4, d]}
        color={museum ? '#362b30' : '#443139'}
        solid={false}
      />
      {[b.left - 0.4, b.right + 0.4].map((x) => (
        <Box
          key={x}
          position={[x, 5.9, cz]}
          size={[0.8, 11.8, d + 1]}
          color={museum ? '#46232d' : '#402430'}
        />
      ))}
      {[b.top - 0.4].map((z) => (
        <Box
          key={z}
          position={[cx, 5.9, z]}
          size={[w + 1, 11.8, 0.8]}
          color={museum ? '#512333' : '#402430'}
        />
      ))}
      <RoomFront left={b.left - 0.5} right={b.right + 0.5} z={b.bottom + 0.4}
        depth={0.8} height={11.8} color={museum ? '#512333' : '#402430'} opening={!museum} />
      <Box position={[cx, 12, cz]} size={[w + 1, 0.6, d + 1]} color="#261a26" />
      {/* Instanced paving gives a real broken-stone floor with hundreds of independently lit tiles. */}
      {paving && <Paving bounds={b} museum={museum} />}
      {museum &&
        [b.left + 0.16, b.right - 0.16].map((x) => (
          <group key={x}>
            <Box position={[x, 0.5, cz]} size={[0.22, 0.2, d]} color={GOLD} />
            <Box position={[x, 8.2, cz]} size={[0.22, 0.15, d]} color={GOLD} />
          </group>
        ))}
    </group>
  );
}
function Paving({
  bounds: b,
  museum,
}: {
  bounds: ReturnType<typeof sceneBounds>;
  museum: boolean;
}) {
  const tiles = useMemo(() => {
    const matrices: THREE.Matrix4[] = [],
      colors: THREE.Color[] = [];
    for (let x = b.left + 0.7; x < b.right - 0.6; x += 1.4)
      for (let z = b.top + 0.7; z < b.bottom - 0.6; z += 1.4) {
        matrices.push(new THREE.Matrix4().makeScale(1.36, 0.025, 1.36).setPosition(x, 0.01, z));
        colors.push(
          new THREE.Color(museum ? '#958080' : '#79616a').multiplyScalar(
            0.7 + (Math.sin(x * 35 + z * 19) + 1) * 0.12,
          ),
        );
      }
    return { matrices, colors };
  }, [b.left, b.right, b.top, b.bottom, museum]);
  return (
    <instancedMesh
      args={[undefined, undefined, tiles.matrices.length]}
      receiveShadow
      ref={(mesh) => {
        if (!mesh) return;
        tiles.matrices.forEach((m, i) => {
          mesh.setMatrixAt(i, m);
          mesh.setColorAt(i, tiles.colors[i]);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }}
    >
      <boxGeometry />
      <meshStandardMaterial roughness={museum ? 0.36 : 0.92} metalness={museum ? 0.25 : 0} />
    </instancedMesh>
  );
}
/** One source of footprints for the renderer, Rapier and the existing room server. */
export function InteriorColliders({ map }: { map: SceneId }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {sceneObstacles(map).map((o) => (
        <CuboidCollider
          key={o.index}
          args={[o.w / 2, o.height / 2, o.d / 2]}
          position={[o.x, o.height / 2, o.z]}
        />
      ))}
    </RigidBody>
  );
}
export function Doorway({
  position,
  title,
  subtitle,
  rotation = 0,
  width = 4,
}: {
  position: V3;
  title: string;
  subtitle: string;
  rotation?: number;
  width?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box position={[s * (width / 2 + 0.3), 2.4, 0]} size={[0.6, 4.8, 1]} color="#762b34" />
          <Box position={[s * (width / 2 + 0.3), 0.2, 0]} size={[0.95, 0.4, 1.3]} color={GOLD} />
          <Torch position={[s * (width / 2 + 0.8), 1.2, 0.65]} />
        </group>
      ))}
      <mesh position={[0, 4.7, 0]} userData={{ cameraSolid: true }}>
        <torusGeometry args={[width / 2 + 0.3, 0.35, 6, 20, Math.PI]} />
        <meshStandardMaterial color={GOLD} metalness={0.65} roughness={0.3} />
      </mesh>
      <Plaque lines={[title, subtitle]} position={[0, 6.15, 0.1]} width={width + 2} height={1.25} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[0.8, 1.3, 32]} />
        <meshBasicMaterial color="#ffc56a" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
export function Banner({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[1.8, 3.8, 0.1]} color="#9c1832" />
      <Box position={[0, 2, 0]} size={[2.2, 0.14, 0.2]} color={GOLD} />
      <Trident position={[0, -0.7, 0.12]} scale={0.65} />
      <Label text="UNITED" position={[0, 1.3, 0.07]} width={1.55} background="#8e1527" />
    </group>
  );
}
export function Trident({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Box position={[0, 1, 0]} size={[0.12, 2.8, 0.12]} color={GOLD} solid={false} />
      <Box position={[0, 1.3, 0]} size={[1.5, 0.12, 0.12]} color={GOLD} solid={false} />
      {[-1, 0, 1].map((s) => (
        <group key={s} position={[s * 0.7, 1.9, 0]}>
          <Box size={[0.12, 1.2, 0.12]} color={GOLD} solid={false} />
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.19, 0.5, 4]} />
            <meshStandardMaterial
              color="#f6b456"
              emissive="#c8510a"
              emissiveIntensity={0.6}
              metalness={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
