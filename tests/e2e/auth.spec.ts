import { test, expect, type Page } from '@playwright/test';
async function guest(page: Page, name = 'Auth Guest') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Chơi ngay không cần tài khoản', exact: true }).click();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill(name);
  await page.getByRole('button', { name: 'Vào thế giới →', exact: true }).click();
  await expect(page.locator('.player-card')).toContainText(name, { timeout: 30000 });
}
for (const [width, height] of [
  [1440, 900],
  [1920, 1080],
  [1366, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
  [430, 932],
])
  test(`auth layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Chơi ngay không cần tài khoản', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(await page.getByRole('button', { name: 'Đăng nhập', exact: true }).count()).toBe(1);
    if (width <= 700) {
      await expect(
        page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }),
      ).toBeHidden();
      await page.getByRole('tab', { name: 'Đăng ký', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeHidden();
      await page.getByRole('tab', { name: 'Đăng nhập', exact: true }).click();
    }
    await page.screenshot({ path: `docs/auth-${width}x${height}.png`, fullPage: true });
  });
test('registration validation, confirmation and wrong password messages', async ({ page }) => {
  await page.goto('/');
  const register = page.locator('#register-panel');
  await register.getByRole('textbox', { name: 'Email', exact: true }).fill('fan@test.invalid');
  await register.getByLabel('Mật khẩu (ít nhất 8 ký tự)', { exact: true }).fill('good-password');
  await register.getByLabel('Nhập lại mật khẩu', { exact: true }).fill('another-password');
  await register.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('chưa trùng');
  await register.getByLabel('Nhập lại mật khẩu', { exact: true }).fill('good-password');
  await register.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('xác minh email');
  const login = page.locator('#login-panel');
  await login.getByRole('textbox', { name: 'Email', exact: true }).fill('fan@test.invalid');
  await login.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password');
  await login.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('chưa đúng');
});
test('forgot password uses neutral message and can go back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('unknown@test.invalid');
  await page.getByRole('button', { name: 'Gửi hướng dẫn' }).click();
  await expect(page.getByRole('status')).toContainText('Nếu địa chỉ');
  await page.getByRole('button', { name: 'Quay lại đăng nhập' }).click();
  await expect(page.locator('#login-panel')).toBeVisible();
});
test('guest joins game, profile persists, wallet blocks paid actions, safe upgrade and logout', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await guest(page, 'Khách Kiểm Thử');
  await expect(page.locator('.area-card')).toContainText('Realtime');
  await page.reload();
  await expect(page.locator('.player-card')).toContainText('Khách Kiểm Thử', { timeout: 30000 });
  await page.getByRole('button', { name: 'Hồ sơ & ví xu' }).click();
  await expect(page.locator('.wallet-balance')).toContainText('0');
  await page.getByRole('button', { name: 'Nạp xu', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Khách cần liên kết');
  await page.getByRole('button', { name: 'Liên kết tài khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục bằng Google', exact: true }).click();
  await expect(page.locator('.upgrade-section')).toContainText('Liên kết khách đang khóa');
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('email login, profile setup, reload and linked wallet unavailable payments', async ({
  page,
}) => {
  await page.goto('/');
  const login = page.locator('#login-panel');
  await login.getByRole('textbox', { name: 'Email', exact: true }).fill('member@test.invalid');
  await login.getByLabel('Mật khẩu', { exact: true }).fill('good-password');
  await login.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill('Fan Thành Viên');
  await page.getByRole('button', { name: 'Vào thế giới →', exact: true }).click();
  await expect(page.locator('.player-card')).toContainText('Thành viên', { timeout: 30000 });
  await page.getByRole('button', { name: 'Hồ sơ & ví xu' }).click();
  await page.getByRole('button', { name: 'Nạp xu', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('chưa được cấu hình');
  await expect(page.locator('.wallet-balance')).toContainText('0');
});
test('expired recovery link and canceled OAuth show actionable errors', async ({ page }) => {
  await page.goto('/auth/reset-password');
  await expect(page.getByText('Liên kết khôi phục không hợp lệ', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại' }).click();
  await page.goto('/auth/callback?error=access_denied');
  await expect(page.getByRole('status')).toContainText('bị hủy');
});

test('disabled OAuth providers show configuration instructions before redirect', async ({
  page,
}) => {
  await page.goto('/');
  for (const provider of ['Google', 'Facebook']) {
    await page
      .locator('#login-panel')
      .getByRole('button', { name: `Tiếp tục bằng ${provider}`, exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText(`${provider} chưa được cấu hình`);
    await expect(page).toHaveURL('http://127.0.0.1:5184/');
  }
});
