import { caveEntrance, CAVES, type CaveId } from './grandHall';

type Planar = { x: number; z: number };

export type CaveGate = {
  id: CaveId;
  club: CaveId;
  origin: readonly [number, number, number];
  yaw: number;
  color: string;
  accent: string;
  titles: readonly [string, string];
  subtitles: readonly [string, string];
};

const styles: Record<CaveId, readonly [string, string, string, string]> = {
  liverpool: ['#8d1429', '#e1ae5c', 'LIVERPOOL CAVE', 'You’ll Never Walk Alone'],
  united: ['#801128', '#e9b65e', 'MANCHESTER UNITED', 'Old Trafford'],
  arsenal: ['#ad2331', '#e6bc73', 'ARSENAL', 'North London'],
  chelsea: ['#173d91', '#d9bc79', 'CHELSEA', 'Stamford Bridge'],
  bayern: ['#aa1734', '#f0dedb', 'BAYERN MUNICH', 'Mia san mia'],
  psg: ['#202e66', '#f23d61', 'PARIS SAINT-GERMAIN', 'Paris est magique'],
  real: ['#d4cbb6', '#ae8744', 'REAL MADRID', '¡Hala Madrid!'],
  city: ['#397aaa', '#f2c175', 'MANCHESTER CITY', 'Blue Moon'],
  barcelona: ['#4b245a', '#efbd47', 'FC BARCELONA', 'Més que un club'],
};

export const CAVE_GATES: readonly CaveGate[] = CAVES.map((cave) => {
  const { x, z, height } = caveEntrance(cave);
  const [color, accent, english, subtitle] = styles[cave.id];
  return {
    id: cave.id,
    club: cave.id,
    origin: [x, height, z],
    yaw: 0,
    color,
    accent,
    titles: [cave.name.toUpperCase(), english],
    subtitles: [subtitle, subtitle],
  };
});
export const LIVERPOOL_GATE = CAVE_GATES.find((gate) => gate.id === 'liverpool')!;

export const GATE_HALF_WIDTH = 2.14;
const FRAME_HALF_WIDTH = 5.45;
export const GATE_OPEN_MS = 1350;
export const GATE_HOLD_MS = 2500;
const GATE_CLOSE_MS = 1250;
export type GateTiming = { openedAt: number; closeAt: number };
export type GatePhase = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING';

function gateProgress(timing: GateTiming | undefined, now: number) {
  if (!timing) return 0;
  return Math.max(
    0,
    Math.min(
      1,
      (now - timing.openedAt) / GATE_OPEN_MS,
      (timing.closeAt + GATE_CLOSE_MS - now) / GATE_CLOSE_MS,
    ),
  );
}

export function gatePhase(timing: GateTiming | undefined, now: number): GatePhase {
  if (!timing || now >= timing.closeAt + GATE_CLOSE_MS) return 'CLOSED';
  if (now >= timing.closeAt) return 'CLOSING';
  return now >= timing.openedAt + GATE_OPEN_MS ? 'OPEN' : 'OPENING';
}

export function gateOpenness(timing: GateTiming | undefined, now: number) {
  const t = gateProgress(timing, now);
  return t * t * (3 - 2 * t);
}

/** Return the same timing while the current motion remains valid. */
export function updateGate(timing: GateTiming | undefined, occupied: boolean, now: number) {
  const phase = gatePhase(timing, now);
  if (occupied) {
    if (!timing || phase === 'CLOSED' || phase === 'CLOSING') {
      return { openedAt: now - gateProgress(timing, now) * GATE_OPEN_MS, closeAt: Infinity };
    }
    return Number.isFinite(timing.closeAt) ? { ...timing, closeAt: Infinity } : timing;
  }
  if (phase === 'CLOSED') return undefined;
  if (timing && !Number.isFinite(timing.closeAt)) {
    return { ...timing, closeAt: Math.max(now + GATE_HOLD_MS, timing.openedAt + GATE_OPEN_MS) };
  }
  return timing;
}

// JSON represents an unscheduled close as null.
export type GateState = {
  id: string;
  now: number;
  timing?: { openedAt: number; closeAt: number | null };
};

function local(gate: CaveGate, p: Planar) {
  const x = p.x - gate.origin[0],
    z = p.z - gate.origin[2];
  const s = Math.sin(gate.yaw),
    c = Math.cos(gate.yaw);
  return { x: x * c - z * s, z: x * s + z * c };
}

export function gateNear(gate: CaveGate, p: Planar & { height: number }) {
  const { x, z } = local(gate, p);
  return Math.abs(p.height - gate.origin[1]) < 1 && Math.hypot(x, z) <= 3.9;
}

export function gateBlocksMove(gate: CaveGate, from: Planar, to: Planar, openness: number) {
  const a = local(gate, from),
    b = local(gate, to);
  const fromOutside = a.z >= 0;
  const toOutside = b.z >= 0;
  if (fromOutside === toOutside) return false;
  const x = Math.abs(a.x - ((b.x - a.x) * a.z) / (b.z - a.z));
  return x < FRAME_HALF_WIDTH + 0.28 && (x > GATE_HALF_WIDTH - 0.28 || openness < 0.04);
}
