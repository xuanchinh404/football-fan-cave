import type { ReactNode } from 'react';
import { Megaphone, MapPin, Users, Sparkles, ShieldCheck } from 'lucide-react';
import './auth.css';
export function AuthHeader() {
  return (
    <header className="auth-brand">
      <span className="brand-ball" aria-hidden="true">
        ⚽
      </span>
      <div className="auth-sign">
        <span>HỘI</span>
        <h1>VÀO HANG</h1>
        <p>Thế giới fan bóng đá</p>
      </div>
      <Megaphone className="brand-horn horn-left" aria-hidden="true" />
      <Megaphone className="brand-horn horn-right" aria-hidden="true" />
    </header>
  );
}
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true" />
      <div className="auth-content">
        <AuthHeader />
        {children}
        <footer className="auth-footer">
          <span>
            <ShieldCheck size={15} /> Kết nối an toàn
          </span>
          <i />
          Chung đam mê · Khác màu áo
        </footer>
      </div>
      <aside className="auth-signposts" aria-label="Khám phá thế giới">
        <span>
          <MapPin />
          Tham quan hang
        </span>
        <span>
          <Users />
          Giao lưu fan
        </span>
        <span>
          <Megaphone />
          Cà khịa vui vẻ
        </span>
        <span>
          <Sparkles />
          Sưu tầm vật phẩm
        </span>
      </aside>
    </main>
  );
}
