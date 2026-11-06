import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { open, state, axis, walk, hold, toAvenue } from '../helpers/world3d';
fs.mkdirSync('docs/visual-qa/chelsea', { recursive: true });
test.use({ video: { mode: 'on', size: { width: 1280, height: 720 } } });
async function samplePerformance(page: Page, label: string) {
  const samples = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(250);
    const { fps, drawCalls, triangles, quality } = await state(page);
    samples.push({ fps, drawCalls, triangles, quality });
  }
  fs.writeFileSync(
    `docs/visual-qa/chelsea/${label}-performance.json`,
    JSON.stringify(samples, null, 2) + '\n',
  );
}
async function enterChelsea(page: Page) {
  await toAvenue(page);
  await axis(page, 'x', 15);
  await walk(page, 'w', (s) => s.map === 'chelsea');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}
async function enterMuseum(page: Page, capture = false) {
  await axis(page, 'x', 6.9);
  await axis(page, 'z', -3);
  await axis(page, 'x', 10);
  if (capture) {
    await axis(page, 'z', -6);
    await page.screenshot({ path: 'docs/visual-qa/chelsea/corridor-entry.png' });
    await axis(page, 'z', -14);
    expect((await state(page)).cameraHit ?? 12).toBeGreaterThan(2);
    await page.keyboard.down('w');
    try {
      await page.screenshot({ path: 'docs/visual-qa/chelsea/corridor-walking.png' });
    } finally {
      await page.keyboard.up('w');
    }
  }
  await walk(page, 'w', (s) => s.map === 'chelsea-museum');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}
test('Chelsea online: physical route, collision, exhibits, season panel, orbit and complete return', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, true, 'Fan MU tham quan');
  await enterChelsea(page);
  await expect(page.getByRole('img', { name: 'Bản đồ Hang The Blues', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__world3d.profile.team)).toBe('united');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/refuge.png' });
  await samplePerformance(page, 'refuge-desktop');
  for (const [name, end] of [
    ['right-side', 850],
    ['left-side', 1250],
  ] as const) {
    await page.mouse.move(1050, 430);
    await page.mouse.down();
    await page.mouse.move(end, 430, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `docs/visual-qa/chelsea/${name}.png` });
    await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  }
  await axis(page, 'z', -3.4);
  await page.keyboard.press('e');
  await expect(
    page.getByRole('heading', { name: 'Chelsea 0 – 3 Arsenal', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.modal')).toContainText('KHÔNG PHẢI KẾT QUẢ THẬT');
  await page.keyboard.press('Escape');
  await hold(page, 'w', 700);
  expect((await state(page)).position.z).toBeGreaterThan(-4.5);
  expect((await state(page)).collisions).toBeGreaterThan(0);
  await axis(page, 'z', 0);
  await axis(page, 'x', -7);
  await axis(page, 'z', 3);
  await axis(page, 'x', -10.9);
  await page.keyboard.press('e');
  await expect.poll(async () => page.evaluate(() => (window as any).__world3d.seated)).toBe(true);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/lounge.png' });
  await hold(page, 's', 250);
  await axis(page, 'x', -6.8);
  await axis(page, 'z', 8);
  await enterMuseum(page, true);
  await expect(page.locator('.museum-breadcrumb')).toContainText('Phòng Truyền Thống');
  await expect(
    page.getByRole('img', { name: 'Bản đồ Phòng Truyền Thống Chelsea', exact: true }),
  ).toBeVisible();
  await axis(page, 'z', 8);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/museum.png' });
  await samplePerformance(page, 'museum-desktop');
  // The central aisle and spaces between cabinets remain open.
  await axis(page, 'z', 6);
  await axis(page, 'x', -3);
  await axis(page, 'z', -4.5);
  await axis(page, 'x', -6);
  await axis(page, 'z', -5.9);
  await page.keyboard.press('e');
  await expect(
    page.getByRole('heading', { name: 'UEFA Champions League', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '2020/21', exact: true }).click();
  await expect(page.locator('.modal')).toContainText('Kai Havertz');
  const stopped = await state(page);
  await hold(page, 'w', 250);
  expect((await state(page)).position.z).toBeCloseTo(stopped.position.z, 1);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/trophy-panel.png' });
  await page.keyboard.press('Escape');
  // Collision at the showcase, then circle it through the aisle to the manager gallery.
  await hold(page, 'w', 600);
  expect((await state(page)).position.z).toBeGreaterThan(-6.7);
  await axis(page, 'x', -3);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/trophy-side.png' });
  await axis(page, 'z', -21);
  await axis(page, 'x', 15.3);
  await axis(page, 'z', -22.05);
  await page.keyboard.press('e');
  await expect(
    page.getByRole('heading', { name: 'HLV hiện tại · Xabi Alonso', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.modal')).toContainText('01/07/2026');
  await page.screenshot({ path: 'docs/visual-qa/chelsea/manager.png' });
  await page.keyboard.press('Escape');
  await axis(page, 'z', -20.5);
  await axis(page, 'x', -7.5);
  await axis(page, 'z', -16.5);
  await axis(page, 'x', -11);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/drogba-statue.png' });
  await page.keyboard.press('e');
  await expect(
    page.getByRole('heading', { name: 'Didier Drogba · Huyền thoại The Blues', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await axis(page, 'x', -7.5);
  await axis(page, 'z', -20.5);
  await axis(page, 'x', 16.8);
  await axis(page, 'z', -15.35);
  await axis(page, 'x', 18.9);
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: /1905 · Thành lập/ })).toBeVisible();
  await page.keyboard.press('Escape');
  const before = await state(page);
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(1080, 430);
    await page.mouse.down();
    await page.mouse.move(660, 430, { steps: 16 });
    await page.mouse.up();
  }
  expect((await state(page)).camera.yaw - before.camera.yaw).toBeGreaterThan(Math.PI * 2);
  expect((await state(page)).position.x).toBeCloseTo(before.position.x, 1);
  await page.getByRole('button', { name: 'Nhìn về cổng chính', exact: true }).click();
  await page.screenshot({ path: 'docs/visual-qa/chelsea/reverse-view.png' });
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'x', 21);
  await axis(page, 'z', 18);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'chelsea');
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'z', -3);
  await axis(page, 'x', 6.8);
  await axis(page, 'z', 9);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'plaza');
  expect((await state(page)).position.x).toBeCloseTo(15, 0);
  expect((await state(page)).position.y).toBeGreaterThan(6.8);
  expect(await page.evaluate(() => (window as any).__world3d.profile.nickname)).toBe(
    'Fan MU tham quan',
  );
  expect(errors).toEqual([]);
});
test('Chelsea mobile offline: joystick, camera, jump, safe scene transitions and responsive HUD', async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page, false);
  await enterChelsea(page);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/cave-mobile.png' });
  await samplePerformance(page, 'refuge-mobile-emulation');
  await enterMuseum(page);
  await page.screenshot({ path: 'docs/visual-qa/chelsea/museum-mobile.png' });
  await samplePerformance(page, 'museum-mobile-emulation');
  const initial = await state(page),
    stick = (await page.locator('.joystick').boundingBox())!;
  await page.mouse.move(stick.x + stick.width * 0.82, stick.y + stick.height / 2);
  await page.mouse.down();
  await expect
    .poll(async () => (await state(page)).position.x)
    .toBeGreaterThan(initial.position.x + 0.8);
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).moving).toBe(false);
  await page.mouse.move(300, 400);
  await page.mouse.down();
  await page.mouse.move(90, 400, { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).camera.yaw).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Nhảy', exact: true }).click();
  await expect
    .poll(async () => (await state(page)).position.y, { intervals: [30] })
    .toBeGreaterThan(0.25);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await context.close();
});
test('Chelsea realtime: two authenticated visitors share cave and museum chat, then leave without ghost players', async ({
  browser,
}) => {
  test.setTimeout(150000);
  const ca = await browser.newContext(),
    cb = await browser.newContext(),
    a = await ca.newPage(),
    b = await cb.newPage();
  try {
    await open(a, true, 'Blues Alpha');
    await open(b, true, 'Blues Beta');
    await enterChelsea(a);
    await enterChelsea(b);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await expect.poll(async () => (await state(b)).remotes).toBe(1);
    await a.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Trà nóng ở Hang The Blues');
    await a.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
    await expect(b.locator('.chat-content')).toContainText('Trà nóng ở Hang The Blues');
    await enterMuseum(a);
    await expect.poll(async () => (await state(b)).remotes).toBe(0);
    await enterMuseum(b);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await b.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Cùng nhớ đêm Munich');
    await b.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
    await expect(a.locator('.chat-content')).toContainText('Cùng nhớ đêm Munich');
    await expect(a.locator('.area-card')).toContainText('2 người trong phòng');
    await b.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
    await walk(b, 's', (s) => s.map === 'chelsea');
    await expect.poll(async () => (await state(a)).remotes).toBe(0);
    await expect(a.locator('.chat-content')).not.toContainText('Trà nóng ở Hang The Blues');
  } finally {
    await ca.close();
    await cb.close();
  }
});
