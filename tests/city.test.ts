import { CAVE_GATES, gateNear } from '../packages/shared/caveGates';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAVE_CONNECTIONS, fromWorldPoint, toWorldPoint } from '../packages/shared/caveConnections';
import { CITY_BLOCKS, CITY_HALL, CITY_SEATS, cityArea, cityWire } from '../packages/shared/city/layout';
import { cityHonours, cityInteractions } from '../packages/shared/city/content';
import { clearPath, groundHeight, walkable } from '../packages/shared/world';

test('City tunnel, stairs and museum share the world transform and walkable floor', () => {
  const room = CAVE_CONNECTIONS.city;
  assert.equal(room.roomMouth, room.offset[2]);
  // The west wall of City overlaps United in plan, but the rooms are stacked.
  assert.ok(room.offset[1] + CITY_HALL.ceiling < CAVE_CONNECTIONS.united.offset[1] - 1);
  const route = [
    cityWire(0, room.rampEnd - room.offset[2] + 0.5),
    cityWire(0, 3), cityWire(0, -7), cityWire(0, -24),
    cityWire(0, -15), cityWire(24, -15), cityWire(37, -15),
  ];
  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    const restored = fromWorldPoint('city', toWorldPoint('city', point));
    assert.ok(Math.hypot(point.x - restored.x, point.y - restored.y) < 0.001);
    if (i) assert.ok(clearPath('city', route[i - 1], point));
  }
  assert.equal(groundHeight('city', cityWire(0, -24)), 1.35);
  assert.equal(cityArea(cityWire(17, -15)), 'link');
  assert.equal(cityArea(cityWire(23, -15)), 'museum');
  assert.equal(walkable('city', cityWire(17, -10).x, cityWire(17, -10).y), false);
});

test('City exhibits and sofa prompts sit on reachable approaches to solid displays', () => {
  for (const point of cityInteractions) {
    assert.ok(walkable('city', point.x, point.y), point.id);
  }
  for (const block of CITY_BLOCKS) {
    const { x, y } = cityWire(block.x, block.z);
    assert.equal(walkable('city', x, y), false);
  }
  for (const seat of CITY_SEATS) {
    assert.ok(clearPath('city', cityWire(-7.25, -18.9), seat));
  }
  assert.equal(cityHonours.length, new Set(cityHonours.map(({ id }) => id)).size);
});


test('City gate detects an inside approach along the edge of the tunnel', () => {
  const gate = CAVE_GATES.find(({ id }) => id === 'city')!;
  const [x, height, z] = gate.origin;
  assert.ok(gateNear(gate, { x: x - 2.8, z: z - 2.9, height: height - 0.25 }));
  assert.equal(gateNear(gate, { x: x - 2.8, z: z + 2.9, height }), false);
  assert.equal(gateNear(gate, { x, z: z - 4, height }), false);
});
