import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { hold, open, state, walk } from '../helpers/world3d';

const output = process.env.FFC_LIVERPOOL_SHOTS;
const metrics: Record<string, { fps: number; triangles: number; drawCalls: number }> = {};
async function shot(page: Page, name: string) {
  if (!output) return;
  mkdirSync(output, { recursive: true });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/${name}.png` });
  const { fps, triangles, drawCalls } = await state(page);
  metrics[name] = { fps, triangles, drawCalls };
  writeFileSync(`${output}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
}
const reset = (page: Page) =>
  page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
async function rotate(page: Page, horizontal: number, vertical = 0) {
  await page.mouse.move(730, 450);
  await page.mouse.down();
  await page.mouse.move(730 + horizontal, 450 + vertical, { steps: 14 });
  await page.mouse.up();
}
async function start(page: Page, live: boolean, name?: string) {
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
  await open(page, live, name);
  if (live) await expect.poll(async () => (await state(page)).sessionId).not.toBe('demo');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}
async function axis(page: Page, axis: 'x' | 'z', target: number) {
  const current = (await state(page)).position[axis];
  const forward = current < target;
  if (Math.abs(current - target) < 0.06) return;
  const key = axis === 'x' ? (forward ? 'd' : 'a') : forward ? 's' : 'w';
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ axis, target, forward }) => {
        const current = (window as any).__world3d.position[axis];
        return forward ? current >= target : current <= target;
      },
      { axis, target, forward },
      { timeout: 20000 },
    );
  } catch (error) {
    throw new Error(`Walk ${axis} to ${target}: ${JSON.stringify(await state(page))}. ${error}`);
  } finally {
    await page.keyboard.up(key);
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
}

async function toKopAvenue(page: Page) {
  await axis(page, 'x', 4.8);
  await axis(page, 'z', -3.8);
  await axis(page, 'x', 0);
  await axis(page, 'z', -24);
  expect((await state(page)).position.y).toBeGreaterThan(6.8);
}
async function approachKopGate(page: Page) {
  await toKopAvenue(page);
  await axis(page, 'x', -15);
  await axis(page, 'z', -27.6);
}
async function waitForGate(
  page: Page,
  id: string,
  phase: 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING',
) {
  await expect.poll(async () => (await state(page)).gates?.[id], { timeout: 12000 }).toBe(phase);
}
async function walkIntoRefuge(page: Page) {
  await walk(page, 'w', (s) => s.map === 'liverpool');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await axis(page, 'z', 12.6);
  await axis(page, 'x', 0);
}
async function enterCave(page: Page) {
  await approachKopGate(page);
  await waitForGate(page, 'liverpool', 'OPEN');
  await walkIntoRefuge(page);
}

async function touchAxis(
  page: Page,
  cdp: CDPSession,
  axis: 'x' | 'z',
  target: number,
  world = false,
) {
  const { x, y, width, height } = (await page.locator('.joystick').boundingBox())!;
  const center = { x: x + width / 2, y: y + height / 2 };
  const coordinates = world ? 'worldPosition' : 'position';
  const forward = (await state(page))[coordinates][axis] < target;
  const point = {
    x: center.x + (axis === 'x' ? (forward ? 1 : -1) * width * 0.4 : 0),
    y: center.y + (axis === 'z' ? (forward ? 1 : -1) * height * 0.4 : 0),
  };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    await expect
      .poll(
        async () => {
          const position = (await state(page))[coordinates][axis];
          return forward ? position >= target : position <= target;
        },
        { timeout: 20000, intervals: [50] },
      )
      .toBe(true);
  } catch (error) {
    throw new Error(
      `Touch ${coordinates}.${axis} to ${target}: ${JSON.stringify(await state(page))}. ${error}`,
    );
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}
async function corridor(page: Page, capture = false) {
  await axis(page, 'x', 12);
  await axis(page, 'z', -10.5);
  if (capture) await shot(page, '04a-loi-vao-hanh-lang');
  await axis(page, 'z', -20);
  expect((await state(page)).cameraHit ?? 9).toBeGreaterThan(2);
  if (capture) await shot(page, '04-hanh-lang');
  await walk(page, 'w', (s) => s.map === 'liverpool-museum');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}
async function inspect(page: Page, heading: string) {
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
}
async function chat(page: Page, message: string) {
  await page.getByRole('textbox', { name: 'Tin nhắn chat' }).fill(message);
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
}

test('Liverpool continuous desktop walkthrough', async ({ browser }) => {
  test.setTimeout(120000);
  const videoDir = process.env.FFC_LIVERPOOL_VIDEO;
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: videoDir ? { dir: videoDir, size: { width: 1280, height: 800 } } : undefined,
  });
  const page = await context.newPage();
  const video = page.video();
  try {
    await start(page, true, 'Kop Walkthrough');
    await toKopAvenue(page);
    await axis(page, 'x', -15);
    await axis(page, 'z', -25);
    await waitForGate(page, 'liverpool', 'CLOSED');
    const before = await state(page);
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const probe = window as any;
      probe.__kopTrace = [];
      const sample = () => {
        if (!probe.__kopTrace) return;
        const current = probe.__world3d;
        if (current?.worldPosition)
          probe.__kopTrace.push({
            map: current.map,
            point: current.worldPosition,
            revision: current.controllerRevision,
            sessionId: current.sessionId,
            corrections: current.corrections,
            frames: current.frames,
            loading: !!document.querySelector('.loading-world'),
          });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await walk(page, 'w', (s) => s.map === 'liverpool' && s.position.z <= 32);
    expect((await state(page)).camera.yaw).toBe(before.camera.yaw);
    await rotate(page, 524);
    await page.waitForTimeout(900);
    await rotate(page, -524);
    await walk(page, 'w', (s) => s.position.z <= 9);
    const inside = await state(page);
    expect(inside.position.y).toBeLessThan(0.12);
    await expect(page.getByRole('img', { name: 'Bản đồ Hang Liverpool' })).toBeVisible();
    await waitForGate(page, 'liverpool', 'CLOSED');
    await page.waitForTimeout(800);
    await rotate(page, 524);
    const returnHeading = (await state(page)).camera.yaw;
    await walk(page, 'w', (s) => s.map === 'plaza' && s.position.z >= -24.5);
    expect((await state(page)).camera.yaw).toBe(returnHeading);
    await waitForGate(page, 'liverpool', 'CLOSING');
    await walk(page, 's', (s) => s.worldPosition.z <= -27.8);
    await waitForGate(page, 'liverpool', 'OPEN');
    await walk(page, 'w', (s) => s.worldPosition.z >= -24.5);
    await waitForGate(page, 'liverpool', 'CLOSED');
    const trace = await page.evaluate(() => {
      const probe = window as any;
      const samples = probe.__kopTrace;
      probe.__kopTrace = null;
      return samples as {
        map: string;
        point: StatePoint;
        revision: number;
        sessionId: string;
        corrections: number;
        frames: number;
        loading: boolean;
      }[];
    });
    const crossings = trace.slice(1).filter((sample, i) => sample.map !== trace[i].map);
    expect(crossings.map((sample) => sample.map)).toEqual(['liverpool', 'plaza']);
    expect(before.sessionId).not.toBe('demo');
    for (let i = 1; i < trace.length; i++) {
      const { point: a } = trace[i - 1];
      const { point: b, revision, corrections, frames, loading } = trace[i];
      expect(revision).toBe(before.controllerRevision);
      expect(trace[i].sessionId).toBe(before.sessionId);
      expect(corrections).toBe(before.corrections);
      expect(loading).toBe(false);
      expect(frames).toBeGreaterThanOrEqual(trace[i - 1].frames);
      if (trace[i].map !== trace[i - 1].map)
        expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeLessThan(0.8);
    }
  } finally {
    await context.close();
  }
  if (video && videoDir) await video.saveAs(`${videoDir}/liverpool-continuous.webm`);
});

type StatePoint = { x: number; y: number; z: number };

test('Liverpool realtime walking, seating, history, and round trip', async ({ page }) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Shader Error'))
      errors.push(message.text());
  });
  await start(page, true, 'Kop QA');
  await enterCave(page);
  await expect(page.getByRole('img', { name: 'Bản đồ Hang Liverpool' })).toBeVisible();
  await expect(page.locator('.area-card')).toContainText('Hang Liverpool');
  await page.waitForTimeout(900);
  await rotate(page, 0, -22);
  await shot(page, '01-sanh-tru-an');
  await reset(page);

  await axis(page, 'x', -13);
  await axis(page, 'z', 8.5);
  await shot(page, '03-lounge');
  await axis(page, 'x', -11.15);
  await axis(page, 'z', -4.45);
  await axis(page, 'x', -12.8);
  await axis(page, 'z', -7.05);
  await shot(page, '02-goc-tam-su');
  await chat(page, 'Gặp nhau ở Góc Tâm Sự');
  await expect(page.locator('.chat-content')).toContainText('Gặp nhau ở Góc Tâm Sự');
  await axis(page, 'x', -11.45);
  await axis(page, 'z', -10.22);
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => (window as any).__world3d.seated)).toBe(true);
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => (window as any).__world3d.seated)).toBe(false);
  await axis(page, 'x', -11.45);
  await axis(page, 'z', 0.5);
  await axis(page, 'x', -10.5);
  await axis(page, 'z', 3.65);
  await axis(page, 'x', -12.25);
  await page.keyboard.press('e');
  await expect.poll(() => page.evaluate(() => (window as any).__world3d.seated)).toBe(true);
  await page.waitForTimeout(800);
  await shot(page, '03b-ngoi-sofa');
  await axis(page, 'x', -10.3);
  await expect.poll(() => page.evaluate(() => (window as any).__world3d.seated)).toBe(false);
  await axis(page, 'z', -0.25);
  await axis(page, 'x', 0);
  await axis(page, 'z', -8.05);
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(0.73);
  await inspect(page, 'Liverpool — Đối thủ');
  await expect(page.getByRole('dialog')).toContainText('KHÔNG PHẢI KẾT QUẢ THẬT');
  await page.keyboard.press('Escape');
  await axis(page, 'z', -1.5);
  await corridor(page, true);

  await expect(
    page.getByRole('img', { name: 'Bản đồ Phòng Truyền Thống Liverpool' }),
  ).toBeVisible();
  await expect(page.locator('.chat-content')).not.toContainText('Gặp nhau ở Góc Tâm Sự');
  await page.waitForTimeout(900);
  await axis(page, 'z', 11.5);
  await shot(page, '06-bao-tang');
  await axis(page, 'x', -15);
  await axis(page, 'z', -1.45);
  await shot(page, '07-bill-shankly');
  await inspect(page, 'Bill Shankly · 1913–1981');
  await page.keyboard.press('Escape');
  await axis(page, 'z', 0.15);
  await axis(page, 'x', -9.6);
  await axis(page, 'z', -1.45);
  await shot(page, '08-day-cup');
  await inspect(page, 'Vô địch quốc gia Anh');
  await page.getByRole('button', { name: '2024/25', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Arne Slot');
  await page.keyboard.press('Escape');
  await axis(page, 'x', 16.7);
  await shot(page, '10-istanbul');
  await inspect(page, 'Đêm Istanbul 2005');
  await expect(page.getByRole('dialog')).toContainText('luân lưu 3–2');
  await page.keyboard.press('Escape');
  await axis(page, 'x', 12.6);
  await axis(page, 'z', -11.2);
  await axis(page, 'x', 15.54);
  await shot(page, '09-huan-luyen-vien');
  await inspect(page, 'Andoni Iraola');
  await expect(page.getByRole('dialog')).toContainText('2026–nay');
  await page.keyboard.press('Escape');
  await axis(page, 'x', 18.2);
  await axis(page, 'z', -18.8);
  await axis(page, 'x', -2);
  await shot(page, '11-timeline');
  await inspect(page, '1989 · Tưởng niệm Hillsborough');
  await expect(page.getByRole('dialog')).toContainText('97 người');
  await page.keyboard.press('Escape');

  await axis(page, 'x', 18.2);
  await axis(page, 'z', -7);
  await axis(page, 'x', 12);
  await axis(page, 'z', 9.5);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'liverpool');
  await expect(page.locator('.chat-content')).toContainText('Gặp nhau ở Góc Tâm Sự');
  // Returning from the museum faces the refuge, reversing the WASD basis.
  await walk(page, 'w', (s) => s.position.z >= 8.8);
  await reset(page);
  await axis(page, 'x', 13);
  await axis(page, 'z', 19.5);
  const before = await state(page);
  await walk(page, 's', (s) => s.map === 'plaza' && s.worldPosition.z >= -27.2);
  const returned = await state(page);
  expect(returned.position.x).toBeCloseTo(-15, 0);
  expect(returned.position.y).toBeGreaterThan(6.8);
  expect(returned.controllerRevision).toBe(before.controllerRevision);
  expect(returned.corrections).toBe(before.corrections);
  expect(returned.camera.yaw).toBe(before.camera.yaw);
  await expect(page.locator('.cave-gate-fade')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Liverpool mobile joystick and touch exhibit', async ({ browser }) => {
  test.setTimeout(110000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await start(page, false);
    const cdp = await context.newCDPSession(page);
    for (const [dimension, target] of [
      ['x', 4.8],
      ['z', -3.8],
      ['x', 0],
      ['z', -24],
      ['x', -15],
      ['z', -27.6],
    ] as const)
      await touchAxis(page, cdp, dimension, target);
    await waitForGate(page, 'liverpool', 'OPEN');
    const before = await state(page);
    // Use a target past both coordinate origins so touch stays held through the threshold.
    const stick = (await page.locator('.joystick').boundingBox())!;
    const point = { x: stick.x + stick.width / 2, y: stick.y + stick.height * 0.14 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    try {
      await expect.poll(async () => (await state(page)).map, { timeout: 12000 }).toBe('liverpool');
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await touchAxis(page, cdp, 'z', 12.6);
    expect((await state(page)).controllerRevision).toBe(before.controllerRevision);
    await shot(page, '12-mobile-hang');
    await touchAxis(page, cdp, 'z', -25.3, true);
    const returned = await state(page);
    expect(returned.map).toBe('plaza');
    expect(returned.controllerRevision).toBe(before.controllerRevision);
    expect(returned.camera.yaw).toBe(before.camera.yaw);
    await touchAxis(page, cdp, 'z', -50.6, true);
    await touchAxis(page, cdp, 'x', 0);
    await corridor(page);
    await shot(page, '13-mobile-bao-tang');
    await axis(page, 'z', -1.6);
    await page
      .getByRole('button', { name: /Khám phá · League Cup/ })
      .first()
      .tap();
    await expect(page.getByRole('heading', { name: 'League Cup', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  } finally {
    await context.close();
  }
});

test('Liverpool realtime rooms isolate avatars, chat and emotes', async ({ browser }) => {
  test.setTimeout(160000);
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    const a = await first.newPage();
    const b = await second.newPage();
    await start(a, true, 'Kop Alpha');
    await start(b, true, 'Kop Beta');
    await approachKopGate(a);
    await approachKopGate(b);
    await axis(a, 'x', -15.75);
    await axis(b, 'x', -14.25);
    await waitForGate(a, 'liverpool', 'OPEN');
    await waitForGate(b, 'liverpool', 'OPEN');
    await walk(a, 'w', (s) => s.map === 'liverpool' && s.position.z <= 31.4);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await expect.poll(async () => (await state(b)).remotes).toBe(1);
    await a.waitForTimeout(2800);
    await waitForGate(b, 'liverpool', 'OPEN');
    const aBefore = await state(a),
      bBefore = await state(b);
    await Promise.all([
      walk(a, 's', (s) => s.map === 'plaza' && s.position.z >= -27.9),
      walk(b, 'w', (s) => s.map === 'liverpool' && s.position.z <= 30.5),
    ]);
    for (const [page, before] of [
      [a, aBefore],
      [b, bBefore],
    ] as const) {
      const after = await state(page);
      expect(after.controllerRevision).toBe(before.controllerRevision);
      expect(after.sessionId).toBe(before.sessionId);
      expect(after.corrections).toBe(before.corrections);
      expect(after.camera.yaw).toBe(before.camera.yaw);
    }
    await chat(a, 'Chỉ trong Đại Sảnh');
    await expect(a.locator('.chat-content')).toContainText('Chỉ trong Đại Sảnh');
    await expect(b.locator('.chat-content')).not.toContainText('Chỉ trong Đại Sảnh');
    await walkIntoRefuge(a);
    await axis(b, 'z', 12.6);
    await axis(b, 'x', 0);
    await Promise.all([
      waitForGate(a, 'liverpool', 'CLOSED'),
      waitForGate(b, 'liverpool', 'CLOSED'),
    ]);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await chat(a, 'The Kop cùng vào hang');
    await expect(b.locator('.chat-content')).toContainText('The Kop cùng vào hang');
    await b.getByRole('button', { name: 'Biểu cảm', exact: true }).first().click();
    await b.locator('.emoji-menu').getByRole('button', { name: '😂', exact: true }).click();
    await expect
      .poll(() =>
        a.evaluate(() =>
          (window as any).__world3d.remoteAnimations.some(
            (entry: { clip: string }) => entry.clip === 'Laugh',
          ),
        ),
      )
      .toBe(true);
    await hold(b, 'w', 680);
    await corridor(a);
    await expect.poll(async () => (await state(b)).remotes).toBe(0);
    await corridor(b);
    await expect.poll(async () => (await state(a)).remotes).toBe(1);
    await chat(b, 'Hẹn gặp dưới tượng Shankly');
    await expect(a.locator('.chat-content')).toContainText('Hẹn gặp dưới tượng Shankly');
    await expect(a.locator('.chat-content')).not.toContainText('The Kop cùng vào hang');
    await walk(b, 's', (s) => s.map === 'liverpool');
    await expect.poll(async () => (await state(a)).remotes).toBe(0);
    await expect(b.locator('.chat-content')).toContainText('The Kop cùng vào hang');
  } finally {
    await first.close();
    await second.close();
  }
});
