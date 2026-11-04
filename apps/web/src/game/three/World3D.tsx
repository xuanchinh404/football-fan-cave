import { CAVES } from '../../../../../packages/shared/grandHall';
import { type Quality } from './GrandHall';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
  type RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import {
  SPEED,
  RUN_SPEED,
  groundHeight,
  spawn,
  TEAMS,
  type Player,
  type Point,
  type Profile,
} from '../../../../../packages/shared/world';
import { emit, on, type RemoteEvent, type StartEvent } from '../bridge';
import { Character, Label } from './Models';
import { Environment } from './Environments';
import { layouts, playtestNear, toNetwork, toScene, type SceneId } from './worldLayout';

type Controls = {
  keys: Set<string>;
  joystick: Point;
  blocked: boolean;
  enabled: boolean;
  yaw: number;
  pitch: number;
  distance: number;
  running: boolean;
  view: 'default' | 'atlas' | 'entrance' | 'photo';
};
type Runtime = {
  map: SceneId;
  profile: Profile;
  self: string;
  direction: number;
  moving: boolean;
  feet: THREE.Vector3;
  controls: Controls;
  collisions: number;
  grounded: boolean;
  frames: number;
  transitionAt: number;
  seated?: boolean;
};
const isTyping = () =>
  /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') ||
  (document.activeElement as HTMLElement)?.isContentEditable;

export function World3D() {
  const { gl, camera, scene } = useThree();
  useEffect(() => {
    const previous = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = previous;
    };
  }, [gl]);
  const [map, setMap] = useState<SceneId>('plaza');
  const [profile, setProfile] = useState<Profile>({
    nickname: 'Fan khám phá',
    team: 'united',
    avatar: 0,
  });
  const [remotes, setRemotes] = useState<Player[]>([]);
  const [bubble, setBubble] = useState('');
  const [remoteBubbles, setRemoteBubbles] = useState<Record<string, string>>({});
  const runtime = useRef<Runtime>({
    map: 'plaza',
    profile,
    self: 'demo',
    direction: Math.PI,
    moving: false,
    feet: new THREE.Vector3(
      ...([toScene('plaza', spawn('plaza'))[0], 0, toScene('plaza', spawn('plaza'))[1]] as [
        number,
        number,
        number,
      ]),
    ),
    controls: {
      keys: new Set(),
      joystick: { x: 0, y: 0 },
      blocked: false,
      enabled: false,
      yaw: 0,
      pitch: 0.22,
      distance: 12,
      running: false,
      view: 'default',
    },
    collisions: 0,
    grounded: false,
    frames: 0,
    transitionAt: 0,
  });
  const pendingPosition = useRef<Point | null>(null);
  const [revision, setRevision] = useState(0);
  const [quality, setQuality] = useState<Quality>(window.innerWidth < 700 ? 'low' : 'medium');
  const [gesture, setGesture] = useState<string | undefined>();
  useEffect(() => {
    let bubbleTimer: ReturnType<typeof setTimeout>;
    const r = runtime.current;
    function travel(e: { map: SceneId; x?: number; y?: number }) {
      if (e.map !== 'plaza' && e.map !== 'united') {
        emit('notice', 'Bản chơi thử 3D hiện mở Đại Sảnh Chung và Hang Quỷ Đỏ.');
        return;
      }
      const p = e.x === undefined ? spawn(e.map) : { x: e.x, y: e.y! };
      const [x, z] = toScene(e.map, p);
      const returning = r.map === 'united' && e.map === 'plaza';
      pendingPosition.current = p;
      r.feet.set(x, groundHeight(e.map, p) || 0, z);
      r.map = e.map;
      r.controls.keys.clear();
      r.controls.joystick = { x: 0, y: 0 };
      r.controls.yaw = returning ? Math.PI : 0;
      r.controls.pitch = 0.22;
      r.controls.view = 'default';
      r.transitionAt = performance.now();
      r.moving = false;
      setMap(e.map);
      setRevision((v) => v + 1);
      setRemotes([]);
      setBubble('');
      emit('map-changed', e.map);
      publish(60);
    }
    function interact() {
      if (!r.controls.enabled || r.controls.blocked || isTyping()) return;
      const position = toNetwork(r.map, r.feet.x, r.feet.z);
      emit('movement', { ...position, height: r.feet.y, direction: r.direction, moving: r.moving });
      emit('interact', { map: r.map, position });
    }
    function keydown(e: KeyboardEvent) {
      if (isTyping() || r.controls.blocked || !r.controls.enabled) return;
      if (
        [
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'ArrowUp',
          'ArrowLeft',
          'ArrowDown',
          'ArrowRight',
          'ShiftLeft',
          'ShiftRight',
        ].includes(e.code)
      ) {
        e.preventDefault();
        r.controls.keys.add(e.code);
      }
      if (e.code === 'KeyE' && !e.repeat) interact();
      if (e.code === 'Enter' && !e.repeat) {
        e.preventDefault();
        emit('focus-chat');
      }
      if (e.code === 'KeyR') {
        r.controls.yaw = r.direction - Math.PI;
        r.controls.pitch = 0.22;
        r.controls.view = 'default';
      }
    }
    function keyup(e: KeyboardEvent) {
      r.controls.keys.delete(e.code);
    }
    function blur() {
      r.controls.keys.clear();
      r.controls.joystick = { x: 0, y: 0 };
      drag = null;
      r.controls.running = false;
    }
    let drag: { id: number; x: number; y: number } | null = null;
    const canvas = gl.domElement;
    function down(e: PointerEvent) {
      if (
        r.controls.blocked ||
        !r.controls.enabled ||
        (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2)
      )
        return;
      canvas.focus();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    }
    function move(e: PointerEvent) {
      if (!drag || drag.id !== e.pointerId || r.controls.blocked) return;
      r.controls.yaw -= (e.clientX - drag.x) * 0.006;
      r.controls.pitch = THREE.MathUtils.clamp(
        r.controls.pitch + (e.clientY - drag.y) * 0.005,
        0.07,
        1.1,
      );
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
    function up(e: PointerEvent) {
      if (drag?.id === e.pointerId) drag = null;
    }
    function wheel(e: WheelEvent) {
      e.preventDefault();
      r.controls.distance = THREE.MathUtils.clamp(r.controls.distance + e.deltaY * 0.008, 3.5, 12);
    }
    function context(e: Event) {
      e.preventDefault();
    }
    canvas.tabIndex = 0;
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('contextmenu', context);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', blur);
    const off = [
      on<StartEvent>('start', (e) => {
        r.profile = e.profile;
        r.self = e.id;
        r.controls.enabled = true;
        setProfile(e.profile);
      }),
      on<boolean>('block', (value) => {
        r.controls.blocked = value;
        blur();
      }),
      on<Point>('joystick', (p) => {
        r.controls.joystick = p;
      }),
      on<{ map: SceneId; x?: number; y?: number }>('travel', travel),
      on<Point>('correct', (p) => {
        pendingPosition.current = p;
      }),
      on<RemoteEvent>('remotes', (e) => {
        r.self = e.self;
        setRemotes(e.players.filter((p) => p.id !== e.self && p.map === r.map));
      }),
      on<{ id: string; text: string }>('bubble', (e) => {
        if (e.id === r.self || e.id === 'demo') {
          setBubble(e.text);
          clearTimeout(bubbleTimer);
          bubbleTimer = setTimeout(() => setBubble(''), 4200);
        } else {
          setRemoteBubbles((v) => ({ ...v, [e.id]: e.text }));
          setTimeout(
            () =>
              setRemoteBubbles((v) => {
                const copy = { ...v };
                delete copy[e.id];
                return copy;
              }),
            4200,
          );
        }
      }),
      on<Quality | boolean>('quality', (v) => {
        const q = typeof v === 'boolean' ? (v ? 'low' : 'medium') : v;
        setQuality(q);
        gl.setPixelRatio(
          Math.min(window.devicePixelRatio, q === 'low' ? 1 : q === 'medium' ? 1.5 : 2),
        );
      }),
      on<boolean>('sit', (v) => {
        r.seated = v;
      }),
      on<{ seated: boolean }>('seated', (v) => {
        r.seated = v.seated;
      }),
      on<boolean>('run', (v) => {
        r.controls.running = v;
      }),
      on<Controls['view']>('camera-view', (v) => {
        r.controls.view = v;
        r.controls.yaw = v === 'entrance' || v === 'photo' ? Math.PI : 0;
        if (v === 'default') r.controls.pitch = 0.22;
      }),
      on<string>('gesture', (v) => {
        setGesture(v);
        setTimeout(() => setGesture(undefined), 2600);
      }),
      on<string>('effect', (kind) => {
        setBubble(kind === 'tomato' ? '🍅 🍅 🍅' : '⚽ ✨ 🎉');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => setBubble(''), 4000);
      }),
      on('screenshot', () => {
        gl.render(scene, camera);
        const link = document.createElement('a');
        link.download = 'hoi-vao-hang-3d.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        emit('notice', 'Đã chụp cảnh 3D.');
      }),
    ];
    emit('ready');
    return () => {
      off.forEach((f) => f());
      clearTimeout(bubbleTimer);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', blur);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', up);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('contextmenu', context);
      delete (window as any).__world3d;
    };
  }, [gl, camera, scene]);
  function publish(fps: number) {
    const r = runtime.current;
    const position = toNetwork(r.map, r.feet.x, r.feet.z);
    emit('state', {
      map: r.map,
      position,
      direction: r.direction,
      near: playtestNear(r.map, position),
      fps,
      seated: r.seated,
      height: r.feet.y,
      tier: r.feet.y > 12 ? 3 : r.feet.y > 5 ? 2 : 1,
      quality,
    });
  }
  const lastState = useRef(0),
    lastSync = useRef(0),
    frameTime = useRef({ total: 0, count: 0, fps: 60 });
  useFrame((_, delta) => {
    const r = runtime.current,
      now = performance.now();
    r.frames++;
    frameTime.current.total += delta;
    frameTime.current.count++;
    if (frameTime.current.total > 0.5) {
      frameTime.current.fps = Math.round(frameTime.current.count / frameTime.current.total);
      frameTime.current.total = 0;
      frameTime.current.count = 0;
    }
    if (now - lastState.current > 100) {
      publish(frameTime.current.fps);
      lastState.current = now;
    }
    if (r.controls.enabled && now - lastSync.current > 75) {
      emit('movement', {
        ...toNetwork(r.map, r.feet.x, r.feet.z),
        height: r.feet.y,
        direction: r.direction,
        moving: r.moving,
      });
      lastSync.current = now;
    }
    // Walking through the centre of the opening is enough; E/the touch interaction also work.
    const p = toNetwork(r.map, r.feet.x, r.feet.z),
      portal = playtestNear(r.map, p);
    if (
      portal?.kind === 'portal' &&
      (r.map !== 'plaza' || portal.target === 'united') &&
      r.controls.enabled &&
      !r.controls.blocked &&
      r.moving &&
      now - r.transitionAt > 2000
    ) {
      const [px, pz] = toScene(r.map, portal);
      if (Math.abs(r.feet.x - px) < 1.3 && Math.abs(r.feet.z - pz) < 0.55) {
        r.transitionAt = now;
        emit('movement', { ...p, height: r.feet.y, direction: r.direction, moving: true });
        emit('interact', { map: r.map, position: p });
      }
    }
    // Read-only diagnostics for browser QA. No teleport/movement shortcuts.
    (window as any).__world3d = {
      engine: 'three-r3f-rapier',
      map: r.map,
      position: { x: r.feet.x, y: r.feet.y, z: r.feet.z },
      network: p,
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        yaw: r.controls.yaw,
        pitch: r.controls.pitch,
      },
      moving: r.moving,
      grounded: r.grounded,
      collisions: r.collisions,
      frames: r.frames,
      drawCalls: gl.info.render.calls,
      geometries: gl.info.memory.geometries,
      triangles: gl.info.render.triangles,
      remotes: remotes.length,
      fps: frameTime.current.fps,
      quality,
      caves:
        r.map === 'plaza' ? CAVES.map((c) => ({ id: c.id, tier: c.tier, height: c.height })) : [],
      characterModel: 'fan-chibi.glb',
      view: r.controls.view,
    };
    if (now - lastState.current < 20)
      gl.domElement.dataset.world = JSON.stringify((window as any).__world3d);
    gl.info.reset();
  });
  return (
    <>
      <Environment key={map} map={map} quality={quality} />
      <AvatarController
        key={`${map}-${revision}`}
        runtime={runtime}
        pending={pendingPosition}
        profile={profile}
        bubble={bubble}
        gesture={gesture || (runtime.current.seated ? 'Sit' : undefined)}
      />
      {remotes.map((p) => (
        <RemoteCharacter key={p.id} player={p} map={map} bubble={remoteBubbles[p.id]} />
      ))}
      {quality !== 'low' && <Dust map={map} />}
      {quality === 'high' && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={1.4} intensity={0.35} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
function AvatarController({
  runtime,
  pending,
  profile,
  bubble,
  gesture,
}: {
  runtime: React.RefObject<Runtime>;
  pending: React.RefObject<Point | null>;
  profile: Profile;
  bubble: string;
  gesture?: string;
}) {
  const body = useRef<RapierRigidBody>(null);
  const { world } = useRapier();
  const { camera, scene } = useThree();
  const [animation, setAnimation] = useState({ moving: false, direction: Math.PI });
  const controller = useMemo(() => {
    const c = world.createCharacterController(0.025);
    c.setSlideEnabled(true);
    c.enableAutostep(0.22, 0.3, true);
    c.enableSnapToGround(0.3);
    c.setMaxSlopeClimbAngle(Math.PI / 4);
    return c;
  }, [world]);
  useEffect(() => () => world.removeCharacterController(controller), [world, controller]);
  const spawnSteps = useRef(0);
  const velocity = useRef(0),
    blockedAt = useRef(0);
  const initial = useRef(runtime.current.feet.clone()).current;
  useBeforePhysicsStep(() => {
    const rb = body.current;
    if (!rb) return;
    const r = runtime.current,
      c = r.controls,
      dt = 1 / 60;
    if (pending.current) {
      const [x, z] = toScene(r.map, pending.current);
      const h = groundHeight(r.map, pending.current!) || 0;
      pending.current = null;
      rb.setTranslation({ x, y: h + 1.06, z }, true);
      rb.setNextKinematicTranslation({ x, y: h + 1.06, z });
      r.feet.set(x, h, z);
      velocity.current = 0;
      return;
    }
    if (spawnSteps.current++ < 3) {
      const h = groundHeight(r.map, toNetwork(r.map, initial.x, initial.z)) ?? initial.y;
      const stable = { x: initial.x, y: h + 1.06, z: initial.z };
      rb.setTranslation(stable, true);
      rb.setNextKinematicTranslation(stable);
      velocity.current = 0;
      return;
    }
    let ix = 0,
      iz = 0;
    if (c.enabled && !c.blocked && !isTyping()) {
      ix =
        +(c.keys.has('KeyD') || c.keys.has('ArrowRight')) -
        +(c.keys.has('KeyA') || c.keys.has('ArrowLeft')) +
        c.joystick.x;
      iz =
        +(c.keys.has('KeyS') || c.keys.has('ArrowDown')) -
        +(c.keys.has('KeyW') || c.keys.has('ArrowUp')) +
        c.joystick.y;
    }
    if ((ix || iz) && r.seated) {
      r.seated = false;
      emit('stand');
    }
    const length = Math.max(1, Math.hypot(ix, iz));
    ix /= length;
    iz /= length;
    const speed =
      c.running || c.keys.has('ShiftLeft') || c.keys.has('ShiftRight') ? RUN_SPEED : SPEED;
    const dx = (ix * Math.cos(c.yaw) + iz * Math.sin(c.yaw)) * speed * layouts[r.map].scale * dt;
    const dz = (-ix * Math.sin(c.yaw) + iz * Math.cos(c.yaw)) * speed * layouts[r.map].scale * dt;
    velocity.current = Math.max(velocity.current - 22 * dt, -20);
    controller.computeColliderMovement(
      rb.collider(0),
      { x: dx, y: velocity.current * dt, z: dz },
      undefined,
      undefined,
      (collider) => collider.parent()?.handle !== rb.handle,
    );
    const movement = controller.computedMovement(),
      p = rb.translation();
    rb.setNextKinematicTranslation({
      x: p.x + movement.x,
      y: p.y + movement.y,
      z: p.z + movement.z,
    });
    r.grounded = controller.computedGrounded();
    if (r.grounded) velocity.current = 0;
    const moved = Math.hypot(movement.x, movement.z) > 0.001;
    const desired = Math.hypot(dx, dz);
    if (desired > 0.01 && Math.hypot(movement.x - dx, movement.z - dz) > desired * 0.3)
      r.collisions++;
    r.moving = moved;
    if (Math.hypot(ix, iz) > 0.1) r.direction = Math.atan2(dx, dz);
    if (p.y < -5 && performance.now() - blockedAt.current > 1000) {
      pending.current = spawn(r.map);
      blockedAt.current = performance.now();
    }
  });
  const target = useMemo(() => new THREE.Vector3(), []),
    desired = useMemo(() => new THREE.Vector3(), []),
    ray = useMemo(() => new THREE.Raycaster(), []);
  const lastView = useRef('');
  const solids = useRef<THREE.Object3D[]>([]),
    lastScan = useRef(0),
    lastAnimation = useRef(0),
    cameraReady = useRef(false);
  useFrame((_, delta) => {
    if (!body.current) return;
    const r = runtime.current,
      p = body.current.translation();
    r.feet.set(p.x, p.y - 1.02, p.z);
    if (performance.now() - lastAnimation.current > 50) {
      setAnimation({ moving: r.moving, direction: r.direction });
      lastAnimation.current = performance.now();
    }
    target.set(p.x, p.y + 0.85, p.z);
    const atlas = r.controls.view === 'atlas';
    if (atlas) target.set(0, 5, -9);
    const dist = atlas ? 125 : r.controls.distance;
    const pitch = atlas ? 0.94 : r.controls.pitch;
    desired
      .set(
        Math.sin(r.controls.yaw) * dist * Math.cos(pitch),
        Math.sin(pitch) * dist,
        Math.cos(r.controls.yaw) * dist * Math.cos(pitch),
      )
      .add(target);
    if (performance.now() - lastScan.current > 1000 || !solids.current.length) {
      solids.current = [];
      scene.traverse((o) => {
        if (o.userData.cameraSolid && (o as THREE.Mesh).isMesh) solids.current.push(o);
      });
      lastScan.current = performance.now();
    }
    ray.set(target, desired.clone().sub(target).normalize());
    ray.far = dist;
    const hit = atlas
      ? undefined
      : ray.intersectObjects(solids.current, false).find((h) => h.distance > 0.15);
    if (hit)
      desired.copy(target).addScaledVector(ray.ray.direction, Math.max(0.4, hit.distance - 0.25));
    const factor =
      hit || !cameraReady.current || lastView.current !== r.controls.view
        ? 1
        : 1 - Math.exp(-12 * Math.min(delta, 0.1));
    camera.position.lerp(desired, factor);
    camera.lookAt(target);
    cameraReady.current = true;
    lastView.current = r.controls.view;
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[initial.x, initial.y + 1.06, initial.z]}
      enabledRotations={[false, false, false]}
      name="player-capsule"
    >
      <CapsuleCollider args={[0.7, 0.32]} />
      <group position={[0, -1.02, 0]}>
        <Character
          color={TEAMS.find((t) => t.id === profile.team)?.color}
          name={`${profile.nickname} · BẠN`}
          moving={animation.moving}
          direction={animation.direction}
          running={
            runtime.current.controls.running || runtime.current.controls.keys.has('ShiftLeft')
          }
          gesture={gesture || (runtime.current.seated ? 'Sit' : undefined)}
        />
        {bubble && <Billboard text={bubble} />}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.43, 0.48, 24]} />
          <meshBasicMaterial color="#ffe29a" transparent opacity={0.8} />
        </mesh>
      </group>
    </RigidBody>
  );
}
function Billboard({ text }: { text: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => ref.current?.quaternion.copy(camera.quaternion));
  return (
    <group ref={ref} position={[0, 2.6, 0]}>
      <Label text={text} position={[0, 0, 0]} width={4} background="#f5e5c2" color="#282a37" />
    </group>
  );
}
function RemoteCharacter({
  player,
  map,
  bubble,
}: {
  player: Player;
  map: SceneId;
  bubble?: string;
}) {
  const ref = useRef<THREE.Group>(null),
    [x, z] = toScene(map, player);
  useFrame((_, dt) => {
    ref.current?.position.lerp(
      new THREE.Vector3(x, (player.height || 0) + 0.04, z),
      Math.min(1, dt * 12),
    );
  });
  // The legacy direction is now interpreted consistently as atan2(x, z) by 3D clients.
  return (
    <group ref={ref} position={[x, (player.height || 0) + 0.04, z]}>
      <Character
        color={TEAMS.find((t) => t.id === player.team)?.color}
        name={player.nickname}
        moving={player.moving}
        direction={player.direction}
        gesture={player.seated ? 'Sit' : undefined}
      />
      {bubble && <Billboard text={bubble} />}
    </group>
  );
}
function Dust({ map }: { map: SceneId }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 180 }, (_, i) => [
          Math.sin(i * 13.3) * 21,
          0.5 + (i % 11) * 0.5,
          Math.cos(i * 7.7) * 18,
        ]).flat(),
      ),
    [],
  );
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.008;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={map === 'united' ? '#ffb578' : '#fff3cf'}
        size={0.035}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}
