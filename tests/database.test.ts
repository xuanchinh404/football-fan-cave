import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const a = '11111111-1111-4111-8111-111111111111',
  b = '22222222-2222-4222-8222-222222222222',
  guest = '33333333-3333-4333-8333-333333333333';
async function database() {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean not null default false,email_confirmed_at timestamptz,phone_confirmed_at timestamptz);create table auth.identities(user_id uuid,provider text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;`,
  );
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261104133346_authentication_wallets.sql', import.meta.url),
      'utf8',
    ),
  );
  await db.exec(
    `insert into auth.users values ('${a}',false,now(),null),('${b}',false,now(),null),('${guest}',true,null,null);`,
  );
  return db;
}
test('migration: ownership RLS, column grants, duplicate profiles/wallets, immutable ledger and BIGINT accuracy', async () => {
  const db = await database();
  try {
    assert.equal((await db.query('select * from public.profiles')).rows.length, 3);
    assert.equal((await db.query('select * from public.wallets')).rows.length, 3);
    await assert.rejects(
      db.exec(`insert into public.wallets(user_id) values('${a}')`),
      /duplicate/,
    );
    await assert.rejects(
      db.exec(`update public.wallets set balance=-1 where user_id='${a}'`),
      /check constraint/,
    );
    await db.exec(
      `update public.wallets set balance=9007199254740993 where user_id='${a}';set role authenticated;set request.jwt.claim.sub='${a}';`,
    );
    assert.equal((await db.query('select * from public.wallets')).rows.length, 1);
    assert.equal(
      (await db.query(`select * from public.wallets where user_id='${b}'`)).rows.length,
      0,
    );
    assert.equal(
      (await db.query<{ read_wallet: { balance: string } }>('select public.read_wallet()')).rows[0]
        .read_wallet.balance,
      '9007199254740993',
    );
    await db.exec(
      `update public.profiles set nickname='Fan A',favorite_team='common',avatar_key=0 where id='${a}'`,
    );
    assert.equal(
      (await db.query(`update public.profiles set nickname='Stolen' where id='${b}' returning id`))
        .rows.length,
      0,
    );
    for (const sql of [
      `update public.profiles set id='${b}' where id='${a}'`,
      `update public.wallets set balance=999999`,
      `insert into public.wallets(user_id) values('${a}')`,
      `delete from public.wallet_ledger`,
      `update public.wallet_ledger set delta=999`,
      `update public.payment_orders set status='paid'`,
      `select public.purchase_item('${a}','tomato','test-key')`,
      `select public.settle_payment(gen_random_uuid(),'test','ref',1)`,
    ])
      await assert.rejects(db.exec(sql), /permission denied/);
    await db.exec('reset role;set role anon;');
    await assert.rejects(db.exec('select * from public.wallets'), /permission denied/);
  } finally {
    await db.close();
  }
});
test('transactions: paid order replay, mismatches, guest restrictions, price authority and purchase replay', async () => {
  const db = await database();
  try {
    const order = '44444444-4444-4444-8444-444444444444';
    await db.exec(
      `insert into public.payment_orders(id,user_id,amount_vnd,coin_amount,provider) values('${order}','${a}',10000,100,'test');set role service_role;`,
    );
    await db.exec(
      `select public.settle_payment('${order}','test','receipt-1',10000);select public.settle_payment('${order}','test','receipt-1',10000);`,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>('select balance from public.wallets where user_id=$1', [
          a,
        ])
      ).rows[0].balance,
      100,
    );
    await assert.rejects(
      db.exec(`select public.settle_payment('${order}','test','receipt-other',10000)`),
      /PAYMENT_MISMATCH/,
    );
    await assert.rejects(
      db.exec(`select public.settle_payment('${order}','test','receipt-1',20000)`),
      /PAYMENT_MISMATCH/,
    );
    await assert.rejects(
      db.exec(`select public.purchase_item('${guest}','tomato','guest-key')`),
      /LINKED_ACCOUNT_REQUIRED/,
    );
    await db.exec(
      `select public.purchase_item('${a}','tomato','purchase-key-1');select public.purchase_item('${a}','tomato','purchase-key-1');`,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>('select balance from public.wallets where user_id=$1', [
          a,
        ])
      ).rows[0].balance,
      80,
    );
    assert.equal((await db.query('select * from public.purchases')).rows.length, 1);
    assert.equal((await db.query('select * from public.wallet_ledger')).rows.length, 2);
    await assert.rejects(
      db.exec(`select public.purchase_item('${a}','banner','purchase-key-1')`),
      /IDEMPOTENCY_CONFLICT/,
    );
    await assert.rejects(
      db.exec(`select public.purchase_item('${a}','cave-pass','purchase-key-2')`),
      /INSUFFICIENT_BALANCE/,
    );
    assert.equal((await db.query('select * from public.purchases')).rows.length, 1);
    // Failure after debit must roll back the debit and purchase together.
    await db.exec(
      `insert into public.wallet_ledger(user_id,delta,reason,reference_id,idempotency_key) values('${a}',1,'fixture',gen_random_uuid(),'fixture');`,
    );
    await db.exec('reset role;');
    await db.exec(
      `create function private.reject_ledger() returns trigger language plpgsql as $$begin raise exception 'TEST_LEDGER_FAILURE';end$$;create trigger reject_ledger before insert on public.wallet_ledger for each row execute function private.reject_ledger();set role service_role;`,
    );
    await assert.rejects(
      db.exec(`select public.purchase_item('${a}','tomato','purchase-key-rollback')`),
      /TEST_LEDGER_FAILURE/,
    );
    assert.equal(
      (
        await db.query<{ balance: number }>('select balance from public.wallets where user_id=$1', [
          a,
        ])
      ).rows[0].balance,
      80,
    );
    assert.equal((await db.query('select * from public.purchases')).rows.length, 1);
  } finally {
    await db.close();
  }
});
