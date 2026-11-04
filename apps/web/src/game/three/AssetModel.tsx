import { useEffect, useMemo, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';

type Props = {
  asset: string;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  tint?: string;
  solid?: boolean;
  animation?: string;
};
export function AssetModel({
  asset,
  position,
  scale = 1,
  rotation,
  tint,
  solid = true,
  animation,
}: Props) {
  const gltf = useLoader(GLTFLoader, `/models/${asset}.glb`);
  const instance = useMemo(() => {
    const root = clone(gltf.scene);
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.userData.cameraSolid = solid;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      const copied = materials.map((m) => {
        const copy = m.clone() as THREE.MeshStandardMaterial;
        if (copy.name === 'Faction' && tint) copy.color.set(tint);
        if (copy.name === 'Stone') copy.color.set('#5b719d');
        if (copy.name === 'Ivory') copy.color.set('#bac8d4');
        if (copy.name === 'Gold') {
          copy.envMapIntensity = 1.5;
        }
        return copy;
      });
      o.material = Array.isArray(o.material) ? copied : copied[0];
    });
    return root;
  }, [gltf, tint, solid]);
  const mixer = useMemo(() => new THREE.AnimationMixer(instance), [instance]);
  const previous = useRef<THREE.AnimationAction | null>(null);
  useEffect(() => {
    if (!animation) return;
    const clip = gltf.animations.find((c) => c.name === animation || c.name.endsWith(animation));
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().fadeIn(0.18).play();
    previous.current?.fadeOut(0.18);
    previous.current = action;
  }, [animation, mixer, gltf]);
  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(instance);
      instance.traverse((o) => {
        if (o instanceof THREE.Mesh)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
    },
    [instance, mixer],
  );
  useFrame((_, dt) => mixer.update(Math.min(dt, 0.08)));
  return <primitive object={instance} position={position} scale={scale} rotation={rotation} />;
}
