import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HALL,
  trophies,
  leagueTitles,
  managers,
  exhibits,
  validateMuseum,
} from '../packages/shared/museum/index.ts';
import {
  hallHistory,
  hallObstacles,
  hallStatue,
  hallTrophies,
  museumPoint,
} from '../packages/shared/museum/hall';
import {
  interactions,
  walkable,
  spawn,
  near,
  roomKey,
  clearPath,
} from '../packages/shared/world.ts';

test('verified trophy inventory: 68 unique awards, 20 league titles and shared Shields', () => {
  assert.equal(validateMuseum().trophies, 68);
  assert.deepEqual(
    leagueTitles.map((t) => t.year),
    [
      1908, 1911, 1952, 1956, 1957, 1965, 1967, 1993, 1994, 1996, 1997, 1999, 2000, 2001, 2003,
      2007, 2008, 2009, 2011, 2013,
    ],
  );
  assert.deepEqual(
    trophies.filter((t) => t.shared).map((t) => t.year),
    [1965, 1967, 1977, 1990],
  );
  assert.equal(
    managers.filter((m) => m.role === 'permanent' && Number(m.start.slice(0, 4)) >= 1945).length,
    14,
  );
  assert.equal(managers.find((m) => m.current)?.name, 'Michael Carrick');
  assert.equal(managers.find((m) => m.name === 'Ruben Amorim')?.end, '2026-01');
  assert.equal(new Set(trophies.map((t) => `${t.group}:${t.season}`)).size, 68);
});
test('all hall stations are reachable with a distinct prompt and the main aisle is clear', () => {
  const map = 'hall-of-legends' as const,
    step = 20,
    start = spawn(map);
  const key = (x: number, y: number) => `${x},${y}`;
  const queue = [start],
    seen = new Set([key(start.x, start.y)]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy },
        k = key(n.x, n.y);
      if (!seen.has(k) && walkable(map, n.x, n.y) && clearPath(map, p, n)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  for (const item of interactions(map)) {
    assert(walkable(map, item.x, item.y), `blocked approach: ${item.id}`);
    assert.equal(near(map, item)?.id, item.id, `overlapping interaction: ${item.id}`);
    assert(
      queue.some((p) => Math.hypot(p.x - item.x, p.y - item.y) < 35),
      `unreachable: ${item.id}`,
    );
  }
  for (const z of HALL.zones)
    assert(
      queue.some((p) => Math.hypot(p.x - z.x, p.y - z.y) < 130),
      `unreachable zone ${z.id}`,
    );
  assert.equal(exhibits.length, 124);
  assert.equal(roomKey(map), 'cave:red-devils:hall-of-legends');
  assert.equal(hallTrophies.length, 9);
  assert.equal(
    hallTrophies.reduce((count, trophy) => count + trophy.seasons.length, 0),
    67,
  );
  assert.equal(hallObstacles.length, 2);
  for (const x of [-2.5, 0, 2.5]) {
    assert(clearPath(map, museumPoint(x, 8.2), museumPoint(x, -9.35)));
  }
  assert(clearPath(map, start, hallStatue.approach));
  assert(clearPath(map, start, hallHistory[3].approach));
  assert(!walkable(map, ...(Object.values(museumPoint(0, -11)) as [number, number])));
  assert(
    !walkable(map, ...(Object.values(museumPoint(hallStatue.x, hallStatue.z)) as [number, number])),
  );
});
