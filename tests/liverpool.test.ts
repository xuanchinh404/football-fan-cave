import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  arrival,
  clearPath,
  groundHeight,
  interactions,
  isOpenCave,
  near,
  roomKey,
  spawn,
  validMap,
  walkable,
} from '../packages/shared/world';
import {
  KOP_CAVE,
  KOP_EXIT_STAIRS,
  KOP_TUNNEL,
  liverpoolWire,
} from '../packages/shared/liverpool/layout';
import {
  GATE_HOLD_MS,
  GATE_OPEN_MS,
  LIVERPOOL_GATE,
  gateBlocksMove,
  gateNear,
  gateOpenness,
  gatePhase,
  updateGate,
} from '../packages/shared/caveGates';
import { grandWire } from '../packages/shared/grandHall';
import {
  fromWorldPoint,
  KOP_OFFSET,
  toWorldPoint,
  zoneAtDoor,
} from '../packages/shared/liverpool/connection';
import {
  LIVERPOOL_MAJOR_TOTAL,
  liverpoolCoaches,
  liverpoolCups,
  liverpoolDemo,
  liverpoolExhibits,
  liverpoolShield,
} from '../packages/shared/liverpool/content';

test('Liverpool heritage portal still has valid arrivals; the physical doorway has no portal', () => {
  assert(isOpenCave('liverpool'));
  assert(validMap('liverpool-museum'));
  assert.notEqual(roomKey('liverpool'), roomKey('liverpool-museum'));
  for (const [from, to] of [
    ['liverpool', 'liverpool-museum'],
    ['liverpool-museum', 'liverpool'],
  ] as const) {
    const p = arrival(from, to);
    assert(walkable(to, p.x, p.y));
    assert(interactions(from).some((item) => item.target === to));
  }
  assert.deepEqual(arrival('liverpool-museum', 'liverpool'), KOP_CAVE.returnFromMuseum);
  assert(!interactions('plaza').some((item) => item.target === 'liverpool'));
  assert(!interactions('liverpool').some((item) => item.target === 'plaza'));
  assert(clearPath('liverpool', liverpoolWire(0, -2), liverpoolWire(0, -8.2)));
  assert.equal(groundHeight('liverpool', liverpoolWire(0, -8.2)), 0.8);
  assert(clearPath('liverpool', liverpoolWire(12, -11), KOP_CAVE.entry));
  assert(!clearPath('liverpool', liverpoolWire(7, -20), liverpoolWire(12, -20)));
});

test('all Liverpool hotspots can be reached on the server navigation layout', () => {
  for (const map of ['liverpool', 'liverpool-museum'] as const) {
    const start = spawn(map);
    const points = [start];
    const seen = new Set([start.x + ',' + start.y]);
    for (const p of points) {
      for (const [dx, dy] of [
        [20, 0],
        [-20, 0],
        [0, 20],
        [0, -20],
      ]) {
        const q = { x: p.x + dx, y: p.y + dy };
        const key = q.x + ',' + q.y;
        if (seen.has(key) || !clearPath(map, p, q)) continue;
        seen.add(key);
        points.push(q);
      }
    }
    for (const item of interactions(map)) {
      assert.equal(near(map, item)?.id, item.id);
      assert(walkable(map, item.x, item.y), item.id);
      assert(
        points.some((p) => Math.hypot(item.x - p.x, item.y - p.y) < 30),
        item.id,
      );
    }
  }
});

test('Liverpool doorway shares one position, elevation and walkable approach', () => {
  const { x, door, start, end } = KOP_TUNNEL;
  const [worldX, height, worldZ] = LIVERPOOL_GATE.origin;
  const threshold = grandWire(worldX, worldZ);
  assert.deepEqual(toWorldPoint('liverpool', liverpoolWire(x, door)), threshold);
  assert.deepEqual(fromWorldPoint('liverpool', threshold), liverpoolWire(x, door));
  assert.equal(height, groundHeight('plaza', threshold));
  assert.equal(height, groundHeight('liverpool', liverpoolWire(x, door))! + KOP_OFFSET[1]);
  assert.equal(zoneAtDoor('plaza', worldX, worldZ - 0.1), 'liverpool');
  assert.equal(zoneAtDoor('liverpool', worldX, worldZ + 0.1), 'plaza');
  assert.equal(zoneAtDoor('plaza', worldX + 6, worldZ - 0.1), 'plaza');
  assert(end - start >= 15 && end - start <= 25);
  assert.equal(KOP_EXIT_STAIRS.length, KOP_TUNNEL.steps);
  for (const step of KOP_EXIT_STAIRS)
    assert(
      Math.abs(
        groundHeight('liverpool', liverpoolWire(x, step.z))! - (step.height - KOP_TUNNEL.rise / 2),
      ) < 1e-8,
    );
  assert(clearPath('liverpool', liverpoolWire(x, start), KOP_CAVE.exit));
  assert(
    !clearPath(
      'liverpool',
      liverpoolWire(x, KOP_TUNNEL.stairStart + 1),
      liverpoolWire(x + 3.4, KOP_TUNNEL.stairStart + 1),
    ),
  );
});

test('Liverpool gate senses both sides, waits for vacancy and reverses without snapping', () => {
  const [x, height, z] = LIVERPOOL_GATE.origin;
  const before = { x, height, z: z + 0.8 };
  const after = { x, height, z: z - 0.8 };
  for (const position of [before, after]) assert(gateNear(LIVERPOOL_GATE, position));
  assert(!gateNear(LIVERPOOL_GATE, { ...before, height: height + 5 }));
  assert(!gateNear(LIVERPOOL_GATE, { ...before, z: z + 4 }));
  assert(gateBlocksMove(LIVERPOOL_GATE, before, after, 0));
  assert(gateBlocksMove(LIVERPOOL_GATE, after, before, 0));
  assert(!gateBlocksMove(LIVERPOOL_GATE, before, after, 1));
  const timing = updateGate(undefined, true, 1000)!;
  assert.equal(gatePhase(timing, 1000), 'OPENING');
  assert.equal(gatePhase(timing, 1000 + GATE_OPEN_MS), 'OPEN');
  assert.equal(updateGate(timing, true, 9000), timing);
  const empty = updateGate(timing, false, 9000)!;
  assert.equal(empty.closeAt, 9000 + GATE_HOLD_MS);
  assert.equal(gatePhase(empty, empty.closeAt - 1), 'OPEN');
  const halfway = empty.closeAt + 625;
  assert.equal(gatePhase(empty, halfway), 'CLOSING');
  const reversed = updateGate(empty, true, halfway)!;
  assert.equal(gatePhase(reversed, halfway), 'OPENING');
  assert.equal(gateOpenness(reversed, halfway), gateOpenness(empty, halfway));
  assert.equal(gatePhase(empty, empty.closeAt + 1250), 'CLOSED');
  assert.equal(updateGate(empty, false, empty.closeAt + 1250), undefined);
});

test('museum totals keep Community Shield separate and mark current coaching and demo states', () => {
  assert.deepEqual(
    liverpoolCups.map((cup) => cup.seasons.length),
    [20, 6, 8, 10, 3, 4, 1],
  );
  assert.equal(LIVERPOOL_MAJOR_TOTAL, 52);
  assert.equal(liverpoolShield.seasons.length, 16);
  assert.deepEqual(
    liverpoolCoaches.filter((coach) => coach.current).map((coach) => coach.heading),
    ['Andoni Iraola'],
  );
  assert.match(liverpoolDemo.label, /DEMO/);
  assert.equal(liverpoolDemo.score, '—');
  assert.equal(new Set(liverpoolExhibits.map((e) => e.id)).size, liverpoolExhibits.length);
});
