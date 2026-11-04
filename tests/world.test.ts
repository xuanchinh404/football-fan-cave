import { grandWire } from '../packages/shared/grandHall';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanText,
  clearPath,
  move,
  near,
  PORTALS,
  spawn,
  TEAMS,
  validMap,
  validProfile,
  walkable,
} from '../packages/shared/world.ts';
import { RateLimiter } from '../packages/shared/limits.ts';
test('all maps have a safe spawn and reachable portal interaction', () => {
  for (const map of ['plaza', ...TEAMS.map((t) => t.id)] as const) {
    const p = spawn(map);
    assert.equal(walkable(map, p.x, p.y), true);
  }
  for (const portal of PORTALS) {
    assert.equal(near('plaza', portal)?.target, portal.target);
  }
});
test('collision blocks statue and world boundaries, sliding along obstacles works', () => {
  const statue = grandWire(0, 3);
  assert.equal(walkable('plaza', statue.x, statue.y), false);
  assert.equal(clearPath('plaza', grandWire(0, 8), grandWire(0, -2)), false);
  const start = grandWire(-4, 3),
    p = move('plaza', start, 30, 10);
  assert(p.x < start.x + 30);
  assert(p.y > start.y);
  assert.equal(walkable('plaza', -1, 1000), false);
  assert.equal(walkable('united', 400, 1000), false);
});
test('untrusted guest data and map ids are validated', () => {
  assert.equal(validProfile({ nickname: 'x', team: 'united' }), null);
  assert.equal(validProfile({ nickname: 'Test', team: 'spoof' }), null);
  assert.equal(validProfile(null), null);
  assert.equal(validMap('__proto__'), false);
  assert.equal(validMap('common'), true);
  assert.equal(cleanText('<hello>\u0000'), 'hello');
  assert.equal(validProfile({ nickname: 'Test', team: 'city', avatar: 99 })?.avatar, 3);
});
test('rate limiting replenishes tokens and isolates guests', () => {
  const r = new RateLimiter(2, 1000);
  assert(r.allow('a', 0));
  assert(r.allow('a', 0));
  assert(!r.allow('a', 1));
  assert(r.allow('b', 1));
  assert(r.allow('a', 501));
  r.delete('a');
  assert(r.allow('a', 502));
});
