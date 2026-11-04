import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
type State = {
  map: string;
  position: { x: number; y: number; z: number };
  camera: { x: number; y: number; z: number; yaw: number; pitch: number };
  triangles: number;
  grounded: boolean;
  moving: boolean;
  collisions: number;
  remotes: number;
  fps: number;
  quality: string;
  caves: { id: string; tier: number; height: number }[];
  drawCalls: number;
  view: string;
};
async function state(page: Page): Promise<State> {
  return JSON.parse((await page.locator('canvas').getAttribute('data-world')) || '{}');
}
async function loginFixture(page: Page, name: string) {
  const result = await fetch('http://127.0.0.1:3100/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: name + '@test.invalid', password: 'good-password' }),
  });
  const session = await result.json();
  await fetch('http://127.0.0.1:3100/rest/v1/profiles', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ nickname: name, favorite_team: 'united', avatar_key: 0 }),
  });
  await page.addInitScript(
    (s) => localStorage.setItem('sb-127-auth-token', JSON.stringify(s)),
    session,
  );
}
async function open(page: Page, live = true, name = 'Fan QA') {
  page.on('pageerror', (e) => console.log('Browser error:', e.message));
  if (live) await loginFixture(page, name);
  else await page.route('**/socket.io/**', (r) => r.abort());
  await page.goto('/playtest');
  await expect
    .poll(
      async () => {
        if (await page.locator('.three-error[role="alert"]').count())
          throw new Error(
            'Renderer failure: ' + (await page.locator('.three-error[role="alert"]').textContent()),
          );
        return (await state(page)).triangles;
      },
      { timeout: 30000 },
    )
    .toBeGreaterThan(100000);
  await expect(page.locator('.loading-world')).toHaveCount(0);
  if (live) await expect(page.locator('.area-card')).toContainText('Realtime');
}
async function hold(page: Page, key: string, ms: number) {
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(ms);
  } finally {
    await page.keyboard.up(key);
  }
}
async function walk(page: Page, key: string, condition: (s: State) => boolean, timeout = 20000) {
  await page.keyboard.down('Shift');
  await page.keyboard.down(key);
  try {
    await expect
      .poll(async () => condition(await state(page)), { timeout, intervals: [50] })
      .toBe(true);
  } catch (error) {
    throw new Error(`Walk ${key}: ${JSON.stringify(await state(page))}. ${error}`);
  } finally {
    await page.keyboard.up(key);
    await page.keyboard.up('Shift');
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
}
async function axis(page: Page, key: 'x' | 'z', target: number) {
  const p = (await state(page)).position,
    forward = p[key] < target;
  await walk(page, key === 'x' ? (forward ? 'd' : 'a') : forward ? 's' : 'w', (s) =>
    forward ? s.position[key] >= target : s.position[key] <= target,
  );
}
async function toAvenue(page: Page) {
  await axis(page, 'x', 6);
  await axis(page, 'z', -3.8);
  await axis(page, 'x', 0);
  await axis(page, 'z', -24);
  expect((await state(page)).position.y).toBeGreaterThan(6.8);
}
async function performanceSample(page: Page, label: string) {
  const samples: number[] = [];
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(250);
    samples.push((await state(page)).fps);
  }
  const s = await state(page);
  const gpu = await page.locator('canvas').evaluate((el: HTMLCanvasElement) => {
    const gl = el.getContext('webgl2')!;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  const path = 'docs/grand-hall-performance.json';
  const old = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {};
  old[label] = {
    date: new Date().toISOString(),
    cpu: os.cpus()[0]?.model,
    platform: os.platform(),
    arch: os.arch(),
    viewport: page.viewportSize(),
    quality: s.quality,
    gpu,
    fps: samples,
    min: Math.min(...samples),
    median: [...samples].sort((a, b) => a - b)[6],
    max: Math.max(...samples),
    drawCalls: s.drawCalls,
    triangles: s.triangles,
    note: label.includes('mobile')
      ? 'Chromium viewport emulation, not a physical phone'
      : 'Local Chromium on this Mac',
  };
  fs.writeFileSync(path, JSON.stringify(old, null, 2));
}

test('nine caves, 360 orbit, zoom, physical tiers, Bayern/PSG/Real/Barcelona and MU return', async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);
  expect((await state(page)).caves).toHaveLength(9);
  expect((await state(page)).caves.filter((c) => c.tier === 3).map((c) => c.id)).toEqual([
    'bayern',
    'psg',
  ]);
  await page.screenshot({ path: 'docs/grand-hall-default.png' });
  await performanceSample(page, 'desktop-medium');
  const initial = await state(page);
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(1100, 420);
    await page.mouse.down();
    await page.mouse.move(700, 420, { steps: 18 });
    await page.mouse.up();
  }
  await expect.poll(async () => (await state(page)).camera.yaw).toBeGreaterThan(Math.PI * 2);
  expect(Math.abs((await state(page)).position.z - initial.position.z)).toBeLessThan(0.1);
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  const beforeZoom = await state(page);
  await page.mouse.move(900, 450);
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(400);
  const afterZoom = await state(page);
  expect(
    Math.hypot(
      afterZoom.camera.x - afterZoom.position.x,
      afterZoom.camera.z - afterZoom.position.z,
    ),
  ).toBeLessThan(
    Math.hypot(
      beforeZoom.camera.x - beforeZoom.position.x,
      beforeZoom.camera.z - beforeZoom.position.z,
    ),
  );
  await page.mouse.wheel(0, 350);
  await axis(page, 'z', 7.1);
  await hold(page, 'w', 600);
  const blocked = await state(page);
  expect(blocked.position.z).toBeGreaterThan(6.5);
  expect(blocked.collisions).toBeGreaterThan(0);
  await toAvenue(page);
  await axis(page, 'x', -37.5);
  await axis(page, 'z', -48.7);
  expect((await state(page)).position.y).toBeGreaterThan(14.8);
  await axis(page, 'x', -33);
  await axis(page, 'z', -51.4);
  await page.keyboard.press('e');
  await expect(page.locator('.toast')).toContainText('sắp ra mắt');
  await page.screenshot({ path: 'docs/grand-hall-bayern.png' });
  await axis(page, 'z', -48.5);
  await axis(page, 'x', -37.5);
  await axis(page, 'z', -24.5);
  await axis(page, 'x', 37.5);
  await axis(page, 'z', -48.7);
  await axis(page, 'x', 33);
  await axis(page, 'z', -51.4);
  expect((await state(page)).position.y).toBeGreaterThan(14.8);
  await axis(page, 'z', -48.5);
  await axis(page, 'x', 37.5);
  await axis(page, 'z', -24.5);
  await axis(page, 'x', -45);
  await axis(page, 'z', -27.2);
  await page.keyboard.press('e');
  await expect(page.locator('.toast')).toContainText('sắp ra mắt');
  await axis(page, 'z', -24.5);
  await axis(page, 'x', 45);
  await axis(page, 'z', -27.2);
  await page.keyboard.press('e');
  await expect(page.locator('.toast')).toContainText('sắp ra mắt');
  await axis(page, 'z', -24.5);
  await page.getByRole('button', { name: 'Góc nhìn từ trên cao', exact: true }).click();
  await expect.poll(async () => (await state(page)).view).toBe('atlas');
  await page.screenshot({ path: 'docs/grand-hall-overview.png' });
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'x', 0);
  await walk(page, 'w', (s) => s.map === 'united');
  await expect(page.locator('.area-card')).toContainText('Hang Quỷ Đỏ');
  await page.screenshot({ path: 'docs/grand-hall-mu-interior.png' });
  await axis(page, 'x', 4);
  await axis(page, 'z', -3);
  await axis(page, 'z', 0);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'plaza');
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(6.9);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  expect((await state(page)).position.z).toBeCloseTo(-28.35, 0);
  expect(errors).toEqual([]);
});

test('side bridge gains height, minimap tracks position, real ball minigame and photo mode', async ({
  page,
}) => {
  await open(page);
  const mapBefore = await page.locator('.mini-map svg>g').last().getAttribute('transform');
  await axis(page, 'z', 23);
  await axis(page, 'x', 36);
  await axis(page, 'z', -4.5);
  await axis(page, 'x', 41);
  await axis(page, 'z', -24);
  expect((await state(page)).position.y).toBeGreaterThan(6.8);
  expect(await page.locator('.mini-map svg>g').last().getAttribute('transform')).not.toBe(
    mapBefore,
  );
  await axis(page, 'z', -4.5);
  await axis(page, 'x', 5);
  await axis(page, 'z', 18);
  await axis(page, 'x', 14);
  await page.keyboard.press('e');
  await expect(page.getByRole('button', { name: 'Sút bóng', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sút bóng', exact: true }).click();
  await expect(page.locator('.kick-result')).toContainText('VÀO!', { timeout: 10000 });
  await page.keyboard.press('Escape');
  await axis(page, 'z', 11);
  await axis(page, 'x', -15);
  await page.keyboard.press('e');
  await expect(page.locator('.photo-toolbar')).toBeVisible();
  await expect.poll(async () => (await state(page)).view).toBe('photo');
  await page.getByRole('button', { name: 'Thoát', exact: true }).click();
});

test('mobile joystick, camera gesture, quality presets, offline and no overflow', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page, false);
  const before = await state(page),
    stick = (await page.locator('.joystick').boundingBox())!;
  await page.mouse.move(stick.x + stick.width * 0.82, stick.y + stick.height / 2);
  await page.mouse.down();
  await expect
    .poll(async () => (await state(page)).position.x)
    .toBeGreaterThan(before.position.x + 1);
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).moving).toBe(false);
  const after = await state(page);
  await page.mouse.move(300, 400);
  await page.mouse.down();
  await page.mouse.move(80, 400, { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).camera.yaw).toBeGreaterThan(1);
  expect(Math.abs((await state(page)).position.x - after.position.x)).toBeLessThan(0.2);
  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await page
    .locator('.grand-sidebar')
    .getByRole('button', { name: 'Cài đặt', exact: true })
    .click();
  await page.getByLabel('Chất lượng 3D').selectOption('low');
  await page.keyboard.press('Escape');
  await performanceSample(page, 'mobile-emulation-low');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  for (const button of await page.locator('.bottom-dock>button').all()) {
    const box = await button.boundingBox();
    if (!box) continue;
    expect(box.x).toBeGreaterThan(90);
    expect(box.x + box.width).toBeLessThan(315);
  }
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/grand-hall-mobile.png' });
  await context.close();
});

test('verified multiplayer snapshots, chat attribution, login and existing wallet UI', async ({
  browser,
}) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext(),
    a = await ca.newPage(),
    b = await cb.newPage();
  await open(a, true, 'Fan Alpha');
  await open(b, true, 'Fan Beta');
  await expect.poll(async () => (await state(a)).remotes).toBeGreaterThan(0);
  await expect.poll(async () => (await state(b)).remotes).toBeGreaterThan(0);
  await a.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Chào từ kiểm thử 3D');
  await a.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await expect(b.locator('.chat-content')).toContainText('Chào từ kiểm thử 3D');
  await a.goto('/');
  await expect(a.getByRole('button', { name: 'Hồ sơ & ví xu', exact: false })).toBeVisible({
    timeout: 60000,
  });
  await a.getByRole('button', { name: 'Hồ sơ & ví xu', exact: false }).click();
  await expect(a.locator('.wallet-balance')).toContainText('0');
  await expect(a.getByRole('button', { name: 'Nạp xu', exact: true })).toBeVisible();
  await ca.close();
  await cb.close();
});

test('visual QA: reverse main gate, high quality and overview', async ({ page }) => {
  await open(page, false);
  await page.getByRole('button', { name: 'Nhìn về cổng chính', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/grand-hall-entrance.png' });
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await page
    .locator('.grand-sidebar')
    .getByRole('button', { name: 'Cài đặt', exact: true })
    .click();
  await page.getByLabel('Chất lượng 3D').selectOption('high');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state(page)).quality).toBe('high');
  await page.waitForTimeout(600);
  await performanceSample(page, 'desktop-high');
  await page.screenshot({ path: 'docs/grand-hall-desktop.png' });
  await page.getByRole('button', { name: 'Góc nhìn từ trên cao', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/grand-hall-overview.png' });
});
