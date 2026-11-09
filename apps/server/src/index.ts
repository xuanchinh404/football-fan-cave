import { barcaPhoto } from './barcaPhotos';
import { latestBarcaMatch } from './barcaMatch';
import { BARCA_SEAT_DIRECTION } from '../../../packages/shared/barcelona/layout';
import { REAL_SEAT_DIRECTION } from '../../../packages/shared/real/layout';
import { CITY_SEAT_DIRECTION } from '../../../packages/shared/city/layout';
import { kopSeatFacing } from '../../../packages/shared/liverpool/layout';
import './env.ts';
import { createStore } from './store';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyToken, profileForToken, adminClient, isLinked } from './auth.ts';
import {
  arrival,
  isOpenCave,
  groundHeight,
  cleanText,
  clearPath,
  EMOJIS,
  near,
  spawn,
  roomKey,
  SPEED,
  RUN_SPEED,
  validMap,
  validProfile,
  walkable,
  type Player,
  type MapId,
} from '../../../packages/shared/world.ts';
import { RateLimiter } from '../../../packages/shared/limits.ts';
import {
  CAVE_GATES,
  type CaveGate,
  gateBlocksMove,
  gateNear,
  gateOpenness,
  updateGate,
  type GateState,
  type GateTiming,
} from '../../../packages/shared/caveGates';
import { grandMetres } from '../../../packages/shared/grandHall';
import {
  fromWorldPoint,
  isConnectedZone,
  caveOffset,
  toWorldPoint,
  zoneAtDoor,
  type ConnectedZone,
} from '../../../packages/shared/caveConnections';
import type { Point } from '../../../packages/shared/world';
const port = Number(process.env.PORT || 3001);
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(
  ',',
);
const server = createServer(async (req, res) => {
  const origin=req.headers.origin;
  if(origin&&origins.includes(origin)) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.url==='/api/purchases' && req.method==='POST'){
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    try {
      const token=req.headers.authorization?.replace(/^Bearer /,'');
      const {user}=await verifyToken(token);
      if(!isLinked(user)){res.writeHead(403);res.end(JSON.stringify({error:'Tài khoản khách chưa được phép mua vật phẩm trả phí.'}));return;}
      if(!adminClient){res.writeHead(503);res.end(JSON.stringify({error:'Backend chưa cấu hình giao dịch Supabase.'}));return;}
      const key=req.headers['idempotency-key'];
      if(typeof key!=='string'||key.length<8||key.length>128)throw new Error('INVALID_REQUEST');
      let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2048)throw new Error('INVALID_REQUEST');}
      let input;try{input=JSON.parse(body);}catch{throw new Error('INVALID_REQUEST');}
      if(!input||typeof input.itemId!=='string'||input.itemId.length>80)throw new Error('INVALID_REQUEST');
      const {data,error}=await adminClient.rpc('purchase_item',{p_user:user.id,p_item:input.itemId,p_key:key});
      if(error){
        const insufficient=error.message.includes('INSUFFICIENT_BALANCE');
        res.writeHead(409);res.end(JSON.stringify({error:insufficient?'Bạn chưa đủ xu để mua vật phẩm.':'Không thể xử lý giao dịch. Kiểm tra vật phẩm hoặc mã yêu cầu và thử lại.'}));return;
      }
      res.end(JSON.stringify({purchaseId:data.id,status:data.status}));
    } catch(e){const message=(e as Error).message;res.writeHead(message==='AUTH_NOT_CONFIGURED'?503:message==='INVALID_REQUEST'?400:401);res.end(JSON.stringify({error:message==='INVALID_REQUEST'?'Yêu cầu không hợp lệ.':'Phiên đăng nhập chưa hợp lệ hoặc đã hết hạn.'}));}
    return;
  }
  const photo = req.url?.match(/^\/api\/barcelona\/photo\/([a-z0-9-]+)$/)?.[1];
  if (req.method === 'GET' && photo) {
    const image = await barcaPhoto(photo, AbortSignal.timeout(4500)).catch(() => undefined);
    if (!image) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': image.type, 'Cache-Control': 'public, max-age=86400' });
    res.end(image.body);
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/api/barcelona/result' && req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.end(JSON.stringify(await latestBarcaMatch()));
    return;
  }
  if (req.url === '/api/health') {
    res.end(JSON.stringify({ status: 'ok', players: players.size, uptime: process.uptime() }));
    return;
  }
  if (req.url === '/api/config') {
    res.end(
      JSON.stringify({
        supportUrl: process.env.SUPPORT_URL || null,
        supportText: process.env.SUPPORT_TEXT || 'Cảm ơn bạn đã đồng hành cùng Hội Vào Hang.',
        sponsor: process.env.SPONSOR_NAME || null,
      }),
    );
    return;
  }
  res.writeHead(404);
  res.end('{"error":"Not found"}');
});
const io = new Server(server, {
  cors: { origin: origins },
  maxHttpBufferSize: 4096,
  pingTimeout: 10000,
});
const players = new Map<string, Player>();
const rooms = new Map<string, Set<string>>();
const lastMove = new Map<string, number>();
const moveBudget = new Map<string, number>();
const roomOf = new Map<string, string>();
const gameStore = createStore(io, players, roomOf, rooms);
const gateTimings = new Map<string, Map<CaveGate['id'], GateTiming>>();
const movement = new RateLimiter(24, 1000),
  chat = new RateLimiter(3, 5000),
  actions = new RateLimiter(3, 4000),
  joins = new RateLimiter(4, 10000);
function detach(id: string) {
  const room = roomOf.get(id);
  if (room) {
    rooms.get(room)?.delete(id);
    if (!rooms.get(room)?.size) {
      rooms.delete(room);
      gateTimings.delete(room);
    }
    io.sockets.sockets.get(id)?.leave(room);
  }
  roomOf.delete(id);
}
function join(id: string, map: MapId, position = spawn(map)) {
  gameStore.resetArena(id);
  const previousRoom = roomOf.get(id);
  detach(id);
  const key = roomKey(isConnectedZone(map) ? 'plaza' : map);
  let instance = 0;
  while ((rooms.get(`${key}:${instance}`)?.size || 0) >= 60) instance++;
  const room = `${key}:${instance}`;
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(id);
  roomOf.set(id, room);
  io.sockets.sockets.get(id)?.join(room);
  const p = players.get(id)!;
  Object.assign(p, position, { map, height: groundHeight(map,position) || 0, moving: false, seated: false, motion: undefined, airOffset: undefined });
  lastMove.set(id, Date.now());
  moveBudget.set(id, 40);
  io.to(id).emit('joined', { player: p, room });
  if (isConnectedZone(map)) {
    const now = Date.now();
    for (const gate of CAVE_GATES) io.to(id).emit('gate:state', gateState(gate.id, gateTimings.get(room)?.get(gate.id), now));
  }
  if (previousRoom && previousRoom !== room) roomCounts(previousRoom);
  roomCounts(room);
}
function gateState(id: CaveGate['id'], timing: GateTiming | undefined, now: number): GateState {
  return {
    id, now,
    timing: timing && { openedAt: timing.openedAt, closeAt: Number.isFinite(timing.closeAt) ? timing.closeAt : null },
  };
}
function refreshGates(room: string, now: number) {
  const timings = gateTimings.get(room) ?? new Map<CaveGate['id'], GateTiming>();
  const feet = [...(rooms.get(room) ?? [])].map((id) => {
    const player = players.get(id)!;
    return { ...grandMetres(toWorldPoint(player.map, player)), height: (player.height ?? 0) + caveOffset(player.map)[1] };
  });
  for (const gate of CAVE_GATES) {
    const previous = timings.get(gate.id);
    const next = updateGate(previous, feet.some((p) => gateNear(gate, p)), now);
    if (next === previous) continue;
    if (next) timings.set(gate.id, next);
    else timings.delete(gate.id);
    io.to(room).emit('gate:state', gateState(gate.id, next, now));
  }
  if (timings.size) gateTimings.set(room, timings);
  else gateTimings.delete(room);
}
function roomCounts(room?: string) {
  for (const [key, ids] of rooms) {
    if (room && room !== key) continue;
    const counts = new Map<MapId, number>();
    for (const id of ids) {
      const map = players.get(id)!.map;
      counts.set(map, (counts.get(map) ?? 0) + 1);
    }
    for (const id of ids) io.to(id).emit('room-count', { room: key, count: counts.get(players.get(id)!.map) });
  }
}

function connectedPath(zone: ConnectedZone, a: Point, b: Point) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8));
  let height = (groundHeight(zone, fromWorldPoint(zone, a)) ?? 0) + caveOffset(zone)[1];
  let previousZ = grandMetres(a).z;
  let point = fromWorldPoint(zone, a);
  for (let i = 1; i <= steps; i++) {
    const world = { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps };
    const { x, z } = grandMetres(world);
    const nextZone = zoneAtDoor(zone, x, z, height);
    if (nextZone !== zone) {
      const gate = CAVE_GATES.find((item) => item.id === (zone === 'plaza' ? nextZone : zone))!;
      // A move from beside the ramp cannot enter the cave behind its gate.
      const wasOutside = previousZ >= gate.origin[2];
      if (wasOutside === (z >= gate.origin[2])) return;
      zone = nextZone;
    }
    previousZ = z;
    point = fromWorldPoint(zone, world);
    const ground = groundHeight(zone, point);
    if (ground === undefined || !walkable(zone, point.x, point.y)) return;
    const nextHeight = ground + caveOffset(zone)[1];
    if (Math.abs(nextHeight - height) > 0.25) return;
    height = nextHeight;
  }
  return { zone, point, surface: height - caveOffset(zone)[1] };
}
function counts() {
  roomCounts();
  io.emit('online', players.size);
}
// All sockets, including anonymous Supabase users, require a verified access token.
io.use(async(socket,next)=>{
 try{Object.assign(socket.data,await verifyToken(socket.handshake.auth?.accessToken));next();}
 catch{next(new Error('Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.'));}
});
io.on('connection', (socket) => {
  gameStore.register(socket);
  const expiryCheck=setInterval(()=>{if(Date.now()>=socket.data.expiresAt){socket.emit('auth:expired');socket.disconnect(true);}},1000);
  socket.on('auth:refresh',async(raw)=>{
   try{const verified=await verifyToken(raw?.accessToken);if(verified.user.id!==socket.data.user.id)throw new Error('IDENTITY_CHANGED');Object.assign(socket.data,verified);}
   catch{socket.emit('auth:expired');socket.disconnect(true);}
  });
  socket.use(([event],next)=>{if(event!=='auth:refresh'&&Date.now()>=socket.data.expiresAt){socket.emit('auth:expired');socket.disconnect(true);return;}next();});
  socket.once('disconnect',()=>clearInterval(expiryCheck));
  let joining=false;
  socket.on('join', async (_raw: unknown) => {
    if (!joins.allow(socket.id)) return;
    if(joining||players.has(socket.id))return;
    joining=true;
    let profile;
    try{profile=await profileForToken(socket.data.token,socket.data.user.id);}
    catch{socket.emit('notice','Chưa thể tải hồ sơ. Hãy kiểm tra kết nối và hoàn tất hồ sơ.');return;}
    finally{joining=false;}
    if(!socket.connected||players.has(socket.id)||Date.now()>=socket.data.expiresAt)return;
    if (players.has(socket.id)) return;
    const base = profile.nickname;
    let suffix = 1;
    while (
      [...players.values()].some(
        (p) => p.nickname.toLocaleLowerCase() === profile.nickname.toLocaleLowerCase(),
      )
    ) {
      suffix++;
      profile.nickname = base.slice(0, 16) + ' #' + suffix;
    }
    players.set(socket.id, {
      ...profile,
      id: socket.id,
      ...spawn('plaza'),
      map: 'plaza',
      direction: 0,
      moving: false,
    });
    join(socket.id, 'plaza');
    void gameStore.joined(socket);
    counts();
  });
  socket.on('travel', (target: unknown) => {
    const p = players.get(socket.id);
    if (!p || !validMap(target) || !actions.allow(socket.id)) return;
    if (isConnectedZone(p.map) && isConnectedZone(target)) {
      socket.emit('notice', 'Đến gần cổng và đi qua đường hầm để di chuyển.');
      return;
    }
    const portal = near(p.map, p);
    if (portal?.kind !== 'portal' || portal.target !== target) {
      socket.emit('notice', 'Hãy đến gần cổng hang để di chuyển.');
      return;
    }
    if(p.map==='plaza' && !isOpenCave(target)) { socket.emit('notice','Nội thất hang này sắp ra mắt. Bạn có thể khám phá sân trước cổng.');return; }
    join(
      socket.id,
      target,
      arrival(p.map, target),
    );
  });
  socket.on('interact', (id: unknown) => {
    const p = players.get(socket.id);
    if (!p || !actions.allow(socket.id)) return;
    const item = near(p.map, p);
    if (!item || item.id !== id) return;
    if (
      item.kind === 'passage' &&
      item.destination &&
      walkable(p.map, item.destination.x, item.destination.y)
    ) {
      Object.assign(p, item.destination, { moving: false, seated: false, motion: undefined, airOffset: undefined });
      moveBudget.set(socket.id, 40);
      lastMove.set(socket.id, Date.now());
      socket.emit('relocate', { map: p.map, x: p.x, y: p.y });
    } else if (item.kind === 'seat') {
      if (!p.seated) {
        const reachable = clearPath(p.map, p, item);
        if (!reachable && (p.map === 'liverpool' || p.map === 'city' || p.map === 'real' || p.map === 'barcelona')) return;
        if ((p.map === 'city' || p.map === 'real' || p.map === 'barcelona') && [...(rooms.get(roomOf.get(socket.id)!) ?? [])].some((id) => {
          const other = players.get(id)!;
          return other.id !== p.id && other.map === p.map && other.seated && other.x === item.x && other.y === item.y;
        })) {
          socket.emit('notice', 'Chỗ ngồi này đang có người. This seat is occupied.');
          return;
        }
        if (reachable) Object.assign(p, { x: item.x, y: item.y });
        if (p.map === 'liverpool') p.direction = kopSeatFacing(item);
        if (p.map === 'barcelona') p.direction = BARCA_SEAT_DIRECTION;
        if (p.map === 'city') p.direction = CITY_SEAT_DIRECTION;
        if (p.map === 'real') p.direction = REAL_SEAT_DIRECTION;
      }
      p.seated = !p.seated;
      p.moving = false;
      p.motion = undefined;
      p.airOffset = undefined;
      socket.emit('seated', { seated: p.seated, x: p.x, y: p.y, direction: p.direction });
    }
  });
  socket.on('stand', () => {
    const p = players.get(socket.id);
    if (p) p.seated = false;
  });
  socket.on('move', (raw: any) => {
    const p = players.get(socket.id);
    if (
      !p ||
      p.seated ||
      !movement.allow(socket.id) ||
      !raw ||
      !Number.isFinite(raw.x) ||
      !Number.isFinite(raw.y)
    )
      return;
    const now = Date.now(),
      elapsed = Math.min(0.5, (now - (lastMove.get(socket.id) || now)) / 1000);
    const room = roomOf.get(socket.id)!;
    const connected = isConnectedZone(p.map);
    const previous = toWorldPoint(p.map, p);
    const distance = Math.hypot(raw.x - previous.x, raw.y - previous.y),
      budget = (moveBudget.get(socket.id) || 0) + RUN_SPEED * elapsed;
    const path = distance <= budget + 0.5 && (
      isConnectedZone(p.map)
        ? connectedPath(p.map, previous, raw)
        : clearPath(p.map, p, raw)
          ? { zone: p.map, point: raw, surface: groundHeight(p.map, raw) }
          : undefined
    );
    if (!path || path.surface === undefined ||
      (raw.height !== undefined && (!Number.isFinite(raw.height) || Math.abs(raw.height - path.surface) > 0.45)) ||
      (connected && CAVE_GATES.some((gate) =>
        Math.abs((p.height ?? 0) + caveOffset(p.map)[1] - gate.origin[1]) < 1.4 &&
        gateBlocksMove(gate, grandMetres(previous), grandMetres(raw),
          gateOpenness(gateTimings.get(room)?.get(gate.id), now))))) {
      socket.emit('correct', {
        x: p.x, y: p.y, height: p.height || 0,
        ...(connected && raw.zone && raw.zone !== p.map ? { map: p.map } : {}),
      });
      return;
    }
    // Keep a bounded burst allowance without discarding movement earned during a slow frame.
    moveBudget.set(socket.id, Math.min(80, Math.max(0, budget - distance)));
    const changedZone = p.map !== path.zone;
    p.map = path.zone;
    p.x = path.point.x;
    p.y = path.point.y;
    p.height = path.surface;
    gameStore.move(p);
    if (changedZone) {
      gameStore.resetArena(socket.id);
      roomCounts(room);
    }
    p.direction = Number.isFinite(raw.direction) ? raw.direction : 0;
    p.moving = raw.moving === true;
    p.motion = !p.seated && raw.motion === 'Jump'
      ? 'Jump'
      : p.moving && raw.motion === 'Run' ? 'Run' : undefined;
    p.airOffset = p.motion === 'Jump' && Number.isFinite(raw.airOffset)
      ? Math.max(0, Math.min(1.5, raw.airOffset)) : undefined;
    lastMove.set(socket.id, now);
  });
  socket.on('chat', (raw: unknown) => {
    const p = players.get(socket.id);
    if (!p) return;
    if (!chat.allow(socket.id)) {
      socket.emit('notice', 'Chậm một nhịp nhé. Đợi vài giây rồi gửi tiếp.');
      return;
    }
    const channel =
      typeof raw === 'object' && raw !== null && (raw as any).channel === 'nearby'
        ? 'nearby'
        : 'room';
    const value = cleanText(typeof raw === 'object' && raw !== null ? (raw as any).text : raw);
    if (!value) return;
    if (/(.)\1{14}|https?:\/\//i.test(value)) {
      socket.emit('notice', 'Tin nhắn có dấu hiệu spam hoặc chứa đường dẫn.');
      return;
    }
    const recipients = [...(rooms.get(roomOf.get(socket.id)!) || [])].filter(
      (id) => {
        const recipient = players.get(id)!;
        return recipient.map === p.map &&
          (channel === 'room' || Math.hypot(recipient.x - p.x, recipient.y - p.y) < 600);
      },
    );
    io.to(recipients).emit('chat', {
      id: crypto.randomUUID(),
      playerId: p.id,
      nickname: p.nickname,
      team: p.team,
      text: value,
      map: p.map,
      channel,
      time: Date.now(),
    });
  });
  socket.on('emoji', (value: unknown) => {
    if (players.has(socket.id) && EMOJIS.includes(value as string) && actions.allow(socket.id))
      io.to(roomOf.get(socket.id)!).emit('emoji', { id: socket.id, value });
  });
  socket.on('report', (raw: any) => {
    if (!players.has(socket.id) || !actions.allow(socket.id)) return;
    console.info(
      JSON.stringify({
        type: 'report',
        reporter: socket.id,
        messageId: cleanText(raw?.messageId, 80),
        reason: cleanText(raw?.reason, 180),
        at: Date.now(),
      }),
    );
    socket.emit(
      'notice',
      'Đã ghi nhận báo cáo tạm thời trên máy chủ. Hiện chưa có đội kiểm duyệt trực tuyến.',
    );
  });
  socket.on('disconnect', () => {
    players.delete(socket.id);
    detach(socket.id);
    lastMove.delete(socket.id);
    moveBudget.delete(socket.id);
    [movement, chat, actions, joins].forEach((l) => l.delete(socket.id));
    counts();
  });
});
const timer = setInterval(() => {
  const now = Date.now();
  for (const room of rooms.keys()) {
    if (room.startsWith(`${roomKey('plaza')}:`)) refreshGates(room, now);
  }
  for (const [id, p] of players) {
    const ids = rooms.get(roomOf.get(id)!);
    const here = toWorldPoint(p.map, p);
    const visible = [...(ids || [])]
      .map((i) => players.get(i)!)
      .filter((q) => {
        if (!q) return false;
        const there = toWorldPoint(q.map, q);
        return Math.hypot(there.x - here.x, there.y - here.y) < 1050;
      });
    io.to(id).emit('snapshot', visible);
  }
}, 100);
server.listen(port, '0.0.0.0', () =>
  console.log(`Hội Vào Hang realtime • http://localhost:${port}`),
);
function stop() {
  clearInterval(timer);
  io.close();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
