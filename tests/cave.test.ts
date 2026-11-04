import { PORTALS } from '../packages/shared/world';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RED_CAVE } from '../packages/shared/cave.ts';
import {
  interactions,
  walkable,
  clearPath,
  spawn,
  move,
  mapSize,
  plazaReturn,
  roomKey,
  near,
} from '../packages/shared/world.ts';
test('Red Cave shares safe spawn, real map bounds and plaza return with server', () => {
  assert.deepEqual(mapSize('united'), { width: 4096, height: 3072 });
  assert(walkable('united', spawn('united').x, spawn('united').y));
  assert.equal(roomKey('united'), 'cave:red-devils');
  const gate = PORTALS.find((p) => p.id === 'united')!;
  assert.deepEqual(plazaReturn('united'), { x: gate.x, y: gate.y + 110 });
  for (const p of interactions('united')) {
    assert(walkable('united', p.x, p.y), `interaction ${p.id} must be on floor`);
    if (p.destination) assert(walkable('united', p.destination.x, p.destination.y));
  }
});
test('every cave interaction is reachable from spawn through walkable floor', () => {
  const size = 40,
    start = spawn('united'),
    queue = [start],
    seen = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  seen.add(key(start.x, start.y));
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dy] of [
      [size, 0],
      [-size, 0],
      [0, size],
      [0, -size],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy },
        k = key(n.x, n.y);
      if (!seen.has(k) && clearPath('united', p, n)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  for (const p of interactions('united'))
    assert(
      queue.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 80),
      `${p.id} is unreachable`,
    );
});
test('statue, counter, rock walls and bounds reject collision and tunneling', () => {
  for (const o of RED_CAVE.obstacles) assert(!walkable('united', o.x + o.w / 2, o.y + o.h / 2));
  const p = move('united', { x: 2048, y: 1840 }, 0, -600);
  assert(p.y >= 1743);
  assert(p.y < 1840);
  assert(!walkable('united', 300, 1800));
  assert(!clearPath('united', { x: 2850, y: 1600 }, { x: 3500, y: 1600 }));
});

test('overlapping doors select the nearest interaction rather than configuration order', () => {
  assert.equal(near('united', { x: 3180, y: 640 })?.id, 'event-back');
  assert.equal(near('united', { x: 3100, y: 750 })?.id, 'event-gate');
});
