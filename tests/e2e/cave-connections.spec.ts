import { expect, test, type Page } from '@playwright/test';
import { CAVE_CONNECTIONS } from '../../packages/shared/caveConnections';
import { caveEntrance, CAVES } from '../../packages/shared/grandHall';
import { open, state } from '../helpers/world3d';

async function drive(page: Page, axis: 'x' | 'z', target: number, run = false) {
  const start = (await state(page)).worldPosition[axis];
  const positive = target > start;
  if (Math.abs(start - target) < 0.12) return;
  const key = axis === 'x' ? (positive ? 'd' : 'a') : positive ? 's' : 'w';
  if (run) await page.keyboard.down('Shift');
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ axis, target, positive, key }) => {
        const p = (window as any).__world3d?.worldPosition?.[axis];
        if (p === undefined || !(positive ? p >= target : p <= target)) return false;
        // Release on the sampled frame even when the recording delays the automation host.
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Key' + key.toUpperCase() }));
        return true;
      },
      { axis, target, positive, key },
      { timeout: 18000 },
    );
  } catch (error) {
    throw new Error(`Drive ${axis} to ${target}: ${JSON.stringify(await state(page))}. ${error}`);
  } finally {
    await page.keyboard.up(key);
    if (run) await page.keyboard.up('Shift');
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
}

type Club = (typeof CAVES)[number];

async function start(page: Page, live: boolean, name: string) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ffc-camera-settings',
      JSON.stringify({ autoRotate: false, sensitivity: 1, distance: 'medium' }),
    );
  });
  await open(page, live, name);
  if (live) await expect.poll(async () => (await state(page)).sessionId).not.toBe('demo');
}

async function avenue(page: Page) {
  await drive(page, 'x', 4.8);
  await drive(page, 'z', -3.6, true);
  await drive(page, 'x', 0);
  await drive(page, 'z', -24, true);
}

async function align(page: Page, axis: 'x' | 'z', target: number, tolerance = 0.62) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (Math.abs((await state(page)).worldPosition[axis] - target) < tolerance) return;
    await drive(page, axis, target);
  }
  expect(Math.abs((await state(page)).worldPosition[axis] - target)).toBeLessThan(tolerance);
}

async function approach(page: Page, cave: Club, side = 0) {
  if (cave.tier === 3) {
    await drive(page, 'x', Math.sign(cave.x) * 37.5);
    await drive(page, 'z', -49.1, true);
  }
  const door = caveEntrance(cave);
  await align(page, 'x', door.x + side, 0.42);
  await align(page, 'z', door.z + 2.1);
  try {
    await expect.poll(async () => (await state(page)).gates?.[cave.id], { timeout: 12000 }).toBe('OPEN');
  } catch (error) {
    throw new Error(`Approach ${cave.id}: ${JSON.stringify(await state(page))}. ${error}`);
  }
  return door;
}

for (const cave of CAVES) {
  test(`${cave.id} has a continuous two-way route from the Grand Hall`, async ({ page }) => {
    test.setTimeout(90000);
    await start(page, true, `QA ${cave.id}`);
    await avenue(page);
    const door = await approach(page, cave);
    const before = await state(page);
    const { roomMouth, offset } = CAVE_CONNECTIONS[cave.id];
    await drive(page, 'z', roomMouth - 3.2, true);
    const refuge = await state(page);
    expect(refuge.map).toBe(cave.id);
    expect(refuge.worldPosition.y).toBeCloseTo(offset[1], 0);
    expect(refuge.sessionId).toBe(before.sessionId);
    expect(refuge.controllerRevision).toBe(before.controllerRevision);
    expect(refuge.camera.yaw).toBe(before.camera.yaw);
    await expect(page.locator('.area-card')).toContainText(cave.name);
    await expect
      .poll(async () => (await state(page)).gates?.[cave.id], { timeout: 6500 })
      .toBe('CLOSED');
    await drive(page, 'z', door.z + 4.7, true);
    const back = await state(page);
    expect(back.map).toBe('plaza');
    expect(back.sessionId).toBe(before.sessionId);
    expect(back.controllerRevision).toBe(before.controllerRevision);
    expect(back.corrections).toBe(before.corrections);
    expect(back.camera.yaw).toBe(before.camera.yaw);
    expect(back.worldPosition.y).toBeCloseTo(cave.height, 0);
  });
}

test('two players use the same Arsenal door while other doors stay closed', async ({ browser }) => {
  test.setTimeout(110000);
  const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
  try {
    const [a, b] = await Promise.all(contexts.map((context) => context.newPage()));
    await start(a, true, 'Door QA A');
    await start(b, true, 'Door QA B');
    await Promise.all([avenue(a), avenue(b)]);
    const arsenal = CAVES.find((cave) => cave.id === 'arsenal')!;
    const [door] = await Promise.all([approach(a, arsenal, -0.65), approach(b, arsenal, 0.65)]);
    await drive(a, 'z', door.z - 1.4);
    await expect.poll(async () => (await state(b)).remotes).toBe(1);
    expect((await state(a)).gates?.united).toBe('CLOSED');
    expect((await state(b)).gates?.real).toBe('CLOSED');
    const before = await Promise.all([state(a), state(b)]);
    await Promise.all([drive(a, 'z', door.z + 4.4), drive(b, 'z', door.z - 4.7)]);
    const after = await Promise.all([state(a), state(b)]);
    expect(after.map((sample) => sample.map)).toEqual(['plaza', 'arsenal']);
    for (let i = 0; i < before.length; i++) {
      expect(after[i].controllerRevision).toBe(before[i].controllerRevision);
      expect(after[i].sessionId).toBe(before[i].sessionId);
      expect(after[i].corrections).toBe(before[i].corrections);
    }
    await Promise.all(
      [a, b].map((page) =>
        expect
          .poll(async () => (await state(page)).gates?.arsenal, { timeout: 7500 })
          .toBe('CLOSED'),
      ),
    );
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test('mobile joystick enters and exits the Manchester City refuge', async ({ browser }) => {
  test.setTimeout(90000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await start(page, false, 'Mobile QA');
    await avenue(page);
    const city = CAVES.find((cave) => cave.id === 'city')!;
    const door = await approach(page, city);
    const before = await state(page);
    const cdp = await context.newCDPSession(page);
    async function touchTo(z: number) {
      const stick = (await page.locator('.joystick').boundingBox())!;
      const forward = z < (await state(page)).worldPosition.z;
      const center = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 };
      const point = { x: center.x, y: center.y + (forward ? -1 : 1) * stick.height * 0.38 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
      try {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
        await page.waitForFunction(
          ({ z, forward }) => {
            const current = (window as any).__world3d.worldPosition.z;
            return forward ? current <= z : current >= z;
          },
          { z, forward },
          { timeout: 22000 },
        );
      } catch (error) {
        throw new Error(`Touch to ${z}: ${JSON.stringify(await state(page))}. ${error}`);
      } finally {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
    }
    await touchTo(CAVE_CONNECTIONS.city.roomMouth - 3.2);
    await expect(page.locator('.area-card')).toContainText(city.name);
    await expect(page.getByRole('img', { name: `Bản đồ ${city.name}` })).toBeVisible();
    await touchTo(door.z + 4.7);
    const after = await state(page);
    expect(after.map).toBe('plaza');
    expect(after.controllerRevision).toBe(before.controllerRevision);
    expect(after.camera.yaw).toBe(before.camera.yaw);
  } finally {
    await context.close();
  }
});

const tourDirectory = process.env.FFC_CAVE_TOUR;
if (tourDirectory) {
  test('one continuous walkthrough of all eight newly connected caves', async ({ browser }) => {
    test.setTimeout(400000);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: tourDirectory, size: { width: 1024, height: 640 } },
    });
    const page = await context.newPage();
    const video = page.video();
    try {
      await start(page, true, 'Tour 8 hang');
      await avenue(page);
      const before = await state(page);
      const route = [
        'real',
        'arsenal',
        'united',
        'chelsea',
        'city',
        'barcelona',
        'psg',
        'bayern',
      ] as const;
      for (const id of route) {
        const cave = CAVES.find((item) => item.id === id)!;
        const door = await approach(page, cave);
        const { roomMouth, offset } = CAVE_CONNECTIONS[id];
        await drive(page, 'z', roomMouth - 3.3, true);
        await expect.poll(async () => (await state(page)).map).toBe(id);
        expect((await state(page)).worldPosition.y).toBeCloseTo(offset[1], 0);
        await expect(page.locator('.area-card')).toContainText(cave.name);
        await page.waitForTimeout(330);
        await drive(page, 'z', door.z + 4.2, true);
        const returned = await state(page);
        expect(returned.map).toBe('plaza');
        expect(returned.corrections, `${id}: positions accepted by server through both directions`).toBe(before.corrections);
        console.log(`Verified round trip: ${id}`);
        if (cave.tier === 3 && id !== 'bayern') await drive(page, 'x', Math.sign(cave.x) * 37.5);
        if (id !== 'bayern') await drive(page, 'z', -24, true);
      }
      const after = await state(page);
      expect(after.controllerRevision).toBe(before.controllerRevision);
      expect(after.sessionId).toBe(before.sessionId);
      expect(after.corrections).toBe(before.corrections);
    } finally {
      await context.close();
    }
    if (video) await video.saveAs(`${tourDirectory}/eight-caves.webm`);
  });
}
