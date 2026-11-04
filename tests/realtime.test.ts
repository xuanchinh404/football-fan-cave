import { SPAWN } from '../packages/shared/world';
import { test, before, after } from 'node:test';
import { startAuthFixture } from './helpers/auth-fixture';
import { startTestBackend } from './helpers/backend';
import type { ChildProcess } from 'node:child_process';
import { spawn } from '../packages/shared/world';
import assert from 'node:assert/strict';
import { io, type Socket } from 'socket.io-client';
const url = 'http://127.0.0.1:3102';
let fixture: Awaited<ReturnType<typeof startAuthFixture>>, backend: ChildProcess;
before(async () => {
  fixture = await startAuthFixture();
  backend = await startTestBackend(fixture.url, 3102);
});
after(async () => {
  backend?.kill();
  await fixture?.close();
});
function event(socket: Socket, name: string) {
  return new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout: ${name}`)), 5000);
    socket.once(name, (value) => {
      clearTimeout(timeout);
      resolve(value);
    });
  });
}
async function guest(name: string) {
  const session = fixture.session(`${name}@test.invalid`, true);
  fixture.profiles.set(session.user.id, {
    id: session.user.id,
    nickname: name,
    favorite_team: 'united',
    avatar_key: 0,
  });
  const s = io(url, {
    transports: ['websocket'],
    forceNew: true,
    auth: { accessToken: session.access_token },
  });
  await event(s, 'connect');
  const joined = event(s, 'joined');
  s.emit('join', { nickname: name, team: 'united', avatar: 0 });
  await joined;
  return s;
}
test('two guests see each other, exchange server-attributed chat, and reconnect', async () => {
  const a = await guest('Test A'),
    b = await guest('Test B');
  try {
    const players = await event(a, 'snapshot');
    assert(players.some((p: any) => p.id === b.id));
    const chat = event(b, 'chat');
    a.emit('chat', 'Chào anh em ⚽');
    const m = await chat;
    assert.equal(m.nickname, 'Test A');
    assert.equal(m.playerId, a.id);
    assert.equal(m.text, 'Chào anh em ⚽');
    const notice = event(a, 'notice');
    a.emit('travel', 'united');
    assert.match(await notice, /gần cổng/);
    const oldId = b.id;
    b.disconnect();
    b.connect();
    await event(b, 'connect');
    const joined = event(b, 'joined');
    b.emit('join', { nickname: 'Test B', team: 'city', avatar: 1 });
    const next = await joined;
    assert.notEqual(next.player.id, oldId);
    assert.equal(next.player.map, 'plaza');
  } finally {
    a.disconnect();
    b.disconnect();
  }
});
test('server rejects teleport and chat flood', async () => {
  const a = await guest('Guard Test');
  try {
    const corrected = event(a, 'correct');
    a.emit('move', { x: 1280, y: 530 });
    assert.deepEqual(await corrected, { ...SPAWN, height: 0 });
    const limited = event(a, 'notice');
    for (let i = 0; i < 6; i++) a.emit('chat', `Test ${i}`);
    assert.match(await limited, /Chậm/);
  } finally {
    a.disconnect();
  }
});

test('unauthenticated sockets and forged tokens are rejected', async () => {
  for (const accessToken of [undefined, 'forged-token']) {
    const s = io(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      auth: { accessToken },
    });
    try {
      const error = await event(s, 'connect_error');
      assert.match(error.message, /đăng nhập/);
    } finally {
      s.disconnect();
    }
  }
});
test('join ignores spoofed identity and nickname supplied by browser', async () => {
  const s = await guest('Server Profile');
  try {
    const result = event(s, 'chat');
    s.emit('chat', { text: 'Verified', user_id: 'attacker', nickname: 'Impostor' });
    assert.equal((await result).nickname, 'Server Profile');
  } finally {
    s.disconnect();
  }
});
test('purchase endpoint requires verified identity and denies guests', async () => {
  const a = await fetch(`${url}/api/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: 'tomato' }),
  });
  assert.equal(a.status, 401);
  const session = fixture.session(undefined, true);
  const b = await fetch(`${url}/api/purchases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'request-1',
    },
    body: JSON.stringify({ itemId: 'tomato', userId: 'victim', price: 0 }),
  });
  assert.equal(b.status, 403);
});

test('verified server identity and height cannot be forged by frontend', async () => {
  const a = await guest('Height Guard');
  try {
    const corrected = event(a, 'correct');
    a.emit('move', { ...SPAWN, height: 15 });
    assert.deepEqual(await corrected, { ...SPAWN, height: 0 });
  } finally {
    a.disconnect();
  }
  const bad = io(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  try {
    const error = await event(bad, 'connect_error');
    assert.match(error.message, /đăng nhập/);
  } finally {
    bad.disconnect();
  }
});

test('expired JWTs are rejected even when upstream fixture returns a user',async()=>{
 const session=fixture.session('expired@test.invalid');
 const [header,payload,signature]=session.access_token.split('.');
 const claims=JSON.parse(Buffer.from(payload,'base64url').toString());claims.exp=Math.floor(Date.now()/1000)-1;
 const token=`${header}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${signature}`;
 const s=io(url,{transports:['websocket'],forceNew:true,reconnection:false,auth:{accessToken:token}});
 try{assert.match((await event(s,'connect_error')).message,/đăng nhập/);}finally{s.disconnect();}
});
test('socket identity cannot change during token refresh',async()=>{
 const s=await guest('Refresh Owner');try{const disconnected=event(s,'disconnect');s.emit('auth:refresh',{accessToken:fixture.session('other@test.invalid').access_token});assert.equal(await disconnected,'io server disconnect');}finally{s.disconnect();}
});
