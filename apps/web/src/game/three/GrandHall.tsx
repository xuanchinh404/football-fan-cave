import { BARCA_HALL, BARCA_MUSEUM } from '../../../../../packages/shared/barcelona/layout';
import { CAVE_CONNECTIONS } from '../../../../../packages/shared/caveConnections';
import { StoreStreet } from '../../store/StoreStreet';
import { BlenderAsset } from './BlenderAsset';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CuboidCollider,
  CylinderCollider,
  RigidBody,
  type RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CAVES,
  CAVE_RAILS,
  GRAND_TREES,
  GRAND_LAMPS,
  GRAND_CLIFFS,
  GRAND_PLACES,
  GRAND_SOLIDS,
  GRAND_SCOREBOARD,
  GRAND_SURFACES,
  KOP_ENTRANCE,
  grandHeight,
  surfaceHeight,
  type Surface,
} from '../../../../../packages/shared/grandHall';
import { AssetModel } from './AssetModel';
import { Box, Label } from './Models';
import {
  GoldenBall,
  SliceLandscape,
  SliceRoute,
  sliceLamp,
  sliceCliff,
} from './GrandHallSlice';
import { emit, on } from '../bridge';

export type Quality = 'low' | 'medium' | 'high';
function surfaceGeometry(s: Surface, thickness = 0.32) {
  const { x, z, w, d, south, north } = s;
  const vs = new Float32Array([
    x - w / 2,
    south,
    z + d / 2,
    x + w / 2,
    south,
    z + d / 2,
    x + w / 2,
    north,
    z - d / 2,
    x - w / 2,
    north,
    z - d / 2,
    x - w / 2,
    south - thickness,
    z + d / 2,
    x + w / 2,
    south - thickness,
    z + d / 2,
    x + w / 2,
    north - thickness,
    z - d / 2,
    x - w / 2,
    north - thickness,
    z - d / 2,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(vs, 3));
  g.setIndex([
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7,
    4, 3, 4, 0,
  ]);
  g.computeVertexNormals();
  g.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      [0, d / 3, w / 3, d / 3, w / 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      2,
    ),
  );
  return g;
}
function Ground() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#51475a';
    ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++)
      for (let col = -1; col < 8; col++) {
        const x = col * 80 + (row % 2) * 40,
          y = row * 64;
        ctx.fillStyle = ['#8d7b92', '#9291a2', '#a58a87', '#a89a89', '#838397'][
          Math.abs(row * 7 + col * 3) % 5
        ];
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, 76, 60, 5);
        ctx.fill();
        ctx.strokeStyle = '#edd1a335';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 16; i++) {
          ctx.fillStyle = i % 2 ? '#0000000b' : '#ffffff13';
          ctx.fillRect(x + ((i * 19) % 76), y + ((i * 11) % 60), 2, 2);
        }
      }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  const geometries = useMemo(() => GRAND_SURFACES.map((s) => surfaceGeometry(s)), []);
  useEffect(
    () => () => {
      tex.dispose();
      geometries.forEach((g) => g.dispose());
    },
    [tex, geometries],
  );
  return (
    <>
      {geometries.map((g, i) => {
        const surface = GRAND_SURFACES[i];
        const flat = surface.south === surface.north;
        return (
          <RigidBody key={surface.id} type="fixed" colliders={flat ? false : 'trimesh'}>
            {flat && (
              <CuboidCollider
                position={[surface.x, surface.south - 0.16, surface.z]}
                args={[surface.w / 2, 0.16, surface.d / 2]}
              />
            )}
            <mesh geometry={g} receiveShadow userData={{ cameraSolid: true }}>
              <meshStandardMaterial
                visible={GRAND_SURFACES[i].id !== 'main-stairs'}
                map={tex}
                bumpMap={tex}
                bumpScale={0.045}
                roughness={0.86}
                metalness={0.07}
                color={i === 0 ? '#dfd8e7' : '#b1b4dc'}
              />
            </mesh>
          </RigidBody>
        );
      })}
      {GRAND_SOLIDS.map((o) => (
        <RigidBody
          key={o.id}
          type="fixed"
          colliders={false}
          position={[o.x, o.base + o.h / 2, o.z]}
        >
          {o.round ? (
            <CylinderCollider args={[o.h / 2, o.w / 2]} />
          ) : (
            <CuboidCollider args={[o.w / 2, o.h / 2, o.d / 2]} />
          )}
        </RigidBody>
      ))}
    </>
  );
}
function SkyAndLighting({ quality, player, hideExterior }: {
  quality: Quality; player?: () => THREE.Vector3; hideExterior: boolean;
}) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const sky = useRef<THREE.HemisphereLight>(null);
  useFrame((_, dt) => {
    const feet = player?.();
    if (!feet || !sun.current || !fill.current || !sky.current) return;
    const [x, y, z] = CAVE_CONNECTIONS.real.offset;
    const inside = feet.y < y + 7 && feet.x > x - 17 && feet.x < x + 47 &&
      feet.z > z - 30 && feet.z < z + 13;
    const [bx, by, bz] = CAVE_CONNECTIONS.barcelona.offset;
    const inBarca = feet.y >= by - 0.15 && feet.y < by + 4 && feet.x > bx + BARCA_HALL.left &&
      feet.x < bx + BARCA_MUSEUM.right && feet.z > bz + BARCA_MUSEUM.north && feet.z < bz;
    const barcaShade = inBarca ? (feet.x > bx + BARCA_HALL.right ? 1 : Math.min(1, (bz - feet.z) / 7)) : 0;
    const ambient = inside ? 0.66 : THREE.MathUtils.lerp(1.24, 1.54, barcaShade);
    const daylight = inside ? 0.38 : THREE.MathUtils.lerp(2.85, 0.62, barcaShade);
    const reflected = inside ? 0.45 : THREE.MathUtils.lerp(0.95, 0.32, barcaShade);
    sun.current.intensity = THREE.MathUtils.damp(sun.current.intensity, daylight, 9, dt);
    fill.current.intensity = THREE.MathUtils.damp(fill.current.intensity, reflected, 9, dt);
    sky.current.intensity = THREE.MathUtils.damp(sky.current.intensity, ambient, 9, dt);
  });
  const { gl, scene } = useThree();
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, 0.06);
    const old = scene.environment;
    scene.environment = target.texture;
    return () => {
      scene.environment = old;
      target.dispose();
      generator.dispose();
      room.dispose();
    };
  }, [gl, scene]);
  return (
    <>
      <color attach="background" args={['#aaa6c4']} />
      <fog attach="fog" args={['#a5a3c6', 54, 176]} />
      <hemisphereLight ref={sky} args={['#d5dbff', '#705257', 1.24]} />
      <directionalLight
        ref={sun}
        position={[-37, 42, 27]}
        color="#ffdfb5"
        intensity={2.85}
        castShadow={quality !== 'low' && !hideExterior}
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-far={200}
        shadow-bias={-0.00015}
        shadow-normalBias={0.06}
      />
      <directionalLight ref={fill} position={[40, 20, -40]} color="#a0acff" intensity={0.95} />
      <mesh>
        <sphereGeometry args={[240, 32, 20]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{
            top: { value: new THREE.Color('#384175') },
            horizon: { value: new THREE.Color('#c0afca') },
            sun: { value: new THREE.Color('#f5bc9f') },
          }}
          vertexShader={`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`
            varying vec3 v; uniform vec3 top,horizon,sun;
            void main() {
              vec3 dir = normalize(v);
              float h = smoothstep(-.02,.65,dir.y);
              float warmth = pow(max(0., dot(dir,normalize(vec3(-.6,.18,.6)))),5.);
              gl_FragColor = vec4(mix(mix(horizon, sun, warmth*.9),top,h),1.);
              #include <colorspace_fragment>
            }
          `}
        />
      </mesh>
    </>
  );
}
function Waterfall({
  x,
  z,
  top,
  height,
  width = 4,
}: {
  x: number;
  z: number;
  top: number;
  height: number;
  width?: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.time.value = clock.elapsedTime;
  });
  return (
    <group position={[x, top - height / 2, z]}>
      <mesh>
        <planeGeometry args={[width, height, 12, 32]} />
        <shaderMaterial
          ref={material}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          uniforms={{ time: { value: 0 } }}
          vertexShader={`uniform float time;varying vec2 v;void main(){v=uv;vec3 p=position;p.z+=sin(uv.y*18.+time*3.+uv.x*12.)*.14;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`}
          fragmentShader={`uniform float time;varying vec2 v;void main(){float a=sin(v.x*35.+sin(v.y*12.-time*5.))*0.5+0.5;float b=pow(max(0.,sin(v.y*56.+time*13.+v.x*9.)),8.);vec3 c=mix(vec3(.03,.36,.78),vec3(.47,.9,1.),a*.7+b*.3);gl_FragColor=vec4(c,.72+.2*a);}`}
        />
      </mesh>
      <mesh position={[0, -height / 2 + 0.06, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[width * 0.7, 32]} />
        <meshStandardMaterial
          color="#69d9e5"
          emissive="#236e96"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}
function Landscape({ quality }: { quality: Quality }) {
  const trees = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (trees.current)
      trees.current.children.forEach(
        (g, i) => (g.rotation.z = Math.sin(clock.elapsedTime * 0.6 + i) * 0.009),
      );
  });
  const treePositions = GRAND_TREES;
  return (
    <>
      {GRAND_CLIFFS.map((p, i) =>
        sliceCliff(p) ? null : (
          <AssetModel
            key={i}
            asset="cliff-sculpted"
            position={[p.x, p.y, p.z]}
            scale={p.scale}
            rotation={[0, i * 1.7, 0.03 * Math.sin(i)]}
          />
        ),
      )}
      <group ref={trees}>
        {treePositions
          .filter(
            (_, i) => quality === 'high' || (quality === 'medium' ? i % 3 !== 0 : i % 3 === 0),
          )
          .map(([x, z], i) => (
            <AssetModel
              key={i}
              asset="cherry-tree"
              position={[x, grandHeight(x, z) || 0, z]}
              scale={z > 25 ? 2.6 : 1.6 + (i % 3) * 0.25}
              solid={false}
            />
          ))}
      </group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Waterfall x={s * 22} z={-45} top={18} height={17} width={4} />
          <Waterfall x={s * 49} z={-18} top={8} height={9.5} width={3} />
        </group>
      ))}
      {GRAND_SURFACES.filter((s) => s.id === 'east-bridge').map((s) => (
        <AssetModel key={s.id} asset="bridge-wood" position={[s.x, 0, s.z]} />
      ))}
      {GRAND_SURFACES.filter((s) => s.kind === 'stairs' && s.id !== 'main-stairs').map((s) => (
        <Steps key={s.id} surface={s} crestSteps={4} />
      ))}
      <Flowers quality={quality} />
    </>
  );
}
function Steps({ surface: s, crestSteps }: { surface: Surface; crestSteps?: number }) {
  const count = Math.round((s.north - s.south) / 0.16);
  const visible = Math.min(crestSteps ?? count, count);
  return (
    <group>
      {Array.from({ length: visible }, (_, index) => {
        const i = count - visible + index;
        const z = s.z + s.d / 2 - ((i + 0.5) * s.d) / count,
          y = surfaceHeight(s, z);
        return (
          <mesh key={i} position={[s.x, y - 0.09, z]} castShadow receiveShadow>
            <boxGeometry args={[s.w, 0.18, s.d / count]} />
            <meshStandardMaterial color={i % 2 ? '#ded3b1' : '#c4bba7'} roughness={0.8} />
          </mesh>
        );
      })}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[s.x + side * (s.w / 2 + 0.15), (s.south + s.north) / 2 + 0.8, s.z]}
          rotation={[Math.atan((s.north - s.south) / s.d), 0, 0]}
        >
          <boxGeometry args={[0.2, 0.18, Math.hypot(s.d, s.north - s.south)]} />
          <meshStandardMaterial color="#d7ab45" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
function Flowers({ quality }: { quality: Quality }) {
  const count = quality === 'low' ? 250 : 650;
  const flower = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        g = new THREE.SphereGeometry(1, 6, 4);
      g.scale(0.55, 0.16, 0.28);
      g.rotateY(-a);
      g.translate(Math.cos(a) * 0.35, 0.55, Math.sin(a) * 0.35);
      parts.push(g);
    }
    const centre = new THREE.IcosahedronGeometry(0.23, 0);
    centre.translate(0, 0.62, 0);
    parts.push(centre);
    const nonIndexed = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(nonIndexed)!;
    nonIndexed.forEach((g) => {
      if (!parts.includes(g)) g.dispose();
    });
    parts.forEach((g) => g.dispose());
    return merged;
  }, []);
  useEffect(() => () => flower.dispose(), [flower]);
  const transforms = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = i * 2.39996,
          ring = i < 150 ? 4.3 + (i % 7) * 0.18 : 0;
        const x = i < 150 ? Math.cos(angle) * ring : Math.sin(i * 78.13) * 51;
        const z = i < 150 ? 3 + Math.sin(angle) * ring : Math.cos(i * 43.71) * 37;
        if (
          i >= 150 &&
          (Math.abs(x) < 10 || z < -7 || (Math.abs(x - 14) < 10 && Math.abs(z - 15) < 9))
        )
          return null;
        const y = grandHeight(x, z);
        if (y === undefined) return null;
        return new THREE.Matrix4().compose(
          new THREE.Vector3(x, y + 0.25, z),
          new THREE.Quaternion(),
          new THREE.Vector3(0.32 + (i % 3) * 0.06, 0.4, 0.32),
        );
      }).filter(Boolean) as THREE.Matrix4[],
    [count],
  );
  return (
    <instancedMesh
      args={[undefined, undefined, transforms.length]}
      castShadow
      ref={(m) => {
        if (m) {
          transforms.forEach((v, i) => {
            m.setMatrixAt(i, v);
            m.setColorAt(i, new THREE.Color(['#ed358f', '#ffafcb', '#f8d15e', '#bc67ec'][i % 4]));
          });
          m.instanceMatrix.needsUpdate = true;
        }
      }}
    >
      <primitive object={flower} attach="geometry" />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}
function Buildings({ quality }: { quality: Quality }) {
  return (
    <>
      <GoldenBall quality={quality} />
      <Label text="ĐẠI SẢNH CHUNG" position={[0, 20, -33]} width={15} background="#523213" />
      <Label
        text="THẾ GIỚI CỦA NHỮNG NGƯỜI YÊU BÓNG ĐÁ"
        position={[0, 18.3, -32.95]}
        width={11}
        background="#523213"
      />
      <group position={[GRAND_SCOREBOARD.x, 0, GRAND_SCOREBOARD.z]}>
        {[-4.5, 4.5].map((x) => (
          <Box key={x} position={[x, 2.5, 0]} size={[0.3, 5, 0.3]} color="#674536" />
        ))}
        <Box position={[0, 4.8, 0]} size={[9, 2.2, 0.5]} color="#674536" />
        <Label text="KẾT QUẢ BÓNG ĐÁ · DEMO" position={[0, 5.25, 0.29]} width={8} />
        <Label
          text="CHƯA KẾT NỐI DỮ LIỆU TRẬN ĐẤU"
          position={[0, 4.25, 0.29]}
          width={7.5}
          background="#24325b"
        />
      </group>
      <group position={[-32, 0, 2]}>
        <AssetModel asset="pavilion" scale={1.4} tint="#a7124d" />
        <Label text="ĐẤU TRƯỜNG CÀ KHỊA" position={[0, 7.7, 5.6]} width={12} />
        <Label text="VS" position={[0, 4, -2.6]} width={7} background="#62109a" />
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 5.6, 1.3, 1]}>
            <boxGeometry args={[2.1, 0.25, 7]} />
            <meshStandardMaterial color="#924464" />
          </mesh>
        ))}
      </group>
      <group position={[24, 0, -1]}>
        <AssetModel asset="pavilion" tint="#174dce" />
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[1.2, 32, 24]} />
          <meshStandardMaterial
            color="#2366ff"
            emissive="#265fff"
            emissiveIntensity={2}
            roughness={0.1}
            metalness={0.5}
          />
        </mesh>
        <Label text="ĐỀN DỰ ĐOÁN" position={[0, 5, 3.6]} width={8} />
      </group>
      <StoreStreet />
      {[
        [18, 28],
        [25, 29],
        [32, 27],
      ].map(([x, z], i) => (
        <AssetModel key={i} asset="fan-table" position={[x, 0, z]} solid={false} />
      ))}
      <Label text="KHU GIAO LƯU FAN" position={[25, 4.2, 27]} width={10} />
      <PhotoBooth />
      <group position={[31, 0, 2.4]}>
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[5, 6.4, 0.4]} />
          <meshStandardMaterial color="#553619" />
        </mesh>
        <Label text="BẢNG XẾP HẠNG · DEMO" position={[0, 6.1, 0.4]} width={6} />
        {CAVES.slice(0, 9).map((c, i) => (
          <Label
            key={c.id}
            text={`${i + 1}. ${c.short}     —`}
            position={[0, 5.5 - i * 0.5, 0.4]}
            width={4.7}
            background="#302332"
            color={c.color}
          />
        ))}
      </group>
      <group position={[0, 0, 37.6]} rotation={[0, Math.PI, 0]}>
        <AssetModel asset="portal-grand" tint="#2657b7" scale={1.3} />
        <Label text="HỘI VÀO HANG" position={[0, 10.9, 2.7]} width={11} />
      </group>
    </>
  );
}
function PhotoBooth() {
  return (
    <group position={[-15, 0, 10]}>
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <boxGeometry args={[6, 0.14, 4]} />
        <meshStandardMaterial color="#c52848" roughness={0.7} />
      </mesh>
      <AssetModel asset="portal-grand" scale={0.58} tint="#c02784" position={[0, 0, -1.3]} />
      <Label text="GÓC CHỤP ẢNH" position={[0, 4.85, 0.05]} width={5.3} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 4, 0, 2]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.09, 2.4, 10]} />
            <meshStandardMaterial color="#292d40" />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[1, 0.7, 0.7]} />
            <meshStandardMaterial color="#262c3d" />
          </mesh>
          <mesh position={[0, 2.5, 0.4]}>
            <cylinderGeometry args={[0.21, 0.21, 0.3, 20]} />
            <meshStandardMaterial color="#b3dce1" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Minigame() {
  const ball = useRef<RapierRigidBody>(null),
    active = useRef(false),
    resetAt = useRef(0),
    scored = useRef(false);
  useEffect(
    () =>
      on<{ aim: number; power: number }>('kick', ({ aim, power }) => {
        const b = ball.current;
        if (!b || active.current) return;
        b.setTranslation({ x: 14, y: 0.3, z: 18 }, true);
        b.setLinvel(
          {
            x: THREE.MathUtils.clamp(aim, -1, 1) * 5,
            y: 5 + THREE.MathUtils.clamp(power, 0, 1) * 5,
            z: -13,
          },
          true,
        );
        active.current = true;
        scored.current = false;
        resetAt.current = performance.now() + 2800;
      }),
    [],
  );
  useFrame(() => {
    if (!active.current || !ball.current) return;
    const p = ball.current.translation();
    if (!scored.current && p.z < 9.2) {
      scored.current = true;
      const hit = Math.abs(p.x - 14) < 3.7 && p.y < 3 && p.y > 0.2;
      emit(
        'minigame-result',
        hit ? 'VÀO! Một cú sút thành công.' : 'Chưa trúng khung thành. Thử lại nhé!',
      );
    }
    if (performance.now() > resetAt.current) {
      ball.current.setTranslation({ x: 14, y: 0.25, z: 18 }, true);
      ball.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ball.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      active.current = false;
    }
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.045, 14.5]} receiveShadow>
        <planeGeometry args={[16, 13]} />
        <meshStandardMaterial color="#3c9a49" roughness={0.9} />
      </mesh>
      {[-8, 8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[14 + x, 0.052, 14.5]}>
          <planeGeometry args={[0.12, 13]} />
          <meshBasicMaterial color="#e5f1cf" />
        </mesh>
      ))}
      {[-6.5, 6.5].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.053, 14.5 + z]}>
          <planeGeometry args={[16, 0.12]} />
          <meshBasicMaterial color="#e5f1cf" />
        </mesh>
      ))}
      <RigidBody type="fixed" colliders="cuboid">
        {[-1, 1].map((s) => (
          <mesh key={s} position={[14 + s * 4, 1.5, 9]} castShadow>
            <boxGeometry args={[0.14, 3, 0.14]} />
            <meshStandardMaterial color="#f2f2e6" metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[14, 3, 9]} castShadow>
          <boxGeometry args={[8.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#f2f2e6" />
        </mesh>
      </RigidBody>
      {Array.from({ length: 17 }, (_, i) => (
        <mesh key={i} position={[10 + i * 0.5, 1.5, 8]}>
          <boxGeometry args={[0.018, 3, 0.018]} />
          <meshStandardMaterial color="#dcebdc" />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[14, i * 0.5, 8]}>
          <boxGeometry args={[8, 0.018, 0.018]} />
          <meshStandardMaterial color="#dcebdc" />
        </mesh>
      ))}
      <RigidBody
        ref={ball}
        colliders="ball"
        position={[14, 0.25, 18]}
        restitution={0.55}
        friction={0.7}
        mass={0.45}
        ccd
      >
        <mesh castShadow>
          <sphereGeometry args={[0.24, 24, 16]} />
          <meshStandardMaterial color="#f7eed1" roughness={0.4} />
        </mesh>
      </RigidBody>
      <Label text="SÂN MINIGAME" position={[14, 4.4, 8.8]} width={9} />
    </group>
  );
}
function Details({ quality }: { quality: Quality }) {
  const lamps = GRAND_LAMPS.map((p) => [p.x, p.z]);
  return (
    <>
      {lamps.map(([x, z], i) => {
        const y = grandHeight(x, z);
        if (y === undefined || sliceLamp(x, z)) return null;
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 1.3, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.14, 2.6, 8]} />
              <meshStandardMaterial color="#5a4830" metalness={0.4} />
            </mesh>
            <AssetModel asset="lantern" position={[0, 2.6, 0]} solid={false} />
          </group>
        );
      })}
      {Array.from({ length: quality === 'low' ? 2 : quality === 'medium' ? 5 : 9 }, (_, i) => {
        const x = [-10, 9, -23, 22, 31, -37, 18, -18, 38][i],
          z = [12, 4, 5, 24, 20, 6, 29, 24, 15][i];
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, i * 1.4, 0]}>
            <AssetModel
              asset="fan-chibi"
              scale={0.73}
              tint={['#2753a0', '#a5283b', '#398d85'][i % 3]}
              animation={i % 3 ? 'Idle' : 'Cheer'}
              solid={false}
            />
            <Label text="NPC · Fan" position={[0, 2.15, 0]} width={1.8} />
          </group>
        );
      })}
    </>
  );
}
export function GrandHall({ quality = 'medium', player, hideExterior = false }: {
  quality?: Quality; player?: () => THREE.Vector3; hideExterior?: boolean;
}) {
  return (
    <group name="grand-hall-three-tiers">
      <SkyAndLighting quality={quality} player={player} hideExterior={hideExterior} />
      <group visible={!hideExterior}>
        <Ground />
        <TerrainFaces />
        <Landscape quality={quality} />
        <SliceLandscape quality={quality} />
        <SliceRoute
          quality={quality}
          bridgeFallback={<AssetModel asset="bridge-stone" position={[-41, 0, -15]} />}
          stairFallback={<Steps surface={GRAND_SURFACES.find((s) => s.id === 'main-stairs')!} />}
        />
        {CAVE_RAILS.map((rail) => (
          <Box key={rail.id} position={[rail.x, rail.base + rail.h / 2, rail.z]}
            size={[rail.w, rail.h, rail.d]} color="#4b414f" />
        ))}
        <Buildings quality={quality} />
        <Minigame />
        <Details quality={quality} />
      </group>
    </group>
  );
}

function TerrainFaces() {
  const faces = useMemo(() => {
    const pieces: THREE.BufferGeometry[] = [];
    for (const [left, right, z, height, bottom] of [
      [-55, -38, -22, 7, -3],
      [-38, 38, -23.2, 7, -3],
      [38, 55, -22, 7, -3],
      [-50, KOP_ENTRANCE.x - 4.2, -47, 15, 6],
      [KOP_ENTRANCE.x - 4.2, -16, -47, 15, 12.9],
      [16, 50, -47, 15, 6],
      [-55, 55, 40, 0, -7],
    ]) {
      const n = Math.ceil((right - left) / 2),
        verts: number[] = [],
        idx: number[] = [],
        colors: number[] = [];
      for (let row = 0; row < 4; row++)
        for (let i = 0; i <= n; i++) {
          const x = left + ((right - left) * i) / n,
            y = bottom + ((height - bottom) * row) / 3,
            offset = row === 3 ? 0 : Math.sin(i * 2.4 + row) * 0.65;
          verts.push(x, y, z + offset);
          const c = new THREE.Color(['#435b7f', '#5e7494', '#667d9a', '#6c8a87'][(i + row) % 4]);
          colors.push(c.r, c.g, c.b);
        }
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < n; i++) {
          const a = row * (n + 1) + i;
          idx.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1);
        }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      pieces.push(g);
    }
    return pieces;
  }, []);
  useEffect(() => () => faces.forEach((g) => g.dispose()), [faces]);
  return (
    <>
      {faces.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow castShadow userData={{ cameraSolid: true }}>
          <meshStandardMaterial vertexColors roughness={1} flatShading side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.3, -15]}>
        <planeGeometry args={[110, 14]} />
        <meshStandardMaterial color="#16586c" metalness={0.43} roughness={0.27} />
      </mesh>
      {GRAND_SURFACES.filter((s) => s.kind === 'stairs' || s.kind === 'bridge').map((s) => (
        <RigidBody
          key={s.id}
          type="fixed"
          colliders={false}
          position={[s.x, (s.south + s.north) / 2, s.z]}
          rotation={[Math.atan((s.north - s.south) / s.d), 0, 0]}
        >
          {[-1, 1].map((side) => (
            <CuboidCollider
              key={side}
              position={[side * (s.w / 2 + 0.12), 0.7, 0]}
              args={[0.12, 0.7, Math.hypot(s.d, s.north - s.south) / 2]}
            />
          ))}
        </RigidBody>
      ))}
    </>
  );
}
