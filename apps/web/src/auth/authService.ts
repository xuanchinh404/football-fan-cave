import { authClient, callbackUrl, ensureProviderEnabled } from './supabaseClient';
export function errorMessage(error: unknown): string {
  const e = error as { code?: string; message?: string };
  const messages: Record<string, string> = {
    invalid_credentials: 'Email hoặc mật khẩu chưa đúng.',
    email_not_confirmed: 'Hãy xác minh email trước khi đăng nhập.',
    user_already_exists: 'Không thể đăng ký. Hãy kiểm tra email hoặc dùng khôi phục mật khẩu.',
    weak_password: 'Mật khẩu chưa đáp ứng chính sách bảo mật của hệ thống.',
    over_request_rate_limit: 'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    over_email_send_rate_limit: 'Đã vượt giới hạn gửi email. Hãy thử lại sau.',
    anonymous_provider_disabled:
      'Chơi khách chưa được bật. Quản trị viên cần bật Anonymous Sign-ins trong Supabase.',
    provider_disabled: 'Nhà cung cấp đăng nhập chưa được bật trong Supabase.',
    identity_already_exists:
      'Danh tính này đã thuộc tài khoản khác. Ví và vật phẩm không được tự động gộp. Hãy quay lại và đăng nhập tài khoản đó riêng.',
    manual_linking_disabled: 'Liên kết danh tính chưa được bật trong Supabase.',
  };
  if (e.code && messages[e.code]) return messages[e.code];
  if (/Invalid login credentials/i.test(e.message || '')) return 'Email hoặc mật khẩu chưa đúng.';
  if (/Email not confirmed/i.test(e.message || ''))
    return 'Hãy xác minh email trước khi đăng nhập.';
  if (/fetch|network/i.test(e.message || ''))
    return 'Không thể kết nối. Kiểm tra mạng rồi thử lại.';
  if (/provider.*not enabled|unsupported provider/i.test(e.message || ''))
    return 'Google/Facebook chưa được cấu hình. Xem docs/AUTH_SETUP.md để bật provider và khai báo OAuth credentials.';
  return e.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
}
export async function login(email: string, password: string) {
  const { error } = await authClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function register(email: string, password: string) {
  const { data, error } = await authClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl() },
  });
  if (error) throw error;
  return data;
}
export async function guestLogin() {
  const { error } = await authClient().auth.signInAnonymously();
  if (error) throw error;
}
export async function socialLogin(provider: 'google' | 'facebook', link = false) {
  const client = authClient();
  if (link && import.meta.env.VITE_IDENTITY_LINKING_ENABLED !== 'true')
    throw new Error(
      'Liên kết khách đang khóa đến khi quản trị viên bật và kiểm thử Identity Linking. Hồ sơ và ví khách được giữ nguyên.',
    );
  await ensureProviderEnabled(provider);
  const options = {
    redirectTo: callbackUrl(),
    ...(provider === 'facebook' ? { scopes: 'email' } : {}),
  };
  const { error } = link
    ? await client.auth.linkIdentity({ provider, options })
    : await client.auth.signInWithOAuth({ provider, options });
  if (error) throw error;
}
export async function requestReset(email: string) {
  const { error } = await authClient().auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl('/auth/reset-password'),
  });
  // Do not reveal whether an address exists.
  if (error && !['user_not_found', 'email_not_found'].includes(error.code || '')) throw error;
}
export async function resetPassword(password: string) {
  const { error } = await authClient().auth.updateUser({ password });
  if (error) throw error;
}
export async function logout() {
  const { error } = await authClient().auth.signOut();
  if (error) throw error;
}
