import { useEffect, useState } from 'react';
import {
  UserRound,
  Wallet,
  ScrollText,
  Package,
  Users,
  Settings2,
  Menu,
  X,
  Camera,
  Compass,
  Mountain,
  LogIn,
} from 'lucide-react';
import { CAVES } from '../../../../packages/shared/grandHall';
import { emit, on, type WorldState } from '../game/bridge';
import type { Profile } from '../../../../packages/shared/world';
export function GrandHUD({
  profile,
  world,
  openWallet,
  settings,
  notice,
}: {
  profile: Profile;
  world: WorldState;
  openWallet: () => void;
  settings: () => void;
  notice: (s: string) => void;
}) {
  const [menu, setMenu] = useState(false),
    [photo, setPhoto] = useState(false),
    [view, setView] = useState('default');
  useEffect(
    () =>
      on<boolean>('photo-mode', (value) => {
        setPhoto(value);
        emit('camera-view', value ? 'photo' : 'default');
      }),
    [],
  );
  const camera = (v: string) => {
    setView(v);
    emit('camera-view', v);
  };
  return (
    <>
      <button className="grand-menu" aria-label="Mở menu" onClick={() => setMenu((v) => !v)}>
        {menu ? <X /> : <Menu />}
      </button>
      <aside className={`grand-sidebar ${menu ? 'is-open' : ''}`} aria-label="Menu người chơi">
        <div className="grand-identity">
          <span>7</span>
          <div>
            <b>{profile.nickname}</b>
            <small>FAN BÓNG ĐÁ · EXPLORER</small>
          </div>
        </div>
        {[
          [UserRound, 'Hồ sơ', openWallet],
          [Wallet, 'Ví xu', openWallet],
          [ScrollText, 'Nhiệm vụ', () => notice('Nhiệm vụ chưa phát hành.')],
          [Package, 'Vật phẩm', openWallet],
          [
            Users,
            'Bạn bè',
            () =>
              notice(
                'Danh sách bạn bè chưa phát hành. Bạn vẫn có thể gặp và chat trong cùng phòng.',
              ),
          ],
          [Settings2, 'Cài đặt', settings],
        ].map(([Icon, name, action]) => {
          const I = Icon as typeof Wallet;
          return (
            <button
              key={String(name)}
              onClick={() => {
                (action as () => void)();
                setMenu(false);
              }}
            >
              <I size={17} />
              <span>{String(name)}</span>
            </button>
          );
        })}
        <p>
          Không gian chung
          <br />
          <strong>Khác màu áo, chung đam mê</strong>
        </p>
      </aside>
      <div className="grand-camera-tools" aria-label="Góc nhìn thế giới">
        <button
          title="Góc nhìn mặc định"
          aria-label="Góc nhìn mặc định"
          className={view === 'default' ? 'active' : ''}
          onClick={() => camera('default')}
        >
          <Compass size={15} />
          <span>Khám phá</span>
        </button>
        <button
          title="Bản đồ từ trên cao"
          aria-label="Góc nhìn từ trên cao"
          className={view === 'atlas' ? 'active' : ''}
          onClick={() => camera('atlas')}
        >
          <Mountain size={15} />
          <span>Toàn cảnh</span>
        </button>
        <button
          title="Quay về cổng chính"
          aria-label="Nhìn về cổng chính"
          className={view === 'entrance' ? 'active' : ''}
          onClick={() => camera('entrance')}
        >
          <LogIn size={15} />
          <span>Cổng chính</span>
        </button>
      </div>
      <div className="grand-altitude">
        TẦNG {world.height !== undefined ? (world.height > 12 ? 3 : world.height > 5 ? 2 : 1) : 1}
        <span>{Math.max(0, world.height || 0).toFixed(1)} m</span>
      </div>
      {photo && (
        <div className="photo-toolbar panel">
          <Camera />
          <span>CHẾ ĐỘ CHỤP ẢNH · Kéo để chọn góc, cuộn để zoom</span>
          <button onClick={() => emit('screenshot')}>Tải PNG</button>
          <button
            onClick={() => {
              setPhoto(false);
              camera('default');
            }}
          >
            Thoát
          </button>
        </div>
      )}
    </>
  );
}
export function GrandPanel({ kind }: { kind: 'minigame' | 'prediction' | 'ranking' | 'wallet' }) {
  const [aim, setAim] = useState(0),
    [power, setPower] = useState(0.65),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState(''),
    [prediction, setPrediction] = useState('');
  useEffect(() => on<string>('minigame-result', setResult), []);
  if (kind === 'wallet')
    return (
      <>
        <div className="eyebrow">TÀI KHOẢN & VÍ XU</div>
        <h2>Hành trang của bạn</h2>
        <p>Bản chơi thử dùng hồ sơ tạm thời. Đăng nhập để mở ví xu và vật phẩm hiện có.</p>
        <a className="primary grand-login-link" href="/">
          Đến trang đăng nhập
        </a>
        <p>Chưa mở cổng thanh toán thật trong bản thử.</p>
      </>
    );
  if (kind === 'ranking')
    return (
      <>
        <div className="eyebrow">BẢNG XẾP HẠNG · DEMO</div>
        <h2>Chín hang, một cộng đồng.</h2>
        <p>
          Chưa có nguồn điểm xếp hạng production. Dấu — là chưa có dữ liệu, không phải điểm người
          chơi thật.
        </p>
        <div className="grand-rank-list">
          {CAVES.map((c) => (
            <div key={c.id}>
              <b style={{ color: c.color }}>{c.symbol}</b>
              <span>{c.name}</span>
              <strong>—</strong>
            </div>
          ))}
        </div>
      </>
    );
  if (kind === 'prediction')
    return (
      <>
        <div className="eyebrow">DỰ ĐOÁN VUI · CỤC BỘ</div>
        <h2>Đội Đỏ hay Đội Xanh?</h2>
        <p>Trận minh họa. Không đặt cược, không thu xu, không có phần thưởng quy đổi tiền.</p>
        <div className="prediction-options">
          {['Đội Đỏ', 'Hòa', 'Đội Xanh'].map((v) => (
            <button
              className={prediction === v ? 'primary' : 'secondary'}
              key={v}
              onClick={() => {
                setPrediction(v);
                localStorage.setItem('hang-friendly-prediction', v);
              }}
            >
              {v}
            </button>
          ))}
        </div>
        {prediction && <p role="status">Đã lưu dự đoán trên thiết bị: {prediction}.</p>}
      </>
    );
  return (
    <>
      <div className="eyebrow">SÂN MINIGAME · THỬ THÁCH CỤC BỘ</div>
      <h2>Một cú sút, một niềm vui.</h2>
      <p>
        Đi tới quả bóng trên sân, chọn góc và lực sút. Quả bóng dùng physics 3D, không tiêu xu hay
        phát thưởng.
      </p>
      <label className="kick-slider">
        Góc sút{' '}
        <input
          aria-label="Góc sút"
          type="range"
          min="-1"
          max="1"
          step=".05"
          value={aim}
          onChange={(e) => setAim(+e.target.value)}
        />
      </label>
      <label className="kick-slider">
        Lực sút{' '}
        <input
          aria-label="Lực sút"
          type="range"
          min="0"
          max="1"
          step=".05"
          value={power}
          onChange={(e) => setPower(+e.target.value)}
        />
      </label>
      <button
        className="primary"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setResult('Bóng đang bay…');
          emit('kick', { aim, power });
          setTimeout(() => setBusy(false), 2900);
        }}
      >
        {busy ? 'Đang thực hiện…' : 'Sút bóng'}
      </button>
      <p className="kick-result" role="status">
        {result}
      </p>
    </>
  );
}
