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
  walkable,
} from '../packages/shared/world';
import { ARSENAL_CAVE, gunnersWire } from '../packages/shared/arsenal/layout';
import {
  arsenalExhibits,
  arsenalManagers,
  arsenalTrophies,
} from '../packages/shared/arsenal/content';

test('Arsenal gate and return spawns use distinct server rooms and safe terrain', () => {
  assert(isOpenCave('arsenal'));
  assert.equal(roomKey('arsenal'), 'cave:arsenal');
  assert.equal(roomKey('arsenal-museum'), 'museum:arsenal');
  for (const [from, to] of [
    ['plaza', 'arsenal'],
    ['arsenal', 'arsenal-museum'],
    ['arsenal-museum', 'arsenal'],
    ['arsenal', 'plaza'],
  ] as const) {
    const at = arrival(from, to);
    assert(walkable(to, at.x, at.y));
    assert(interactions(from).some((p) => p.target === to));
  }
  assert.deepEqual(arrival('arsenal-museum', 'arsenal'), ARSENAL_CAVE.returnFromMuseum);
  assert(clearPath('arsenal', gunnersWire(0, -4.2), gunnersWire(0, -9.2)));
  assert(!clearPath('arsenal', gunnersWire(0, -9.2), gunnersWire(0, -13)));
  assert.equal(groundHeight('arsenal', gunnersWire(0, -9.2)), 0.9);
});
test('every Arsenal exhibit, seat and portal is reachable through legal paths', () => {
  for (const map of ['arsenal', 'arsenal-museum'] as const) {
    const start = spawn(map),
      points = [start],
      seen = new Set<string>([start.x + ',' + start.y]);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      for (const [dx, dy] of [
        [20, 0],
        [-20, 0],
        [0, 20],
        [0, -20],
      ]) {
        const q = { x: p.x + dx, y: p.y + dy },
          key = q.x + ',' + q.y;
        if (seen.has(key) || !clearPath(map, p, q)) continue;
        seen.add(key);
        points.push(q);
      }
    }
    for (const item of interactions(map)) {
      assert(walkable(map, item.x, item.y), item.id);
      assert.equal(near(map, item)?.id, item.id);
      assert(
        points.some((p) => Math.hypot(item.x - p.x, item.y - p.y) < 30),
        `unreachable ${item.id}`,
      );
    }
  }
});
test('Arsenal data includes 2026 league and shield wins with shared Shield classification', () => {
  assert.deepEqual(
    arsenalTrophies.map((t) => t.seasons.length),
    [14, 14, 2, 1, 1, 18],
  );
  assert.equal(arsenalTrophies[0].seasons.at(-1), '2025/26');
  assert.match(arsenalTrophies[5].detail, /chia sẻ.*1991/);
  assert.equal(arsenalTrophies[5].seasons.at(-1), '2026');
  assert.deepEqual(
    arsenalManagers.filter((m) => m.current).map((m) => m.heading),
    ['Mikel Arteta'],
  );
  assert.equal(new Set(arsenalExhibits.map((e) => e.id)).size, arsenalExhibits.length);
});
