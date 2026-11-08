import { Suspense, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { Color, LatheGeometry, SRGBColorSpace, TextureLoader, TorusGeometry, Vector2 } from 'three';
import { cityPhoto, cityText, type CityCard, type CityLanguage } from '../../../../../../packages/shared/city/content';
import { emit } from '../../bridge';
import { AssetBoundary } from '../BlenderAsset';
import type { V3 } from '../IndoorKit';
import { CityBox, CitySign, blue, gold, ice, navy, trim } from './CityArchitecture';

function Photo({ file, width, height }: { file: string; width: number; height: number }) {
  const map = useLoader(TextureLoader, cityPhoto(file));
  map.colorSpace = SRGBColorSpace;
  return <mesh position={[0, 0, 0.065]}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={map} />
  </mesh>;
}

export function CityFrame({ entry, lang, position, yaw = 0, width = 1.8, height = 1.8 }: {
  entry: CityCard; lang: CityLanguage; position: V3; yaw?: number; width?: number; height?: number;
}) {
  const title = cityText(lang, entry.title);
  const fallback = <CitySign position={[0, 0, 0.08]} lines={entry.period ? [entry.period, title] : [title]}
    width={width * 0.91} height={height * 0.8} />;
  return <group position={position} rotation={[0, yaw, 0]} onClick={(event) => {
    if (event.delta < 5) emit('city-exhibit', 'city-' + entry.id);
  }}>
    <CityBox size={[width + 0.15, height + 0.15, 0.12]} color={trim} metal={0.63} />
    <CityBox size={[width, height, 0.125]} color={navy} />
    {entry.image ? (
      <AssetBoundary key={entry.image} asset={entry.image} fallback={fallback}>
        <Suspense fallback={fallback}>
          <Photo file={entry.image} width={width} height={height} />
        </Suspense>
      </AssetBoundary>
    ) : fallback}
    {entry.image && <CitySign position={[0, -height / 2 - 0.24, 0.045]}
      lines={entry.period ? [title, entry.period] : [title]} width={width + 0.02} height={0.38} />}
  </group>;
}

const profiles = [
  [[0,0], [0.34,0], [0.37,0.1], [0.2,0.2], [0.19,0.37], [0.4,0.55], [0.53,0.82], [0.51,1.15], [0.56,1.22], [0.5,1.25], [0.47,1.13], [0.39,0.74], [0.12,0.6], [0,0.6]],
  [[0,0], [0.4,0], [0.39,0.1], [0.19,0.21], [0.12,0.43], [0.43,0.56], [0.48,0.85], [0.37,1.08], [0.18,1.15], [0.23,1.28], [0,1.31]],
  [[0,0], [0.32,0], [0.36,0.07], [0.22,0.15], [0.21,0.29], [0.39,0.36], [0.5,0.66], [0.46,1.01], [0.5,1.06], [0.42,1.08], [0.37,0.68], [0.08,0.48], [0,0.48]],
  [[0,0], [0.43,0], [0.39,0.13], [0.22,0.23], [0.23,0.39], [0.42,0.56], [0.52,0.85], [0.57,1.11], [0.61,1.19], [0.53,1.23], [0.47,0.96], [0.35,0.69], [0.05,0.47], [0,0.47]],
  [[0,0], [0.41,0], [0.39,0.11], [0.16,0.28], [0.13,0.46], [0.22,0.64], [0.29,0.84], [0.3,1.1], [0.22,1.18], [0.14,1.18], [0.2,0.93], [0.13,0.7], [0,0.6]],
  [[0,0], [0.4,0], [0.4,0.08], [0.18,0.13], [0.18,0.52], [0.27,0.88], [0.4,1.15], [0.26,1.31], [0.17,1.05], [0.08,0.8], [0,0.73]],
].map((profile) => profile.map(([x, y]) => new Vector2(x, y)));
const handles = new TorusGeometry(0.31, 0.049, 7, 26);
const silver = '#b7d6e8';
const trophyColors = ['#d3e5ed', '#d5dde3', '#c2e1d3', '#d1e5f7', '#d5e7f7', '#f8c86a'];

export function CityCup({ index, position, scale = 1 }: { index: number; position: V3; scale?: number }) {
  const profile = useMemo(() => new LatheGeometry(profiles[index], 30), [index]);
  return <group position={position} scale={scale}>
    <mesh geometry={profile}>
      <meshStandardMaterial color={trophyColors[index]} metalness={0.85} roughness={0.25} envMapIntensity={1.25} />
    </mesh>
    {index < 4 && [-1, 1].map((side) => <mesh key={side} geometry={handles}
      position={[side * 0.49, index === 3 ? 0.94 : 0.81, 0]}
      scale={[index === 3 ? 0.92 : 0.68, index === 3 ? 1.38 : 0.91, 1]}>
      <meshStandardMaterial color={silver} metalness={0.83} roughness={0.23} />
    </mesh>)}
    {index === 0 && <>
      <mesh position={[0, 1.29, 0]}>
        <torusGeometry args={[0.35, 0.075, 8, 24]} />
        <meshStandardMaterial color={trim} metalness={0.75} roughness={0.26} />
      </mesh>
      {[-1, 1].map((side) => <CityBox key={side} position={[side * 0.68, 0.42, 0.13]} rotation={[0, 0, side * -0.11]}
        size={[0.15, 0.78, 0.045]} color={blue} />)}
    </>}
    {index === 5 && <mesh position={[0, 1.34, 0]}>
      <sphereGeometry args={[0.26, 20, 14]} />
      <meshStandardMaterial color={gold} metalness={0.82} roughness={0.22} />
    </mesh>}
  </group>;
}

export function CityTrophyCase({ x, index, entry, lang }: { x: number; index: number; entry: CityCard; lang: CityLanguage }) {
  return <group position={[x, 0, -20.8]} onClick={(event) => {
    if (event.delta < 5) emit('city-exhibit', 'city-' + entry.id);
  }}>
    <CityBox position={[0, 0.55, 0]} size={[2.48, 1.1, 1.77]} color={navy} solid />
    <CityBox position={[0, 1.13, 0]} size={[2.48, 0.12, 1.77]} color={gold} metal={0.65} />
    <CityBox position={[0, 3.49, 0]} size={[2.48, 0.17, 1.77]} color={gold} metal={0.65} />
    <CityBox position={[0, 2.32, -0.82]} size={[2.46, 2.25, 0.13]} color="#17375e" />
    <CityBox position={[0, 3.36, 0]} size={[2.27, 0.04, 0.78]} color={ice} glow={1.4} />
    {[-1.18, 1.18].flatMap((side) => [-0.83, 0.84].map((z) =>
      <CityBox key={`${side}:${z}`} position={[side, 2.32, z]} size={[0.068, 2.3, 0.075]} color={trim} metal={0.67} />))}
    <mesh position={[0, 2.32, 0.845]} renderOrder={2}>
      <planeGeometry args={[2.33, 2.27]} />
      <meshPhysicalMaterial color="#93d5ff" transparent opacity={0.11} roughness={0.21} metalness={0.15}
        depthWrite={false} />
    </mesh>
    <CityCup index={index} position={[0, 1.21, 0.06]} scale={1.42} />
    <CitySign position={[0, 0.57, 0.91]} lines={[`${entry.seasons!.length} × ${cityText(lang, entry.title)}`]}
      width={2.15} height={0.43} />
  </group>;
}

export function CityCoachStatue() {
  const bronze = new Color('#bc8653');
  const parts = [
    { p: [0, 1.58, 0], s: [0.42, 0.52, 0.25], a: 0 },
    { p: [0, 2.17, 0.035], s: [0.25, 0.32, 0.24], a: 0 },
    { p: [0, 2.04, 0.124], s: [0.189, 0.16, 0.16], a: 0 },
    { p: [0, 2.15, 0.245], s: [0.058, 0.075, 0.06], a: 0 },
    { p: [-0.34, 1.66, 0], s: [0.15, 0.32, 0.15], a: 0.37 },
    { p: [-0.53, 1.78, 0.25], s: [0.13, 0.29, 0.14], a: 0.65 },
    { p: [-0.68, 2.03, 0.27], s: [0.11, 0.12, 0.11], a: 0.3 },
    { p: [0.37, 1.46, 0.03], s: [0.12, 0.43, 0.14], a: 0.15 },
    { p: [0.39, 1.08, 0.07], s: [0.095, 0.13, 0.105], a: 0.1 },
    { p: [-0.17, 0.67, 0.03], s: [0.175, 0.64, 0.17], a: -0.06 },
    { p: [0.17, 0.66, -0.03], s: [0.17, 0.65, 0.17], a: 0.09 },
    { p: [-0.22, 0.08, 0.115], s: [0.19, 0.095, 0.29], a: 0 },
    { p: [0.22, 0.08, 0.115], s: [0.19, 0.095, 0.29], a: 0 },
  ];
  return <group position={[0, 0.88, 0]} scale={1.16}>
    {parts.map(({ p, s, a }, i) => <mesh key={i} position={p as V3} scale={s as V3} rotation={[0, 0, a]}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color={bronze} metalness={0.67} roughness={0.37} flatShading />
    </mesh>)}
  </group>;
}
