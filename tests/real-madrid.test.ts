import assert from 'node:assert/strict';
import test from 'node:test';
import { officialCoachRows } from '../packages/shared/real/coach-source';
import {
  realCoaches,
  realCoachTerms,
  realEras,
  realHonours,
  realTermsInEra,
} from '../packages/shared/real/content';
import { realArea, realInteractions, REAL_ROOMS, realWire } from '../packages/shared/real/layout';
import { CAVE_CONNECTIONS, fromWorldPoint, toWorldPoint } from '../packages/shared/caveConnections';
import { caveEntrance, CAVES, grandWire } from '../packages/shared/grandHall';
import { clearPath, groundHeight, near, walkable } from '../packages/shared/world';

test('Real Madrid archive covers every club entry in chronological order', () => {
  assert.equal(officialCoachRows.length, 64);
  assert.equal(realCoachTerms.length, officialCoachRows.length);
  assert.equal(new Set(realCoachTerms.map(({ id }) => id)).size, officialCoachRows.length);
  assert.deepEqual(
    realCoachTerms.map(({ personId, start, end }) => [personId, start, end]),
    officialCoachRows.map(([personId, , start, end]) => [personId, start, end]),
  );
  assert.deepEqual(
    realCoachTerms.map(({ start }) => start),
    realCoachTerms.map(({ start }) => start).sort((a, b) => a - b),
  );
  assert.equal(
    new Set(realEras.flatMap((_, i) => realTermsInEra(i).map(({ id }) => id))).size,
    realCoachTerms.length,
  );
  for (const term of realCoachTerms) assert.ok(realCoaches[term.personId].name);
  assert.ok(
    Object.values(realCoaches).some((person) => person.portrait === undefined && person.name),
  );
});

test('returning coaches retain distinct terms and Mourinho is the sole current coach', () => {
  const starts = (id: string) =>
    realCoachTerms.filter((term) => term.personId === id).map((term) => term.start);
  assert.deepEqual(starts('carlo-ancelotti'), [2013, 2021]);
  assert.deepEqual(starts('zinedine-zidane'), [2016, 2019]);
  assert.deepEqual(starts('vicente-del-bosque'), [1994, 1995, 1999]);
  assert.deepEqual(starts('luis-molowny'), [1973, 1977, 1982, 1985]);
  assert.deepEqual(starts('jose-mourinho'), [2010, 2026]);
  assert.deepEqual(
    realCoachTerms.filter((term) => term.current).map((term) => term.id),
    ['jose-mourinho-2026'],
  );
  assert.equal(
    realCoachTerms.find((term) => term.id === 'xabi-alonso-2025')?.endDate,
    '2026-01-12',
  );
  assert.equal(
    realCoachTerms.find((term) => term.id === 'alvaro-arbeloa-2026')?.endDate,
    '2026-06-09',
  );
});

test('Real Madrid passage and refuge stairs use contiguous walkable surfaces', () => {
  const connection = CAVE_CONNECTIONS.real;
  assert.ok(
    connection.offset[1] + REAL_ROOMS.museum.height + 1 < CAVE_CONNECTIONS.united.offset[1],
  );
  const gate = caveEntrance(CAVES.find((cave) => cave.id === 'real')!);
  const gatePoint = grandWire(gate.x, gate.z);
  const entrance = fromWorldPoint('real', gatePoint);
  assert.equal(groundHeight('real', entrance)! + connection.offset[1], gate.height);
  const roundTrip = toWorldPoint('real', entrance);
  assert.ok(Math.abs(roundTrip.x - gatePoint.x) < 1e-8);
  assert.ok(Math.abs(roundTrip.y - gatePoint.y) < 1e-8);
  const points = [entrance, realWire(0, 3), realWire(0, -14), realWire(29, -14), realWire(40, -14)];
  for (let i = 1; i < points.length; i++)
    assert.ok(clearPath('real', points[i - 1], points[i]), 'continuous route at segment ' + i);
  assert.equal(realArea(points[3]), 'museum');
  assert.equal(walkable('real', ...([realWire(19, -7).x, realWire(19, -7).y] as const)), false);
  assert.ok(clearPath('real', realWire(0, -15), realWire(0, -23)));
  assert.equal(groundHeight('real', realWire(0, -23)), 1.28);
  for (const item of realInteractions) assert.equal(near('real', item)?.id, item.id);
});

test('official honours list has no repeated seasons within a competition', () => {
  for (const honour of realHonours)
    assert.equal(new Set(honour.seasons).size, honour.seasons.length);
  assert.equal(realHonours.find((honour) => honour.id === 'Champions Leagues')?.seasons.length, 15);
});
