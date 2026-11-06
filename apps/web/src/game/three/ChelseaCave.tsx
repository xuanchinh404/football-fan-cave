import { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Character, Label } from './Models';
import { AssetModel } from './AssetModel';
import { IndoorLight, InteriorColliders, GOLD } from './IndoorKit';
import { BlueArch, BlueBanner, BluePlaque, BlueRug, ChelseaShell, Sapphire } from './ChelseaKit';
import { chelseaMatchState } from '../../../../../packages/shared/chelsea/content';
import type { Quality } from './GrandHall';
export function ChelseaCave({ quality }: { quality: Quality }) {
  const match = chelseaMatchState;
  const facade = useMemo(() => {
    const a: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    for (let x = -17; x <= 5.5; x += 2.3)
      for (let y = 1; y < 12; y += 2.3) {
        o.position.set(x, y, -10);
        o.rotation.set(x * 0.05, y * 0.6, Math.sin(x) * 0.15);
        o.scale.set(1.6, 1.7, 1.2);
        o.updateMatrix();
        a.push(o.matrix.clone());
      }
    return a;
  }, []);
  return (
    <group name="chelsea-refuge-3d">
      <IndoorLight blue shadows={quality !== 'low'} />
      <ChelseaShell map="chelsea" />
      <InteriorColliders map="chelsea" />
      {/* Opaque masonry separates the refuge from the long eastern museum passage. */}
      <instancedMesh
        args={[undefined, undefined, facade.length]}
        castShadow
        receiveShadow
        userData={{ cameraSolid: true }}
        ref={(r) => {
          if (r) {
            facade.forEach((m, i) => r.setMatrixAt(i, m));
            r.instanceMatrix.needsUpdate = true;
          }
        }}
      >
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#29466e" roughness={0.85} />
      </instancedMesh>
      <Box position={[-5.6, 5.5, -10]} size={[24.8, 11, 1]} color="#233f67" />
      <Box position={[15.6, 5.5, -10]} size={[4.8, 11, 1]} color="#233f67" />
      {[6.8, 13.2].map((x) => (
        <Box key={x} position={[x, 4, -16.3]} size={[0.8, 8, 12]} color="#1a345a" />
      ))}
      <Box position={[10, 8.2, -16.3]} size={[6.4, 0.4, 12.8]} color="#0a1e3b" />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.8, 0.3, 6.5]} position={[10, 0.3, -16.5]} />
        {[0, 1, 2, 3].map((i) => (
          <CuboidCollider
            key={i}
            args={[2.8, (i + 1) * 0.075, 0.1875]}
            position={[10, (i + 1) * 0.075, -8.6875 - i * 0.375]}
          />
        ))}
      </RigidBody>
      <Box position={[10, 0.3, -16.5]} size={[5.6, 0.6, 13]} color="#304f79" />
      {[0, 1, 2, 3].map((i) => (
        <group key={i}>
          <Box
            position={[10, (i + 1) * 0.075, -8.6875 - i * 0.375]}
            size={[5.6, (i + 1) * 0.15, 0.375]}
            color="#6b89af"
          />
          <Box
            position={[10, (i + 1) * 0.15 + 0.01, -8.5 - i * 0.375]}
            size={[5.6, 0.02, 0.04]}
            color={GOLD}
            solid={false}
          />
        </group>
      ))}
      <BlueRug position={[10, 0.63, -16]} width={2.2} depth={12} />
      <BlueArch
        position={[10, 0, -9.3]}
        width={5}
        title="PHÒNG TRUYỀN THỐNG"
        subtitle="Lối vào · Lịch sử · Danh hiệu · Huyền thoại"
      />
      {[-13, -17, -21].map((z) => (
        <group key={z}>
          <AssetModel asset="lantern" position={[7.6, 2.4, z]} scale={0.65} solid={false} />
          <AssetModel asset="lantern" position={[12.4, 2.4, z]} scale={0.65} solid={false} />
          <group position={[7.32, 3.1, z]} rotation={[0, Math.PI / 2, 0]}>
            <BluePlaque
              lines={[
                z === -13
                  ? 'MUNICH · 2012'
                  : z === -17
                    ? 'PORTO · 2021'
                    : 'THE BLUES HERITAGE HALL',
                'Tiếp bước · Phía trước',
              ]}
              width={2.7}
              height={1.3}
            />
          </group>
        </group>
      ))}
      <BluePlaque
        lines={['HANG THE BLUES', 'Nơi fan Chelsea trú ẩn sau mỗi trận thua']}
        width={15}
        height={2.3}
        position={[-2, 8.1, -7.75]}
      />
      {[-9, 5].map((x) => (
        <BlueBanner key={x} position={[x, 5.7, -8.5]} />
      ))}
      <Box position={[0, 0.55, -6]} size={[5, 1.1, 2.8]} color="#21385c" />
      <Box position={[0, 1.13, -6]} size={[5.2, 0.08, 3]} color={GOLD} />
      <BluePlaque
        lines={[
          'KẾT QUẢ TRẬN GẦN NHẤT',
          `${match.home}    ${match.score}    ${match.away}`,
          match.time,
          match.caption,
          match.label,
        ]}
        position={[0, 4.3, -5.95]}
        width={8.7}
        height={3.7}
      />
      <Sapphire position={[0, 1.2, -6.3]} scale={1.3} />
      {[-4.8, 4.8].map((x) => (
        <group key={x}>
          <AssetModel asset="blues-lion" position={[x, 0, -6]} scale={1.25} />
          <Sapphire position={[x, 0.1, -8.1]} scale={1.4} />
        </group>
      ))}
      <BlueRug position={[0, 0.04, 4.3]} width={4.5} depth={13} />
      <mesh position={[0, 0.065, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 3.05, 64]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, 0.09, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <Label text="KEEP THE BLUE FLAG FLYING HIGH" position={[0, 0, 0]} width={5} />
      </group>
      {/* Lounge furniture is free-standing; NPCs are explicitly decorative. */}
      <AssetModel asset="blues-sofa" position={[-11, 0, 1.8]} />
      <AssetModel asset="blues-sofa" position={[-11, 0, 6.8]} rotation={[0, Math.PI, 0]} />
      <AssetModel asset="fan-table" position={[-11, 0, 4.3]} scale={[1.25, 0.65, 0.8]} />
      <BlueRug position={[-11, 0.04, 4.2]} width={8} depth={8} />
      <BluePlaque
        lines={['GÓC TÂM SỰ FAN', 'Trà nóng · Tim nguội · Có anh em']}
        position={[-11, 5.1, 0.6]}
        width={7.2}
        height={1.4}
      />
      {[-12.5, -10].map((x, i) => (
        <group key={x} position={[x, 0.66, 2.1]}>
          <Character
            name={i ? 'NPC · BlueLion' : 'NPC · Fan tâm sự'}
            color="#145aff"
            gesture={i ? 'Cry' : 'Facepalm'}
            direction={0}
          />
          <Label
            text={i ? 'Thua một trận, còn cả hội.' : 'Ngắm cúp 2012 cho đỡ buồn…'}
            position={[0, 3, 0]}
            width={4.2}
            background="#122955"
          />
        </group>
      ))}
      <group position={[3, 0, -2.7]}>
        <Character name="NPC · Vẫn tin The Blues" color="#175bfa" gesture="Sad" />
        <Label
          text="Ngày mai lại xanh thôi!"
          position={[0, 3, 0]}
          width={3.8}
          background="#122955"
        />
      </group>
      <group position={[12, 0, 3]}>
        <Box position={[0, 1.5, 0]} size={[4.8, 3, 1.4]} color="#152d54" />
        <BluePlaque
          lines={[
            'SẢNH TRÚ ẨN',
            'Tâm sự cùng anh em',
            'Cà khịa vui, giữ tình bạn',
            '↑ Đi bộ vào phòng truyền thống',
            '↓ Tự do ra Đại Sảnh',
          ]}
          width={4.5}
          height={2.6}
          position={[0, 2, 0.75]}
        />
      </group>
      <BlueArch
        position={[0, 0, 15]}
        width={5}
        title="CỔNG RA HANG"
        subtitle="Trở về Đại Sảnh Chung"
        reverse
      />
      <pointLight position={[0, 3, 14]} intensity={80} color="#a9e5ff" distance={12} />
      <BluePlaque
        lines={['CỔNG RA HANG', 'Đi qua cổng phía sau · Đại Sảnh Chung']}
        position={[0, 7.9, 14.5]}
        width={7.5}
        height={1.3}
      />
      {quality !== 'low' && (
        <>
          <pointLight position={[-11, 4.5, 4]} intensity={110} color="#ffc97b" distance={13} />
          <pointLight position={[10, 4, -17]} intensity={70} color="#ffd798" distance={15} />
        </>
      )}
    </group>
  );
}
