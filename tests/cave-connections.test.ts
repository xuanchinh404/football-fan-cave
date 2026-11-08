import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CAVE_CONNECTIONS,
  caveOffset,
  fromWorldPoint,
  toWorldPoint,
  zoneAtDoor,
} from '../packages/shared/caveConnections';
import { CAVE_GATES, gateBlocksMove, gateNear } from '../packages/shared/caveGates';
import { grandWire } from '../packages/shared/grandHall';
import { groundHeight, walkable } from '../packages/shared/world';

for (const gate of CAVE_GATES) {
  test(`${gate.id} has continuous walkable ground from the original gate to its refuge`, () => {
    const [x, height, z] = gate.origin;
    const { roomMouth } = CAVE_CONNECTIONS[gate.id];
    const outside = grandWire(x, z + 0.15);
    assert.equal(groundHeight('plaza', outside), height);
    assert(walkable('plaza', outside.x, outside.y));
    assert.equal(zoneAtDoor('plaza', x, z - 0.15, height), gate.id);
    assert.equal(zoneAtDoor(gate.id, x, z + 0.15, height), 'plaza');
    assert.equal(zoneAtDoor('plaza', x, z - 0.15, height - 4), 'plaza');
    for (const delta of [-0.15, 0.15]) assert(gateNear(gate, { x, z: z + delta, height }));
    assert(gateBlocksMove(gate, { x, z: z + 0.15 }, { x, z: z - 0.15 }, 0));
    assert(!gateBlocksMove(gate, { x, z: z + 0.15 }, { x, z: z - 0.15 }, 1));

    let previousHeight = height;
    for (let step = z - 0.1; step > roomMouth - 1; step -= 0.1) {
      const world = grandWire(x, step);
      const local = fromWorldPoint(gate.id, world);
      assert(walkable(gate.id, local.x, local.y), `blocked at ${step}`);
      const next = groundHeight(gate.id, local)! + caveOffset(gate.id)[1];
      assert(Math.abs(next - previousHeight) <= 0.26, `height discontinuity at ${step}`);
      assert(Math.abs(toWorldPoint(gate.id, local).y - world.y) < 1e-7);
      previousHeight = next;
    }
    assert(Math.abs(previousHeight - caveOffset(gate.id)[1]) < 0.01);
  });
}
