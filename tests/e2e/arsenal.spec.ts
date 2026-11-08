import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { axis, hold, open, state, toAvenue, walk } from '../helpers/world3d';

const output = process.env.FFC_ARSENAL_SHOTS || 'docs/visual-qa/arsenal';
const capture = (page: Page, name: string) => page.screenshot({ path: `${output}/${name}.png` });
const resetCamera = (page: Page) =>
  page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
async function rotate(page: Page, delta: number) {
  await page.mouse.move(780, 430);
  await page.mouse.down();
  await page.mouse.move(780 + delta, 430, { steps: 14 });
  await page.mouse.up();
}
async function enterCave(page: Page) {
  await toAvenue(page);
  await axis(page, 'x', -30);
  await walk(page, 'w', (s) => s.map === 'arsenal' && s.position.z <= 11);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}
async function enterMuseum(page: Page, photos = false) {
  await axis(page, 'x', 12.1);
  await axis(page, 'z', -10.5);
  if (photos) await capture(page, 'corridor-entry');
  await axis(page, 'z', -20.1);
  expect((await state(page)).cameraHit ?? 12).toBeGreaterThan(2);
  if (photos) await capture(page, 'corridor');
  await walk(page, 'w', (s) => s.map === 'arsenal-museum');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}
async function inspect(page: Page, title: string) {
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
async function chat(page: Page, line: string) {
  await page.getByRole('textbox', { name: 'Tin nhắn chat' }).fill(line);
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
}

test('Arsenal online: walk through fortress, stairs, exhibits, and both return gates', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, true, 'Fan MU Arsenal');
  await enterCave(page);
  expect(await page.evaluate(() => (window as any).__world3d.profile.team)).toBe('united');
  await expect(page.getByRole('img', { name: 'Bản đồ Hang Arsenal' })).toBeVisible();
  await expect(page.locator('.area-card')).toContainText('Hang Pháo Thủ');
  await expect.poll(async () => (await state(page)).fps).toBeGreaterThan(20);
  // Wait for the asynchronous masonry GLB and the room lighting to settle.
  await page.waitForTimeout(1100);
  await capture(page, 'refuge');
  for (const [label, delta] of [
    ['left', 145],
    ['right', -145],
  ] as const) {
    await rotate(page, delta);
    await capture(page, 'refuge-' + label);
    await resetCamera(page);
  }
  await axis(page, 'z', -9.1);
  expect((await state(page)).position.y).toBeGreaterThan(0.7);
  await hold(page, 'w', 800);
  expect((await state(page)).position.z).toBeGreaterThan(-11.2);
  expect((await state(page)).collisions).toBeGreaterThan(0);
  await axis(page, 'z', 0);
  await axis(page, 'z', 2.9);
  await axis(page, 'x', 9.2);
  await inspect(page, 'Arsenal 1 – 2 Tottenham');
  await expect(page.getByRole('dialog')).toContainText('KHÔNG PHẢI KẾT QUẢ THẬT');
  await page.keyboard.press('Escape');
  await chat(page, 'Gặp lại ở sảnh Pháo Thủ');
  await expect(page.locator('.chat-content')).toContainText('Gặp lại ở sảnh Pháo Thủ');
  await axis(page, 'z', 5.42);
  await axis(page, 'x', -12.7);
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => (window as any).__world3d.seated)).toBe(true);
  await capture(page, 'lounge');
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => (window as any).__world3d.seated)).toBe(false);
  await axis(page, 'x', -7.7);
  await axis(page, 'z', 7.8);
  await enterMuseum(page, true);
  await expect(page.getByRole('img', { name: 'Bản đồ Phòng Truyền Thống Arsenal' })).toBeVisible();
  await expect(page.locator('.chat-content')).not.toContainText('Gặp lại ở sảnh Pháo Thủ');
  await axis(page, 'z', 12);
  await capture(page, 'museum');
  await axis(page, 'z', 1);
  await axis(page, 'x', -4);
  await axis(page, 'z', -2.36);
  await capture(page, 'trophy-close');
  await inspect(page, 'Vô địch Anh');
  await page.getByRole('button', { name: '2025/26', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('22 năm');
  await page.keyboard.press('Escape');
  await hold(page, 'w', 500);
  expect((await state(page)).position.z).toBeGreaterThan(-2.95);
  await axis(page, 'x', -7);
  await axis(page, 'z', -7.5);
  await axis(page, 'x', -13);
  await axis(page, 'z', -11.35);
  await rotate(page, -85);
  await capture(page, 'wenger-pedestal');
  await resetCamera(page);
  await inspect(page, 'Arsène Wenger · 1996–2018');
  await expect(page.getByRole('dialog')).toContainText('Tượng chân dung đang chờ');
  await page.keyboard.press('Escape');
  await axis(page, 'z', -7.5);
  await axis(page, 'x', 0);
  await axis(page, 'z', -19.7);
  await axis(page, 'x', 13.85);
  await capture(page, 'manager-gallery');
  await inspect(page, 'Mikel Arteta');
  await expect(page.getByRole('dialog')).toContainText('tháng 10/2026');
  await page.keyboard.press('Escape');
  await axis(page, 'x', 20.6);
  await axis(page, 'z', -15.62);
  await axis(page, 'x', 18.75);
  await capture(page, 'history');
  await inspect(page, '1886 · Thành lập CLB');
  await page.keyboard.press('Escape');
  const yaw = (await state(page)).camera.yaw;
  for (let i = 0; i < 3; i++) await rotate(page, -400);
  expect((await state(page)).camera.yaw - yaw).toBeGreaterThan(Math.PI * 2);
  await resetCamera(page);
  await axis(page, 'x', 20.6);
  await axis(page, 'z', 18.25);
  await axis(page, 'x', 0);
  await page.getByRole('button', { name: 'Nhìn về cổng chính', exact: true }).click();
  await capture(page, 'reverse');
  await resetCamera(page);
  await walk(page, 's', (s) => s.map === 'arsenal');
  await expect(page.locator('.chat-content')).toContainText('Gặp lại ở sảnh Pháo Thủ');
  await resetCamera(page);
  await axis(page, 'z', 5.4);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'plaza');
  const returned = await state(page);
  expect(returned.position.x).toBeCloseTo(-30, 0);
  expect(returned.position.y).toBeGreaterThan(6.8);
  expect(errors).toEqual([]);
});

test('Arsenal mobile: responsive HUD, joystick and touch exhibit', async ({ browser }) => {
  test.setTimeout(90000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await open(page, false);
    await enterCave(page);
    await capture(page, 'mobile-cave');
    const stick = (await page.locator('.joystick').boundingBox())!;
    const x = (await state(page)).position.x;
    await page.mouse.move(stick.x + stick.width * 0.8, stick.y + stick.height / 2);
    await page.mouse.down();
    try {
      await expect.poll(async () => (await state(page)).position.x).toBeGreaterThan(x + 0.8);
    } finally {
      await page.mouse.up();
    }
    await enterMuseum(page);
    await capture(page, 'mobile-museum');
    await axis(page, 'z', 10.15);
    await axis(page, 'x', 5.5);
    await page
      .getByRole('button', { name: /Khám phá · White Hart Lane 2004/ })
      .first()
      .tap();
    await expect(
      page.getByRole('heading', { name: 'White Hart Lane 2004', exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  } finally {
    await context.close();
  }
});

test('Arsenal realtime separates occupants and chat across both rooms', async ({ browser }) => {
  test.setTimeout(150000);
  const first = await browser.newContext(),
    second = await browser.newContext();
  try {
    const a = await first.newPage(),
      b = await second.newPage();
    await open(a, true, 'Arsenal Alpha');
    await open(b, true, 'Arsenal Beta');
    await enterCave(a);
    await enterCave(b);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await chat(a, 'Pháo thủ cùng vào hang');
    await expect(b.locator('.chat-content')).toContainText('Pháo thủ cùng vào hang');
    await enterMuseum(a);
    await expect.poll(async () => (await state(b)).remotes).toBe(0);
    await enterMuseum(b);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await chat(b, 'Gặp nhau trong bảo tàng');
    await expect(a.locator('.chat-content')).toContainText('Gặp nhau trong bảo tàng');
    await expect(a.locator('.area-card')).toContainText('2 người trong phòng');
    await walk(b, 's', (s) => s.map === 'arsenal');
    await expect.poll(async () => (await state(a)).remotes).toBe(0);
    await expect(b.locator('.chat-content')).toContainText('Pháo thủ cùng vào hang');
  } finally {
    await first.close();
    await second.close();
  }
});
