import { memo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { BlenderAsset, type Placement } from './BlenderAsset';
import { Box, Character } from './Models';
import { AssetModel } from './AssetModel';
import { GOLD, InteriorColliders, Plaque } from './IndoorKit';
import {
  CannonMedallion,
  CrimsonRug,
  FortressGate,
  FortressLight,
  FortressPiers,
  FortressShell,
  RedStandards,
  ScarletDrapes,
  WINE,
} from './FortressKit';
import {
  FORTRESS_PARTITIONS,
  FORTRESS_STAIRS,
  CANNON_PLATFORM,
  STAIR_RAILS,
  FORTRESS_COLUMNS,
  FORTRESS_LOUNGE,
  FORTRESS_CANNONS,
  SCORE_BOARD,
} from '../../../../../packages/shared/arsenal/layout';
import { arsenalDemo } from '../../../../../packages/shared/arsenal/content';
import type { Quality } from './GrandHall';

const columns: Placement[] = FORTRESS_COLUMNS.map((p) => ({ position: [p.x, 0, p.z] }));
const crystals: Placement[] = [
  { position: [-9.1, 0, -10.8], scale: 1.7 },
  { position: [8.15, 0, -12.6], scale: 1.4 },
  { position: [-19, 0, -3], scale: 1.25 },
  { position: [17, 0, -11], scale: 1.2 },
  { position: [-18.2, 0, 13], scale: 1.4 },
  { position: [18, 0, 13], scale: 1.3 },
  { position: [-6, 7.1, -13], scale: 1.4 },
  { position: [6, 7.1, -13], scale: 1.4 },
];
const lamps: Placement[] = [
  ...columns.map(({ position: [x, , z] }) => ({
    position: [x, 0, z + 1.22] as [number, number, number],
    scale: 0.83,
  })),
  { position: [-7.8, 0, -7], scale: 0.9 },
  { position: [7.8, 0, -7], scale: 0.9 },
  { position: [-9.9, 0, 2.5], scale: 0.82 },
  { position: [-16, 0, 8], scale: 0.82 },
];
const corridorLights: Placement[] = [-16, -20, -24].flatMap((z) =>
  [9.4, 14.6].map((x) => ({ position: [x, 0, z], scale: 0.59 })),
);
const tier = [...FORTRESS_STAIRS, CANNON_PLATFORM];
export const ArsenalCave = memo(function ArsenalCave({ quality }: { quality: Quality }) {
  return (
    <group name="arsenal-fortress-cave-3d">
      <FortressLight shadow={quality !== 'low'} />
      <FortressShell>
        <FortressPiers placements={columns} />
      </FortressShell>
      <InteriorColliders map="arsenal" />
      {FORTRESS_PARTITIONS.map((p) => (
        <Box
          key={p.x}
          position={[p.x, p.height / 2, p.z]}
          size={[p.width, p.height, p.depth]}
          color="#5a414f"
        />
      ))}
      <BlenderAsset
        asset="gunners-masonry"
        placements={[
          ...[-18.55, -13.8, -9.05, -4.3, 0.45, 5.2, 18.25].map((x) => ({
            position: [x, 0, -13.71] as [number, number, number],
          })),
        ]}
        shadow={false}
        cameraSolid
      />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[12, 8.8, -21.45]} args={[3.3, 0.22, 6.55]} />
        {tier.map((p) => (
          <CuboidCollider
            key={p.z}
            position={[p.x, p.height / 2, p.z]}
            args={[p.width / 2, p.height / 2, p.depth / 2]}
          />
        ))}
      </RigidBody>
      <Box position={[12, 8.8, -21.45]} size={[6.6, 0.44, 13.1]} color="#322633" />
      <CrimsonRug position={[12, 0.032, -21.05]} width={2.35} depth={12.75} />
      <FortressGate
        position={[12, 0, -14.15]}
        title="PHÒNG TRUYỀN THỐNG"
        subtitle="Theo lối thảm đỏ vào trong"
      />
      <FortressGate position={[0, 0, 17]} reverse title="RA HANG" subtitle="Đại Sảnh Chung" />
      <Plaque
        position={[0, 6.95, 16.25]}
        width={6.5}
        height={1.05}
        lines={['RA HANG · ĐẠI SẢNH CHUNG']}
        background={WINE}
      />
      <BlenderAsset
        asset={quality === 'low' ? 'amber-lamp-low' : 'amber-lamp'}
        placements={[...lamps, ...corridorLights]}
        shadow={false}
      />
      <pointLight position={[12, 4.1, -25.5]} color="#ffc35f" intensity={115} distance={13} />
      {[-16.5, -20.5, -24].map((z, i) => (
        <group key={z} position={[9.02, 3.45, z]} rotation={[0, Math.PI / 2, 0]}>
          <Plaque
            lines={[
              'BIÊN NIÊN SỬ PHÁO THỦ',
              ['Woolwich · 1886', 'Anfield · 1989', 'Highbury · 2004'][i],
            ]}
            width={2.35}
            height={1.15}
            background={WINE}
          />
        </group>
      ))}
      <BlenderAsset
        asset="gunners-arch"
        placements={[
          { position: [0, 0.9, -13.18], scale: 1.08 },
          { position: [-13, 0, 1.65], scale: 0.78 },
        ]}
        cameraSolid
      />
      <Plaque
        position={[0, 10.05, -12.31]}
        width={13}
        height={2.12}
        background={WINE}
        lines={['HANG ARSENAL', 'PHÁO THỦ TRÚ ẨN']}
      />
      <ScarletDrapes position={[0, 8.55, -12.58]} />
      <RedStandards
        positions={[
          [-9.6, 6.55, -13.04],
          [8.1, 6.55, -13.04],
          [-19, 6.2, -3.5],
          [18.8, 6.2, -3.5],
        ]}
      />
      <BlenderAsset asset="gunners-ruby" placements={crystals} shadow={false} />
      <BlenderAsset
        asset="gunners-cannon"
        placements={FORTRESS_CANNONS.map((p) => ({
          position: [p.x, 0, p.z],
          yaw: p.x < 0 ? -0.22 : Math.PI + 0.22,
          scale: 1.05,
        }))}
        cameraSolid
      />
      <Box position={[0, 2.4, -12.2]} size={[3.65, 3, 2.1]} color="#60203b" />
      <Box position={[0, 3.95, -12.2]} size={[3.78, 0.12, 2.22]} color={GOLD} />
      <BlenderAsset
        asset="gunners-emblem"
        placements={[{ position: [0, 4.0, -12.12], scale: 1.46 }]}
        shadow={false}
      />
      <mesh position={[0, 5.32, -12.48]}>
        <torusGeometry args={[2.3, 0.055, 9, 64]} />
        <meshStandardMaterial color="#ff874b" emissive="#f62b22" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 4.5, -10.7]} color="#ff4830" intensity={115} distance={11} />
      {tier.map((p) => (
        <group key={p.z}>
          <Box
            position={[p.x, p.height / 2, p.z]}
            size={[p.width, p.height, p.depth]}
            color="#907383"
          />
          <Box
            position={[p.x, p.height + 0.019, p.z]}
            size={[3.25, 0.03, p.depth + 0.003]}
            color="#991730"
            solid={false}
          />
          <Box
            position={[p.x, p.height + 0.045, p.z + p.depth / 2 - 0.017]}
            size={[3.25, 0.019, 0.037]}
            color={GOLD}
            solid={false}
          />
        </group>
      ))}
      {STAIR_RAILS.map((p) => (
        <group key={p.x}>
          <Box position={[p.x, 0.69, p.z]} size={[p.width, 1.38, p.depth]} color="#64505d" />
          <Box
            position={[p.x, 1.48, p.z]}
            size={[p.width + 0.1, 0.19, p.depth + 0.1]}
            color={GOLD}
          />
          {[-13.7, -10.9, -7.8, -5.15].map((z) => (
            <Box key={z} position={[p.x, 0.86, z]} size={[0.61, 1.72, 0.49]} color="#b08466" />
          ))}
        </group>
      ))}
      <CannonMedallion position={[0, 0.039, 5.3]} />
      <CrimsonRug position={[-13, 0.036, 6.68]} width={7.7} depth={7.9} />
      <BlenderAsset
        asset="gunners-sofa"
        placements={FORTRESS_LOUNGE.slice(0, 2).map((p, i) => ({
          position: [p.x, 0, p.z],
          yaw: i ? Math.PI : 0,
        }))}
        cameraSolid
      />
      <AssetModel asset="fan-table" position={[-13, 0, FORTRESS_LOUNGE[2].z]} scale={[1.06, 0.75, 0.8]} />
      <Plaque
        position={[-13, 6.89, 1.88]}
        width={7.55}
        height={1.35}
        background={WINE}
        lines={['GÓC TÂM SỰ FAN', 'Cà khịa nhẹ · Ngồi xuống nói chuyện']}
      />
      <Plaque
        position={[-13, 3.12, 2.31]}
        width={4.2}
        height={1.6}
        background="#251728"
        lines={['ĐÊM ANFIELD · 1989', 'Thua hôm nay, kể chuyện ngày xưa']}
      />
      <BlenderAsset
        asset="azalea-bed"
        placements={[
          { position: [-18.7, 0, 5], scale: 0.73 },
          { position: [-17.3, 0, 12.5], scale: 0.66 },
          { position: [5.5, 0, 13], scale: 0.67 },
          { position: [-5.5, 0, 13], scale: 0.67 },
        ]}
        shadow={false}
      />
      <group position={[-14.15, 0.63, 4.35]}>
        <Character color="#d52648" name="NPC · Highbury" gesture="Sit" direction={0} />
      </group>
      <group position={[-11.1, 0.6, 9.05]}>
        <Character color="#dc2a42" name="NPC · North Bank" gesture="Facepalm" direction={Math.PI} />
      </group>
      <group position={[-8, 0, 6.8]}>
        <Character color="#d52648" name="NPC · Pháo thủ" gesture="Sad" direction={-0.7} />
      </group>
      <group position={[SCORE_BOARD.x, 0, SCORE_BOARD.z]}>
        <Box position={[0, 1.8, 0]} size={[SCORE_BOARD.width, 3.6, 1.3]} color="#3e252f" />
        <Plaque
          position={[0, 1.93, 0.72]}
          width={4.25}
          height={2.89}
          background="#2a1125"
          lines={[
            'BẢNG TỶ SỐ · DEMO',
            arsenalDemo.home + ' ' + arsenalDemo.score + ' ' + arsenalDemo.away,
            arsenalDemo.caption,
            'E · Xem thông tin',
          ]}
        />
      </group>
    </group>
  );
});
