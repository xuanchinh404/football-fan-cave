import { useState } from 'react';
import { TEAMS, type Profile } from '../../../../packages/shared/world';
import { AuthLayout } from './AuthLayout';
import { useAuthAction } from './AuthPage';
export function PlayerProfileSetup({
  save,
  initial,
  cancel,
}: {
  save: (p: Profile) => Promise<void>;
  initial?: Profile;
  cancel: () => void;
}) {
  const [profile, setProfile] = useState<Profile>(
    initial || { nickname: '', team: 'common', avatar: 0 },
  );
  const a = useAuthAction();
  return (
    <AuthLayout>
      <section className="auth-card auth-narrow">
        <small className="auth-eyebrow">MỘT CHỖ TRONG HỘI ĐANG CHỜ BẠN</small>
        <h2>
          Chọn màu áo.
          <br />
          Bắt đầu câu chuyện.
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void a.run(() => save(profile));
          }}
        >
          <label className="setup-label">
            Tên nhân vật
            <input
              required
              minLength={2}
              maxLength={20}
              autoComplete="nickname"
              placeholder="Anh em gọi bạn là gì?"
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>Màu áo của bạn</legend>
            <div className="setup-teams">
              {TEAMS.map((t) => (
                <button
                  type="button"
                  aria-pressed={profile.team === t.id}
                  key={t.id}
                  onClick={() => setProfile({ ...profile, team: t.id })}
                >
                  <b style={{ color: t.color }}>{t.icon}</b>
                  {t.short}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Chọn diện mạo</legend>
            <div className="setup-avatars">
              {Array.from({ length: 8 }, (_, i) => (
                <button
                  type="button"
                  aria-label={`Avatar ${i + 1}`}
                  aria-pressed={profile.avatar === i}
                  key={i}
                  onClick={() => setProfile({ ...profile, avatar: i })}
                >
                  <img src={`/art/fan-${i}.webp`} alt="" />
                </button>
              ))}
            </div>
          </fieldset>
          <p className="auth-feedback is-error" role="status">
            {a.message}
          </p>
          <button className="auth-primary" disabled={a.busy}>
            Vào thế giới →
          </button>
          <button type="button" className="auth-back" onClick={cancel}>
            Quay lại
          </button>
        </form>
      </section>
    </AuthLayout>
  );
}
