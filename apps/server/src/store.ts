import type { Server, Socket } from 'socket.io';
import { adminClient, isLinked } from './auth';
import { grandMetres } from '../../../packages/shared/grandHall';
import type { Player } from '../../../packages/shared/world';
import { RateLimiter } from '../../../packages/shared/limits';
import { dailyItems, product, starter, type Product } from '../../../packages/shared/store/catalog';
import {
  flightLifetime, flightPoint, inArena, surfaceAt, throwVelocity, type Flight, type Impact,
} from '../../../packages/shared/store/physics';
import { validPlacement, type StoreRequest, type StoreResponse, type StoreState } from '../../../packages/shared/store/state';

const timezone = process.env.STORE_TIMEZONE || 'Asia/Ho_Chi_Minh';
new Intl.DateTimeFormat('en', { timeZone: timezone });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dbErrors = new Set([
  'ALREADY_CLAIMED', 'ALREADY_OWNED', 'INSUFFICIENT_BALANCE', 'NOT_OWNED', 'NOT_EQUIPPED',
  'REQUEST_CONFLICT', 'INVENTORY_LIMIT', 'RECIPIENT_LIMIT', 'RECIPIENT_UNAVAILABLE',
  'GIFT_DECLINED', 'ITEM_PLACED', 'ROOM_FULL', 'PLACEMENT_BLOCKED',
]);

export async function storeTransaction(
  user: string, command: string, id: string | null, input: Record<string, unknown>, item?: Product,
): Promise<StoreState> {
  if (!adminClient) throw new Error('UNAVAILABLE');
  const { data, error } = await adminClient.rpc('game_store_command', {
    p_user: user, p_command: command, p_request: id, p_input: input,
    p_rules: {
      timezone, starter, daily: dailyItems, slot: item?.slot, price: item?.price, currency: item?.currency,
      maxOrder: item?.maxOrder, consumable: item?.consumable, stackable: item?.stackable,
      action: item?.action, prank: item?.category === 'pranks' || item?.category === 'throwables',
      contents: item?.contents,
      stackableGrants: Object.keys(item?.contents ?? (item ? { [item.id]: 1 } : {})).filter((sku) => product(sku)?.stackable),
    },
  });
  if (error) {
    if (dbErrors.has(error.message)) throw new Error(error.message);
    console.error('Game store RPC failed', error.code, error.message);
    throw new Error('UNAVAILABLE');
  }
  return data as StoreState;
}

export function createStore(io: Server, players: Map<string, Player>, roomOf: Map<string, string>, rooms: Map<string, Set<string>>) {
  const optedIn = new Set<string>();
  const flights = new Map<string, { flight: Flight; room: string; start: number; last: number }>();
  const busy = new Set<string>();
  const requests = new RateLimiter(8, 5000);
  const actions = new RateLimiter(1, 850);
  const gifts = new RateLimiter(1, 4000);
  const rateExpiry = new Map<string, ReturnType<typeof setTimeout>>();
  const plazaRecipients = (room: string) => [...(rooms.get(room) ?? [])].filter((id) => players.get(id)?.map === 'plaza');
  const accountSockets = (user: string) => [...io.sockets.sockets.values()].filter((s) => s.data.user?.id === user);
  function sendState(user: string, state: StoreState) {
    for (const peer of accountSockets(user)) {
      const player = players.get(peer.id);
      if (player) player.loadout = state.equipped;
      peer.emit('store:state', state);
    }
  }

  const tick = setInterval(() => {
    const now = Date.now();
    for (const [id, active] of flights) {
      const { flight, room, start } = active;
      if (now < start) continue;
      const end = Math.min(flightLifetime, (now - start) / 1000);
      let impact: Impact | undefined;
      const candidates = plazaRecipients(room).filter((id) => id !== flight.owner && optedIn.has(id));
      for (let age = active.last; age <= end; age += 1 / 100) {
        active.last = age + 1 / 100;
        const point = flightPoint(flight, age);
        const [x, y, z] = point;
        let surface = surfaceAt(point);
        const target = !surface && inArena(x, z) ? candidates.find((id) => {
          const p = players.get(id)!;
          const q = grandMetres(p);
          const h = (p.height ?? 0) + (p.airOffset ?? 0);
          return inArena(q.x, q.z) && y > h + 0.15 && y < h + 2.05 && Math.hypot(x - q.x, z - q.z) < 0.59;
        }) : undefined;
        if (target) surface = 'avatar';
        if (surface) {
          impact = { id, sku: flight.sku, owner: flight.owner, point, target, surface };
          break;
        }
      }
      if (impact) io.to(plazaRecipients(room)).emit('store:impact', impact);
      if (impact || end >= flightLifetime) flights.delete(id);
    }
  }, 25);
  tick.unref();

  return {
    async joined(socket: Socket) {
      if (!adminClient) return;
      try {
        const state = await storeTransaction(socket.data.user.id, 'load', null, {});
        if (socket.connected) sendState(socket.data.user.id, state);
      } catch {
        if (socket.connected) socket.emit('store:unavailable');
      }
    },
    resetArena(id: string) {
      optedIn.delete(id);
    },
    register(socket: Socket) {
      socket.once('disconnect', () => {
        optedIn.delete(socket.id);
      });
      socket.on('store:command', async (raw: StoreRequest, reply: (response: StoreResponse) => void) => {
        if (typeof reply !== 'function') return;
        const player = players.get(socket.id);
        const room = roomOf.get(socket.id);
        if (!player || !room || !raw || typeof raw !== 'object') return reply({ error: 'INVALID_REQUEST' });
        const user: string = socket.data.user.id;
        clearTimeout(rateExpiry.get(user));
        const expiry = setTimeout(() => {
          [requests, actions, gifts].forEach((limit) => limit.delete(user));
          rateExpiry.delete(user);
        }, 60000);
        expiry.unref();
        rateExpiry.set(user, expiry);
        if (!requests.allow(user) || busy.has(user)) return reply({ error: 'SLOW_DOWN' });
        if (raw.command === 'recipients') {
          const listed = new Set([user]);
          const recipients = [...players.values()].flatMap((p) => {
            const peer = io.sockets.sockets.get(p.id);
            if (!peer || listed.has(peer.data.user.id) || !p.loadout) return [];
            listed.add(peer.data.user.id);
            return [{ id: p.id, nickname: p.nickname }];
          });
          return reply({ recipients: recipients.slice(0, 100) });
        }
        if (raw.command === 'arena') {
          const pos = grandMetres(player);
          if (raw.optIn === true && (player.map !== 'plaza' || !inArena(pos.x, pos.z))) {
            return reply({ error: 'ARENA_ONLY' });
          }
          if (raw.optIn === true) optedIn.add(socket.id);
          else optedIn.delete(socket.id);
          return reply({ optedIn: optedIn.has(socket.id) });
        }
        if (raw.command !== 'load' && (typeof raw.id !== 'string' || !uuid.test(raw.id))) {
          return reply({ error: 'INVALID_REQUEST' });
        }

        const item = product(raw.sku);
        const input: Record<string, unknown> = {};
        let command: string = raw.command;
        let flight: Flight | undefined;
        let receiver: Socket | undefined;
        if (item) input.sku = item.id;
        switch (raw.command) {
          case 'load':
          case 'claim':
            break;
          case 'buy':
            if (!item?.available || !item.currency || !Number.isInteger(raw.quantity)
              || raw.quantity! < 1 || raw.quantity! > item.maxOrder) return reply({ error: 'INVALID_REQUEST' });
            if (!isLinked(socket.data.user)) return reply({ error: 'LINK_REQUIRED' });
            input.quantity = raw.quantity;
            break;
          case 'equip':
            if (!item?.slot || !item.available) return reply({ error: 'INVALID_REQUEST' });
            input.unequip = raw.unequip === true;
            break;
          case 'quick':
            if ((!item && raw.sku !== null) || !Number.isInteger(raw.index) || raw.index! < 1 || raw.index! > 5
              || item?.action === 'display') return reply({ error: 'INVALID_REQUEST' });
            input.index = raw.index;
            break;
          case 'preferences':
            if (!raw.preferences || typeof raw.preferences !== 'object') return reply({ error: 'INVALID_REQUEST' });
            for (const key of ['pranks', 'effects'] as const) {
              if (typeof raw.preferences[key] === 'boolean') input[key] = raw.preferences[key];
            }
            break;
          case 'gift':
            if (!item?.giftable || typeof raw.recipient !== 'string') return reply({ error: 'INVALID_REQUEST' });
            receiver = io.sockets.sockets.get(raw.recipient);
            if (!receiver?.connected || !players.has(receiver.id) || receiver.data.user.id === user) {
              return reply({ error: 'RECIPIENT_UNAVAILABLE' });
            }
            if (!gifts.allow(user)) return reply({ error: 'SLOW_DOWN' });
            input.recipient = receiver.data.user.id;
            break;
          case 'place':
          case 'remove':
            if (!item?.available || item.action !== 'display') return reply({ error: 'INVALID_REQUEST' });
            if (raw.command === 'place') {
              const placement = validPlacement(item, raw.placement);
              if (!placement) return reply({ error: 'PLACEMENT_BLOCKED' });
              input.placement = placement;
            }
            break;
          case 'use':
            if (!item?.available || !['emote', 'effect', 'gift'].includes(item.action)) return reply({ error: 'INVALID_REQUEST' });
            if (!actions.allow(user)) return reply({ error: 'SLOW_DOWN' });
            break;
          case 'throw': {
            if (!item?.available || item.action !== 'throw' || !Array.isArray(raw.aim) || raw.aim.length !== 3
              || player.map !== 'plaza' || player.seated) return reply({ error: 'THROW_ZONE' });
            const velocity = throwVelocity(raw.aim, item.visual);
            if (!velocity) return reply({ error: 'INVALID_REQUEST' });
            if (!actions.allow(user) || [...flights.values()].filter((f) => f.room === room).length >= 20) {
              return reply({ error: 'SLOW_DOWN' });
            }
            const p = grandMetres(player);
            const facing = Math.atan2(velocity[0], velocity[2]);
            flight = {
              id: raw.id!, owner: socket.id, sku: item.id, delay: 180, velocity,
              origin: [p.x + Math.cos(facing) * 0.43 + Math.sin(facing) * 0.24,
                (player.height ?? 0) + (player.airOffset ?? 0) + 1.24,
                p.z - Math.sin(facing) * 0.43 + Math.cos(facing) * 0.24],
            };
            command = 'use';
            input.aim = raw.aim;
            break;
          }
          default:
            return reply({ error: 'INVALID_REQUEST' });
        }

        busy.add(user);
        try {
          const state = await storeTransaction(user, command, raw.command === 'load' ? null : raw.id!, input, item);
          sendState(user, state);
          reply({ state });
          if (state.replay) return;
          if (flight) {
            const start = Date.now() + flight.delay;
            flights.set(flight.id, { flight, room, start, last: 0 });
            io.to(plazaRecipients(room)).emit('store:flight', flight);
          } else if (raw.command === 'use') {
            io.to(room).emit('store:action', { id: socket.id, sku: item!.id });
          } else if (receiver) {
            const target = receiver.data.user.id;
            for (const peer of accountSockets(target)) {
              peer.emit('store:gift', { from: player.nickname, sku: item!.id, animate: state.preferences.effects });
            }
            void storeTransaction(target, 'load', null, {}).then((next) => sendState(target, next)).catch(() => {});
          }
        } catch (e) {
          reply({ error: (e as Error).message });
        } finally {
          busy.delete(user);
        }
      });
    },
  };
}
