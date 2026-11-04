import { validProfile, type Profile } from '../../../../packages/shared/world';
import { authClient } from './supabaseClient';
export async function loadProfile(id: string): Promise<Profile | null> {
  const { data, error } = await authClient()
    .from('profiles')
    .select('nickname,favorite_team,avatar_key')
    .eq('id', id)
    .single();
  if (error) throw error;
  return validProfile({
    nickname: data.nickname,
    team: data.favorite_team,
    avatar: data.avatar_key,
  });
}
export async function saveProfile(id: string, profile: Profile) {
  if (!validProfile(profile)) throw new Error('Hồ sơ chưa hợp lệ. Tên cần 2–20 ký tự.');
  const { data, error } = await authClient()
    .from('profiles')
    .update({
      nickname: profile.nickname.trim(),
      favorite_team: profile.team,
      avatar_key: profile.avatar,
    })
    .eq('id', id)
    .select('id')
    .single();
  if (error) throw error;
  if (!data) throw new Error('Chưa có hồ sơ. Hãy kiểm tra migration Supabase.');
}
