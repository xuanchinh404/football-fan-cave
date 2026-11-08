import { CityBanner, CityCrest } from './city/CityArchitecture';
import { playerAvatarFile } from './PlayerAvatar3D';
import { CAVES } from '../../../../../packages/shared/grandHall';
import { type Quality } from './GrandHall';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CapsuleCollider,
  CuboidCollider,
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
  isOpenCave,
  spawn,
  TEAMS,
  type Player,
  type Point,
  type Profile,
} from '../../../../../packages/shared/world';
import { emit, on, type RemoteEvent, type StartEvent } from '../bridge';
import { Character, Label } from './Models';
import { CaveGate } from './CaveGate';
import { enableGateAudio, playGateHinge } from './gateAudio';
import { LiverpoolAsset } from './liverpool/LiverpoolKit';
import { BlenderAsset } from './BlenderAsset';
import { AssetModel } from './AssetModel';
import { Plaque } from './IndoorKit';
import {
  CAVE_GATES,
  type CaveGate as GateConfig,
  gateNear,
  gatePhase,
  updateGate,
  type GateState,
  type GateTiming,
} from '../../../../../packages/shared/caveGates';
import {
  fromWorldPoint,
  isConnectedZone,
  caveOffset,
  zoneAtDoor,
} from '../../../../../packages/shared/caveConnections';
import { Environment } from './Environments';
import { cameraDistances, readCameraSettings, type CameraSettings } from './cameraSettings';
import {
  layouts,
  sceneBounds,
  playtestInteractions,
  playtestNear,
  toNetwork,
  toScene,
  worldPosition,
  zonePosition,
  type SceneId,
} from './worldLayout';

type Controls = {
  keys: Set<string>;
  joystick: Point;
  blocked: boolean;
  enabled: boolean;
  cameraYaw: number;
  movementBasisYaw: number | null;
  forwardIntent: boolean;
  recenterYaw: number | null;
  dragging: boolean;
  recenterIn: number;
  cameraSettings: CameraSettings;
  pitch: number;
  distance: number;
  running: boolean;
  jump: boolean;
  snapCamera: boolean;
  view: 'default' | 'atlas' | 'entrance' | 'photo';
};
type Runtime = {
  map: SceneId;
  profile: Profile;
  self: string;
  characterFacing: number;
  movementVelocity: THREE.Vector3;
  moving: boolean;
  feet: THREE.Vector3;
  controls: Controls;
  collisions: number;
  grounded: boolean;
  frames: number;
  transitionAt: number;
  portal?: string;
  cameraHit?: number;
  seated?: boolean;
  effectsOff?: boolean;
  gates: Map<string, GateTiming>;
  corrections: number;
  connected?: boolean;
};
const isTyping = () =>
  /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') ||
  (document.activeElement as HTMLElement)?.isContentEditable;

// Pitch describes the lens direction. Positive pitch looks up.
const defaultPitch = -0.25;
const minPitch = THREE.MathUtils.degToRad(-65);
const maxPitch = THREE.MathUtils.degToRad(70);
const recenterDelay = 1;
const cameraRadius = 0.24;
const cameraCastRotation = { x: 0, y: 0, z: 0, w: 1 };

function setOrbitHeading(controls: Controls, yaw: number) {
  controls.cameraYaw = yaw;
  controls.recenterYaw = null;
  controls.recenterIn = 0;
  controls.snapCamera = true;
}

const movementKeys = [
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
];

function updateMovementBasis(c: Controls) {
  // Only a new keyboard/joystick gesture may sample camera yaw. Opposing keys
  // can cancel velocity without releasing the steering frame.
  if (c.joystick.x || c.joystick.y || movementKeys.some((key) => c.keys.has(key))) {
    c.movementBasisYaw ??= c.cameraYaw;
  } else {
    c.movementBasisYaw = null;
  }
}

function isRunning(controls: Controls) {
  return controls.running || controls.keys.has('ShiftLeft') || controls.keys.has('ShiftRight');
}

function movementInput({ keys, joystick }: Controls): Point {
  return {
    x:
      +(keys.has('KeyD') || keys.has('ArrowRight')) -
      +(keys.has('KeyA') || keys.has('ArrowLeft')) +
      joystick.x,
    y:
      +(keys.has('KeyS') || keys.has('ArrowDown')) -
      +(keys.has('KeyW') || keys.has('ArrowUp')) +
      joystick.y,
  };
}

function updateCameraYaw(c: Controls, facing: number, moving: boolean, delta: number) {
  if (!c.enabled || c.blocked || c.dragging || c.view !== 'default') return;
  const forward = c.cameraSettings.autoRotate && c.forwardIntent && moving;
  if (c.recenterYaw === null) {
    if (c.recenterIn > 0)
      c.recenterIn = forward ? Math.max(0, c.recenterIn - delta) : recenterDelay;
    if (!forward || c.recenterIn > 0) return;
  }
  const difference = (c.recenterYaw ?? facing - Math.PI) - c.cameraYaw;
  const turn = Math.atan2(Math.sin(difference), Math.cos(difference));
  const response = isRunning(c) ? 4.8 : 4.2;
  c.cameraYaw += turn * (1 - Math.exp(-response * delta));
  if (c.recenterYaw !== null && Math.abs(turn) < 0.002) c.recenterYaw = null;
}

const emoteClips: Record<string, string> = {
  '😂': 'Laugh',
  '🔥': 'Cheer',
  '❤️': 'Wave',
  '🏆': 'Celebrate',
  '🍅': 'Sad',
  '⚽': 'Wave',
};

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
  const [cameraSettings] = useState(readCameraSettings);
  const runtime = useRef<Runtime>({
    map: 'plaza',
    profile,
    self: 'demo',
    characterFacing: Math.PI,
    movementVelocity: new THREE.Vector3(),
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
      cameraYaw: 0,
      movementBasisYaw: null,
      forwardIntent: false,
      recenterYaw: null,
      dragging: false,
      recenterIn: 0,
      cameraSettings,
      pitch: defaultPitch,
      distance: cameraDistances[cameraSettings.distance],
      running: false,
      jump: false,
      snapCamera: false,
      view: 'default',
    },
    collisions: 0,
    grounded: false,
    frames: 0,
    transitionAt: 0,
    corrections: 0,
    gates: new Map(),
  });
  const pendingPosition = useRef<Point | null>(null);
  const [revision, setRevision] = useState(0);
  const [quality, setQuality] = useState<Quality>(window.innerWidth < 700 ? 'low' : 'medium');
  const [effectsOff, setEffectsOff] = useState(false);
  const [gestures, setGestures] = useState<Record<string, string>>({});
  useEffect(() => {
    let bubbleTimer: ReturnType<typeof setTimeout>;
    const gestureTimers = new Map<string, ReturnType<typeof setTimeout>>();
    function gesture(id: string, clip: string) {
      clearTimeout(gestureTimers.get(id));
      setGestures((previous) => ({ ...previous, [id]: clip }));
      gestureTimers.set(
        id,
        setTimeout(() => {
          gestureTimers.delete(id);
          setGestures((previous) => {
            const next = { ...previous };
            delete next[id];
            return next;
          });
        }, 2100),
      );
    }
    const r = runtime.current;
    function travel(e: { map: SceneId; x?: number; y?: number }) {
      if (!(e.map in layouts)) {
        emit(
          'notice',
          'Bản chơi thử 3D hiện mở Đại Sảnh Chung cùng nội thất MU, Chelsea, Arsenal và Liverpool.',
        );
        return;
      }
      const p = e.x === undefined ? spawn(e.map) : { x: e.x, y: e.y! };

      const returning =
        (r.map === 'united' && e.map === 'plaza') ||
        (r.map === 'hall-of-legends' && e.map === 'united') ||
        (r.map === 'chelsea' && e.map === 'plaza') ||
        (r.map === 'chelsea-museum' && e.map === 'chelsea') ||
        (r.map === 'liverpool-museum' && e.map === 'liverpool') ||
        (r.map === 'arsenal' && e.map === 'plaza') ||
        (r.map === 'arsenal-museum' && e.map === 'arsenal');
      pendingPosition.current = p;
      r.feet.set(...worldPosition(e.map, p, groundHeight(e.map, p) ?? 0));
      r.map = e.map;
      blur();
      setOrbitHeading(r.controls, returning ? Math.PI : 0);
      r.characterFacing = returning ? 0 : Math.PI;
      r.movementVelocity.set(0, 0, 0);
      r.controls.view = 'default';
      // Chelsea arrivals are outside the trigger. Only legacy MU arrivals can
      // overlap the portal they came from and need a short transition cooldown.
      r.transitionAt =
        e.map === 'united' || e.map === 'hall-of-legends' ? performance.now() : -Infinity;
      r.moving = false;
      r.grounded = false;
      r.seated = false;
      r.portal = undefined;
      setMap(e.map);
      setRevision((v) => v + 1);
      setRemotes([]);
      gestureTimers.forEach(clearTimeout);
      gestureTimers.clear();
      setGestures({});
      setBubble('');
      emit('map-changed', e.map);
      publish(60);
    }
    function interact() {
      if (!r.controls.enabled || r.controls.blocked || isTyping()) return;
      const position = currentZonePoint();
      syncMovement();
      emit('interact', { map: r.map, position, seated: r.seated });
    }
    function keydown(e: KeyboardEvent) {
      if (isTyping() || r.controls.blocked || !r.controls.enabled) return;
      enableGateAudio();
      if (movementKeys.includes(e.code) || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        r.controls.keys.add(e.code);
        updateMovementBasis(r.controls);
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        r.controls.jump = true;
      }
      if (e.code === 'KeyB' && !e.repeat) emit('toggle-emotes');
      if (e.code === 'KeyP' && !e.repeat) emit('screenshot');
      if (e.code === 'KeyK' && !e.repeat) emit('open-banter');
      if (!e.repeat && (e.code === 'KeyE' || (e.code === 'KeyF' && r.map === 'hall-of-legends')))
        interact();
      if (e.code === 'Enter' && !e.repeat) {
        e.preventDefault();
        emit('focus-chat');
      }
      if (e.code === 'KeyR' && !e.repeat) recenterCamera();
    }
    function keyup(e: KeyboardEvent) {
      if (r.controls.keys.delete(e.code)) updateMovementBasis(r.controls);
    }
    function recenterCamera() {
      const c = r.controls;
      if (!c.enabled || c.blocked || c.dragging) return;
      c.view = 'default';
      c.recenterYaw = r.characterFacing - Math.PI;
      c.recenterIn = 0;
    }
    function blur() {
      r.controls.keys.clear();
      r.controls.joystick = { x: 0, y: 0 };
      r.controls.movementBasisYaw = null;
      r.controls.forwardIntent = false;
      if (drag) {
        const { id } = drag;
        stopDrag();
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      }
      r.controls.running = false;
      r.controls.jump = false;
    }
    let drag: { id: number; x: number; y: number } | null = null;
    const canvas = gl.domElement;
    function stopDrag() {
      drag = null;
      r.controls.dragging = false;
    }
    function down(e: PointerEvent) {
      if (
        drag ||
        r.controls.blocked ||
        !r.controls.enabled ||
        (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2)
      )
        return;
      canvas.focus();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      r.controls.dragging = true;
      r.controls.recenterYaw = null;
      canvas.setPointerCapture(e.pointerId);
    }
    function move(e: PointerEvent) {
      if (!drag || drag.id !== e.pointerId || r.controls.blocked) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!dx && !dy) return;
      const c = r.controls;
      const { sensitivity } = c.cameraSettings;
      c.cameraYaw -= dx * 0.006 * sensitivity;
      if (c.view !== 'atlas')
        c.pitch = THREE.MathUtils.clamp(c.pitch - dy * 0.005 * sensitivity, minPitch, maxPitch);
      c.recenterIn = recenterDelay;
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
    function up(e: PointerEvent) {
      if (drag?.id === e.pointerId) stopDrag();
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
      on<boolean>('connected', (connected) => {
        r.connected = connected;
        if (connected) r.gates.clear();
      }),
      on<GateState>('gate-state', ({ id, timing, now }) => {
        const localNow = Date.now();
        const previous = gatePhase(r.gates.get(id), localNow);
        const offset = localNow - now;
        if (!timing) {
          r.gates.delete(id);
          return;
        }
        const local = {
          openedAt: timing.openedAt + offset,
          closeAt: timing.closeAt === null ? Infinity : timing.closeAt + offset,
        };
        r.gates.set(id, local);
        const gate = CAVE_GATES.find((candidate) => candidate.id === id);
        if (
          gate &&
          (previous === 'CLOSED' || previous === 'CLOSING') &&
          gatePhase(local, localNow) === 'OPENING' &&
          gateNear(gate, { x: r.feet.x, z: r.feet.z, height: r.feet.y })
        )
          playGateHinge();
      }),
      on<StartEvent>('start', (e) => {
        if (e.id !== 'demo') r.connected = true;
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
        if (p.x || p.y) enableGateAudio();
        r.controls.joystick = p;
        updateMovementBasis(r.controls);
      }),
      on<{ map: SceneId; x?: number; y?: number }>('travel', travel),
      on<Point & { map?: SceneId }>('correct', (p) => {
        r.corrections++;
        if (p.map && p.map !== r.map && isConnectedZone(p.map) && isConnectedZone(r.map)) {
          r.map = p.map;
          setMap(p.map);
        }
        pendingPosition.current = p;
      }),
      on<RemoteEvent>('remotes', (e) => {
        r.self = e.self;
        setRemotes(
          e.players.filter(
            (p) =>
              p.id !== e.self &&
              (p.map === r.map || (isConnectedZone(r.map) && isConnectedZone(p.map))),
          ),
        );
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
      on<{ seated: boolean; direction?: number }>('seated', (v) => {
        r.seated = v.seated;
        if ((r.map === 'liverpool' || r.map === 'city') && v.seated && v.direction !== undefined)
          r.characterFacing = v.direction;
      }),
      on('jump', () => {
        if (!r.controls.blocked && r.controls.enabled && !isTyping()) r.controls.jump = true;
      }),
      on<boolean>('run', (v) => {
        r.controls.running = v;
      }),
      on<Controls['view']>('camera-view', (v) => {
        r.controls.view = v;
        setOrbitHeading(r.controls, v === 'entrance' || v === 'photo' ? Math.PI : 0);
        if (v === 'default') r.controls.pitch = defaultPitch;
      }),
      on('camera-recenter', recenterCamera),
      on<CameraSettings>('camera-settings', (settings) => {
        const c = r.controls;
        if (settings.distance !== c.cameraSettings.distance)
          c.distance = cameraDistances[settings.distance];
        c.cameraSettings = settings;
      }),
      on<string>('gesture', (clip) => gesture('local', clip)),
      on<{ id: string; value: string }>('avatar-emote', ({ id, value }) => {
        const clip = emoteClips[value];
        if (clip) gesture(id === r.self || id === 'demo' ? 'local' : id, clip);
      }),
      on<boolean>('reduced-effects', (value) => {
        r.effectsOff = value;
        setEffectsOff(value);
      }),
      on<string>('effect', (kind) => {
        if (r.effectsOff) return;
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
      gestureTimers.forEach(clearTimeout);
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
  function currentZonePoint() {
    const r = runtime.current;
    const point = toNetwork(isConnectedZone(r.map) ? 'plaza' : r.map, r.feet.x, r.feet.z);
    return fromWorldPoint(r.map, point);
  }
  function syncMovement() {
    const r = runtime.current;
    if (pendingPosition.current || r.seated) return;
    const point = toNetwork(isConnectedZone(r.map) ? 'plaza' : r.map, r.feet.x, r.feet.z);
    const height = groundHeight(r.map, fromWorldPoint(r.map, point)) ?? 0;
    emit('movement', {
      ...point,
      zone: r.map,
      height,
      direction: r.characterFacing,
      moving: r.moving,
      motion: !r.grounded ? 'Jump' : r.moving && isRunning(r.controls) ? 'Run' : undefined,
      airOffset: r.grounded ? undefined : r.feet.y - height - caveOffset(r.map)[1],
    });
  }
  function publish(fps: number) {
    const r = runtime.current;
    const position = currentZonePoint();
    emit('state', {
      map: r.map,
      position,
      direction: r.characterFacing,
      near: playtestNear(r.map, position),
      fps,
      seated: !!r.seated,
      height: r.feet.y,
      tier: r.feet.y > 12 ? 3 : r.feet.y > 5 ? 2 : 1,
      quality,
    });
  }
  const lastState = useRef(0),
    lastSync = useRef(0),
    frameTime = useRef({ total: 0, count: 0, fps: 60 });
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
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
    const gateNow = Date.now();
    if (isConnectedZone(r.map)) {
      const zone = zoneAtDoor(r.map, r.feet.x, r.feet.z, r.feet.y);
      if (zone !== r.map) {
        r.map = zone;
        setMap(zone);
        emit('map-changed', zone);
        publish(frameTime.current.fps);
      }
      if (!r.connected) {
        for (const gate of CAVE_GATES) {
          const timing = r.gates.get(gate.id);
          const occupied =
            r.controls.enabled && gateNear(gate, { x: r.feet.x, z: r.feet.z, height: r.feet.y });
          const next = updateGate(timing, occupied, gateNow);
          if (next === timing) continue;
          if (next) r.gates.set(gate.id, next);
          else r.gates.delete(gate.id);
          if (
            occupied &&
            gatePhase(next, gateNow) === 'OPENING' &&
            (gatePhase(timing, gateNow) === 'CLOSED' || gatePhase(timing, gateNow) === 'CLOSING')
          )
            playGateHinge();
        }
      }
    }
    if (now - lastState.current > 100) {
      publish(frameTime.current.fps);
      lastState.current = now;
    }
    if (r.controls.enabled && now - lastSync.current > 75) {
      syncMovement();
      lastSync.current = now;
    }
    const p = currentZonePoint(),
      portal = playtestNear(r.map, p);
    if (
      portal?.kind === 'portal' &&
      r.portal === portal.id &&
      (r.map !== 'plaza' || isOpenCave(portal.target)) &&
      r.controls.enabled &&
      !r.controls.blocked &&
      r.moving &&
      now - r.transitionAt > 2000
    ) {
      const [px, , pz] = worldPosition(r.map, portal, 0);
      if (Math.abs(r.feet.x - px) < 1.3 && Math.abs(r.feet.z - pz) < 0.55) {
        r.transitionAt = now;
        syncMovement();
        emit('interact', { map: r.map, position: p });
      }
    }
    // Read-only diagnostics for browser QA. No teleport/movement shortcuts.
    camera.getWorldDirection(cameraDirection);
    const [localX, localY, localZ] = zonePosition(r.map, r.feet.x, r.feet.y, r.feet.z);
    (window as any).__world3d = {
      engine: 'three-r3f-rapier',
      map: r.map,
      position: { x: localX, y: localY, z: localZ },
      worldPosition: { x: r.feet.x, y: r.feet.y, z: r.feet.z },
      controllerRevision: revision,
      sessionId: r.self,
      corrections: r.corrections,
      network: p,
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        yaw: r.controls.cameraYaw,
        pitch: r.controls.pitch,
        viewYaw: Math.atan2(-cameraDirection.x, -cameraDirection.z),
        viewPitch: Math.asin(THREE.MathUtils.clamp(cameraDirection.y, -1, 1)),
      },
      direction: r.characterFacing,
      movementDirection: r.moving ? Math.atan2(r.movementVelocity.x, r.movementVelocity.z) : null,
      movementVelocity: { x: r.movementVelocity.x, z: r.movementVelocity.z },
      input: {
        keys: Array.from(r.controls.keys),
        joystick: r.controls.joystick,
        basisYaw: r.controls.movementBasisYaw,
      },
      moving: r.moving,
      trigger: r.portal,
      gates: isConnectedZone(r.map)
        ? Object.fromEntries(
            CAVE_GATES.map((gate) => [gate.id, gatePhase(r.gates.get(gate.id), gateNow)]),
          )
        : {},
      cameraHit: r.cameraHit,
      grounded: r.grounded,
      seated: !!r.seated,
      collisions: r.collisions,
      frames: r.frames,
      drawCalls: gl.info.render.calls,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      triangles: gl.info.render.triangles,
      remotes: remotes.length,
      remoteAnimations: remotes.map((p) => ({
        nickname: p.nickname,
        clip: p.seated
          ? 'SitIdle'
          : p.motion === 'Jump'
            ? 'Jump'
            : p.moving
              ? p.motion === 'Run'
                ? 'Run'
                : 'Walk'
              : gestures[p.id] || 'Idle',
        airOffset: p.airOffset ?? 0,
      })),
      fps: frameTime.current.fps,
      quality,
      caves:
        r.map === 'plaza' ? CAVES.map((c) => ({ id: c.id, tier: c.tier, height: c.height })) : [],
      characterModel: playerAvatarFile,
      profile: { nickname: r.profile.nickname, team: r.profile.team, avatar: r.profile.avatar },
      view: r.controls.view,
    };
    if (now - lastState.current < 20)
      gl.domElement.dataset.world = JSON.stringify((window as any).__world3d);
    gl.info.reset();
  });
  const worldScene = isConnectedZone(map) ? 'plaza' : map;
  return (
    <>
      <PortalTriggers key={`portals-${worldScene}`} map={worldScene} runtime={runtime} />
      <Environment
        key={worldScene}
        map={worldScene}
        quality={quality}
        player={() => runtime.current.feet}
      />
      {worldScene === 'plaza' &&
        CAVE_GATES.map((gate) => (
          <CaveGate
            key={gate.id}
            gate={gate}
            timing={() => runtime.current.gates.get(gate.id)}
            mark={<GateMark gate={gate} />}
            flags={
              gate.id === 'liverpool' && (
                <LiverpoolAsset
                  asset="banner"
                  placements={[-3.55, 3.55].map((x) => ({
                    position: [x, 4.52, 0.61],
                    scale: 0.63,
                  }))}
                />
              )
            }
          />
        ))}
      <AvatarController
        key={revision}
        map={map}
        runtime={runtime}
        pending={pendingPosition}
        profile={profile}
        bubble={bubble}
        gesture={gestures.local}
      />
      {remotes.map((p) => (
        <RemoteCharacter
          key={p.id}
          player={p}
          map={p.map as SceneId}
          bubble={remoteBubbles[p.id]}
          gesture={gestures[p.id]}
        />
      ))}
      {quality !== 'low' && !effectsOff && <Dust map={map} />}
      {quality === 'high' && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={1.4} intensity={0.35} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}
function GateMark({ gate }: { gate: GateConfig }) {
  if (gate.id === 'city') return <Suspense fallback={null}><CityCrest size={0.7} /></Suspense>;
  if (gate.id === 'liverpool')
    return <LiverpoolAsset asset="bird" placements={[{ position: [0, 0, 0], scale: 0.48 }]} />;
  if (gate.id === 'arsenal')
    return (
      <BlenderAsset
        asset="gunners-emblem"
        placements={[{ position: [0, 0, 0], scale: 0.42 }]}
        shadow={false}
      />
    );
  if (gate.id === 'chelsea')
    return <AssetModel asset="blues-lion" position={[0, -0.35, 0]} scale={0.36} solid={false} />;
  return <Plaque lines={[gate.titles[1]]} width={1.55} height={0.7} background={gate.color} />;
}

function AvatarController({
  map,
  runtime,
  pending,
  profile,
  bubble,
  gesture,
}: {
  map: SceneId;
  runtime: React.RefObject<Runtime>;
  pending: React.RefObject<Point | null>;
  profile: Profile;
  bubble: string;
  gesture?: string;
}) {
  const body = useRef<RapierRigidBody>(null);
  const avatar = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const { camera, scene } = useThree();
  const [animation, setAnimation] = useState({
    moving: false,
    direction: runtime.current.characterFacing,
    jumping: false,
    seated: false,
    running: false,
  });
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
      const [x, h, z] = worldPosition(
        r.map,
        pending.current,
        groundHeight(r.map, pending.current) ?? 0,
      );
      pending.current = null;
      rb.setTranslation({ x, y: h + 1.06, z }, true);
      rb.setNextKinematicTranslation({ x, y: h + 1.06, z });
      r.feet.set(x, h, z);
      r.moving = false;
      r.movementVelocity.set(0, 0, 0);
      c.forwardIntent = false;
      initial.set(x, h, z);
      // Keep the capsule on the new floor while Rapier registers the new scene.
      spawnSteps.current = 0;
      velocity.current = 0;
      return;
    }
    if (spawnSteps.current++ < 3) {
      const stable = { x: initial.x, y: initial.y + 1.06, z: initial.z };
      rb.setTranslation(stable, true);
      rb.setNextKinematicTranslation(stable);
      velocity.current = 0;
      return;
    }
    let ix = 0,
      iz = 0;
    if (c.enabled && !c.blocked && c.movementBasisYaw !== null && !isTyping()) {
      const input = movementInput(c);
      ix = input.x;
      iz = input.y;
    }
    const hasMoveIntent = !!(ix || iz);
    if (hasMoveIntent && r.seated) {
      r.seated = false;
      emit('stand');
    }
    const length = Math.max(1, Math.hypot(ix, iz));
    ix /= length;
    iz /= length;
    const speed = isRunning(c) ? RUN_SPEED : SPEED;
    const basis = c.movementBasisYaw ?? 0;
    const sin = Math.sin(basis);
    const cos = Math.cos(basis);
    c.forwardIntent = iz < -0.1;
    if (hasMoveIntent) r.characterFacing = Math.atan2(-sin, -cos);
    const step = speed * layouts[isConnectedZone(r.map) ? 'plaza' : r.map].scale * dt;
    const dx = (ix * cos + iz * sin) * step;
    const dz = (-ix * sin + iz * cos) * step;
    if (c.jump && r.grounded && !c.blocked && c.enabled && !isTyping()) {
      velocity.current = 5.5;
      r.seated = false;
      emit('stand');
    }
    c.jump = false;
    velocity.current = Math.max(velocity.current - 22 * dt, -20);
    controller.computeColliderMovement(
      rb.collider(0),
      { x: dx, y: velocity.current * dt, z: dz },
      rapier.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      (collider) => !collider.isSensor() && collider.parent()?.handle !== rb.handle,
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
    r.movementVelocity.set(movement.x / dt, 0, movement.z / dt);
    if (p.y < caveOffset(r.map)[1] - 5 && performance.now() - blockedAt.current > 1000) {
      pending.current = spawn(r.map);
      blockedAt.current = performance.now();
    }
  });
  const target = useMemo(() => new THREE.Vector3(), []),
    desired = useMemo(() => new THREE.Vector3(), []),
    ray = useMemo(() => new THREE.Raycaster(), []),
    cameraProbe = useMemo(() => new rapier.Ball(cameraRadius), [rapier]);
  const arm = useRef(0);
  const orbit = useRef<{ view: Controls['view'] | null; yaw: number; pitch: number }>({
    view: null,
    yaw: 0,
    pitch: defaultPitch,
  });
  const solids = useRef<THREE.Object3D[]>([]),
    lastScan = useRef(0),
    lastAnimation = useRef(0);
  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb) return;
    const r = runtime.current,
      c = r.controls,
      p = rb.translation();
    r.feet.set(p.x, p.y - 1.02, p.z);
    if (performance.now() - lastAnimation.current > 50) {
      setAnimation({
        moving: r.moving,
        direction: r.characterFacing,
        jumping: !r.grounded,
        seated: !!r.seated,
        running: isRunning(r.controls),
      });
      lastAnimation.current = performance.now();
    }
    updateCameraYaw(c, r.characterFacing, r.moving, delta);
    // Use the interpolated avatar as the pivot so movement can't tilt the view.
    if (avatar.current) {
      avatar.current.getWorldPosition(target);
      target.y += r.seated ? 1.05 : 1.4;
    } else {
      target.set(p.x, p.y + 0.38, p.z);
    }
    const atlas = c.view === 'atlas';
    const atlasMap = isConnectedZone(r.map) ? 'plaza' : r.map;
    if (atlas) target.set(0, atlasMap === 'plaza' ? 5 : 0, atlasMap === 'plaza' ? -9 : -3);
    const rendered = orbit.current;
    const snap = c.snapCamera || rendered.view !== c.view;
    c.snapCamera = false;
    const dist = atlas ? (atlasMap === 'plaza' ? 125 : 32) : c.distance;
    const pitch = atlas ? (atlasMap === 'plaza' ? -0.94 : -0.28) : c.pitch;
    rendered.yaw = snap ? c.cameraYaw : THREE.MathUtils.damp(rendered.yaw, c.cameraYaw, 22, delta);
    rendered.pitch = snap ? pitch : THREE.MathUtils.damp(rendered.pitch, pitch, 22, delta);
    const horizontal = Math.cos(rendered.pitch);
    desired.set(
      Math.sin(rendered.yaw) * horizontal,
      -Math.sin(rendered.pitch),
      Math.cos(rendered.yaw) * horizontal,
    );
    if (atlas) {
      desired.multiplyScalar(dist).add(target);
      if (atlasMap !== 'plaza') {
        const b = sceneBounds(atlasMap);
        desired.x = THREE.MathUtils.clamp(desired.x, b.left + 0.5, b.right - 0.5);
        desired.z = THREE.MathUtils.clamp(desired.z, b.top + 0.5, b.bottom - 0.5);
        desired.y = Math.min(10.5, desired.y);
      }
      r.cameraHit = undefined;
      camera.position.copy(desired);
    } else {
      // Shorten the arm along the rendered sightline without changing its angles.
      ray.set(target, desired);
      ray.far = snap ? dist : Math.max(dist, arm.current);
      const physicsHit = world.castShape(
        target,
        cameraCastRotation,
        ray.ray.direction,
        cameraProbe,
        0.02,
        ray.far,
        false,
        rapier.QueryFilterFlags.EXCLUDE_DYNAMIC | rapier.QueryFilterFlags.EXCLUDE_SENSORS,
        undefined,
        undefined,
        rb,
      );
      // Some visible cliff and architecture meshes extend beyond their physics proxies.
      if (!lastScan.current || performance.now() - lastScan.current > 1000) {
        solids.current = [];
        scene.traverse((o) => {
          if (o.userData.cameraSolid && (o as THREE.Mesh).isMesh) solids.current.push(o);
        });
        lastScan.current = performance.now();
      }
      const visualHit = ray.intersectObjects(solids.current, false)[0];
      const limit = Math.max(
        0,
        Math.min(
          physicsHit?.time_of_impact ?? Infinity,
          visualHit ? visualHit.distance - cameraRadius : Infinity,
        ),
      );
      r.cameraHit = Number.isFinite(limit) ? limit : undefined;
      arm.current = snap
        ? Math.min(dist, limit)
        : Math.min(limit, THREE.MathUtils.damp(arm.current, dist, 6, delta));
      camera.position.copy(target).addScaledVector(ray.ray.direction, arm.current);
    }
    // The look point stays in front of the lens even when the arm retracts to zero.
    camera.lookAt(atlas ? target : desired.copy(camera.position).sub(ray.ray.direction));
    if (avatar.current) avatar.current.visible = atlas || arm.current * horizontal >= 0.75;
    rendered.view = c.view;
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
      <group ref={avatar} position={[0, -1.02, 0]}>
        <group
          position={
            (map === 'liverpool' || map === 'city') && animation.seated ? seatOffset(animation.direction, map) : undefined
          }
        >
          <Character
            color={TEAMS.find((t) => t.id === profile.team)?.color}
            hideTemplateCrest={isConnectedZone(map) || map === 'liverpool-museum'}
            name={
              isConnectedZone(map) || map === 'liverpool-museum' || map === 'hall-of-legends'
                ? ''
                : `${profile.nickname} · BẠN`
            }
            moving={animation.moving}
            direction={animation.direction}
            running={animation.running}
            jumping={animation.jumping}
            seated={animation.seated}
            gesture={gesture}
          />
        </group>
        {bubble && <Billboard text={bubble} />}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.43, 0.48, 24]} />
          <meshBasicMaterial color="#ffe29a" transparent opacity={0.8} />
        </mesh>
      </group>
    </RigidBody>
  );
}
function seatOffset(direction: number, map: SceneId): [number, number, number] {
  return [-Math.sin(direction) * 0.55, map === 'city' ? 0.2 : 0.19, -Math.cos(direction) * 0.55];
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
  gesture,
}: {
  player: Player;
  map: SceneId;
  bubble?: string;
  gesture?: string;
}) {
  const ref = useRef<THREE.Group>(null),
    [x, y, z] = worldPosition(map, player, (player.height ?? 0) + (player.airOffset ?? 0) + 0.04);
  const initial = useRef<[number, number, number]>([x, y, z]).current;
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    ref.current?.position.lerp(target.set(x, y, z), Math.min(1, dt * 12));
  });
  // The legacy direction is now interpreted consistently as atan2(x, z) by 3D clients.
  return (
    <group ref={ref} position={initial}>
      <group
        position={(map === 'liverpool' || map === 'city') && player.seated ? seatOffset(player.direction, map) : undefined}
      >
        <Character
          color={TEAMS.find((t) => t.id === player.team)?.color}
          hideTemplateCrest={isConnectedZone(map) || map === 'liverpool-museum'}
          name={player.nickname}
          moving={player.moving}
          direction={player.direction}
          running={player.motion === 'Run'}
          jumping={player.motion === 'Jump'}
          seated={player.seated}
          gesture={gesture}
        />
      </group>
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

/** Sensor-only trigger volumes never obstruct the character controller or camera ray. */
function PortalTriggers({ map, runtime }: { map: SceneId; runtime: React.RefObject<Runtime> }) {
  const { rapier } = useRapier();
  const maps: SceneId[] = map === 'plaza' ? [map, ...CAVES.map((cave) => cave.id)] : [map];
  return (
    <RigidBody type="fixed" colliders={false}>
      {maps.flatMap((zone) =>
        playtestInteractions(zone)
          .filter((p) => p.kind === 'portal' && (zone !== 'plaza' || isOpenCave(p.target)))
          .map((p) => {
            const [x, h, z] = worldPosition(zone, p, groundHeight(zone, p) ?? 0);
            return (
              <CuboidCollider
                key={p.id}
                args={[1.3, 2, 0.55]}
                position={[x, h + 2, z]}
                sensor
                activeCollisionTypes={rapier.ActiveCollisionTypes.ALL}
                onIntersectionEnter={(e) => {
                  if (e.rigidBodyObject?.name === 'player-capsule') runtime.current.portal = p.id;
                }}
                onIntersectionExit={(e) => {
                  if (
                    e.rigidBodyObject?.name === 'player-capsule' &&
                    runtime.current.portal === p.id
                  )
                    runtime.current.portal = undefined;
                }}
              />
            );
          }),
      )}
    </RigidBody>
  );
}
