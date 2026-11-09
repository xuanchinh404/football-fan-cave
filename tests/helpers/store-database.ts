import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';

export async function createStoreDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, is_anonymous boolean not null default false,
      email_confirmed_at timestamptz, phone_confirmed_at timestamptz);
    create table auth.identities(user_id uuid, provider text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  const filenames = (await readdir(migrations)).sort().filter((name) => name.endsWith('.sql'));
  for (const filename of filenames)
    await db.exec(await readFile(new URL(filename, migrations), 'utf8'));
  return db;
}
