import { CatmullRomCurve3, Vector3 } from 'three';
import { PlacedGlb, type Placement } from './BlenderAsset';
import { Doorway, Plaque, type V3 } from './IndoorKit';

const modelDirectory = '../../../../../public/assets/3d/red-devils';
const models = import.meta.glob('../../../../../public/assets/3d/red-devils/*.glb', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export function CaveModel({
  asset,
  placements,
  solid = false,
  shadow = false,
}: {
  asset: string;
  placements: readonly Placement[];
  solid?: boolean;
  shadow?: boolean;
}) {
  return (
    <PlacedGlb
      asset={asset}
      url={models[`${modelDirectory}/${asset}.glb`]}
      placements={placements}
      cameraSolid={solid}
      shadow={shadow}
    />
  );
}

const origin: Placement[] = [{ position: [0, 0, 0] }];
const crystals: Placement[] = [
  ...[-1, 1].flatMap((side) =>
    Array.from(
      { length: 8 },
      (_, i): Placement => ({
        position: [side * (18.9 - (i % 2) * 0.45), 0, -20 + i * 3.65],
        scale: 0.75 + (i % 3) * 0.33,
        yaw: i * 1.35,
      }),
    ),
  ),
  { position: [-7.1, 0, -8.1], scale: 1.3, yaw: 1 },
  { position: [7.1, 0, -8.1], scale: 1.55, yaw: 0.4 },
  { position: [-8.6, 0, 2.3], scale: 1.35, yaw: -0.5 },
  { position: [14.1, 0, 1.8], scale: 1.12 },
  { position: [-10.8, 5.7, -8.3], scale: 1.55, yaw: 1.3 },
  { position: [10.8, 5.3, -8.3], scale: 1.25, yaw: 0.5 },
];
const plants: Placement[] = [
  { position: [-17.6, 0, -4.2], scale: 1.1 },
  { position: [-10.1, 0, -4.3], scale: 0.85, yaw: 1.3 },
  { position: [-12.6, 0, 0.7], scale: 0.65 },
  { position: [-5.9, 0, 5.8], scale: 0.85 },
  { position: [5.9, 0, 5.8], scale: 1.2, yaw: 2.2 },
  { position: [10.8, 0, -5.7], scale: 0.95 },
];
const lamps: Placement[] = [
  { position: [-2, 1.9, -5.72] },
  { position: [2, 1.9, -5.72] },
  { position: [-10.75, 0.72, -3.7] },
  { position: [-17, 0.72, -3.7] },
  { position: [-1.72, 2.4, -10.25] },
  { position: [1.72, 2.4, -10.25] },
  { position: [-2.95, 0.72, 6.7] },
  { position: [2.95, 0.72, 6.7] },
];
const trident: Placement[] = [{ position: [0, 1.3, -6.68] }];
const paths = [
  [
    [-2.65, 7.7],
    [-2.95, 3.5],
    [-4.2, -1.3],
    [-5, -4.5],
    [-4.25, -7.7],
    [-2, -9.3],
  ],
  [
    [2.65, 7.7],
    [2.95, 3.5],
    [4.2, -1.3],
    [5, -4.5],
    [4.25, -7.7],
    [2, -9.3],
  ],
  [
    [-4.2, -1.3],
    [-7.9, -2.1],
    [-10.6, -3],
    [-13.8, -3.35],
  ],
  [
    [-4.2, -1.3],
    [-7.5, 1.1],
    [-10.1, 1.45],
    [-13.4, 1.5],
  ],
  [
    [-1.65, -9.25],
    [-1.65, -14],
  ],
  [
    [1.65, -9.25],
    [1.65, -14],
  ],
].map((points) => new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0.035, z))));

function TrellisProp({
  asset,
  placements,
  height,
  fallback,
}: {
  asset: string;
  placements: Placement[];
  height: number;
  fallback: React.ReactNode;
}) {
  const url = models[`${modelDirectory}/${asset}-trellis.glb`];
  return url ? (
    <PlacedGlb
      asset={asset}
      url={url}
      placements={placements}
      fitHeight={height}
      fallback={fallback}
      shadow={false}
    />
  ) : (
    fallback
  );
}

export function RedDevilsSet({ detailed }: { detailed: boolean }) {
  return (
    <group name="reference-cave-set">
      <CaveModel asset="vault" placements={origin} solid />
      <CaveModel asset="floor" placements={origin} />
      <CaveModel asset="ruby" placements={crystals} />
      <CaveModel asset="plant" placements={plants} />
      <TrellisProp
        asset="lantern"
        placements={lamps}
        height={0.67}
        fallback={<CaveModel asset="lantern" placements={lamps} />}
      />
      <TrellisProp
        asset="trident"
        placements={trident}
        height={2.4}
        fallback={<CaveModel asset="trident" placements={trident} />}
      />
      {paths.map((path, i) => (
        <mesh key={i}>
          <tubeGeometry args={[path, 36, 0.019, 4, false]} />
          <meshStandardMaterial color="#ff9b32" emissive="#ff761a" emissiveIntensity={1.65} />
        </mesh>
      ))}
      {detailed && (
        <>
          <pointLight position={[-7.1, 1.7, -8.1]} intensity={28} distance={7} color="#ff3150" />
          <pointLight position={[7.1, 1.7, -8.1]} intensity={28} distance={7} color="#ff3150" />
          <pointLight position={[-14.4, 2.1, 1.8]} intensity={39} distance={8} color="#bb55ff" />
        </>
      )}
    </group>
  );
}

export function CaveGate({
  position,
  width,
  rotation = 0,
  title,
  subtitle,
}: {
  position: V3;
  width: number;
  rotation?: number;
  title: string;
  subtitle: string;
}) {
  const scale = width / 4.06;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <PlacedGlb
        asset="arch"
        url={models[`${modelDirectory}/arch.glb`]}
        placements={[{ position: [0, 0, 0], scale: [scale, 1, 1] }]}
        cameraSolid
        fallback={<Doorway position={[0, 0, 0]} width={width} title={title} subtitle={subtitle} />}
      />
      <Plaque lines={[title, subtitle]} position={[0, 5.25, 0.6]} width={width + 1.65} height={1} />
    </group>
  );
}
