import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { CAVE_CONNECTIONS } from '../../packages/shared/caveConnections';
import { caveEntrance, CAVES } from '../../packages/shared/grandHall';
import { open, state, walk } from '../helpers/world3d';

const gate = caveEntrance(CAVES.find((cave) => cave.id === 'city')!);
const room = CAVE_CONNECTIONS.city;
const output = process.env.FFC_CITY_ARTIFACTS;
const metrics: Record<string, { fps: number; drawCalls: number; triangles: number }> = {};
const view = (page: Page) => state(page) as ReturnType<typeof state> extends Promise<infer S>
  ? Promise<S & { seated: boolean; remoteAnimations: { nickname: string; clip: string }[] }>
  : never;

async function start(page: Page, name: string) {
  await page.addInitScript(() => localStorage.setItem('ffc-camera-settings', JSON.stringify({
    autoRotate: false, sensitivity: 1, distance: 'medium',
  })));
  await open(page, true, name);
  await expect.poll(async () => (await state(page)).sessionId).not.toBe('demo');
}

async function axis(page: Page, dim: 'x' | 'z', target: number) {
  const current = (await state(page)).worldPosition[dim];
  if (Math.abs(current - target) < 0.1) return;
  const forward = target > current;
  await walk(page, dim === 'x' ? (forward ? 'd' : 'a') : (forward ? 's' : 'w'),
    (s) => forward ? s.worldPosition[dim] >= target : s.worldPosition[dim] <= target);
}

async function approach(page: Page) {
  await axis(page, 'x', 4.8);
  await axis(page, 'z', -3.6);
  await axis(page, 'x', 0);
  await axis(page, 'z', -24);
  await axis(page, 'x', gate.x);
  await axis(page, 'z', gate.z + 2.35);
}

async function local(page: Page, dim: 'x' | 'z', target: number) {
  return axis(page, dim, target + room.offset[dim === 'x' ? 0 : 2]);
}

async function rotate(page: Page, dx: number, dy = 0) {
  await page.mouse.move(680, 420);
  await page.mouse.down();
  await page.mouse.move(680 + dx, 420 + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(420);
}

const reset = (page: Page) =>
  page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();

async function shot(page: Page, name: string) {
  if (!output) return;
  await page.waitForTimeout(420);
  await page.screenshot({ path: `${output}/${name}.png` });
  const { fps, drawCalls, triangles } = await state(page);
  metrics[name] = { fps, drawCalls, triangles };
  writeFileSync(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
}

async function inspect(page: Page, title: string) {
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog').getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
}

test('City desktop walkthrough keeps one controller and socket through every room', async ({ browser }) => {
  test.setTimeout(210000);
  if (output) mkdirSync(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: output ? { dir: output, size: { width: 1440, height: 900 } } : undefined,
  });
  const page = await context.newPage();
  const video = page.video();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await start(page, 'CityWalker');
    await approach(page);
    const before = await state(page);
    await expect.poll(async () => (await state(page)).gates?.city).toBe('OPEN');
    await local(page, 'z', -7.6);
    await expect(page.locator('.area-card')).toContainText('Hang Man City');
    expect((await state(page)).worldPosition.y).toBeCloseTo(room.offset[1], 0);
    await shot(page, '01-san-tru-an');
    await expect.poll(async () => (await state(page)).gates?.city, { timeout: 6500 }).toBe('CLOSED');

    await local(page, 'x', -6.4);
    await local(page, 'z', -18.94);
    await local(page, 'x', -8.7);
    await page.keyboard.press('e');
    await expect.poll(async () => (await view(page)).seated).toBe(true);
    await page.keyboard.press('e');
    await expect.poll(async () => (await view(page)).seated).toBe(false);
    await local(page, 'z', -22.6);
    await local(page, 'x', -10.9);
    await inspect(page, 'Bảng tin & lịch thi đấu');
    await local(page, 'x', -7.2);
    await local(page, 'z', -13.1);
    await rotate(page, -114, -8);
    await shot(page, '02-goc-tam-su');
    await reset(page);

    await local(page, 'x', 0);
    await local(page, 'z', -24.2);
    expect((await state(page)).worldPosition.y).toBeCloseTo(room.offset[1] + 1.35, 0);
    await inspect(page, 'Kết quả trận gần nhất');
    await local(page, 'z', -15);
    await local(page, 'x', 24.9);
    await expect(page.locator('.area-card')).toContainText('Phòng Truyền Thống');
    await rotate(page, Math.PI / 2 / 0.006, 0);
    await shot(page, '03-phong-truyen-thong');
    await rotate(page, 0, -112);
    expect((await state(page)).camera.pitch).toBeGreaterThan(0.1);
    await reset(page);

    await local(page, 'z', -24.65);
    await local(page, 'x', 35.3);
    await inspect(page, 'Pep Guardiola');
    await local(page, 'z', -20.05);
    await local(page, 'x', 38.15);
    await inspect(page, 'Cúp FA');
    await local(page, 'x', 33.5);
    await local(page, 'z', -19.9);
    await rotate(page, 275, 12);
    await shot(page, '04-cup-va-tuong-pep');
    await reset(page);

    await local(page, 'z', -2.5);
    await local(page, 'x', 29.85);
    await inspect(page, 'Khoảnh khắc 93:20');
    await page.locator('.city-hud-toggle').click();
    await page.getByRole('button', { name: 'Các đời HLV', exact: true }).click();
    await page.getByRole('button', { name: 'Manuel Pellegrini', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Manuel Pellegrini', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await local(page, 'z', -15.05);
    await local(page, 'x', 0);
    await axis(page, 'z', gate.z + 4.7);
    const after = await state(page);
    expect(after.map).toBe('plaza');
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.controllerRevision).toBe(before.controllerRevision);
    expect(after.camera.yaw).toBe(before.camera.yaw);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    if (video && output) {
      const path = await video.path();
      await video.saveAs(`${output}/walkthrough.webm`);
      const { unlinkSync } = await import('node:fs');
      unlinkSync(path);
    }
  }
});

test('City synchronizes gate occupancy, lounge seating and room chat on mobile', async ({ page, browser }) => {
  test.setTimeout(180000);
  const mobile = await browser.newContext({ viewport: { width: 690, height: 393 }, isMobile: true, hasTouch: true });
  try {
    const guest = await mobile.newPage();
    await Promise.all([start(page, 'CityHost'), start(guest, 'CityMobile')]);
    await Promise.all([approach(page), approach(guest)]);
    await expect.poll(async () => (await state(guest)).gates?.city).toBe('OPEN');
    await axis(guest, 'z', gate.z - 0.17);
    await local(page, 'z', -8);
    await guest.waitForTimeout(3000);
    expect((await state(page)).gates?.city).toBe('OPEN');
    expect((await state(guest)).gates?.city).toBe('OPEN');
    await local(guest, 'z', -8);
    await expect.poll(async () => (await state(page)).gates?.city, { timeout: 6500 }).toBe('CLOSED');
    expect((await state(guest)).remotes).toBeGreaterThan(0);
    await expect(guest.getByRole('button', { name: 'Bản đồ Hang Man City' })).toBeAttached();
    await guest.locator('.city-hud-toggle').tap();
    await guest.getByRole('button', { name: 'Thư viện ảnh', exact: true }).tap();
    await expect(guest.getByRole('heading', { name: 'Etihad Stadium', exact: true })).toBeVisible();
    await guest.getByRole('button', { name: 'Đóng', exact: true }).tap();

    const cdp = await mobile.newCDPSession(guest);
    const { x, y, width, height } = (await guest.locator('.joystick').boundingBox())!;
    const center = { x: x + width / 2, y: y + height / 2 };
    const oldX = (await state(guest)).worldPosition.x;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    try {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{ x: center.x - width * 0.39, y: center.y }],
      });
      await expect.poll(async () => (await state(guest)).worldPosition.x).toBeLessThan(oldX - 1);
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await local(guest, 'x', -6.5);
    await local(guest, 'z', -19);
    await local(guest, 'x', -8.85);
    await guest.locator('.interaction-prompt').tap();
    await expect.poll(async () => (await view(guest)).seated).toBe(true);
    await expect.poll(async () => (await view(page)).remoteAnimations.find((p) => p.nickname === 'CityMobile')?.clip).toBe('SitIdle');
    await guest.locator('.interaction-prompt').tap();
    await expect.poll(async () => (await view(guest)).seated).toBe(false);
    await page.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Blue Moon QA');
    await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
    await guest.keyboard.press('Enter');
    await expect(guest.getByText('Blue Moon QA', { exact: true })).toBeVisible();
  } finally {
    await mobile.close();
  }
});
