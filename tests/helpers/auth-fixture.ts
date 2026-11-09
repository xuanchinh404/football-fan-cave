import { createStoreDatabase } from './store-database';
// Test-only Supabase HTTP stand-in. This is never imported by application code.
// These contracts exercise SDK integration, not real OAuth or email delivery.
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
export async function startAuthFixture(port = 0, store = false) {
  const database = store ? await createStoreDatabase() : undefined;
  const users = new Map<string, any>(),
    profiles = new Map<string, any>();
  function session(email?: string, anonymous = false) {
    let user = [...users.values()].find((u) => email && u.email === email);
    if (!user) {
      user = {
        id: randomUUID(),
        email: email || '',
        is_anonymous: anonymous,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        email_confirmed_at: anonymous ? undefined : new Date().toISOString(),
        app_metadata: { provider: anonymous ? 'anonymous' : 'email' },
        user_metadata: {},
        identities: [],
      };
      users.set(user.id, user);
      profiles.set(user.id, { id: user.id, nickname: null, favorite_team: null, avatar_key: null });
    }
    const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url')}.test-signature`;
    return {
      access_token: token,
      refresh_token: `refresh-${user.id}`,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    };
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS,DELETE');
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    let input: any = {};
    try {
      input = JSON.parse(body || '{}');
    } catch {}
    const url = new URL(req.url!, 'http://test');
    let id: string | undefined;
    try {
      id = JSON.parse(
        Buffer.from(req.headers.authorization!.split(' ')[1].split('.')[1], 'base64url').toString(),
      ).sub;
    } catch {}
    const user = id ? users.get(id) : undefined;
    const send = (data: unknown, status = 200) => {
      res.writeHead(status);
      res.end(JSON.stringify(data));
    };
    if (url.pathname === '/auth/v1/settings') {
      send({ external: { google: false, facebook: false, anonymous_users: true } });
      return;
    }
    if (url.pathname === '/auth/v1/signup') {
      if (input.email) {
        send({ user: session(input.email).user, session: null });
        return;
      }
      send(session(undefined, true));
      return;
    }
    if (url.pathname === '/auth/v1/token') {
      if (input.password === 'wrong-password') {
        send(
          {
            code: 'invalid_credentials',
            error_code: 'invalid_credentials',
            msg: 'Invalid login credentials',
          },
          400,
        );
        return;
      }
      if (url.searchParams.get('grant_type') === 'pkce') {
        send(session('callback@test.invalid'));
        return;
      }
      if (input.refresh_token) {
        const u = users.get(input.refresh_token.replace('refresh-', ''));
        if (u) {
          send(session(u.email, u.is_anonymous));
          return;
        }
      }
      send(session(input.email));
      return;
    }
    if (url.pathname === '/auth/v1/recover') {
      send({});
      return;
    }
    if (url.pathname === '/auth/v1/logout') {
      send({});
      return;
    }
    if (url.pathname === '/rest/v1/rpc/game_store_command' && database
      && req.headers.apikey === 'fixture-store-service-role') {
      const account = users.get(input.p_user);
      if (!account) { send({ message: 'UNKNOWN_ACCOUNT' }, 400); return; }
      try {
        await database.query('insert into auth.users(id,is_anonymous,email_confirmed_at) values ($1,$2,$3) on conflict do nothing',
          [account.id, account.is_anonymous, account.email_confirmed_at ?? null]);
        const state = await database.transaction(async (tx) => {
          await tx.exec('set local role service_role');
          const result = await tx.query<{ state: unknown }>(
            'select public.game_store_command($1,$2,$3,$4,$5) as state',
            [input.p_user, input.p_command, input.p_request, input.p_input, input.p_rules],
          );
          return result.rows[0].state;
        });
        send(state);
      } catch (error) {
        send({ message: (error as Error).message, code: 'P0001' }, 400);
      }
      return;
    }
    if (!user) {
      send({ code: 'bad_jwt', msg: 'Invalid JWT' }, 401);
      return;
    }
    if (url.pathname === '/auth/v1/user') {
      if (req.method === 'PUT') Object.assign(user, input);
      send(user);
      return;
    }
    if (url.pathname === '/rest/v1/profiles') {
      if (req.method === 'PATCH') Object.assign(profiles.get(id!), input);
      send(profiles.get(id!));
      return;
    }
    if (url.pathname === '/rest/v1/rpc/read_wallet') {
      send({
        balance: '0',
        ledger: [],
        purchases: [],
        items: [{ id: 'tomato', name: 'Ném cà chua', price_coins: '20' }],
      });
      return;
    }
    send({ error: 'fixture route not implemented' }, 404);
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
      await database?.close();
    },
    session,
    profiles,
  };
}
