import { createClient, type User } from '@supabase/supabase-js';
import { validProfile } from '../../../packages/shared/world.ts';
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_PUBLISHABLE_KEY;
export const authClient =
  url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
export const adminClient =
  url && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
export async function verifyToken(
  token: unknown,
): Promise<{ user: User; expiresAt: number; token: string }> {
  if (!authClient) throw new Error('AUTH_NOT_CONFIGURED');
  if (typeof token !== 'string' || token.length > 12000) throw new Error('UNAUTHORIZED');
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHORIZED');
  // getUser above verifies the token with Auth. Decode expiry only after verification.
  let exp: number;
  try {
    exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).exp;
  } catch {
    throw new Error('UNAUTHORIZED');
  }
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) throw new Error('TOKEN_EXPIRED');
  return { user: data.user, expiresAt: exp * 1000, token };
}
export async function profileForToken(token: string, id: string) {
  if (!authClient) throw new Error('AUTH_NOT_CONFIGURED');
  const { data, error } = await authClient
    .from('profiles')
    .select('nickname,favorite_team,avatar_key')
    .eq('id', id)
    .setHeader('Authorization', `Bearer ${token}`)
    .single();
  if (error) throw new Error('PROFILE_UNAVAILABLE');
  const profile = validProfile({
    nickname: data.nickname,
    team: data.favorite_team,
    avatar: data.avatar_key,
  });
  if (!profile) throw new Error('PROFILE_REQUIRED');
  return profile;
}
export function isLinked(user: User) {
  return (
    user.is_anonymous === false &&
    !!(
      user.email_confirmed_at ||
      user.phone_confirmed_at ||
      user.identities?.some((i) => ['google', 'facebook'].includes(i.provider))
    )
  );
}
