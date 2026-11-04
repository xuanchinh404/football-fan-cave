import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, LockKeyhole, Gamepad2 } from 'lucide-react';
import * as auth from './authService';
export type Action = (fn: () => Promise<unknown>, success?: string) => Promise<void>;
export function PasswordField({
  label = 'Mật khẩu',
  name = 'password',
  fresh = false,
}: {
  label?: string;
  name?: string;
  fresh?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="auth-input">
      <LockKeyhole size={18} />
      <input
        aria-label={label}
        placeholder={label}
        name={name}
        type={show ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete={fresh ? 'new-password' : 'current-password'}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={`${show ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </label>
  );
}
function EmailField() {
  return (
    <label className="auth-input">
      <Mail size={18} />
      <input
        aria-label="Email"
        placeholder="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />
    </label>
  );
}
export function SocialLoginButtons({
  run,
  busy,
  link = false,
}: {
  run: Action;
  busy: boolean;
  link?: boolean;
}) {
  return (
    <div className="social-buttons">
      <button
        type="button"
        className="social-google"
        disabled={busy}
        onClick={() => void run(() => auth.socialLogin('google', link))}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21">
          <path
            fill="#4285F4"
            d="M22.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.6 3.3-7.9Z"
          />
          <path
            fill="#34A853"
            d="M12 23c3 0 5.5-1 7.3-2.9l-3.5-2.7a6.7 6.7 0 0 1-10-3.5H2.2v2.8A11 11 0 0 0 12 23Z"
          />
          <path fill="#FBBC05" d="M5.8 13.9a6.6 6.6 0 0 1 0-3.8V7.3H2.2a11 11 0 0 0 0 9.4Z" />
          <path
            fill="#EA4335"
            d="M12 5.4c1.7 0 3.1.6 4.3 1.7l3.2-3.2A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.8 6.3l3.6 2.8A6.5 6.5 0 0 1 12 5.4Z"
          />
        </svg>
        Tiếp tục bằng Google
      </button>
      <button
        type="button"
        className="social-facebook"
        disabled={busy}
        onClick={() => void run(() => auth.socialLogin('facebook', link))}
      >
        <b aria-hidden="true">f</b>Tiếp tục bằng Facebook
      </button>
    </div>
  );
}
export function LoginForm({
  run,
  busy,
  forgot,
}: {
  run: Action;
  busy: boolean;
  forgot: () => void;
}) {
  const lock = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    const d = new FormData(e.currentTarget);
    try {
      await run(() => auth.login(String(d.get('email')), String(d.get('password'))));
    } finally {
      lock.current = false;
    }
  }
  return (
    <form onSubmit={submit}>
      <SocialLoginButtons run={run} busy={busy} />
      <div className="auth-divider">Hoặc đăng nhập bằng email</div>
      <EmailField />
      <PasswordField />
      <div className="auth-form-options">
        <span>Phiên đăng nhập được lưu an toàn</span>
        <button type="button" onClick={forgot}>
          Quên mật khẩu?
        </button>
      </div>
      <button className="auth-primary" disabled={busy}>
        {busy ? 'Đang xử lý…' : 'Đăng nhập'}
        <ArrowRight size={20} />
      </button>
    </form>
  );
}
export function RegisterForm({ run, busy }: { run: Action; busy: boolean }) {
  const lock = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    const d = new FormData(e.currentTarget);
    try {
      await run(async () => {
        if (d.get('password') !== d.get('confirm'))
          throw new Error('Mật khẩu nhập lại chưa trùng khớp.');
        await auth.register(String(d.get('email')), String(d.get('password')));
      }, 'Kiểm tra hộp thư để xác minh email nếu được yêu cầu. Sau đó quay lại đăng nhập.');
    } finally {
      lock.current = false;
    }
  }
  return (
    <form onSubmit={submit}>
      <SocialLoginButtons run={run} busy={busy} />
      <div className="auth-divider">Hoặc đăng ký bằng email</div>
      <EmailField />
      <PasswordField label="Mật khẩu (ít nhất 8 ký tự)" fresh />
      <PasswordField name="confirm" label="Nhập lại mật khẩu" fresh />
      <button className="auth-primary" disabled={busy}>
        {busy ? 'Đang xử lý…' : 'Đăng ký tài khoản'}
        <ArrowRight size={20} />
      </button>
    </form>
  );
}
export function ForgotPasswordForm({
  run,
  busy,
  back,
}: {
  run: Action;
  busy: boolean;
  back: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void run(
          () => auth.requestReset(String(d.get('email'))),
          'Nếu địa chỉ có thể nhận thư khôi phục, bạn sẽ nhận được hướng dẫn. Hãy kiểm tra cả thư rác.',
        );
      }}
    >
      <h2>Quên mật khẩu?</h2>
      <p>Nhập email để nhận hướng dẫn khôi phục.</p>
      <EmailField />
      <button className="auth-primary" disabled={busy}>
        Gửi hướng dẫn
        <ArrowRight size={18} />
      </button>
      <button className="auth-back" type="button" onClick={back}>
        ← Quay lại đăng nhập
      </button>
    </form>
  );
}
export function GuestPlayButton({ run, busy }: { run: Action; busy: boolean }) {
  return (
    <button className="auth-guest" disabled={busy} onClick={() => void run(auth.guestLogin)}>
      <Gamepad2 size={24} />
      Chơi ngay không cần tài khoản
    </button>
  );
}
