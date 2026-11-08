import { products } from './products';

export const categories = {
  throwables: ['Đồ ném cà khịa', 'Throwables'],
  pranks: ['Quà cà khịa', 'Prank gifts'],
  emotes: ['Biểu cảm', 'Emotes'],
  clothing: ['Trang phục', 'Clothing'],
  accessories: ['Phụ kiện', 'Accessories'],
  effects: ['Hiệu ứng', 'Effects'],
  pets: ['Thú cưng', 'Pets'],
  furniture: ['Nội thất', 'Furniture'],
  collectibles: ['Sưu tầm', 'Collectibles'],
  gifts: ['Quà tặng', 'Gifts'],
} as const;

export type Category = keyof typeof categories;
export type Locale = 'vi' | 'en';
export type Slot = 'head' | 'face' | 'torso' | 'legs' | 'feet' | 'neck' | 'back' | 'hand' | 'aura' | 'pet';
export type Currency = 'xu' | 'kc';
export type Visual = (typeof products)[number][3];
type Action = 'throw' | 'equip' | 'emote' | 'effect' | 'display' | 'gift' | 'bundle';

const groupKeys = Object.keys(categories) as Category[];
const groupEnds = [12, 24, 34, 44, 54, 64, 72, 82, 90, 100];
const freeGroups = [
  'throwables', 'throwables', 'pranks', ...Array<Category>(8).fill('emotes'),
  'clothing', 'clothing', 'clothing', 'accessories', 'accessories', 'gifts', 'gifts',
  'furniture', 'furniture', 'furniture', 'furniture', 'collectibles', 'collectibles', 'effects',
] as const satisfies readonly Category[];
const daily: Record<string, number> = { F01: 3, F02: 1, F03: 1, F17: 1, F18: 1, F25: 1 };
const slots: Partial<Record<Visual, Slot>> = {
  jersey: 'torso', jacket: 'torso', shorts: 'legs', boots: 'feet', scarf: 'neck',
  flag: 'hand', cap: 'head', headband: 'head', glasses: 'face', backpack: 'back',
  mask: 'face', crown: 'head', headphones: 'head', aura: 'aura', steps: 'aura',
  flame: 'aura', portal: 'aura',
};
const clips: Partial<Record<Visual, string>> = {
  laugh: 'Laugh', cry: 'Cry', wave: 'Wave', sad: 'Sad', clap: 'Cheer', cheer: 'Celebrate',
  folded: 'Angry', flop: 'Flop', point: 'Taunt', slide: 'Slide', kneel: 'Kneel', dance: 'Dance',
};
const bundles: Record<string, Record<string, number>> = {
  P011: { P002: 10 },
  P012: { P001: 5, P003: 5, P004: 5, P005: 5 },
  P082: { P073: 1, P074: 1, P076: 1, P077: 1 },
  P092: { P091: 1, P095: 1, P096: 1 },
  P098: { P091: 1, P095: 2, P097: 1 },
  P100: { P093: 1, P095: 3, P099: 1 },
};
const icons: Partial<Record<Visual, string>> = {
  tomato: '🍅', rotten: '🍅', egg: '🥚', water: '💧', roll: '🧻', cake: '🎂',
  pie: '🥧', foam: '⚽', powder: '💨', glitter: '✨', tissue: '🧻', pillow: '💤',
  shovel: '⛏️', cup: '🏆', crown: '👑', score: '🔢', jersey: '👕', shorts: '🩳',
  boots: '👟', cap: '🧢', glasses: '🕶️', scarf: '🧣', flag: '🚩', backpack: '🎒',
  dragon: '🐉', lion: '🦁', eagle: '🦅', bear: '🐻', robot: '🤖', dino: '🦖',
  ghost: '👻', ball: '⚽', sofa: '🛋️', bed: '🛏️', lamp: '💡', flower: '🌹',
  heart: '💗', bundle: '🎁', laugh: '😂', cry: '😭', wave: '👋', confetti: '🎉',
};
const colors: Partial<Record<Visual, string>> = {
  tomato: '#f33732', rotten: '#a62b20', egg: '#eed068', water: '#33acff',
  roll: '#f4f1ff', cake: '#ffabd1', pie: '#e79c47', foam: '#a1dc62',
  powder: '#ef75ed', glitter: '#b57cff', flower: '#ff4271', heart: '#ff4284',
  cup: '#ffbc39', crown: '#ffbc39', ball: '#f0f2fa', dragon: '#ff492c',
  lion: '#4286f0', eagle: '#a66837', bear: '#bb8256', robot: '#55e4d5', dino: '#69bd60',
  ghost: '#c6b4ff', sofa: '#b52948', bed: '#395bad', lamp: '#ffcd69',
};
const variants: Record<string, string> = {
  P035: '#bf263d', P036: '#dedfee', P037: '#37b275', P038: '#862649', P039: '#233957',
  P040: '#264788', P041: '#e4583b', P042: '#39dcff', P043: '#9664cc',
  P056: '#ff7e38', P057: '#ff3e62', P058: '#379aff', P060: '#eefaff',
  P062: '#b1e1ff', P090: '#ffc53c',
};
const assets: Record<string, string> = {
  P073: '/models/liverpool/sofa.glb',
  P075: '/models/fan-table.glb',
  P086: '/models/blues-trophy-cup.glb',
};

export const actionText: Record<Action, readonly [string, string]> = {
  throw: ['Cầm trên tay và ném vào bia tập hoặc người chơi đã đồng ý trong đấu trường.', 'Hold and throw at a target or an opted-in player inside the arena.'],
  equip: ['Trang bị lên nhân vật. Người chơi khác có thể nhìn thấy.', 'Equip on your avatar. Other players can see it.'],
  emote: ['Phát động tác trên nhân vật. Di chuyển để dừng.', 'Play an avatar animation. Move to cancel.'],
  effect: ['Kích hoạt hiệu ứng ngắn trong thế giới 3D.', 'Trigger a short effect in the 3D world.'],
  display: ['Đặt trong phòng trang trí cá nhân.', 'Place in your private decorating room.'],
  gift: ['Dùng hiệu ứng hoặc gửi cho người chơi đang online.', 'Play its effect or send it to an online player.'],
  bundle: ['Các vật phẩm bên dưới được đưa thẳng vào túi đồ.', 'The items below go directly into your inventory.'],
};

export type Product = {
  id: string;
  name: readonly [string, string];
  category: Category;
  action: Action;
  visual: Visual;
  icon: string;
  color: string;
  asset?: string;
  slot?: Slot;
  clip?: string;
  currency?: Currency;
  price: number;
  daily: number;
  stackable: boolean;
  consumable: boolean;
  giftable: boolean;
  maxOrder: number;
  available: boolean;
  clubVariant: boolean;
  contents?: Record<string, number>;
};

export const catalog: readonly Product[] = products.map((row) => {
  const [id, vi, en, visual] = row;
  const number = Number(id.slice(1));
  const category = row.length === 4 ? freeGroups[number - 1] : groupKeys[groupEnds.findIndex((end) => number <= end)];
  const slot = category === 'pets' ? 'pet' : slots[visual];
  const action: Action = bundles[id] ? 'bundle'
    : category === 'throwables' ? 'throw'
    : category === 'pranks' || category === 'gifts' && visual !== 'confetti' ? 'gift'
    : category === 'emotes' ? 'emote'
    : category === 'furniture' || category === 'collectibles' ? 'display'
    : slot ? 'equip' : 'effect';
  const consumable = action === 'throw' || action === 'gift' || action === 'effect';
  const stackable = consumable || action === 'bundle';
  return {
    id, name: [vi, en], category, action, visual, icon: icons[visual] ?? '✦',
    color: variants[id] ?? colors[visual] ?? '#d79cff', asset: assets[id],
    slot: action === 'equip' ? slot : action === 'throw' ? 'hand' : undefined,
    clip: action === 'emote' ? clips[visual] : undefined,
    price: row.length === 6 ? row[4] : 0, currency: row.length === 6 ? row[5] : undefined,
    daily: daily[id] ?? 0, stackable, consumable, maxOrder: stackable ? 20 : 1,
    giftable: action === 'gift' || action === 'throw' || action === 'effect' || action === 'display',
    available: !['P021', 'P022', 'P043', 'P044', 'P064'].includes(id),
    clubVariant: id === 'F12' || id === 'F15' || id === 'F16' || id === 'F22',
    contents: bundles[id],
  };
});

const byId = new Map<string, Product>(catalog.map((item) => [item.id, item]));
export const product = (id: unknown) => typeof id === 'string' ? byId.get(id) : undefined;
export const starter = Object.fromEntries(catalog.filter((i) => !i.price && !i.daily).map((i) => [i.id, 1]));
export const dailyItems = Object.fromEntries(catalog.filter((i) => i.daily).map((i) => [i.id, i.daily]));

export const stalls = [
  { id: 'store-banter', name: ['Quầy Cà Khịa', 'Banter Booth'], x: -15, color: '#e82b47', icon: '🍅', groups: ['throwables', 'pranks', 'emotes'] },
  { id: 'store-fashion', name: ['Thời Trang Fan', 'Fan Fashion'], x: -5, color: '#2782eb', icon: '👕', groups: ['clothing', 'accessories'] },
  { id: 'store-magic', name: ['Phép Thuật & Thú Cưng', 'Magic & Pets'], x: 5, color: '#a547e8', icon: '🐾', groups: ['effects', 'pets'] },
  { id: 'store-furniture', name: ['Nội Thất & Lưu Niệm', 'Furniture & Souvenirs'], x: 15, color: '#d58122', icon: '🏆', groups: ['furniture', 'collectibles', 'gifts'] },
] as const;
export const stallZ = 35;
