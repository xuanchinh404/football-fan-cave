import { Crystals, Gothic, Lantern as BarcelonaLantern } from './barcelona/BarcelonaArchitecture';
import { Crystal, Lantern as MadridLantern } from './real/RealArchitecture';
import { useEffect, useMemo } from 'react';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { BufferAttribute, BufferGeometry } from 'three';
import { CAVE_CONNECTIONS, type RefugeId } from '../../../../../packages/shared/caveConnections';
import { caveEntrance, CAVES, CORRIDOR_HALF_WIDTH } from '../../../../../packages/shared/grandHall';
import { CAVE_GATES, type CaveGate } from '../../../../../packages/shared/caveGates';
import { Box, Torch } from './Models';
import { Plaque, RoomFront } from './IndoorKit';

const half = CORRIDOR_HALF_WIDTH;
const roof = 4.85;
const faces = new Uint32Array([
  0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4,
  3, 4, 7,
]);

function StoneSpan({
  left,
  right,
  northLeft = left,
  northRight = right,
  south,
  north,
  bottom,
  top,
  color,
}: {
  left: number;
  right: number;
  northLeft?: number;
  northRight?: number;
  south: readonly [number, number];
  north: readonly [number, number];
  bottom: number;
  top: number;
  color: string;
}) {
  const [sy, sz] = south;
  const [ny, nz] = north;
  const { vertices, geometry } = useMemo(() => {
    const vertices = new Float32Array([
      left,
      sy + bottom,
      sz,
      right,
      sy + bottom,
      sz,
      northRight,
      ny + bottom,
      nz,
      northLeft,
      ny + bottom,
      nz,
      left,
      sy + top,
      sz,
      right,
      sy + top,
      sz,
      northRight,
      ny + top,
      nz,
      northLeft,
      ny + top,
      nz,
    ]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(new BufferAttribute(faces, 1));
    geometry.computeVertexNormals();
    return { vertices, geometry };
  }, [left, right, northLeft, northRight, sy, sz, ny, nz, bottom, top]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <TrimeshCollider args={[vertices, faces]} />
      <mesh geometry={geometry} receiveShadow userData={{ cameraSolid: true }}>
        <meshStandardMaterial color={color} roughness={0.89} flatShading />
      </mesh>
    </>
  );
}

function CityGateApproach({ gateZ, height, rampStart, rampEnd, floor }: {
  gateZ: number; height: number; rampStart: number; rampEnd: number; floor: number;
}) {
  const outer = half + 0.05;
  const inner = 1.77;
  const flareEnd = gateZ - 5.4;
  const floorAtFlare = height - ((height - floor) * (rampStart - flareEnd)) / (rampStart - rampEnd);
  return [-1, 1].map((side) => (
    <group key={side}>
      <StoneSpan
        left={side < 0 ? -outer : inner}
        right={side < 0 ? -inner : outer}
        south={[height, gateZ - 0.08]}
        north={[height, rampStart]}
        bottom={-0.28}
        top={1.3}
        color="#496985"
      />
      <StoneSpan
        left={side < 0 ? -outer : inner}
        right={side < 0 ? -inner : outer}
        northLeft={side < 0 ? -outer : half}
        northRight={side < 0 ? -half : outer}
        south={[height, rampStart]}
        north={[floorAtFlare, flareEnd]}
        bottom={-0.28}
        top={1.3}
        color="#496985"
      />
    </group>
  ));
}

export function CaveCorridor({ gate }: { gate: CaveGate }) {
  const cave = CAVES.find((item) => item.id === gate.id)!;
  const entrance = caveEntrance(cave);
  const { rampStart, rampEnd, roomMouth, offset } = CAVE_CONNECTIONS[gate.id];
  const city = gate.id === 'city';
  const madrid = gate.id === 'real';
  const barcelona = gate.id === 'barcelona';
  const palette = barcelona
    ? { floor: '#514e63', landing: '#6c6073', ceiling: '#302b40', wall: '#484358' }
    : madrid
    ? { floor: '#ded2ce', landing: '#e0d6d4', ceiling: '#3a3555', wall: '#645e76' }
    : city
    ? { floor: '#587894', landing: '#6d8ca5', ceiling: '#263c53', wall: '#314b65' }
    : { floor: '#514956', landing: '#60525a', ceiling: '#302b36', wall: '#463b4a' };
  const nodes = [
    [entrance.height, entrance.z],
    [entrance.height, rampStart],
    [offset[1], rampEnd],
    [offset[1], roomMouth - 0.05],
  ] as const;
  return (
    <group name={`corridor-${gate.id}`} position={[entrance.x, 0, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {city && <CityGateApproach gateZ={entrance.z} height={entrance.height}
          rampStart={rampStart} rampEnd={rampEnd} floor={offset[1]} />}
        {nodes.slice(0, -1).map((south, i) => {
          const north = nodes[i + 1];
          return (
            <group key={south[1]}>
              {i > 0 && (
                <StoneSpan
                  left={-half}
                  right={half}
                  south={south}
                  north={north}
                  bottom={-0.32}
                  top={0}
                  color={i === 1 ? palette.floor : palette.landing}
                />
              )}
              <StoneSpan
                left={-half - 0.35}
                right={half + 0.35}
                south={south}
                north={north}
                bottom={roof}
                top={roof + 0.32}
                color={palette.ceiling}
              />
              {[-1, 1].map((side) => (
                <StoneSpan
                  key={side}
                  left={side < 0 ? -half - 0.35 : half}
                  right={side < 0 ? -half : half + 0.35}
                  south={south}
                  north={north}
                  bottom={-0.32}
                  top={roof}
                  color={palette.wall}
                />
              ))}
            </group>
          );
        })}
      </RigidBody>
      {nodes.slice(0, -1).flatMap((south, i) => {
        const north = nodes[i + 1];
        const count = Math.ceil((south[1] - north[1]) / 6);
        return Array.from({ length: count }, (_, index) => {
          const progress = (index + 0.5) / count;
          const height = south[0] + (north[0] - south[0]) * progress;
          const z = south[1] + (north[1] - south[1]) * progress;
          if (barcelona) return (
            <group key={z} position={[0, height, z]}>
              <Gothic position={[0, 0, 0]} span={2.97} spring={2.19} rise={2.25} />
              {[-1, 1].map((side) => <group key={side}>
                <Crystals position={[side * 2.89, 0.42, -0.38]} red={side < 0} scale={0.58} />
                <BarcelonaLantern position={[side * 2.91, 2.96, 0.18]} scale={0.65} />
              </group>)}
              <pointLight position={[0, 3.4, 0.15]} color="#ffc37d" intensity={22} distance={7.8} />
            </group>
          );
          return (
            <group key={z} position={[0, height, z]}>
              <mesh position={[0, 1.65, 0]}>
                <torusGeometry args={[2.95, 0.24, 5, 14, Math.PI]} />
                <meshStandardMaterial color={gate.color} roughness={0.85} flatShading />
              </mesh>
              {[-1, 1].map((side) => (
                <Box
                  key={side}
                  position={[side * 2.95, 0.825, 0]}
                  size={[0.48, 1.65, 0.48]}
                  color={gate.color}
                  solid={false}
                />
              ))}
              {madrid && [-1, 1].map((side) => <group key={side}>
                <MadridLantern position={[side * 2.85, 2.72, 0.18]} />
                <Crystal position={[side * 2.9, 0.12, 0.45]} scale={0.58} />
              </group>)}
              {!madrid && [-1, 1].map((side) => (
                <mesh key={side} position={[side * 2.98, 2.4, 0.23]}>
                  <boxGeometry args={[0.18, 0.44, 0.24]} />
                  <meshStandardMaterial
                    color={gate.accent}
                    emissive={gate.accent}
                    emissiveIntensity={0.7}
                  />
                </mesh>
              ))}
            </group>
          );
        });
      })}
    </group>
  );
}

export function ClubRefuge({ club }: { club: RefugeId }) {
  const gate = CAVE_GATES.find((item) => item.id === club)!;
  const { color, accent, titles, subtitles } = gate;
  return (
    <group name={`refuge-${club}`}>
      <RigidBody type="fixed" colliders="cuboid">
        <Box position={[0, -0.21, -4]} size={[12, 0.42, 16]} color="#574b59" />
        <Box position={[0, 5.35, -4]} size={[12.6, 0.7, 16.5]} color="#292531" />
        <Box position={[0, 2.55, -12.2]} size={[12.6, 5.1, 0.4]} color="#403747" />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Box position={[side * 6.22, 2.55, -4]} size={[0.44, 5.1, 16.5]} color="#403747" />
            <Box position={[side * 4.9, 0.32, -5.7]} size={[1.36, 0.64, 4.5]} color={color} />
            <Box position={[side * 5.5, 0.74, -5.7]} size={[0.2, 0.88, 4.5]} color={accent} />
          </group>
        ))}
      </RigidBody>
      <RoomFront left={-6.3} right={6.3} z={4.2} height={5.1} depth={0.4} color="#403747" opening />
      <Box position={[0, 0.018, -4]} size={[4.1, 0.034, 13.9]} color={color} solid={false} />
      <Plaque
        lines={[titles[0], subtitles[0], 'SẢNH TRÚ ẨN']}
        width={8.5}
        height={2.8}
        position={[0, 3.15, -11.9]}
        background={color}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * 3.35, 2.65, -10.8]}
            size={[1.12, 2.4, 0.12]}
            color={color}
            solid={false}
          />
          <Torch position={[side * 4.4, 2.15, -10.4]} />
        </group>
      ))}
    </group>
  );
}
