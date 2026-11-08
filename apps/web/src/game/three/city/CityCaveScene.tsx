import { Suspense } from 'react';
import { CuboidCollider, TrimeshCollider } from '@react-three/rapier';
import { CITY_COPY, cityGallery, cityLanguage, cityText } from '../../../../../../packages/shared/city/content';
import { CITY_BLOCKS, CITY_HALL, CITY_LINK, CITY_STAIR } from '../../../../../../packages/shared/city/layout';
import { CORRIDOR_HALF_WIDTH } from '../../../../../../packages/shared/grandHall';
import { emit } from '../../bridge';
import { AssetModel } from '../AssetModel';
import type { V3 } from '../IndoorKit';
import {
  CityArch, CityBanner, CityBox, CityCarpet, CityCrest, CityCrystal, CityFixed, CityFloor, CityLantern,
  CityPier, CityShip, CitySign, CityVault, CityWall, blue, gold, ice, navy, trim,
} from './CityArchitecture';
import { CityCup, CityFrame } from './CityExhibits';
import { CityHeritageHall } from './CityHeritageHall';

const { width, foot, landing, rise, steps } = CITY_STAIR;
const ramp = new Float32Array([
  -width / 2, 0, foot, width / 2, 0, foot, -width / 2, rise, landing, width / 2, rise, landing,
  -width / 2, 0, landing, width / 2, 0, landing,
]);
const rampFaces = new Uint32Array([0, 1, 2, 1, 3, 2, 0, 2, 4, 1, 5, 3, 2, 3, 5, 2, 5, 4]);

function CityStair() {
  const run = (foot - landing) / steps;
  const back = CITY_HALL.north;
  return <group name="city-central-stair">
    <TrimeshCollider args={[ramp, rampFaces]} />
    <CuboidCollider args={[width / 2, rise / 2, (landing - back) / 2]}
      position={[0, rise / 2, (landing + back) / 2]} />
    {Array.from({ length: steps }, (_, i) => {
      const h = rise * (i + 1) / steps;
      const z = foot - run * (i + 0.5);
      return <group key={i}>
        <CityBox position={[0, h / 2, z]} size={[width, h, run + 0.005]} color={i % 2 ? '#527598' : '#45698a'} solid />
        <CityBox position={[0, h - 0.019, z + run / 2]} size={[width, 0.039, 0.044]} color="#84a7c4" />
        {[-1, 1].map((side) => <CityBox key={side} position={[side * 3.95, h + 0.011, z]}
          size={[0.22, 0.025, run * 0.57]} color={trim} glow={0.58} />)}
      </group>;
    })}
    <CityBox position={[0, rise / 2, (landing + back) / 2]} size={[width, rise, landing - back]}
      color="#4f769b" solid />
    {[-1, 1].map((side) => <group key={side} position={[side * 4.35, 0, 0]}>
      <CityBox position={[0, rise / 2 + 0.65, (foot + landing) / 2]} size={[0.15, 0.12, Math.hypot(foot - landing, rise)]}
        rotation={[Math.atan2(rise, foot - landing), 0, 0]} color={gold} metal={0.65} />
      {[0, 0.5, 1].map((i) => <CityBox key={i} position={[0, rise * i + 0.35, foot + (landing - foot) * i]}
        size={[0.19, 0.7, 0.18]} color={navy} metal={0.38} />)}
    </group>)}
  </group>;
}

function CityPot({ position, scale = 1 }: { position: V3; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 0.32, 0]}>
      <cylinderGeometry args={[0.36, 0.24, 0.64, 10]} />
      <meshStandardMaterial color={gold} metalness={0.67} roughness={0.3} />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => {
      const a = i * 2.4, r = 0.23 + (i % 3) * 0.13;
      return <mesh key={i} position={[Math.sin(a) * r, 0.65 + (i % 4) * 0.15, Math.cos(a) * r]}
        rotation={[Math.cos(a) * 0.85, a, Math.sin(a) * 0.72]} scale={[0.16, 0.49, 0.105]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={i % 2 ? '#518361' : '#2c6957'} roughness={0.83} flatShading />
      </mesh>;
    })}
  </group>;
}

function CityLounge({ lang }: { lang: ReturnType<typeof cityLanguage> }) {
  return <group name="city-fan-lounge">
    <CityCarpet position={[-10.9, 0.021, -20.1]} width={7.9} depth={8.8} />
    <CityArch position={[-10.95, 0, -25.8]} radius={3.95} spring={2.58} />
    <CitySign position={[-10.95, 4.75, -24.8]} width={6.85} height={0.78}
      lines={[cityText(lang, CITY_COPY.lounge).toUpperCase()]} />
    <CityBox position={[-11, 1.06, -24.7]} size={[7.8, 2.1, 1.35]} color={navy} solid />
    <CityBox position={[-11, 2.15, -24.65]} size={[7.8, 0.16, 1.45]} color={gold} metal={0.65} />
    <CityFrame entry={cityGallery[0]} lang={lang} position={[-11, 3.29, -24.9]} width={4.28} height={1.68} />
    <group onClick={(event) => { if (event.delta < 5) emit('city-board', true); }}>
      <CitySign position={[-11, 1.27, -23.95]} lines={[cityText(lang, CITY_COPY.news)]} width={4.85} height={0.64} />
    </group>
    <CityPot position={[-14.25, 0, -22.6]} />
    <CityPot position={[-7.45, 0, -23.5]} />
    <CityLantern position={[-14, 3.13, -24.2]} />
    <CityLantern position={[-7.95, 3.13, -24.2]} />
    <group position={[-10.9, 0, -17.8]}>
      <CityBox position={[0, 0.29, 0]} size={[5.97, 0.53, 1.49]} color="#142e50" solid />
      <CityBox position={[0, 0.83, 0.56]} size={[5.93, 0.78, 0.42]} color="#17385d" solid />
      {[-2.78, 2.78].map((x) => <CityBox key={x} position={[x, 0.68, -0.01]}
        size={[0.42, 0.36, 1.4]} color="#30567a" solid />)}
      {[-2.1, -0.7, 0.7, 2.1].map((x) => <group key={x} position={[x, 0, 0]}>
        <CityBox position={[0, 0.49, -0.19]} size={[1.34, 0.22, 0.99]} color="#2d5b83" />
        <CityBox position={[0, 0.87, 0.31]} rotation={[0.15, 0, 0]} size={[1.36, 0.64, 0.28]} color="#2c567c" />
      </group>)}
      <CityBox position={[0, 0.23, 0.756]} size={[5.46, 0.052, 0.03]} color={trim} metal={0.64} />
    </group>
    <group position={[-11, 0, -20.55]}>
      {[0.105, 0.52].map((y) => <mesh key={y} position={[0, y, 0]} scale={[1, 1, 0.68]} userData={{ cameraSolid: true }}>
        <cylinderGeometry args={[y > 0.3 ? 1.07 : 0.78, y > 0.3 ? 1.07 : 0.78, 0.14, 32]} />
        <meshStandardMaterial color={y > 0.3 ? '#bd9558' : gold} metalness={0.68} roughness={0.28} />
      </mesh>)}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.24, 0.33, 0.43, 12]} />
        <meshStandardMaterial color={navy} metalness={0.44} />
      </mesh>
      {[-0.47, 0.46].map((x) => <mesh key={x} position={[x, 0.698, 0.17]}>
        <cylinderGeometry args={[0.13, 0.105, 0.21, 12]} />
        <meshStandardMaterial color="#e4f3fe" roughness={0.43} />
      </mesh>)}
      <mesh position={[0.18, 0.8, -0.28]}>
        <icosahedronGeometry args={[0.21, 1]} />
        <meshStandardMaterial color="#dcecf6" flatShading />
      </mesh>
    </group>
    <pointLight position={[-11, 4.1, -20.5]} color="#ffcc8a" intensity={57} distance={15} decay={2} />
  </group>;
}

function CityFeature({ lang }: { lang: ReturnType<typeof cityLanguage> }) {
  return <group>
    <CityStair />
    <CityCarpet position={[0, 0.018, -8.65]} width={7.75} depth={14.1} />
    <CityArch position={[0, 0, -27.15]} radius={5.7} spring={4.78} thickness={0.83} />
    <CityBox position={[0, 3.28, -27.56]} size={[8.4, 4.05, 0.52]} color={navy} />
    <group position={[0, 3.4, -27.13]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.85, 1.85, 0.24, 64]} />
        <meshStandardMaterial color="#1866a4" metalness={0.36} roughness={0.3} emissive="#106ea8" emissiveIntensity={0.58} />
      </mesh>
      {[1.82, 1.98].map((r) => <mesh key={r} position={[0, 0, 0.14]}>
        <torusGeometry args={[r, r < 1.9 ? 0.052 : 0.028, 8, 64]} />
        <meshStandardMaterial color={ice} emissive="#298fe7" emissiveIntensity={1.28} />
      </mesh>)}
      <CityShip position={[0, -0.12, 0.17]} scale={1.03} />
    </group>
    <group onClick={(event) => { if (event.delta < 5) emit('city-board', false); }}>
      <CitySign position={[0, 5.76, -26.86]} lines={[cityText(lang, CITY_COPY.score).toUpperCase(), cityText(lang, CITY_COPY.pending)]}
        width={6.9} height={1.13} />
    </group>
    <CitySign position={[0, 7.56, -26.6]} lines={[cityText(lang, CITY_COPY.hall).toUpperCase(), cityText(lang, CITY_COPY.subtitle)]}
      width={10.7} height={1.75} maxFontSize={106} />
    <Suspense fallback={null}><CityCrest size={2.24} position={[0, 9.77, -26.58]} /></Suspense>
    {[-1, 1].map((side) => <group key={side}>
      <CityBanner position={[side * 7.1, 6.88, -26.98]} height={3.9} />
      <CityBox position={[side * 4.83, 5.65, -26.67]} size={[1.62, 0.47, 1.58]} color={gold} metal={0.58} />
      <Suspense fallback={null}>
        <AssetModel asset="blues-lion" position={[side * 4.85, 5.89, -26.64]} scale={0.82}
          rotation={[0, side * -0.55, 0]} solid={false} />
      </Suspense>
      <CityLantern position={[side * 5.8, 3.35, -26.55]} scale={1.25} />
      <CityBox position={[side * 5.87, 0.47, -24.6]} size={[1.42, 0.94, 1.42]} color={navy} />
      <CityBox position={[side * 5.87, 0.95, -24.6]} size={[1.49, 0.13, 1.49]} color={gold} metal={0.55} />
      <CityCup index={side < 0 ? 0 : 3} position={[side * 5.87, 1.03, -24.6]} scale={1.22} />
    </group>)}
    <pointLight position={[0, 4.8, -24.4]} color="#62bcff" intensity={104} distance={20} decay={2} />
  </group>;
}

function CityMainHall({ lang }: { lang: ReturnType<typeof cityLanguage> }) {
  const { left, right, north, south } = CITY_HALL;
  const hallWidth = right - left, depth = south - north;
  return <group name="city-refuge-hall">
    <CityFloor width={hallWidth} depth={depth} />
    <CityVault width={hallWidth} depth={depth} spring={5.8} rise={6.6} ribs={[-1.5, -8, -14.5, -21.2, -27.2]} rocky />
    <CityWall position={[0, 0, north + 0.09]} width={hallWidth} height={12.8} />
    <CityWall position={[0, 0, south + 0.04]} width={hallWidth} height={12.8}
      gap={{ center: 0, width: CORRIDOR_HALF_WIDTH * 2 }} yaw={Math.PI} />
    <CityWall position={[left + 0.03, 0, -depth / 2]} width={depth} height={6.02} yaw={Math.PI / 2} />
    <CityWall position={[right - 0.03, 0, -depth / 2]} width={depth} height={6.02} yaw={-Math.PI / 2}
      gap={{ center: -1, width: CITY_LINK.south - CITY_LINK.north }} gapHeight={5.36} />
    <CityFeature lang={lang} />
    <CityLounge lang={lang} />
    <group position={[14.56, 0, -15]} rotation={[0, -Math.PI / 2, 0]}>
      <CityArch position={[0, 0, 0]} radius={3.2} spring={2.24} />
      <CitySign position={[0, 5.48, 0.18]} width={7.44} height={0.85}
        lines={[cityText(lang, CITY_COPY.museum).toUpperCase()]} />
      {[-4.24, 4.24].map((x) => <CityLantern key={x} position={[x, 3.1, 0.27]} />)}
    </group>
    <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.49]}>
      <CityArch position={[0, 0, 0]} radius={3.12} spring={2.05} />
      <CitySign position={[0, 5.06, 0.28]} width={6.46} height={0.72} lines={[cityText(lang, CITY_COPY.exit)]} />
    </group>
    {[-1, 1].flatMap((side) => [-4.3, -9.4, -22.2].map((z, i) =>
      <group key={`${side}:${z}`}>
        <CityPier position={[side * 14.5, 0, z]} height={5.85} />
        <CityLantern position={[side * 13.95, 3.4, z + 0.44]} />
        <CityCrystal position={[side * 13.65, 0, z - 0.9]} scale={i === 2 ? 1.16 : 0.9} rotation={z} />
        <CityCrystal position={[side * 14.65, 4.65, z - 2]} scale={0.61} rotation={z} />
      </group>))}
    <CityPot position={[12.6, 0, -10.7]} scale={1.15} />
    <CityPot position={[12.6, 0, -19.3]} scale={1.15} />
    <pointLight position={[9.6, 4.4, -14.2]} color="#ffcc84" intensity={61} distance={17} decay={2} />
    <pointLight position={[0, 6, -7.4]} color="#87c8ff" intensity={73} distance={19} decay={2} />
  </group>;
}

function CityHeritagePassage() {
  const length = CITY_LINK.right - CITY_LINK.left;
  const width = CITY_LINK.south - CITY_LINK.north;
  return <group position={[CITY_LINK.left, 0, -15]} rotation={[0, -Math.PI / 2, 0]}>
    <CityFloor width={width} depth={length} />
    <CityWall position={[-width / 2, 0, -length / 2]} width={length} height={5.62} yaw={Math.PI / 2} />
    <CityWall position={[width / 2, 0, -length / 2]} width={length} height={5.62} yaw={-Math.PI / 2} />
    <CuboidCollider args={[width / 2, 0.24, length / 2]} position={[0, 5.68, -length / 2]} />
    <CityBox position={[0, 5.68, -length / 2]} size={[width, 0.48, length]} color={navy} solid />
    <CityArch position={[0, 0, -2.5]} radius={3.16} spring={2.2} thickness={0.34} />
    <CityCarpet position={[0, 0.024, -length / 2]} width={4.5} depth={length} />
    {[-1, 1].map((side) => <CityLantern key={side} position={[side * 2.94, 2.7, -2.5]} />)}
  </group>;
}

export default function CityCaveScene() {
  const lang = cityLanguage(document.documentElement.lang);
  return <CityFixed>
    <CityMainHall lang={lang} />
    <CityHeritagePassage />
    <CityHeritageHall lang={lang} />
    {CITY_BLOCKS.map(({ x, z, w, d, h }) =>
      <CuboidCollider key={`${x}:${z}`} args={[w / 2, h / 2, d / 2]} position={[x, h / 2, z]} />)}
  </CityFixed>;
}
