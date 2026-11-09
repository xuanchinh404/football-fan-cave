import { authClient } from '../auth/supabaseClient';
export type WalletData = {
  balance: string;
  diamonds?: string;
  ledger: { id: string; delta: string; currency?: 'xu' | 'kc'; reason: string; created_at: string }[];
  purchases: { id: string; item_id: string; status: string; expires_at: string | null }[];
  items: { id: string; name: string; price_coins: string }[];
};
export async function loadWallet(): Promise<WalletData> {
  // RPC serializes bigint as text, avoiding JS floating-point truncation.
  const { data, error } = await authClient().rpc('read_wallet');
  if (error) throw error;
  return data;
}
export async function buyItem(itemId: string, key: string) {
  const {
    data: { session },
  } = await authClient().auth.getSession();
  if (!session) throw new Error('Hãy đăng nhập lại.');
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/purchases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      'Idempotency-Key': key,
    },
    body: JSON.stringify({ itemId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Không thể mua vật phẩm.');
  return data;
}
export const formatCoins = (value: string) => BigInt(value).toLocaleString('vi-VN');
