import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configurationMessage =
  'Chưa cấu hình Supabase. Hãy điền VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY trong apps/web/.env.local, áp dụng migration và bật phương thức đăng nhập. Xem docs/AUTH_SETUP.md.';
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null;
export function authClient() {
  if (!supabase) throw new Error(configurationMessage);
  return supabase;
}
export const callbackUrl = (path = '/auth/callback') =>
  new URL(path, import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin).href;

export async function ensureProviderEnabled(provider: 'google' | 'facebook') {
  authClient();
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: { apikey: key },
  });
  if (!response.ok) throw new Error('Không thể kiểm tra cấu hình đăng nhập. Hãy thử lại sau.');
  const settings = await response.json();
  if (!settings.external?.[provider])
    throw new Error(
      `${provider === 'google' ? 'Google' : 'Facebook'} chưa được cấu hình. Quản trị viên cần bật provider và khai báo OAuth credentials trong Supabase. Với Facebook, kiểm tra ứng dụng ở chế độ công khai và quyền được duyệt. Xem docs/AUTH_SETUP.md.`,
    );
}
