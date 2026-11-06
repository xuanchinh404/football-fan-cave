import { GRAND_SCOREBOARD, grandWalkable } from '../packages/shared/grandHall';
import { CAVES, GRAND_SURFACES, grandHeight, grandWire } from '../packages/shared/grandHall';
import { clearPath, PORTALS } from '../packages/shared/world';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  layouts,
  playtestInteractions,
  playtestNear,
  sceneBounds,
  sceneObstacles,
  toNetwork,
  toScene,
} from '../apps/web/src/game/three/worldLayout';
import { obstacles, spawn, SPEED, walkable } from '../packages/shared/world';

test('3D coordinates round-trip existing authoritative positions without changing room protocol', () => {
  for (const map of ['plaza', 'united', 'hall-of-legends'] as const) {
    for (const p of [spawn(map), ...playtestInteractions(map)]) {
      const [x, z] = toScene(map, p),
        back = toNetwork(map, x, z);
      assert(Math.abs(back.x - p.x) < 1e-8);
      assert(Math.abs(back.y - p.y) < 1e-8);
    }
    const b = sceneBounds(map);
    assert(b.left < 0 && b.right > 0 && b.top < 0 && b.bottom > 0);
    assert(walkable(map, ...(Object.values(spawn(map)) as [number, number])));
    // Per-second displacement converted back to the wire never exceeds the existing limit.
    const metres = SPEED * layouts[map].scale;
    assert.equal(metres / layouts[map].scale, SPEED);
  }
});
test('rendered obstacle footprints match every unchanged authoritative obstacle', () => {
  for (const map of ['plaza', 'united', 'hall-of-legends'] as const) {
    const legacy = obstacles(map),
      meshes = sceneObstacles(map);
    assert.equal(meshes.length, legacy.length);
    meshes.forEach((o, i) => {
      const p = toNetwork(map, o.x, o.z);
      assert(Math.abs(p.x - legacy[i].x - legacy[i].w / 2) < 1e-8);
      assert(Math.abs(p.y - legacy[i].y - legacy[i].h / 2) < 1e-8);
      assert(Math.abs(o.w / layouts[map].scale - legacy[i].w) < 1e-8);
      assert(Math.abs(o.d / layouts[map].scale - legacy[i].h) < 1e-8);
    });
  }
});
test('playtest only exposes implemented 3D rooms and both usable return portals', () => {
  assert.deepEqual(
    playtestInteractions('plaza')
      .filter((p) => p.kind === 'portal')
      .map((p) => p.target),
    CAVES.map((c) => c.id),
  );
  assert.deepEqual(
    playtestInteractions('united')
      .filter((p) => p.kind === 'portal')
      .map((p) => p.target),
    ['hall-of-legends', 'plaza'],
  );
  assert.equal(playtestNear('plaza', PORTALS.find((p) => p.id === 'united')!)?.target, 'united');
  assert.equal(playtestNear('united', { x: 2048, y: 2750 })?.target, 'plaza');
  assert.equal(playtestNear('plaza', { x: 680, y: 470 }), undefined);
  assert.equal(playtestNear('united', { x: 2048, y: 1100 })?.target, 'hall-of-legends');
  assert.equal(
    playtestInteractions('hall-of-legends').find((p) => p.kind === 'portal')?.target,
    'united',
  );
});

test('all nine cave forecourts are reachable by continuous height-aware paths', () => {
  const queue = [{ x: 0, z: 27 }],
    seen = new Set(['0,27']);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, z: p.z + dz },
        key = `${n.x},${n.z}`;
      if (!seen.has(key) && clearPath('plaza', grandWire(p.x, p.z), grandWire(n.x, n.z))) {
        seen.add(key);
        queue.push(n);
      }
    }
  }
  for (const c of CAVES)
    assert(
      queue.some((p) => Math.hypot(p.x - c.x, p.z - (c.z + 2)) < 1.5),
      `${c.id} unreachable`,
    );
  assert.equal(CAVES.length, 9);
  assert(!PORTALS.some((p) => p.id === 'common'));
  assert.equal(grandHeight(-33, -51), 15);
  assert.equal(grandHeight(33, -51), 15);
  assert.equal(grandHeight(0, -25), 7);
  assert(
    !clearPath('plaza', grandWire(15, -7), grandWire(15, -23)),
    'cannot climb an unconnected cliff',
  );
});

test('overhead result board permits walking underneath but its ground posts collide', () => {
  assert(grandWalkable(GRAND_SCOREBOARD.x, GRAND_SCOREBOARD.z));
  assert(!grandWalkable(GRAND_SCOREBOARD.x + 4.5, GRAND_SCOREBOARD.z));
});
