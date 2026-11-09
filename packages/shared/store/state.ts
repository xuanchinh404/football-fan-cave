import type { Currency, Product, Slot } from './catalog';

export type Placement = { x: number; z: number; turn: number; radius: number };
export type Loadout = Partial<Record<Slot, string>>;
export type StorePreferences = { pranks: boolean; effects: boolean };
export type StoreState = {
  wallet: Record<Currency, string>;
  inventory: Record<string, number>;
  equipped: Loadout;
  quick: Record<number, string>;
  furniture: Record<string, Placement>;
  preferences: StorePreferences;
  canClaim: boolean;
  revision: number;
  transactionId: string | null;
  replay: boolean;
  giftAnimate?: boolean;
  history: {
    id: string;
    delta: string;
    currency: Currency;
    reason: string;
    transactionId: string;
    at: string;
  }[];
};

export type Command =
  | 'load'
  | 'claim'
  | 'buy'
  | 'equip'
  | 'quick'
  | 'use'
  | 'throw'
  | 'gift'
  | 'preferences'
  | 'place'
  | 'remove'
  | 'arena'
  | 'recipients';
export type StoreRequest = {
  command: Command;
  id?: string;
  sku?: string | null;
  quantity?: number;
  unequip?: boolean;
  index?: number;
  aim?: [number, number, number];
  recipient?: string;
  placement?: Omit<Placement, 'radius'>;
  preferences?: Partial<StorePreferences>;
  optIn?: boolean;
};
export type StoreResponse = {
  state?: StoreState;
  recipients?: { id: string; nickname: string }[];
  optedIn?: boolean;
  error?: string;
};
export const roomSize = { x: 5, z: 4 };
export function furnitureRadius(item: Product) {
  if (['sofa', 'bed'].includes(item.visual)) return 1.3;
  if (['pitch', 'rug', 'cabinet', 'table'].includes(item.visual)) return 0.9;
  return 0.55;
}
export function validPlacement(
  item: Product,
  placement: StoreRequest['placement'],
): Placement | undefined {
  if (!placement) return;
  const { turn } = placement;
  if (![placement.x, placement.z].every(Number.isFinite)) return;
  const x = Math.round(placement.x * 10) / 10;
  const z = Math.round(placement.z * 10) / 10;
  const radius = furnitureRadius(item);
  if (
    ![x, z, turn].every(Number.isFinite) ||
    !Number.isInteger(turn) ||
    turn < 0 ||
    turn > 3 ||
    Math.abs(x) > roomSize.x - radius ||
    Math.abs(z) > roomSize.z - radius ||
    (z > 1.6 && Math.abs(x) < radius + 0.9)
  )
    return;
  return { x, z, turn, radius };
}
