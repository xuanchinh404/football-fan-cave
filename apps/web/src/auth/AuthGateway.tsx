import { lazy, Suspense, useEffect, useState } from 'react';
import type { Profile } from '../../../../packages/shared/world';
import { AuthPage, useAuthAction } from './AuthPage';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './AuthForms';
import { useAuth } from './useAuth';
import { loadProfile, saveProfile } from './profileService';
import { errorMessage, logout, resetPassword } from './authService';
import { PlayerProfileSetup } from './PlayerProfileSetup';
import { WalletPanel } from '../account/WalletPanel';
import { socket } from '../network/client';
const Game = lazy(() => import('../App'));
export default function AuthGateway() {
  const auth = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [wallet, setWallet] = useState(false),
    [editing, setEditing] = useState(false),
    [revision, setRevision] = useState(0),
    [loadedId, setLoadedId] = useState('');
  const a = useAuthAction();
  const user = auth.session?.user;
  useEffect(() => {
    let active = true;
    setProfile(null);
    setLoadedId('');
    if (!user) {
      socket.disconnect();
      return;
    }
    setLoading(true);
    setError('');
    loadProfile(user.id)
      .then((p) => {
        if (active) {
          setProfile(p);
          setLoadedId(user.id);
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, revision]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search),
      hash = new URLSearchParams(window.location.hash.slice(1));
    if (params.has('error') || hash.has('error')) {
      setError('Đăng nhập đã bị hủy hoặc liên kết hết hạn. Vui lòng thử lại.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (user && window.location.pathname === '/auth/callback')
      window.history.replaceState({}, '', '/');
  }, [user?.id]);
  async function signOut() {
    socket.disconnect();
    await logout();
    setWallet(false);
    setEditing(false);
    window.history.replaceState({}, '', '/');
  }
  if (auth.loading)
    return (
      <AuthLayout>
        <section className="auth-card auth-narrow" role="status">
          Đang khôi phục phiên đăng nhập…
        </section>
      </AuthLayout>
    );
  if (auth.recovery)
    return (
      <AuthLayout>
        <section className="auth-card auth-narrow">
          <h2>Đặt mật khẩu mới</h2>
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                void a.run(async () => {
                  if (d.get('password') !== d.get('confirm'))
                    throw new Error('Mật khẩu nhập lại chưa trùng khớp.');
                  await resetPassword(String(d.get('password')));
                  await signOut();
                  auth.setRecovery(false);
                }, 'Mật khẩu đã thay đổi. Hãy đăng nhập lại.');
              }}
            >
              <PasswordField fresh />
              <PasswordField name="confirm" label="Nhập lại mật khẩu" fresh />
              <button className="auth-primary" disabled={a.busy}>
                Lưu mật khẩu mới
              </button>
            </form>
          ) : (
            <p>Liên kết khôi phục không hợp lệ hoặc đã hết hạn. Hãy yêu cầu email khôi phục mới.</p>
          )}
          <p className="auth-feedback is-error" role="status">
            {a.message}
          </p>
          <button
            className="auth-back"
            onClick={() => {
              auth.setRecovery(false);
              window.history.replaceState({}, '', '/');
            }}
          >
            ← Quay lại
          </button>
        </section>
      </AuthLayout>
    );
  if (!user) return <AuthPage initialError={error || auth.error} />;
  if (loading || (!loadedId && !error))
    return (
      <AuthLayout>
        <section className="auth-card auth-narrow" role="status">
          Đang khôi phục hồ sơ và hành trang…
        </section>
      </AuthLayout>
    );
  if (error)
    return (
      <AuthLayout>
        <section className="auth-card auth-narrow">
          <h2>Chưa thể tải hồ sơ</h2>
          <p role="alert">{error}</p>
          <button className="auth-primary" onClick={() => setRevision((v) => v + 1)}>
            Thử lại
          </button>
          <button className="auth-back" onClick={() => void a.run(signOut)}>
            Đăng xuất
          </button>
        </section>
      </AuthLayout>
    );
  if (!profile || editing)
    return (
      <PlayerProfileSetup
        initial={profile || undefined}
        cancel={() => {
          if (profile) setEditing(false);
          else void a.run(signOut);
        }}
        save={async (p) => {
          await saveProfile(user.id, p);
          setProfile(p);
          setEditing(false);
        }}
      />
    );
  return (
    <>
      <Suspense
        fallback={
          <AuthLayout>
            <section className="auth-card auth-narrow">Đang mở cổng hang…</section>
          </AuthLayout>
        }
      >
        <Game key={user.id} accountProfile={profile} isGuest={!!user.is_anonymous} />
      </Suspense>
      {auth.error && <div className="auth-session-error" role="status">{auth.error}</div>}
      <button className="account-launcher" onClick={() => setWallet(true)}>
        🪙 Hồ sơ & ví xu
      </button>
      {wallet && (
        <WalletPanel
          guest={!!user.is_anonymous}
          close={() => setWallet(false)}
          logout={signOut}
          edit={() => {
            setWallet(false);
            setEditing(true);
          }}
        />
      )}
    </>
  );
}
