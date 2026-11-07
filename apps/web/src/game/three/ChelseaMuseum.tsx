import { ManagerGallery } from './MuseumKit';
import { useEffect, useState } from 'react';
import { AssetModel } from './AssetModel';
import { Box, Label } from './Models';
import { IndoorLight, InteriorColliders, GOLD } from './IndoorKit';
import {
  BlueArch,
  BlueBanner,
  BlueCase,
  BluePlaque,
  BlueRug,
  ChelseaShell,
  Sapphire,
} from './ChelseaKit';
import { Exhibit } from './Exhibit';
import {
  chelseaTrophies,
  chelseaHistory,
  chelseaLegends,
  chelseaMatches,
  managerGroups,
  chelseaManagers,
} from '../../../../../packages/shared/chelsea/content';
import { on } from '../bridge';
import type { WorldState } from '../bridge';
import { bluesMetres } from '../../../../../packages/shared/chelsea/layout';
import type { Quality } from './GrandHall';
function HistoryMarker({ item }: { item: (typeof chelseaHistory)[number] }) {
  const [near, setNear] = useState(false);
  useEffect(
    () =>
      on<WorldState>('state', (s) => {
        if (s.map === 'chelsea-museum') {
          const p = bluesMetres(s.position);
          setNear(Math.hypot(p.x - item.x, p.z - item.z) < 3.2);
        }
      }),
    [item],
  );
  return (
    <group position={[item.x, 0, item.z]}>
      <Exhibit id={item.id}>
        <Box size={[1.6, 3.4, 2.3]} position={[0, 1.7, 0]} color="#123367" />
        <BluePlaque
          lines={[item.year, item.heading.split(' · ')[1], 'E · Tìm hiểu']}
          width={2.1}
          height={1.7}
          position={[0, 2.05, 1.2]}
        />
        <mesh position={[0, 3.5, 0]}>
          <sphereGeometry args={[0.13, 12, 8]} />
          <meshStandardMaterial
            color="#a9e4ff"
            emissive="#258bff"
            emissiveIntensity={near ? 4 : 1}
          />
        </mesh>
      </Exhibit>
    </group>
  );
}
export function ChelseaMuseum({ quality }: { quality: Quality }) {
  return (
    <group name="chelsea-heritage-hall-3d">
      <IndoorLight blue museum shadows={quality !== 'low'} />
      <ChelseaShell map="chelsea-museum" museum />
      <InteriorColliders map="chelsea-museum" />
      <BlueRug position={[0, 0.045, 0]} width={2.7} depth={39} />
      <BluePlaque
        lines={['PHÒNG TRUYỀN THỐNG', 'CHELSEA · THE BLUES HERITAGE HALL']}
        width={22}
        height={2.4}
        position={[0, 9.6, -22.6]}
      />
      <BluePlaque
        lines={[
          'DANH HIỆU ĐỘI MỘT NAM',
          '12 nhóm trưng bày · Nguồn: Chelsea FC · Đối chiếu 05/11/2026',
        ]}
        width={18}
        height={1.4}
        position={[0, 7.3, -22.6]}
      />
      {[-20, 20].map((x) => (
        <BlueBanner key={x} position={[x, 8, -23.6]} />
      ))}
      {chelseaTrophies.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          <Exhibit id={t.id}>
            <BlueCase
              title={t.title}
              subtitle={`${t.seasons.length} lần · ${t.seasons.join(' · ')}`}
            >
              <AssetModel
                asset={`blues-trophy-${t.asset}`}
                scale={t.asset === 'europe' ? 1 : 1.05}
              />
            </BlueCase>
          </Exhibit>
        </group>
      ))}
      <BluePlaque
        lines={['CÁC ĐỜI HUẤN LUYỆN VIÊN', '1905 → nay · Bao gồm các nhiệm kỳ tạm quyền']}
        position={[0, 5.9, -22.6]}
        width={25}
        height={1.2}
      />
      <ManagerGallery
        stations={managerGroups.map((g, i) => ({ ...g, i, position: [g.x, 0, g.z] }))}
      >
        {({ i, ...g }) => (
          <>
            <Box position={[0, 2, 0]} size={[2.7, 4, 1.2]} color="#102950" />
            <BluePlaque
              lines={[
                i === 9 ? 'HLV HIỆN TẠI' : g.heading,
                ...chelseaManagers.slice(i * 5, i * 5 + 5).map((m) => `${m.name} · ${m.tenure}`),
              ]}
              position={[0, 2.3, 0.64]}
              width={2.55}
              height={3.1}
            />
            <mesh position={[0, 4.2, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.18, 16]} />
              <meshBasicMaterial color={i === 9 ? '#ffd166' : '#92cfff'} />
            </mesh>
          </>
        )}
      </ManagerGallery>
      <group position={[-11, 0, -19]}>
        <Exhibit id="blues-drogba-statue">
          <Box position={[0, 0.8, 0]} size={[4.4, 1.6, 3.2]} color="#223d60" />
          <AssetModel asset="blues-footballer" position={[0, 1.6, 0]} scale={1.05} />
          <BluePlaque
            lines={['DIDIER DROGBA', 'Huyền thoại The Blues', '2004–2012 · 2014–2015']}
            width={4}
            height={1.15}
            position={[0, 0.86, 1.65]}
          />
        </Exhibit>
      </group>
      <BluePlaque
        lines={['HUYỀN THOẠI CHELSEA', 'Đi dọc hành lang phía tây']}
        position={[-18, 6, -13]}
        width={6}
        height={1.2}
      />
      {chelseaLegends.map((l, i) => (
        <group key={l.id} position={[l.x, 0, l.z]}>
          <Exhibit id={l.id}>
            <Box position={[0, 0.8, 0]} size={[1.8, 1.6, 1.8]} color="#13315b" />
            <group position={[0, 1.6, 0]} scale={0.45}>
              <AssetModel asset="blues-footballer" solid={false} />
            </group>
            <BluePlaque
              lines={[l.heading, 'E · Tiểu sử']}
              position={[0, 0.85, 0.94]}
              width={1.7}
              height={0.7}
            />
            <Label
              text={String([8, 26, 11, 1, 10, 25, 3, 4, 7][i])}
              position={[0, 3.5, 0.1]}
              width={0.8}
              background="#123b8c"
            />
          </Exhibit>
        </group>
      ))}
      <BluePlaque
        lines={['DÒNG THỜI GIAN LỊCH SỬ', '1905 → nay · Hành lang phía đông']}
        position={[18, 6, -13]}
        width={6}
        height={1.2}
      />
      {chelseaHistory.map((h) => (
        <HistoryMarker key={h.id} item={h} />
      ))}
      {chelseaMatches.slice(0, 2).map((m) => (
        <group key={m.id} position={[m.x, 0, m.z]}>
          <Exhibit id={m.id}>
            <Box position={[0, 1.6, 0]} size={[5, 3.2, 1.8]} color="#0c2854" />
            <BluePlaque
              lines={[
                m.heading,
                m.id.includes('2012') ? 'BAYERN 1–1 CHELSEA · PEN 3–4' : 'MAN CITY 0–1 CHELSEA',
                'E · Sống lại khoảnh khắc',
              ]}
              position={[0, 2, 0.96]}
              width={4.7}
              height={2}
            />
          </Exhibit>
        </group>
      ))}
      <group position={[19, 0, 19]}>
        <Exhibit id="blues-library">
          <BluePlaque
            lines={['THƯ VIỆN TƯ LIỆU', 'E · Nguồn lịch sử Chelsea FC']}
            width={3}
            height={1.5}
            position={[0, 2, 0]}
          />
        </Exhibit>
      </group>
      <BlueArch
        position={[0, 0, 19.5]}
        width={5}
        title="QUAY VỀ HANG THE BLUES"
        subtitle="Đi qua cổng về Sảnh Trú Ẩn"
        reverse
      />
      <BluePlaque
        lines={['LỐI VỀ HANG THE BLUES', 'Cổng ở phía nam · Tự do vào và ra']}
        position={[0, 7.8, 19]}
        width={8}
        height={1.2}
      />
      {[-16, 16].flatMap((x) =>
        [-11, 8].map((z) => (
          <AssetModel
            key={`${x}-${z}`}
            asset="blues-column"
            position={[x, 0, z]}
            scale={[0.85, 1.2, 0.85]}
          />
        )),
      )}
      {[-20, 20].flatMap((x) =>
        [-21, 0, 18].map((z) => <Sapphire key={`${x}-${z}`} position={[x, 0, z]} scale={1.3} />),
      )}
      {quality !== 'low' &&
        [-12, 0, 12].map((x) => (
          <pointLight key={x} position={[x, 6, -8]} color="#ffddb0" intensity={85} distance={16} />
        ))}
    </group>
  );
}
