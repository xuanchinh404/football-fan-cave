import { useEffect, useMemo, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import { CuboidCollider, RigidBody, TrimeshCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { Plaque, type V3 } from '../IndoorKit';

export const navy = '#102d51';
export const blue = '#4696d3';
export const gold = '#ba873f';
export const trim = '#f2c175';
export const stone = '#233d59';
export const ice = '#8adaff';

export function CityBox({ position = [0, 0, 0], size, color, metal = 0, glow = 0, solid = false, rotation }: {
  position?: V3; size: V3; color: string; metal?: number; glow?: number; solid?: boolean; rotation?: V3;
}) {
  return <mesh position={position} rotation={rotation} receiveShadow userData={{ cameraSolid: solid }}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={metal ? 0.35 : 0.76} metalness={metal}
      emissive={color} emissiveIntensity={glow} />
  </mesh>;
}

export function CitySign({ position, lines, width, height, maxFontSize }: {
  position: V3; lines: string[]; width: number; height: number; maxFontSize?: number;
}) {
  return <Plaque position={position} lines={lines} width={width} height={height} background="#102c4d"
    maxFontSize={maxFontSize} />;
}

export function CityCrest({ size, position = [0, 0, 0] }: { size: number; position?: V3 }) {
  const map = useLoader(THREE.TextureLoader, '/art/city/crest.webp');
  map.colorSpace = THREE.SRGBColorSpace;
  return <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[size * 0.519, size * 0.519, 0.19, 64]} />
      <meshStandardMaterial color={gold} metalness={0.72} roughness={0.28} />
    </mesh>
    <mesh position={[0, 0, 0.123]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  </group>;
}

const shipShapes = [
  [[-1.35, -0.41], [-1.17, -0.65], [0.77, -0.65], [1.37, -0.29], [0.55, -0.37], [-0.8, -0.32]],
  [[-1.11, -0.23], [-0.71, 0.51], [-0.37, -0.18]],
  [[-0.65, -0.25], [-0.1, 0.93], [0.28, -0.16]],
  [[0.1, -0.22], [0.63, 0.67], [0.95, -0.12]],
  [[-0.12, 0.94], [-0.12, 1.1], [0.36, 1.04]],
].map((points) => {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  shape.closePath();
  return shape;
});
export function CityShip({ scale = 1, position = [0, 0, 0], color = '#e5f8ff' }: {
  scale?: number; position?: V3; color?: string;
}) {
  return <group scale={scale} position={position}>
    {shipShapes.map((shape, i) => <mesh key={i}>
      <extrudeGeometry args={[shape, { depth: 0.047, bevelEnabled: false }]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.26} roughness={0.3} />
    </mesh>)}
  </group>;
}

export function CityBanner({ position, width = 1.65, height = 4 }: { position: V3; width?: number; height?: number }) {
  const shape = useMemo(() => new THREE.Shape([
    [-0.5, 0.5], [0.5, 0.5], [0.5, -0.35], [0, -0.5], [-0.5, -0.35],
  ].map(([x, y]) => new THREE.Vector2(x * width, y * height))), [width, height]);
  return <group position={position}>
    <mesh>
      <extrudeGeometry args={[shape, { depth: 0.055, bevelEnabled: false }]} />
      <meshStandardMaterial color={blue} roughness={0.74} />
    </mesh>
    <mesh scale={[0.9, 0.95, 1]} position={[0, 0, 0.057]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#1c5c9a" roughness={0.73} />
    </mesh>
    <CityBox position={[0, height * 0.51, 0.01]} size={[width * 1.19, 0.1, 0.15]} color={trim} metal={0.63} />
    <CityShip position={[0, -0.05, 0.077]} scale={width * 0.26} />
  </group>;
}

export function CityLantern({ position, scale = 1 }: { position: V3; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.04, 0]}>
      <cylinderGeometry args={[0.28, 0.2, 0.51, 6]} />
      <meshStandardMaterial color="#ffcf7b" emissive="#ff9b39" emissiveIntensity={1.35} />
    </mesh>
    {[-0.235, 0.315].map((y) => <mesh key={y} position={[0, y, 0]}>
      <cylinderGeometry args={[0.28, 0.28, 0.085, 6]} />
      <meshStandardMaterial color={gold} metalness={0.75} roughness={0.31} />
    </mesh>)}
    <mesh position={[0, 0.43, 0]}><coneGeometry args={[0.31, 0.21, 6]} /><meshStandardMaterial color={gold} metalness={0.72} /></mesh>
    {Array.from({ length: 6 }, (_, i) => {
      const a = i * Math.PI / 3;
      return <CityBox key={i} position={[Math.sin(a) * 0.247, 0.04, Math.cos(a) * 0.247]}
        rotation={[0.13 * Math.cos(a), 0, -0.13 * Math.sin(a)]} size={[0.041, 0.55, 0.041]} color={gold} metal={0.65} />;
    })}
  </group>;
}

export function CityCrystal({ position, scale = 1, rotation = 0 }: { position: V3; scale?: number; rotation?: number }) {
  return <group position={position} scale={scale} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.13, 0]} scale={[0.89, 0.28, 0.67]}>
      <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#2c4058" flatShading />
    </mesh>
    {[[-0.47, 0.57, 0.1, 0.5], [0, 1.08, -0.05, 1], [0.47, 0.7, 0.13, 0.63]].map(([x, y, z, s], i) =>
      <mesh key={i} position={[x, y, z]} rotation={[-0.1, i * 0.26, -x * 0.8]} scale={[s * 0.34, s * 1.09, s * 0.34]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={i === 1 ? '#38b9ef' : '#5bd4fb'} emissive="#107bb4" emissiveIntensity={0.46}
          metalness={0.48} roughness={0.23} flatShading />
      </mesh>
    )}
  </group>;
}

export function CityPier({ position, height = 6 }: { position: V3; height?: number }) {
  return <group position={position}>
    <CityBox position={[0, height / 2, 0]} size={[1, height, 1.05]} color="#435c79" solid />
    <CityBox position={[0, height / 2, 0.536]} size={[0.29, height - 0.9, 0.08]} color="#253f62" />
    {[0.22, 0.6, height - 0.45, height - 0.17].map((y, i) =>
      <CityBox key={y} position={[0, y, 0]} size={[i % 2 ? 1.12 : 1.3, 0.15, i % 2 ? 1.14 : 1.29]} color={i % 2 ? trim : gold} metal={0.55} />
    )}
  </group>;
}

function useTileTexture(width: number, depth: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#354c64';
    ctx.fillRect(0, 0, 256, 256);
    for (let z = 0; z < 2; z++) {
      for (let x = 0; x < 2; x++) {
        const v = 150 + ((z * 3 + x * 5) % 4) * 8;
        const g = ctx.createLinearGradient(x * 128, z * 128, x * 128 + 90, z * 128 + 128);
        g.addColorStop(0, `rgb(${v + 18},${v + 32},${v + 47})`);
        g.addColorStop(1, `rgb(${v},${v + 11},${v + 25})`);
        ctx.fillStyle = g;
        ctx.fillRect(x * 128 + 1, z * 128 + 1, 125, 125);
        ctx.fillStyle = '#ffffff3a';
        ctx.fillRect(x * 128 + 2, z * 128 + 2, 121, 1);
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(width / 3.1, depth / 3.1);
    t.anisotropy = 4;
    return t;
  }, [width, depth]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function CityFloor({ width, depth, x = 0, z = -depth / 2 }: {
  width: number; depth: number; x?: number; z?: number;
}) {
  const tile = useTileTexture(width, depth);
  return <>
    <CuboidCollider args={[width / 2, 0.2, depth / 2]} position={[x, -0.2, z]} />
    <mesh position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ cameraSolid: true }}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={tile} color="#c0d6e7" roughness={0.38} metalness={0.24} side={THREE.DoubleSide} />
    </mesh>
  </>;
}

function useMasonry() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#727f8f';
    ctx.fillRect(0, 0, 256, 128);
    for (let row = 0; row < 4; row++) {
      for (let col = -1; col < 4; col++) {
        const x = col * 64 + (row % 2) * 32;
        const y = row * 32;
        const tone = 182 + Math.abs((row * 13 + ((col + 4) % 4) * 23) % 42);
        ctx.fillStyle = `rgb(${tone},${tone + 5},${tone + 10})`;
        ctx.fillRect(x + 1, y + 1, 62, 30);
        ctx.fillStyle = '#ffffff66';
        ctx.fillRect(x + 2, y + 2, 60, 1);
        ctx.fillStyle = '#1823352c';
        ctx.fillRect(x + 2, y + 29, 60, 2);
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function MasonryPanel({
  width,
  height,
  center,
  texture,
}: {
  width: number;
  height: number;
  center: V3;
  texture: THREE.Texture;
}) {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(width, height);
    const uv = plane.getAttribute('uv');
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * width) / 7.6, (uv.getY(i) * height) / 3.12);
    return plane;
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={center} receiveShadow>
      <meshStandardMaterial color={stone} map={texture} roughness={0.87} />
    </mesh>
  );
}

export function CityWall({ position, width, height, yaw = 0, gap, gapHeight = 4.85 }: {
  position: V3; width: number; height: number; yaw?: number; gap?: { center: number; width: number }; gapHeight?: number;
}) {
  const texture = useMasonry();
  const panels = gap ? [
    { a: -width / 2, b: gap.center - gap.width / 2, low: 0 },
    { a: gap.center + gap.width / 2, b: width / 2, low: 0 },
    { a: gap.center - gap.width / 2, b: gap.center + gap.width / 2, low: gapHeight },
  ] : [{ a: -width / 2, b: width / 2, low: 0 }];
  return <group position={position} rotation={[0, yaw, 0]}>
    {panels.map(({ a, b, low }) => <group key={a}>
      <CityBox position={[(a + b) / 2, (height + low) / 2, 0]} size={[b - a, height - low, 0.64]} color={stone} solid />
      <MasonryPanel
        width={b - a}
        height={height - low}
        center={[(a + b) / 2, (height + low) / 2, 0.324]}
        texture={texture}
      />
      <CuboidCollider position={[(a + b) / 2, (height + low) / 2, 0]} args={[(b - a) / 2, (height - low) / 2, 0.32]} />
      {[0.36, 0.95, 2.58, 4.82, height - 0.22].filter((y) => y > low + 0.15).map((y, i) =>
        <CityBox key={y} position={[(a + b) / 2, y, 0.36]} size={[b - a, i % 2 ? 0.09 : 0.16, 0.16]}
          color={i % 2 ? '#5c7590' : navy} />
      )}
    </group>)}
  </group>;
}

export function CityArch({ radius, spring, position, yaw = 0, thickness = 0.58 }: {
  radius: number; spring: number; position: V3; yaw?: number; thickness?: number;
}) {
  const blocks = useMemo(() => Array.from({ length: 15 }, (_, i) => {
    const a = i * Math.PI / 15 + 0.008;
    const b = (i + 1) * Math.PI / 15 - 0.008;
    const shape = new THREE.Shape();
    shape.absarc(0, spring, radius + thickness, a, b, false);
    shape.absarc(0, spring, radius, b, a, true);
    shape.closePath();
    return shape;
  }), [radius, spring, thickness]);
  return <group position={position} rotation={[0, yaw, 0]}>
    {blocks.map((shape, i) => <mesh key={i} position={[0, 0, -0.21]} receiveShadow>
      <extrudeGeometry args={[shape, { depth: 0.42, bevelEnabled: false, curveSegments: 5 }]} />
      <meshStandardMaterial color={i % 3 === 0 ? '#6385a9' : '#3d5a7a'} roughness={0.84} />
    </mesh>)}
    <mesh position={[0, spring, 0.21]}>
      <torusGeometry args={[radius + 0.025, 0.045, 5, 40, Math.PI]} />
      <meshStandardMaterial color={trim} metalness={0.65} roughness={0.29} emissive={gold} emissiveIntensity={0.18} />
    </mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * (radius + thickness / 2), 0, 0]}>
      <CityBox size={[thickness, spring, 0.61]} position={[0, spring / 2, 0]} color="#496583" />
      {[0.26, spring - 0.13].map((y) => <CityBox key={y} size={[thickness + 0.18, 0.18, 0.71]} position={[0, y, 0]} color={gold} metal={0.62} />)}
    </group>)}
  </group>;
}

export function CityVault({ width, depth, spring, rise, ribs, rocky = false }: {
  width: number; depth: number; spring: number; rise: number; ribs: number[]; rocky?: boolean;
}) {
  const { vertices, indices, geometry } = useMemo(() => {
    const n = 24;
    const rows = 10;
    const verts: number[] = [], tris: number[] = [];
    for (let row = 0; row <= rows; row++) {
      for (let i = 0; i <= n; i++) {
        const a = i * Math.PI / n;
        const shift = rocky ? 0.63 * Math.sin(i * 2.25 + row * 4.15) * Math.sin(a) : 0;
        verts.push(Math.cos(a) * width / 2, spring + Math.sin(a) * rise + shift, -row * depth / rows);
      }
    }
    for (let row = 0; row < rows; row++) for (let i = 0; i < n; i++) {
      const index = row * (n + 1) + i;
      tris.push(index, index + 1, index + n + 1, index + 1, index + n + 2, index + n + 1);
    }
    const vertices = new Float32Array(verts);
    const indices = new Uint32Array(tris);
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    base.setIndex(new THREE.BufferAttribute(indices, 1));
    const geometry = base.toNonIndexed();
    base.dispose();
    geometry.computeVertexNormals();
    const colors = [];
    for (let i = 0; i < tris.length / 3; i++) {
      const c = new THREE.Color(rocky ? '#354d68' : '#203d61');
      c.multiplyScalar(0.69 + (0.38 * (Math.sin(i * 128.3) + 1)) / 2);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return { vertices, indices, geometry };
  }, [width, depth, spring, rise, rocky]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <TrimeshCollider args={[vertices, indices]} />
    <mesh geometry={geometry} userData={{ cameraSolid: true }}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.93} />
    </mesh>
    {ribs.map((z) => <group key={z} position={[0, spring - (rocky ? 0.5 : 0), z]} scale={[1, rise / (width / 2), 1]}>
      <mesh>
        <torusGeometry args={[width / 2 - 0.47, 0.37, 6, 40, Math.PI]} />
        <meshStandardMaterial color={rocky ? '#496781' : '#426284'} roughness={0.76} />
      </mesh>
      <mesh position={[0, 0, 0.32]}>
        <torusGeometry args={[width / 2 - 0.57, 0.07, 6, 40, Math.PI]} />
        <meshStandardMaterial color={trim} metalness={0.57} roughness={0.36} />
      </mesh>
    </group>)}
  </>;
}

export function CityFixed({ children }: { children: ReactNode }) {
  return <RigidBody type="fixed" colliders={false}>{children}</RigidBody>;
}

export function CityCarpet({ position, width, depth }: { position: V3; width: number; depth: number }) {
  return <group position={position}>
    <CityBox size={[width, 0.03, depth]} color="#1d538e" />
    <CityBox size={[width - 0.52, 0.031, depth - 0.52]} color={trim} metal={0.37} />
    <CityBox size={[width - 0.68, 0.033, depth - 0.68]} color="#377db6" />
    {[-1, 1].map((s) => <CityBox key={s} position={[s * (width / 2 - 0.57), 0.022, 0]}
      size={[0.045, 0.005, depth - 1.1]} color="#bce6fa" />)}
  </group>;
}

