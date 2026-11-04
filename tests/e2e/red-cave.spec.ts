import { test, expect, type Page } from '@playwright/test';
async function state(page: Page) {
  return page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('World');
    return {
      x: s.player.container.x,
      y: s.player.container.y,
      map: s.map,
      seated: s.seated,
      remotes: s.remotes.size,
      cameraX: s.cameras.main.scrollX,
      cameraY: s.cameras.main.scrollY,
      npcs: s.npcs?.actors.length || 0,
    };
  });
}
async function walk(page: Page, x: number, y: number) {
  for (const [axis, target] of [
    ['x', x],
    ['y', y],
  ] as const) {
    const p = await state(page);
    if (Math.abs(p[axis] - target) < 12) continue;
    const key = axis === 'x' ? (target > p.x ? 'd' : 'a') : target > p.y ? 's' : 'w';
    await page.keyboard.down(key);
    try {
      await expect
        .poll(
          async () => {
            const current = (await state(page))[axis];
            return (
              Math.abs(current - target) < 12 ||
              (target > p[axis] ? current >= target : current <= target)
            );
          },
          {
            timeout: 20000,
            intervals: [30],
          },
        )
        .toBe(true);
    } finally {
      await page.keyboard.up(key);
    }
    // Correct overshoot caused by a delayed poll without teleporting the actor.
    for (let i = 0; i < 4; i++) {
      const current = (await state(page))[axis],
        distance = target - current;
      if (Math.abs(distance) < 16) break;
      const correction = axis === 'x' ? (distance > 0 ? 'd' : 'a') : distance > 0 ? 's' : 'w';
      await page.keyboard.down(correction);
      await page.waitForTimeout(Math.min(250, Math.max(35, (Math.abs(distance) / 220) * 1000)));
      await page.keyboard.up(correction);
    }
    expect(Math.abs((await state(page))[axis] - target)).toBeLessThan(25);
  }
}
async function enter(page: Page, name: string, offline = false) {
  if (offline) await page.route('**/socket.io/**', (r) => r.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill(name);
  await page.getByRole('dialog').getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await expect(page.locator('.player-card')).toContainText(name);
  if (!offline) await expect(page.locator('.area-card')).toContainText('Realtime');
  await page.waitForTimeout(650);
  await walk(page, 1380, 600);
  await walk(page, 1280, 600);
  await expect(page.locator('.interaction-prompt')).toContainText('Hang Quỷ Đỏ');
  await page.waitForTimeout(160);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).map).toBe('united');
  await page.waitForTimeout(500);
}
test('cave walking, camera, statue, board, screen, seats, shop and both alcoves', async ({
  page,
}) => {
  test.setTimeout(300000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await enter(page, 'Fan Khám Phá', true);
  expect((await state(page)).npcs).toBeGreaterThan(10);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Đang tắt', exact: true }).click();
  await expect.poll(async () => (await state(page)).map).toBe('united');
  await page.getByRole('button', { name: 'Đang bật', exact: true }).click();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.screenshot({ path: 'docs/red-cave-hall.png' });
  const initial = await state(page);
  await walk(page, 2048, 1810);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('Ngọn lửa chung một hội');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  // Walk directly into the solid statue, then retreat.
  await page.keyboard.down('w');
  await page.waitForTimeout(900);
  await page.keyboard.up('w');
  expect((await state(page)).y).toBeGreaterThanOrEqual(1743);
  await walk(page, 2048, 2010);
  await walk(page, 1560, 2010);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('Hôm nay trong hang');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await walk(page, 1300, 2010);
  await walk(page, 1300, 1320);
  await walk(page, 920, 1320);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('DỮ LIỆU MINH HỌA');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await walk(page, 840, 1450);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).seated).toBe(true);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).seated).toBe(false);
  await walk(page, 1300, 1450);
  await walk(page, 1300, 1020);
  await walk(page, 1040, 1020);
  await walk(page, 1040, 800);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).y).toBeLessThan(600);
  await page.waitForTimeout(350);
  await walk(page, 700, 490);
  const photo = page.waitForEvent('download', { timeout: 8000 });
  await page.keyboard.press('e');
  expect((await photo).suggestedFilename()).toBe('hoi-vao-hang.png');
  await walk(page, 840, 640);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).y).toBeGreaterThan(850);
  await page.waitForTimeout(350);
  await walk(page, 1040, 1020);
  await walk(page, 1600, 1020);
  await walk(page, 1600, 1100);
  await walk(page, 2500, 1100);
  await walk(page, 3100, 1100);
  await walk(page, 3100, 800);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).y).toBeLessThan(600);
  await page.waitForTimeout(350);
  await walk(page, 3460, 530);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('Hội ngộ trước giờ bóng lăn');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await walk(page, 3260, 640);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).y).toBeGreaterThan(850);
  await page.waitForTimeout(350);
  await walk(page, 3100, 1100);
  await walk(page, 2800, 1100);
  await walk(page, 2800, 1810);
  await walk(page, 3190, 1810);
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog', { name: 'Quầy Cà Khịa' })).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Xem thử', exact: true })
    .first()
    .click();
  await expect(page.locator('.toast')).toContainText('Không phát sinh thanh toán');
  const last = await state(page);
  expect(last.cameraX).not.toBe(initial.cameraX);
  const marker = page.locator('.mini-map [data-player-x]');
  await expect(marker).toHaveAttribute('data-player-x', String(Math.round(last.x)));
  expect(errors).toEqual([]);
});
test('two real guests share red cave room, room chat, nearby chat, emoji and leave room', async ({
  browser,
}) => {
  test.setTimeout(100000);
  const ca = await browser.newContext(),
    cb = await browser.newContext();
  const a = await ca.newPage(),
    b = await cb.newPage();
  try {
    await enter(a, 'Cave A');
    await enter(b, 'Cave B');
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await expect(a.locator('.area-card')).toContainText('2 người trong phòng');
    await a.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Chào trong Hang Quỷ Đỏ');
    await a.getByRole('button', { name: 'Gửi tin nhắn' }).click();
    await expect(b.locator('.chat-content')).toContainText('Chào trong Hang Quỷ Đỏ');
    await a.getByRole('button', { name: 'Gần bạn', exact: true }).click();
    await b.getByRole('button', { name: 'Gần bạn', exact: true }).click();
    await a.waitForTimeout(1400);
    await a.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Chào người gần bạn');
    await a.getByRole('button', { name: 'Gửi tin nhắn' }).click();
    await expect(b.locator('.chat-content')).toContainText('Chào người gần bạn');
    await a.getByRole('button', { name: 'Biểu cảm', exact: true }).click();
    await a.getByRole('button', { name: '🔥', exact: true }).click();
    await expect
      .poll(() =>
        b.evaluate(() => {
          const s = (window as any).__game.scene.getScene('World');
          return [...s.remotes.values()].some((r: any) => !!r.actor.bubble);
        }),
      )
      .toBe(true);
    // Blur chat before walking back to the world portal.
    await a.locator('.game-canvas canvas').click({ position: { x: 600, y: 400 } });
    await walk(a, 2048, 2700);
    await a.keyboard.press('e');
    await expect.poll(async () => (await state(a)).map).toBe('plaza');
    await expect.poll(async () => (await state(b)).remotes).toBe(0);
    const p = await state(a);
    expect(Math.abs(p.x - 1280)).toBeLessThan(3);
    expect(Math.abs(p.y - 640)).toBeLessThan(3);
    await expect(b.locator('.area-card')).toContainText('1 người trong phòng');
  } finally {
    await ca.close();
    await cb.close();
  }
});

test('mobile cave joystick, interaction dock, minimap and screenshot work', async ({ page }) => {
  test.setTimeout(70000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page, 'Fan Mobile', true);
  const before = await state(page),
    r = (await page.locator('.joystick').boundingBox())!;
  await page.mouse.move(r.x + r.width * 0.85, r.y + r.height * 0.5);
  await page.mouse.down();
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(before.x + 20);
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Tương tác', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Mở bản đồ lớn' }).click();
  await expect(page.getByRole('dialog')).toContainText('Khu sự kiện');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Chụp ảnh', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('hoi-vao-hang.png');
  await page.screenshot({ path: 'docs/red-cave-mobile.png' });
});
