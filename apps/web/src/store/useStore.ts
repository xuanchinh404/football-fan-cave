import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../network/client';
import { product } from '../../../../packages/shared/store/catalog';
import type {
  StoreRequest,
  StoreResponse,
  StoreState,
} from '../../../../packages/shared/store/state';
import { emit } from '../game/bridge';

export const words = {
  UNAVAILABLE: ['Cửa hàng đang mất kết nối. Hãy thử lại.', 'The shop is offline. Try again.'],
  SLOW_DOWN: ['Chờ một chút rồi thử lại.', 'Wait a moment and try again.'],
  ALREADY_CLAIMED: ['Bạn đã nhận quà hôm nay.', 'You already claimed today’s items.'],
  ALREADY_OWNED: [
    'Bạn đã sở hữu vật phẩm trong đơn này.',
    'You already own an item in this order.',
  ],
  NOT_OWNED: ['Vật phẩm không còn trong túi.', 'This item is no longer in your bag.'],
  NOT_EQUIPPED: ['Hãy cầm vật phẩm trước khi ném.', 'Equip the item before throwing.'],
  LINK_REQUIRED: [
    'Hãy liên kết tài khoản để mua bằng Xu hoặc KC.',
    'Link your account to buy with coins or gems.',
  ],
  INSUFFICIENT_BALANCE: ['Bạn chưa đủ Xu hoặc KC.', 'You do not have enough coins or gems.'],
  INVENTORY_LIMIT: ['Túi đồ đã đạt giới hạn cho vật phẩm này.', 'Your bag is full for this item.'],
  RECIPIENT_LIMIT: [
    'Người nhận đã sở hữu hoặc có quá nhiều món này.',
    'The recipient already owns this item or has reached its limit.',
  ],
  RECIPIENT_UNAVAILABLE: [
    'Người nhận không còn trực tuyến hoặc chưa mở túi đồ.',
    'The recipient is offline or has not initialized their bag.',
  ],
  GIFT_DECLINED: ['Người nhận đã tắt nhận quà cà khịa.', 'The recipient has disabled prank gifts.'],
  ITEM_PLACED: ['Hãy thu hồi vật phẩm trong phòng trước.', 'Pick up the item in your room first.'],
  ROOM_FULL: ['Phòng đã đầy.', 'The room is full.'],
  PLACEMENT_BLOCKED: [
    'Vị trí vướng đồ, tường hoặc lối vào.',
    'This position overlaps furniture, a wall, or the entrance.',
  ],
  THROW_ZONE: ['Hãy đứng trong Đại Sảnh để ném.', 'Stand in the Grand Hall to throw.'],
  ARENA_ONLY: ['Hãy bước vào Đấu Trường Cà Khịa.', 'Step inside the Banter Arena.'],
  INVALID_REQUEST: ['Yêu cầu chưa hợp lệ.', 'This request is invalid.'],
  REQUEST_CONFLICT: ['Yêu cầu này đã được sử dụng.', 'This request has already been used.'],
} as const;

export function useStore(active: boolean, language: number, notice: (message: string) => void) {
  const [state, setState] = useState<StoreState>();
  const [busy, setBusy] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const pending = useRef(false);
  const retry = useRef<{ signature: string; id: string } | null>(null);
  const lastBuy = useRef<{ signature: string; id: string; at: number } | null>(null);
  const latest = useRef({ language, notice });
  latest.current = { language, notice };
  const update = useCallback((next: StoreState) => {
    setState((current) => (!current || next.revision >= current.revision ? next : current));
  }, []);
  useEffect(() => {
    if (!active) return;
    const disconnect = () => setOptedIn(false);
    const gift = ({ from, sku, animate }: { from: string; sku: string; animate: boolean }) => {
      const { language, notice } = latest.current;
      const name = product(sku)?.name[language] ?? sku;
      notice(language ? `${from} sent you ${name}.` : `${from} đã tặng bạn ${name}.`);
      if (animate) emit('store-gift-received', sku);
    };
    socket.on('store:state', update);
    socket.on('store:gift', gift);
    socket.on('disconnect', disconnect);
    return () => {
      socket.off('store:state', update);
      socket.off('store:gift', gift);
      socket.off('disconnect', disconnect);
    };
  }, [active, update]);
  useEffect(() => {
    emit('store-loadout', state?.equipped ?? {});
    emit('store-effects-preference', state?.preferences.effects ?? true);
  }, [state]);
  const run = useCallback(
    async (request: StoreRequest): Promise<StoreResponse> => {
      if (pending.current) return { error: 'SLOW_DOWN' };
      if (!socket.connected) {
        const { language, notice } = latest.current;
        notice(words.UNAVAILABLE[language]);
        return { error: 'UNAVAILABLE' };
      }
      pending.current = true;
      setBusy(true);
      const mutation = !['load', 'arena', 'recipients'].includes(request.command);
      const signature = JSON.stringify(request);
      const now = performance.now();
      const repeatBuy =
        request.command === 'buy' &&
        lastBuy.current?.signature === signature &&
        now - lastBuy.current.at < 450;
      const id = mutation
        ? retry.current?.signature === signature
          ? retry.current.id
          : repeatBuy
            ? lastBuy.current!.id
            : crypto.randomUUID()
        : undefined;
      if (request.command === 'buy' && id && !repeatBuy)
        lastBuy.current = { signature, id, at: now };
      try {
        const response: StoreResponse = await socket
          .timeout(6000)
          .emitWithAck('store:command', { ...request, id });
        if (retry.current?.id === id && response.error !== 'SLOW_DOWN') retry.current = null;
        if (response.state) update(response.state);
        if (response.optedIn !== undefined) setOptedIn(response.optedIn);
        if (response.error) {
          const { language, notice } = latest.current;
          notice((words[response.error as keyof typeof words] ?? words.UNAVAILABLE)[language]);
        }
        return response;
      } catch {
        if (id) retry.current = { signature, id };
        const { language, notice } = latest.current;
        notice(words.UNAVAILABLE[language]);
        return { error: 'UNAVAILABLE' };
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [update],
  );
  return { state, busy, run, optedIn, clearOptIn: setOptedIn };
}
