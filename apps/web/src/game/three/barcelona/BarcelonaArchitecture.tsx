import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { CuboidCollider } from '@react-three/rapier';
import {
  CanvasTexture,
  DoubleSide,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { CityBox as Block, CityLantern as Lantern } from '../city/CityArchitecture';
import { Plaque, type V3 } from '../IndoorKit';

export { Block, Lantern };
export const navy = '#101d48';
export const blue = '#284d9c';
export const wine = '#8a2044';
export const gold = '#e0aa55';
const stone = '#393046';
export const crestPath = '/art/barcelona/crest.svg';

export function Crest({
  position = [0, 0, 0],
  size,
  flat = false,
}: {
  position?: V3;
  size: number;
  flat?: boolean;
}) {
  const map = useLoader(TextureLoader, crestPath);
  map.colorSpace = SRGBColorSpace;
  return (
    <mesh position={position} rotation={flat ? [-Math.PI / 2, 0, 0] : undefined}>
      <planeGeometry args={[size, size * 1.03]} />
      <meshBasicMaterial map={map} transparent alphaTest={0.12} />
    </mesh>
  );
}

export function Sign({
  position,
  lines,
  width,
  height,
}: {
  position: V3;
  lines: string[];
  width: number;
  height: number;
}) {
  return (
    <Plaque position={position} lines={lines} width={width} height={height} background={navy} />
  );
}

export function Banner({
  position,
  width = 1.65,
  height = 3.3,
}: {
  position: V3;
  width?: number;
  height?: number;
}) {
  return (
    <group position={position}>
      <Block size={[width + 0.12, height + 0.12, 0.075]} color={gold} metal={0.53} />
      {[-2, -1, 0, 1, 2].map((i) => (
        <Block
          key={i}
          position={[(i * width) / 5, 0, 0.041]}
          size={[width / 5, height, 0.045]}
          color={i % 2 ? wine : blue}
        />
      ))}
      <Block
        position={[0, height / 2 + 0.12, 0]}
        size={[width + 0.42, 0.08, 0.17]}
        color={gold}
        metal={0.68}
      />
      <Crest size={width * 0.74} position={[0, 0.05, 0.074]} />
    </group>
  );
}

export function Carpet({ position, width, depth }: { position: V3; width: number; depth: number }) {
  return (
    <group position={position}>
      <Block size={[width, 0.019, depth]} color="#6c1938" />
      <Block position={[0, 0.011, 0]} size={[width * 0.74, 0.018, depth - 0.14]} color={navy} />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          position={[side * width * 0.383, 0.016, 0]}
          size={[0.038, 0.016, depth - 0.08]}
          color={gold}
        />
      ))}
    </group>
  );
}

export function Floor({
  position,
  width,
  depth,
  museum = false,
}: {
  position: V3;
  width: number;
  depth: number;
  museum?: boolean;
}) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#26283a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * 128,
        y = Math.floor(i / 2) * 128;
      const gradient = ctx.createLinearGradient(x, y, x + 128, y + 128);
      gradient.addColorStop(0, i % 3 ? '#9d98a7' : '#b1a5a0');
      gradient.addColorStop(1, i % 2 ? '#5f637c' : '#7a7385');
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 1, y + 1, 126, 126);
      ctx.strokeStyle = '#e2d0c244';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 100);
      ctx.bezierCurveTo(x + 45, y + 90, x + 82, y + 38, x + 128, y + 28);
      ctx.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(width / 3.2, depth / 3.2);
    texture.anisotropy = 4;
    return texture;
  }, [width, depth]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <group position={position}>
      <CuboidCollider args={[width / 2, 0.23, depth / 2]} position={[0, -0.23, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ cameraSolid: true }}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={museum ? '#e0d3bc' : '#807d9b'}
          map={map}
          roughness={0.32}
          metalness={0.16}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function WallStone({ width, height, museum }: { width: number; height: number; museum: boolean }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#201b2c';
    ctx.fillRect(0, 0, 384, 256);
    for (let row = 0; row < 4; row++) {
      for (let i = -1; i < 3; i++) {
        const x = i * 128 + (row % 2) * 64,
          y = row * 64;
        const shade = 65 + ((i + row * 7 + 16) % 5) * 8;
        const grad = ctx.createLinearGradient(x, y, x, y + 64);
        grad.addColorStop(0, `rgb(${shade + 12},${shade + 9},${shade + 27})`);
        grad.addColorStop(1, `rgb(${shade},${shade - 7},${shade + 8})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + 1, 126, 62);
        ctx.fillStyle = '#ffd9c323';
        ctx.fillRect(x + 2, y + 2, 124, 2);
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(width / 4, height / 2.5);
    texture.anisotropy = 4;
    return texture;
  }, [width, height]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={[0, 0, 0.223]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color={museum ? '#8296c4' : '#bcb1bd'} map={map} roughness={0.81} />
    </mesh>
  );
}

export function Wall({
  position,
  width,
  height,
  yaw = 0,
  gap,
  museum = false,
}: {
  position: V3;
  width: number;
  height: number;
  yaw?: number;
  gap?: { center: number; width: number; height: number };
  museum?: boolean;
}) {
  const panels = gap
    ? [
        { left: -width / 2, right: gap.center - gap.width / 2, bottom: 0 },
        { left: gap.center + gap.width / 2, right: width / 2, bottom: 0 },
        { left: gap.center - gap.width / 2, right: gap.center + gap.width / 2, bottom: gap.height },
      ]
    : [{ left: -width / 2, right: width / 2, bottom: 0 }];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {panels.map(({ left, right, bottom }) => {
        const x = (left + right) / 2,
          y = (height + bottom) / 2,
          w = right - left,
          h = height - bottom;
        return (
          <group key={left + ':' + bottom}>
            <CuboidCollider args={[w / 2, h / 2, 0.22]} position={[x, y, 0]} />
            <Block position={[x, y, 0]} size={[w, h, 0.44]} color={museum ? navy : stone} solid />
            <group position={[x, y, 0]}>
              <WallStone width={w} height={h} museum={museum} />
            </group>
            {[0.18, 0.54, 2.7, 5.65]
              .filter((level) => level > bottom && level < height)
              .map((level) => (
                <Block
                  key={level}
                  position={[x, level, 0.232]}
                  size={[w, level === 0.54 ? 0.045 : 0.16, 0.08]}
                  color={level === 0.54 ? gold : museum ? '#233461' : '#6c6578'}
                  metal={level === 0.54 ? 0.52 : 0}
                />
              ))}
          </group>
        );
      })}
    </group>
  );
}

function pointedBand(span: number, spring: number, rise: number, thickness: number) {
  const curve = new Shape();
  curve.moveTo(-span - thickness, spring);
  curve.quadraticCurveTo(-span - thickness, spring + rise * 0.55, 0, spring + rise + thickness);
  curve.quadraticCurveTo(span + thickness, spring + rise * 0.55, span + thickness, spring);
  curve.lineTo(span, spring);
  curve.quadraticCurveTo(span, spring + rise * 0.56, 0, spring + rise);
  curve.quadraticCurveTo(-span, spring + rise * 0.56, -span, spring);
  curve.closePath();
  return curve;
}

export function Pier({
  position,
  height,
  pale = false,
}: {
  position: V3;
  height: number;
  pale?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} receiveShadow>
        <cylinderGeometry args={[0.34, 0.45, height, 10]} />
        <meshStandardMaterial color={pale ? '#b3abaf' : '#716c80'} roughness={0.83} />
      </mesh>
      {[0.15, 0.44, height - 0.44, height - 0.14].map((y, i) => (
        <Block
          key={y}
          position={[0, y, 0]}
          size={[i % 2 ? 0.83 : 1.07, 0.16, i % 2 ? 0.83 : 1.07]}
          color={i % 2 ? gold : '#756a80'}
          metal={i % 2 ? 0.6 : 0}
        />
      ))}
    </group>
  );
}

export function Gothic({
  position,
  span,
  spring,
  rise,
  yaw = 0,
  columns = true,
}: {
  position: V3;
  span: number;
  spring: number;
  rise: number;
  yaw?: number;
  columns?: boolean;
}) {
  const band = useMemo(() => pointedBand(span, spring, rise, 0.47), [span, spring, rise]);
  const edging = useMemo(() => pointedBand(span - 0.02, spring, rise, 0.075), [span, spring, rise]);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {columns &&
        [-1, 1].map((side) => (
          <Pier key={side} position={[side * (span + 0.19), 0, 0.16]} height={spring} />
        ))}
      <mesh userData={{ cameraSolid: true }}>
        <extrudeGeometry args={[band, { depth: 0.32, curveSegments: 12, bevelEnabled: false }]} />
        <meshStandardMaterial color="#7e778e" roughness={0.77} />
      </mesh>
      <mesh position={[0, 0, 0.33]}>
        <extrudeGeometry
          args={[edging, { depth: 0.032, curveSegments: 12, bevelEnabled: false }]}
        />
        <meshStandardMaterial
          color={gold}
          metalness={0.51}
          roughness={0.31}
          emissive="#9b4717"
          emissiveIntensity={0.26}
        />
      </mesh>
    </group>
  );
}

export function Vault({
  center,
  width,
  depth,
  museum = false,
}: {
  center: number;
  width: number;
  depth: number;
  museum?: boolean;
}) {
  const span = width / 2 - 0.35,
    spring = 5.6,
    rise = museum ? 4.7 : 5.45;
  const shell = useMemo(() => pointedBand(span, spring, rise, 0.45), [span, rise]);
  return (
    <group position={[center, 0, 0]}>
      <mesh position={[0, 0, -depth]} userData={{ cameraSolid: true }}>
        <extrudeGeometry args={[shell, { depth, curveSegments: 14, bevelEnabled: false }]} />
        <meshStandardMaterial
          color={museum ? '#273060' : '#393549'}
          roughness={0.88}
          side={DoubleSide}
        />
      </mesh>
      {[0.08, 0.25, 0.44, 0.64, 0.83, 0.97].map((p) => (
        <Gothic
          key={p}
          position={[0, 0, -p * depth]}
          span={span - 0.08}
          spring={spring - 0.08}
          rise={rise - 0.14}
        />
      ))}
      <Block position={[0, 10.3, -depth / 2]} size={[0.13, 0.09, depth]} color={gold} metal={0.5} />
    </group>
  );
}

export function RoseWindow({ position, size = 2.5 }: { position: V3; size?: number }) {
  const radius = size / 2;
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#202653" emissive="#161641" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <torusGeometry args={[radius, 0.055, 7, 36]} />
        <meshStandardMaterial color={gold} metalness={0.6} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI * i) / 4;
        const color = i % 2 ? '#c22753' : '#3765cc';
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * radius * 0.54, Math.cos(angle) * radius * 0.54, 0.03]}
            rotation={[0, 0, -angle]}
            scale={[0.58, 1, 1]}
          >
            <circleGeometry args={[radius * 0.36, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.62} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.055]} rotation={[0, 0, Math.PI / 4]}>
        <circleGeometry args={[radius * 0.22, 4]} />
        <meshStandardMaterial color="#ffcb71" emissive="#cf7534" emissiveIntensity={0.69} />
      </mesh>
    </group>
  );
}

export function Crystals({
  position,
  red = false,
  scale = 1,
}: {
  position: V3;
  red?: boolean;
  scale?: number;
}) {
  const color = red ? '#ff3862' : '#53aaff';
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]} scale={[0.88, 0.32, 0.63]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#333247" flatShading />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh
          key={i}
          position={[i * 0.42, i ? 0.68 : 1.14, 0]}
          rotation={[0.12, i * 0.35, -i * 0.32]}
          scale={[i ? 0.24 : 0.35, i ? 0.64 : 1.1, i ? 0.24 : 0.35]}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.68}
            roughness={0.29}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

export function Planter({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.48, 0.37, 0.58, 12]} />
        <meshStandardMaterial color={gold} metalness={0.58} roughness={0.42} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = i * 2.4,
          x = Math.sin(a),
          z = Math.cos(a);
        return (
          <group key={i} position={[x * 0.36, 0.77 + (i % 3) * 0.12, z * 0.36]}>
            <mesh rotation={[z * 0.6, 0, -x * 0.7]} scale={[0.18, 0.44, 0.1]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={i % 2 ? '#62894d' : '#346349'} flatShading />
            </mesh>
            {i % 2 === 0 && (
              <mesh position={[x * 0.09, 0.23, z * 0.08]}>
                <icosahedronGeometry args={[0.115, 1]} />
                <meshStandardMaterial color={i % 4 ? '#e64c87' : '#ffb552'} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
