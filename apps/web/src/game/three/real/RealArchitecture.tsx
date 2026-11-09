import { useEffect, useMemo } from 'react';
import { CanvasTexture, CatmullRomCurve3, Shape, SRGBColorSpace, Vector3 } from 'three';
import { Box } from '../Models';
import { Plaque, type V3 } from '../IndoorKit';

export const pearl = '#f3e6d7';
export const navy = '#131d4b';
export const blue = '#233e8d';
export const gold = '#d59a49';
export const violet = '#a252ff';

function Gilding({ color = gold, glow = 0.22 }: { color?: string; glow?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.34}
      metalness={0.42}
      emissive={color}
      emissiveIntensity={glow}
    />
  );
}

export function MadridCrest({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: V3;
  scale?: number;
}) {
  const seal = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 384;
    const ctx = c.getContext('2d')!;
    ctx.translate(192, 192);
    ctx.beginPath();
    ctx.arc(0, 0, 184, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#fff2dd';
    ctx.fillRect(-192, -192, 384, 384);
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#243b83';
    ctx.fillRect(-250, -32, 500, 64);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#9c692c';
    ctx.lineWidth = 10;
    ctx.fillStyle = '#ffee9c';
    ctx.font = 'bold 170px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('RM', 0, 6);
    ctx.fillText('RM', 0, 6);
    const texture = new CanvasTexture(c);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => seal.dispose(), [seal]);
  return (
    <group position={position} scale={scale} name="madrid-crowned-monogram">
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.94, 0.94, 0.18, 40]} />
        <Gilding />
      </mesh>
      <mesh position={[0, 0, 0.101]}>
        <circleGeometry args={[0.83, 40]} />
        <meshBasicMaterial map={seal} />
      </mesh>
      <Crown position={[0, 0.88, 0.04]} />
    </group>
  );
}

export function Crown({ position = [0, 0, 0], scale = 1 }: { position?: V3; scale?: number }) {
  const shape = useMemo(() => {
    const shape = new Shape();
    const points = [
      [-0.68, 0],
      [-0.83, 0.49],
      [-0.39, 0.31],
      [-0.32, 0.62],
      [0, 0.42],
      [0.32, 0.62],
      [0.39, 0.31],
      [0.83, 0.49],
      [0.68, 0],
    ];
    points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    return shape;
  }, []);
  return (
    <group position={position} scale={scale}>
      <mesh>
        <extrudeGeometry
          args={[shape, { depth: 0.13, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }]}
        />
        <Gilding glow={0.45} />
      </mesh>
      {[-0.49, -0.245, 0, 0.245, 0.49].map((x, i) => (
        <mesh key={x} position={[x, 0.155, 0.177]} scale={[1, 0.85, 0.5]}>
          <octahedronGeometry args={[0.105]} />
          <Gilding color={i % 2 ? blue : '#c74061'} />
        </mesh>
      ))}
      <Box position={[0, 0.73, 0.07]} size={[0.078, 0.24, 0.11]} color={gold} solid={false} />
      <Box position={[0, 0.76, 0.07]} size={[0.24, 0.07, 0.11]} color={gold} solid={false} />
    </group>
  );
}

export function MadridFlag({ position, scale = 1 }: { position: V3; scale?: number }) {
  const shield = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.77, 1.35);
    s.lineTo(0.77, 1.35);
    s.lineTo(0.77, -1.08);
    s.lineTo(0, -1.72);
    s.lineTo(-0.77, -1.08);
    s.closePath();
    return s;
  }, []);
  return (
    <group position={position} scale={scale}>
      <mesh>
        <extrudeGeometry
          args={[
            shield,
            { depth: 0.055, bevelThickness: 0.028, bevelSize: 0.047, bevelSegments: 1 },
          ]}
        />
        <meshStandardMaterial color={pearl} roughness={0.7} side={2} />
      </mesh>
      <mesh position={[0, 1.41, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 2, 12]} />
        <Gilding />
      </mesh>
      <MadridCrest position={[0, -0.1, 0.07]} scale={0.62} />
    </group>
  );
}

export function MadridShirt({ position, scale = 1 }: { position: V3; scale?: number }) {
  const shirt = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.48, -0.65);
    shape.lineTo(-0.48, 0.08);
    shape.lineTo(-0.69, -0.03);
    shape.lineTo(-0.89, 0.36);
    shape.lineTo(-0.45, 0.63);
    shape.lineTo(-0.19, 0.69);
    shape.quadraticCurveTo(0, 0.43, 0.19, 0.69);
    shape.lineTo(0.45, 0.63);
    shape.lineTo(0.89, 0.36);
    shape.lineTo(0.69, -0.03);
    shape.lineTo(0.48, 0.08);
    shape.lineTo(0.48, -0.65);
    shape.closePath();
    return shape;
  }, []);
  return (
    <group position={position} scale={scale}>
      <mesh>
        <extrudeGeometry
          args={[
            shirt,
            { depth: 0.065, bevelThickness: 0.025, bevelSize: 0.024, bevelSegments: 2 },
          ]}
        />
        <meshStandardMaterial color={pearl} roughness={0.76} />
      </mesh>
      {[-1, 1].map((side) => (
        <Box
          key={side}
          position={[side * 0.68, 0.36, 0.09]}
          size={[0.31, 0.055, 0.025]}
          rotation={[0, 0, side * -0.55]}
          color={blue}
          solid={false}
        />
      ))}
      <MadridCrest position={[-0.2, 0.3, 0.11]} scale={0.12} />
    </group>
  );
}

export function RoyalSign({
  lines,
  width,
  height,
  position,
}: {
  lines: string[];
  width: number;
  height: number;
  position: V3;
}) {
  return (
    <group position={position}>
      <Plaque lines={lines} width={width} height={height} background={navy} />
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((level) => (
          <mesh
            key={side + ':' + level}
            position={[(side * width) / 2, (level * height) / 2, 0.16]}
            scale={[1, 1, 0.55]}
          >
            <octahedronGeometry args={[0.17]} />
            <Gilding glow={1.1} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Crystal({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[-1, 0, 1].map((i) => (
        <mesh
          key={i}
          position={[i * 0.31, i ? 0.43 : 0.82, i * 0.18]}
          rotation={[0.12 * i, i * 0.72, -i * 0.39]}
          scale={[0.43, i ? 1.1 : 1.65, 0.46]}
        >
          <octahedronGeometry args={[0.61]} />
          <meshStandardMaterial
            color={i ? violet : '#d7a6ff'}
            emissive={violet}
            emissiveIntensity={i ? 0.7 : 1.55}
            roughness={0.22}
            metalness={0.14}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

export function Lantern({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.15, 0.48, 6]} />
        <Gilding color="#ffcf79" glow={2.7} />
      </mesh>
      {[-0.28, 0.29].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <coneGeometry args={[0.29, 0.18, 6]} />
          <Gilding glow={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.47, 0]}>
        <torusGeometry args={[0.16, 0.024, 5, 12]} />
        <Gilding />
      </mesh>
    </group>
  );
}

export function Column({ position, height = 6.9 }: { position: V3; height?: number }) {
  return (
    <group position={position}>
      <Box position={[0, 0.18, 0]} size={[1.27, 0.36, 1.27]} color={pearl} solid={false} />
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.57, height - 0.4, 12]} />
        <meshStandardMaterial color={pearl} roughness={0.45} />
      </mesh>
      {[0.41, 0.58, height - 0.51, height - 0.23].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.64, 0.64, 0.09, 16]} />
          <Gilding />
        </mesh>
      ))}
      <Box position={[0, height - 0.04, 0]} size={[1.27, 0.27, 1.27]} color={pearl} solid={false} />
    </group>
  );
}

export function VaultRib({
  span,
  spring,
  peak,
  position,
}: {
  span: number;
  spring: number;
  peak: number;
  position: V3;
}) {
  const rib = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-span, spring, 0),
        new Vector3(-span * 0.84, spring + (peak - spring) * 0.47, 0),
        new Vector3(-span * 0.44, spring + (peak - spring) * 0.79, 0),
        new Vector3(0, peak, 0),
        new Vector3(span * 0.44, spring + (peak - spring) * 0.79, 0),
        new Vector3(span * 0.84, spring + (peak - spring) * 0.47, 0),
        new Vector3(span, spring, 0),
      ]),
    [span, spring, peak],
  );
  return (
    <group position={position}>
      <mesh>
        <tubeGeometry args={[rib, 30, span > 5 ? 0.28 : 0.22, 7, false]} />
        <meshStandardMaterial color={pearl} roughness={0.49} />
      </mesh>
      {[-0.24, 0.24].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <tubeGeometry args={[rib, 30, 0.047, 6, false]} />
          <Gilding glow={0.72} />
        </mesh>
      ))}
    </group>
  );
}

export function Rosette({ position, size = 1 }: { position: V3; size?: number }) {
  return (
    <group position={position} scale={size}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color={blue} side={2} roughness={0.84} />
      </mesh>
      {[0.92, 0.82, 0.48].map((r) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[r, 0.016, 5, 48]} />
          <Gilding />
        </mesh>
      ))}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.023, 0]}>
        <MadridCrest position={[0, -0.08, 0]} scale={0.42} />
      </group>
    </group>
  );
}
