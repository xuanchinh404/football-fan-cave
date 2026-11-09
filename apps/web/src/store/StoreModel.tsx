import { Suspense, useMemo, type ReactNode } from 'react';
import { useLoader } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Product } from '../../../../packages/shared/store/catalog';

export type Vec = [number, number, number];
export function Block({
  at = [0, 0, 0],
  size,
  color,
  rotation,
}: {
  at?: Vec;
  size: Vec;
  color: string;
  rotation?: Vec;
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
export function Orb({ at = [0, 0, 0], size, color }: { at?: Vec; size: Vec; color: string }) {
  return (
    <mesh position={at} scale={size}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial color={color} roughness={0.38} />
    </mesh>
  );
}
function Cone({
  at,
  size,
  color,
  rotation,
}: {
  at: Vec;
  size: Vec;
  color: string;
  rotation?: Vec;
}) {
  return (
    <mesh position={at} scale={size} rotation={rotation}>
      <coneGeometry args={[1, 1, 9]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
function Drum({
  at,
  radius,
  height,
  color,
  bottom,
  rotation,
}: {
  at: Vec;
  radius: number;
  height: number;
  color: string;
  bottom?: number;
  rotation?: Vec;
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <cylinderGeometry args={[radius, bottom ?? radius, height, 18]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
const sides = [-1, 1];
const gold = '#ffc241';
const paper = '#fff7df';

function Asset({ url }: { url: string }) {
  const { scene } = useLoader(GLTFLoader, url, (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder),
  );
  const { object, center, scale } = useMemo(() => {
    const object = scene.clone(true);
    const bounds = new Box3().setFromObject(object);
    const center = bounds.getCenter(new Vector3()).negate();
    return {
      object,
      center,
      scale: 1 / Math.max(0.001, ...bounds.getSize(new Vector3()).toArray()),
    };
  }, [scene]);
  return (
    <group scale={scale}>
      <primitive object={object} position={center} />
    </group>
  );
}

export function StoreModel({
  item,
  size = 1,
  asset = false,
}: {
  item: Product;
  size?: number;
  asset?: boolean;
}) {
  const mesh = <Shape item={item} />;
  return (
    <group scale={size}>
      {asset && item.asset ? (
        <Suspense fallback={mesh}>
          <Asset url={item.asset} />
        </Suspense>
      ) : (
        mesh
      )}
    </group>
  );
}

function Shape({ item }: { item: Product }): ReactNode {
  const { visual, color } = item;
  switch (visual) {
    case 'tomato':
    case 'rotten':
      return (
        <>
          <Orb size={[0.48, 0.42, 0.46]} color={color} />
          {sides.map((side) => (
            <Orb
              key={side}
              at={[side * 0.13, 0.36, 0]}
              size={[0.18, 0.038, 0.065]}
              color="#4e9a25"
            />
          ))}
          <Block
            at={[0, 0.45, 0]}
            size={[0.065, 0.18, 0.062]}
            color="#4c7622"
            rotation={[0, 0, -0.35]}
          />
          {visual === 'rotten' && (
            <>
              <Orb at={[0.22, 0.14, 0.36]} size={[0.1, 0.086, 0.037]} color="#6f6727" />
              <Orb at={[-0.25, -0.17, 0.34]} size={[0.1, 0.066, 0.036]} color="#683524" />
            </>
          )}
        </>
      );
    case 'water':
      return (
        <>
          <Orb size={[0.41, 0.47, 0.4]} color={color} />
          <Cone
            at={[0, 0.47, 0]}
            size={[0.105, 0.14, 0.105]}
            color={color}
            rotation={[0, 0, Math.PI]}
          />
          <Orb at={[-0.15, 0.14, 0.32]} size={[0.09, 0.15, 0.042]} color="#97ecff" />
        </>
      );
    case 'egg':
      return (
        <>
          <Orb size={[0.35, 0.49, 0.34]} color={paper} />
          <Orb at={[0.13, -0.12, 0.28]} size={[0.12, 0.13, 0.04]} color={color} />
        </>
      );
    case 'cake':
    case 'pie':
      return (
        <>
          <Drum
            at={[0, -0.1, 0]}
            radius={0.48}
            height={0.36}
            color={visual === 'cake' ? '#bb7048' : '#aa562d'}
          />
          <Drum at={[0, 0.1, 0]} radius={0.49} height={0.1} color={color} />
          {sides.map((x) => (
            <Orb key={x} at={[0.2 * x, 0.2, 0.15 * x]} size={[0.09, 0.1, 0.09]} color="#e23159" />
          ))}
        </>
      );
    case 'roll':
      return (
        <>
          <Drum at={[0, 0, 0]} radius={0.32} height={0.67} color={paper} />
          <Drum at={[0, 0.34, 0]} radius={0.11} height={0.015} color="#775c4a" />
          <Block
            at={[0.31, -0.14, 0.14]}
            size={[0.032, 0.48, 0.51]}
            color="#fff"
            rotation={[0, 0, -0.2]}
          />
        </>
      );
    case 'tissue':
      return (
        <>
          <Block at={[0, -0.16, 0]} size={[0.88, 0.38, 0.55]} color="#5879dd" />
          <Block
            at={[0, 0.18, 0]}
            size={[0.54, 0.43, 0.045]}
            color={paper}
            rotation={[0.36, 0, 0.16]}
          />
        </>
      );
    case 'pillow':
      return (
        <>
          <Orb size={[0.51, 0.23, 0.39]} color="#a18af8" />
          {sides.map((x) => (
            <Orb key={x} at={[0.16 * x, 0, 0.37]} size={[0.04, 0.022, 0.022]} color="#2d2152" />
          ))}
        </>
      );
    case 'shovel':
      return (
        <group rotation={[0, 0, -0.49]}>
          <Drum at={[0, 0.11, 0]} radius={0.045} height={0.67} color="#be7847" />
          <Orb at={[0, -0.31, 0]} size={[0.17, 0.23, 0.075]} color="#acbac9" />
          <Block at={[0, 0.46, 0]} size={[0.24, 0.085, 0.1]} color={gold} />
        </group>
      );
    case 'cup':
      return (
        <>
          <Drum at={[0, 0.17, 0]} radius={0.32} bottom={0.13} height={0.37} color={gold} />
          <Drum at={[0, -0.17, 0]} radius={0.085} height={0.32} color={gold} />
          <Drum at={[0, -0.38, 0]} radius={0.29} height={0.12} color="#8f4f31" />
          {sides.map((x) => (
            <Ring key={x} at={[0.29 * x, 0.19, 0]} radius={0.15} color={gold} />
          ))}
        </>
      );
    case 'crown':
      return (
        <>
          <Drum at={[0, -0.15, 0]} radius={0.39} height={0.15} color={gold} />
          {Array.from({ length: 5 }, (_, i) => (
            <Cone
              key={i}
              at={[0.32 * Math.cos(i * 1.26), 0.08, 0.32 * Math.sin(i * 1.26)]}
              size={[0.12, 0.35, 0.12]}
              color={gold}
            />
          ))}
          <Orb at={[0, -0.11, 0.39]} size={[0.075, 0.08, 0.04]} color="#f73185" />
        </>
      );
    case 'score':
    case 'sign':
    case 'poster':
    case 'card':
      return (
        <>
          <Block size={[0.92, 0.64, 0.09]} color={visual === 'score' ? '#242d53' : '#bd783f'} />
          <Block
            at={[0, 0, 0.051]}
            size={[0.77, 0.49, 0.018]}
            color={visual === 'score' ? '#35395b' : '#f6cf88'}
          />
          {sides.map((x) => (
            <Ring
              key={x}
              at={[x * 0.18, 0, 0.077]}
              radius={0.095}
              color={visual === 'score' ? gold : '#845b90'}
            />
          ))}
        </>
      );
    case 'sofa':
    case 'bed':
    case 'chair': {
      const sofa = visual === 'sofa',
        bed = visual === 'bed',
        width = visual === 'chair' ? 0.58 : 1;
      return (
        <>
          <Block
            at={[0, -0.14, 0]}
            size={[width, 0.25, bed ? 0.9 : 0.59]}
            color={bed ? '#754732' : color}
          />
          <Block
            at={[0, bed ? 0.03 : 0.12, bed ? 0 : -0.25]}
            size={[width, bed ? 0.13 : 0.45, bed ? 0.85 : 0.13]}
            color={color}
          />
          {sofa &&
            sides.map((x) => (
              <Block key={x} at={[x * 0.45, 0.03, 0]} size={[0.15, 0.26, 0.62]} color={color} />
            ))}
          {bed && <Orb at={[0, 0.13, -0.31]} size={[0.3, 0.095, 0.14]} color={paper} />}
          {sides.flatMap((x) =>
            sides.map((z) => (
              <Block
                key={`${x}:${z}`}
                at={[x * width * 0.4, -0.31, z * 0.21]}
                size={[0.075, 0.2, 0.075]}
                color="#4f3436"
              />
            )),
          )}
        </>
      );
    }
    case 'table':
    case 'lamp':
      return (
        <>
          <Drum at={[0, -0.34, 0]} radius={0.26} height={0.11} color="#a56637" />
          <Drum at={[0, -0.08, 0]} radius={0.06} height={0.47} color="#a56637" />
          <Drum
            at={[0, 0.24, 0]}
            radius={visual === 'lamp' ? 0.18 : 0.48}
            bottom={visual === 'lamp' ? 0.35 : 0.48}
            height={visual === 'lamp' ? 0.3 : 0.11}
            color={visual === 'lamp' ? gold : '#c68548'}
          />
        </>
      );
    case 'cabinet':
      return (
        <>
          <Block size={[0.79, 0.97, 0.31]} color="#8a553d" />
          {[-0.29, 0, 0.29].map((y) => (
            <Block key={y} at={[0, y, 0.17]} size={[0.64, 0.17, 0.045]} color="#f0aa59" />
          ))}
        </>
      );
    case 'rug':
    case 'pitch':
      return (
        <>
          <Block size={[0.96, 0.047, 0.72]} color={visual === 'pitch' ? '#36a15b' : '#bd275e'} />
          <Ring at={[0, 0.026, 0]} radius={0.16} color={paper} rotation={[-Math.PI / 2, 0, 0]} />
        </>
      );
    case 'dragon':
    case 'lion':
    case 'eagle':
    case 'bear':
    case 'robot':
    case 'dino':
    case 'ghost':
      return <Mascot item={item} />;
    case 'jersey':
    case 'jacket':
      return (
        <>
          <Block size={[0.54, 0.69, 0.19]} color={color} />
          {sides.map((x) => (
            <Block
              key={x}
              at={[x * 0.32, 0.15, 0]}
              size={[0.26, 0.32, 0.2]}
              rotation={[0, 0, x * 0.52]}
              color={color}
            />
          ))}
          <Block at={[0, 0.31, 0.105]} size={[0.27, 0.07, 0.028]} color={paper} />
          <Block at={[0.13, 0.13, 0.105]} size={[0.08, 0.12, 0.027]} color={gold} />
        </>
      );
    case 'shorts':
    case 'boots':
      return (
        <>
          {sides.map((x) => (
            <Block
              key={x}
              at={[x * 0.19, 0, visual === 'boots' ? 0.09 : 0]}
              size={[0.31, visual === 'boots' ? 0.25 : 0.53, visual === 'boots' ? 0.68 : 0.35]}
              color={color}
            />
          ))}
        </>
      );
    case 'glasses':
      return (
        <>
          <Block size={[0.75, 0.055, 0.075]} color="#32354b" />
          {sides.map((x) => (
            <Orb key={x} at={[x * 0.21, 0, 0]} size={[0.2, 0.12, 0.055]} color="#14182b" />
          ))}
        </>
      );
    case 'cap':
      return (
        <>
          <Orb size={[0.37, 0.21, 0.34]} color={color} />
          <Orb at={[0, -0.09, 0.29]} size={[0.35, 0.042, 0.25]} color={color} />
        </>
      );
    case 'headband':
    case 'headphones':
    case 'scarf':
    case 'aura':
    case 'portal':
    case 'wreath':
      return (
        <>
          <Ring radius={0.37} color={color} />
          {visual === 'scarf' && (
            <Block at={[0.2, -0.27, 0.15]} size={[0.14, 0.33, 0.045]} color={color} />
          )}
        </>
      );
    case 'backpack':
    case 'powder':
    case 'bundle':
      return (
        <>
          <Block size={[0.67, 0.65, 0.51]} color={color} />
          <Block size={[0.11, 0.66, 0.53]} color={gold} />
          <Block size={[0.68, 0.11, 0.53]} color={gold} />
          <Ring at={[0, 0.41, 0]} radius={0.11} color={gold} />
        </>
      );
    case 'flag':
      return (
        <>
          <Drum at={[-0.26, 0, 0]} radius={0.032} height={0.95} color={gold} />
          <Block at={[0.05, 0.21, 0]} size={[0.57, 0.33, 0.045]} color={color} />
        </>
      );
    case 'flower':
      return (
        <>
          <Drum at={[0, -0.18, 0]} radius={0.032} height={0.58} color="#57a64b" />
          {Array.from({ length: 5 }, (_, i) => (
            <Orb
              key={i}
              at={[0.16 * Math.cos(i * 1.26), 0.25 + 0.16 * Math.sin(i * 1.26), 0]}
              size={[0.115, 0.115, 0.085]}
              color={color}
            />
          ))}
          <Orb at={[0, 0.25, 0.07]} size={[0.11, 0.11, 0.055]} color={gold} />
        </>
      );
    case 'horn':
      return (
        <Drum
          at={[0, 0, 0]}
          radius={0.29}
          bottom={0.105}
          height={0.64}
          color={color}
          rotation={[0, 0, Math.PI / 3]}
        />
      );
    case 'ball':
    case 'foam':
      return (
        <>
          <Orb size={[0.45, 0.45, 0.45]} color={color} />
          {item.id !== 'P090' && (
            <Orb at={[0, 0.12, 0.413]} size={[0.14, 0.13, 0.038]} color="#252f48" />
          )}
        </>
      );
    case 'laugh':
    case 'cry':
    case 'sad':
    case 'wave':
    case 'clap':
    case 'cheer':
    case 'folded':
    case 'flop':
    case 'point':
    case 'slide':
    case 'kneel':
    case 'dance':
    case 'mask':
      return (
        <>
          <Orb size={[0.43, 0.44, 0.27]} color={gold} />
          {sides.map((x) => (
            <Orb
              key={x}
              at={[x * 0.15, 0.08, 0.243]}
              size={[0.052, 0.069, 0.025]}
              color="#38252b"
            />
          ))}
          <Orb
            at={[0, -0.12, 0.252]}
            size={[0.1, 0.065, 0.025]}
            color={visual === 'cry' ? '#39acff' : '#b53255'}
          />
        </>
      );
    case 'heart':
      return (
        <>
          <Orb at={[-0.17, 0.11, 0]} size={[0.26, 0.27, 0.18]} color={color} />
          <Orb at={[0.17, 0.11, 0]} size={[0.26, 0.27, 0.18]} color={color} />
          <Cone
            at={[0, -0.13, 0]}
            size={[0.38, 0.52, 0.17]}
            color={color}
            rotation={[0, 0, Math.PI]}
          />
        </>
      );
    default:
      return (
        <>
          {Array.from({ length: 6 }, (_, i) => (
            <Cone
              key={i}
              at={[Math.cos(i * 1.047) * 0.23, Math.sin(i * 1.047) * 0.23, 0]}
              size={[0.11, 0.47, 0.11]}
              color={i % 2 ? color : gold}
              rotation={[0, 0, i * 1.047 - Math.PI / 2]}
            />
          ))}
        </>
      );
  }
}

export function Ring({
  at = [0, 0, 0],
  radius,
  color,
  rotation,
}: {
  at?: Vec;
  radius: number;
  color: string;
  rotation?: Vec;
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <torusGeometry args={[radius, 0.032, 6, 28]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
    </mesh>
  );
}

function Mascot({ item }: { item: Product }) {
  const { visual, color } = item;
  const ghost = visual === 'ghost',
    robot = visual === 'robot';
  return (
    <>
      {robot ? (
        <Block at={[0, 0.12, 0]} size={[0.65, 0.48, 0.46]} color={color} />
      ) : (
        <Orb at={[0, 0.12, 0]} size={[0.34, 0.33, 0.3]} color={color} />
      )}
      <Orb at={[0, -0.2, -0.09]} size={[0.29, 0.26, 0.36]} color={color} />
      {sides.map((x) => (
        <group key={x}>
          <Orb
            at={[x * 0.13, 0.16, 0.272]}
            size={[0.058, 0.067, 0.036]}
            color={robot ? '#d8ffff' : '#19172d'}
          />
          {!ghost && <Orb at={[x * 0.18, -0.38, 0.05]} size={[0.135, 0.09, 0.17]} color={color} />}
          {(visual === 'dragon' || visual === 'dino') && (
            <Cone
              at={[x * 0.21, 0.42, -0.05]}
              size={[0.1, 0.25, 0.1]}
              color={gold}
              rotation={[0.28, 0, x * -0.35]}
            />
          )}
          {(visual === 'dragon' || visual === 'eagle') && (
            <Orb at={[x * 0.42, -0.1, -0.14]} size={[0.27, 0.085, 0.19]} color={color} />
          )}
          {(visual === 'lion' || visual === 'bear') && (
            <Orb at={[x * 0.26, 0.36, 0]} size={[0.13, 0.12, 0.09]} color={color} />
          )}
        </group>
      ))}
      {visual === 'eagle' ? (
        <Cone
          at={[0, 0.08, 0.37]}
          size={[0.115, 0.22, 0.115]}
          color={gold}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ) : (
        <Orb
          at={[0, 0.025, 0.265]}
          size={[0.13, 0.065, 0.062]}
          color={robot ? '#26435b' : '#e6b28a'}
        />
      )}
    </>
  );
}
