import { TrophyCase } from './MuseumKit';
import { useMemo, useEffect, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Box, Label } from './Models';
import { GOLD, Plaque, type V3 } from './IndoorKit';
import { AssetModel } from './AssetModel';
import { sceneBounds, type SceneId } from './worldLayout';
export const BLUE = '#123b8c';
export function BluePlaque(props: React.ComponentProps<typeof Plaque>) {
  return <Plaque {...props} background="#0a2253" />;
}
export function Sapphire({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[(i - 2) * 0.31, 0.5 + (i % 3) * 0.33, Math.sin(i * 2) * 0.3]}
          rotation={[0.1, i * 0.8, (i - 2) * 0.19]}
          castShadow
        >
          <cylinderGeometry args={[0, 0.27, 0.95 + (i % 3) * 0.4, 5, 1]} />
          <meshStandardMaterial
            color="#5ccaff"
            emissive="#126bff"
            emissiveIntensity={1.4}
            metalness={0.45}
            roughness={0.14}
          />
        </mesh>
      ))}
    </group>
  );
}
export function BlueBanner({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[2.2, 4.4, 0.14]} color={BLUE} />
      <Box position={[0, 2.22, 0]} size={[2.6, 0.12, 0.25]} color={GOLD} />
      <Box position={[-1.05, 0, 0.1]} size={[0.05, 4.4, 0.02]} color={GOLD} />
      <Box position={[1.05, 0, 0.1]} size={[0.05, 4.4, 0.02]} color={GOLD} />
      <group position={[0, -1.2, 0.15]} scale={0.6}>
        <AssetModel asset="blues-lion" solid={false} />
      </group>
      <Label text="THE BLUES" position={[0, 1.45, 0.1]} width={1.95} background={BLUE} />
    </group>
  );
}
export function BlueArch({
  position,
  width = 5,
  title,
  subtitle,
  reverse = false,
}: {
  position: V3;
  width?: number;
  title: string;
  subtitle: string;
  reverse?: boolean;
}) {
  return (
    <group position={position} rotation={[0, reverse ? Math.PI : 0, 0]}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <AssetModel
            asset="blues-column"
            position={[s * (width / 2 + 0.5), 0, 0]}
            scale={[1, 0.59, 1]}
          />
          <AssetModel
            asset="lantern"
            position={[s * (width / 2 + 1.2), 2, 0.4]}
            scale={0.85}
            solid={false}
          />
        </group>
      ))}
      <mesh position={[0, 4.9, 0]} userData={{ cameraSolid: true }} castShadow>
        <torusGeometry args={[width / 2 + 0.5, 0.4, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#35527a" metalness={0.2} roughness={0.65} />
      </mesh>
      <mesh position={[0, 4.9, 0.42]}>
        <torusGeometry args={[width / 2 + 0.5, 0.06, 6, 32, Math.PI]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.2} />
      </mesh>
      <BluePlaque
        lines={[title, subtitle]}
        position={[0, 7.8, 0.1]}
        width={width + 3}
        height={1.35}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[0.9, 1.5, 40]} />
        <meshBasicMaterial color="#5dafff" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}
/** Complete rock volume, vaulted ceiling, side walls and instanced PBR paving. */
export function ChelseaShell({
  map,
  museum = false,
  warm = false,
  children,
}: {
  map: SceneId;
  museum?: boolean;
  warm?: boolean;
  children?: ReactNode;
}) {
  const b = sceneBounds(map),
    w = b.right - b.left,
    d = b.bottom - b.top,
    cz = (b.top + b.bottom) / 2;
  const maps = useLoader(THREE.TextureLoader, [
    '/materials/blues-stone.png',
    '/materials/blues-stone-normal.png',
  ]);
  useEffect(() => {
    maps.forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 3);
    });
    maps[0].colorSpace = THREE.SRGBColorSpace;
  }, [maps]);
  const stones = useMemo(() => {
    const rows: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const o = new THREE.Object3D();
    const add = (
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      i: number,
    ) => {
      o.position.set(x, y, z);
      o.rotation.set(Math.sin(i) * 0.3, i * 0.71, Math.cos(i) * 0.2);
      o.scale.set(sx, sy, sz);
      o.updateMatrix();
      rows.push({
        m: o.matrix.clone(),
        c: new THREE.Color(
          warm ? (i % 3 ? '#66505a' : '#44333f') : i % 3 ? '#28496f' : '#1b3558',
        ).multiplyScalar(0.8 + (i % 4) * 0.08),
      });
    };
    let i = 0;
    for (const x of [b.left - 0.9, b.right + 0.9])
      for (let z = b.top; z <= b.bottom; z += 2.8)
        for (let y = 1; y < 13; y += 3) add(x, y, z, 2, 2.2, 2.3, i++);
    for (const z of [b.top - 1, b.bottom + 1])
      for (let x = b.left; x <= b.right; x += 3)
        for (let y = 2; y < 14; y += 3) add(x, y, z, 2.5, 2.4, 1.6, i++);
    for (let z = b.top; z <= b.bottom; z += 4)
      for (let x = b.left; x <= b.right; x += 4)
        add(x, 14.5 - Math.pow(x / (w / 2), 2) * 2, z, 3, 1.7, 3, i++);
    return rows;
  }, [map, warm]);
  const tiles = useMemo(() => {
    const a: THREE.Matrix4[] = [];
    for (let x = b.left + 0.75; x < b.right; x += 1.5)
      for (let z = b.top + 0.75; z < b.bottom; z += 1.5)
        a.push(new THREE.Matrix4().makeScale(1.46, 0.04, 1.46).setPosition(x, -0.015, z));
    return a;
  }, [map]);
  return (
    <group name={`${map}-royal-crystal-shell`}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2 + 0.8, 0.4, d / 2 + 0.8]} position={[0, -0.4, cz]} />
        {[b.left - 0.45, b.right + 0.45].map((x) => (
          <CuboidCollider key={x} args={[0.45, 7, d / 2 + 1]} position={[x, 7, cz]} />
        ))}
        {[b.top - 0.45, b.bottom + 0.45].map((z) => (
          <CuboidCollider key={z} args={[w / 2 + 1, 7, 0.45]} position={[0, 7, z]} />
        ))}
        <CuboidCollider args={[w / 2 + 1, 0.4, d / 2 + 1]} position={[0, 13.6, cz]} />
      </RigidBody>
      <Box
        position={[0, -0.15, cz]}
        size={[w, 0.3, d]}
        color={warm ? '#514047' : '#243e60'}
        solid={false}
      />
      {[b.left - 0.65, b.right + 0.65].map((x) => (
        <Box
          key={x}
          position={[x, 6.5, cz]}
          size={[1, 13, d + 2]}
          color={warm ? '#42303a' : '#172c49'}
        />
      ))}
      {[b.top - 0.65, b.bottom + 0.65].map((z) => (
        <Box
          key={z}
          position={[0, 6.5, z]}
          size={[w + 2, 13, 1]}
          color={warm ? '#42303a' : '#172c49'}
        />
      ))}
      <Box position={[0, 14, cz]} size={[w + 2, 0.8, d + 2]} color={warm ? '#261923' : '#0d1c33'} />
      <instancedMesh
        args={[undefined, undefined, stones.length]}
        userData={{ cameraSolid: true }}
        castShadow
        receiveShadow
        ref={(r) => {
          if (r) {
            stones.forEach((s, i) => {
              r.setMatrixAt(i, s.m);
              r.setColorAt(i, s.c);
            });
            r.instanceMatrix.needsUpdate = true;
          }
        }}
      >
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={maps[0]}
          normalMap={maps[1]}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughness={0.8}
        />
      </instancedMesh>
      <instancedMesh
        args={[undefined, undefined, tiles.length]}
        receiveShadow
        ref={(r) => {
          if (r) {
            tiles.forEach((m, i) => r.setMatrixAt(i, m));
            r.instanceMatrix.needsUpdate = true;
          }
        }}
      >
        <boxGeometry />
        <meshStandardMaterial
          color={warm ? '#cfb7ae' : museum ? '#9db4cd' : '#6685a5'}
          map={maps[0]}
          normalMap={maps[1]}
          normalScale={new THREE.Vector2(0.18, 0.18)}
          roughness={museum ? 0.25 : 0.46}
          metalness={museum ? 0.35 : 0.12}
        />
      </instancedMesh>
      {[-8, 4, 13].map((z) => (
        <group key={z}>
          <mesh
            position={[0, 4, z]}
            scale={[1, 0.5, 1]}
            castShadow
            userData={{ cameraSolid: true }}
          >
            <torusGeometry args={[w / 2 - 0.8, 0.24, 8, 48, Math.PI]} />
            <meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {children ??
        [-1, 1].flatMap((s) =>
          [-6, 6, 12].map((z) => (
            <group key={`${s}-${z}`}>
              <AssetModel
                asset="blues-column"
                position={[s * (museum ? 16 : 16), 0, z]}
                scale={[1, 1.25, 1]}
              />
              <AssetModel asset="lantern" position={[s * 15, 3, z]} solid={false} />
              <Sapphire position={[s * (w / 2 - 1), 0.05, z - 2]} scale={1.3} />
            </group>
          )),
        )}
    </group>
  );
}
export function BlueRug({
  position,
  width = 4,
  depth = 20,
}: {
  position: V3;
  width?: number;
  depth?: number;
}) {
  return (
    <group position={position}>
      <Box size={[width, 0.035, depth]} color="#114eb0" solid={false} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[0.035, 0.012, depth]}
          position={[s * (width / 2 - 0.12), 0.025, 0]}
          color={GOLD}
          solid={false}
        />
      ))}
    </group>
  );
}
export function BlueCase(props: React.ComponentProps<typeof TrophyCase>) {
  return <TrophyCase {...props} />;
}
