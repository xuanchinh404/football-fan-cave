import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AnimationClip,
  Euler,
  Group,
  InstancedMesh,
  Object3D,
  PropertyBinding,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from 'three';
import { product, type Product } from '../../../../packages/shared/store/catalog';
import type { Loadout } from '../../../../packages/shared/store/state';
import { Ring, StoreModel, type Vec } from './StoreModel';

const attachments = [
  ['hand', 'Hand.R', [0, 0.11, 0.015], 0.35],
  ['head', 'Head', [0, 0.36, 0.015], 0.82],
  ['face', 'Head', [0, 0.18, 0.277], 0.59],
  ['neck', 'Neck', [0, 0.03, 0.05], 0.55],
  ['back', 'Chest', [0, 0.05, -0.237], 0.55],
] as const;
export function rigBone(instance: Object3D, name: string) {
  return instance.getObjectByName(PropertyBinding.sanitizeNodeName(name));
}
function Attachment({
  bone,
  offset,
  children,
  followRotation,
}: {
  bone: Object3D;
  followRotation: boolean;
  offset: Vec;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  const point = useMemo(() => new Vector3(), []);
  const spin = useMemo(() => new Quaternion(), []);
  useFrame(() => {
    const g = ref.current;
    if (!g?.parent) return;
    bone.getWorldPosition(point);
    g.parent.worldToLocal(point);
    g.position.copy(point);
    if (followRotation) {
      bone.getWorldQuaternion(spin);
      g.parent.getWorldQuaternion(g.quaternion).invert().multiply(spin);
    }
  });
  return (
    <group ref={ref}>
      <group position={offset}>{children}</group>
    </group>
  );
}
export function AvatarStoreGear({
  instance,
  loadout,
  teamColor,
}: {
  instance: Object3D;
  loadout?: Loadout;
  teamColor?: string;
}) {
  return (
    <>
      {attachments.map(([slot, name, offset, size]) => {
        const item = product(loadout?.[slot]);
        const bone = item && rigBone(instance, name);
        if (!item || !bone) return null;
        return (
          <Attachment key={slot} bone={bone} offset={[...offset]} followRotation={slot === 'hand'}>
            <group rotation={slot === 'neck' ? [Math.PI / 2, 0, 0] : undefined}>
              <StoreModel
                item={item.clubVariant && teamColor ? { ...item, color: teamColor } : item}
                size={size}
              />
            </group>
          </Attachment>
        );
      })}
    </>
  );
}
export function AvatarStoreExtras({
  loadout,
  facing,
  effects = true,
}: {
  loadout?: Loadout;
  facing: number;
  effects?: boolean;
}) {
  const pet = product(loadout?.pet);
  const aura = effects ? product(loadout?.aura) : undefined;
  const ref = useRef<Group>(null);
  const auraRef = useRef<Group>(null);
  const position = useMemo(() => new Vector3(), []);
  const desired = useMemo(() => new Vector3(), []);
  const ready = useRef(false);
  useFrame(({ clock }, dt) => {
    if (auraRef.current) {
      auraRef.current.rotation.y += dt * 0.9;
      auraRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3.4) * 0.08);
    }
    if (!ref.current?.parent) {
      ready.current = false;
      return;
    }
    const g = ref.current;
    const bob = Math.sin(clock.elapsedTime * 4.3) * 0.08;
    g.parent!.localToWorld(
      desired.set(
        Math.cos(facing) * 0.88 - Math.sin(facing) * 1.45,
        0.39 + bob,
        -Math.sin(facing) * 0.88 - Math.cos(facing) * 1.45,
      ),
    );
    if (!ready.current || position.distanceToSquared(desired) > 40) position.copy(desired);
    else position.lerp(desired, 1 - Math.exp(-4.6 * dt));
    ready.current = true;
    g.position.copy(g.parent!.worldToLocal(desired.copy(position)));
    g.rotation.y = facing;
  });
  return (
    <>
      {pet && (
        <group ref={ref}>
          <StoreModel item={pet} size={0.75} />
        </group>
      )}
      {aura &&
        (aura.visual === 'steps' || aura.visual === 'flame' ? (
          <AvatarTrail key={aura.id} item={aura} facing={facing} />
        ) : (
          <group ref={auraRef}>
            <Ring
              at={[0, 0.05, 0]}
              radius={0.71}
              color={aura.color}
              rotation={[-Math.PI / 2, 0, 0]}
            />
            <Ring
              at={[0, 2.02, 0]}
              radius={0.31}
              color={aura.color}
              rotation={[-Math.PI / 2, 0, 0]}
            />
          </group>
        ))}
    </>
  );
}

function AvatarTrail({ item, facing }: { item: Product; facing: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const markers = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        point: new Vector3(),
        angle: 0,
        at: -Infinity,
      })),
    [],
  );
  const cursor = useRef(0);
  const last = useMemo(() => new Vector3(), []);
  const origin = useMemo(() => new Vector3(), []);
  const dummy = useMemo(() => new Object3D(), []);
  const flame = item.visual === 'flame';
  useFrame(({ clock }) => {
    const g = mesh.current;
    if (!g) return;
    const now = clock.elapsedTime;
    g.getWorldPosition(origin);
    const gap = last.distanceToSquared(origin);
    if (gap > 9) {
      markers.forEach((marker) => {
        marker.at = -Infinity;
      });
      last.copy(origin);
    } else if (gap > 0.19 && Math.abs(last.y - origin.y) < 0.26) {
      const marker = markers[cursor.current % markers.length];
      const side = cursor.current++ % 2 ? 0.16 : -0.16;
      marker.point.copy(origin);
      marker.point.x += Math.cos(facing) * side;
      marker.point.z -= Math.sin(facing) * side;
      marker.angle = facing;
      marker.at = now;
      last.copy(origin);
    }
    markers.forEach((marker, index) => {
      const size = Math.max(0, 1 - (now - marker.at) / 0.95);
      dummy.position.copy(marker.point);
      dummy.position.y += flame ? 0.15 * size : 0.04;
      g.worldToLocal(dummy.position);
      dummy.rotation.set(flame ? 0 : -Math.PI / 2, 0, marker.angle);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      g.setMatrixAt(index, dummy.matrix);
    });
    g.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, markers.length]} frustumCulled={false}>
      {flame ? <coneGeometry args={[0.16, 0.36, 7]} /> : <circleGeometry args={[0.14, 9]} />}
      <meshBasicMaterial color={item.color} transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  );
}

type Pose = Record<string, Vec>;
const poses: Record<string, { time: number; poses: Pose[] }> = {
  Throw: {
    time: 0.52,
    poses: [
      {},
      { 'UpperArm.R': [-1.18, 0.23, -0.3], 'Forearm.R': [-0.7, 0, 0.1], Chest: [0, -0.26, 0] },
      { 'UpperArm.R': [1.23, 0.2, -0.4], 'Forearm.R': [0.4, 0, 0], Chest: [0.18, 0.36, 0] },
      {},
    ],
  },
  Huddle: {
    time: 1.9,
    poses: [
      {},
      {
        Hips: [0.15, 0, 0],
        Chest: [0.54, 0, 0],
        Head: [0.18, 0, 0],
        'Thigh.L': [-1.15, 0, -0.12],
        'Thigh.R': [-1.15, 0, 0.12],
        'Shin.L': [1.28, 0, 0],
        'Shin.R': [1.28, 0, 0],
      },
      {
        Chest: [0.58, 0, 0],
        Head: [0.2, 0, 0],
        'Thigh.L': [-1.15, 0, -0.12],
        'Thigh.R': [-1.15, 0, 0.12],
        'Shin.L': [1.28, 0, 0],
        'Shin.R': [1.28, 0, 0],
      },
      {},
    ],
  },
  Flop: {
    time: 1.85,
    poses: [
      {},
      { Hips: [-1.25, 0, 0.24], 'Thigh.L': [0.62, 0, 0], 'UpperArm.R': [0.4, 0, -0.8] },
      { Hips: [-1.42, 0, -0.22], 'Shin.R': [0.84, 0, 0] },
      {},
    ],
  },
  Slide: {
    time: 1.45,
    poses: [
      {},
      {
        Hips: [0.37, 0, 0],
        'Thigh.L': [-0.9, 0, 0],
        'Thigh.R': [-0.9, 0, 0],
        'Shin.L': [1.4, 0, 0],
        'Shin.R': [1.4, 0, 0],
        'UpperArm.L': [0.7, 0, 0.7],
        'UpperArm.R': [0.7, 0, -0.7],
      },
      {
        Hips: [0.25, 0, 0],
        'Thigh.L': [-0.52, 0, 0],
        'Thigh.R': [-0.52, 0, 0],
        'Shin.L': [0.9, 0, 0],
        'Shin.R': [0.9, 0, 0],
      },
      {},
    ],
  },
  Kneel: {
    time: 1.8,
    poses: [
      {},
      {
        Hips: [0.34, 0, 0],
        Chest: [0.65, 0, 0],
        'Thigh.L': [-0.62, 0, 0],
        'Thigh.R': [-0.62, 0, 0],
        'Shin.L': [1.37, 0, 0],
        'Shin.R': [1.37, 0, 0],
      },
      { Chest: [0.42, 0, 0], Head: [-0.32, 0, 0] },
      {},
    ],
  },
  Dance: {
    time: 1.7,
    poses: [
      {},
      { Chest: [0, -0.37, -0.25], 'Thigh.L': [0.39, 0, 0], 'UpperArm.R': [0.8, 0, -1.2] },
      { Chest: [0, 0.43, 0.27], 'Thigh.R': [0.46, 0, 0], 'UpperArm.L': [0.8, 0, 1.2] },
      {},
    ],
  },
  Folded: {
    time: 1.6,
    poses: [
      {},
      {
        'UpperArm.L': [0.4, 0, -0.38],
        'UpperArm.R': [0.4, 0, 0.38],
        'Forearm.L': [0.9, -0.35, 0],
        'Forearm.R': [0.9, 0.35, 0],
      },
      {
        'UpperArm.L': [0.4, 0, -0.38],
        'UpperArm.R': [0.4, 0, 0.38],
        'Forearm.L': [0.9, -0.35, 0],
        'Forearm.R': [0.9, 0.35, 0],
      },
      {},
    ],
  },
  HeadInHands: {
    time: 1.7,
    poses: [
      {},
      {
        'UpperArm.L': [1.15, 0, 0.3],
        'UpperArm.R': [1.15, 0, -0.3],
        'Forearm.L': [1.5, 0, 0],
        'Forearm.R': [1.5, 0, 0],
        Head: [0.23, 0, 0],
      },
      {
        'UpperArm.L': [1.1, 0, 0.3],
        'UpperArm.R': [1.1, 0, -0.3],
        'Forearm.L': [1.45, 0, 0],
        'Forearm.R': [1.45, 0, 0],
        Head: [0.26, 0, 0],
      },
      {},
    ],
  },
};
export function storeAvatarClips(instance: Object3D) {
  return Object.entries(poses).map(([name, { time, poses: frames }]) => {
    const times = name === 'Throw' ? [0, 0.12, 0.23, time] : [0, time * 0.28, time * 0.76, time];
    const tracks: (QuaternionKeyframeTrack | VectorKeyframeTrack)[] = [
      ...new Set(frames.flatMap(Object.keys)),
    ].flatMap((boneName) => {
      const bone = rigBone(instance, boneName);
      if (!bone) return [];
      const values = frames.flatMap((pose) =>
        bone.quaternion
          .clone()
          .multiply(new Quaternion().setFromEuler(new Euler(...(pose[boneName] ?? [0, 0, 0]))))
          .toArray(),
      );
      return [new QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values)];
    });
    const hips = instance.getObjectByName('Hips');
    const lowering = (
      { Flop: 0.19, Slide: 0.11, Kneel: 0.12, Huddle: 0.19 } as Record<string, number>
    )[name];
    if (hips && lowering) {
      tracks.push(
        new VectorKeyframeTrack(
          'Hips.position',
          times,
          [0, lowering, lowering, 0].flatMap((delta) => [
            hips.position.x,
            hips.position.y - delta,
            hips.position.z,
          ]),
        ),
      );
    }
    return new AnimationClip(name, time, tracks);
  });
}
