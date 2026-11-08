import { CuboidCollider } from '@react-three/rapier';
import {
  KOP_DAIS,
  KOP_SOFA_SPOTS,
  KOP_STAIRS,
  KOP_TABLES,
} from '../../../../../../packages/shared/liverpool/layout';
import { liverpoolDemo } from '../../../../../../packages/shared/liverpool/content';
import type { Quality } from '../GrandHall';
import { LiverpoolTunnel } from './LiverpoolTunnel';
import { Plaque } from '../IndoorKit';
import { Character, Torch } from '../Models';
import { Embers, LiverpoolAsset, LiverpoolLayout, LiverpoolLighting } from './LiverpoolKit';

const origin = [{ position: [0, 0, 0] as [number, number, number] }];
// Match the main hall's vault in tools/blender/liverpool.py with cheap collision panels.
const vaultPanels = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 12;
  const b = ((i + 1) * Math.PI) / 12;
  const x0 = 20.1 * Math.cos(a);
  const x1 = 20.1 * Math.cos(b);
  const y0 = 5.1 + 8.3 * Math.sin(a);
  const y1 = 5.1 + 8.3 * Math.sin(b);
  return {
    x: (x0 + x1) / 2,
    y: (y0 + y1) / 2,
    angle: Math.atan2(y1 - y0, x1 - x0),
    halfWidth: Math.hypot(x1 - x0, y1 - y0) / 2 + 0.05,
  };
});
const standardPositions = [
  { position: [-5.2, 8, -12.93] as [number, number, number] },
  { position: [5.2, 8, -12.93] as [number, number, number] },
];
const birds = [
  { position: [0, 2.36, -11] as [number, number, number], scale: 1.29 },
  ...standardPositions.map(({ position: [x, y, z] }) => ({
    position: [x, y - 2.58, z + 0.13] as [number, number, number],
    scale: 0.44,
  })),
];

export default function LiverpoolCaveScene({ quality }: { quality: Quality }) {
  return (
    <>
      <LiverpoolLighting quality={quality} />
      <group name="liverpool-refuge">
        <LiverpoolLayout map="liverpool">
          {[...KOP_STAIRS, KOP_DAIS].map((p) => (
            <CuboidCollider
              key={p.z}
              args={[p.width / 2, p.height / 2, p.depth / 2]}
              position={[0, p.height / 2, p.z]}
            />
          ))}
          <CuboidCollider args={[3.1, 0.27, 6.85]} position={[12, 6.4, -21.1]} />
          {vaultPanels.map(({ x, y, angle, halfWidth }) => (
            <CuboidCollider
              key={x}
              args={[halfWidth, 0.2, 16.65]}
              position={[x, y, 2.75]}
              rotation={[0, 0, angle]}
            />
          ))}
        </LiverpoolLayout>
        <LiverpoolAsset asset="cave" placements={origin} required />
        <LiverpoolTunnel />
        <group position={[0, 0.068, 4.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <LiverpoolAsset
            asset="bird"
            placements={[{ position: [0, -1.9, 0], scale: [1.45, 1.46, 0.045] }]}
          />
        </group>
        <LiverpoolAsset asset="banner" placements={standardPositions} />
        <LiverpoolAsset asset="bird" placements={birds} shadow={quality !== 'low'} />
        {KOP_SOFA_SPOTS.map(({ x, z, side, plum }) => (
          <LiverpoolAsset
            key={z}
            asset={plum ? 'sofa-plum' : 'sofa'}
            placements={[{ position: [x, 0, z], yaw: side ? Math.PI / 2 : 0 }]}
            shadow={quality !== 'low'}
          />
        ))}
        <LiverpoolAsset
          asset="table"
          placements={KOP_TABLES.map(({ x, z }) => ({ position: [x, 0, z] }))}
        />
        <Plaque
          lines={['HANG LIVERPOOL', 'Hội fan Liverpool trú ẩn sau mỗi trận thua']}
          position={[0, 8.18, -12.94]}
          width={8.5}
          height={2.18}
        />
        <Plaque
          lines={[
            'BẢNG TRẬN ĐẤU · DEMO',
            `${liverpoolDemo.home}  —  ${liverpoolDemo.away}`,
            liverpoolDemo.time,
            liverpoolDemo.message,
          ]}
          position={[0, 5.91, -12.87]}
          width={6.95}
          height={2.55}
          background="#301321"
        />
        <Plaque lines={['SẢNH TRÚ ẨN']} position={[0, 1.82, -10.14]} width={3.7} height={0.6} />
        <Plaque
          lines={['GÓC TÂM SỰ FAN', 'Tụ tập · Phân tích trận đấu']}
          position={[-13, 5.45, -5.55]}
          width={5.42}
          height={1.24}
        />
        <Plaque
          lines={['KHU TRÒ CHUYỆN FAN', 'Lounge · Ngồi xuống và nghỉ một chút']}
          position={[-13, 5.45, 10.9]}
          width={5.58}
          height={1.24}
        />
        <group rotation={[0, Math.PI, 0]} position={[-13, 5.45, 9.69]}>
          <Plaque lines={['LOUNGE FAN']} width={5.45} height={0.89} />
        </group>
        <Plaque
          lines={['LỐI VÀO PHÒNG TRUYỀN THỐNG', 'Đi qua hành lang · Lịch sử & danh hiệu']}
          position={[12, 6.3, -12.56]}
          width={6.88}
          height={1.28}
        />
        <Plaque
          lines={['ANFIELD', 'YOU’LL NEVER WALK ALONE']}
          position={[-13, 3.25, -13.13]}
          width={5.9}
          height={1.75}
        />
        <group position={[-19.47, 2.55, 6.1]} rotation={[0, Math.PI / 2, 0]}>
          <Plaque
            lines={['THE KOP', 'Câu chuyện vẫn còn sau tiếng còi']}
            width={4.25}
            height={1.16}
          />
        </group>
        {[
          ['1892', 'Liverpool FC ra đời'],
          ['1977', 'European Cup đầu tiên'],
          ['2005', 'Đêm Istanbul'],
          ['2019', 'Lần thứ sáu lên ngôi châu Âu'],
        ].map(([year, title], i) => (
          <group
            key={year}
            position={[i % 2 ? 14.48 : 9.53, 2.6, -16.5 - i * 2.5]}
            rotation={[0, i % 2 ? -Math.PI / 2 : Math.PI / 2, 0]}
          >
            <Plaque lines={[year, title]} width={2.1} height={1.28} dark />
          </group>
        ))}
        <Plaque
          lines={['PHÒNG TRUYỀN THỐNG', 'Tiếp tục đi về phía trước']}
          position={[12, 3.42, -27.55]}
          width={4.5}
          height={1.45}
        />
        <group position={[12, 4.8, -15.7]} rotation={[0, Math.PI, 0]}>
          <Plaque lines={['SẢNH TRÚ ẨN']} width={3.5} height={0.72} />
        </group>
        {[-2.85, 2.85].map((x) => (
          <Torch key={x} position={[x, 1.08, -11.6]} />
        ))}
        <group position={[-14.18, 0.19, -11.38]}>
          <Character name="" direction={0} seated hideTemplateCrest />
        </group>
        <group position={[-14.15, 0.19, 2.78]}>
          <Character name="" direction={0} seated hideTemplateCrest />
        </group>
        <group position={[-16.35, 0.19, 6.38]}>
          <Character name="" direction={Math.PI / 2} seated hideTemplateCrest />
        </group>
        <Embers reduced={quality === 'low'} />
      </group>
    </>
  );
}
