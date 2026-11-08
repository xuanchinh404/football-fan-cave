import { IstanbulScreen } from './IstanbulScreen';
import { useEffect, useState } from 'react';
import { on, type WorldState } from '../../bridge';
import {
  LIVERPOOL_MAJOR_TOTAL,
  liverpoolExhibits,
  liverpoolCoaches,
  liverpoolCups,
  liverpoolIstanbul,
  liverpoolLegends,
  liverpoolShield,
  liverpoolStatue,
  liverpoolTimeline,
} from '../../../../../../packages/shared/liverpool/content';
import type { Quality } from '../GrandHall';
import { Exhibit } from '../Exhibit';
import { Plaque } from '../IndoorKit';
import { Box } from '../Models';
import { TrophyCase } from '../MuseumKit';
import { ManagerPortraitBoard } from '../ManagerPortraitBoard';
import { LiverpoolAsset, LiverpoolLayout, LiverpoolLighting } from './LiverpoolKit';

const coaches = liverpoolCoaches.map((e, portrait) => ({ ...e, name: e.heading, portrait }));

const center = [{ position: [0, 0, 0] as [number, number, number] }];
const banners = [-11, 11].map((x) => ({ position: [x, 11, -14.9] as [number, number, number] }));
const bannerBirds = [-11, 11].map((x) => ({
  position: [x, 8.39, -14.76] as [number, number, number],
  scale: 0.43,
}));

function NearbyExhibit() {
  const [id, setId] = useState<string>();
  useEffect(() => on<WorldState>('state', (state) => setId(state.near?.id)), []);
  const exhibit = liverpoolExhibits.find((e) => e.id === id);
  if (!exhibit) return null;
  return (
    <group position={[exhibit.approach.x, 0, exhibit.approach.z]}>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.59, 0.66, 36]} />
        <meshBasicMaterial color="#ffc46e" transparent opacity={0.9} />
      </mesh>
      {exhibit.type === 'trophy' && (
        <pointLight position={[0, 2.75, -0.85]} intensity={18} distance={4} color="#ffcd8f" />
      )}
    </group>
  );
}

export default function LiverpoolMuseumScene({ quality }: { quality: Quality }) {
  const shadow = quality !== 'low';
  return (
    <>
      <LiverpoolLighting museum quality={quality} />
      <group name="liverpool-heritage">
        <LiverpoolLayout map="liverpool-museum" />
        <NearbyExhibit />
        <LiverpoolAsset asset="museum" placements={center} />
        <LiverpoolAsset asset="banner" placements={banners} />
        <LiverpoolAsset asset="bird" placements={bannerBirds} />
        <group position={[0, 0.067, 6.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <LiverpoolAsset
            asset="bird"
            placements={[-2.12, 2.12].flatMap((x) => [
              { position: [x, -0.72, 0], scale: [0.52, 0.57, 0.034] },
              { position: [x, -7.82, 0], scale: [0.52, 0.57, 0.034] },
            ])}
          />
        </group>
        <Plaque
          lines={['PHÒNG TRUYỀN THỐNG LIVERPOOL FC', 'YOU’LL NEVER WALK ALONE']}
          position={[0, 9.05, -15.55]}
          width={17.6}
          height={2.55}
        />
        <Plaque
          lines={[String(LIVERPOOL_MAJOR_TOTAL) + ' DANH HIỆU LỚN', 'Đội nam Liverpool FC']}
          position={[0, 4.8, -4]}
          width={8.6}
          height={1.28}
        />
        <ManagerPortraitBoard
          atlas="/art/liverpool-manager-portraits.webp"
          stations={coaches}
          y={5.42}
          z={-15.39}
          scale={1.29}
        />
        {liverpoolCups.map((e, i) => (
          <group key={e.id} position={[e.x, 0, e.z]}>
            <Exhibit id={e.id}>
              <TrophyCase
                warm
                title={
                  [
                    'Vô địch quốc gia Anh',
                    'European Cup / C1',
                    'FA Cup',
                    'League Cup',
                    'UEFA Cup',
                    'UEFA Super Cup',
                    'FIFA Club World Cup',
                  ][i]
                }
                subtitle={e.seasons.length + ' danh hiệu'}
              >
                <LiverpoolAsset
                  asset={e.id.replace('kop-', 'cup-')}
                  placements={[{ position: [0, 0.19, 0], scale: 1.18 }]}
                />
              </TrophyCase>
            </Exhibit>
          </group>
        ))}
        <group position={[liverpoolShield.x, 0, liverpoolShield.z]}>
          <Exhibit id={liverpoolShield.id}>
            <TrophyCase warm title="Charity / Community Shield" subtitle="16 lần · Trưng bày riêng">
              <LiverpoolAsset
                asset="cup-shield"
                placements={[{ position: [0, 0.24, 0], scale: 1.2 }]}
              />
            </TrophyCase>
          </Exhibit>
        </group>
        <group position={[liverpoolStatue.x, 0, liverpoolStatue.z]}>
          <Exhibit id={liverpoolStatue.id}>
            <LiverpoolAsset
              asset="shankly"
              placements={[{ position: [0, 1.06, 0], scale: 1.1 }]}
              shadow={shadow}
            />
            <Plaque
              lines={['BILL SHANKLY', '1913–1981 · E để khám phá']}
              width={2.78}
              height={0.7}
              position={[0, 0.61, 1.43]}
            />
            <pointLight color="#ffc274" intensity={62} distance={8} position={[-2, 4.9, 3.1]} />
          </Exhibit>
        </group>
        {liverpoolLegends.map((e) => (
          <group key={e.id} position={[e.x, 0, e.z]} rotation={[0, Math.PI / 2, 0]}>
            <Exhibit id={e.id}>
              <Box position={[0, 1.57, -0.53]} size={[2.12, 3.14, 0.19]} color="#b37838" />
              <Box position={[0, 1.61, -0.38]} size={[1.97, 2.98, 0.16]} color="#5f162a" />
              <Box position={[0, 0.38, 0]} size={[2.12, 0.76, 1.52]} color="#471827" />
              <LiverpoolAsset
                asset="shirt"
                placements={[{ position: [0, 0.81, -0.08], scale: 0.91 }]}
              />
              <Plaque
                lines={[e.shirt]}
                width={0.4}
                height={0.38}
                position={[0, 1.57, 0.02]}
                background="#981833"
              />
              <Plaque
                lines={[e.heading, 'Áo lưu niệm · E để xem']}
                width={1.84}
                height={0.55}
                position={[0, 0.53, 0.77]}
              />
            </Exhibit>
          </group>
        ))}
        <group position={[liverpoolIstanbul.x, 0, liverpoolIstanbul.z]}>
          <Exhibit id={liverpoolIstanbul.id}>
            <IstanbulScreen />
            <Plaque
              lines={['E · Khám phá diễn biến trận đấu']}
              position={[0, 2.03, -0.63]}
              width={4.95}
              height={0.46}
            />
            <LiverpoolAsset
              asset="cup-europe"
              placements={[{ position: [0, 0.73, 0.58], scale: 0.71 }]}
            />
            <pointLight color="#ffbe78" intensity={26} distance={6} position={[0, 3.8, 1.4]} />
          </Exhibit>
        </group>
        <Plaque
          lines={['DÒNG THỜI GIAN LỊCH SỬ', 'Từ Anfield 1892 đến hôm nay']}
          position={[0, 5.15, -22.3]}
          width={11.9}
          height={1.42}
        />
        {liverpoolTimeline.map((e) => (
          <group key={e.id} position={[e.x, 0, e.z]}>
            <Exhibit id={e.id}>
              <Box
                position={[0, 0.36, 0]}
                size={[2.95, 0.72, 1.15]}
                color={e.memorial ? '#302d34' : '#64253a'}
              />
              <Box
                position={[0, 1.56, -0.14]}
                size={[2.72, 2.3, 0.42]}
                color={e.memorial ? '#4f4545' : '#a46b38'}
              />
              <Plaque
                lines={[
                  e.year,
                  e.title,
                  e.memorial ? 'Tưởng nhớ các nạn nhân' : 'E · Xem mốc lịch sử',
                ]}
                width={2.52}
                height={1.95}
                position={[0, 1.56, 0.12]}
                background={e.memorial ? '#27232a' : '#4b182a'}
              />
            </Exhibit>
          </group>
        ))}
        <group rotation={[0, Math.PI, 0]} position={[0, 6.1, 19.59]}>
          <Plaque
            lines={['QUAY LẠI HANG LIVERPOOL', 'Đi qua cổng để về hành lang']}
            width={6.6}
            height={1.24}
          />
        </group>
      </group>
    </>
  );
}
