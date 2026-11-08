import { Suspense, useMemo } from 'react';
import { Shape, Vector2 } from 'three';
import {
  CITY_COPY, CITY_SECTIONS, cityGallery, cityHonours, cityLegends, cityManagers, cityMatches,
  cityText, cityTimeline, type CityLanguage,
} from '../../../../../../packages/shared/city/content';
import {
  CITY_LINK, CITY_MUSEUM, CITY_MUSEUM_AXIS, CITY_MUSEUM_DEPTH, CITY_MUSEUM_WIDTH,
} from '../../../../../../packages/shared/city/layout';
import { emit } from '../../bridge';
import {
  CityArch, CityBanner, CityBox, CityCarpet, CityCrest, CityCrystal, CityFloor, CityLantern,
  CityPier, CitySign, CityVault, CityWall, blue, gold, ice, navy, trim,
} from './CityArchitecture';
import { CityCoachStatue, CityFrame, CityTrophyCase } from './CityExhibits';

function CityShirt({ lang }: { lang: CityLanguage }) {
  const shape = useMemo(() => new Shape([
    [-0.4, 0.58], [-0.9, 0.3], [-0.73, -0.03], [-0.46, 0.07], [-0.45, -0.7],
    [0.45, -0.7], [0.46, 0.07], [0.73, -0.03], [0.9, 0.3], [0.4, 0.58], [0.22, 0.66],
    [0.08, 0.51], [-0.08, 0.51], [-0.22, 0.66],
  ].map(([x, y]) => new Vector2(x, y))), []);
  return <group position={[-13.35, 0, -20.25]} rotation={[0, Math.PI / 2, 0]}>
    <CityBox position={[0, 0.42, 0]} size={[2.4, 0.84, 1.28]} color={navy} solid />
    <CityBox position={[0, 2.2, -0.59]} size={[2.38, 2.62, 0.11]} color={navy} />
    <CityBox position={[0, 3.55, 0]} size={[2.41, 0.11, 1.29]} color={gold} metal={0.65} />
    <CityBox position={[0, 3.44, 0]} size={[1.65, 0.05, 0.19]} color={ice} glow={0.95} />
    {[-1, 1].map((side) => <CityBox key={side} position={[side * 1.15, 2.17, 0.59]}
      size={[0.075, 2.7, 0.075]} color={trim} metal={0.7} />)}
    <mesh position={[0, 2.2, 0.03]}>
      <extrudeGeometry args={[shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.06, bevelSegments: 2 }]} />
      <meshStandardMaterial color={blue} roughness={0.74} />
    </mesh>
    <mesh position={[0, 2.17, 0.625]} renderOrder={2}>
      <planeGeometry args={[2.22, 2.68]} />
      <meshPhysicalMaterial color="#b4e2ff" transparent opacity={0.1} depthWrite={false} />
    </mesh>
    <CitySign position={[0, 0.53, 0.67]} width={1.98} height={0.36}
      lines={[lang === 'en' ? 'CITY HOME SHIRT' : 'ÁO SÂN NHÀ CITY']} />
  </group>;
}

function CityTimeline({ lang }: { lang: CityLanguage }) {
  return <group position={[13.56, 0, -11.3]} rotation={[0, -Math.PI / 2, 0]}>
    <CityBox position={[0, 2.53, -0.05]} size={[16.8, 4.4, 0.14]} color={navy} />
    <CityBox position={[0, 1.36, 0.11]} size={[14.8, 0.035, 0.07]} color={ice} glow={1.15} />
    <CitySign position={[0, 4.16, 0.12]} lines={[cityText(lang, CITY_COPY.timeline).toUpperCase()]}
      width={11.4} height={0.61} />
    {cityTimeline.map((entry, i) => {
      const x = -6.2 + i * 2.55;
      return <group key={entry.id}>
        <mesh position={[x, 1.36, 0.16]}>
          <sphereGeometry args={[0.11, 12, 8]} />
          <meshStandardMaterial color="#f8e1aa" emissive="#f2bc56" emissiveIntensity={0.8} />
        </mesh>
        <CityFrame entry={entry} lang={lang} position={[x, 2.66, 0.12]} width={2.25} height={1.52} />
      </group>;
    })}
  </group>;
}

export function CityHeritageHall({ lang }: { lang: CityLanguage }) {
  const width = CITY_MUSEUM_WIDTH, depth = CITY_MUSEUM_DEPTH;
  return <group position={[CITY_MUSEUM.left, 0, CITY_MUSEUM_AXIS]} rotation={[0, -Math.PI / 2, 0]}
    name="city-heritage-hall">
    <CityFloor width={width} depth={depth} />
    <CityVault width={width} depth={depth} spring={5.55} rise={5.35} ribs={[-1.5, -7, -12.4, -17.3, -21.3]} />
    <CityWall position={[0, 0, 0.03]} width={width} height={11.1} yaw={Math.PI}
      gap={{ center: 0, width: CITY_LINK.south - CITY_LINK.north }} gapHeight={5.36} />
    <CityWall position={[0, 0, -depth + 0.02]} width={width} height={11.1} />
    {[-1, 1].map((side) => <CityWall key={side} position={[side * (width / 2 - 0.02), 0, -depth / 2]}
      width={depth} height={5.8} yaw={-side * Math.PI / 2} />)}
    <CityCarpet position={[0, 0.022, -9.95]} width={7.1} depth={19.3} />
    <group position={[0, 0, -0.44]} rotation={[0, Math.PI, 0]}>
      <CityArch position={[0, 0, 0]} radius={3.2} spring={2.23} />
      <CitySign position={[0, 5.54, 0.16]} width={6.82} height={0.77} lines={[cityText(lang, CITY_COPY.hall)]} />
    </group>
    <CityArch position={[0, 0, -21.31]} radius={8.72} spring={0.59} thickness={0.67} />
    <CitySign position={[0, 7.58, -21.18]} width={15.8} height={1.36} maxFontSize={90}
      lines={[cityText(lang, CITY_COPY.museum).toUpperCase(), 'MANCHESTER CITY HERITAGE HALL']} />
    <Suspense fallback={null}><CityCrest size={1.77} position={[0, 9.46, -21.12]} /></Suspense>
    {[-1, 1].map((side) => <group key={side}>
      <CityBanner position={[side * 10.7, 6.39, -21.34]} height={3.15} />
      <CityCrystal position={[side * 12.55, 0, -19.8]} scale={0.93} rotation={side} />
      <CityCrystal position={[side * 12.64, 0, -2.65]} scale={0.79} rotation={side * 2} />
      {[-4.1, -14.95].map((z) => <group key={z}>
        <CityPier position={[side * 13.78, 0, z]} height={5.55} />
        <CityLantern position={[side * 13.07, 4.68, z]} />
      </group>)}
    </group>)}
    <CitySign position={[0, 6.46, -21.22]} width={9.4} height={0.45}
      lines={[cityText(lang, CITY_SECTIONS.managers).toUpperCase()]} />
    {cityManagers.slice(0, 4).map((entry, i) => <CityFrame key={entry.id}
      entry={entry} lang={lang} position={[(i - 1.5) * 3.1, 5.13, -21.15]} width={2.68} height={1.64} />)}
    {cityHonours.map((entry, i) => <CityTrophyCase key={entry.id} x={(i - 2.5) * 2.65}
      index={i} entry={entry} lang={lang} />)}
    <group position={[-9.7, 0, -17.4]} onClick={(event) => {
      if (event.delta < 5) emit('city-exhibit', 'city-guardiola');
    }}>
      <CityBox position={[0, 0.36, 0]} size={[3.25, 0.72, 2.3]} color="#334b68" solid />
      <CityBox position={[0, 0.76, 0]} size={[3.29, 0.12, 2.31]} color={gold} metal={0.61} />
      <CityBox position={[0, 0.86, 0]} size={[2.21, 0.1, 1.57]} color={navy} />
      <CityCoachStatue />
      <CitySign position={[0, 0.53, 1.17]} width={2.92} height={0.36}
        lines={['PEP GUARDIOLA · ' + cityManagers[3].period]} />
      <pointLight position={[-0.55, 4.8, 1.25]} color="#ffcc8d" intensity={48} distance={8} decay={2} />
    </group>
    <CityShirt lang={lang} />
    <CityTimeline lang={lang} />
    <group position={[-13.59, 0, -9.65]} rotation={[0, Math.PI / 2, 0]}>
      <CityBox position={[0, 2.66, 0]} size={[13.15, 3.47, 0.12]} color={navy} />
      <CitySign position={[0, 3.98, 0.08]} width={10.7} height={0.56}
        lines={[cityText(lang, CITY_SECTIONS.legends).toUpperCase()]} />
      {cityLegends.map((entry, i) => <CityFrame key={entry.id} entry={entry} lang={lang}
        position={[(i - 2) * 2.28, 2.56, 0.09]} width={1.86} height={1.71} />)}
    </group>
    <group position={[0, 0, -0.36]} rotation={[0, Math.PI, 0]}>
      {cityMatches.map((entry, i) => <CityFrame key={entry.id} entry={entry} lang={lang}
        position={[-6.8 - i * 2.5, 2.75, 0.08]} width={2.36} height={1.56} />)}
      <CitySign position={[-9.3, 4.08, 0.1]} width={7.25} height={0.47}
        lines={[cityText(lang, CITY_SECTIONS.matches).toUpperCase()]} />
      <CityFrame entry={cityGallery[0]} lang={lang} position={[8.5, 2.82, 0.07]} width={4.4} height={2.2} />
    </group>
    <pointLight position={[0, 5.9, -18.3]} color="#8dcaff" intensity={126} distance={23} decay={2} />
    <pointLight position={[0, 5.35, -7.25]} color="#ffc484" intensity={95} distance={22} decay={2} />
    <pointLight position={[9, 4.7, -11.8]} color="#79bcf8" intensity={62} distance={17} decay={2} />
  </group>;
}
