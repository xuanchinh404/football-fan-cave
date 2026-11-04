import { test, expect, type Page } from '@playwright/test';
async function join(page: Page, name = 'Fan Bóng Đá') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill(name);
  await page.getByRole('dialog').getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await expect(page.locator('.player-card')).toContainText(name);
  await expect(page.locator('.area-card')).toContainText('Realtime');
  await page.waitForTimeout(700);
}
async function scene(page: Page) {
  return page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('World');
    return {
      x: s.player.container.x,
      y: s.player.container.y,
      map: s.map,
      remotes: s.remotes.size,
      npcs: s.npcs?.actors.length || 0,
    };
  });
}
async function walkTo(page: Page, axis: 'x' | 'y', target: number) {
  const before = await scene(page);
  const key = axis === 'x' ? (target > before.x ? 'd' : 'a') : target > before.y ? 's' : 'w';
  await page.keyboard.down(key);
  try {
    await expect
      .poll(async () => Math.abs((await scene(page))[axis] - target), {
        timeout: 16000,
        intervals: [50, 80, 100],
      })
      .toBeLessThan(25);
  } finally {
    await page.keyboard.up(key);
  }
}
test('guest moves, collides, visits Red Cave and returns', async ({ page }) => {
  test.setTimeout(90000);
  await join(page);
  await page.keyboard.down('w');
  await expect
    .poll(async () => (await scene(page)).y, { timeout: 15000, intervals: [100] })
    .toBeLessThan(975);
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  const wall = await scene(page);
  expect(wall.y).toBeGreaterThanOrEqual(955);
  expect(wall.y).toBeLessThan(985);
  await walkTo(page, 'x', 1380);
  await walkTo(page, 'y', 600);
  await walkTo(page, 'x', 1280);
  await expect(page.locator('.interaction-prompt')).toContainText('Hang Quỷ Đỏ');
  await page.keyboard.press('e');
  await expect.poll(async () => (await scene(page)).map).toBe('united');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/cave.png' });
  await walkTo(page, 'y', 2700);
  await page.keyboard.press('e');
  await expect.poll(async () => (await scene(page)).map).toBe('plaza');
});
test('two browser sessions see each other and chat realtime', async ({ browser }) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext();
  const a = await ca.newPage(),
    b = await cb.newPage();
  await join(a, 'Người Chơi A');
  await join(b, 'Người Chơi B');
  await expect.poll(async () => (await scene(a)).remotes).toBeGreaterThan(0);
  await a.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Chào từ khán đài A');
  await a.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(b.locator('.chat-content')).toContainText('Chào từ khán đài A');
  await ca.close();
  await cb.close();
});
test('offline demo remains playable, effects and mobile HUD work', async ({ page }) => {
  await page.route('**/socket.io/**', (route) => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill('Khách Offline');
  await page.getByRole('dialog').getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await expect.poll(async () => (await scene(page)).npcs).toBeGreaterThan(0);
  const before = await scene(page);
  const stick = (await page.locator('.joystick').boundingBox())!;
  await page.mouse.move(stick.x + stick.width * 0.85, stick.y + stick.height / 2);
  await page.mouse.down();
  await expect
    .poll(async () => (await scene(page)).x, { timeout: 7000 })
    .toBeGreaterThan(before.x + 15);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Cà khịa', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xem thử', exact: true }).first().click();
  await expect(page.locator('.toast')).toContainText('Không phát sinh thanh toán');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'docs/mobile.png' });
});

test('browser can disconnect to NPC demo and reconnect to a new live session', async ({ page }) => {
  await join(page, 'Fan Kết Nối');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Chơi demo ngoại tuyến' }).click();
  await expect(page.locator('.online-pill')).toContainText('Chế độ khám phá');
  await expect.poll(async () => (await scene(page)).npcs).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Kết nối lại multiplayer' }).click();
  await expect(page.locator('.area-card')).toContainText('Realtime');
  await expect.poll(async () => (await scene(page)).npcs).toBe(0);
});
