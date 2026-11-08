import { Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { LinearFilter, SRGBColorSpace, TextureLoader } from 'three';
import { AssetBoundary } from './BlenderAsset';
import { Exhibit } from './Exhibit';
import { GOLD, Plaque } from './IndoorKit';
import { Box } from './Models';

const portraitWidth = 1.29;
const portraitHeight = (portraitWidth * 76) / 64;
const captions = {
  vi: {
    title: 'CÁC ĐỜI HUẤN LUYỆN VIÊN',
    current: 'HIỆN TẠI',
    present: 'nay',
    art: 'Chân dung minh họa',
    archive: 'Chân dung tư liệu',
  },
  en: {
    title: 'MANAGERS THROUGH THE YEARS',
    current: 'CURRENT',
    present: 'present',
    art: 'Illustrated portraits',
    archive: 'Archival portraits',
  },
};

function Portrait({ atlas, tile }: { atlas: string; tile: number }) {
  const map = useLoader(TextureLoader, atlas);
  map.colorSpace = SRGBColorSpace;
  // Keep linear sampling within each tile, including when the board is viewed from a distance.
  map.generateMipmaps = false;
  map.minFilter = LinearFilter;
  const tileWidth = (map.image.height * 64) / 76;
  const left = (tile * tileWidth + 0.5) / map.image.width;
  const right = ((tile + 1) * tileWidth - 0.5) / map.image.width;
  return (
    <mesh position={[0, -0.05, 0.25]}>
      <planeGeometry args={[portraitWidth, portraitHeight]}>
        <bufferAttribute
          attach="attributes-uv"
          args={[new Float32Array([left, 1, right, 1, left, 0, right, 0]), 2]}
        />
      </planeGeometry>
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

function IndividualPortrait({ url }: { url: string }) {
  const map = useLoader(TextureLoader, url);
  map.colorSpace = SRGBColorSpace;
  return (
    <mesh position={[0, -0.05, 0.25]}>
      <planeGeometry args={[portraitWidth, portraitHeight]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

type ManagerPortrait = {
  id: string;
  x: number;
  name: string;
  tenure: string;
  current: boolean;
  portrait: number;
  portraitUrl?: string;
};

export function ManagerPortraitBoard({
  atlas,
  stations,
  y = 5,
  z,
  scale = 1,
  mountDepth = 0,
  blue = false,
  illustrated = false,
}: {
  atlas: string;
  stations: readonly ManagerPortrait[];
  y?: number;
  z: number;
  scale?: number;
  mountDepth?: number;
  blue?: boolean;
  illustrated?: boolean;
}) {
  const labels =
    captions[document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'vi'];
  const first = stations[0].x;
  const last = stations[stations.length - 1].x;
  const center = (first + last) / 2;
  const width = (last - first) / scale + 2.15;
  const panel = blue ? '#10264e' : '#48111e';
  const badge = blue ? '#184793' : '#861b26';
  return (
    <group name="manager-portrait-board" position={[center, y, z]} scale={scale}>
      {mountDepth > 0 && (
        <Box
          position={[0, 0, -mountDepth / 2]}
          size={[width - 0.24, 2.58, mountDepth]}
          color={panel}
          solid={false}
        />
      )}
      <Box size={[width, 2.76, 0.25]} color={GOLD} solid={false} />
      <Box position={[0, 0, 0.09]} size={[width - 0.17, 2.57, 0.15]} color={panel} solid={false} />
      {[-1.32, 1.32].map((y) => (
        <mesh key={y} position={[0, y, 0.16]}>
          <boxGeometry args={[width - 0.15, 0.025, 0.025]} />
          <meshBasicMaterial color="#f7bf60" />
        </mesh>
      ))}
      <Plaque
        lines={[labels.title]}
        width={8}
        height={0.53}
        position={[0, 1.02, 0.21]}
        background={panel}
      />
      <Plaque
        lines={[illustrated ? labels.art : labels.archive]}
        width={3.7}
        height={0.35}
        position={[-width * 0.32, 1.02, 0.21]}
        background={panel}
      />
      {[-0.4, -0.13, 0.13, 0.4].map((offset) => (
        <group key={offset} position={[width * offset, 1.37, 0.55]}>
          <Box position={[0, 0.02, -0.15]} size={[0.55, 0.12, 0.45]} color={GOLD} solid={false} />
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.36, 0.03, 0.17]} />
            <meshBasicMaterial color="#ffe3a1" />
          </mesh>
          <pointLight
            position={[0, -0.18, 0.24]}
            color={blue ? '#b6daff' : '#ffd096'}
            intensity={25 * scale}
            distance={7}
          />
        </group>
      ))}
      {stations.map((manager) => (
        <group key={manager.id} position={[(manager.x - center) / scale, 0, 0]}>
          <Exhibit
            id={manager.id}
            highlight={
              <mesh position={[0, -0.23, 0.18]} raycast={() => null}>
                <planeGeometry args={[1.76, 2.14]} />
                <meshBasicMaterial color="#ffdf8a" />
              </mesh>
            }
          >
            <Box
              position={[0, -0.23, 0.2]}
              size={[1.63, 2.06, 0.07]}
              color={manager.current ? '#f6ba54' : '#a4773d'}
              solid={false}
            />
            <AssetBoundary
              key={manager.portraitUrl ?? atlas}
              asset={manager.portraitUrl ?? atlas}
              fallback={null}
            >
              <Suspense fallback={null}>
                {manager.portraitUrl ? (
                  <IndividualPortrait url={manager.portraitUrl} />
                ) : (
                  <Portrait atlas={atlas} tile={manager.portrait} />
                )}
              </Suspense>
            </AssetBoundary>
            <Plaque
              lines={[
                manager.name,
                manager.tenure
                  .replace(/\b(?:\d{2}\/)+(?=\d{4})/g, '')
                  .replace(/^(\d{4})–\1$/, '$1')
                  .replace(/nay$/, labels.present),
              ]}
              width={1.52}
              height={0.48}
              position={[0, -1.005, 0.26]}
              background={manager.current ? badge : panel}
              maxFontSize={108}
            />
            {manager.current && (
              <Plaque
                lines={[labels.current]}
                width={1.48}
                height={0.27}
                position={[0, 0.95, 0.25]}
                background={badge}
                maxFontSize={100}
              />
            )}
          </Exhibit>
        </group>
      ))}
    </group>
  );
}
