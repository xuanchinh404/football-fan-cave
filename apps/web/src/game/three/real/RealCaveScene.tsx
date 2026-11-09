import { Suspense, useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { CuboidCollider, RigidBody, TrimeshCollider } from '@react-three/rapier';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2 } from 'three';
import {
  REAL_CUP_WALL,
  REAL_FURNITURE,
  REAL_ROOMS,
  REAL_STAGE,
  REAL_STAIR,
} from '../../../../../../packages/shared/real/layout';
import {
  realCoaches,
  realCopy,
  realDisplayCups,
  realHonours,
  realLanguage,
  realPhoto,
  realTermLabel,
  realTermsInEra,
  realText,
  realTimeline,
} from '../../../../../../packages/shared/real/content';
import { Box } from '../Models';
import { AssetBoundary } from '../BlenderAsset';
import type { V3 } from '../IndoorKit';
import { StoneArch } from '../CaveGate';
import {
  blue,
  Column,
  Crown,
  Crystal,
  gold,
  Lantern,
  MadridCrest,
  MadridFlag,
  MadridShirt,
  navy,
  pearl,
  Rosette,
  RoyalSign,
  VaultRib,
} from './RealArchitecture';

const { refuge, museum, passage } = REAL_ROOMS;
const lang = () => realLanguage(document.documentElement.lang);
const copy = (key: keyof typeof realCopy) => realText(lang(), realCopy[key]);
const shellColor = '#30345e';

function MarbleFloor({
  x,
  z,
  width,
  length,
}: {
  x: number;
  z: number;
  width: number;
  length: number;
}) {
  const marble = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f4ece0';
    ctx.fillRect(0, 0, 256, 256);
    ctx.lineCap = 'round';
    for (let i = 0; i < 20; i++) {
      const start = ((i * 37) % 310) - 35;
      ctx.beginPath();
      ctx.moveTo(start, 0);
      ctx.bezierCurveTo(start - 35, 96, start + 49, 131, start + 75, 256);
      ctx.lineWidth = (i % 4) + 0.4;
      ctx.strokeStyle = i % 3 === 0 ? '#a7a6b636' : '#b6abc422';
      ctx.stroke();
    }
    ctx.strokeStyle = '#a18d776a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 256);
    const map = new CanvasTexture(c);
    map.colorSpace = SRGBColorSpace;
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(width / 2, length / 2);
    map.anisotropy = 4;
    return map;
  }, [width, length]);
  useEffect(() => () => marble.dispose(), [marble]);
  return (
    <mesh position={[x, -0.003, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial map={marble} roughness={0.38} metalness={0.12} />
    </mesh>
  );
}

function Runner({ position, width, length }: { position: V3; width: number; length: number }) {
  return (
    <group position={position}>
      <Box position={[0, 0.013, 0]} size={[width, 0.026, length]} color={blue} solid={false} />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - 0.13), 0.028, 0]}>
          <boxGeometry args={[0.045, 0.015, length - 0.08]} />
          <meshBasicMaterial color="#e8b966" />
        </mesh>
      ))}
    </group>
  );
}

function Wall({ position, size }: { position: V3; size: V3 }) {
  return <Box position={position} size={size} color={shellColor} />;
}

function DoorWall({
  position,
  rotation = 0,
  width,
  height,
  opening = 3.2,
}: {
  position: V3;
  rotation?: number;
  width: number;
  height: number;
  opening?: number;
}) {
  const sideWidth = width / 2 - opening;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        {[-1, 1].map((side) => (
          <Wall
            key={side}
            position={[side * (opening + sideWidth / 2), height / 2, 0]}
            size={[sideWidth, height, 0.5]}
          />
        ))}
        <Wall position={[0, (height + 5.7) / 2, 0]} size={[opening * 2, height - 5.7, 0.5]} />
      </RigidBody>
      <StoneArch radius={opening - 0.13} spring={2.55} depth={0.66} trim={pearl} stone="#a7a4bc" />
      <VaultRib span={opening + 0.19} spring={2.75} peak={6.03} position={[0, 0, 0.38]} />
    </group>
  );
}

function Ceiling({
  half,
  back,
  front,
  height,
  spring,
}: {
  half: number;
  back: number;
  front: number;
  height: number;
  spring: number;
}) {
  const profile = [
    [-half, spring],
    [-half * 0.87, spring + 1.9],
    [-half * 0.46, height - 1.3],
    [0, height],
    [half * 0.46, height - 1.3],
    [half * 0.87, spring + 1.9],
    [half, spring],
  ];
  return (
    <>
      {profile.slice(0, -1).map(([x, y], i) => {
        const [nextX, nextY] = profile[i + 1];
        return (
          <Box
            key={x}
            position={[(x + nextX) / 2, (y + nextY) / 2, (back + front) / 2]}
            rotation={[0, 0, Math.atan2(nextY - y, nextX - x)]}
            size={[Math.hypot(nextX - x, nextY - y) + 0.15, 0.24, front - back]}
            color={i % 2 === 0 ? '#21264d' : '#34345f'}
            solid={false}
          />
        );
      })}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[half, 0.24, (front - back) / 2]}
          position={[0, height + 0.3, (front + back) / 2]}
        />
      </RigidBody>
    </>
  );
}

function RoomDecor({
  half,
  front,
  back,
  height,
  bays,
}: {
  half: number;
  front: number;
  back: number;
  height: number;
  bays: number[];
}) {
  const spring = height - 4.1;
  return (
    <>
      <Ceiling half={half} front={front} back={back} height={height} spring={spring} />
      {bays.map((z) => (
        <group key={z}>
          <VaultRib
            span={half - 1.15}
            spring={spring - 0.1}
            peak={height - 0.19}
            position={[0, 0, z]}
          />
          {[-1, 1].map((side) => (
            <group key={side}>
              <Column position={[side * (half - 1.2), 0, z]} height={spring} />
              <Lantern position={[side * (half - 2.05), 3.6, z + 0.12]} />
            </group>
          ))}
        </group>
      ))}
      {[-1, 1].flatMap((side) =>
        [front - 0.85, back + 0.9].map((z) => (
          <Crystal key={side + ':' + z} position={[side * (half - 0.74), 0, z]} scale={1.05} />
        )),
      )}
      {[-1, 1].map((side) => (
        <group key={side}>
          {[0.18, spring - 0.22].map((y) => (
            <Box
              key={y}
              position={[side * (half - 0.09), y, (front + back) / 2]}
              size={[0.15, 0.085, front - back]}
              color={gold}
              solid={false}
            />
          ))}
        </group>
      ))}
    </>
  );
}

function BackWallPanels({ back, span }: { back: number; span: number }) {
  return (
    <group>
      <Box position={[0, 1.1, back + 0.1]} size={[span, 2.15, 0.16]} color={navy} solid={false} />
      <Box
        position={[0, 2.17, back + 0.23]}
        size={[span, 0.105, 0.12]}
        color={gold}
        solid={false}
      />
      <Box position={[0, 9.68, back + 0.18]} size={[span, 0.18, 0.17]} color={gold} solid={false} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (span / 2 - 4.2), 0, back + 0.23]}>
          <Box position={[0, 5.86, 0]} size={[5.15, 6.75, 0.18]} color={navy} solid={false} />
          <VaultRib span={2.62} spring={5.77} peak={9.08} position={[0, 0, 0.21]} />
          <Column position={[-2.63, 0, 0.15]} height={5.76} />
          <Column position={[2.63, 0, 0.15]} height={5.76} />
        </group>
      ))}
    </group>
  );
}

function Pedestal({ position, width = 2.3 }: { position: V3; width?: number }) {
  return (
    <group position={position}>
      <Box position={[0, 0.13, 0]} size={[width, 0.26, width]} color={pearl} solid={false} />
      <Box
        position={[0, 0.54, 0]}
        size={[width - 0.21, 0.65, width - 0.22]}
        color={blue}
        solid={false}
      />
      <Box position={[0, 0.94, 0]} size={[width, 0.19, width]} color={gold} solid={false} />
    </group>
  );
}

function SilverCup({
  position,
  variant = 2,
  scale = 1,
}: {
  position: V3;
  variant?: number;
  scale?: number;
}) {
  const stem = [0.68, 0.7, 0.41, 0.77, 0.94, 0.55, 0.69][variant];
  const width = [0.56, 0.47, 0.46, 0.36, 0.36, 0.54, 0.38][variant];
  const metal = variant === 2 || variant === 3 ? '#eaeaf9' : '#e7ad52';
  const profile = useMemo(
    () =>
      [
        [0.32, 0],
        [0.35, 0.1],
        [0.23, 0.19],
        [0.09, 0.26],
        [0.12, stem],
        [width * 0.54, stem + 0.16],
        [width, stem + 0.55],
        [width * 1.03, stem + 0.68],
        [width * 0.85, stem + 0.68],
        [width * 0.75, stem + 0.49],
        [0.09, stem + 0.18],
      ].map(([x, y]) => new Vector2(x, y)),
    [stem, width],
  );
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <latheGeometry args={[profile, 22]} />
        <meshStandardMaterial
          color={metal}
          metalness={0.64}
          roughness={0.22}
          emissive={metal}
          emissiveIntensity={0.24}
          side={2}
        />
      </mesh>
      {variant === 4 ? (
        <mesh position={[0, stem + 0.71, 0]}>
          <sphereGeometry args={[0.37, 16, 12]} />
          <meshStandardMaterial color={metal} metalness={0.57} roughness={0.31} />
        </mesh>
      ) : (
        [-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * width * 0.98, stem + (variant === 2 ? 0.49 : 0.43), 0]}
            scale={[0.73, variant === 2 ? 1.48 : 0.87, 1]}
          >
            <torusGeometry args={[0.29, 0.052, 7, 21]} />
            <meshStandardMaterial
              color={metal}
              metalness={0.58}
              roughness={0.24}
              emissive={metal}
              emissiveIntensity={0.22}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

function Stage() {
  const { left, right, front, back, rise } = REAL_STAIR;
  const width = right - left;
  const vertices = useMemo(
    () => new Float32Array([left, 0, front, right, 0, front, right, rise, back, left, rise, back]),
    [left, right, front, rise, back],
  );
  const indices = useMemo(() => new Uint32Array([0, 1, 2, 0, 2, 3]), []);
  const steps = 8;
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider args={[vertices, indices]} />
        <CuboidCollider
          args={[width / 2, rise / 2, (REAL_STAGE.front - REAL_STAGE.back) / 2]}
          position={[0, rise / 2, (REAL_STAGE.front + REAL_STAGE.back) / 2]}
        />
        {[-1, 1].map((side) => (
          <CuboidCollider
            key={side}
            args={[0.12, 1.05, 4.6]}
            position={[side * right, 1.0, -21.35]}
          />
        ))}
      </RigidBody>
      {Array.from({ length: steps }, (_, i) => {
        const depth = (front - back) / steps;
        const h = (rise * (i + 1)) / steps;
        return (
          <group key={i}>
            <Box
              position={[0, h / 2, front - depth * (i + 0.5)]}
              size={[width, h, depth]}
              color={i % 2 ? '#eee1d2' : pearl}
              solid={false}
            />
            <Box
              position={[0, h - 0.026, front - depth * i]}
              size={[width, 0.034, 0.046]}
              color={gold}
              solid={false}
            />
          </group>
        );
      })}
      <Box
        position={[0, rise / 2, (REAL_STAGE.front + REAL_STAGE.back) / 2]}
        size={[width, rise, REAL_STAGE.front - REAL_STAGE.back]}
        color={pearl}
      />
      <Runner position={[0, rise, -23.5]} width={5.2} length={4.25} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * right, 1.0 + rise / 2, (front + back) / 2]}
            size={[0.16, 0.14, Math.hypot(front - back, rise)]}
            rotation={[Math.atan2(rise, front - back), 0, 0]}
            color={gold}
            solid={false}
          />
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              position={[
                side * right,
                0.53 + (rise * i) / 3,
                front - 0.24 - ((front - back - 0.24) * i) / 3,
              ]}
              size={[0.14, 1.03, 0.14]}
              color={pearl}
              solid={false}
            />
          ))}
          <Pedestal position={[side * 6.3, 0, -20]} />
          <SilverCup position={[side * 6.3, 1.05, -20]} scale={1.5} />
          <Crystal position={[side * 7.9, 0, -22.7]} />
        </group>
      ))}
      <VaultRib span={4.7} spring={2.1} peak={6} position={[0, 0.7, -25.55]} />
      <Crown position={[0, 3.15, -25.27]} scale={2.05} />
    </>
  );
}

function Flowers({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.42, 0.29, 0.4, 10]} />
        <meshStandardMaterial color={pearl} roughness={0.59} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const x = Math.cos(i * 2.4) * 0.4,
          z = Math.sin(i * 2.4) * 0.4;
        return (
          <mesh key={i} position={[x, 0.48 + (i % 3) * 0.09, z]} scale={[1, 0.74, 1]}>
            <icosahedronGeometry args={[0.17, 1]} />
            <meshStandardMaterial color={i % 2 ? '#de9bff' : '#fff2df'} roughness={0.67} />
          </mesh>
        );
      })}
    </group>
  );
}

function Lounge() {
  return (
    <group name="madridistas-lounge">
      <Rosette position={[-10.65, 0.016, -4.6]} size={3.8} />
      <RoyalSign
        lines={[copy('lounge').toUpperCase()]}
        width={7.8}
        height={0.78}
        position={[-10.65, 4.97, -10.62]}
      />
      <Box position={[-10.65, 2.39, -11]} size={[7.3, 4.8, 0.75]} color={navy} />
      <RoyalSign
        lines={['MADRIDISTAS', copy('score'), copy('waiting')]}
        width={4.15}
        height={2.28}
        position={[-10.65, 2.78, -10.55]}
      />
      {[-13.6, -7.7].map((x) => (
        <group key={x}>
          {[0.57, 1.65, 2.71, 3.8].map((y) => (
            <Box
              key={y}
              position={[x, y, -10.63]}
              size={[1.5, 0.095, 0.76]}
              color={gold}
              solid={false}
            />
          ))}
          <MadridShirt position={[x, 2.21, -10.3]} scale={0.72} />
          <mesh position={[x, 4.13, -10.48]} rotation={[0.2, 0.4, 0]}>
            <icosahedronGeometry args={[0.29, 1]} />
            <meshStandardMaterial color={pearl} flatShading />
          </mesh>
        </group>
      ))}
      <Box position={[-10.65, 0.24, -7.74]} size={[6.45, 0.48, 1.79]} color={navy} />
      <Box position={[-10.65, 0.82, -8.51]} size={[6.45, 0.82, 0.39]} color={blue} />
      {[-13.65, -7.65].map((x) => (
        <Box key={x} position={[x, 0.55, -7.76]} size={[0.48, 0.74, 1.7]} color={blue} />
      ))}
      {[-12.75, -11.35, -9.95, -8.55].map((x, i) => (
        <group key={x}>
          <Box position={[x, 0.47, -7.59]} size={[1.32, 0.19, 1.33]} color={blue} solid={false} />
          <Box
            position={[x + 0.18, 0.88, -8.18]}
            rotation={[0.16, 0, (i % 2 ? -1 : 1) * 0.14]}
            size={[0.71, 0.54, 0.17]}
            color={pearl}
            solid={false}
          />
        </group>
      ))}
      <group position={[-10.65, 0, -3.25]} scale={[1, 1, 0.65]}>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[1.35, 1.35, 0.12, 28]} />
          <meshStandardMaterial color={pearl} metalness={0.28} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.28, 0.64, 0.54, 16]} />
          <meshStandardMaterial color={gold} metalness={0.46} roughness={0.32} />
        </mesh>
      </group>
      <Flowers position={[-10.65, 0.7, -3.25]} />
      <Lantern position={[-14.75, 1.4, -8.9]} />
    </group>
  );
}

function StonePiece({ position, scale, detail = 1 }: { position: V3; scale: V3; detail?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <icosahedronGeometry args={[1, detail]} />
      <meshStandardMaterial color={pearl} roughness={0.56} flatShading={detail === 0} />
    </mesh>
  );
}

function Lion({ position, rotation }: { position: V3; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <StonePiece position={[0, 0.68, 0]} scale={[0.58, 0.61, 1.04]} />
      <StonePiece position={[0, 1.04, 0.49]} scale={[0.6, 0.69, 0.58]} detail={0} />
      <StonePiece position={[0, 1.38, 0.65]} scale={[0.4, 0.37, 0.46]} />
      <StonePiece position={[0, 1.3, 1.02]} scale={[0.27, 0.19, 0.23]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <StonePiece position={[side * 0.3, 1.64, 0.56]} scale={[0.13, 0.15, 0.11]} />
          <StonePiece position={[side * 0.38, 0.22, 0.62]} scale={[0.2, 0.22, 0.66]} />
          <mesh position={[side * 0.235, 1.49, 0.925]}>
            <sphereGeometry args={[0.046, 9, 6]} />
            <meshStandardMaterial color="#746478" />
          </mesh>
        </group>
      ))}
      <Crown position={[0, 1.67, 0.49]} scale={0.41} />
    </group>
  );
}

function CarloStatue() {
  return (
    <group name="ancelotti-sculpture" position={[-10, 0, -9.5]} rotation={[0, 0.54, 0]}>
      <Pedestal position={[0, 0, 0]} width={2.2} />
      <group position={[0, 1.07, 0]} scale={1.21}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <StonePiece position={[side * 0.2, 0.51, 0]} scale={[0.19, 0.59, 0.21]} />
            <StonePiece position={[side * 0.21, 0.08, 0.12]} scale={[0.18, 0.11, 0.27]} />
          </group>
        ))}
        <StonePiece position={[0, 1.23, 0]} scale={[0.55, 0.58, 0.29]} />
        <StonePiece position={[0, 1.75, 0.02]} scale={[0.155, 0.19, 0.17]} />
        <StonePiece position={[0, 2.04, 0.03]} scale={[0.26, 0.34, 0.25]} detail={2} />
        <StonePiece position={[0, 2.04, 0.257]} scale={[0.08, 0.095, 0.09]} />
        <StonePiece position={[0, 2.25, -0.015]} scale={[0.26, 0.139, 0.234]} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <group position={[side * 0.49, 1.29, 0.04]} rotation={[0, 0, side * 0.28]}>
              <StonePiece position={[0, 0, 0]} scale={[0.17, 0.37, 0.16]} />
            </group>
            <group position={[side * 0.2, side * 0.09 + 1.15, 0.31]} rotation={[0, 0, side * 0.3]}>
              <StonePiece position={[0, 0, 0]} scale={[0.34, 0.12, 0.13]} />
            </group>
          </group>
        ))}
        <Box
          position={[0, 1.51, 0.286]}
          size={[0.075, 0.25, 0.025]}
          color="#a598a2"
          solid={false}
        />
      </group>
      <RoyalSign
        lines={['CARLO ANCELOTTI', '2013–2015 · 2021–2025']}
        width={1.92}
        height={0.5}
        position={[0, 0.6, 1.14]}
      />
    </group>
  );
}

function CupCase({ x, index }: { x: number; index: number }) {
  const honour = realHonours.find((item) => item.id === realDisplayCups[index])!;
  return (
    <group name={'madrid-cup-' + index} position={[x, 0, -21.8]}>
      <Box position={[0, 0.34, 0]} size={[2.65, 0.68, 1.5]} color={navy} />
      <Box position={[0, 0.67, 0]} size={[2.65, 0.1, 1.5]} color={gold} solid={false} />
      <Box position={[0, 2.42, 0]} size={[2.65, 0.13, 1.5]} color={gold} solid={false} />
      <Box position={[0, 1.54, -0.72]} size={[2.65, 1.68, 0.09]} color={blue} solid={false} />
      {[-1, 1].map((side) => (
        <Box
          key={side}
          position={[side * 1.29, 1.56, 0.68]}
          size={[0.055, 1.72, 0.055]}
          color={gold}
          solid={false}
        />
      ))}
      <SilverCup position={[0, 0.73, 0]} variant={index} scale={0.93} />
      <RoyalSign
        lines={[realText(lang(), honour.title), '× ' + honour.seasons.length]}
        width={2.42}
        height={0.45}
        position={[0, 0.34, 0.77]}
      />
    </group>
  );
}

function PhotoSurface({ src, width, height }: { src: string; width: number; height: number }) {
  const map = useLoader(TextureLoader, src);
  map.colorSpace = SRGBColorSpace;
  const photoRatio = map.image.width / map.image.height;
  const scale = Math.min(width / photoRatio, height);
  return (
    <mesh position={[0, 0, 0.095]}>
      <planeGeometry args={[scale * photoRatio, scale]} />
      <meshBasicMaterial map={map} />
    </mesh>
  );
}
function PhotoFrame({
  src,
  position,
  width,
  height,
}: {
  src: string;
  position: V3;
  width: number;
  height: number;
}) {
  return (
    <group position={position}>
      <Box size={[width + 0.12, height + 0.12, 0.15]} color={gold} solid={false} />
      <Box size={[width, height, 0.032]} position={[0, 0, 0.074]} color={navy} solid={false} />
      <AssetBoundary asset={src}>
        <Suspense fallback={null}>
          <PhotoSurface src={src} width={width - 0.13} height={height - 0.13} />
        </Suspense>
      </AssetBoundary>
    </group>
  );
}

function Museum() {
  const wallTerms = realTermsInEra(4);
  return (
    <group
      name="real-madrid-heritage-hall"
      position={[museum.left, 0, -14]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      <MarbleFloor x={0} z={-12} width={30} length={24} />
      <RigidBody type="fixed" colliders="cuboid">
        <Wall position={[0, 5.5, -24.24]} size={[30, 11, 0.48]} />
        {[-1, 1].map((side) => (
          <Wall key={side} position={[side * 15.24, 5.5, -12]} size={[0.48, 11, 24]} />
        ))}
      </RigidBody>
      <DoorWall position={[0, 0, 0]} width={30} height={11} opening={3} />
      <BackWallPanels back={-24} span={29.4} />
      <RoomDecor half={15} front={0} back={-24} height={11} bays={[-4.5, -13.7, -22]} />
      <Runner position={[0, 0, -10]} width={5.45} length={17.5} />
      <Rosette position={[0, 0.04, -11]} size={2.45} />
      <RoyalSign
        lines={[copy('museum').toUpperCase(), 'REAL MADRID']}
        width={16.3}
        height={1.57}
        position={[0, 7.65, -23.55]}
      />
      <MadridCrest position={[0, 9.03, -23.45]} scale={0.71} />
      <RoyalSign
        lines={[copy('coaches').toUpperCase()]}
        width={19.3}
        height={0.63}
        position={[0, 5.94, -23.5]}
      />
      {wallTerms.map((term, i) => {
        const person = realCoaches[term.personId];
        return (
          <group key={term.id} position={[(i - (wallTerms.length - 1) / 2) * 3.02, 4.25, -23.48]}>
            {person.portrait && (
              <PhotoFrame
                src={person.portrait}
                position={[0, 0.27, 0]}
                width={2.72}
                height={1.77}
              />
            )}
            <RoyalSign
              lines={[person.name, realTermLabel(term, lang()) + (term.current ? '  ★' : '')]}
              width={2.72}
              height={0.61}
              position={[0, -0.94, 0.02]}
            />
          </group>
        );
      })}
      {REAL_CUP_WALL.map((x, i) => (
        <CupCase key={x} x={x} index={i} />
      ))}
      <CarloStatue />
      <group position={[-14.52, 2.85, -16.15]} rotation={[0, Math.PI / 2, 0]}>
        <RoyalSign
          lines={[copy('legends').toUpperCase()]}
          width={4.15}
          height={0.58}
          position={[-0.3, 1.38, 0]}
        />
        <PhotoFrame
          src={realPhoto('madrid-1950s')}
          width={4.15}
          height={2.43}
          position={[-0.3, -0.22, 0]}
        />
        <MadridShirt position={[-4.9, 0.08, 0.15]} scale={1.38} />
        <RoyalSign
          lines={[copy('matches').toUpperCase(), '1956 · 1960 · 2014 · 2018 · 2024']}
          width={3.15}
          height={2.48}
          position={[3.7, 0, 0]}
        />
      </group>
      <group position={[14.52, 3.08, -10.0]} rotation={[0, -Math.PI / 2, 0]}>
        <RoyalSign
          lines={[copy('timeline').toUpperCase()]}
          width={6.5}
          height={0.69}
          position={[0, 2.2, 0]}
        />
        {realTimeline.map((event, i) => (
          <RoyalSign
            key={event.year}
            lines={[event.year + '  ·  ' + realText(lang(), event.title)]}
            width={6.42}
            height={0.39}
            position={[0, 1.51 - 0.46 * i, 0]}
          />
        ))}
        <RoyalSign
          lines={[copy('gallery').toUpperCase()]}
          width={4.55}
          height={0.61}
          position={[-7.85, 1.23, 0]}
        />
        <PhotoFrame
          src={realPhoto('bernabeu')}
          width={4.55}
          height={2.72}
          position={[-7.85, -0.52, 0]}
        />
      </group>
      {[-1, 1].map((side) => (
        <MadridFlag key={side} position={[side * 11.7, 7.35, -23.1]} />
      ))}
      <pointLight color="#ffcc8d" position={[-8, 5, -12]} intensity={290} distance={23} decay={2} />
      <pointLight color="#ffd4a1" position={[3, 6, -18]} intensity={300} distance={25} decay={2} />
      <pointLight color="#a97dff" position={[9, 6, -5]} intensity={154} distance={22} decay={2} />
    </group>
  );
}

export default function RealCaveScene() {
  return (
    <group name="real-madrid-connected-cave">
      <RigidBody type="fixed" colliders={false}>
        {Object.values(REAL_ROOMS).map((room) => (
          <CuboidCollider
            key={room.left}
            args={[(room.right - room.left) / 2, 0.22, (room.front - room.back) / 2 + 0.003]}
            position={[(room.left + room.right) / 2, -0.22, (room.front + room.back) / 2]}
          />
        ))}
        {REAL_FURNITURE.map(({ x, z, w, d, h }) => (
          <CuboidCollider key={x + ':' + z} args={[w / 2, h / 2, d / 2]} position={[x, h / 2, z]} />
        ))}
      </RigidBody>
      <MarbleFloor x={0} z={-11} width={32} length={30} />
      <DoorWall position={[0, 0, refuge.front]} width={32} height={12} />
      <DoorWall
        position={[refuge.right, 0, -14]}
        rotation={-Math.PI / 2}
        width={24}
        height={12}
        opening={3}
      />
      <RigidBody type="fixed" colliders="cuboid">
        <Wall position={[16.24, 6, 1]} size={[0.48, 12, 6]} />
        <Wall position={[-16.24, 6, -11]} size={[0.48, 12, 30]} />
        <Wall position={[0, 6, -26.24]} size={[32, 12, 0.48]} />
        <Wall position={[19, 3, passage.back - 0.24]} size={[6, 6, 0.48]} />
        <Wall position={[19, 3, passage.front + 0.24]} size={[6, 6, 0.48]} />
        <Wall position={[19, 6.25, -14]} size={[6, 0.5, 6]} />
      </RigidBody>
      <MarbleFloor x={19} z={-14} width={6} length={6} />
      <group position={[19, 0, -14]} rotation={[0, -Math.PI / 2, 0]}>
        <Runner position={[0, 0, 0]} width={3.65} length={6} />
        <Lantern position={[-2.5, 2.75, 0]} />
        <Lantern position={[2.5, 2.75, 0]} />
      </group>
      <group position={[15.63, 0, -14]} rotation={[0, -Math.PI / 2, 0]}>
        <RoyalSign
          lines={[copy('museum').toUpperCase(), 'REAL MADRID']}
          width={6.05}
          height={1.19}
          position={[0, 6.63, 0]}
        />
      </group>
      <group position={[0, 0, 3.63]} rotation={[0, Math.PI, 0]}>
        <RoyalSign
          lines={[copy('exit').toUpperCase()]}
          width={6}
          height={0.76}
          position={[0, 5.98, 0]}
        />
      </group>
      <BackWallPanels back={-26} span={31.4} />
      <RoomDecor half={16} front={4} back={-26} height={12} bays={[-1, -11, -23.5]} />
      <Runner position={[0, 0, -6.35]} width={5.75} length={19.75} />
      <Rosette position={[0, 0.04, -4.55]} size={2.68} />
      <Stage />
      <Lounge />
      <RoyalSign
        lines={[copy('title').toUpperCase(), copy('motto')]}
        width={14.2}
        height={1.58}
        position={[0, 7.12, -22.85]}
      />
      <MadridCrest position={[0, 9.01, -22.68]} scale={1.07} />
      <RoyalSign
        lines={[copy('score').toUpperCase(), 'REAL MADRID', copy('waiting')]}
        width={7.8}
        height={2.08}
        position={[0, 4.92, -22.85]}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <MadridFlag position={[side * 9.55, 6.05, -22.6]} scale={1.09} />
          <Box
            position={[side * 7.25, 6.27, -23.02]}
            size={[2.67, 0.23, 2.05]}
            color={gold}
            solid={false}
          />
          <Lion position={[side * 7.23, 6.39, -22.95]} rotation={-side * 0.52} />
          <Flowers position={[side * 8.1, 0, -19.7]} />
          <Lantern position={[side * 5.45, 2.9, -23.15]} />
          <Crystal position={[side * 11.55, 1.25, -23.1]} scale={1.2} />
        </group>
      ))}
      <pointLight
        color="#ffc87a"
        position={[0, 6.6, -17]}
        intensity={400}
        distance={29}
        decay={2}
      />
      <pointLight
        color="#ffcc96"
        position={[-10.65, 4.2, -6]}
        intensity={175}
        distance={15}
        decay={2}
      />
      <pointLight color="#b9a4ff" position={[6.5, 6, -6]} intensity={224} distance={25} decay={2} />
      <Museum />
    </group>
  );
}
