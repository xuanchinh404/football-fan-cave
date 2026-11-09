import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, InstancedMesh, Object3D, Vector3 } from 'three';
import { socket } from '../network/client';
import { emit, on } from '../game/bridge';
import { product, type Product } from '../../../../packages/shared/store/catalog';
import {
  flightLifetime,
  flightPoint,
  type Flight,
  type Impact,
  type XYZ,
} from '../../../../packages/shared/store/physics';
import { Ring, StoreModel } from './StoreModel';

type VisualFlight = Flight & { start: number };
type BurstData = { id: string; item: Product; point: XYZ; at: number; splat?: boolean };

let audio: AudioContext | undefined;
function enableAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
  } catch {}
}
function pop(visual: Product['visual']) {
  if (!audio || audio.state !== 'running') return;
  const at = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = visual === 'water' ? 'sine' : 'triangle';
  oscillator.frequency.setValueAtTime(visual === 'egg' ? 340 : 230, at);
  oscillator.frequency.exponentialRampToValueAtTime(45, at + 0.14);
  gain.gain.setValueAtTime(0.035, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + 0.17);
}
function Projectile({ flight }: { flight: VisualFlight }) {
  const ref = useRef<Group>(null);
  const trail = useRef<Group>(null);
  const item = product(flight.sku)!;
  useFrame(() => {
    if (!ref.current) return;
    const age = (performance.now() - flight.start) / 1000;
    ref.current.visible = age >= 0;
    if (trail.current) {
      trail.current.visible = age > 0.045;
      trail.current.children.forEach((node, index) => {
        node.position.set(...flightPoint(flight, Math.max(0, age - (index + 1) * 0.029)));
      });
    }
    if (age < 0) return;
    ref.current.position.set(...flightPoint(flight, age));
    ref.current.rotation.set(age * 6.5, age * 8, age * 3);
  });
  return (
    <>
      <group ref={ref} visible={false} name="store-projectile">
        <StoreModel item={item} size={0.32} />
      </group>
      <group ref={trail} visible={false}>
        {[0.053, 0.039, 0.025].map((size) => (
          <mesh key={size}>
            <sphereGeometry args={[size, 7, 5]} />
            <meshBasicMaterial color={item.color} transparent opacity={0.55} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function Burst({ data, preview = false }: { data: BurstData; preview?: boolean }) {
  const particles = useRef<InstancedMesh>(null);
  const ring = useRef<Group>(null);
  const ref = useRef<Group>(null);
  const { item, at, point, splat } = data;
  const lifetime = splat ? 0.8 : 1.28;
  const count = splat ? 19 : 27;
  const velocity = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = index * 2.39996;
        const speed = 0.65 + (index % 6) * 0.36;
        return new Vector3(
          Math.cos(angle) * speed,
          0.65 + (index % 5) * 0.39,
          Math.sin(angle) * speed,
        );
      }),
    [count],
  );
  const dummy = useMemo(() => new Object3D(), []);
  const paper = ['roll', 'cake', 'confetti', 'tissue'].includes(item.visual);
  const smoke = ['rotten', 'powder', 'ghost'].includes(item.visual);
  const spark = ['glitter', 'fireworks', 'lightning'].includes(item.visual);
  useFrame(() => {
    if (!particles.current) return;
    const elapsed = (performance.now() - at) / 1000;
    const age = preview ? elapsed % 2.1 : elapsed;
    for (let index = 0; index < count; index++) {
      const v = velocity[index];
      const size = Math.max(
        0.001,
        (1 - age / lifetime) * (index % 2 ? 0.13 : 0.085) * (smoke ? 1.35 : 1),
      );
      dummy.position.copy(v).multiplyScalar(age);
      dummy.position.y += smoke ? 0.7 * age : -2.35 * age ** 2;
      dummy.rotation.set(age * index, age * 4 + index, index * 0.73);
      dummy.scale.set(size, paper ? size * 0.25 : size, spark ? size * 0.42 : size);
      dummy.updateMatrix();
      particles.current.setMatrixAt(index, dummy.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
    if (ring.current) {
      ring.current.scale.setScalar(0.24 + age * 1.6);
      ring.current.visible = age < 0.38;
    }
    if (ref.current) ref.current.visible = age < lifetime;
  });
  return (
    <group ref={ref} position={point} name={splat ? 'store-impact' : 'store-burst'}>
      <instancedMesh ref={particles} args={[undefined, undefined, count]} frustumCulled={false}>
        {paper ? <boxGeometry args={[1, 1, 1.3]} /> : <icosahedronGeometry args={[1, 0]} />}
        <meshStandardMaterial
          color={item.color}
          emissive={smoke ? '#5c6422' : item.color}
          emissiveIntensity={spark ? 0.9 : 0.25}
        />
      </instancedMesh>
      <group ref={ring}>
        <Ring radius={splat ? 0.33 : 0.65} color={item.color} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
      {!splat && (item.category !== 'effects' || item.visual === 'ghost') && (
        <group position={[0, 0.65, 0]}>
          <StoreModel item={item} size={0.65} />
        </group>
      )}
    </group>
  );
}

export function StoreWorldEffects({
  plaza,
  effects,
  location,
  locate,
}: {
  plaza: boolean;
  effects: boolean;
  location: () => XYZ;
  locate: (id: string) => XYZ | undefined;
}) {
  const [flights, setFlights] = useState<VisualFlight[]>([]);
  const [bursts, setBursts] = useState<BurstData[]>([]);
  const latest = useRef({ plaza, effects, location, locate });
  latest.current = { plaza, effects, location, locate };
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    function after(callback: () => void, ms: number) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, ms);
      timers.add(timer);
    }
    function burst(id: string, sku: string, point: XYZ, splat = false) {
      const item = product(sku);
      if (!item) return;
      setBursts((previous) => [
        ...previous.slice(-7),
        { id, item, point, at: performance.now(), splat },
      ]);
      after(() => setBursts((previous) => previous.filter((b) => b.id !== id)), splat ? 810 : 1300);
    }
    function flight(data: Flight) {
      if (
        !latest.current.plaza ||
        !product(data.sku) ||
        (!latest.current.effects && data.owner !== socket.id)
      )
        return;
      setFlights((previous) => [
        ...previous.slice(-19),
        { ...data, start: performance.now() + data.delay },
      ]);
      emit('store-gesture', {
        id: data.owner,
        clip: 'Throw',
        sku: data.sku,
        release: data.delay,
        facing: Math.atan2(data.velocity[0], data.velocity[2]),
      });
      after(
        () => setFlights((previous) => previous.filter((f) => f.id !== data.id)),
        flightLifetime * 1000 + data.delay,
      );
    }
    function impact(data: Impact) {
      setFlights((previous) => previous.filter((f) => f.id !== data.id));
      if (
        !latest.current.plaza ||
        (!latest.current.effects && data.owner !== socket.id && data.target !== socket.id)
      )
        return;
      const item = product(data.sku);
      if (!item) return;
      burst(data.id, data.sku, data.point, true);
      pop(item.visual);
      if (data.target) emit('store-gesture', { id: data.target, clip: 'Angry' });
    }
    function action({ id, sku }: { id: string; sku: string }) {
      const item = product(sku);
      if (item?.clip) emit('store-gesture', { id, clip: item.clip });
      if (!item || item.action === 'emote' || (!latest.current.effects && id !== socket.id)) return;
      const point = id === socket.id ? latest.current.location() : latest.current.locate(id);
      if (point) burst(crypto.randomUUID(), sku, [point[0], point[1] + 0.7, point[2]]);
    }
    socket.on('store:flight', flight);
    socket.on('store:impact', impact);
    socket.on('store:action', action);
    window.addEventListener('pointerdown', enableAudio);
    window.addEventListener('keydown', enableAudio);
    const off = on<string>('store-gift-received', (sku) => {
      if (latest.current.effects) burst(crypto.randomUUID(), sku, latest.current.location());
    });
    const mapChange = on('map-changed', () => {
      setFlights([]);
      setBursts([]);
    });
    return () => {
      off();
      mapChange();
      timers.forEach(clearTimeout);
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('keydown', enableAudio);
      socket.off('store:flight', flight);
      socket.off('store:impact', impact);
      socket.off('store:action', action);
    };
  }, []);
  return (
    <>
      {plaza && flights.map((f) => <Projectile key={f.id} flight={f} />)}
      {bursts.map((b) => (
        <Burst key={b.id} data={b} />
      ))}
    </>
  );
}
