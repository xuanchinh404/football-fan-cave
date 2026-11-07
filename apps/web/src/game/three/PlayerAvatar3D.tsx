import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  AnimationMixer,
  Box3,
  LoopOnce,
  LoopRepeat,
  Mesh,
  Vector3,
  type AnimationAction,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { clone } from 'three/addons/utils/SkeletonUtils.js';

export const playerAvatarFile = 'chibi-fan-07-rigged.glb';
export const avatarClips = [
  'Idle',
  'Walk',
  'Run',
  'Jump',
  'SitDown',
  'SitIdle',
  'StandUp',
  'Wave',
  'Cheer',
  'Sad',
  'Cry',
  'Laugh',
  'Taunt',
  'Angry',
  'Celebrate',
] as const;
export const avatarFaces = ['Blink', 'Smile', 'Sad', 'Angry', 'Surprised', 'Cry'] as const;
const loops = new Set(['Idle', 'Walk', 'Run', 'SitIdle']);
const gestureFaces: Record<string, string> = {
  Laugh: 'Smile',
  Cheer: 'Smile',
  Celebrate: 'Smile',
  Sad: 'Sad',
  Cry: 'Cry',
  Angry: 'Angry',
  Jump: 'Surprised',
};
type Playback = { motion: string; preview?: { name: string; sequence: number }; face?: string };
const avatarUrl = `/assets/3d/characters/${playerAvatarFile}`;
const avatarHeight = 1.9;

function ChibiFan({ motion, preview, face }: Playback) {
  const { scene, animations } = useLoader(GLTFLoader, avatarUrl, (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder),
  );
  const { instance, origin, scale, morphs } = useMemo(() => {
    const instance = clone(scene);
    const morphs: Mesh[] = [];
    const bounds = new Box3().setFromObject(instance, true);
    const center = bounds.getCenter(new Vector3());
    const height = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid chibi avatar bounds');
    instance.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.morphTargetInfluences) morphs.push(node);
      }
    });
    return {
      instance,
      origin: new Vector3(-center.x, -bounds.min.y, -center.z),
      scale: avatarHeight / height,
      morphs,
    };
  }, [scene]);
  const mixer = useMemo(() => new AnimationMixer(instance), [instance]);
  const current = useRef<AnimationAction | null>(null);
  const wasSeated = useRef(false);
  const elapsed = useRef(0);
  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(instance);
      current.current = null;
    },
    [mixer, instance],
  );
  useEffect(() => {
    const play = (name: string) => {
      const clip = animations.find((item) => item.name === name);
      if (!clip) return;
      const previous = current.current;
      const action = mixer.clipAction(clip);
      action.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);
      action.setLoop(loops.has(name) ? LoopRepeat : LoopOnce, loops.has(name) ? Infinity : 1);
      action.clampWhenFinished = true;
      if (previous && previous !== action) {
        previous.fadeOut(0.15);
        action.fadeIn(0.15);
      }
      action.play();
      current.current = action;
    };
    const seated = motion === 'SitIdle';
    const transition = seated === wasSeated.current ? null : seated ? 'SitDown' : 'StandUp';
    wasSeated.current = seated;
    const requested = preview?.name ?? transition ?? motion;
    play(animations.some((clip) => clip.name === requested) ? requested : 'Idle');
    const finished = ({ action }: { action: AnimationAction }) => {
      if (action !== current.current || preview) return;
      if (transition) play(motion);
    };
    mixer.addEventListener('finished', finished);
    return () => mixer.removeEventListener('finished', finished);
  }, [animations, mixer, motion, preview]);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    mixer.update(step);
    elapsed.current += step;
    const action = current.current;
    const name = action?.getClip().name ?? 'Idle';
    const phase = action ? action.time / action.getClip().duration : 0;
    const blink = Math.max(0, 1 - Math.abs((elapsed.current % 4.1) - 3.7) / 0.1);
    for (const mesh of morphs) {
      for (const [target, index] of Object.entries(mesh.morphTargetDictionary ?? {})) {
        mesh.morphTargetInfluences![index] = face
          ? Number(face === target)
          : target === gestureFaces[name]
            ? Math.sin(Math.PI * phase) * 0.8
            : target === 'Blink'
              ? blink
              : 0;
      }
    }
  });
  return (
    <group scale={scale}>
      <primitive object={instance} position={origin} />
    </group>
  );
}

class AvatarBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function PlayerAvatar3D({ fallback, ...playback }: Playback & { fallback: ReactNode }) {
  return (
    <AvatarBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ChibiFan {...playback} />
      </Suspense>
    </AvatarBoundary>
  );
}
