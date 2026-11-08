import { memo } from 'react';
import { BlenderAsset, type Placement } from './BlenderAsset';
import { Box, Label } from './Models';
import { GOLD, InteriorColliders, Plaque } from './IndoorKit';
import { Exhibit } from './Exhibit';
import { TrophyCase } from './MuseumKit';
import { ManagerPortraitBoard } from './ManagerPortraitBoard';
import {
  CannonMedallion,
  CrimsonRug,
  FortressGate,
  FortressLight,
  FortressPiers,
  FortressShell,
  RedStandards,
  WINE,
} from './FortressKit';
import {
  arsenalArchive,
  arsenalHistory,
  arsenalLegends,
  arsenalManagers,
  arsenalMatches,
  arsenalRecords,
  arsenalTribute,
  arsenalTrophies,
} from '../../../../../packages/shared/arsenal/content';
import { HERITAGE_COLUMNS } from '../../../../../packages/shared/arsenal/layout';
import type { Quality } from './GrandHall';

const piers: Placement[] = HERITAGE_COLUMNS.map((p) => ({ position: [p.x, 0, p.z] }));
const coaches = arsenalManagers.map((m, portrait) => ({ ...m, name: m.heading, portrait }));
export const ArsenalMuseum = memo(function ArsenalMuseum({ quality }: { quality: Quality }) {
  return (
    <group name="arsenal-heritage-hall-3d">
      <FortressLight museum shadow={quality !== 'low'} />
      <FortressShell museum>
        <FortressPiers placements={piers} />
      </FortressShell>
      <InteriorColliders map="arsenal-museum" />
      <BlenderAsset
        asset={quality === 'low' ? 'amber-lamp-low' : 'amber-lamp'}
        placements={piers.map(({ position: [x, , z] }) => ({
          position: [x, 0, z + 1.05],
          scale: 0.8,
        }))}
        shadow={false}
      />
      <BlenderAsset
        asset="gunners-ruby"
        placements={[
          { position: [-20, 0, -18], scale: 1.3 },
          { position: [20, 0, -20], scale: 1.45 },
          { position: [-20, 0, 17], scale: 1.5 },
          { position: [20, 0, 18], scale: 1.4 },
        ]}
        shadow={false}
      />
      <CrimsonRug position={[0, 0.038, -0.3]} width={2.7} depth={40} />
      <CannonMedallion position={[0, 0.062, 12.2]} radius={2.6} />
      <BlenderAsset
        asset="gunners-masonry"
        placements={[-19, -14.25, -9.5, -4.75, 0, 4.75, 9.5, 14.25, 19].map((x) => ({
          position: [x, 0, -23.26],
        }))}
        shadow={false}
        cameraSolid
      />
      <RedStandards
        positions={[
          [-18.9, 7.1, -20.6],
          [18.9, 7.1, -20.6],
          [-10.2, 10.15, -22.2],
          [10.2, 10.15, -22.2],
        ]}
      />
      <Plaque
        width={16}
        height={2.2}
        position={[0, 9.0, -20.95]}
        background={WINE}
        lines={['PHÒNG TRUYỀN THỐNG ARSENAL', 'THE GUNNERS HERITAGE HALL']}
      />
      <ManagerPortraitBoard
        atlas="/art/arsenal-manager-portraits.webp"
        stations={coaches}
        y={5.75}
        z={-22.68}
        scale={1.48}
      />
      {arsenalTrophies.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          <Exhibit id={t.id}>
            <TrophyCase
              title={t.title}
              subtitle={
                t.seasons.length +
                ' lần · ' +
                (t.slug === 'shield' ? '1 đồng vô địch' : 'Đội một nam')
              }
              warm
            >
              <BlenderAsset
                asset={`gunners-cup-${t.slug}`}
                placements={[{ position: [0, 0, 0], scale: 1.14 }]}
                shadow={quality !== 'low'}
              />
            </TrophyCase>
          </Exhibit>
        </group>
      ))}
      <group position={[arsenalTribute.x, 0, arsenalTribute.z]}>
        <Exhibit id={arsenalTribute.id}>
          <Box position={[0, 0.75, 0]} size={[3.8, 1.5, 2.7]} color="#613544" />
          <Box position={[0, 1.52, 0]} size={[3.9, 0.16, 2.8]} color={GOLD} />
          <Box position={[0, 2.92, -0.43]} size={[2.55, 2.65, 0.67]} color="#783243" />
          <BlenderAsset
            asset="gunners-emblem"
            placements={[{ position: [0, 2.31, 0.02], scale: 0.64 }]}
            shadow={false}
          />
          <Plaque
            position={[0, 0.89, 1.43]}
            width={3.49}
            height={1.12}
            background={WINE}
            lines={[
              'ARSÈNE WENGER · 1996–2018',
              'Huyền thoại Arsenal',
              'Bệ trưng bày · Tượng đang chờ model',
            ]}
          />
        </Exhibit>
      </group>
      <pointLight position={[-13, 5.2, -11.6]} color="#ffbb72" intensity={70} distance={9} />
      <Plaque
        position={[-18.3, 5.65, -9]}
        width={6}
        height={1.03}
        background={WINE}
        lines={['HUYỀN THOẠI ARSENAL']}
      />
      {arsenalLegends.map((l) => (
        <group key={l.id} position={[l.x, 0, l.z]}>
          <Exhibit id={l.id}>
            <Box position={[0, 0.9, 0]} size={[1.8, 1.8, 1.8]} color="#572335" />
            <Box position={[0, 1.84, 0]} size={[1.88, 0.1, 1.86]} color={GOLD} />
            <BlenderAsset
              asset="gunners-shirt"
              placements={[{ position: [0, 1.94, 0.02], scale: 1.03 }]}
              shadow={false}
            />
            <Label
              text={String(l.number)}
              position={[0, 2.6, 0.15]}
              width={0.38}
              background="#81182d"
            />
            <Plaque
              position={[0, 0.98, 0.97]}
              width={1.68}
              height={0.82}
              background={WINE}
              lines={[l.heading, 'E · Xem hồ sơ']}
            />
          </Exhibit>
        </group>
      ))}
      <Plaque
        position={[18.4, 5.52, -14]}
        width={5.72}
        height={1.15}
        background={WINE}
        lines={['DẤU ẤN LỊCH SỬ', '1886 → 2026']}
      />
      {arsenalHistory.map((h) => (
        <group key={h.id} position={[h.x, 0, h.z]}>
          <Exhibit id={h.id}>
            <Box position={[0, 1.52, 0]} size={[1.65, 3.04, 1.65]} color="#642538" />
            <Box position={[0, 3.06, 0]} size={[1.72, 0.12, 1.74]} color={GOLD} />
            <mesh position={[0, 3.24, 0]}>
              <octahedronGeometry args={[0.18]} />
              <meshStandardMaterial color="#ffb952" emissive="#ff6c22" emissiveIntensity={1.5} />
            </mesh>
            <Plaque
              position={[0, 1.96, 0.91]}
              width={1.57}
              height={1.32}
              background={WINE}
              lines={[h.year, h.title, 'E · Đọc tiếp']}
            />
          </Exhibit>
        </group>
      ))}
      <Plaque
        position={[5.5, 4.28, 8.3]}
        width={6.7}
        height={0.96}
        background={WINE}
        lines={['NHỮNG TRẬN ĐẤU ĐỂ ĐỜI']}
      />
      {arsenalMatches.map((m) => (
        <group key={m.id} position={[m.x, 0, m.z]}>
          <Exhibit id={m.id}>
            <Box position={[0, 1.5, 0]} size={[4.2, 3, 1.4]} color="#4e293b" />
            <Plaque
              position={[0, 1.74, 0.76]}
              width={3.98}
              height={1.75}
              background={WINE}
              lines={[m.heading, m.score, 'E · Tư liệu trận đấu']}
            />
          </Exhibit>
        </group>
      ))}
      {[arsenalArchive, arsenalRecords].map((item) => (
        <group key={item.id} position={[item.x, 0, item.z]}>
          <Exhibit id={item.id}>
            <Box position={[0, 1.45, 0]} size={[2.85, 2.9, 1.15]} color="#613245" />
            <Plaque
              position={[0, 1.81, 0.62]}
              width={2.68}
              height={1.48}
              background={WINE}
              lines={[item.heading, 'E · Xem thông tin']}
            />
          </Exhibit>
        </group>
      ))}
      <FortressGate
        position={[0, 0, 20.4]}
        reverse
        title="VỀ HANG ARSENAL"
        subtitle="Qua cổng để trở lại sảnh"
      />
      <Plaque
        position={[0, 6.91, 19.8]}
        width={6.8}
        height={1.05}
        background={WINE}
        lines={['VỀ HANG ARSENAL']}
      />
    </group>
  );
});
