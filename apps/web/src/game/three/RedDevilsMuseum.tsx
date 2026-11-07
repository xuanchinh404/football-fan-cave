import { ManagerGallery } from './MuseumKit';
import { Suspense, useMemo, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import chibiUrl from '../../../../../public/assets/3d/characters/chibi-red-7.glb?url';
import { AssetBoundary } from './BlenderAsset';
import {
  trophies,
  managers,
  historyTimeline,
  matches,
  legends,
} from '../../../../../packages/shared/museum';
import { Box, Label } from './Models';
import {
  Banner,
  Doorway,
  GOLD,
  IndoorLight,
  IndoorShell,
  InteriorColliders,
  Plaque,
  type V3,
} from './IndoorKit';
import { toScene } from './worldLayout';
import type { Quality } from './GrandHall';

const counts = [
  ['league', '20 · VÔ ĐỊCH ANH'],
  ['europe', '3 · CHÂU ÂU'],
  ['fa', '13 · FA CUP'],
  ['league-cup', '6 · LEAGUE CUP'],
  ['community', '21 · COMMUNITY SHIELD'],
  ['europa', '1 · EUROPA LEAGUE'],
  ['winners', '1 · CUP WINNERS’ CUP'],
  ['super', '1 · UEFA SUPER CUP'],
  ['world', '1 · CLUB WORLD CUP'],
  ['intercontinental', '1 · INTERCONTINENTAL'],
];
export { Exhibit } from './Exhibit';
import { Exhibit } from './Exhibit';

function ChibiStatue() {
  const { scene } = useLoader(GLTFLoader, chibiUrl);
  const { model, scale } = useMemo(() => {
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const model = scene.clone();
    model.position.sub(new Vector3(center.x, bounds.min.y, center.z));
    return { model, scale: Math.min(1.45 / size.y, 1 / size.x, 0.45 / size.z) };
  }, [scene]);
  return (
    <group name="chibi-red-7" scale={scale}>
      <primitive object={model} />
    </group>
  );
}

function Bust({
  shirt = '#aa2037',
  gold = false,
  number = 7,
}: {
  shirt?: string;
  gold?: boolean;
  number?: number;
}) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} scale={[0.65, 0.55, 0.36]} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial
          color={gold ? GOLD : shirt}
          metalness={gold ? 0.7 : 0}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.3, 10]} />
        <meshStandardMaterial color={gold ? GOLD : '#c98e68'} metalness={gold ? 0.7 : 0} />
      </mesh>
      <mesh position={[0, 1.3, 0]} scale={[0.34, 0.42, 0.33]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial
          color={gold ? GOLD : '#d7a17d'}
          metalness={gold ? 0.7 : 0}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 1.55, -0.02]} scale={[0.35, 0.19, 0.33]}>
        <sphereGeometry args={[1, 12, 6]} />
        <meshStandardMaterial color={gold ? '#c58c39' : '#392c2e'} metalness={gold ? 0.7 : 0} />
      </mesh>
      {!gold && (
        <Label text={String(number)} position={[0, 0.48, 0.365]} width={0.6} background={shirt} />
      )}
    </group>
  );
}
function TrophyModel({ asset, group }: { asset: string; group: string }) {
  const silver = !['league', 'world', 'intercontinental'].includes(group);
  const metal = (
    <meshStandardMaterial
      color={silver ? '#d5dce3' : '#f4c35e'}
      metalness={0.88}
      roughness={0.22}
    />
  );
  if (asset === 'shield')
    return (
      <group>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.27, 0.34, 0.2, 10]} />
          {metal}
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
          {metal}
        </mesh>
        <mesh position={[0, 1.05, 0.065]}>
          <torusGeometry args={[0.37, 0.04, 6, 20]} />
          <meshStandardMaterial color={GOLD} metalness={0.7} />
        </mesh>
      </group>
    );
  if (asset === 'globe')
    return (
      <group>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.36, 0.42, 0.34, 8]} />
          {metal}
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.09, 0.23, 0.9, 8]} />
          {metal}
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <icosahedronGeometry args={[0.42, 1]} />
          {metal}
        </mesh>
      </group>
    );
  if (asset === 'spire')
    return (
      <group>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.36, 0.42, 0.32, 8]} />
          {metal}
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.24, 0.12, 1.3, 6]} />
          {metal}
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <coneGeometry args={[0.3, 0.25, 6]} />
          {metal}
        </mesh>
      </group>
    );
  return (
    <group>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.38, 0.43, 0.28, 10]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.24, 0.6, 10]} />
        {metal}
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.47, 0.15, 0.65, 12]} />
        {metal}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.46, 1.13, 0]} scale={[0.75, 1, 1]}>
          <torusGeometry args={[0.3, 0.055, 6, 12]} />
          {metal}
        </mesh>
      ))}
      {asset === 'league' && (
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.46, 0.4, 0.2, 8]} />
          {metal}
        </mesh>
      )}
      {group === 'fa' && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          {metal}
        </mesh>
      )}
    </group>
  );
}
function Display({
  title,
  subtitle,
  width = 1.2,
  children,
}: {
  title: string;
  subtitle: string;
  width?: number;
  children: ReactNode;
}) {
  return (
    <group>
      <Box position={[0, 0.5, -0.25]} size={[width, 1, 0.5]} color="#652d3b" />
      <Box position={[0, 1.02, -0.25]} size={[width + 0.04, 0.08, 0.52]} color={GOLD} />
      <group position={[0, 1.08, -0.25]}>{children}</group>
      <Plaque
        lines={[title, subtitle]}
        width={width * 0.94}
        height={0.55}
        position={[0, 0.58, 0.02]}
      />
      <Box position={[0, 3.23, -0.25]} size={[width, 0.06, 0.5]} color={GOLD} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          position={[s * (width / 2 - 0.03), 2.1, -0.48]}
          size={[0.04, 2.2, 0.04]}
          color={GOLD}
        />
      ))}
      <mesh position={[0, 3.14, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial color="#fff2bc" />
      </mesh>
    </group>
  );
}
export function RedDevilsMuseum({ quality }: { quality: Quality }) {
  return (
    <group name="red-devils-museum">
      <IndoorLight museum shadows={quality !== 'low'} />
      <IndoorShell map="hall-of-legends" museum />
      <InteriorColliders map="hall-of-legends" />
      {/* Long central nave and side aisles: freestanding exhibits can be circled. */}
      <Box position={[0, 0.05, -0.5]} size={[1.15, 0.045, 35.5]} color="#831d36" solid={false} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          position={[s * 0.62, 0.075, -0.5]}
          size={[0.035, 0.02, 35.5]}
          color={GOLD}
          solid={false}
        />
      ))}
      <Plaque
        lines={['PHÒNG HOÀI NIỆM', 'MANCHESTER UNITED', 'Ngày xưa ta đã từng…']}
        width={16}
        height={2.8}
        position={[0, 8, -21.25]}
      />
      <Plaque
        lines={[
          '68 DANH HIỆU ĐỘI MỘT NAM',
          '20 vô địch Anh = 7 First Division + 13 Premier League',
        ]}
        width={14.5}
        height={1.4}
        position={[0, 5.5, -18.9]}
      />
      {[-12, 12].map((x) => (
        <Banner key={x} position={[x, 7, -21.2]} />
      ))}
      {counts.map(([group, title], i) => {
        const x = -16 + (i % 5) * 7.6,
          z = i < 5 ? -7.2 : 6.4;
        const entries = trophies.filter((t) => t.group === group);
        return (
          <group key={group} position={[x, 4.7, z]}>
            <Plaque
              lines={[
                title,
                group === 'league'
                  ? 'First Division + Premier League'
                  : entries.map((t) => String(t.year)).join(' · '),
              ]}
              width={6.4}
              height={1.1}
            />
          </group>
        );
      })}
      {trophies.map((t) => {
        const [x, z] = toScene('hall-of-legends', t);
        const width = t.group === 'league' ? 1.225 : 1.225;
        return (
          <group key={t.id} position={[x, 0, z]}>
            <Exhibit id={t.id}>
              <Display title={t.season} subtitle={t.title} width={width}>
                <group scale={t.group === 'europe' ? 1.08 : 0.95}>
                  <TrophyModel asset={t.asset} group={t.group} />
                </group>
              </Display>
            </Exhibit>
          </group>
        );
      })}
      <Label
        text="CÁC ĐỜI HUẤN LUYỆN VIÊN"
        position={[0, 4.35, -21.3]}
        width={18}
        background="#3e1525"
      />
      <ManagerGallery
        stations={managers.map((m) => {
          const [x, z] = toScene('hall-of-legends', m),
            front = m.y < 590;
          return { ...m, front, position: [x, 0, front ? -21.2 : z] };
        })}
      >
        {(m) => (
          <>
            <Display
              title={m.name}
              subtitle={`${m.start.slice(0, 4)}–${m.end?.slice(0, 4) || 'nay'}${m.current ? ' · HIỆN TẠI' : ''}`}
              width={m.front ? 1.3 : 1.35}
            >
              <group scale={0.85}>
                <Bust
                  shirt={m.current ? '#a11b31' : '#303849'}
                  gold={m.name === 'Sir Alex Ferguson'}
                />
              </group>
            </Display>
            {m.current && (
              <Label text="HIỆN TẠI" position={[0, 3.7, -0.2]} width={1.3} background="#9e192d" />
            )}
          </>
        )}
      </ManagerGallery>
      <Plaque
        lines={['DÒNG THỜI GIAN', '1878 → Hôm nay']}
        width={3.3}
        height={1.4}
        position={[17.5, 5, -15]}
      />
      {historyTimeline.map((h, i) => {
        const [x, z] = toScene('hall-of-legends', h);
        return (
          <group key={h.id} position={[x, 0, z]}>
            <Exhibit id={h.id}>
              <Box
                position={[0, 1.5, -0.625]}
                size={[2.875, 3, 1.25]}
                color={i === 3 ? '#4b343b' : '#632b3c'}
              />
              <Plaque
                lines={[
                  h.period,
                  h.title,
                  ...(i === 3
                    ? ['Tưởng nhớ Munich · 1958', 'Wembley · 1968']
                    : i === 5
                      ? ['Cú ăn ba · 1999', 'Champions League · 2008']
                      : []),
                ]}
                width={2.65}
                height={1.8}
                position={[0, 2, 0.02]}
              />
              <Box position={[0, 3.2, -0.625]} size={[2.875, 0.12, 1.25]} color={GOLD} />
            </Exhibit>
          </group>
        );
      })}
      <group position={[-14.375, 0, -15.75]}>
        <Exhibit id="ferguson-statue">
          <Box position={[0, 0.68, -1.0625]} size={[5, 1.36, 1.375]} color="#40303b" />
          <group position={[0, 1.4, -1.0625]} scale={2.3}>
            <Bust gold />
          </group>
          <Plaque
            lines={['SIR ALEX FERGUSON', '1986–2013 · Một kỷ nguyên']}
            width={4.5}
            height={0.95}
            position={[0, 0.8, -0.35]}
          />
        </Exhibit>
      </group>
      {matches.map((m) => {
        const [x, z] = toScene('hall-of-legends', m);
        return (
          <group key={m.id} position={[x, 0, z]}>
            <Exhibit id={m.id}>
              <Box position={[0, 1.5, -0.625]} size={[2.75, 3, 1.25]} color="#532237" />
              <Plaque
                lines={[
                  m.title,
                  m.id === 'match-1999'
                    ? 'MU 2 – 1 BAYERN'
                    : m.id === 'match-1968'
                      ? 'MU 4 – 1 BENFICA'
                      : 'MU 1 – 1 CHELSEA',
                  'E · Sống lại khoảnh khắc',
                ]}
                width={2.55}
                height={1.75}
                position={[0, 2, 0.02]}
              />
            </Exhibit>
          </group>
        );
      })}
      <group position={[15, 0, 14.375]}>
        <Exhibit id="photo-library">
          <Box position={[0, 1.6, -0.56]} size={[1.75, 3.2, 1.125]} color="#343444" />
          <Plaque
            lines={['THƯ VIỆN ẢNH', 'Kiosk · E khám phá']}
            width={1.65}
            height={1.1}
            position={[0, 2.3, 0.02]}
          />
        </Exhibit>
      </group>
      <Label text="HUYỀN THOẠI QUỶ ĐỎ" position={[8.4, 4, 18.95]} width={16} background="#51172c" />
      {legends.map((l, i) => {
        const [x, z] = toScene('hall-of-legends', l);
        const bust = <Bust number={l.number} shirt={i === 10 ? '#578064' : '#ab2135'} />;
        return (
          <group key={l.id} position={[x, 0, z - 0.52]} rotation={[0, Math.PI, 0]}>
            <Exhibit id={l.id}>
              <Display title={l.name} subtitle={l.years} width={1.225}>
                <group scale={0.9}>
                  {l.name === 'Cristiano Ronaldo' ? (
                    <AssetBoundary asset="chibi-red-7" fallback={bust}>
                      <Suspense fallback={bust}>
                        <ChibiStatue />
                      </Suspense>
                    </AssetBoundary>
                  ) : (
                    bust
                  )}
                </group>
              </Display>
            </Exhibit>
          </group>
        );
      })}
      {[400, 3050].flatMap((x) =>
        [1450, 2900].map((y) => {
          const [cx, cz] = toScene('hall-of-legends', { x, y });
          return (
            <group key={`${x}-${y}`}>
              <Box position={[cx, 4.7, cz]} size={[0.875, 9.4, 0.875]} color="#a68a72" />
              <Box position={[cx, 0.2, cz]} size={[0.875, 0.4, 0.875]} color={GOLD} />
              <Box position={[cx, 8.7, cz]} size={[0.875, 0.3, 0.875]} color={GOLD} />
            </group>
          );
        }),
      )}
      {[-12, -4, 4, 12].map((x) => (
        <mesh key={x} position={[x, 10.5, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.07, 6, 24]} />
          <meshStandardMaterial color={GOLD} emissive="#bc7836" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {quality !== 'low' &&
        [-14, 0, 14].map((x) => (
          <spotLight
            key={x}
            position={[x, 10, -17]}
            target-position={[x, 0, -17]}
            color="#ffddaa"
            intensity={150}
            angle={0.7}
            penumbra={0.6}
            distance={20}
          />
        ))}
      <Doorway
        position={[0, 0, 17.875]}
        rotation={Math.PI}
        title="QUAY VỀ HANG QUỶ ĐỎ"
        subtitle="Cổng trở lại Sảnh Trú Ẩn"
        width={2}
      />
    </group>
  );
}
