import { useMemo, useRef, type ReactNode } from 'react';
import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  type RapierRigidBody,
  type RapierCollider,
} from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Shape } from 'three';
import {
  GATE_HALF_WIDTH,
  gateOpenness,
  type CaveGate as Gate,
  type GateTiming,
} from '../../../../../packages/shared/caveGates';
import { Box, Torch } from './Models';
import { Plaque, type V3 } from './IndoorKit';

const half = GATE_HALF_WIDTH;
const spring = 2.55;
const top = spring + half;

export function StoneArch({
  radius,
  spring,
  depth = 0.62,
  trim = '#84605a',
  stone = '#5b4145',
}: {
  radius: number;
  spring: number;
  depth?: number;
  trim?: string;
  stone?: string;
}) {
  const blocks = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => {
        const a = (Math.PI * i) / 13 + 0.008,
          b = (Math.PI * (i + 1)) / 13 - 0.008;
        const shape = new Shape();
        shape.absarc(0, spring, radius + 0.57, a, b, false);
        shape.absarc(0, spring, radius, b, a, true);
        shape.closePath();
        return shape;
      }),
    [radius, spring],
  );
  return (
    <>
      {blocks.map((shape, i) => (
        <mesh key={i} position={[0, 0, -depth / 2]} castShadow receiveShadow>
          <extrudeGeometry
            args={[shape, { depth, steps: 1, bevelEnabled: false, curveSegments: 5 }]}
          />
          <meshStandardMaterial color={i % 3 === 0 ? trim : stone} roughness={0.85} />
        </mesh>
      ))}
      {[-1, 1].flatMap((s) =>
        Array.from({ length: 4 }, (_, i) => (
          <Box
            key={`${s}:${i}`}
            position={[s * (radius + 0.28), (spring * (i + 0.5)) / 4, 0]}
            size={[0.56, spring / 4 - 0.025, depth]}
            color={i % 2 ? trim : stone}
            solid={false}
          />
        )),
      )}
    </>
  );
}

function Leaf({
  gate,
  side,
  origin,
  timing,
  mark,
}: {
  gate: Gate;
  side: number;
  origin: V3;
  timing: () => GateTiming | undefined;
  mark?: ReactNode;
}) {
  const body = useRef<RapierRigidBody>(null);
  const rotation = useMemo(() => new Quaternion(), []);
  const euler = useMemo(() => new Euler(), []);
  const [x, y, z] = origin;
  const hinge: V3 = [x + side * half * Math.cos(gate.yaw), y, z - side * half * Math.sin(gate.yaw)];
  const sign = -side;
  const city = gate.id === 'city';
  const madrid = gate.id === 'real';
  const shape = useMemo(() => {
    const leaf = new Shape();
    leaf.moveTo(0, 0.035);
    leaf.lineTo(sign * (half - 0.009), 0.035);
    for (let i = 0; i <= 16; i++) {
      const a = (i * Math.PI) / 32;
      leaf.lineTo(sign * (half - half * Math.sin(a)), spring + half * Math.cos(a));
    }
    leaf.closePath();
    return leaf;
  }, [sign]);
  useBeforePhysicsStep(() => {
    const yaw = gate.yaw + sign * 1.57 * gateOpenness(timing(), Date.now());
    body.current?.setNextKinematicRotation(rotation.setFromEuler(euler.set(0, yaw, 0)));
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={hinge}
      rotation={[0, gate.yaw, 0]}
    >
      <CuboidCollider
        args={[half / 2, top / 2, 0.125]}
        position={[(sign * half) / 2, top / 2, 0]}
      />
      <mesh position={[0, 0, -0.11]} castShadow receiveShadow userData={{ cameraSolid: true }}>
        <extrudeGeometry args={[shape, { depth: 0.22, bevelEnabled: false }]} />
        <meshStandardMaterial color={gate.color} metalness={0.11} roughness={0.52} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const offset = ((i + 0.54) * half) / 7;
        const height = spring + Math.sqrt(half ** 2 - (half - offset) ** 2) - 0.1;
        return (
          <Box
            key={i}
            position={[sign * offset, height / 2 + 0.03, 0.118]}
            size={[0.024, height - 0.045, 0.023]}
            color={madrid ? "#b4833a" : city ? "#18354e" : "#35131c"}
            solid={false}
          />
        );
      })}
      {[0.35, 1.38, 2.25].map((h) => (
        <group key={h}>
          <Box
            position={[(sign * half) / 2, h, 0.13]}
            size={[half - 0.05, 0.18, 0.075]}
            color={madrid ? "#243d83" : city ? "#213d5a" : "#482631"}
            solid={false}
          />
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[sign * (0.16 + i * 0.36), h, 0.18]}>
              <sphereGeometry args={[0.048, 8, 6]} />
              <meshStandardMaterial color={gate.accent} metalness={0.65} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      <Box
        position={[sign * (half - 0.23), 1.83, 0.19]}
        size={[0.22, 0.54, 0.15]}
        color={gate.accent}
        solid={false}
      />
      {mark && <group position={[sign * 1.28, 2.5, 0.17]}>{mark}</group>}
    </RigidBody>
  );
}

export function CaveGate({
  gate,
  timing,
  mark,
  flags,
}: {
  gate: Gate;
  timing: () => GateTiming | undefined;
  mark?: ReactNode;
  flags?: ReactNode;
}) {
  const origin: V3 = [...gate.origin];
  const [x, y, z] = origin;
  const light = useRef<import('three').PointLight>(null);
  const city = gate.id === 'city';
  const madrid = gate.id === 'real';
  const frame = madrid ? '#2b3c72' : city ? '#253e58' : '#402937';
  const sweepGuard = useRef<RapierCollider>(null);
  const english = document.documentElement.lang.toLowerCase().startsWith('en');
  useBeforePhysicsStep(() => {
    // An inward-opening leaf can otherwise deflect a running capsule along its face.
    // Hold the inside approach clear of the swing until the leaves are nearly parallel.
    const guarded = gateOpenness(timing(), Date.now()) < 0.94;
    if (sweepGuard.current && sweepGuard.current.isEnabled() !== guarded)
      sweepGuard.current.setEnabled(guarded);
  });
  useFrame(() => {
    if (light.current) light.current.intensity = 15 + gateOpenness(timing(), Date.now()) * 26;
  });
  return (
    <group
      name={`cave-${gate.club}`}
      userData={{ caveId: gate.club, tier: y > 12 ? 3 : 2 }}
      position={origin}
    >
      <group rotation={[0, gate.yaw, 0]}>
        <StoneArch radius={half + 0.035} spring={spring} depth={0.9} trim={madrid ? "#f4e8d7" : city ? "#7592a6" : "#9b6e54"} stone={madrid ? "#b9b2c4" : undefined} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box position={[s * 3.8, 3.05, -0.07]} size={[3.3, 6.1, 1.25]} color={frame} />
            <Torch position={[s * 2.85, 1.55, 0.87]} />
          </group>
        ))}
        <Box position={[0, 5.6, -0.1]} size={[4.56, 1.02, 1.1]} color={frame} />
        <Plaque
          lines={[gate.titles[+english], gate.subtitles[+english]]}
          width={4.7}
          height={0.92}
          position={[0, 5.25, 0.68]}
          background={madrid ? '#151e4f' : gate.color}
        />
        {flags ??
          [-1, 1].map((side) => (
            <group key={side} position={[side * 3.55, 4.35, 0.65]}>
              <Box size={[0.92, 2.15, 0.08]} color={gate.color} solid={false} />
              <Box
                position={[0, 1.09, 0]}
                size={[1.13, 0.07, 0.13]}
                color={gate.accent}
                solid={false}
              />
              <Box
                position={[side * 0.34, 0, 0.05]}
                size={[0.05, 2.04, 0.03]}
                color={gate.accent}
                solid={false}
              />
            </group>
          ))}
        {gate.id === 'liverpool' && (
          <>
            <pointLight ref={light} color={city ? "#64bcff" : "#ffb66b"} position={[0, 3.2, -0.75]} distance={7} />
            <pointLight color="#ffc783" intensity={40} position={[0, 3.8, 2.1]} distance={10} />
          </>
        )}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            ref={sweepGuard}
            args={[3.72, 0.55, 0.07]}
            position={[0, 0.55, -half - 0.28]}
          />
          <CuboidCollider args={[2.28, 0.51, 0.55]} position={[0, 5.6, -0.1]} />
          {[-1, 1].map((s) => (
            <CuboidCollider key={s} args={[1.65, 3.05, 0.625]} position={[s * 3.8, 3.05, -0.07]} />
          ))}
        </RigidBody>
      </group>
      {/* Leaf bodies use world coordinates so their hinge axes stay independent of the frame. */}
      <group position={[-x, -y, -z]}>
        <Leaf gate={gate} side={-1} origin={origin} timing={timing} mark={mark} />
        <Leaf gate={gate} side={1} origin={origin} timing={timing} />
      </group>
    </group>
  );
}
