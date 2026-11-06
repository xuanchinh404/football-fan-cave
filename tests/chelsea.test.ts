import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLUES_CAVE, BLUES_MUSEUM, bluesWire } from '../packages/shared/chelsea/layout';
import {
  chelseaTrophies,
  chelseaManagers,
  chelseaExhibits,
  chelseaMatchState,
} from '../packages/shared/chelsea/content';
import {
  arrival,
  spawn,
  validMap,
  roomKey,
  walkable,
  interactions,
  clearPath,
  near,
  groundHeight,
  validProfile,
} from '../packages/shared/world';
import { toScene, toNetwork, sceneObstacles } from '../apps/web/src/game/three/worldLayout';
test('Chelsea rooms have distinct server keys, safe arrivals, preserved team and demo-only result', () => {
  assert(validMap('chelsea-museum'));
  assert.equal(roomKey('chelsea'), 'cave:chelsea');
  assert.equal(roomKey('chelsea-museum'), 'museum:chelsea');
  for (const [from, to] of [
    ['plaza', 'chelsea'],
    ['chelsea', 'chelsea-museum'],
    ['chelsea-museum', 'chelsea'],
    ['chelsea', 'plaza'],
  ] as const) {
    const p = arrival(from, to);
    assert(walkable(to, p.x, p.y));
    const portal = near(to, p);
    if (portal?.kind === 'portal') {
      const [px, pz] = toScene(to, portal),
        [x, z] = toScene(to, p);
      assert(
        Math.abs(x - px) >= 1.3 || Math.abs(z - pz) >= 0.55,
        `${from} → ${to} overlaps sensor`,
      );
    }
  }
  assert.deepEqual(validProfile({ nickname: 'Fan MU', team: 'united', avatar: 2 }), {
    nickname: 'Fan MU',
    team: 'united',
    avatar: 2,
  });
  assert.equal(chelseaMatchState.demo, true);
  assert.equal(groundHeight('chelsea', bluesWire(10, -12)), 0.6);
});
test('every Chelsea exhibit, seat and doorway has a reachable physical approach', () => {
  for (const map of ['chelsea', 'chelsea-museum'] as const) {
    const start = spawn(map),
      queue = [start],
      seen = new Set<string>();
    const step = 20;
    const key = (x: number, y: number) => `${Math.round(x / step)},${Math.round(y / step)}`;
    seen.add(key(start.x, start.y));
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      for (const [dx, dy] of [
        [step, 0],
        [-step, 0],
        [0, step],
        [0, -step],
      ]) {
        const q = { x: p.x + dx, y: p.y + dy },
          k = key(q.x, q.y);
        if (!seen.has(k) && walkable(map, q.x, q.y) && clearPath(map, p, q)) {
          seen.add(k);
          queue.push(q);
        }
      }
    }
    for (const item of interactions(map)) {
      assert(walkable(map, item.x, item.y), `blocked ${item.id}`);
      assert.equal(near(map, item)?.id, item.id, `ambiguous ${item.id}`);
      assert(
        queue.some((p) => Math.hypot(p.x - item.x, p.y - item.y) < 30),
        `unreachable ${item.id}`,
      );
      const [x, z] = toScene(map, item);
      const back = toNetwork(map, x, z);
      assert(Math.abs(back.x - item.x) < 1e-6 && Math.abs(back.y - item.y) < 1e-6);
    }
    assert.equal(
      sceneObstacles(map).length,
      (map === 'chelsea' ? BLUES_CAVE : BLUES_MUSEUM).obstacles.length,
    );
  }
});
test('content distinguishes trophy classifications, season lists, caretakers and current coach', () => {
  assert.deepEqual(
    chelseaTrophies.map((t) => t.seasons.length),
    [6, 2, 8, 5, 2, 2, 1, 2, 4, 1, 1, 2],
  );
  assert.equal(chelseaTrophies.find((t) => t.id === 'blues-trophy-world')!.seasons[0], '2025');
  assert.equal(
    chelseaTrophies.find((t) => t.id === 'blues-trophy-intercontinental')!.seasons[0],
    '2021',
  );
  assert.equal(chelseaManagers.filter((m) => m.current).length, 1);
  assert.equal(chelseaManagers.at(-1)!.name, 'Xabi Alonso');
  for (const name of [
    'Ron Suart',
    'Bobby Gould',
    'Graham Rix',
    'Ray Wilkins',
    'Steve Holland',
    'Bruno Saltor',
    'Calum McFarlane',
  ])
    assert(chelseaManagers.some((m) => m.name === name));
  assert.equal(new Set(chelseaExhibits.map((e) => e.id)).size, chelseaExhibits.length);
  for (const e of chelseaExhibits) assert(e.source.startsWith('https://'));
});
