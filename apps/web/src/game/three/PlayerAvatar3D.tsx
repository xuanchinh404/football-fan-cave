import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import { Box3, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const playerAvatarFile = 'chibi-fan-07.glb';
const avatarUrl = `/assets/3d/characters/${playerAvatarFile}`;
const avatarHeight = 1.9;

function ChibiFan() {
  const { scene } = useLoader(GLTFLoader, avatarUrl, (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder),
  );
  const { instance, origin, scale } = useMemo(() => {
    // This export is unskinned. Clone the nodes and share their geometry, PBR materials and textures.
    const instance = scene.clone();
    const bounds = new Box3().setFromObject(instance, true);
    const center = bounds.getCenter(new Vector3());
    const height = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid chibi avatar bounds');
    instance.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return {
      instance,
      origin: new Vector3(-center.x, -bounds.min.y, -center.z),
      scale: avatarHeight / height,
    };
  }, [scene]);
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

export function PlayerAvatar3D({ fallback }: { fallback: ReactNode }) {
  return (
    <AvatarBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ChibiFan />
      </Suspense>
    </AvatarBoundary>
  );
}
