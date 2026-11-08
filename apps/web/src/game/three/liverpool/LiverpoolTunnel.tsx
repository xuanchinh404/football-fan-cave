import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { KOP_EXIT_STAIRS, KOP_TUNNEL } from '../../../../../../packages/shared/liverpool/layout';
import { StoneArch } from '../CaveGate';
import { Plaque } from '../IndoorKit';
import { Box, Torch } from '../Models';

const { x, start, end, width, stairStart, landingStart, door, rise, steps } = KOP_TUNNEL;
const landingHeight = rise * steps;
const angle = Math.atan2(landingHeight, landingStart - stairStart);
const stairLength = Math.hypot(landingStart - stairStart, landingHeight);
const slopeCenter = (stairStart + landingStart) / 2;
const ceiling = 5.75;
const wallHeight = ceiling + landingHeight;
const ceilingSections = [
  { y: ceiling, z: (start + stairStart) / 2, depth: stairStart - start, angle: 0 },
  { y: ceiling + landingHeight / 2, z: slopeCenter, depth: stairLength, angle: -angle },
  { y: ceiling + landingHeight, z: (landingStart + end) / 2, depth: end - landingStart, angle: 0 },
];
const floorWidth = width - 0.42;
const stone = ['#4f323b', '#5e4149', '#69464d', '#412d38'];

function AmberEdge({ position, length }: { position: [number, number, number]; length: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[length, 0.026, 0.052]} />
      <meshStandardMaterial color="#ffd485" emissive="#f48226" emissiveIntensity={2.4} />
    </mesh>
  );
}

export function LiverpoolTunnel() {
  const english = document.documentElement.lang.toLowerCase().startsWith('en');
  return (
    <group name="kop-exit-tunnel" position={[x, 0, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {/* The capsule follows the tread slope without a vertical bump at each nosing. */}
        <CuboidCollider
          args={[floorWidth / 2, 0.18, stairLength / 2]}
          position={[
            0,
            landingHeight / 2 - 0.18 * Math.cos(angle),
            slopeCenter + 0.18 * Math.sin(angle),
          ]}
          rotation={[-angle, 0, 0]}
        />
        <CuboidCollider
          args={[floorWidth / 2, landingHeight / 2, (end - landingStart) / 2]}
          position={[0, landingHeight / 2, (end + landingStart) / 2]}
        />
        {[-1, 1].map((side) => (
          <CuboidCollider
            key={side}
            args={[0.45, wallHeight / 2, (end - start) / 2]}
            position={[side * (width / 2 + 0.41), wallHeight / 2, (start + end) / 2]}
          />
        ))}
        {ceilingSections.map((section) => (
          <CuboidCollider
            key={section.z}
            args={[width / 2, 0.3, section.depth / 2 + 0.15]}
            position={[0, section.y, section.z]}
            rotation={[section.angle, 0, 0]}
          />
        ))}
      </RigidBody>
      {ceilingSections.map((section) => (
        <Box
          key={section.z}
          size={[width + 1.2, 0.6, section.depth + 0.3]}
          position={[0, section.y, section.z]}
          rotation={[section.angle, 0, 0]}
          color="#261925"
        />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * (width / 2 + 0.41), wallHeight / 2, (start + end) / 2]}
            size={[0.9, wallHeight, end - start]}
            color="#33232f"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={i}
              position={[
                side * (width / 2 + 0.14),
                2.6 + Math.min(landingHeight, i * 1.25),
                start + 1.25 + i * 2.55,
              ]}
              rotation={[i * 0.63, i * 0.37, side * 0.23]}
              scale={[0.48, 2.6, 1.52]}
              castShadow
            >
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={stone[i % stone.length]} flatShading roughness={0.92} />
            </mesh>
          ))}
          {KOP_EXIT_STAIRS.map((s) => (
            <Box
              key={s.z}
              position={[side * 3.25, s.height + 0.31, s.z]}
              size={[0.4, 0.62, s.depth]}
              color="#543640"
              solid={false}
            />
          ))}
          <Box
            position={[side * 3.25, landingHeight / 2 + 0.71, (stairStart + landingStart) / 2]}
            rotation={[-Math.atan2(rise, KOP_TUNNEL.stepDepth), 0, 0]}
            size={[0.16, 0.14, Math.hypot(landingStart - stairStart, landingHeight)]}
            color="#ad794c"
            solid={false}
          />
          {[17.2, 21.3, 29.1].map((z) => (
            <group
              key={z}
              position={[
                side * 3.32,
                Math.min(landingHeight, (z - stairStart) * Math.tan(angle)),
                z,
              ]}
            >
              <Box
                position={[0, 0.48, 0]}
                size={[0.73, 0.96, 0.75]}
                color="#573943"
                solid={false}
              />
              <Torch position={[0, 0.97, 0]} />
              <mesh
                position={[-side * 0.14, 0.53, -0.83]}
                rotation={[0.25, side * 0.4, side * 0.21]}
                scale={[0.28, 0.65, 0.28]}
              >
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                  color="#fa3960"
                  emissive="#cb143b"
                  emissiveIntensity={1.6}
                  metalness={0.23}
                  roughness={0.2}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {[17.2, 20.2, 24, 29.6].map((z, i) => (
        <group
          key={z}
          position={[0, Math.min(landingHeight, (z - stairStart) * Math.tan(angle)), z]}
        >
          <StoneArch radius={3.08} spring={2.15} />
          <pointLight
            position={[0, 4.75, 0.4]}
            color={i === 0 ? '#ff6d68' : '#ffbc76'}
            intensity={i === 0 ? 20 : 38}
            distance={8}
          />
        </group>
      ))}
      <Box
        size={[floorWidth, 0.24, stairStart - start]}
        position={[0, -0.12, (start + stairStart) / 2]}
        color={stone[0]}
        solid={false}
      />
      {KOP_EXIT_STAIRS.map((s, i) => (
        <group key={s.z}>
          <Box
            size={[floorWidth, s.height, s.depth]}
            position={[0, s.height / 2, s.z]}
            color={stone[i % stone.length]}
            solid={false}
          />
          <AmberEdge position={[0, s.height + 0.004, s.z - s.depth * 0.41]} length={5.75} />
        </group>
      ))}
      <Box
        size={[floorWidth, landingHeight, end - landingStart]}
        position={[0, landingHeight / 2, (landingStart + end) / 2]}
        color="#513641"
      />
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => {
          const w = floorWidth / 6;
          const d = (end - landingStart) / 8;
          return (
            <Box
              key={`${row}:${col}`}
              size={[w - 0.025, 0.025, d - 0.025]}
              position={[(col - 2.5) * w, landingHeight + 0.006, landingStart + (row + 0.5) * d]}
              color={stone[(row + col * 3) % stone.length]}
              solid={false}
            />
          );
        }),
      )}
      <group rotation={[0, Math.PI, 0]} position={[0, 5.7, start - 0.52]}>
        <Plaque
          lines={
            english
              ? ['THE KOP TUNNEL', 'To the Grand Hall']
              : ['ĐƯỜNG HẦM THE KOP', 'Lối ra Đại Sảnh Chung']
          }
          width={5.8}
          height={1.12}
        />
      </group>
      <pointLight
        position={[0, landingHeight + 4.15, door + 1.6]}
        color="#a9b8e1"
        intensity={8}
        distance={5}
      />
    </group>
  );
}
