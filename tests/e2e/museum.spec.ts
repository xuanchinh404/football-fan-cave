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

async function hall(page: Page, name: string, offline = true) {
  await enter(page, name, offline);
  await walk(page, 2500, 2180);
  await walk(page, 2500, 1100);
  await walk(page, 2048, 1100);
  await expect(page.locator('.interaction-prompt')).toContainText('Phòng Truyền Thống');
  await page.waitForTimeout(250);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).map).toBe('hall-of-legends');
  await page.waitForTimeout(700);
}
test('walk through cave entrance, explore all rendered exhibits, photo and return', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1672, height: 941 });
  await hall(page, 'Fan Di Sản');
  await page.waitForTimeout(4500);
  await page.screenshot({ path: 'docs/hall-of-legends-desktop.png' });
  const entities = await page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('World');
    return s.children.list
      .filter((c: any) => c.getData?.('exhibitId'))
      .map((c: any) => ({ id: c.getData('exhibitId'), group: c.getData('group') }));
  });
  expect(entities.filter((e: any) => e.group === 'league')).toHaveLength(20);
  expect(entities.filter((e: any) => e.group)).toHaveLength(68);
  const { interactions } = await import('../../packages/shared/world');
  // Fixture relocation exercises each real Phaser entity's proximity and keyboard popup.
  for (const item of interactions('hall-of-legends').filter((e) => e.kind === 'exhibit')) {
    await page.evaluate((p) => {
      const s = (window as any).__game.scene.getScene('World');
      s.player.container.setPosition(p.x, p.y);
    }, item);
    await page.keyboard.press('e');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.museum-source')).toHaveAttribute('href', /^https:\/\//);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  // Walk into an actual glass plinth from its free approach.
  await page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('World');
    s.player.container.setPosition(1125, 1095);
  });
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  expect((await state(page)).y).toBeGreaterThanOrEqual(1038);
  await page.getByRole('button', { name: '♜ Đố vui lịch sử' }).click();
  await page.getByRole('button', { name: '1968', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Chính xác');
  await page.keyboard.press('Escape');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '▣ Chụp ảnh kỷ niệm' }).click();
  expect((await download).suggestedFilename()).toBe('hoi-vao-hang.png');
  await page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('World');
    s.player.container.setPosition(1800, 3650);
  });
  await walk(page, 1800, 3710);
  await page.keyboard.press('e');
  await expect.poll(async () => (await state(page)).map).toBe('united');
  expect(errors).toEqual([]);
});
test('mobile museum joystick, readable camera and map', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  // Offline fixture bypasses the long approach already tested on desktop.
  await page.route('**/socket.io/**', (r) => r.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill('Fan Mobile Hall');
  await page.getByRole('dialog').getByRole('button', { name: 'Vào thế giới', exact: true }).click();
  await page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('World');
    s.build('hall-of-legends', { x: 1800, y: 1570 });
  });
  await expect(page.locator('.area-card')).toContainText('Phòng Truyền Thống');
  await page.waitForTimeout(600);
  const before = await state(page),
    r = (await page.locator('.joystick').boundingBox())!;
  await page.mouse.move(r.x + r.width * 0.85, r.y + r.height * 0.5);
  await page.mouse.down();
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(before.x + 20);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Mở bản đồ lớn' }).click();
  await expect(page.getByRole('dialog')).toContainText('Hành lang HLV');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'docs/hall-of-legends-mobile.png' });
});
test('two real guests join museum room and exchange chat and expressions', async ({ browser }) => {
  test.setTimeout(180000);
  const ca = await browser.newContext(),
    cb = await browser.newContext();
  const a = await ca.newPage(),
    b = await cb.newPage();
  try {
    await hall(a, 'Museum A', false);
    await hall(b, 'Museum B', false);
    await expect(a.locator('.area-card')).toContainText('2 người trong phòng');
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await a.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Chào bảo tàng');
    await a.getByRole('button', { name: 'Gửi tin nhắn' }).click();
    await expect(b.locator('.chat-content')).toContainText('Chào bảo tàng');
    await a.getByRole('button', { name: 'Biểu cảm', exact: true }).click();
    await a.getByRole('button', { name: '🔥', exact: true }).click();
    await expect
      .poll(() =>
        b.evaluate(() =>
          [...(window as any).__game.scene.getScene('World').remotes.values()].some(
            (r: any) => !!r.actor.bubble,
          ),
        ),
      )
      .toBe(true);
    await a.locator('.game-canvas canvas').click({ position: { x: 600, y: 350 } });
    await walk(a, 3020, 1570);
    await walk(a, 3020, 3710);
    await walk(a, 1800, 3710);
    await a.keyboard.press('e');
    await expect.poll(async () => (await state(a)).map).toBe('united');
    await expect(b.locator('.area-card')).toContainText('1 người trong phòng');
    await expect.poll(async () => (await state(b)).remotes).toBe(0);
  } finally {
    await ca.close();
    await cb.close();
  }
});
