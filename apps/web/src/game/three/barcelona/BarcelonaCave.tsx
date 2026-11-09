import { Shape, Vector2 } from 'three';
import { Suspense } from 'react';
import { CuboidCollider, RigidBody, TrimeshCollider } from '@react-three/rapier';
import {
  BARCA_AXIS,
  BARCA_BLOCKS,
  BARCA_HALL,
  BARCA_LINK,
  BARCA_MUSEUM,
  BARCA_SOFA,
  BARCA_STAIR,
  BARCA_STAIR_SIDES,
  BARCA_TABLE,
} from '../../../../../../packages/shared/barcelona/layout';
import {
  BARCA_COPY,
  barcaLegends,
  barcaKickoff,
  barcaMatchStatus,
  bt,
  type BarcaLanguage,
} from '../../../../../../packages/shared/barcelona/content';
import { CORRIDOR_HALF_WIDTH } from '../../../../../../packages/shared/grandHall';
import { emit } from '../../bridge';
import { AssetModel } from '../AssetModel';
import { CityCup } from '../city/CityExhibits';
import {
  Banner,
  Block,
  Carpet,
  Crest,
  Crystals,
  Floor,
  Gothic,
  Lantern,
  Planter,
  RoseWindow,
  Sign,
  Vault,
  Wall,
  blue,
  gold,
  navy,
  wine,
} from './BarcelonaArchitecture';
import { ArchivePhoto, BarcelonaHeritage } from './BarcelonaHeritage';
import { useBarcaLanguage } from './useBarcaLanguage';
import { useBarcaMatch } from './useBarcaMatch';

const { width, foot, landing, rise, steps } = BARCA_STAIR;
const back = BARCA_HALL.north;
const vertices = new Float32Array([
  -width / 2,
  0,
  foot,
  width / 2,
  0,
  foot,
  -width / 2,
  rise,
  landing,
  width / 2,
  rise,
  landing,
  -width / 2,
  0,
  landing,
  width / 2,
  0,
  landing,
]);
const faces = new Uint32Array([0, 1, 2, 1, 3, 2, 0, 2, 4, 1, 5, 3, 2, 3, 5, 2, 5, 4]);

function Stair() {
  const run = (foot - landing) / steps;
  return (
    <group name="barcelona-central-stair">
      <TrimeshCollider args={[vertices, faces]} />
      <CuboidCollider
        args={[width / 2, rise / 2, (landing - back) / 2]}
        position={[0, rise / 2, (landing + back) / 2]}
      />
      <Block
        position={[0, rise / 2, (landing + back) / 2]}
        size={[width, rise, landing - back]}
        color={navy}
        solid
      />
      {Array.from({ length: steps }, (_, i) => {
        const height = (rise * (i + 1)) / steps,
          z = foot - run * (i + 0.5);
        return (
          <group key={i}>
            <Block
              position={[0, height / 2, z]}
              size={[width, height, run + 0.015]}
              color={i % 2 ? '#424875' : '#333861'}
              solid
            />
            <Block
              position={[0, height - 0.023, z + run / 2]}
              size={[width, 0.043, 0.055]}
              color={gold}
              metal={0.42}
            />
            {[-1, 1].map((side) => (
              <Block
                key={side}
                position={[side * (width / 2 - 0.39), height + 0.01, z]}
                size={[0.32, 0.026, run * 0.76]}
                color="#ffc177"
                glow={0.8}
              />
            ))}
          </group>
        );
      })}
      {BARCA_STAIR_SIDES.map(({ x }) => (
        <group key={x}>
          <Block
            position={[x, 0.68 + rise / 2, (foot + landing) / 2]}
            rotation={[Math.atan2(rise, foot - landing), 0, 0]}
            size={[0.18, 0.12, Math.hypot(rise, foot - landing)]}
            color={gold}
            metal={0.52}
            solid
          />
          <Block
            position={[x, 0.68 + rise, (landing + back) / 2]}
            size={[0.18, 0.12, landing - back]}
            color={gold}
            metal={0.52}
            solid
          />
          {[foot, (foot + landing) / 2, landing, (landing + back) / 2].map((z) => {
            const y = Math.min(rise, (rise * (foot - z)) / (foot - landing));
            return (
              <Block
                key={z}
                position={[x, y + 0.34, z - 0.04]}
                size={[0.18, 0.68, 0.19]}
                color="#513f52"
                solid
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}

function Laurels() {
  return (
    <group position={[0, 8.3, -26.94]}>
      {[-1, 1].flatMap((side) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={side + ':' + i}
            position={[side * (1.14 + Math.sin(i * 0.32) * 0.84), -0.56 + i * 0.21, 0]}
            rotation={[0, 0, side * (0.9 - i * 0.12)]}
            scale={[0.115, 0.32, 0.06]}
          >
            <sphereGeometry args={[1, 8, 5]} />
            <meshStandardMaterial color="#ffcb58" metalness={0.47} roughness={0.27} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Centrepiece({ lang }: { lang: BarcaLanguage }) {
  const match = useBarcaMatch();
  return (
    <>
      <Stair />
      <Carpet position={[0, 0.023, -9.1]} width={7.8} depth={15} />
      <Crest size={3.9} position={[0, 0.059, -8.6]} flat />
      <Gothic position={[0, 0, -27.15]} span={5.45} spring={4.1} rise={4.45} />
      <Block position={[0, 2.88, -27.57]} size={[8.6, 4, 0.19]} color={navy} />
      <group position={[0, 3.35, -27.37]}>
        <mesh>
          <circleGeometry args={[1.58, 52]} />
          <meshStandardMaterial color="#24236a" emissive="#372173" emissiveIntensity={0.7} />
        </mesh>
        {[1.62, 1.78].map((radius, i) => (
          <mesh key={radius} position={[0, 0, 0.013]}>
            <torusGeometry args={[radius, 0.04, 6, 52]} />
            <meshStandardMaterial
              color={i ? '#ff3878' : '#55a8ff'}
              emissive={i ? '#ff2760' : '#367cff'}
              emissiveIntensity={1.5}
            />
          </mesh>
        ))}
        <Crest size={2.3} position={[0, 0, 0.08]} />
      </group>
      <group
        onClick={(event) => {
          if (event.delta < 5) emit('barca-board', false);
        }}
      >
        <Sign
          position={[0, 5.5, -26.94]}
          width={8.4}
          height={1.26}
          lines={[
            bt(lang, BARCA_COPY.score),
            match
              ? `${match.home}  ${match.homeScore}–${match.awayScore}  ${match.away}`
              : bt(lang, BARCA_COPY.pending),
            ...(match ? [`${barcaMatchStatus(match, lang)} · ${barcaKickoff(match, lang)}`] : []),
          ]}
        />
      </group>
      <Sign
        position={[0, 6.98, -26.73]}
        width={10.3}
        height={1.64}
        lines={[bt(lang, BARCA_COPY.cave), bt(lang, BARCA_COPY.subtitle)]}
      />
      <Laurels />
      <Crest size={2.33} position={[0, 8.48, -26.56]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Banner position={[side * 6.97, 6.35, -27.1]} />
          <Block
            position={[side * 4.78, 6.52, -26.72]}
            size={[1.7, 0.37, 1.02]}
            color={gold}
            metal={0.57}
          />
          <Suspense fallback={null}>
            <AssetModel
              asset="blues-lion"
              position={[side * 4.78, 6.72, -26.66]}
              rotation={[0, -side * 0.6, 0]}
              scale={0.84}
              solid={false}
            />
          </Suspense>
          <Lantern position={[side * 5.55, 3.45, -26.57]} />
          <Block
            position={[side * 5.45, 0.5, -25.1]}
            size={[1.46, 1, 1.43]}
            color={navy}
            metal={0.42}
          />
          <CityCup position={[side * 5.45, 1.08, -25.1]} index={side === 1 ? 5 : 3} scale={1.18} />
        </group>
      ))}
    </>
  );
}

const shirtShape = new Shape(
  [
    [-0.26, 0.54],
    [-0.62, 0.34],
    [-0.5, 0.02],
    [-0.3, 0.12],
    [-0.28, -0.58],
    [0.28, -0.58],
    [0.3, 0.12],
    [0.5, 0.02],
    [0.62, 0.34],
    [0.26, 0.54],
    [0, 0.41],
  ].map(([x, y]) => new Vector2(x, y)),
);

function Lounge({ lang }: { lang: BarcaLanguage }) {
  const { x, z, w, d } = BARCA_SOFA;
  return (
    <group name="barcelona-fan-lounge">
      <mesh position={[-6.7, 0.029, -21]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.8, 1, 1]}>
        <circleGeometry args={[4.58, 48]} />
        <meshStandardMaterial color={wine} roughness={1} />
      </mesh>
      <mesh position={[-6.7, 0.031, -21]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.8, 1, 1]}>
        <ringGeometry args={[4.26, 4.38, 48]} />
        <meshStandardMaterial color={gold} roughness={0.83} />
      </mesh>
      <Gothic position={[-6.85, 0, -26.55]} span={3.16} spring={2.63} rise={2.1} />
      <Sign
        position={[-6.85, 4.48, -26.23]}
        width={5.92}
        height={0.88}
        lines={[bt(lang, BARCA_COPY.lounge)]}
      />
      <group
        onClick={(event) => {
          if (event.delta < 5) emit('barca-board', true);
        }}
      >
        <Block position={[-6.85, 2.58, -26.43]} size={[4.2, 2.14, 0.19]} color="#1a1727" />
        <Sign
          position={[-6.85, 2.58, -26.28]}
          width={3.98}
          height={1.86}
          lines={['BARÇA TV', bt(lang, BARCA_COPY.news)]}
        />
      </group>
      <Block position={[-6.85, 0.62, -26.75]} size={[6.6, 1.24, 0.8]} color="#402232" solid />
      <Block
        position={[-6.85, 1.27, -26.75]}
        size={[6.66, 0.075, 0.86]}
        color={gold}
        metal={0.55}
      />
      <Banner position={[-9.55, 2.48, -26.55]} width={0.9} height={1.65} />
      <group position={[-4.1, 2.52, -26.38]}>
        <Block size={[1.25, 1.52, 0.09]} color={gold} metal={0.45} />
        <Block position={[0, 0, 0.052]} size={[1.12, 1.4, 0.032]} color={navy} />
        <mesh position={[0, 0.08, 0.081]} scale={0.77}>
          <extrudeGeometry args={[shirtShape, { depth: 0.06, bevelEnabled: false }]} />
          <meshStandardMaterial color={blue} />
        </mesh>
        <Block position={[0, 0.04, 0.135]} size={[0.17, 0.7, 0.03]} color={wine} />
        <Sign position={[0, -0.03, 0.095]} width={0.49} height={0.42} lines={['MESSI', '10']} />
      </group>
      <group position={[-9.8, 2.64, -25.28]} rotation={[0, Math.PI / 4, 0]}>
        <Sign position={[0, 0, 0]} width={1.19} height={1.02} lines={['Johan Cruyff']} />
        <ArchivePhoto
          id={barcaLegends.find((legend) => legend.title[0] === 'Johan Cruyff')!.id}
          position={[0, 0, 0.117]}
          width={1.05}
          height={0.84}
        />
      </group>
      <group position={[x, 0, z]}>
        <Block position={[0, 0.28, 0]} size={[w, 0.55, d]} color="#57162e" solid />
        <Block position={[0, 0.77, 0.49]} size={[w, 0.77, 0.32]} color={wine} solid />
        {[-w / 2 + 0.25, w / 2 - 0.25].map((side) => (
          <Block key={side} position={[side, 0.58, 0]} size={[0.49, 0.52, d]} color={wine} />
        ))}
        {[-2.1, -0.7, 0.7, 2.1].map((offset) => (
          <group key={offset} position={[offset, 0, 0]}>
            <Block position={[0, 0.52, -0.11]} size={[1.34, 0.13, 0.99]} color="#a8375b" />
            <Block
              position={[0, 0.82, 0.278]}
              size={[0.48, 0.49, 0.15]}
              rotation={[-0.18, 0, 0.24]}
              color={blue}
            />
            <Block
              position={[0, 0.82, 0.197]}
              size={[0.16, 0.46, 0.033]}
              rotation={[-0.18, 0, 0.24]}
              color={wine}
            />
          </group>
        ))}
      </group>
      <group position={[BARCA_TABLE.x, 0, BARCA_TABLE.z]}>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.31, 0.55, 0.54, 24]} />
          <meshStandardMaterial color={gold} metalness={0.61} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.61, 0]} userData={{ cameraSolid: true }}>
          <cylinderGeometry args={[0.92, 0.92, 0.12, 36]} />
          <meshStandardMaterial color="#b78450" metalness={0.38} roughness={0.36} />
        </mesh>
        <mesh position={[0.17, 0.85, 0.04]}>
          <icosahedronGeometry args={[0.18, 1]} />
          <meshStandardMaterial color="#f8e7d0" flatShading />
        </mesh>
        {[-0.37, 0.48].map((side) => (
          <mesh key={side} position={[side, 0.76, 0.23]}>
            <cylinderGeometry args={[0.11, 0.091, 0.18, 12]} />
            <meshStandardMaterial color={side < 0 ? wine : blue} />
          </mesh>
        ))}
      </group>
      <Planter position={[-10.2, 0, -24]} />
      <Lantern position={[-9.9, 3.15, -25.92]} />
      <pointLight position={[-7.2, 4.4, -21.9]} color="#ffb86e" intensity={49} distance={13} />
    </group>
  );
}

function MainHall({ lang }: { lang: BarcaLanguage }) {
  const { left, right, north } = BARCA_HALL;
  const center = (left + right) / 2,
    w = right - left,
    d = -north;
  const gap = {
    center: BARCA_AXIS + d / 2,
    width: BARCA_LINK.south - BARCA_LINK.north,
    height: 5.25,
  };
  return (
    <group name="barcelona-refuge-hall">
      <Floor position={[center, 0, -d / 2]} width={w} depth={d} />
      <Vault center={center} width={w} depth={d} />
      <Wall position={[center, 0, north]} width={w} height={11.5} />
      <Wall
        position={[center, 0, 0.17]}
        yaw={Math.PI}
        width={w}
        height={11.5}
        gap={{ center, width: CORRIDOR_HALF_WIDTH * 2, height: 4.85 }}
      />
      <Wall position={[left, 0, -d / 2]} yaw={Math.PI / 2} width={d} height={5.75} />
      <Wall position={[right, 0, -d / 2]} yaw={-Math.PI / 2} width={d} height={5.75} gap={gap} />
      <group position={[right - 0.37, 0, BARCA_AXIS]} rotation={[0, -Math.PI / 2, 0]}>
        <Gothic position={[0, 0, 0]} span={3.32} spring={2.6} rise={2.34} />
        <Sign
          position={[0, 5.47, 0.36]}
          width={7.7}
          height={0.83}
          lines={[bt(lang, BARCA_COPY.museum)]}
        />
        <Lantern position={[-4.1, 3.18, 0.55]} />
        <Lantern position={[4.1, 3.18, 0.55]} />
      </group>
      <group position={[0, 0, -0.44]} rotation={[0, Math.PI, 0]}>
        <Gothic position={[0, 0, 0]} span={3.21} spring={2.62} rise={1.85} />
        <Sign
          position={[0, 5.01, 0.32]}
          width={6.1}
          height={0.73}
          lines={[bt(lang, BARCA_COPY.tunnel)]}
        />
      </group>
      {[left + 0.76, right - 0.76].flatMap((x, i) =>
        [-4, -8.5, -22.7].map((z, j) => (
          <group key={x + ':' + z}>
            <Crystals position={[x, 0, z]} red={(i + j) % 2 === 1} />
            <Lantern position={[x, 3.35, z + 1.1]} />
            <Planter position={[x, 0, z - 1.35]} />
          </group>
        )),
      )}
      <group position={[11.7, 0, -27.48]}>
        <Gothic position={[0, 0, 0]} span={4.1} spring={3.1} rise={4.1} />
        <RoseWindow position={[0, 5.15, 0.31]} size={3.37} />
        <Sign
          position={[0, 2.94, 0.52]}
          width={6.65}
          height={0.69}
          lines={[`${bt(lang, BARCA_COPY.museum)}  →`]}
        />
        <Banner position={[-2.45, 3.22, 0.29]} width={1.5} height={3.67} />
        <Banner position={[2.45, 3.22, 0.29]} width={1.5} height={3.67} />
        <Crystals position={[-0.75, 0, 0.65]} scale={1.32} />
        <Crystals position={[0.76, 0, 0.78]} red />
      </group>
      <Centrepiece lang={lang} />
      <Lounge lang={lang} />
      <pointLight position={[0, 5.7, -23]} color="#7b9cff" intensity={102} distance={19} />
      <pointLight position={[8, 5, -9]} color="#ffb877" intensity={92} distance={22} />
      <pointLight position={[14.1, 3.8, -15]} color="#f5a46f" intensity={55} distance={14} />
    </group>
  );
}

function Passage() {
  const w = BARCA_LINK.south - BARCA_LINK.north,
    d = BARCA_LINK.right - BARCA_LINK.left;
  return (
    <group position={[BARCA_LINK.left, 0, BARCA_AXIS]} rotation={[0, -Math.PI / 2, 0]}>
      <Floor position={[0, 0, -d / 2]} width={w} depth={d} />
      <Wall position={[-w / 2, 0, -d / 2]} yaw={Math.PI / 2} width={d} height={5.2} museum />
      <Wall position={[w / 2, 0, -d / 2]} yaw={-Math.PI / 2} width={d} height={5.2} museum />
      <Block position={[0, 5.24, -d / 2]} size={[w, 0.26, d]} color={navy} solid />
      <Gothic position={[0, 0, -d / 2]} span={3.08} spring={2.26} rise={2.4} />
      <Carpet position={[0, 0.024, -d / 2]} width={4.65} depth={d} />
      <Lantern position={[-3.01, 3, -d / 2]} />
      <Lantern position={[3.01, 3, -d / 2]} />
    </group>
  );
}

export default function BarcelonaCave() {
  const lang = useBarcaLanguage();
  return (
    <RigidBody type="fixed" colliders={false}>
      <Suspense fallback={null}>
        <MainHall lang={lang} />
        <Passage />
        <group position={[BARCA_MUSEUM.left, 0, BARCA_AXIS]} rotation={[0, -Math.PI / 2, 0]}>
          <BarcelonaHeritage lang={lang} />
        </group>
      </Suspense>
      {BARCA_BLOCKS.map(({ x, z, w, d, h }) => (
        <CuboidCollider key={x + ':' + z} position={[x, h / 2, z]} args={[w / 2, h / 2, d / 2]} />
      ))}
    </RigidBody>
  );
}
