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
  GRAND_TREES,
  GRAND_LAMPS,
  GRAND_CLIFFS,
  GRAND_PLACES,
  GRAND_SOLIDS,
  GRAND_SURFACES,
  grandHeight,
  surfaceHeight,
  type Surface,
} from '../../../../../packages/shared/grandHall';
import { AssetModel } from './AssetModel';
import { Label } from './Models';
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
    ctx.fillStyle = '#4b465b';
    ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++)
      for (let col = -1; col < 8; col++) {
        const x = col * 80 + (row % 2) * 40,
          y = row * 64;
        const n = (Math.sin(row * 45 + col * 73) + 1) / 2;
        ctx.fillStyle = ['#a397b4', '#a6adb9', '#c0a4a2', '#c9b897', '#8e91ae'][
          Math.abs(row * 7 + col * 3) % 5
        ];
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, 76, 60, 5);
        ctx.fill();
        ctx.strokeStyle = '#f1d4a54d';
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
      {geometries.map((g, i) => (
        <RigidBody key={GRAND_SURFACES[i].id} type="fixed" colliders="trimesh">
          <mesh geometry={g} receiveShadow userData={{ cameraSolid: true }}>
            <meshStandardMaterial
              map={tex}
              bumpMap={tex}
              bumpScale={0.045}
              roughness={0.86}
              metalness={0.07}
              color={i === 0 ? '#dfd8e7' : '#b1b4dc'}
            />
          </mesh>
        </RigidBody>
      ))}
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
function SkyAndLighting({ quality }: { quality: Quality }) {
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
      <color attach="background" args={['#859bc7']} />
      <fog attach="fog" args={['#98a9d0', 85, 225]} />
      <hemisphereLight args={['#cadfff', '#61615b', 1.15]} />
      <directionalLight
        position={[-35, 70, 25]}
        color="#ffe3b6"
        intensity={2.4}
        castShadow={quality !== 'low'}
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-far={200}
        shadow-bias={-0.00015}
        shadow-normalBias={0.06}
      />
      <directionalLight position={[40, 20, -40]} color="#9abaff" intensity={0.65} />
      <mesh>
        <sphereGeometry args={[240, 32, 20]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{
            top: { value: new THREE.Color('#313366') },
            bottom: { value: new THREE.Color('#a5d6e7') },
          }}
          vertexShader={`varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec3 v;uniform vec3 top,bottom;void main(){float h=clamp(normalize(v).y*.9+.15,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);}`}
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
function Portal({ c }: { c: (typeof CAVES)[number] }) {
  const scale = c.id === 'united' || c.tier === 3 ? 1.2 : 1;
  const ring = useRef<THREE.Group>(null);
  const energy = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }, dt) => {
    if (energy.current) energy.current.uniforms.time.value = clock.elapsedTime;
    if (ring.current) ring.current.rotation.z += dt * 0.12;
  });
  return (
    <group
      name={`cave-${c.id}`}
      userData={{ caveId: c.id, tier: c.tier }}
      position={[c.x, c.height, c.z]}
      scale={scale}
    >
      <AssetModel asset="portal-grand" tint={c.color} />
      <Label
        text={c.short}
        position={[0, 8.38, 2.04]}
        width={9.2}
        background="#30172f"
        color="#fff2c5"
      />
      <Label
        text={c.available ? 'EXPLORER · MỞ CỬA' : 'NỘI THẤT · SẮP RA MẮT'}
        position={[0, 1.15, 1.26]}
        width={4}
        background="#221b3c"
      />
      <mesh position={[0, 3.5, 1.22]}>
        <circleGeometry args={[3.5, 64]} />
        <shaderMaterial
          ref={energy}
          side={THREE.DoubleSide}
          uniforms={{ time: { value: 0 }, tint: { value: new THREE.Color(c.color) } }}
          vertexShader="varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
          fragmentShader="uniform float time;uniform vec3 tint;varying vec2 v;void main(){vec2 p=v-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float spiral=pow(.5+.5*sin(a*7.+r*19.-time*2.),4.);float ring=pow(.5+.5*sin(r*40.-time*3.),14.);float edge=pow(r,7.);vec3 color=tint*(.15+spiral*.55+ring*.5+edge*2.5);color+=vec3(1.,.85,.55)*pow(max(0.,1.-r),15.)*.5;gl_FragColor=vec4(color,1.);}"
        />
      </mesh>
      <group ref={ring} position={[0, 3.5, 1.32]}>
        <mesh>
          <torusGeometry args={[3.6, 0.08, 8, 64]} />
          <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={4} />
        </mesh>
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i * Math.PI * 2) / 18;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 3.65, Math.sin(a) * 3.65, 0.03]}
              rotation={[0, 0, a]}
            >
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color="#fff4c6" emissive={c.color} emissiveIntensity={3} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 3.2, 0.2]}>
        <planeGeometry args={[7, 6.2]} />
        <meshStandardMaterial
          color={c.color}
          emissive={c.color}
          emissiveIntensity={0.45}
          transparent
          opacity={0.17}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Label text={c.symbol} position={[0, 10.1, 1.4]} width={1.8} background={c.color} />
      <pointLight color={c.color} position={[0, 3, 3]} intensity={45} distance={12} decay={2} />
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
  const cliffPositions = GRAND_CLIFFS;
  const treePositions = GRAND_TREES;
  return (
    <>
      {cliffPositions.map((p, i) => (
        <AssetModel
          key={i}
          asset="cliff-sculpted"
          position={[p.x, p.y, p.z]}
          scale={p.scale}
          rotation={[0, i * 1.7, 0.03 * Math.sin(i)]}
        />
      ))}
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
          <Waterfall x={s * 25} z={-21.7} top={9} height={10.5} width={5} />
          <Waterfall x={s * 49} z={-18} top={8} height={9.5} width={3} />
        </group>
      ))}
      {GRAND_SURFACES.filter((s) => s.kind === 'bridge').map((s) => (
        <AssetModel
          key={s.id}
          asset={s.x < 0 ? 'bridge-stone' : 'bridge-wood'}
          position={[s.x, 0, s.z]}
        />
      ))}
      {GRAND_SURFACES.filter((s) => s.kind === 'stairs').map((s) => (
        <Steps key={s.id} surface={s} />
      ))}
      <Flowers quality={quality} />
    </>
  );
}
function Steps({ surface: s }: { surface: Surface }) {
  const count = Math.round((s.north - s.south) / 0.16);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
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
function Buildings() {
  return (
    <>
      <AssetModel asset="golden-football" position={[0, 0, 3]} />
      <Label text="ĐẠI SẢNH CHUNG" position={[0, 20, -33]} width={15} background="#523213" />
      <Label
        text="THẾ GIỚI CỦA NHỮNG NGƯỜI YÊU BÓNG ĐÁ"
        position={[0, 18.3, -32.95]}
        width={11}
        background="#523213"
      />
      <Label text="KẾT QUẢ BÓNG ĐÁ · DEMO" position={[0, 5.2, -5.5]} width={8} />
      <Label
        text="CHƯA KẾT NỐI DỮ LIỆU TRẬN ĐẤU"
        position={[0, 4.3, -5.5]}
        width={7.5}
        background="#24325b"
      />
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
      {[
        [-24, 19, 'TRANG PHỤC'],
        [-14, 19, 'HIỆU ỨNG'],
        [31, 14, 'NẠP XU'],
        [41, 14, 'CÀ KHỊA'],
        [48, 5, 'VIP'],
      ].map(([x, z, name], i) => (
        <group key={i} position={[Number(x), 0, Number(z)]}>
          <AssetModel asset="market-stall" tint={i % 2 ? '#184c86' : '#b51d40'} />
          <Label text={String(name)} position={[0, 3.2, 2.07]} width={4.6} />
          <AssetModel
            asset="fan-chibi"
            position={[0, 0, -0.4]}
            scale={0.8}
            animation="Idle"
            solid={false}
          />
        </group>
      ))}
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
        if (y === undefined) return null;
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
export function GrandHall({ quality = 'medium' }: { quality?: Quality }) {
  return (
    <group name="grand-hall-three-tiers">
      <SkyAndLighting quality={quality} />
      <Ground />
      <TerrainFaces />
      <Landscape quality={quality} />
      {CAVES.map((c) => (
        <Portal key={c.id} c={c} />
      ))}
      <Buildings />
      <Minigame />
      <Details quality={quality} />
    </group>
  );
}

function TerrainFaces() {
  const faces = useMemo(() => {
    const pieces: THREE.BufferGeometry[] = [];
    for (const [left, right, z, height, bottom] of [
      [-55, 55, -22, 7, -3],
      [-50, -16, -47, 15, 6],
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
        <meshStandardMaterial color="#127baf" metalness={0.35} roughness={0.15} />
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
