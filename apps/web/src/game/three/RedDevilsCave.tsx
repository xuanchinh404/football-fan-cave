import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Box, Character, Label, Torch } from './Models';
import {
  Banner,
  GOLD,
  IndoorLight,
  IndoorShell,
  InteriorColliders,
  Plaque,
  type V3,
} from './IndoorKit';
import { sceneObstacles, toScene } from './worldLayout';
import type { Quality } from './GrandHall';
import { CaveGate, CaveModel, RedDevilsSet } from './RedDevilsSet';

const sighs = [
  'Lại hẹn mùa sau…',
  'Thua thì về đây, có anh em.',
  'Ngày xưa ta đã từng!',
  'Trà nóng, tim nguội.',
];
function CaveRock({ position, scale }: { position: V3; scale: V3 }) {
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={[0.1, position[2] * 1.3, 0.1]}
      castShadow
      receiveShadow
      userData={{ cameraSolid: true }}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={position[2] % 3 > 0.4 ? '#67353f' : '#49303c'}
        roughness={1}
        flatShading
      />
    </mesh>
  );
}
function Sofa({
  position,
  width = 5,
  depth = 1.5,
  rotation = 0,
}: {
  position: V3;
  width?: number;
  depth?: number;
  rotation?: number;
}) {
  return (
    <CaveModel
      asset="sofa"
      placements={[{ position, yaw: rotation, scale: [width / 4, 1, depth / 1.48] }]}
      solid
      shadow
    />
  );
}
function SadFan({ position, i }: { position: V3; i: number }) {
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.x = 0.18 + Math.sin(clock.elapsedTime * 1.3 + i) * 0.07;
  });
  return (
    <group position={position}>
      <group ref={head} rotation={[0.2, 0, 0]}>
        <Character
          name={['Fan mùa sau', 'Quỷ Đỏ lâu năm', 'Hội chờ bình minh', 'Fan lạc quan'][i % 4]}
          gesture="Sit"
          direction={0}
        />
      </group>
      <Label
        text={sighs[i % 4]}
        position={[0, 3.05, 0.1]}
        width={3.3}
        background="#eadac0"
        color="#442636"
      />
    </group>
  );
}
export function RedDevilsCave({ quality }: { quality: Quality }) {
  const solids = sceneObstacles('united');
  const [mx, mz] = toScene('united', { x: 2048, y: 1100 });
  return (
    <group name="red-devils-cave">
      <IndoorLight shadows={quality !== 'low'} />
      <IndoorShell map="united" paving={false} />
      <InteriorColliders map="united" />
      <RedDevilsSet detailed={quality !== 'low'} />
      <Plaque
        lines={['HANG QUỶ ĐỎ', 'Hội fan MU trú ẩn sau mỗi trận thua']}
        width={12}
        height={1.8}
        position={[0, 7.9, -7.4]}
      />
      <Banner position={[-8.2, 6.7, -16]} />
      <Banner position={[8.2, 6.7, -16]} />
      <CaveModel
        asset="plinth"
        placements={[{ position: [solids[0].x, 0, solids[0].z] }]}
        solid
        shadow
      />
      <Plaque
        lines={['SẢNH TRÚ ẨN', 'Tụ tập · Than thở · Động viên']}
        width={4.1}
        height={0.85}
        position={[0, 1.6, -5.48]}
      />
      <Plaque
        lines={[
          'KẾT QUẢ GẦN NHẤT · MINH HỌA',
          'MAN UNITED   0 – 3   MAN CITY',
          'Thua một trận, còn cả hội ở đây.',
        ]}
        width={7.6}
        height={1.8}
        position={[0, 5.6, -7]}
      />
      <pointLight position={[0, 3.5, -6]} color="#ff6447" intensity={85} distance={15} />
      {/* A genuine enclosed branch. Only this passage is visible from the refuge. */}
      {[14, 15].map((i) => {
        const o = solids[i];
        return <Box key={i} position={[o.x, 5, o.z]} size={[o.w, 10, o.d]} color="#6b3039" />;
      })}
      <Box position={[0, 7.4, -11.4]} size={[4.6, 0.5, 5]} color="#422635" />
      <Box
        position={[solids[4].x, 5, solids[4].z]}
        size={[solids[4].w, 10, solids[4].d]}
        color="#38202f"
      />
      <CaveGate
        position={[mx, 0, -9.55]}
        title="LỐI VÀO PHÒNG HOÀI NIỆM"
        subtitle="Đi sâu vào hành lang · E để bước vào"
        width={3.75}
      />
      <CaveModel
        asset="arch"
        placements={[-11.15, -13.45, mz - 1.35].map((z) => ({
          position: [mx, 0, z],
          scale: [0.9, 0.91, 0.38],
        }))}
      />
      {[-10.9, -12.9, -14.5].map((z, i) => (
        <group key={z}>
          <group position={[-1.8, 2.38, z]} rotation={[0, Math.PI / 2, 0]}>
            <Plaque
              lines={[['MUNICH · 1958', 'WEMBLEY · 1968', 'MOSCOW · 2008'][i]]}
              width={1.25}
              height={1.48}
            />
          </group>
          <group position={[1.8, 2.38, z]} rotation={[0, -Math.PI / 2, 0]}>
            <Plaque lines={[['ĐỨNG DẬY', 'VÔ ĐỊCH', 'HOÀI NIỆM'][i]]} width={1.25} height={1.48} />
          </group>
        </group>
      ))}
      <pointLight position={[0, 3, -12]} color="#ffd798" intensity={36} distance={8} />
      <pointLight position={[0, 3, -15]} color="#ff854a" intensity={32} distance={7} />
      {/* Lounge: screen, real sofa volumes, a solid coffee table and seated fans. */}
      <group name="fan-lounge">
        <CaveGate
          position={[-13.8, 0, -3.8]}
          title="GÓC TÂM SỰ FAN"
          subtitle="Trà còn nóng. Anh em cứ kể."
          width={6}
        />
        <Box position={[-14.5, 0.055, -7.7]} size={[10, 0.05, 8]} color="#55273b" solid={false} />
        <Box
          position={[solids[2].x, 2.5, solids[2].z]}
          size={[solids[2].w, 5, solids[2].d]}
          color="#332334"
        />
        <Plaque
          lines={[
            'FAN TV · TRẬN ĐẤU MINH HỌA',
            'MU   0 – 3   CITY',
            'Phân tích thì nhiều, bàn thắng thì ít.',
          ]}
          width={6.8}
          height={3.1}
          position={[solids[2].x, 3.3, -11.35]}
          dark
        />
        <Sofa position={[-15.1, 0, -9.4]} width={6.2} />
        <Sofa position={[-15.1, 0, -6.15]} width={6.2} rotation={Math.PI} />
        <CaveModel
          asset="coffee-table"
          placements={[
            {
              position: [solids[11].x, 0, solids[11].z],
              scale: [solids[11].w / 1.25, 1, solids[11].d / 1.25],
            },
          ]}
          solid
          shadow
        />
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[-15.1 + i * 0.65, 0.78, -8.05]}>
            <cylinderGeometry args={[0.12, 0.1, 0.3, 10]} />
            <meshStandardMaterial color="#f2d3a1" />
          </mesh>
        ))}
        <SadFan position={[-16.9, 0.45, -9.05]} i={0} />
        <SadFan position={[-14, 0.45, -9.05]} i={1} />
        <pointLight position={[-15, 4, -8]} color="#ffc486" intensity={95} distance={14} />
      </group>
      <Sofa position={[solids[5].x, 0, solids[5].z]} width={solids[5].w} depth={solids[5].d} />
      <Plaque
        lines={['KHU TRÒ CHUYỆN FAN', 'Lounge · Giao lưu nhẹ']}
        position={[-16.3, 3.3, -2.3]}
        width={6.25}
        height={0.9}
      />
      <SadFan position={[solids[5].x - 0.7, 0.65, solids[5].z + 0.3]} i={2} />
      <Sofa position={[solids[6].x, 0, solids[6].z]} width={solids[6].w} depth={solids[6].d} />
      <SadFan position={[solids[6].x, 0.65, solids[6].z + 0.3]} i={3} />
      <group position={[solids[1].x, 0, solids[1].z]}>
        <Box position={[0, 0.8, 0]} size={[solids[1].w, 1.6, solids[1].d]} color="#6c303b" />
        <Box
          position={[0, 1.7, 0]}
          size={[solids[1].w + 0.1, 0.2, solids[1].d + 0.1]}
          color={GOLD}
        />
        <Plaque
          lines={['QUẦY CÀ KHỊA', 'Một chút muối, nhiều tình anh em']}
          width={6}
          height={1.4}
          position={[0, 4, 0]}
        />
        <Torch position={[-3, 1, 0]} />
        <Torch position={[3, 1, 0]} />
      </group>
      <Plaque
        lines={['NỘI QUY TRÚ ẨN', 'Cà khịa vừa đủ. Động viên thật nhiều.']}
        width={solids[3].w}
        height={1.2}
        position={[solids[3].x, 2, solids[3].z + 0.63]}
      />
      <Box
        position={[solids[3].x, 0.8, solids[3].z]}
        size={[solids[3].w, 1.6, solids[3].d]}
        color="#4a2c36"
      />
      {[7, 8, 9, 10].map((i) => {
        const o = solids[i];
        return <CaveRock key={i} position={[o.x, 4, o.z]} scale={[o.w / 2, 5, o.d / 2]} />;
      })}
      {[16, 17].map((i) => {
        const o = solids[i];
        return (
          <group key={i}>
            <Box position={[o.x, 4, o.z]} size={[o.w, 8, o.d]} color="#69363c" />
            <Torch position={[o.x, 2, o.z + 0.6]} />
          </group>
        );
      })}
      <CaveGate
        position={[0, 0, 7.15]}
        rotation={Math.PI}
        title="CỔNG RA HANG"
        subtitle="Trở lại Đại Sảnh Chung"
        width={4}
      />
    </group>
  );
}
