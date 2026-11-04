import { useEffect, useRef, useState } from 'react';
import { buyItem, formatCoins, loadWallet, type WalletData } from './walletService';
import { useAuthAction } from '../auth/AuthPage';
import { emit } from '../game/bridge';
import { AccountUpgradeDialog } from './AccountUpgradeDialog';
export function WalletPanel({
  guest,
  close,
  logout,
  edit,
}: {
  guest: boolean;
  close: () => void;
  logout: () => Promise<void>;
  edit: () => void;
}) {
  const [data, setData] = useState<WalletData | null>(null),
    [upgrade, setUpgrade] = useState(false);
  const a = useAuthAction();
  const keys = useRef(new Map<string, string>());
  useEffect(() => {
    emit('block', true);
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', escape);
    return () => {
      emit('block', false);
      window.removeEventListener('keydown', escape);
    };
  }, []);
  useEffect(() => {
    void a.run(async () => setData(await loadWallet()));
  }, []);
  return (
    <div className="account-overlay">
      <section
        className="auth-card wallet-card"
        role="dialog"
        aria-modal="true"
        aria-label="Hồ sơ và ví xu"
      >
        <button className="account-close" onClick={close} aria-label="Đóng hồ sơ">
          ×
        </button>
        <small className="auth-eyebrow">GÓC CỦA BẠN · {guest ? 'KHÁCH' : 'THÀNH VIÊN'}</small>
        <h2>Ví xu & vật phẩm</h2>
        <div className="wallet-balance">
          🪙 {data ? formatCoins(data.balance) : '…'} <small>xu</small>
        </div>
        <button
          className="auth-primary"
          onClick={() =>
            void a.run(async () => {
              throw new Error(
                guest
                  ? 'Khách cần liên kết tài khoản trước khi nạp xu.'
                  : 'Cổng thanh toán chưa được cấu hình. Hiện chưa nhận nạp tiền.',
              );
            })
          }
        >
          Nạp xu
        </button>
        <p className="wallet-note">
          Gói dự kiến: 10.000đ → 100 xu · 20.000đ → 200 xu
          <br />
          50.000đ → 500 xu · 100.000đ → 1.000 xu
        </p>
        <h3>Quầy vật phẩm</h3>
        {data?.items.map((item) => (
          <div className="wallet-row" key={item.id}>
            <span>{item.name}</span>
            <button
              disabled={a.busy || guest}
              onClick={() =>
                void a.run(async () => {
                  const key = keys.current.get(item.id) || crypto.randomUUID();
                  keys.current.set(item.id, key);
                  await buyItem(item.id, key);
                  keys.current.delete(item.id);
                  setData(await loadWallet());
                }, 'Mua thành công. Vật phẩm đã được lưu vào tài khoản.')
              }
            >
              {formatCoins(item.price_coins)} xu
            </button>
          </div>
        ))}
        <h3>Vật phẩm đã mua</h3>
        {!data?.purchases.length ? (
          <p>Chưa có vật phẩm.</p>
        ) : (
          data.purchases.map((p) => (
            <div className="wallet-row" key={p.id}>
              {data.items.find((i) => i.id === p.item_id)?.name || p.item_id}
              <span>
                {p.status}
                {p.expires_at ? ` · ${new Date(p.expires_at).toLocaleString('vi-VN')}` : ''}
              </span>
            </div>
          ))
        )}
        <h3>Lịch sử giao dịch gần đây</h3>
        {!data?.ledger.length ? (
          <p>Chưa có giao dịch.</p>
        ) : (
          data.ledger.map((l) => (
            <div className="wallet-row" key={l.id}>
              <span>
                {l.reason} · {new Date(l.created_at).toLocaleString('vi-VN')}
              </span>
              <b>{formatCoins(l.delta)} xu</b>
            </div>
          ))
        )}
        <p className={`auth-feedback ${a.failed ? 'is-error' : ''}`} role="status">
          {a.message}
        </p>
        <div className="account-actions">
          <button onClick={edit}>Sửa hồ sơ</button>
          {guest && <button onClick={() => setUpgrade(!upgrade)}>Liên kết tài khoản</button>}
          <button disabled={a.busy} onClick={() => void a.run(logout)}>
            Đăng xuất
          </button>
        </div>
        {guest && (
          <p className="wallet-note">
            Đăng xuất tài khoản khách sẽ mất quyền truy cập nếu chưa liên kết danh tính.
          </p>
        )}
        {upgrade && <AccountUpgradeDialog />}
      </section>
    </div>
  );
}
