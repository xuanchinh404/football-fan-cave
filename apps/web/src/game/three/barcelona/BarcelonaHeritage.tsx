import { useEffect, useState } from 'react';
import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import {
  BARCA_COPY,
  BARCA_ERAS,
  BARCA_SECTIONS,
  COACH_PAGE_SIZE,
  PEP_TERM,
  barcaHonours,
  barcaLegends,
  barcaMatches,
  barcaTimeline,
  bt,
  findBarcaTerms,
  termYears,
  type BarcaLanguage,
} from '../../../../../../packages/shared/barcelona/content';
import {
  BARCA_CUP_WALL,
  BARCA_CUP_X,
  BARCA_LINK,
  BARCA_MUSEUM,
  BARCA_STATUE,
} from '../../../../../../packages/shared/barcelona/layout';
import { emit } from '../../bridge';
import { CityCoachStatue, CityCup } from '../city/CityExhibits';
import type { V3 } from '../IndoorKit';
import {
  Banner,
  Block,
  Carpet,
  Crest,
  Crystals,
  Floor,
  Gothic,
  Lantern,
  RoseWindow,
  Sign,
  Vault,
  Wall,
  gold,
  navy,
} from './BarcelonaArchitecture';
import { barcaPhotoUrl } from './barcaPhoto';

const open = (id: string) => emit('barca-exhibit', id);

export function ArchivePhoto({
  id,
  position,
  width,
  height,
}: {
  id: string;
  position: V3;
  width: number;
  height: number;
}) {
  const [loaded, setLoaded] = useState<{ id: string; map: Texture }>();
  useEffect(() => {
    let active = true;
    const map = new TextureLoader().load(
      barcaPhotoUrl(id),
      (texture) => {
        if (!active) return;
        texture.colorSpace = SRGBColorSpace;
        setLoaded({ id, map: texture });
      },
      undefined,
      () => {},
    );
    return () => {
      active = false;
      map.dispose();
    };
  }, [id]);
  return loaded?.id === id ? (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={loaded.map} />
    </mesh>
  ) : null;
}

function Frame({
  position,
  width = 2.55,
  height = 1.55,
  id,
  image,
  label,
  sub,
  selected,
}: {
  position: V3;
  width?: number;
  height?: number;
  id: string;
  image?: string;
  label: string;
  sub?: string;
  selected?: boolean;
}) {
  return (
    <group
      position={position}
      onClick={(event) => {
        if (event.delta < 5) open(id);
      }}
    >
      <Block
        size={[width + 0.13, height + 0.13, 0.1]}
        color={selected ? '#c55a9a' : gold}
        metal={0.55}
        glow={selected ? 0.68 : 0.14}
      />
      <Block position={[0, 0, 0.054]} size={[width, height, 0.026]} color={navy} />
      <Sign position={[0, 0, 0.07]} width={width * 0.9} height={height * 0.77} lines={[label]} />
      {image && <ArchivePhoto id={image} position={[0, 0, 0.245]} width={width} height={height} />}
      <Sign
        position={[0, -height / 2 - 0.25, 0.014]}
        width={width}
        height={0.49}
        lines={sub ? [label, sub] : [label]}
      />
    </group>
  );
}

function CoachWall({ lang }: { lang: BarcaLanguage }) {
  const [era, setEra] = useState(4);
  const [page, setPage] = useState(0);
  const entries = findBarcaTerms(era);
  const count = Math.ceil(entries.length / COACH_PAGE_SIZE);
  const shown = entries.slice(page * COACH_PAGE_SIZE, (page + 1) * COACH_PAGE_SIZE);
  const switchEra = (i: number) => {
    setEra(i);
    setPage(0);
  };
  return (
    <group name="barcelona-coach-wall" position={[0, 0, -23.48]}>
      <Block position={[0, 4.97, -0.14]} size={[23.3, 4.55, 0.27]} color="#251d3f" />
      <Sign
        position={[0, 7.16, 0.03]}
        width={18.8}
        height={1.03}
        lines={[bt(lang, BARCA_COPY.coaches).toUpperCase()]}
      />
      {BARCA_ERAS.map(({ label }, i) => (
        <group
          key={label}
          onClick={(event) => {
            if (event.delta < 5) switchEra(i);
          }}
        >
          <Block
            position={[(i - 2) * 3.33, 6.39, 0.02]}
            size={[3.18, 0.59, 0.19]}
            color={era === i ? '#ee5785' : '#5a4265'}
            glow={era === i ? 0.55 : 0.08}
          />
          <Sign position={[(i - 2) * 3.33, 6.39, 0.14]} width={2.96} height={0.4} lines={[label]} />
        </group>
      ))}
      {shown.map((term, i) => (
        <Frame
          key={term.id}
          position={[(i - (shown.length - 1) / 2) * 2.75, 4.98, 0.19]}
          id={term.id}
          image={term.coach.image ? term.coach.id : undefined}
          width={2.44}
          label={term.coach.name}
          selected={term.current}
          sub={termYears(term, lang) + (term.current ? ' · ' + bt(lang, BARCA_COPY.current) : '')}
        />
      ))}
      <group
        onClick={(event) => {
          if (event.delta < 5) open('coaches');
        }}
      >
        <Sign
          position={[0, 3.46, 0.2]}
          width={6.5}
          height={0.51}
          lines={[bt(lang, BARCA_COPY.all) + ` · ${page + 1}/${count}`]}
        />
      </group>
      {[-1, 1].map((side) => (
        <group
          key={side}
          onClick={(event) => {
            if (event.delta < 5) setPage((prev) => (prev + side + count) % count);
          }}
        >
          <Sign
            position={[side * 10.6, 4.81, 0.18]}
            width={0.98}
            height={0.76}
            lines={[side < 0 ? '◀' : '▶']}
          />
        </group>
      ))}
    </group>
  );
}

function CupRow({ lang }: { lang: BarcaLanguage }) {
  return (
    <group name="barcelona-cup-row">
      {barcaHonours.map((entry, i) => (
        <group
          key={entry.id}
          position={[BARCA_CUP_X[i], 0, BARCA_CUP_WALL]}
          onClick={(event) => {
            if (event.delta < 5) open(entry.id);
          }}
        >
          <Block position={[0, 0.43, 0]} size={[2.36, 0.86, 1.56]} color={navy} solid />
          <Block position={[0, 0.91, 0]} size={[2.37, 0.12, 1.56]} color={gold} metal={0.66} />
          <Block position={[0, 3.08, 0]} size={[2.37, 0.13, 1.56]} color={gold} metal={0.66} />
          <Block
            position={[0, 2.01, -0.73]}
            size={[2.37, 2.12, 0.1]}
            color={i % 2 ? '#401b39' : '#192857'}
            solid
          />
          <Block position={[0, 2.99, 0.09]} size={[2.14, 0.04, 0.46]} color="#ffd386" glow={1.2} />
          {[-1.13, 1.13].flatMap((x) =>
            [-0.72, 0.73].map((z) => (
              <Block
                key={x + ':' + z}
                position={[x, 2.02, z]}
                size={[0.076, 2.15, 0.075]}
                color={gold}
                metal={0.63}
              />
            )),
          )}
          <mesh position={[0, 2.01, 0.766]} renderOrder={2}>
            <planeGeometry args={[2.18, 2.06]} />
            <meshPhysicalMaterial
              color="#d9e3ff"
              transparent
              opacity={0.09}
              depthWrite={false}
              roughness={0.25}
            />
          </mesh>
          {i < 6 ? (
            <CityCup position={[0, 0.99, 0]} index={[0, 2, 3, 1, 5, 4][i]} scale={1.26} />
          ) : (
            <group position={[0, 0.98, 0]}>
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.32, 0.48, 0.28, 12]} />
                <meshStandardMaterial color={gold} metalness={0.73} />
              </mesh>
              <mesh position={[0, 0.67, 0]}>
                <cylinderGeometry args={[0.23, 0.32, 0.88, 8]} />
                <meshStandardMaterial color="#c6daeb" metalness={0.62} />
              </mesh>
              <mesh position={[0, 1.18, 0]}>
                <cylinderGeometry args={[0.57, 0.16, 0.52, 8, 1, true]} />
                <meshStandardMaterial color="#e3edf8" metalness={0.69} side={2} />
              </mesh>
            </group>
          )}
          <Sign
            position={[0, 0.48, 0.797]}
            width={2.19}
            height={0.61}
            lines={[`${entry.seasons?.length} × ${bt(lang, entry.title)}`]}
          />
        </group>
      ))}
    </group>
  );
}

function Timeline({ lang }: { lang: BarcaLanguage }) {
  return (
    <group name="barcelona-history-wall" position={[14.56, 0, -16]} rotation={[0, -Math.PI / 2, 0]}>
      <Block position={[0, 2.87, -0.08]} size={[7.6, 5.52, 0.13]} color="#332744" metal={0.23} />
      <Block position={[0, 2.85, 0]} size={[7.39, 5.32, 0.1]} color={navy} />
      <Sign
        position={[0, 5.25, 0.08]}
        width={7}
        height={0.58}
        lines={[lang === 'vi' ? 'Dấu ấn lịch sử Barcelona' : 'Barcelona Through the Years']}
      />
      <Block position={[-3.11, 2.66, 0.103]} size={[0.045, 4.02, 0.06]} color={gold} glow={0.73} />
      {barcaTimeline.map((entry, i) => {
        const y = 4.65 - i * 0.55;
        return (
          <group
            key={entry.id}
            onClick={(event) => {
              if (event.delta < 5) open(entry.id);
            }}
          >
            <mesh position={[-3.11, y, 0.145]}>
              <sphereGeometry args={[0.1, 10, 8]} />
              <meshStandardMaterial color="#ffe694" emissive="#ffb74f" emissiveIntensity={1.1} />
            </mesh>
            <Sign
              position={[-0.13, y, 0.11]}
              width={5.48}
              height={0.41}
              lines={[`${entry.period}  ·  ${bt(lang, entry.title)}`]}
            />
            {entry.image && (
              <ArchivePhoto id={entry.id} position={[3, y, 0.223]} width={0.69} height={0.43} />
            )}
          </group>
        );
      })}
    </group>
  );
}

export function BarcelonaHeritage({ lang }: { lang: BarcaLanguage }) {
  const w = BARCA_MUSEUM.south - BARCA_MUSEUM.north,
    d = BARCA_MUSEUM.right - BARCA_MUSEUM.left;
  return (
    <group name="barcelona-heritage-hall">
      <Floor position={[0, 0, -d / 2]} width={w} depth={d} museum />
      <Vault center={0} width={w} depth={d} museum />
      <Wall position={[0, 0, -d]} width={w} height={10.75} museum />
      <Wall
        position={[0, 0, 0]}
        width={w}
        height={10.75}
        yaw={Math.PI}
        gap={{ center: 0, width: BARCA_LINK.south - BARCA_LINK.north, height: 5.25 }}
        museum
      />
      <Wall position={[-w / 2, 0, -d / 2]} width={d} height={5.75} yaw={Math.PI / 2} museum />
      <Wall position={[w / 2, 0, -d / 2]} width={d} height={5.75} yaw={-Math.PI / 2} museum />
      <Carpet position={[0, 0.024, -9.7]} width={7.45} depth={18.7} />
      <Crest size={3.35} position={[0, 0.057, -12.8]} flat />
      <Gothic position={[0, 0, -23.45]} span={12.25} spring={5.5} rise={4.7} columns={false} />
      <Crest size={1.25} position={[0, 9.52, -23.23]} />
      <Sign
        position={[0, 8.4, -23.09]}
        width={16.4}
        height={1.46}
        lines={[bt(lang, BARCA_COPY.museum).toUpperCase(), 'FC BARCELONA HERITAGE HALL']}
      />
      <Banner position={[-11.9, 6.65, -23.11]} height={2.8} />
      <Banner position={[11.9, 6.65, -23.11]} height={2.8} />
      <CoachWall lang={lang} />
      <CupRow lang={lang} />
      <group
        name="barcelona-pep-statue"
        position={[BARCA_STATUE.x, 0, BARCA_STATUE.z]}
        onClick={(event) => {
          if (event.delta < 5) open(PEP_TERM.id);
        }}
      >
        <Block
          position={[0, 0.42, 0]}
          size={[BARCA_STATUE.w, 0.84, BARCA_STATUE.d]}
          color="#6f6d80"
          solid
        />
        <Block position={[0, 0.86, 0]} size={[1.99, 0.1, 1.91]} color={gold} metal={0.55} />
        <CityCoachStatue />
        <Sign
          position={[0, 0.47, 0.929]}
          width={1.77}
          height={0.68}
          lines={['PEP GUARDIOLA', '2008–2012']}
        />
      </group>
      <group position={[-14.53, 0, -7.7]} rotation={[0, Math.PI / 2, 0]}>
        <Sign
          position={[0, 4.03, 0.05]}
          width={9.8}
          height={0.63}
          lines={[bt(lang, BARCA_SECTIONS.legends)]}
        />
        {[1, 2, 3, 4].map((i, index) => {
          const entry = barcaLegends[i];
          return (
            <Frame
              key={entry.id}
              position={[(index - 1.5) * 2.43, 2.59, 0.08]}
              width={2.24}
              id={entry.id}
              image={entry.image ? entry.id : undefined}
              label={bt(lang, entry.title)}
            />
          );
        })}
      </group>
      <group position={[14.53, 0, -7.2]} rotation={[0, -Math.PI / 2, 0]}>
        <Sign
          position={[0, 3.77, 0.05]}
          width={7.3}
          height={0.67}
          lines={[bt(lang, BARCA_SECTIONS.matches)]}
        />
        {[0, 4, 5].map((i, index) => (
          <Frame
            key={i}
            position={[(index - 1) * 2.35, 2.48, 0.08]}
            width={2.12}
            id={barcaMatches[i].id}
            image={barcaMatches[i].image ? barcaMatches[i].id : undefined}
            label={bt(lang, barcaMatches[i].title)}
            sub={barcaMatches[i].period}
          />
        ))}
      </group>
      <Timeline lang={lang} />
      {[-1, 1].flatMap((side) =>
        [-3.5, -20.7].map((z) => (
          <group key={side + ':' + z}>
            <Lantern position={[side * 14.34, 3.45, z]} />
            <Crystals position={[side * 14.13, 0, z]} red={side > 0} scale={0.88} />
          </group>
        )),
      )}
      {[-5.2, -12.2, -18.8].map((z) => (
        <group key={z} position={[0, 9.81, z]} rotation={[Math.PI / 2, 0, 0]}>
          <RoseWindow position={[0, 0, 0]} size={1.55} />
        </group>
      ))}
      <pointLight position={[-9.5, 4.4, -12.6]} color="#ffd397" intensity={75} distance={15} />
      <pointLight position={[0, 5.1, -19]} color="#ffd4a0" intensity={125} distance={21} />
      <pointLight position={[10, 4.75, -9.2]} color="#93a5ff" intensity={84} distance={19} />
    </group>
  );
}
