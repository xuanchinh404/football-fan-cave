import { Backpack, Smile, Target } from 'lucide-react';
import { product } from '../../../../packages/shared/store/catalog';
import type { StoreState } from '../../../../packages/shared/store/state';

export function StoreHUD({
  state,
  lang,
  arena,
  optedIn,
  canThrow,
  open,
  emotes,
  quick,
  toggleArena,
  throwItem,
}: {
  state?: StoreState;
  lang: number;
  arena: boolean;
  optedIn: boolean;
  canThrow: boolean;
  open: () => void;
  emotes: () => void;
  quick: (index: number) => void;
  toggleArena: () => void;
  throwItem: () => void;
}) {
  const hand = product(state?.equipped.hand);
  const armed = hand?.action === 'throw' && canThrow;
  return (
    <>
      {armed && (
        <span className="store-crosshair" aria-hidden="true">
          ⊕
        </span>
      )}
      <div className="store-hud" aria-label={lang ? 'Quick slots' : 'Ô dùng nhanh'}>
        <button onClick={open} aria-label={lang ? 'Open inventory' : 'Mở túi đồ'}>
          <Backpack size={18} />
        </button>
        <button onClick={emotes} aria-label={lang ? 'Open emotes' : 'Mở biểu cảm'}>
          <Smile size={18} />
        </button>
        {[1, 2, 3, 4, 5].map((i) => {
          const item = product(state?.quick[i]);
          return (
            <button
              key={i}
              onClick={() => quick(i)}
              disabled={!item || !state?.inventory[item.id]}
              title={item?.name[lang]}
              aria-label={`${i} · ${item?.name[lang] ?? '—'}`}
              aria-pressed={!!item?.slot && state?.equipped[item.slot] === item.id}
            >
              <small>{i}</small>
              {item?.icon ?? '·'}
              {item && <b>{state?.inventory[item.id] || 0}</b>}
            </button>
          );
        })}
        {arena && (
          <button className="store-arena" aria-pressed={optedIn} onClick={toggleArena}>
            {optedIn
              ? lang
                ? 'Leave avatar hits'
                : 'Tắt nhận đồ ném'
              : lang
                ? 'Opt in to avatar hits'
                : 'Đồng ý nhận đồ ném'}
          </button>
        )}
        {armed && (
          <button className="store-throw" onClick={throwItem}>
            <Target size={16} /> {lang ? 'Throw · Q' : 'Ném · Q'}
          </button>
        )}
      </div>
    </>
  );
}
