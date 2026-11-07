import {CAVES} from '../../../packages/shared/grandHall.ts';
import './env.ts';
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
  res.setHeader('Content-Type', 'application/json');
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
const movement = new RateLimiter(24, 1000),
  chat = new RateLimiter(3, 5000),
  actions = new RateLimiter(3, 4000),
  joins = new RateLimiter(4, 10000);
function detach(id: string) {
  const room = roomOf.get(id);
  if (room) {
    rooms.get(room)?.delete(id);
    if (!rooms.get(room)?.size) rooms.delete(room);
    io.sockets.sockets.get(id)?.leave(room);
  }
  roomOf.delete(id);
}
function join(id: string, map: MapId, position = spawn(map)) {
  detach(id);
  let instance = 0;
  while ((rooms.get(`${roomKey(map)}:${instance}`)?.size || 0) >= 60) instance++;
  const room = `${roomKey(map)}:${instance}`;
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(id);
  roomOf.set(id, room);
  io.sockets.sockets.get(id)?.join(room);
  const p = players.get(id)!;
  Object.assign(p, position, { map, height: groundHeight(map,position) || 0, moving: false, seated: false });
  lastMove.set(id, Date.now());
  moveBudget.set(id, 40);
  io.to(id).emit('joined', { player: p, room });
  roomCounts();
}
function roomCounts() {
  for (const [room, ids] of rooms) io.to(room).emit('room-count', { room, count: ids.size });
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
    counts();
  });
  socket.on('travel', (target: unknown) => {
    const p = players.get(socket.id);
    if (!p || !validMap(target) || !actions.allow(socket.id)) return;
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
      Object.assign(p, item.destination, { moving: false, seated: false });
      moveBudget.set(socket.id, 40);
      lastMove.set(socket.id, Date.now());
      socket.emit('relocate', { map: p.map, x: p.x, y: p.y });
    } else if (item.kind === 'seat') {
      if (!p.seated && clearPath(p.map, p, item)) Object.assign(p, { x: item.x, y: item.y });
      p.seated = !p.seated;
      p.moving = false;
      socket.emit('seated', { seated: p.seated, x: p.x, y: p.y });
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
      !movement.allow(socket.id) ||
      !raw ||
      !Number.isFinite(raw.x) ||
      !Number.isFinite(raw.y)
    )
      return;
    const now = Date.now(),
      elapsed = Math.min(0.5, (now - (lastMove.get(socket.id) || now)) / 1000);
    const distance = Math.hypot(raw.x - p.x, raw.y - p.y),
      budget = Math.min(80, (moveBudget.get(socket.id) || 0) + RUN_SPEED * elapsed);
    const surface=groundHeight(p.map,raw);
    const badHeight=surface===undefined || (raw.height!==undefined && (!Number.isFinite(raw.height) || Math.abs(raw.height-surface)>.45));
    if (distance > budget + 0.5 || !clearPath(p.map, p, raw) || badHeight) {
      socket.emit('correct', { x: p.x, y: p.y, height:p.height || 0 });
      return;
    }
    moveBudget.set(socket.id, Math.max(0, budget - distance));
    if (distance > 1) p.seated = false;
    p.x = raw.x;
    p.y = raw.y;
    p.height=surface;
    p.direction = Number.isFinite(raw.direction) ? raw.direction : 0;
    p.moving = raw.moving === true;
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
      (id) =>
        channel === 'room' || Math.hypot(players.get(id)!.x - p.x, players.get(id)!.y - p.y) < 600,
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
  for (const [id, p] of players) {
    const ids = rooms.get(roomOf.get(id)!);
    const visible = [...(ids || [])]
      .map((i) => players.get(i)!)
      .filter((q) => q && (q.id === id || Math.hypot(q.x - p.x, q.y - p.y) < 1050));
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
