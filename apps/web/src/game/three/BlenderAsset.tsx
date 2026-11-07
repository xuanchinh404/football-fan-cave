import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import manifest from '../../../../../assets/blender-manifest.json';

const publicModels = manifest.output.slice(manifest.output.indexOf('/public/') + '/public'.length);

export type BlenderId = (typeof manifest.assets)[number]['id'];
export type Placement = {
  position: [number, number, number];
  yaw?: number;
  scale?: number | [number, number, number];
};

type Props = {
  asset: BlenderId;
  placements: readonly Placement[];
  fallback?: ReactNode;
  shadow?: boolean;
  cameraSolid?: boolean;
  animatedWater?: boolean;
  lod?: { asset: BlenderId; distance: number };
};

export class AssetBoundary extends Component<
  { asset: string; fallback?: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error(`3D asset ${this.props.asset} could not load`, error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function waterMaterial(source: THREE.MeshStandardMaterial, clock: { value: number }) {
  const material = source.clone();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.cascadeTime = clock;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCascadePosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCascadePosition = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float cascadeTime;\nvarying vec3 vCascadePosition;',
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float x = vCascadePosition.x;
        float fall = vCascadePosition.y * 22.0 + cascadeTime * 10.0;
        float threads = pow(0.5 + 0.5 * sin(x * 39.0 + sin(fall * 0.21)), 5.0);
        float glints = pow(0.5 + 0.5 * sin(fall + sin(x * 24.0) * 1.9), 9.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.91, 0.98),
                               threads * 0.59 + glints * 0.21);
      `,
      );
  };
  material.customProgramCacheKey = () => 'terraced-cascade-flow';
  return material;
}

type PlacedProps = Omit<Props, 'asset' | 'lod'> & { asset: string; url: string; fitHeight?: number };

function StaticAsset({
  asset,
  url,
  fitHeight,
  placements,
  shadow = true,
  cameraSolid = false,
  animatedWater = false,
}: PlacedProps) {
  const { scene } = useLoader(GLTFLoader, url, (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder),
  );
  const clock = useMemo(() => ({ value: 0 }), []);
  const { root, instances, materials } = useMemo(() => {
    const root = new THREE.Group();
    root.name = asset;
    const instances: THREE.InstancedMesh[] = [];
    const materials: THREE.Material[] = [];
    const matrix = new THREE.Matrix4();
    const transform = new THREE.Object3D();
    const normalization = new THREE.Matrix4();
    scene.updateMatrixWorld(true);
    if (fitHeight) {
      const bounds = new THREE.Box3().setFromObject(scene);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      if (size.y <= 0) throw new Error('Model has no height');
      const scale = fitHeight / size.y;
      normalization.makeScale(scale, scale, scale);
      normalization.setPosition(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    }
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      let material = object.material;
      if (
        animatedWater &&
        material instanceof THREE.MeshStandardMaterial &&
        material.name === 'Cascade flow'
      ) {
        material = waterMaterial(material, clock);
        materials.push(material);
      }
      const batch = new THREE.InstancedMesh(object.geometry, material, placements.length);
      batch.castShadow = shadow;
      batch.receiveShadow = true;
      batch.userData.cameraSolid = cameraSolid;
      placements.forEach(({ position, yaw = 0, scale = 1 }, i) => {
        transform.position.fromArray(position);
        transform.rotation.set(0, yaw, 0);
        if (Array.isArray(scale)) transform.scale.fromArray(scale);
        else transform.scale.setScalar(scale);
        transform.updateMatrix();
        batch.setMatrixAt(i, matrix.multiplyMatrices(transform.matrix, normalization).multiply(object.matrixWorld));
      });
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      instances.push(batch);
      root.add(batch);
    });
    return { root, instances, materials };
  }, [asset, scene, placements, shadow, cameraSolid, animatedWater, clock, fitHeight]);
  useEffect(
    () => () => {
      instances.forEach((instance) => instance.dispose());
      materials.forEach((material) => material.dispose());
    },
    [instances, materials],
  );
  useFrame(({ clock: sceneClock }) => {
    if (animatedWater) clock.value = sceneClock.elapsedTime;
  });
  return <primitive object={root} />;
}

export function PlacedGlb({ asset, url, fallback = null, ...props }: PlacedProps) {
  return (
    <AssetBoundary key={url} asset={asset} fallback={fallback}>
      <Suspense fallback={fallback}>
        <StaticAsset asset={asset} url={url} {...props} />
      </Suspense>
    </AssetBoundary>
  );
}

/** Static Blender GLBs share geometry and textures and batch repeated placements per material. */
export function BlenderAsset({ asset, lod, fallback = null, ...props }: Props) {
  const [far, setFar] = useState(false);
  useFrame(({ camera }) => {
    if (!lod || props.placements.length !== 1) return;
    const [x, y, z] = props.placements[0].position;
    const d = Math.hypot(camera.position.x - x, camera.position.y - y, camera.position.z - z);
    if (far && d < lod.distance - 2) setFar(false);
    if (!far && d > lod.distance + 2) setFar(true);
  });
  const selected = far && lod ? lod.asset : asset;
  return <PlacedGlb asset={selected} url={`${publicModels}/${selected}.glb`} fallback={fallback} {...props} />;
}
