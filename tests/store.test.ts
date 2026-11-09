import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStoreDatabase } from './helpers/store-database';
import {
  catalog,
  categories,
  dailyItems,
  product,
  stalls,
  starter,
} from '../packages/shared/store/catalog';
import { flightPoint, surfaceAt, throwVelocity } from '../packages/shared/store/physics';
import { validPlacement, type StoreState } from '../packages/shared/store/state';
import { grandWalkable } from '../packages/shared/grandHall';

test('catalogue, booth access, projectile, and private room use shared rules', () => {
  assert.equal(catalog.filter((p) => !p.currency).length, 25);
  assert.equal(catalog.filter((p) => p.currency === 'xu').length, 71);
  assert.equal(catalog.filter((p) => p.currency === 'kc').length, 29);
  assert.equal(new Set(catalog.map((p) => p.id)).size, 125);
  assert.equal(Object.keys(categories).length, 10);
  assert.equal(stalls.length, 4);
  for (const stall of stalls) assert(grandWalkable(stall.x, 32.35));
  assert.equal(product('P002')?.price, 30);
  assert.equal(product('P042')?.price, 80);
  assert.deepEqual(product('P012')?.contents, { P001: 5, P003: 5, P004: 5, P005: 5 });
  assert.equal(throwVelocity([NaN, 0, 0], 'tomato'), undefined);
  const velocity = throwVelocity([0, 0, -1], 'tomato')!;
  const flight = {
    id: 't',
    sku: 'P001',
    owner: 'a',
    delay: 0,
    origin: [-32, 1.24, 5] as [number, number, number],
    velocity,
  };
  assert.equal(surfaceAt(flightPoint(flight, 0.35)), 'target');
  assert.equal(surfaceAt([-35, 1.4, -1]), 'wall');
  assert.equal(surfaceAt([0, 0, 25]), 'floor');
  assert.equal(validPlacement(product('P073')!, { x: 0, z: 2, turn: 0 }), undefined);
  assert.equal(validPlacement(product('P073')!, { x: 2.8, z: -2, turn: 1 })?.turn, 1);
});

test('store migration serializes rewards, charges, retries, consumption, gifts and furniture', async () => {
  const db = await createStoreDatabase();
  const a = randomUUID(),
    b = randomUUID();
  const sql = 'select public.game_store_command($1,$2,$3,$4,$5) as state';
  function args(
    user: string,
    command: string,
    input: Record<string, unknown> = {},
    id = command === 'load' ? null : randomUUID(),
  ) {
    const item = product(input.sku);
    return [
      user,
      command,
      id,
      input,
      {
        starter,
        daily: dailyItems,
        timezone: 'Asia/Ho_Chi_Minh',
        slot: item?.slot,
        price: item?.price,
        currency: item?.currency,
        maxOrder: item?.maxOrder,
        consumable: item?.consumable,
        action: item?.action,
        stackable: item?.stackable,
        contents: item?.contents,
        prank: item?.category === 'pranks' || item?.category === 'throwables',
        stackableGrants: Object.keys(item?.contents ?? { [item?.id ?? '']: 1 }).filter(
          (sku) => product(sku)?.stackable,
        ),
      },
    ];
  }
  const run = async (...input: Parameters<typeof args>) =>
    (await db.query<{ state: StoreState }>(sql, args(...input))).rows[0].state;
  try {
    await db.query('insert into auth.users(id,email_confirmed_at) values ($1,now()),($2,now())', [
      a,
      b,
    ]);
    await db.query('update public.wallets set balance=9 where user_id=$1', [a]);
    await db.exec('set role service_role');
    const first = await run(a, 'load');
    assert.deepEqual(first.wallet, { xu: '509', kc: '100' });
    assert.equal(Object.keys(first.inventory).length, 25);
    assert.deepEqual((await run(a, 'load')).inventory, first.inventory);
    await assert.rejects(run(a, 'claim'), /ALREADY_CLAIMED/);
    await db.query('update public.game_store_state set reward_day=reward_day-1 where user_id=$1', [
      a,
    ]);
    const claims = await Promise.allSettled([run(a, 'claim'), run(a, 'claim')]);
    assert.equal(claims.filter((value) => value.status === 'fulfilled').length, 1);
    const key = randomUUID();
    const bought = await Promise.all([
      run(a, 'buy', { sku: 'P002', quantity: 2 }, key),
      run(a, 'buy', { sku: 'P002', quantity: 2 }, key),
    ]);
    assert.equal(bought[0].transactionId, bought[1].transactionId);
    assert.equal(bought[1].replay, true);
    assert.equal(bought[1].inventory.P002, 2);
    assert.deepEqual(bought[1].wallet, { xu: '549', kc: '110' });
    assert.equal(bought[1].history.filter((h) => h.reason === 'store_purchase').length, 1);
    await assert.rejects(run(a, 'buy', { sku: 'P001', quantity: 2 }, key), /REQUEST_CONFLICT/);
    await assert.rejects(run(a, 'buy', { sku: 'P036', quantity: 1 }), /INSUFFICIENT_BALANCE/);
    const boots = await run(a, 'buy', { sku: 'P042', quantity: 1 });
    assert.deepEqual(boots.wallet, { xu: '549', kc: '30' });
    await db.query('update public.wallets set diamonds=200 where user_id=$1', [a]);
    await assert.rejects(run(a, 'buy', { sku: 'P042', quantity: 1 }), /ALREADY_OWNED/);
    assert.equal((await run(a, 'load')).wallet.kc, '200');
    await assert.rejects(run(a, 'use', { sku: 'P002' }), /NOT_EQUIPPED/);
    await run(a, 'equip', { sku: 'P002' });
    const throwKey = randomUUID();
    await run(a, 'use', { sku: 'P002' }, throwKey);
    assert.equal((await run(a, 'use', { sku: 'P002' }, throwKey)).inventory.P002, 1);
    await run(b, 'load');
    await run(b, 'preferences', { pranks: false });
    await assert.rejects(run(a, 'gift', { sku: 'P002', recipient: b }), /GIFT_DECLINED/);
    assert.equal((await run(a, 'load')).inventory.P002, 1);
    await run(b, 'preferences', { pranks: true });
    const giftKey = randomUUID();
    await run(a, 'gift', { sku: 'P002', recipient: b }, giftKey);
    const gift = await run(a, 'gift', { sku: 'P002', recipient: b }, giftKey);
    assert.equal(gift.inventory.P002, undefined);
    assert.equal(gift.equipped.hand, undefined);
    assert.equal((await run(b, 'load')).inventory.P002, 1);
    await run(a, 'quick', { sku: 'P042', index: 1 });
    await run(a, 'equip', { sku: 'P042' });
    const placement = { x: 2, z: -1, turn: 1, radius: 0.55 };
    await run(a, 'place', { sku: 'F19', placement });
    await assert.rejects(run(a, 'place', { sku: 'F20', placement }), /PLACEMENT_BLOCKED/);
    const loaded = await run(a, 'load');
    assert.equal(loaded.quick[1], 'P042');
    assert.equal(loaded.equipped.feet, 'P042');
    assert.deepEqual(loaded.furniture.F19, placement);
    assert.deepEqual((await run(a, 'remove', { sku: 'F19' })).furniture, {});
    await db.exec('reset role; set role authenticated');
    await assert.rejects(run(a, 'load'), /permission denied/);
    await assert.rejects(db.exec('select * from public.game_store_state'), /permission denied/);
  } finally {
    await db.close();
  }
});
