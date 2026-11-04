import { useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import {
  ForgotPasswordForm,
  GuestPlayButton,
  LoginForm,
  RegisterForm,
  type Action,
} from './AuthForms';
import { errorMessage } from './authService';
export function useAuthAction() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false);
  const lock = useRef(false);
  const run: Action = async (fn, success) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      await fn();
      if (success) setMessage(success);
    } catch (e) {
      setFailed(true);
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return { run, busy, message, failed };
}
export function AuthPage({ initialError = '' }: { initialError?: string }) {
  const [tab, setTab] = useState<'login' | 'register'>('login'),
    [forgot, setForgot] = useState(false);
  const a = useAuthAction();
  return (
    <AuthLayout>
      <section
        className={`auth-card ${forgot ? 'auth-narrow' : ''}`}
        aria-label="Tài khoản Hội Vào Hang"
      >
        <div className="auth-tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
          <button
            role="tab"
            id="login-tab"
            aria-controls="login-panel"
            aria-selected={tab === 'login'}
            onClick={() => {
              setTab('login');
              setForgot(false);
            }}
          >
            Đăng nhập
          </button>
          <button
            role="tab"
            id="register-tab"
            aria-controls="register-panel"
            aria-selected={tab === 'register'}
            onClick={() => {
              setTab('register');
              setForgot(false);
            }}
          >
            Đăng ký
          </button>
        </div>
        {forgot ? (
          <ForgotPasswordForm {...a} back={() => setForgot(false)} />
        ) : (
          <div className="auth-columns">
            <section
              id="login-panel"
              role="tabpanel"
              aria-labelledby="login-tab"
              className={tab === 'login' ? 'selected' : ''}
            >
              <LoginForm {...a} forgot={() => setForgot(true)} />
            </section>
            <div className="auth-or" aria-hidden="true">
              <span>Hoặc</span>
            </div>
            <section
              id="register-panel"
              role="tabpanel"
              aria-labelledby="register-tab"
              className={tab === 'register' ? 'selected' : ''}
            >
              <RegisterForm {...a} />
            </section>
          </div>
        )}
        <div
          className={`auth-feedback ${a.failed || initialError ? 'is-error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {a.message || initialError}
        </div>
        <div className="guest-area">
          <div className="auth-divider guest-divider">Hoặc</div>
          <GuestPlayButton {...a} />
          <p>
            <Info size={14} />
            Bạn có thể vào hang khám phá miễn phí,
            <br className="mobile-break" /> đăng ký sau khi muốn nạp xu hoặc lưu tiến trình.
          </p>
        </div>
      </section>
    </AuthLayout>
  );
}
