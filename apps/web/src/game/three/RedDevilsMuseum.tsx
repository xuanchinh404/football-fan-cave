import { Suspense, useEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  PerspectiveCamera,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import {
  hallArchive,
  hallCoaches,
  hallHistory,
  hallLanguage,
  hallStatue,
  hallText,
  hallTrophies,
  historyWallX,
  trophyCabinet,
  type HallLanguage,
} from '../../../../../packages/shared/museum/hall';
import { AssetBoundary, PlacedGlb } from './BlenderAsset';
import { Exhibit } from './Exhibit';
import type { Quality } from './GrandHall';
import { Doorway, GOLD, InteriorColliders, Plaque, RoomReflections, Trident } from './IndoorKit';
import { ManagerPortraitBoard } from './ManagerPortraitBoard';
import { Box } from './Models';
import { sceneBounds } from './worldLayout';

const map = 'hall-of-legends';
const bounds = sceneBounds(map);
const width = bounds.right - bounds.left;
const depth = bounds.bottom - bounds.top;
const spring = 6.65;
const rise = 4;
const gold = '#d7a14a';
const burgundy = '#410b17';
const trim = '#38201c';
const archPoints = Array.from({ length: 41 }, (_, i) => {
  const angle = (i * Math.PI) / 40;
  return new Vector3((width / 2) * Math.cos(angle), spring + rise * Math.sin(angle), 0);
});
const arch = new CatmullRomCurve3(archPoints);

function Vault() {
  const geometry = useMemo(() => {
    const positions = [];
    const indices = [];
    for (const point of archPoints) {
      positions.push(point.x, point.y, bounds.top, point.x, point.y, bounds.bottom);
    }
    for (let i = 0; i < archPoints.length - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const roof = new BufferGeometry();
    roof.setAttribute('position', new Float32BufferAttribute(positions, 3));
    roof.setIndex(indices);
    roof.computeVertexNormals();
    return roof;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} userData={{ cameraSolid: true }}>
        <meshStandardMaterial color="#571623" side={DoubleSide} roughness={0.75} />
      </mesh>
      {[-11.78, -5.8, 0, 5.8, 11.78].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh userData={{ cameraSolid: true }}>
            <tubeGeometry args={[arch, 56, 0.24, 8, false]} />
            <meshStandardMaterial color="#9c673f" roughness={0.54} />
          </mesh>
          {[-0.25, 0.25].map((edge) => (
            <mesh key={edge} position={[0, -0.14, edge]}>
              <tubeGeometry args={[arch, 56, 0.065, 6, false]} />
              <meshStandardMaterial color={gold} metalness={0.55} roughness={0.37} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function StoneFloor() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#b8a18e';
    context.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * 64;
        const y = row * 64;
        const shade = ['#e8d4b9', '#d8bda5', '#ddc8b2', '#f0d9bf'][
          (row * 3 + col * 7 + row * col) % 4
        ];
        context.fillStyle = shade;
        context.fillRect(x + 1, y + 1, 62, 62);
        context.strokeStyle = '#9d857428';
        for (let vein = 0; vein < 4; vein++) {
          context.beginPath();
          context.moveTo(x + 2, y + 17 + vein * 10);
          context.bezierCurveTo(
            x + 25,
            y + 22 + vein * 8,
            x + 38,
            y + 3 + vein * 10,
            x + 62,
            y + 10 + vein * 9,
          );
          context.stroke();
        }
      }
    }
    const tiles = new CanvasTexture(canvas);
    tiles.colorSpace = SRGBColorSpace;
    tiles.wrapS = tiles.wrapT = RepeatWrapping;
    tiles.repeat.set(width / 5.6, depth / 5.6);
    tiles.anisotropy = 8;
    return tiles;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={texture} roughness={0.33} metalness={0.12} />
    </mesh>
  );
}

function Sconce() {
  return (
    <group position={[0, 4.3, 0.4]}>
      <Box position={[0, 0, -0.07]} size={[0.35, 0.84, 0.12]} color={trim} solid={false} />
      <mesh>
        <cylinderGeometry args={[0.13, 0.19, 0.56, 6]} />
        <meshStandardMaterial color="#ffda88" emissive="#ffc076" emissiveIntensity={1.4} />
      </mesh>
      {[-0.32, 0.32].map((y) => (
        <Box key={y} position={[0, y, 0]} size={[0.37, 0.09, 0.32]} color={gold} solid={false} />
      ))}
    </group>
  );
}

function MuseumHall({ quality }: { quality: Quality }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || aspect >= 1) return;
    const originalFov = camera.fov;
    const verticalFov = (360 / Math.PI) * Math.atan(Math.tan((65 * Math.PI) / 360) / aspect);
    camera.fov = Math.max(originalFov, Math.min(110, verticalFov));
    camera.updateProjectionMatrix();
    return () => {
      camera.fov = originalFov;
      camera.updateProjectionMatrix();
    };
  }, [camera, aspect]);
  return (
    <>
      <RoomReflections intensity={0.67} />
      <color attach="background" args={['#2a131c']} />
      <hemisphereLight args={['#ffe8d3', '#744036', 0.78]} />
      <directionalLight
        position={[3, 10, 5]}
        color="#ffe2b4"
        intensity={0.78}
        castShadow={quality !== 'low'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-normalBias={0.04}
      />
      {[-9, 0, 9].map((x) => (
        <pointLight key={x} position={[x, 6.8, -7]} color="#ffc477" intensity={88} distance={24} />
      ))}
      {quality !== 'low' && (
        <pointLight position={[0, 6, 7]} color="#ffcf93" intensity={68} distance={24} />
      )}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[width / 2, 0.3, depth / 2]} position={[0, -0.3, 0]} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <CuboidCollider
              args={[0.25, 5.5, depth / 2]}
              position={[side * (width / 2 + 0.25), 5.5, 0]}
            />
            <CuboidCollider
              args={[width / 2, 5.5, 0.25]}
              position={[0, 5.5, side * (depth / 2 + 0.25)]}
            />
          </group>
        ))}
      </RigidBody>
      <StoneFloor />
      <Vault />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * 11.78, 4.15, -11.89]}
            size={[3.05, 7.7, 0.16]}
            color="#4d0b1b"
            solid={false}
          />
          {[-1.48, -1.37, 1.37, 1.48].map((offset) => (
            <Box
              key={offset}
              position={[side * 11.78 + offset, 4.15, -11.77]}
              size={[0.035, 7.65, 0.08]}
              color="#a46b3b"
              solid={false}
            />
          ))}
          <Box
            position={[side * 10.07, 3.85, -11.74]}
            size={[0.55, 7.7, 0.42]}
            color="#866145"
            solid={false}
          />
          {[0.27, 7.45].map((y) => (
            <Box
              key={y}
              position={[side * 10.07, y, -11.68]}
              size={[0.75, 0.32, 0.55]}
              color="#b28551"
              solid={false}
            />
          ))}
          <group position={[side * 10.08, 0.56, -11.67]}>
            <Sconce />
          </group>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box
            position={[side * (width / 2 + 0.25), spring / 2, 0]}
            size={[0.5, spring, depth]}
            color={burgundy}
          />
          <Box
            position={[0, 5.4, side * (depth / 2 + 0.25)]}
            size={[width, 10.8, 0.5]}
            color={burgundy}
          />
          {[0.23, 1.02, 6.42].map((y) => (
            <Box
              key={y}
              position={[side * (width / 2 - 0.06), y, 0]}
              size={[0.12, 0.11, depth]}
              color={gold}
              solid={false}
            />
          ))}
          {[-11.4, 1.9, 7.8, 11.6].map((z) => (
            <group
              key={z}
              position={[side * (width / 2 - 0.15), 0, z]}
              rotation={[0, (-side * Math.PI) / 2, 0]}
            >
              <Box
                position={[0, spring / 2, 0]}
                size={[0.75, spring, 0.36]}
                color="#9f7756"
                solid={false}
              />
              {[0.25, spring - 0.25].map((y) => (
                <Box
                  key={y}
                  position={[0, y, 0.06]}
                  size={[0.94, 0.32, 0.46]}
                  color="#d0a06b"
                  solid={false}
                />
              ))}
              <Sconce />
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.012, 0.65]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.4, 21.7]} />
        <meshStandardMaterial color="#620d1c" roughness={1} />
      </mesh>
      {[-3.1, -2.98, 2.98, 3.1].map((x) => (
        <mesh key={x} position={[x, 0.019, 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.032, 21.7]} />
          <meshStandardMaterial color={gold} />
        </mesh>
      ))}
      <group position={[0, 0.032, 3.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.48, 1.55, 48]} />
          <meshBasicMaterial color="#ca9152" />
        </mesh>
        <Trident position={[0, -0.87, 0.023]} scale={0.65} />
      </group>
    </>
  );
}

const cupAssets: Partial<Record<(typeof hallTrophies)[number]['group'], string>> = {
  league: 'cup-league',
  fa: 'cup-fa',
  'league-cup': 'cup-league-cup',
  europe: 'cup-europe',
  europa: 'cup-uefa',
  super: 'cup-super',
  world: 'cup-world',
  community: 'cup-shield',
};
const cupPlacement = [{ position: [0, 1.04, 0] as [number, number, number] }];
const winnersProfile = [
  [0, 0],
  [0.37, 0],
  [0.37, 0.13],
  [0.27, 0.21],
  [0.15, 0.36],
  [0.13, 0.58],
  [0.26, 0.77],
  [0.44, 1.13],
  [0.5, 1.43],
  [0.48, 1.48],
  [0.43, 1.43],
  [0.38, 1.13],
  [0.19, 0.77],
  [0.02, 0.68],
].map(([radius, y]) => new Vector2(radius, y));

function TrophyCabinet({
  trophy,
  lang,
}: {
  trophy: (typeof hallTrophies)[number];
  lang: HallLanguage;
}) {
  const { width: w, depth: d, height, z } = trophyCabinet;
  const asset = cupAssets[trophy.group];
  return (
    <group position={[trophy.x, 0, z]}>
      <Exhibit id={trophy.id}>
        <Box position={[0, 0.51, 0]} size={[w, 1.02, d]} color="#4b1420" />
        <Box position={[0, 1.02, 0]} size={[w, 0.07, d]} color={gold} />
        <Box position={[0, 2.2, -0.78]} size={[w, 2.34, 0.13]} color="#56121e" />
        <Box position={[0, height - 0.07, 0]} size={[w, 0.14, d]} color={trim} />
        {[0.12, height - 0.16].map((y) => (
          <Box
            key={y}
            position={[0, y, d / 2]}
            size={[w, 0.052, 0.08]}
            color={gold}
            solid={false}
          />
        ))}
        {[-1, 1].map((s) => (
          <Box
            key={s}
            position={[s * (w / 2 - 0.06), 2.18, d / 2 - 0.02]}
            size={[0.07, 2.22, 0.07]}
            color={gold}
          />
        ))}
        <mesh position={[0, height - 0.15, 0]}>
          <boxGeometry args={[1.2, 0.018, 0.1]} />
          <meshBasicMaterial color="#ffd589" />
        </mesh>
        <Plaque
          lines={[trophy.title[lang], `× ${trophy.seasons.length}`]}
          width={w - 0.12}
          height={0.62}
          position={[0, 0.51, 0.82]}
          background="#3c1019"
        />
        {asset ? (
          <PlacedGlb
            asset={asset}
            url={`/models/liverpool/${asset}.glb`}
            fitHeight={1.86}
            placements={cupPlacement}
            shadow={false}
          />
        ) : (
          <mesh position={[0, 1.05, 0]} scale={1.19}>
            <latheGeometry args={[winnersProfile, 18]} />
            <meshStandardMaterial color="#dbdce0" metalness={0.8} roughness={0.31} />
          </mesh>
        )}
      </Exhibit>
    </group>
  );
}

const bronze = '#a97045';
function BronzeForm({
  position,
  scale,
  rotation = 0,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: number;
}) {
  return (
    <mesh position={position} scale={scale} rotation={[0, 0, rotation]} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color={bronze} roughness={0.47} metalness={0.65} />
    </mesh>
  );
}

function FergusonBronze() {
  return (
    <group name="bronze-statue-placeholder">
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.27, 0, 0]}>
          <BronzeForm position={[0, 0.15, 0.13]} scale={[0.21, 0.15, 0.37]} />
          <BronzeForm position={[0, 0.8, 0]} scale={[0.22, 0.68, 0.21]} rotation={-side * 0.05} />
        </group>
      ))}
      <BronzeForm position={[0, 1.67, 0]} scale={[0.58, 0.69, 0.34]} />
      <BronzeForm position={[0, 2.28, 0.01]} scale={[0.17, 0.24, 0.18]} />
      <BronzeForm position={[0, 2.65, 0.02]} scale={[0.34, 0.43, 0.32]} />
      <BronzeForm position={[0, 2.61, 0.31]} scale={[0.095, 0.12, 0.09]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <BronzeForm
            position={[side * 0.49, 1.84, 0.13]}
            scale={[0.19, 0.42, 0.21]}
            rotation={side * 0.29}
          />
          <BronzeForm
            position={[side * 0.27, 1.95, 0.37]}
            scale={[0.15, 0.34, 0.16]}
            rotation={side * -0.8}
          />
          <BronzeForm
            position={[side * 0.075, 2.16, 0.43]}
            scale={[0.1, 0.18, 0.11]}
            rotation={side * -0.26}
          />
        </group>
      ))}
      <Box position={[0, 1.89, 0.322]} size={[0.068, 0.57, 0.028]} color="#734b32" solid={false} />
    </group>
  );
}
const statuePlacement = [{ position: [0, 0, 0] as [number, number, number] }];

function FergusonStatue({ lang, assetUrl }: { lang: HallLanguage; assetUrl?: string }) {
  const { x, z, width: w, depth: d, id } = hallStatue;
  return (
    <group position={[x, 0, z]}>
      <Exhibit id={id}>
        <Box position={[0, 0.11, 0]} size={[w, 0.22, d]} color="#422c2c" />
        <Box position={[0, 0.58, 0]} size={[w - 0.3, 0.92, d - 0.35]} color="#513a38" />
        <Box position={[0, 1.09, 0]} size={[w - 0.14, 0.12, d - 0.18]} color={gold} />
        <Plaque
          lines={['SIR ALEX FERGUSON', '1986–2013']}
          position={[0, 0.59, d / 2 - 0.13]}
          width={2.5}
          height={0.62}
          background="#30201f"
        />
        <group position={[0, 1.14, 0]} rotation={[0, 0.19, 0]}>
          {assetUrl ? (
            <PlacedGlb
              asset="ferguson-statue"
              url={assetUrl}
              fitHeight={3.08}
              placements={statuePlacement}
              fallback={<FergusonBronze />}
            />
          ) : (
            <FergusonBronze />
          )}
        </group>
        <group position={[0, 0, d / 2 - 0.13]}>
          {[-1.4, 1.4].map((post) => (
            <group key={post} position={[post, 0, 0]}>
              <mesh position={[0, 0.42, 0]}>
                <cylinderGeometry args={[0.045, 0.11, 0.84, 10]} />
                <meshStandardMaterial color={gold} metalness={0.62} roughness={0.39} />
              </mesh>
              <mesh position={[0, 0.88, 0]}>
                <sphereGeometry args={[0.086, 10, 8]} />
                <meshStandardMaterial color={gold} metalness={0.62} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.69, 0.02]}>
            <tubeGeometry args={[velvetRope, 20, 0.045, 6, false]} />
            <meshStandardMaterial color="#b3223e" roughness={1} />
          </mesh>
        </group>
        <pointLight position={[0, 4.85, 1.5]} color="#ffd088" intensity={42} distance={8} />
      </Exhibit>
      <Plaque
        lines={[lang === 'vi' ? 'TƯỢNG MINH HỌA' : 'STUDY IN BRONZE']}
        position={[0, 4.65, -0.9]}
        width={2.8}
        height={0.42}
      />
    </group>
  );
}

const velvetRope = new CatmullRomCurve3([
  new Vector3(-1.4, 0.13, 0),
  new Vector3(0, -0.17, 0),
  new Vector3(1.4, 0.13, 0),
]);

function HistoryPhoto({ url }: { url: string }) {
  const image = useLoader(TextureLoader, url);
  image.colorSpace = SRGBColorSpace;
  return (
    <mesh position={[0, 0.3, 0.155]}>
      <planeGeometry args={[2.2, 1.47]} />
      <meshBasicMaterial map={image} toneMapped={false} />
    </mesh>
  );
}

function HistoryWall({ lang }: { lang: HallLanguage }) {
  const center = (hallHistory[0].z + hallHistory[hallHistory.length - 1].z) / 2;
  const span = hallHistory[hallHistory.length - 1].z - hallHistory[0].z + 2.95;
  return (
    <group position={[historyWallX, 0, center]} rotation={[0, -Math.PI / 2, 0]}>
      <Box position={[0, 3.16, 0]} size={[span, 4.48, 0.24]} color={gold} solid={false} />
      <Box
        position={[0, 3.16, 0.07]}
        size={[span - 0.16, 4.29, 0.14]}
        color="#54121d"
        solid={false}
      />
      <Plaque
        lines={[hallText[lang].history.toUpperCase()]}
        position={[0, 4.55, 0.18]}
        width={span - 0.8}
        height={0.7}
      />
      {hallHistory.map((item) => (
        <group key={item.id} position={[item.z - center, 2.9, 0.04]}>
          <Exhibit
            id={item.id}
            highlight={
              <Box
                position={[0, 0.3, 0.05]}
                size={[2.38, 1.66, 0.15]}
                color="#ffdb8c"
                solid={false}
              />
            }
          >
            <Box position={[0, 0.3, 0.045]} size={[2.29, 1.56, 0.15]} color={gold} solid={false} />
            <AssetBoundary asset={item.image}>
              <Suspense fallback={null}>
                <HistoryPhoto url={item.image} />
              </Suspense>
            </AssetBoundary>
            <Plaque
              lines={[item.year, item.title[lang]]}
              position={[0, -0.9, 0.16]}
              width={2.21}
              height={0.73}
              background="#401018"
            />
          </Exhibit>
        </group>
      ))}
    </group>
  );
}

export function RedDevilsMuseum({ quality }: { quality: Quality }) {
  const lang = hallLanguage(document.documentElement.lang);
  const labels = hallText[lang];
  return (
    <group name="red-devils-museum">
      <MuseumHall quality={quality} />
      <InteriorColliders map={map} />
      <Plaque
        lines={[labels.title.toUpperCase(), 'MANCHESTER UNITED']}
        width={13.6}
        height={1.57}
        position={[0, 7.12, -11.78]}
        background="#621521"
        maxFontSize={72}
      />
      <ManagerPortraitBoard
        atlas="/art/mu-manager-portraits.webp"
        stations={hallCoaches}
        y={4.98}
        z={-11.74}
        scale={0.96}
        illustrated
      />
      <Plaque
        lines={[labels.trophies.toUpperCase()]}
        width={12.5}
        height={0.53}
        position={[0, 3.57, -11.72]}
        maxFontSize={42}
      />
      {hallTrophies.map((trophy) => (
        <TrophyCabinet key={trophy.id} trophy={trophy} lang={lang} />
      ))}
      <FergusonStatue lang={lang} />
      <HistoryWall lang={lang} />
      {hallArchive.map((entry) => (
        <group key={entry.id} position={[entry.x, 2.5, entry.z]} rotation={[0, Math.PI, 0]}>
          <Exhibit id={entry.id}>
            <Plaque lines={[entry.title[lang], 'F']} width={3.8} height={1.2} />
          </Exhibit>
        </group>
      ))}
      <Doorway
        position={[0, 0, 11.65]}
        rotation={Math.PI}
        title={labels.exit}
        subtitle="E"
        width={2.8}
      />
    </group>
  );
}
