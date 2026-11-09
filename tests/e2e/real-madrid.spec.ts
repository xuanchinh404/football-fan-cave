import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { CAVE_CONNECTIONS } from '../../packages/shared/caveConnections';
import { open, state } from '../helpers/world3d';

const [cx, cy, cz] = CAVE_CONNECTIONS.real.offset;

async function drive(page: Page, axis: 'x' | 'z', target: number) {
  const start = (await state(page)).worldPosition[axis];
  if (Math.abs(start - target) < 0.13) return;
  const positive = target > start;
  const key = axis === 'x' ? (positive ? 'd' : 'a') : positive ? 's' : 'w';
  const run = Math.abs(start - target) > 7;
  if (run) await page.keyboard.down('Shift');
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ axis, target, positive, key }) => {
        const p = (window as any).__world3d?.worldPosition?.[axis];
        if (p === undefined || !(positive ? p >= target : p <= target)) return false;
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Key' + key.toUpperCase() }));
        return true;
      },
      { axis, target, positive, key },
      { timeout: Math.abs(start - target) > 40 ? 50000 : 22000 },
    );
  } catch (error) {
    throw new Error(`Drive ${axis}=${target}: ${JSON.stringify(await state(page))}. ${error}`);
  } finally {
    await page.keyboard.up(key);
    if (run) await page.keyboard.up('Shift');
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
}

async function start(page: Page, live: boolean, name: string) {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ffc-camera-settings',
      JSON.stringify({
        autoRotate: false,
        sensitivity: 1,
        distance: 'medium',
      }),
    ),
  );
  page.once('pageerror', (error) => console.log('Madrid browser error stack:', error.stack));
  await open(page, live, name);
}

async function toGate(page: Page, side = 0) {
  await drive(page, 'x', 4.9);
  await drive(page, 'z', -4);
  await drive(page, 'x', 0);
  await drive(page, 'z', -24);
  await drive(page, 'x', cx + side);
  await drive(page, 'z', -27.1);
  await expect.poll(async () => (await state(page)).gates?.real).toBe('OPEN');
}

async function orbit(page: Page, dx: number, dy = 0) {
  const canvas = (await page.locator('canvas').boundingBox())!;
  const x = canvas.width * 0.52,
    y = canvas.height * 0.51;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 9 });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const c = (window as any).__world3d?.camera;
        return c && Math.abs(c.viewYaw - c.yaw) < 0.04 && Math.abs(c.viewPitch - c.pitch) < 0.04;
      }),
    )
    .toBe(true);
}

test('Real Madrid round trip, seat, stairs, museum and coach browser', async ({ browser }) => {
  test.setTimeout(240000);
  const capture = process.env.FFC_REAL_CAPTURE;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(capture ? { recordVideo: { dir: capture, size: { width: 1120, height: 700 } } } : {}),
  });
  const page = await context.newPage();
  const video = page.video();
  const snap = async (name: string) => {
    if (!capture) return;
    await page.locator('.real-collection img:visible').evaluateAll(async (images) => {
      await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
    });
    await page.screenshot({ path: capture + '/' + name + '.png', animations: 'disabled' });
  };
  try {
    if (capture) await mkdir(capture, { recursive: true });
    await start(page, false, 'Madrid QA');
    await toGate(page);
    const before = await state(page);
    await drive(page, 'z', cz + 0.25);
    const refuge = await state(page);
    expect(refuge.map).toBe('real');
    expect(refuge.worldPosition.y).toBeCloseTo(cy, 1);
    await expect(page.locator('.real-minimap')).toContainText('Sảnh Trú Ẩn');
    await snap('01-san-tru-an');
    await drive(page, 'z', cz - 4.9);
    await drive(page, 'x', cx - 10.0);
    await snap('02-goc-tam-su');
    await drive(page, 'z', cz - 6.27);
    await expect(page.locator('.interaction-prompt')).toContainText('Ngồi sofa');
    await page.keyboard.press('f');
    await expect(page.locator('.interaction-prompt')).toContainText('Đứng dậy');
    await page.keyboard.press('f');
    await expect(page.locator('.interaction-prompt')).toContainText('Ngồi sofa');
    const afterSeat = await state(page);
    await drive(page, 'x', cx);
    await drive(page, 'z', cz - 22.8);
    expect((await state(page)).worldPosition.y).toBeCloseTo(cy + 1.28, 1);
    await drive(page, 'z', cz - 14);
    await drive(page, 'x', cx + 23.8);
    await expect(page.locator('.real-minimap')).toContainText('Phòng Truyền Thống');
    // A quarter-turn shows the museum axis, keeping the original character and camera controller.
    await orbit(page, 262);
    await snap('03-phong-truyen-thong');
    const pitch = (await state(page)).camera.pitch;
    await orbit(page, 0, -75);
    expect((await state(page)).camera.pitch).not.toBe(pitch);
    await orbit(page, -262, 75);
    await drive(page, 'z', cz - 24);
    await drive(page, 'x', cx + 29.6);
    await expect(page.locator('.interaction-prompt')).toContainText('Carlo Ancelotti');
    await page.keyboard.press('f');
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Carlo Ancelotti' })).toBeVisible();
    await expect(modal).toContainText('2013–2015');
    await expect(modal).toContainText('2021–2025');
    await snap('07-ho-so-ancelotti');
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await drive(page, 'z', cz - 14);
    await drive(page, 'x', cx + 30.5);
    await orbit(page, 262);
    await snap('04-day-cup');
    await orbit(page, -262);
    await drive(page, 'x', cx + 39.5);
    await expect(page.locator('.interaction-prompt')).toContainText('Các đời HLV');
    await page.keyboard.press('f');
    await expect(modal.getByText('HLV hiện tại', { exact: true })).toHaveCount(1);
    await snap('05-hlv-hien-dai');
    await modal.getByRole('button', { name: 'Trước 1950' }).click();
    await expect(modal.getByText('José Ángel Berraondo', { exact: true })).toBeVisible();
    await snap('06-hlv-giai-doan-dau');
    for (const era of ['1950–1979', '1980–1999', '2000–2019', '2020–nay']) {
      await modal.getByRole('button', { name: era, exact: true }).click();
      expect(await modal.locator('.real-coach-card').count()).toBeGreaterThan(2);
    }
    await modal.getByRole('button', { name: /José Mourinho/ }).click();
    await expect(modal).toContainText('2010–2013');
    await expect(modal).toContainText('2026–nay');
    await modal.getByRole('button', { name: 'Quay lại danh sách' }).click();
    await expect(modal.getByRole('button', { name: '2020–nay' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await drive(page, 'x', cx + 42.05);
    await expect(page.locator('.interaction-prompt')).toContainText('Siêu cúp UEFA');
    await page.keyboard.press('f');
    await expect(modal).toContainText('2002');
    await modal.getByRole('button', { name: 'Đóng' }).click();
    await drive(page, 'x', cx);
    await drive(page, 'z', -24.6);
    const after = await state(page);
    expect(after.map).toBe('plaza');
    expect(after.controllerRevision).toBe(before.controllerRevision);
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.corrections).toBe(afterSeat.corrections);
    await expect(page.locator('.loading-world')).toHaveCount(0);
  } finally {
    await context.close();
    if (video && capture) {
      await video.saveAs(capture + '/hanh-trinh.webm');
      await video.delete();
    }
  }
});

test('two live players share the Real Madrid gate and keep their sessions', async ({ browser }) => {
  test.setTimeout(150000);
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  try {
    const [a, b] = await Promise.all(contexts.map((context) => context.newPage()));
    await start(a, true, 'Madrid A');
    await start(b, true, 'Madrid B');
    await toGate(a, -0.6);
    await expect.poll(async () => (await state(b)).gates?.real).toBe('OPEN');
    await toGate(b, 0.6);
    const before = await Promise.all([state(a), state(b)]);
    await Promise.all([a, b].map((page) => drive(page, 'z', cz + 0.3)));
    const after = await Promise.all([state(a), state(b)]);
    for (let i = 0; i < after.length; i++) {
      expect(after[i].map).toBe('real');
      expect(after[i].remotes).toBe(1);
      expect(after[i].sessionId).toBe(before[i].sessionId);
      expect(after[i].controllerRevision).toBe(before[i].controllerRevision);
      expect(after[i].corrections).toBe(before[i].corrections);
    }
    await drive(a, 'z', cz - 4.9);
    await drive(a, 'x', cx - 10);
    await drive(a, 'z', cz - 6.2);
    await expect(a.locator('.interaction-prompt')).toContainText('Ngồi sofa');
    await a.keyboard.press('f');
    await expect(a.locator('.interaction-prompt')).toContainText('Đứng dậy');
    const remoteSitting = () =>
      b.evaluate(() =>
        (window as any).__world3d.remoteAnimations.some(
          (entry: { clip: string }) => entry.clip === 'SitIdle',
        ),
      );
    await expect.poll(remoteSitting).toBe(true);
    await a.keyboard.press('f');
    await expect.poll(remoteSitting).toBe(false);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test('mobile joystick crosses the Real Madrid gate and opens the English guide', async ({
  browser,
}) => {
  test.setTimeout(150000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await start(page, false, 'Madrid Mobile');
    await page.evaluate(() => {
      document.documentElement.lang = 'en';
    });
    await toGate(page);
    const cdp = await context.newCDPSession(page);
    const stick = (await page.getByLabel('Joystick di chuyển').boundingBox())!;
    const center = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    try {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: center.x, y: center.y - stick.height * 0.64 }],
      });
      await expect.poll(async () => (await state(page)).map, { timeout: 15000 }).toBe('real');
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await expect(page.locator('.real-minimap')).toContainText('Gate Tunnel');
    await page.getByRole('button', { name: 'Real Madrid guide' }).tap();
    await page.getByRole('button', { name: 'Coaching History' }).tap();
    await expect(page.getByRole('dialog').getByText('Current coach', { exact: true })).toHaveCount(
      1,
    );
  } finally {
    await context.close();
  }
});
