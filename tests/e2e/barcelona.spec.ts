import { mkdirSync, writeFileSync } from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { BARCA_CUP_X, BARCA_STATUE } from '../../packages/shared/barcelona/layout';
import { CAVE_CONNECTIONS } from '../../packages/shared/caveConnections';
import { caveEntrance, CAVES } from '../../packages/shared/grandHall';
import { open, state, type State } from '../helpers/world3d';

const gate = caveEntrance(CAVES.find((cave) => cave.id === 'barcelona')!);
const room = CAVE_CONNECTIONS.barcelona;
const output = process.env.FFC_BARCA_ARTIFACTS;
const metrics: Record<string, { fps: number; drawCalls: number; triangles: number }> = {};
const view = (page: Page) =>
  state(page) as Promise<
    State & {
      seated: boolean;
      remoteAnimations: { nickname: string; clip: string }[];
    }
  >;

async function start(page: Page, name: string) {
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
  await open(page, true, name);
  await expect.poll(async () => (await state(page)).sessionId).not.toBe('demo');
}

async function drive(page: Page, axis: 'x' | 'z', target: number) {
  const start = (await state(page)).worldPosition[axis];
  if (Math.abs(start - target) < 0.16) return;
  const positive = target > start;
  const key = axis === 'x' ? (positive ? 'd' : 'a') : positive ? 's' : 'w';
  const run = Math.abs(start - target) > 4.5;
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
      { timeout: 23000 },
    );
  } catch (error) {
    throw new Error(`Drive ${axis} to ${target}: ${JSON.stringify(await state(page))}. ${error}`);
  } finally {
    await page.keyboard.up(key);
    if (run) await page.keyboard.up('Shift');
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
}

async function align(page: Page, axis: 'x' | 'z', target: number, tolerance = 0.45) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (Math.abs((await state(page)).worldPosition[axis] - target) < tolerance) return;
    await drive(page, axis, target);
  }
  expect(Math.abs((await state(page)).worldPosition[axis] - target)).toBeLessThan(tolerance);
}

async function approach(page: Page) {
  await drive(page, 'x', 4.8);
  await drive(page, 'z', -3.6);
  await drive(page, 'x', 0);
  await drive(page, 'z', -24);
  await align(page, 'x', gate.x, 0.85);
  await drive(page, 'z', gate.z + 2.15);
  await expect.poll(async () => (await state(page)).gates?.barcelona).toBe('OPEN');
}
const local = (page: Page, dim: 'x' | 'z', target: number) =>
  drive(page, dim, target + room.offset[dim === 'x' ? 0 : 2]);

async function touchDrive(
  page: Page,
  session: CDPSession,
  axis: 'x' | 'z',
  target: number,
  strength: number,
) {
  const from = (await state(page)).worldPosition[axis];
  if (Math.abs(from - target) < 0.09) return;
  const forward = target > from;
  const joystick = (await page.locator('.joystick').boundingBox())!;
  const center = { x: joystick.x + joystick.width / 2, y: joystick.y + joystick.height / 2 };
  const delta = (forward ? 1 : -1) * strength;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: center.x + (axis === 'x' ? delta : 0), y: center.y + (axis === 'z' ? delta : 0) },
      ],
    });
    await expect
      .poll(
        async () => {
          const point = (await state(page)).worldPosition[axis];
          return forward ? point >= target : point <= target;
        },
        { timeout: 12000, intervals: [50] },
      )
      .toBe(true);
  } finally {
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}

async function rotate(page: Page, dx: number, dy = 0) {
  await page.mouse.move(585, 420);
  await page.mouse.down();
  await page.mouse.move(585 + dx, 420 + dy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(320);
}

async function clickWorld(page: Page, x: number, y: number, z: number) {
  const { camera } = (await state(page)) as State & {
    camera: { viewYaw: number; viewPitch: number };
  };
  const viewport = (await page.locator('.game-canvas canvas').boundingBox())!;
  const c = new PerspectiveCamera(60, viewport.width / viewport.height, 0.08, 320);
  c.position.set(camera.x, camera.y, camera.z);
  const horizontal = Math.cos(camera.viewPitch);
  c.lookAt(
    c.position
      .clone()
      .add(
        new Vector3(
          -Math.sin(camera.viewYaw) * horizontal,
          Math.sin(camera.viewPitch),
          -Math.cos(camera.viewYaw) * horizontal,
        ),
      ),
  );
  c.updateMatrixWorld();
  const screen = new Vector3(x, y, z).project(c);
  expect(Math.abs(screen.x)).toBeLessThan(1);
  expect(Math.abs(screen.y)).toBeLessThan(1);
  await page.mouse.click(
    viewport.x + ((screen.x + 1) * viewport.width) / 2,
    viewport.y + ((1 - screen.y) * viewport.height) / 2,
  );
}

const reset = (page: Page) =>
  page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
async function shot(page: Page, name: string) {
  if (!output) return;
  await page.waitForTimeout(430);
  await page.screenshot({ path: `${output}/${name}.png` });
  const { fps, drawCalls, triangles } = await state(page);
  metrics[name] = { fps, drawCalls, triangles };
  writeFileSync(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
}

test('Barça is one physical round trip with a sofa, score, coaches, cups and exhibits', async ({
  browser,
}) => {
  test.setTimeout(230000);
  if (output) mkdirSync(output, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo:
      output && process.env.FFC_BARCA_VIDEO === '1'
        ? { dir: output, size: { width: 1152, height: 720 } }
        : undefined,
  });
  const page = await context.newPage();
  const video = page.video();
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    if (errors.includes(error.message)) return;
    errors.push(error.message);
    console.error(error.stack);
  });
  const dialog = page.getByRole('dialog');
  const inspect = async (title: string) => {
    await page.keyboard.press('f');
    await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  };
  try {
    await start(page, 'BarcaWalker');
    await approach(page);
    const before = await state(page);
    await local(page, 'z', -7.65);
    expect((await state(page)).map).toBe('barcelona');
    expect((await state(page)).position.y).toBeCloseTo(0, 0);
    await expect(page.locator('.area-card')).toContainText('Sảnh Trú Ẩn');
    await rotate(page, 0, -58);
    await shot(page, '01-san-tru-an');
    await reset(page);
    await expect
      .poll(async () => (await state(page)).gates?.barcelona, { timeout: 6500 })
      .toBe('CLOSED');

    await local(page, 'x', -3.72);
    await local(page, 'z', -19.86);
    await local(page, 'x', -5.14);
    await page.keyboard.press('f');
    await expect.poll(async () => (await view(page)).seated).toBe(true);
    await page.keyboard.press('f');
    await expect.poll(async () => (await view(page)).seated).toBe(false);
    await local(page, 'x', -3.72);
    await local(page, 'z', -23.6);
    await local(page, 'x', -6.75);
    await inspect('Bảng tin & lịch thi đấu');
    await local(page, 'x', -3.72);
    await local(page, 'z', -14.5);
    await local(page, 'x', -6.45);
    await rotate(page, 0, -34);
    await shot(page, '02-goc-tam-su');
    await reset(page);

    await local(page, 'x', 0);
    await local(page, 'z', -24.3);
    expect((await state(page)).position.y).toBeCloseTo(1.4, 0);
    await inspect('Kết quả trận gần nhất');
    await local(page, 'z', -15);
    await local(page, 'x', 27.5);
    await expect(page.locator('.area-card')).toContainText('Phòng Truyền Thống');
    await rotate(page, Math.PI / 2 / 0.006, -65);
    await shot(page, '03-phong-truyen-thong');
    expect((await state(page)).camera.pitch).toBeGreaterThan(0);
    await reset(page);

    await local(page, 'z', -25.5);
    await local(page, 'x', 25 - BARCA_STATUE.z - 1.85);
    await rotate(page, Math.PI / 2 / 0.006, -39);
    await shot(page, '07-tuong-pep');
    await reset(page);
    await inspect('Josep Guardiola');

    await local(page, 'z', -15);
    await local(page, 'x', 41.45);
    await rotate(page, Math.PI / 2 / 0.006, -78);
    await shot(page, '04-buc-tuong-hlv');
    await clickWorld(
      page,
      room.offset[0] + 25 + 23.34,
      room.offset[1] + 6.39,
      room.offset[2] - 15 - 6.66,
    );
    await shot(page, '05-buc-tuong-hlv-giai-doan-khac');
    await reset(page);
    await local(page, 'x', 44.15);
    await page.keyboard.press('f');
    await expect(dialog.getByText('75 nhiệm kỳ', { exact: true })).toBeVisible();
    for (const label of ['1912–1949', '1950–1979', '1980–1999', '2000–2019', '2020–…']) {
      await dialog.getByRole('button', { name: label, exact: true }).click();
      await expect(dialog.locator('.barca-list button').first()).toBeVisible();
    }
    await expect(dialog.getByRole('button', { name: /Hansi Flick.*đương nhiệm/ })).toBeVisible();
    await dialog.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await dialog.getByRole('searchbox').fill('carles rexach');
    await expect(dialog.locator('.barca-list button')).toHaveCount(4);
    await dialog.locator('.barca-list button').first().click();
    await expect(dialog.getByRole('heading', { name: 'Carles Rexach', exact: true })).toBeVisible();
    await expect(dialog.locator('.barca-terms button')).toHaveCount(3);
    await page.keyboard.press('Escape');
    await local(page, 'x', 45.55);
    for (const [i, title] of [
      'La Liga',
      'Copa del Rey',
      'UEFA Champions League',
      'Siêu cúp UEFA',
      'FIFA Club World Cup',
      'Siêu cúp Tây Ban Nha',
      'Cúp C2 châu Âu',
    ].entries()) {
      await local(page, 'z', -15 + BARCA_CUP_X[i]);
      await inspect(title);
    }
    await local(page, 'x', 40.5);
    await local(page, 'z', -15);
    await rotate(page, Math.PI / 2 / 0.006, -32);
    await shot(page, '06-day-cup');
    await reset(page);
    await page.locator('.barca-hud-toggle').click();
    await page.getByRole('button', { name: 'Huyền thoại CLB', exact: true }).click();
    await dialog.getByRole('button', { name: 'Leo Messi', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Leo Messi', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Dòng thời gian lịch sử', exact: true }).click();
    await dialog.getByRole('button', { name: /Cú ăn sáu/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Cú ăn sáu', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');

    await local(page, 'x', 0);
    await drive(page, 'z', gate.z + 4.6);
    const after = await state(page);
    expect(after.map).toBe('plaza');
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.controllerRevision).toBe(before.controllerRevision);
    expect(after.camera.yaw).toBe(before.camera.yaw);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    if (video && output) {
      const { unlinkSync } = await import('node:fs');
      const path = await video.path();
      await video.saveAs(`${output}/walkthrough.webm`);
      unlinkSync(path);
    }
  }
});

test('Barça shares door and seating across desktop and mobile players', async ({
  page,
  browser,
}) => {
  test.setTimeout(130000);
  const mobile = await browser.newContext({
    viewport: { width: 690, height: 410 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const guest = await mobile.newPage();
    await page.setViewportSize({ width: 690, height: 420 });
    await Promise.all([start(page, 'BarcaHost'), start(guest, 'BarcaMobile')]);
    await Promise.all([approach(page), approach(guest)]);
    await drive(guest, 'z', gate.z - 0.3);
    await local(page, 'z', -7);
    await guest.waitForTimeout(2900);
    expect((await state(page)).gates?.barcelona).toBe('OPEN');
    await local(guest, 'z', -7);
    await expect
      .poll(async () => (await state(guest)).gates?.barcelona, { timeout: 6500 })
      .toBe('CLOSED');
    await expect.poll(async () => (await state(guest)).remotes).toBeGreaterThan(0);

    await guest.getByRole('button', { name: 'Bản đồ Hang Barcelona' }).tap();
    await expect(
      guest.getByRole('dialog').getByRole('img', { name: 'Bản đồ Hang Barcelona' }),
    ).toBeVisible();
    await guest.getByRole('button', { name: 'Đóng', exact: true }).tap();
    await guest.locator('.barca-hud-toggle').tap();
    await guest.getByRole('button', { name: 'English', exact: true }).tap();
    await expect(guest.getByRole('button', { name: 'Barcelona Cave map' })).toBeVisible();
    await guest.getByRole('button', { name: 'Tiếng Việt', exact: true }).tap();
    await guest.getByRole('button', { name: 'Các đời HLV', exact: true }).tap();
    await expect(guest.getByRole('searchbox')).toBeVisible();
    await guest.getByRole('button', { name: 'Đóng', exact: true }).tap();
    await guest.getByRole('button', { name: 'Nhảy', exact: true }).tap();
    await expect
      .poll(async () => (await state(guest)).position.y, { intervals: [50] })
      .toBeGreaterThan(0.35);
    await expect.poll(async () => (await state(guest)).grounded).toBe(true);
    const cdp = await mobile.newCDPSession(guest);
    await touchDrive(guest, cdp, 'z', room.offset[2] - 14.8, 30);
    await touchDrive(guest, cdp, 'x', room.offset[0] - 3.71, 10);
    await touchDrive(guest, cdp, 'z', room.offset[2] - 19.78, 19);
    await touchDrive(guest, cdp, 'x', room.offset[0] - 5.15, 13);
    await guest.locator('.interaction-prompt').tap();
    await expect.poll(async () => (await view(guest)).seated).toBe(true);
    await expect
      .poll(async () => (await view(page)).remoteAnimations.some((p) => p.clip === 'SitIdle'))
      .toBe(true);
    await guest.locator('.interaction-prompt').tap();
    await expect.poll(async () => (await view(guest)).seated).toBe(false);
    await expect
      .poll(async () => (await view(page)).remoteAnimations.some((p) => p.clip === 'SitIdle'))
      .toBe(false);
    await page.keyboard.press('Enter');
    await page.getByRole('textbox', { name: 'Tin nhắn chat' }).fill('Visca Barca QA');
    await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
    await guest.keyboard.press('Enter');
    await expect(guest.getByText('Visca Barca QA', { exact: true })).toBeVisible();
    const assertSeparated = async () => {
      const menu = (await guest.locator('.barca-hud-toggle').boundingBox())!;
      const chat = (await guest.locator('.chat-panel').boundingBox())!;
      expect(menu.x >= chat.x + chat.width || menu.y + menu.height <= chat.y).toBe(true);
    };
    await assertSeparated();
    await shot(guest, '08-mobile');
    await guest.setViewportSize({ width: 390, height: 844 });
    await assertSeparated();
    await expect(guest.getByRole('button', { name: 'Bản đồ Hang Barcelona' })).toBeVisible();
  } finally {
    await mobile.close();
  }
});
