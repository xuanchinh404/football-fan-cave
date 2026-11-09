import { useEffect, useState } from 'react';
import { Backpack, Check, Gem, Gift, History, House, ShoppingBasket, X } from 'lucide-react';
import {
  actionText,
  catalog,
  categories,
  product,
  stalls,
  type Category,
  type Product,
} from '../../../../packages/shared/store/catalog';
import {
  furnitureRadius,
  validPlacement,
  type Placement,
  type StoreRequest,
  type StoreResponse,
  type StoreState,
} from '../../../../packages/shared/store/state';
import { FurniturePreview, StorePreview } from './StorePreview';
import './store.css';

type Mode = 'shop' | 'bag' | 'room' | 'history';
type Props = {
  stall?: string;
  inventory?: boolean;
  emotes?: boolean;
  lang: number;
  teamColor?: string;
  state?: StoreState;
  busy: boolean;
  run: (request: StoreRequest) => Promise<StoreResponse>;
  close: () => void;
  notice: (value: string) => void;
  setLanguage: (language: number) => void;
};

export function StorePanel({
  stall,
  inventory,
  emotes,
  lang,
  teamColor,
  state,
  busy,
  run,
  close,
  notice,
  setLanguage,
}: Props) {
  const [mode, setMode] = useState<Mode>(inventory ? 'bag' : 'shop');
  const [scope, setScope] = useState(stall || '');
  const [category, setCategory] = useState(emotes ? 'emotes' : '');
  const [currency, setCurrency] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [trying, setTrying] = useState('');
  const [details, setDetails] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [recipients, setRecipients] = useState<{ id: string; nickname: string }[]>();
  const [draft, setDraft] = useState<Placement>({ x: 0, z: -2, turn: 0, radius: 0.55 });
  const t = (vi: string, en: string) => (lang ? en : vi);
  const shop = stalls.find((s) => s.id === scope);
  const groups: readonly Category[] =
    mode === 'shop' && shop ? shop.groups : (Object.keys(categories) as Category[]);
  const filtered = catalog.filter(
    (item) =>
      (mode !== 'bag' || !!state?.inventory[item.id]) &&
      (mode !== 'room' || (item.action === 'display' && !!state?.inventory[item.id])) &&
      groups.includes(item.category) &&
      (mode === 'room' || !category || item.category === category) &&
      (mode !== 'shop' || !currency || (item.currency || 'free') === currency) &&
      (mode === 'room' ||
        !query ||
        `${item.id} ${item.name.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim())),
  );
  const item =
    filtered.find((p) => p.id === selected) ?? (mode === 'room' ? undefined : filtered[0]);
  const sku = item?.id;
  const equipped = !!item?.slot && state?.equipped[item.slot] === sku;
  const currencyName = (p: Product) => (p.currency === 'kc' ? t('KC', 'gems') : t('Xu', 'coins'));
  const number = (value: number | string) =>
    (typeof value === 'string' ? BigInt(value) : value).toLocaleString(lang ? 'en' : 'vi');
  const placed = state?.furniture ?? {};
  useEffect(() => {
    setQuantity(1);
    setRecipient('');
    setRecipients(undefined);
    if (item) setDraft(placed[item.id] ?? { x: 0, z: -2, turn: 0, radius: furnitureRadius(item) });
  }, [sku, mode]);
  useEffect(() => {
    if (!state && !busy) void run({ command: 'load' });
  }, []);
  function changeMode(next: Mode) {
    setMode(next);
    setCategory('');
    setSelected('');
  }
  function choose(p: Product) {
    setSelected(p.id);
    setQuantity(1);
  }
  async function act(request: StoreRequest, message?: string) {
    const response = await run(request);
    if (!response.error && message) notice(message);
    return response;
  }
  const activate = async (p: Product) => {
    const response = await act(
      p.slot ? { command: 'equip', sku: p.id } : { command: 'use', sku: p.id },
    );
    if (!response.error) close();
  };
  return (
    <div
      className="store-shade"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="store-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('Phố Cửa Hàng', 'Shop Street')}
      >
        <header className="store-heading">
          <div>
            <small>HỘI VÀO HANG · {t('PHỐ CỬA HÀNG', 'SHOP STREET')}</small>
            <h2>
              {mode === 'shop'
                ? (shop?.name[lang] ?? t('Phố Cửa Hàng', 'Shop Street'))
                : mode === 'bag'
                  ? t('Túi Đồ', 'Inventory')
                  : mode === 'room'
                    ? t('Phòng trang trí cá nhân', 'Private decorating room')
                    : t('Lịch sử ví', 'Wallet history')}
            </h2>
          </div>
          <div className="store-balances">
            <span>
              🪙 {state ? number(state.wallet.xu) : '…'} {t('Xu', 'coins')}
            </span>
            <span>
              <Gem size={16} /> {state ? number(state.wallet.kc) : '…'} KC
            </span>
            <button
              type="button"
              onClick={() => setLanguage(1 - lang)}
              aria-label={t('Đổi sang tiếng Anh', 'Switch to Vietnamese')}
            >
              {lang ? 'VI' : 'EN'}
            </button>
            <button
              type="button"
              className="store-close"
              onClick={close}
              aria-label={t('Đóng', 'Close')}
            >
              <X size={22} />
            </button>
          </div>
        </header>
        <nav className="store-modes" aria-label={t('Tính năng cửa hàng', 'Shop features')}>
          {(
            [
              ['shop', ShoppingBasket, t('Cửa hàng', 'Shop')],
              ['bag', Backpack, t('Túi đồ', 'Inventory')],
              ['room', House, t('Phòng riêng', 'Private room')],
              ['history', History, t('Lịch sử', 'History')],
            ] as const
          ).map(([key, Icon, label]) => (
            <button key={key} aria-pressed={mode === key} onClick={() => changeMode(key)}>
              <Icon size={17} /> {label}
            </button>
          ))}
          <button
            className="store-claim"
            disabled={!state || busy || !state.canClaim}
            onClick={() =>
              act({ command: 'claim' }, t('Đã nhận quà hằng ngày.', 'Daily items claimed.'))
            }
          >
            <Gift size={17} />{' '}
            {state && !state.canClaim
              ? t('Đã nhận quà hôm nay', 'Claimed today')
              : t('Quà hằng ngày', 'Daily items')}
          </button>
        </nav>
        {!state && (
          <div className="store-status">
            {t(
              'Cần kết nối máy chủ để giao dịch và mở túi.',
              'Connect to the server to trade and access your bag.',
            )}
            <button disabled={busy} onClick={() => run({ command: 'load' })}>
              {t('Tải lại', 'Reload')}
            </button>
          </div>
        )}
        {(mode === 'shop' || mode === 'bag') && (
          <>
            <div className="store-filters">
              {mode === 'shop' && (
                <select
                  aria-label={t('Chọn quầy', 'Select booth')}
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    setCategory('');
                  }}
                >
                  <option value="">{t('Cả bốn quầy', 'All booths')}</option>
                  {stalls.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name[lang]}
                    </option>
                  ))}
                </select>
              )}
              <select
                aria-label={t('Danh mục', 'Category')}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t('Tất cả danh mục', 'All categories')}</option>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {categories[group][lang]}
                  </option>
                ))}
              </select>
              <input
                type="search"
                placeholder={t('Tìm vật phẩm hoặc mã…', 'Find an item or SKU…')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {mode === 'shop' && (
                <select
                  aria-label={t('Loại tiền', 'Currency')}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="">{t('Tất cả mức giá', 'All prices')}</option>
                  <option value="free">{t('Miễn phí', 'Free')}</option>
                  <option value="xu">{t('Xu', 'Coins')}</option>
                  <option value="kc">{t('Kim Cương', 'Gems')}</option>
                </select>
              )}
            </div>
            <div className="store-body">
              <div className="store-products" aria-label={t('Danh sách vật phẩm', 'Items')}>
                {!filtered.length && <p>{t('Không tìm thấy vật phẩm.', 'No matching items.')}</p>}
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    className="store-tile"
                    aria-pressed={sku === p.id}
                    onClick={() => choose(p)}
                  >
                    <span className="store-item-icon">{p.icon}</span>
                    <strong>{p.name[lang]}</strong>
                    <small>
                      {mode === 'bag'
                        ? `×${state?.inventory[p.id]}`
                        : p.currency
                          ? `${number(p.price)} ${currencyName(p)}`
                          : t('Miễn phí', 'Free')}
                    </small>
                    {!p.available && <small>{t('Chưa mở bán', 'Unavailable')}</small>}
                    {mode === 'bag' && p.slot && state?.equipped[p.slot] === p.id && (
                      <Check className="store-equipped" size={17} />
                    )}
                  </button>
                ))}
              </div>
              {item && (
                <aside className="store-detail">
                  <StorePreview item={item} teamColor={teamColor} tryOn={trying === item.id} />
                  <small>
                    {item.id} · {categories[item.category][lang]}
                  </small>
                  <h3>{item.name[lang]}</h3>
                  <div className="store-preview-actions">
                    {item.available && ['equip', 'emote', 'effect'].includes(item.action) && (
                      <button
                        aria-pressed={trying === item.id}
                        onClick={() => setTrying(trying === item.id ? '' : item.id)}
                      >
                        {item.action === 'equip'
                          ? t('Thử trang bị', 'Try on')
                          : t('Chạy thử', 'Try preview')}
                      </button>
                    )}
                    <button aria-expanded={details} onClick={() => setDetails(!details)}>
                      {t('Xem chi tiết', 'View details')}
                    </button>
                  </div>
                  <p>{actionText[item.action][lang]}</p>
                  <small>
                    {!item.available
                      ? t('Chưa khả dụng', 'Unavailable')
                      : item.asset
                        ? t('Mô hình 3D hiện có', 'Existing 3D model')
                        : t('Bản dựng 3D tạm', 'Placeholder 3D model')}
                  </small>
                  {item.action === 'emote' && (
                    <small>
                      {t(
                        'Dùng động tác hiện có hoặc bản tạm.',
                        'Uses an existing or placeholder animation.',
                      )}
                    </small>
                  )}
                  {details && (
                    <small>
                      {item.consumable
                        ? t('Tiêu hao một món khi sử dụng.', 'Consumes one item per use.')
                        : t('Lưu trên tài khoản.', 'Saved to your account.')}
                      {item.slot &&
                        t(` · Ô trang bị: ${item.slot}`, ` · Equipment slot: ${item.slot}`)}
                    </small>
                  )}
                  {item.daily > 0 && (
                    <small>{t(`Nhận ${item.daily} mỗi ngày`, `Claim ${item.daily} per day`)}</small>
                  )}
                  {item.contents && (
                    <ul>
                      {Object.entries(item.contents).map(([id, q]) => (
                        <li key={id}>
                          {q} × {product(id)?.name[lang]}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mode === 'shop' && item.currency && (
                    <div className="store-buy">
                      {item.maxOrder > 1 && (
                        <label>
                          {t('Số lượng', 'Quantity')}{' '}
                          <input
                            type="number"
                            min={1}
                            max={item.maxOrder}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(
                                Math.max(
                                  1,
                                  Math.min(item.maxOrder, Math.trunc(Number(e.target.value)) || 1),
                                ),
                              )
                            }
                          />
                        </label>
                      )}
                      <button
                        className="store-primary"
                        disabled={!state || busy || !item.available}
                        onClick={() =>
                          act(
                            { command: 'buy', sku: item.id, quantity },
                            t('Đã thêm vào Túi Đồ.', 'Added to your inventory.'),
                          )
                        }
                      >
                        {t('Mua', 'Buy')} · {number(item.price * quantity)} {currencyName(item)}
                      </button>
                    </div>
                  )}
                  {mode === 'bag' && (
                    <div className="store-detail-actions">
                      {item.slot && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            equipped
                              ? act({ command: 'equip', sku: item.id, unequip: true })
                              : activate(item)
                          }
                        >
                          {equipped
                            ? t('Tháo', 'Unequip')
                            : item.action === 'throw'
                              ? t('Cầm trên tay', 'Hold in hand')
                              : t('Trang bị', 'Equip')}
                        </button>
                      )}
                      {['emote', 'effect', 'gift'].includes(item.action) && (
                        <button
                          className="store-primary"
                          disabled={busy}
                          onClick={() => activate(item)}
                        >
                          {t('Sử dụng', 'Use')}
                        </button>
                      )}
                      {item.action === 'display' && (
                        <button
                          onClick={() => {
                            changeMode('room');
                            setSelected(item.id);
                          }}
                        >
                          {t('Đặt trong phòng', 'Place in room')}
                        </button>
                      )}
                      {item.action !== 'display' && (
                        <select
                          aria-label={t('Gán ô nhanh', 'Assign quick slot')}
                          value=""
                          disabled={busy}
                          onChange={(e) =>
                            act(
                              { command: 'quick', sku: item.id, index: Number(e.target.value) },
                              t('Đã lưu ô nhanh.', 'Quick slot saved.'),
                            )
                          }
                        >
                          <option value="" disabled>
                            {t('Gán ô nhanh…', 'Assign quick slot…')}
                          </option>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <option key={i} value={i}>
                              {i} · {product(state?.quick[i])?.name[lang] ?? '—'}
                            </option>
                          ))}
                        </select>
                      )}
                      {item.giftable && (
                        <button
                          disabled={busy}
                          onClick={async () => {
                            const result = await run({ command: 'recipients' });
                            if (!result.error) setRecipients(result.recipients ?? []);
                          }}
                        >
                          {t('Chọn người nhận', 'Choose recipient')}
                        </button>
                      )}
                      {recipients &&
                        (recipients.length ? (
                          <>
                            <select
                              aria-label={t('Người nhận', 'Recipient')}
                              value={recipient}
                              onChange={(e) => setRecipient(e.target.value)}
                            >
                              <option value="">
                                {t('Chọn bạn đang online', 'Choose an online friend')}
                              </option>
                              {recipients.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nickname}
                                </option>
                              ))}
                            </select>
                            <button
                              disabled={!recipient || busy}
                              onClick={async () => {
                                const result = await act(
                                  { command: 'gift', sku: item.id, recipient },
                                  t('Đã gửi quà.', 'Gift sent.'),
                                );
                                if (!result.error) setRecipients(undefined);
                              }}
                            >
                              {t('Xác nhận tặng 1 món', 'Confirm gift of 1 item')}
                            </button>
                          </>
                        ) : (
                          <small>
                            {t('Chưa có người nhận đang online.', 'No eligible players online.')}
                          </small>
                        ))}
                    </div>
                  )}
                </aside>
              )}
            </div>
            {mode === 'bag' && state && (
              <footer className="store-prefs">
                <label>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={state.preferences.pranks}
                    onChange={(e) =>
                      run({ command: 'preferences', preferences: { pranks: e.target.checked } })
                    }
                  />
                  {t('Nhận quà cà khịa', 'Accept prank gifts')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={state.preferences.effects}
                    onChange={(e) =>
                      run({ command: 'preferences', preferences: { effects: e.target.checked } })
                    }
                  />
                  {t('Hiện hiệu ứng của người khác', 'Show other players’ effects')}
                </label>
                <select
                  aria-label={t('Xóa ô nhanh', 'Clear quick slot')}
                  value=""
                  disabled={busy}
                  onChange={(e) =>
                    run({ command: 'quick', sku: null, index: Number(e.target.value) })
                  }
                >
                  <option value="" disabled>
                    {t('Xóa ô nhanh…', 'Clear quick slot…')}
                  </option>
                  {Object.keys(state.quick).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </footer>
            )}
          </>
        )}
        {mode === 'room' && (
          <div className="store-room">
            <FurniturePreview
              items={placed}
              selected={item}
              draft={draft}
              choose={(x, z) =>
                setDraft((d) => ({ ...d, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 }))
              }
            />
            <div className="store-room-actions">
              <select
                aria-label={t('Nội thất', 'Furniture')}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">{t('Chọn đồ để đặt…', 'Select an item to place…')}</option>
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name[lang]}
                    {placed[p.id] ? t(' · Đã đặt', ' · Placed') : ''}
                  </option>
                ))}
              </select>
              <p>
                {t(
                  'Chạm sàn để di chuyển bản xem trước. Chừa lối vào màu vàng.',
                  'Tap the floor to move the preview. Keep the gold entry clear.',
                )}
              </p>
              {item && (
                <>
                  <button onClick={() => setDraft({ ...draft, turn: (draft.turn + 1) % 4 })}>
                    {t('Xoay 90°', 'Rotate 90°')}
                  </button>
                  <button
                    disabled={busy || !validPlacement(item, draft)}
                    className="store-primary"
                    onClick={() =>
                      act(
                        { command: 'place', sku: item.id, placement: draft },
                        t('Đã lưu vị trí.', 'Placement saved.'),
                      )
                    }
                  >
                    {t('Xác nhận đặt', 'Place item')}
                  </button>
                  {placed[item.id] && (
                    <button
                      disabled={busy}
                      onClick={async () => {
                        const result = await act(
                          { command: 'remove', sku: item.id },
                          t('Đã thu hồi.', 'Item picked up.'),
                        );
                        if (!result.error) setSelected('');
                      }}
                    >
                      {t('Thu hồi', 'Pick up')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {mode === 'history' && (
          <ul className="store-history">
            {state?.history.map((h) => (
              <li key={h.id}>
                <span>
                  {h.reason === 'store_purchase'
                    ? t('Mua vật phẩm', 'Item purchase')
                    : h.reason === 'store_welcome'
                      ? t('Quà chào mừng', 'Welcome grant')
                      : h.reason === 'store_daily'
                        ? t('Quà hằng ngày', 'Daily reward')
                        : h.reason}
                  <small>
                    {new Date(h.at).toLocaleString(lang ? 'en' : 'vi')} · {h.transactionId}
                  </small>
                </span>
                <strong>
                  {Number(h.delta) > 0 ? '+' : ''}
                  {number(h.delta)} {h.currency === 'kc' ? 'KC' : t('Xu', 'coins')}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
