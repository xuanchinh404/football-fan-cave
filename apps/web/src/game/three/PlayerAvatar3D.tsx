import { AvatarStoreGear, rigBone, storeAvatarClips } from '../../store/avatarStore';
import { product } from '../../../../../packages/shared/store/catalog';
import type { Loadout } from '../../../../../packages/shared/store/state';
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  AnimationMixer,
  Box3,
  Color,
  Euler,
  Quaternion,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
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
type Playback = {
  motion: string;
  preview?: { name: string; sequence: number };
  face?: string;
  hideTemplateCrest?: boolean;
  loadout?: Loadout;
  teamColor?: string;
};
const avatarUrl = `/assets/3d/characters/${playerAvatarFile}`;
const avatarHeight = 1.9;

function ChibiFan({ motion, preview, face, hideTemplateCrest, loadout, teamColor }: Playback) {
  const { scene, animations: baseAnimations } = useLoader(GLTFLoader, avatarUrl, (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder),
  );
  const dye = useMemo(() => ({
    shirt: { value: new Color() }, shorts: { value: new Color() }, shoes: { value: new Color() },
    enabled: { value: new Vector3() },
  }), []);
  useEffect(() => {
    const shirt = product(loadout?.torso);
    const shorts = product(loadout?.legs);
    const shoes = product(loadout?.feet);
    dye.shirt.value.set(shirt?.clubVariant ? teamColor || '#cf243f' : shirt?.color ?? '#cf243f');
    dye.shorts.value.set(shorts?.color ?? '#25324c');
    dye.shoes.value.set(shoes?.color ?? '#272842');
    dye.enabled.value.set(Number(!!shirt), Number(!!shorts && shorts.id !== 'F13'), Number(!!shoes && shoes.id !== 'F14'));
  }, [dye, loadout, teamColor]);
  const { instance, origin, scale, morphs, kit } = useMemo(() => {
    const instance = clone(scene);
    const morphs: Mesh[] = [];
    const kit = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    const bounds = new Box3().setFromObject(instance, true);
    const center = bounds.getCenter(new Vector3());
    const height = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid chibi avatar bounds');
    instance.traverse((node) => {
      if (node instanceof Mesh) {
        if (
          node.material instanceof MeshStandardMaterial &&
          node.material.map
        ) {
          const original = node.material;
          let fabric = kit.get(original);
          if (!fabric) {
            fabric = original.clone();
            fabric.customProgramCacheKey = () => hideTemplateCrest ? 'store-dye-crest-free' : 'store-dye';
            fabric.onBeforeCompile = (shader) => {
              shader.uniforms.storeShirt = dye.shirt;
              shader.uniforms.storeShorts = dye.shorts;
              shader.uniforms.storeShoes = dye.shoes;
              shader.uniforms.storeEnabled = dye.enabled;
              shader.vertexShader = 'varying vec3 vStoreBind;\n' + shader.vertexShader.replace(
                '#include <begin_vertex>', '#include <begin_vertex>\nvStoreBind = position;',
              );
              shader.fragmentShader = 'varying vec3 vStoreBind;\nuniform vec3 storeShirt, storeShorts, storeShoes, storeEnabled;\n' + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `
                #include <map_fragment>
                #ifdef USE_MAP
                  ${hideTemplateCrest ? `vec2 atlas = vMapUv * 1024.0;
                  vec2 patchA = atlas - vec2(61.0, 38.0);
                  vec2 patchB = atlas - vec2(267.0, 169.0);
                  vec2 patchC = atlas - vec2(124.0, 306.0);
                  diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(map, (vec2(85.0, 39.0) + patchA * 0.22) / 1024.0).rgb,
                    1.0 - smoothstep(0.83, 1.12, length(patchA / vec2(13.0, 14.0))));
                  diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(map, (vec2(240.0, 167.0) + patchB * 0.22) / 1024.0).rgb,
                    1.0 - smoothstep(0.83, 1.12, length(patchB / vec2(14.0, 14.0))));
                  diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(map, (vec2(143.0, 307.0) + patchC * 0.22) / 1024.0).rgb,
                    1.0 - smoothstep(0.83, 1.12, length(patchC / vec2(14.0, 15.0))));
                  ` : ''}
                  float height = vStoreBind.y;
                  float lightness = clamp(dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)) * 0.65 + 0.5, 0.0, 1.0);
                  float shirtMask = smoothstep(0.32, 0.344, height) * (1.0-smoothstep(0.56, 0.575, height)) *
                    (1.0-smoothstep(0.132, 0.177, abs(vStoreBind.x)));
                  float shortsMask = smoothstep(0.21, 0.232, height) * (1.0-smoothstep(0.33, 0.353, height));
                  float shoeMask = 1.0-smoothstep(0.072, 0.096, height);
                  diffuseColor.rgb = mix(diffuseColor.rgb, storeShirt * lightness, shirtMask * storeEnabled.x * 0.92);
                  diffuseColor.rgb = mix(diffuseColor.rgb, storeShorts * lightness, shortsMask * storeEnabled.y);
                  diffuseColor.rgb = mix(diffuseColor.rgb, storeShoes * lightness, shoeMask * storeEnabled.z);
                #endif
              `,
              );
            };
            kit.set(original, fabric);
          }
          node.material = fabric;
        }
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
      kit,
    };
  }, [scene, hideTemplateCrest, dye]);
  const animations = useMemo(() => [...baseAnimations, ...storeAvatarClips(instance)], [baseAnimations, instance]);
  useEffect(() => () => kit.forEach((material) => material.dispose()), [kit]);
  const mixer = useMemo(() => new AnimationMixer(instance), [instance]);
  const current = useRef<AnimationAction | null>(null);
  const carry = useMemo(() => [
    { bone: rigBone(instance, 'UpperArm.R'), offset: new Quaternion().setFromEuler(new Euler(0.23, 0, -0.12)) },
    { bone: rigBone(instance, 'Forearm.R'), offset: new Quaternion().setFromEuler(new Euler(-0.67, 0.1, 0)) },
  ].map((part) => ({ ...part, inverse: part.offset.clone().invert(), applied: false })), [instance]);
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
    for (const part of carry) {
      if (part.applied) part.bone?.quaternion.multiply(part.inverse);
      part.applied = false;
    }
    mixer.update(step);
    if (loadout?.hand && motion !== 'Throw') {
      for (const part of carry) {
        part.bone?.quaternion.multiply(part.offset);
        part.applied = true;
      }
    }
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
    <group>
      <group scale={scale}><primitive object={instance} position={origin} /></group>
      <AvatarStoreGear instance={instance} loadout={loadout} teamColor={teamColor} />
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
