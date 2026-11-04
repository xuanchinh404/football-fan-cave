import { SocialLoginButtons } from '../auth/AuthForms';
import { useAuthAction } from '../auth/AuthPage';
export function AccountUpgradeDialog() {
  const a = useAuthAction();
  return (
    <section className="upgrade-section">
      <h3>Giữ nguyên hồ sơ khách</h3>
      <p>
        Liên kết danh tính mới giữ nguyên ID, ví và vật phẩm. Nếu danh tính đã thuộc tài khoản khác,
        hệ thống sẽ dừng; không tự động gộp dữ liệu.
      </p>
      <SocialLoginButtons {...a} link />
      <p className="auth-feedback is-error" role="status">
        {a.message}
      </p>
      <p>
        Để dùng tài khoản đã tồn tại, hãy đăng xuất rồi đăng nhập tài khoản đó. Tiến trình khách
        không được chuyển.
      </p>
    </section>
  );
}
