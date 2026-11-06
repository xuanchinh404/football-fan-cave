import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  GRAND_LAMPS,
  GRAND_CLIFFS,
  GRAND_SLICE_GARDENS,
  GRAND_SURFACES,
  GRAND_SLICE_TREES,
  grandHeight,
  type CAVES,
} from '../../../../../packages/shared/grandHall';
import { BlenderAsset, type Placement } from './BlenderAsset';
import { Label } from './Models';
import { AssetModel } from './AssetModel';
import type { Quality } from './GrandHall';

type Cave = (typeof CAVES)[number];
const statue: Placement[] = [{ position: [0, 0, 3] }];
const paving: Placement[] = [{ position: [0, 0, 11] }];
const empty: Placement[] = [{ position: [0, 0, 0] }];
const ledges = [10.95, 21.91, 32.85].map((x) =>
  [-x, x].map((side): Placement => ({ position: [side, -0.22, -22.55] })),
);
export const sliceCliff = ({ x, z }: (typeof GRAND_CLIFFS)[number]) =>
  z === -38 && Math.abs(x) < 25;
const ridge: Placement[] = GRAND_CLIFFS.filter(sliceCliff).map(({ x, z }, i) => ({
  position: [x, 3.1, z + 0.4],
  yaw: i * 1.7,
  scale: 0.78 + 0.28 * Math.cos(i * 2.6) ** 2,
}));
const gardens: Placement[] = GRAND_SLICE_GARDENS.map(({ x, z, yaw }) => ({
  position: [x, grandHeight(x, z) ?? 0, z],
  yaw,
}));
const cascades: Placement[] = [-21.9, 21.9].map((x) => ({ position: [x, -0.17, -22] }));
const trees: Placement[][] = GRAND_SLICE_TREES.map(({ x, z, yaw }) => [
  {
    position: [x, grandHeight(x, z) ?? 0, z],
    yaw,
  },
]);

export function RedDevilsGateway({ cave, quality }: { cave: Cave; quality: Quality }) {
  const energy = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (energy.current && quality !== 'low') energy.current.uniforms.time.value = clock.elapsedTime;
  });
  return (
    <group
      name="cave-united"
      userData={{ caveId: cave.id, tier: cave.tier }}
      position={[cave.x, cave.height, cave.z]}
    >
      <BlenderAsset
        asset="red-devils-gateway"
        placements={empty}
        cameraSolid
        fallback={<AssetModel asset="portal-grand" tint={cave.color} />}
      />
      <Label
        text="HANG QUỶ ĐỎ"
        position={[0, 7.6, 1.71]}
        width={6.5}
        background="#630d21"
        color="#ffe3a8"
      />
      <mesh position={[0, 3.47, -1.15]}>
        <planeGeometry args={[6.7, 7.1]} />
        <shaderMaterial
          ref={energy}
          uniforms={{ time: { value: 0 } }}
          vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
          fragmentShader={`
            uniform float time;
            varying vec2 v;
            void main(){
              vec2 p=vec2((v.x-.5)*2., v.y*2.-1.);
              float radius=length(vec2(p.x,max(0.,p.y)));
              if(radius>1.) discard;
              float drift=p.x+.1*sin(p.y*5.+time*.51)+.035*sin(p.y*14.-time*1.27);
              float curtains=pow(.5+.5*sin(drift*18.+time*.34),3.);
              float innerGlow=pow(max(0.,1.-length(p*vec2(1.2,.46))),3.);
              float sparks=pow(max(0.,sin(drift*73.)*sin(p.y*91.-time*2.)),26.);
              float rim=pow(radius,14.)*(.67+.33*sin(p.y*8.-time*1.1));
              vec3 color=vec3(.12,.003,.009)
                + vec3(.86,.048,.01)*(.32*curtains+.77*innerGlow)
                + vec3(1.55,.34,.03)*(rim+.33*sparks);
              gl_FragColor=vec4(color,1.);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `}
        />
      </mesh>
      {quality !== 'low' && (
        <pointLight color="#ff642c" position={[0, 2.35, 2.1]} intensity={58} distance={12} />
      )}
    </group>
  );
}

export function GoldenBall({ quality }: { quality: Quality }) {
  return (
    <>
      <BlenderAsset
        asset="golden-ball-garden"
        placements={statue}
        fallback={<AssetModel asset="golden-football" position={statue[0].position} />}
      />
      {quality !== 'low' && (
        <pointLight position={[1.8, 1.5, 5.1]} color="#ffbd62" intensity={29} distance={7} />
      )}
      {/* A simple ray target keeps the follow camera outside the ball and pedestal. */}
      <mesh position={[0, 2.44, 3]} visible={false} userData={{ cameraSolid: true }}>
        <cylinderGeometry args={[1.44, 2.12, 4.9, 16]} />
      </mesh>
    </>
  );
}

export function SliceLandscape({ quality }: { quality: Quality }) {
  return (
    <>
      <BlenderAsset asset="weathered-spire" placements={ridge} shadow={quality === 'high'} />
      <BlenderAsset asset="azalea-bed" placements={gardens} shadow={false} />
      <BlenderAsset asset="plaza-promenade" placements={paving} shadow={false} />
      {(['slate-ledge-a', 'slate-ledge-b', 'slate-ledge-c'] as const).map((asset, i) => (
        <BlenderAsset key={asset} asset={asset} placements={ledges[i]} />
      ))}
      <BlenderAsset
        asset="terraced-cascade"
        placements={cascades}
        shadow={false}
        animatedWater={quality !== 'low'}
      />
      {trees.map((placements, i) => (
        <BlenderAsset
          key={i}
          placements={placements}
          asset={quality === 'low' ? 'ornamental-cherry-low' : 'ornamental-cherry'}
          lod={quality === 'medium' ? { asset: 'ornamental-cherry-low', distance: 39 } : undefined}
        />
      ))}
    </>
  );
}

export const sliceLamp = (x: number, z: number) =>
  Math.abs(x) === 9 || (Math.abs(x) === 6 && z === -29);
const lamps: Placement[] = GRAND_LAMPS.flatMap(({ x, z }) => {
  const y = grandHeight(x, z);
  return y === undefined || !sliceLamp(x, z) ? [] : [{ position: [x, y, z] }];
});
const west = GRAND_SURFACES.find((surface) => surface.id === 'west-bridge')!;
const stair = GRAND_SURFACES.find((surface) => surface.id === 'main-stairs')!;
const bridgePlacement: Placement[] = [{ position: [west.x, west.south, west.z] }];
const stairPlacement: Placement[] = [{ position: [stair.x, stair.south, stair.z] }];

export function SliceRoute({
  quality,
  bridgeFallback,
  stairFallback,
}: {
  quality: Quality;
  bridgeFallback: ReactNode;
  stairFallback: ReactNode;
}) {
  return (
    <>
      <BlenderAsset
        asset="west-stone-bridge"
        placements={bridgePlacement}
        fallback={bridgeFallback}
      />
      <BlenderAsset
        asset="ceremonial-stairs"
        placements={stairPlacement}
        fallback={stairFallback}
      />
      <BlenderAsset
        asset={quality === 'low' ? 'amber-lamp-low' : 'amber-lamp'}
        placements={lamps}
        shadow={false}
      />
    </>
  );
}
