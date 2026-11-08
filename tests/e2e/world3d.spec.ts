import { PerspectiveCamera, Vector3 } from 'three';
import { hallCoaches, hallHistory, hallStatue, hallTrophies } from '../../packages/shared/museum/hall';
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
const authBase = `http://127.0.0.1:${process.env.FFC_TEST_AUTH_PORT || 3100}`;
const shotDir = process.env.FFC_TEST_SHOTS || 'docs';
fs.mkdirSync(shotDir, { recursive: true });
type State = {
  map: string;
  position: { x: number; y: number; z: number };
  worldPosition: { x: number; y: number; z: number };
  camera: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    viewYaw: number;
    viewPitch: number;
  };
  direction: number;
  movementDirection: number | null;
  movementVelocity: { x: number; z: number };
  input: { keys: string[]; joystick: { x: number; y: number }; basisYaw: number | null };
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
  cameraHit?: number;
  gates?: Record<string, string>;
};
async function state(page: Page): Promise<State> {
  return page.evaluate(() => (window as any).__world3d || {});
}
function angleDelta(to: number, from: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
function behindError(s: State) {
  return Math.abs(angleDelta(s.direction - Math.PI, s.camera.yaw));
}
function motionSample(s: State, elapsedMs: number) {
  return {
    elapsedMs: Math.round(elapsedMs),
    input: s.input,
    cameraYaw: s.camera.yaw,
    characterFacing: s.direction,
    movementDirection: s.movementDirection,
    movementVelocity: s.movementVelocity,
    position: s.position,
  };
}
async function attachMotion(samples: ReturnType<typeof motionSample>[]) {
  const path = test.info().outputPath('input-camera-motion.json');
  fs.writeFileSync(path, JSON.stringify(samples, null, 2));
  await test.info().attach('input-camera-motion.json', {
    path,
    contentType: 'application/json',
  });
}
async function orbitQuarterTurn(page: Page) {
  await page.mouse.move(1000, 400);
  await page.mouse.down();
  await page.mouse.move(738, 400, { steps: 12 });
  await page.mouse.up();
}
async function dragCamera(page: Page, x: number, y: number, dx: number, dy: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}
function cameraArm(s: State) {
  return Math.hypot(
    s.camera.x - s.worldPosition.x,
    s.camera.y - s.worldPosition.y - 1.4,
    s.camera.z - s.worldPosition.z,
  );
}
async function loginFixture(page: Page, name: string) {
  const result = await fetch(`${authBase}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: name + '@test.invalid', password: 'good-password' }),
  });
  const session = await result.json();
  await fetch(`${authBase}/rest/v1/profiles`, {
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
  const path = `${shotDir}/grand-hall-performance.json`;
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

const heldMovement = [
  { keys: ['a'], x: -1, z: 0, startZ: 35, duration: 5000 },
  { keys: ['d'], x: 1, z: 0, startZ: 35, duration: 5000 },
  { keys: ['s'], x: 0, z: 1, startZ: 10, duration: 5000 },
  { keys: ['w', 'a'], x: -Math.SQRT1_2, z: -Math.SQRT1_2, startZ: 34, duration: 1500 },
  { keys: ['w', 'd'], x: Math.SQRT1_2, z: -Math.SQRT1_2, startZ: 34, duration: 1500 },
];

for (const { keys, x, z, startZ, duration } of heldMovement) {
  test(`third-person holds ${keys.join('+').toUpperCase()} for ${duration / 1000}s with a straight path`, async ({
    page,
  }) => {
    await open(page, false);
    await axis(page, 'z', startZ);
    const initial = await state(page);
    const samples = [motionSample(initial, 0)];
    try {
      for (const key of keys) await page.keyboard.down(key);
      const started = performance.now();
      for (let elapsed = 250; elapsed <= duration; elapsed += 250) {
        await page.waitForTimeout(Math.max(0, started + elapsed - performance.now()));
        samples.push(motionSample(await state(page), performance.now() - started));
      }
    } finally {
      for (const key of [...keys].reverse()) await page.keyboard.up(key);
      await attachMotion(samples);
    }

    for (const sample of samples.slice(1)) {
      const v = sample.movementVelocity;
      expect(v.x * x + v.z * z).toBeGreaterThan(4.8);
      expect(Math.abs(v.x * z - v.z * x)).toBeLessThan(0.15);
      expect(Math.abs(angleDelta(sample.cameraYaw, initial.camera.yaw))).toBeLessThan(0.01);
      expect(Math.abs(angleDelta(sample.characterFacing, Math.PI))).toBeLessThan(0.01);
    }
    const last = samples.at(-1)!.position;
    const dx = last.x - initial.position.x;
    const dz = last.z - initial.position.z;
    expect(dx * x + dz * z).toBeGreaterThan((4.5 * duration) / 1000);
    expect(Math.abs(dx * z - dz * x)).toBeLessThan(0.25);
  });
}

for (const map of ['plaza', 'united', 'liverpool'] as const) {
  test(`third-person pitch and full orbit in ${map}`, async ({ page }) => {
    await open(page, false);
    if (map !== 'plaza') {
      await toAvenue(page);
      if (map === 'liverpool') {
        await axis(page, 'x', -15);
        await axis(page, 'z', -27.6);
        await expect.poll(async () => (await state(page)).gates?.liverpool).toBe('OPEN');
      }
      await walk(page, 'w', (s) => s.map === map && (map !== 'united' || s.position.z <= 1));
      if (map === 'liverpool') {
        // Start under the tunnel roof so the camera arm stays inside the doorway.
        await axis(page, 'z', 29);
        await expect.poll(async () => (await state(page)).grounded).toBe(true);
        await dragCamera(page, 1000, 400, 0, 240);
        await expect
          .poll(async () => (await state(page)).camera.viewPitch)
          .toBeCloseTo((-65 * Math.PI) / 180, 2);
        await expect.poll(async () => (await state(page)).cameraHit ?? Infinity).toBeLessThan(5.4);
        expect((await state(page)).camera.y).toBeLessThan(12.5);
        await axis(page, 'z', 12.5);
        await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
      }
    }
    await expect.poll(async () => (await state(page)).grounded).toBe(true);
    const viewPitch = async () => (await state(page)).camera.viewPitch;
    const up = (70 * Math.PI) / 180;
    const down = (-65 * Math.PI) / 180;

    await dragCamera(page, 1000, 450, 0, -340);
    await expect.poll(viewPitch).toBeCloseTo(up, 2);
    // At this angle the arm must retract before it reaches the floor.
    expect((await state(page)).cameraHit).toBeLessThan(5.4);
    const lowCamera = await state(page);
    expect(lowCamera.camera.y).toBeGreaterThan(lowCamera.worldPosition.y);

    let turned = 0;
    let yaw = (await state(page)).camera.viewYaw;
    for (let i = 0; i < 3; i++) {
      await dragCamera(page, 1050, 400, -400, 0);
      const before = yaw;
      await expect
        .poll(async () => angleDelta((await state(page)).camera.viewYaw, before))
        .toBeCloseTo(2.4, 2);
      yaw = (await state(page)).camera.viewYaw;
      turned += angleDelta(yaw, before);
      expect(await viewPitch()).toBeCloseTo(up, 2);
    }
    expect(turned).toBeGreaterThan(Math.PI * 2);

    await page.keyboard.press('r');
    await expect.poll(async () => behindError(await state(page))).toBeLessThan(0.02);
    expect(await viewPitch()).toBeCloseTo(up, 2);
    const beforeRun = await state(page);
    await walk(
      page,
      'w',
      (s) =>
        Math.hypot(s.position.x - beforeRun.position.x, s.position.z - beforeRun.position.z) > 1,
    );
    expect(await viewPitch()).toBeCloseTo(up, 2);

    const floor = (await state(page)).position.y;
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(floor + 0.2);
    expect(await viewPitch()).toBeCloseTo(up, 2);
    await expect.poll(async () => (await state(page)).grounded).toBe(true);

    await dragCamera(page, 1000, 180, 0, 520);
    await expect.poll(viewPitch).toBeCloseTo(down, 2);
    expect((await state(page)).map).toBe(map);
    if (map === 'liverpool') {
      // At maximum zoom-out the arm reaches the vault above the main hall.
      await page.mouse.move(1000, 400);
      await page.mouse.wheel(0, 1000);
      await expect.poll(async () => cameraArm(await state(page))).toBeGreaterThan(5.4);
      const vaulted = await state(page);
      expect(vaulted.cameraHit).toBeLessThan(12);
      expect(vaulted.camera.viewPitch).toBeCloseTo(down, 2);
    }
  });
}

test('third-person touch pitch works alongside joystick and jump HUD', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await open(page, false);
    await expect.poll(async () => (await state(page)).grounded).toBe(true);
    const cdp = await context.newCDPSession(page);
    const touch = (
      type: 'touchStart' | 'touchMove' | 'touchEnd',
      ...touchPoints: { x: number; y: number; id: number }[]
    ) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    const stick = (await page.locator('.joystick').boundingBox())!;
    const move = { x: stick.x + stick.width * 0.8, y: stick.y + stick.height / 2, id: 1 };
    const look = { x: 300, y: 480, id: 2 };
    await touch('touchStart', move);
    await touch('touchStart', move, look);
    await touch('touchMove', move, { ...look, y: 240 });
    await expect.poll(async () => (await state(page)).camera.viewPitch).toBeCloseTo(0.95, 2);
    expect((await state(page)).input.joystick.x).toBeGreaterThan(0.25);
    await touch('touchEnd');
    await expect.poll(async () => (await state(page)).moving).toBe(false);
    await expect.poll(async () => (await state(page)).input.joystick.x).toBe(0);
    expect((await state(page)).camera.viewPitch).toBeCloseTo(0.95, 2);

    const floor = (await state(page)).position.y;
    await page.getByRole('button', { name: 'Nhảy', exact: true }).tap();
    await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(floor + 0.2);
    expect((await state(page)).camera.viewPitch).toBeCloseTo(0.95, 2);
    await touch('touchStart', { ...look, y: 240 });
    await touch('touchMove', { ...look, y: 650 });
    await touch('touchEnd');
    await expect.poll(async () => (await state(page)).camera.viewPitch).toBeCloseTo(-1.1, 2);
  } finally {
    await context.close();
  }
});

test('third-person W holds its steering during orbit, then recenters and clears obstacles', async ({
  page,
}) => {
  await open(page, false);
  await axis(page, 'z', 33);
  const beforeDrag = await state(page);
  const started = performance.now();
  const samples = [motionSample(beforeDrag, 0)];
  const sample = async () => {
    const s = await state(page);
    samples.push(motionSample(s, performance.now() - started));
    return s;
  };
  await page.keyboard.down('w');
  try {
    await expect
      .poll(async () => (await state(page)).position.z)
      .toBeLessThan(beforeDrag.position.z - 0.2);
    await expect.poll(async () => behindError(await state(page))).toBeLessThan(0.1);
    await page.mouse.move(1000, 400);
    await page.mouse.down();
    await page.mouse.move(800, 310, { steps: 12 });
    const manual = (await sample()).camera.yaw;
    await page.waitForTimeout(1050);
    expect((await sample()).camera.yaw).toBeCloseTo(manual, 3);
    await page.mouse.up();
    await page.waitForTimeout(650);
    expect((await sample()).camera.yaw).toBeCloseTo(manual, 3);
    await expect
      .poll(async () => behindError(await state(page)), { timeout: 2200 })
      .toBeLessThan(0.15);
    const after = await sample();
    expect((await state(page)).camera.viewPitch).toBeCloseTo(0.2, 2);
    expect(Math.abs(after.position.x - beforeDrag.position.x)).toBeLessThan(0.25);
    for (const point of samples.slice(1)) {
      expect(point.movementVelocity.z).toBeLessThan(-4.8);
      expect(Math.abs(point.movementVelocity.x)).toBeLessThan(0.15);
    }
  } finally {
    await page.mouse.up();
    await page.keyboard.up('w');
    await attachMotion(samples);
  }

  await axis(page, 'x', 0);
  await axis(page, 'z', 7.2);
  await page.getByRole('button', { name: 'Nhìn về cổng chính', exact: true }).click();
  await expect.poll(async () => (await state(page)).cameraHit).toBeLessThan(1.6);
  const squeezed = await state(page);
  expect(cameraArm(squeezed)).toBeLessThan(1.6);
  await walk(page, 'w', (s) => s.position.z > 13);
  await expect.poll(async () => cameraArm(await state(page))).toBeGreaterThan(5);
  expect((await state(page)).cameraHit).toBeUndefined();

  const settings = page.getByRole('button', { name: 'Cài đặt', exact: true }).first();
  await settings.click();
  const auto = page.getByRole('button', { name: 'Camera tự xoay' });
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await auto.click();
  await page.getByRole('slider', { name: 'Độ nhạy xoay chuột' }).press('End');
  await page.getByLabel('Khoảng cách camera').selectOption('near');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await expect.poll(async () => cameraArm(await state(page))).toBeCloseTo(4.2, 1);
  await hold(page, 'd', 650);
  expect((await state(page)).camera.yaw).toBeCloseTo(0, 3);
  await page.mouse.move(1000, 400);
  await page.mouse.down();
  await page.mouse.move(900, 400, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).camera.yaw).toBeCloseTo(1.2, 2);

  await page.reload();
  await expect.poll(async () => (await state(page)).grounded, { timeout: 30000 }).toBe(true);
  await expect.poll(async () => cameraArm(await state(page))).toBeCloseTo(4.2, 1);
  await settings.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('slider', { name: 'Độ nhạy xoay chuột' })).toHaveValue('2');
  await expect(page.getByLabel('Khoảng cách camera')).toHaveValue('near');
});

test('third-person samples a 90° orbit on the next move and can recenter with R or the HUD', async ({
  page,
}) => {
  await open(page, false);
  await axis(page, 'z', 35);
  const initial = await state(page);
  const samples = [motionSample(initial, 0)];
  const started = performance.now();
  try {
    await orbitQuarterTurn(page);
    await expect.poll(async () => (await state(page)).camera.yaw).toBeCloseTo(Math.PI / 2, 2);
    const before = await state(page);
    samples.push(motionSample(before, performance.now() - started));
    expect(Math.abs(angleDelta(before.direction, initial.direction))).toBeLessThan(0.01);
    for (const [key, x, z] of [
      ['w', -1, 0],
      ['s', 1, 0],
      ['a', 0, 1],
      ['d', 0, -1],
    ] as const) {
      await page.keyboard.down(key);
      try {
        await expect.poll(async () => (await state(page)).moving).toBe(true);
        const s = await state(page);
        samples.push(motionSample(s, performance.now() - started));
        expect(s.input.basisYaw).toBeCloseTo(Math.PI / 2, 2);
        expect(s.movementVelocity.x * x + s.movementVelocity.z * z).toBeGreaterThan(4.8);
        expect(Math.abs(s.movementVelocity.x * z - s.movementVelocity.z * x)).toBeLessThan(0.15);
        expect(behindError(s)).toBeLessThan(0.01);
      } finally {
        await page.keyboard.up(key);
      }
      await expect.poll(async () => (await state(page)).moving).toBe(false);
    }

    for (const reset of [
      () => page.keyboard.press('r'),
      () => page.getByRole('button', { name: 'Căn camera sau nhân vật' }).click(),
    ]) {
      await orbitQuarterTurn(page);
      await expect.poll(async () => behindError(await state(page))).toBeGreaterThan(1.5);
      await reset();
      await expect
        .poll(async () => behindError(await state(page)), { intervals: [20] })
        .toBeLessThan(1.2);
      expect(behindError(await state(page))).toBeGreaterThan(0.1);
      await expect.poll(async () => behindError(await state(page))).toBeLessThan(0.02);
    }

    await page.getByRole('button', { name: 'Cài đặt', exact: true }).first().click();
    await page.getByRole('button', { name: 'Camera tự xoay' }).click();
    await page.keyboard.press('Escape');
    await page.keyboard.down('w');
    try {
      await expect.poll(async () => (await state(page)).moving).toBe(true);
      await orbitQuarterTurn(page);
      const s = await state(page);
      samples.push(motionSample(s, performance.now() - started));
      expect(s.input.basisYaw).toBeCloseTo(Math.PI / 2, 2);
      expect(s.movementVelocity.x).toBeLessThan(-4.8);
      expect(Math.abs(s.movementVelocity.z)).toBeLessThan(0.15);
      await expect.poll(async () => (await state(page)).camera.yaw).toBeCloseTo(Math.PI, 2);
      await page.keyboard.down('s');
      try {
        await expect.poll(async () => (await state(page)).moving).toBe(false);
        await page.keyboard.up('w');
        await expect.poll(async () => (await state(page)).movementVelocity.x).toBeGreaterThan(4.8);
        const reversed = await state(page);
        samples.push(motionSample(reversed, performance.now() - started));
        expect(reversed.input.basisYaw).toBeCloseTo(Math.PI / 2, 2);
        expect(Math.abs(reversed.movementVelocity.z)).toBeLessThan(0.15);
      } finally {
        await page.keyboard.up('s');
      }
    } finally {
      await page.keyboard.up('w');
    }
  } finally {
    await attachMotion(samples);
  }
});

test('third-person mobile joystick traces a full circle in one steering frame', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const samples: ReturnType<typeof motionSample>[] = [];
  try {
    const page = await context.newPage();
    await open(page, false);
    const touch = await context.newCDPSession(page);
    const stick = (await page.getByLabel('Joystick di chuyển').boundingBox())!;
    const point = (angle: number) => ({
      x: stick.x + stick.width / 2 + 25 * Math.cos(angle),
      y: stick.y + stick.height / 2 + 25 * Math.sin(angle),
    });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(0)] });
    await expect.poll(async () => (await state(page)).moving).toBe(true);
    const initial = await state(page);
    const started = performance.now();
    samples.push(motionSample(initial, 0));
    for (let i = 1; i <= 32; i++) {
      const angle = (i * 2 * Math.PI) / 32;
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [point(angle)],
      });
      await page.waitForTimeout(85);
      const s = await state(page);
      samples.push(motionSample(s, performance.now() - started));
      expect(s.movementDirection).not.toBeNull();
      expect(
        Math.abs(angleDelta(s.movementDirection!, Math.atan2(Math.cos(angle), Math.sin(angle)))),
      ).toBeLessThan(0.12);
      expect(s.input.basisYaw).toBeCloseTo(initial.camera.yaw, 3);
      expect(s.camera.yaw).toBeCloseTo(initial.camera.yaw, 3);
      expect(behindError(s)).toBeLessThan(0.01);
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const end = await state(page);
    expect(
      Math.hypot(end.position.x - initial.position.x, end.position.z - initial.position.z),
    ).toBeLessThan(1.8);
    await expect.poll(async () => (await state(page)).input.basisYaw).toBeNull();
    expect((await state(page)).camera.yaw).toBeCloseTo(initial.camera.yaw, 3);
  } finally {
    await attachMotion(samples);
    await context.close();
  }
});

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
  await page.screenshot({ path: `${shotDir}/grand-hall-default.png` });
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
  await expect.poll(async () => (await state(page)).gates?.bayern).toBe('OPEN');
  await page.screenshot({ path: `${shotDir}/grand-hall-bayern.png` });
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
  await expect.poll(async () => (await state(page)).gates?.real).toBe('OPEN');
  await axis(page, 'z', -24.5);
  await axis(page, 'x', 45);
  await axis(page, 'z', -27.2);
  await expect.poll(async () => (await state(page)).gates?.barcelona).toBe('OPEN');
  await axis(page, 'z', -24.5);
  await page.getByRole('button', { name: 'Góc nhìn từ trên cao', exact: true }).click();
  await expect.poll(async () => (await state(page)).view).toBe('atlas');
  await page.screenshot({ path: `${shotDir}/grand-hall-overview.png` });
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'x', 0);
  await walk(page, 'w', (s) => s.map === 'united' && s.position.z <= 1);
  await expect(page.locator('.area-card')).toContainText('Hang Quỷ Đỏ');
  await page.screenshot({ path: `${shotDir}/grand-hall-mu-interior.png` });
  await axis(page, 'x', 4);
  await expect.poll(async () => behindError(await state(page))).toBeLessThan(0.1);
  await axis(page, 'z', -3);
  await axis(page, 'z', 0);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'plaza');
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(6.9);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  expect(Math.abs((await state(page)).position.z - (-31.2))).toBeLessThan(1.6);
  expect(behindError(await state(page))).toBeLessThan(0.1);
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
  // Leave clearance around the north columns of the prediction pavilion.
  await axis(page, 'z', -6.2);
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
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Tải PNG', exact: true }).click(),
  ]);
  const pngPath = await download.path();
  expect(pngPath).toBeTruthy();
  expect(fs.statSync(pngPath!).size).toBeGreaterThan(10000);
  fs.copyFileSync(pngPath!, `${shotDir}/grand-hall-photo-mode.png`);
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
  const beforeOrbit = (await state(page)).camera.yaw;
  await page.mouse.move(80, 400, { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).camera.yaw - beforeOrbit).toBeGreaterThan(1);
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
  await page.screenshot({ path: `${shotDir}/grand-hall-mobile.png` });
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
  await page.screenshot({ path: `${shotDir}/grand-hall-entrance.png` });
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
  await page.screenshot({ path: `${shotDir}/grand-hall-desktop.png` });
  await page.getByRole('button', { name: 'Góc nhìn từ trên cao', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shotDir}/grand-hall-overview.png` });
});

async function museumShot(page: Page, name: string) {
  const toast = page.getByRole('button', { name: 'Đóng thông báo' });
  if (await toast.isVisible()) await toast.click();
  await page.waitForFunction(() =>
    ['/art/mu-manager-portraits.webp', ...['1878', '1958', '1999', '2008'].map((year) => `/art/mu-history/${year}.webp`)]
      .every((path) => performance.getEntriesByName(new URL(path, location.href).href).length > 0),
  );
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${process.env.FFC_MU_SHOTS ?? test.info().outputDir}/${name}.png` });
}

async function clickMuseumMesh(page: Page, point: Vector3) {
  const canvas = (await page.locator('.three-canvas canvas').boundingBox())!;
  const { camera: view } = await state(page);
  const camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.08, 320);
  camera.position.set(view.x, view.y, view.z);
  const horizontal = Math.cos(view.viewPitch);
  camera.lookAt(camera.position.clone().add(new Vector3(
    -Math.sin(view.viewYaw) * horizontal,
    Math.sin(view.viewPitch),
    -Math.cos(view.viewYaw) * horizontal,
  )));
  camera.updateMatrixWorld();
  const screen = point.project(camera);
  await page.mouse.click(canvas.x + (screen.x + 1) * canvas.width / 2, canvas.y + (1 - screen.y) * canvas.height / 2);
}

async function enterUnitedForMuseum(page: Page) {
  await toAvenue(page);
  const { x } = (await state(page)).position;
  if (Math.abs(x) > 0.35) {
    const key = x < 0 ? 'd' : 'a';
    await page.keyboard.down(key);
    try {
      await expect
        .poll(async () => (await state(page)).position.x * Math.sign(x), { intervals: [30] })
        .toBeLessThan(0.12);
    } finally {
      await page.keyboard.up(key);
    }
    await expect.poll(async () => (await state(page)).moving).toBe(false);
  }
  await walk(page, 'w', (s) => s.map === 'united' && s.position.z <= 1);
}

test('MU 3D: refuge, separate museum, physical exhibits, history and full return flow online', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('ffc-camera-settings', JSON.stringify({ autoRotate: false }));
  });
  await open(page);
  await enterUnitedForMuseum(page);
  await expect(page.getByRole('img', { name: 'Bản đồ Hang Quỷ Đỏ' })).toBeVisible();
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await page.waitForTimeout(250);
  // Walk into the plinth, rather than injecting coordinates or bypassing collision.
  await walk(page, 'w', (s) => s.position.z < -4.9);
  await hold(page, 'w', 500);
  expect((await state(page)).position.z).toBeGreaterThan(-5.3);
  expect((await state(page)).collisions).toBeGreaterThan(0);
  await axis(page, 'x', -10);
  await axis(page, 'z', -6.3);
  await expect(page.locator('.cave-wayfinding')).toContainText('Góc Tâm Sự Fan');
  // Circle the plinth and enter the opaque passage in the back of the refuge.
  await axis(page, 'x', -8);
  await axis(page, 'z', -2.5);
  await axis(page, 'x', 5);
  await axis(page, 'z', -8);
  await axis(page, 'x', 0);
  await walk(page, 'w', (s) => s.map === 'hall-of-legends');
  await expect(page.locator('.museum-breadcrumb')).toContainText('Phòng Truyền Thống');
  await expect(page.getByRole('img', { name: 'Bản đồ Phòng Truyền Thống MU' })).toBeVisible();
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await page.waitForTimeout(250);
  expect((await state(page)).position.x).toBeCloseTo(0, 0);
  expect((await state(page)).position.z).toBeGreaterThan(8);
  await museumShot(page, '01-entrance');
  const standing = (await state(page)).position;
  await page.keyboard.press('Space');
  await expect
    .poll(async () => (await state(page)).position.y, { intervals: [30] })
    .toBeGreaterThan(0.25);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  expect(Math.abs((await state(page)).position.x - standing.x)).toBeLessThan(0.15);
  await axis(page, 'z', -1.8);
  await dragCamera(page, 840, 425, 0, -35);
  await museumShot(page, '02-trophy-wall');
  await axis(page, 'z', -9.35);
  for (const trophy of hallTrophies) {
    await axis(page, 'x', trophy.x);
    await expect(page.locator('.interaction-prompt')).toContainText(trophy.title.vi);
    await page.keyboard.press('f');
    await expect(page.getByRole('heading', { name: trophy.title.vi, exact: true })).toBeVisible();
    await expect(page.locator('.blues-seasons button')).toHaveCount(trophy.seasons.length);
    const last = trophy.seasons.at(-1)!;
    await page.locator('.blues-seasons').getByRole('button', { name: last.season, exact: true }).click();
    await expect(page.locator('.museum-exhibit').last()).toContainText(last.manager);
    await page.keyboard.press('Escape');
  }
  await hold(page, 'w', 850);
  expect((await state(page)).position.z).toBeGreaterThan(-10.3);
  await axis(page, 'z', -7.05);
  const carrick = hallCoaches.at(-1)!;
  await axis(page, 'x', carrick.x);
  await dragCamera(page, 835, 455, 0, -70);
  expect((await state(page)).camera.pitch).toBeGreaterThan(0.2);
  await page.waitForTimeout(260);
  await clickMuseumMesh(page, new Vector3(carrick.x, 4.93, -11.5));
  await expect(page.getByRole('heading', { name: 'Michael Carrick', exact: true })).toBeVisible();
  await expect(page.locator('.museum-exhibit')).toContainText('Đương nhiệm');
  await page.keyboard.press('Escape');
  const beforeOrbit = await state(page);
  for (let i = 0; i < 4; i++) await dragCamera(page, 1040, 410, -355, 0);
  const afterOrbit = await state(page);
  expect(afterOrbit.camera.yaw - beforeOrbit.camera.yaw).toBeGreaterThan(Math.PI * 2);
  expect(afterOrbit.camera.pitch).toBeCloseTo(beforeOrbit.camera.pitch, 3);
  expect(afterOrbit.position.x).toBeCloseTo(beforeOrbit.position.x, 1);
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();

  await axis(page, 'z', -5.9);
  await axis(page, 'x', hallStatue.x);
  await axis(page, 'z', -6.3);
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'Sir Alex Ferguson', exact: true })).toBeVisible();
  await expect(page.locator('.museum-exhibit')).toContainText('1986');
  await page.keyboard.press('Escape');
  await dragCamera(page, 845, 430, 0, -43);
  await museumShot(page, '03-ferguson-statue');
  await hold(page, 'w', 850);
  expect((await state(page)).position.z).toBeGreaterThan(-7.1);

  await axis(page, 'z', 0.6);
  await axis(page, 'x', 12.2);
  for (const milestone of [...hallHistory].reverse()) {
    await axis(page, 'z', milestone.z);
    await expect(page.locator('.interaction-prompt')).toContainText(milestone.year);
    await page.keyboard.press('f');
    await expect(page.getByRole('heading', { name: `${milestone.year} · ${milestone.title.vi}` })).toBeVisible();
    await expect.poll(() => page.locator('.mu-history-photo img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    if (milestone.year === '2008') await expect(page.locator('.museum-exhibit')).toContainText('6–5');
    await page.keyboard.press('Escape');
  }
  await hold(page, 'd', 760);
  expect((await state(page)).position.x).toBeLessThan(13.75);
  await axis(page, 'z', -0.55);
  await axis(page, 'x', 7.4);
  await dragCamera(page, 690, 435, 236, -33);
  await museumShot(page, '04-history-wall');
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'united');
  await expect(page.locator('.area-card')).toContainText('Hang Quỷ Đỏ');
  // Returning from the museum faces down the passage, toward the refuge.
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'z', -8);
  await axis(page, 'x', 5);
  await axis(page, 'z', 0);
  await axis(page, 'x', 0);
  await walk(page, 's', (s) => s.map === 'plaza');
  await expect(page.locator('.area-card')).toContainText('Đại Sảnh Chung');
  expect(errors).toEqual([]);
});

test('MU 3D mobile: offline entry, joystick, orbit, jump and room-specific minimaps', async ({
  browser,
}) => {
  test.setTimeout(100000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('ffc-camera-settings', JSON.stringify({ autoRotate: false }));
  });
  await open(page, false);
  await enterUnitedForMuseum(page);
  await expect(page.getByRole('img', { name: 'Bản đồ Hang Quỷ Đỏ' })).toBeVisible();
  await axis(page, 'x', 5);
  await axis(page, 'z', -8);
  await axis(page, 'x', 0);
  await walk(page, 'w', (s) => s.map === 'hall-of-legends');
  await expect(page.getByRole('img', { name: 'Bản đồ Phòng Truyền Thống MU' })).toBeVisible();
  await museumShot(page, '05-mobile-entrance');
  const initial = await state(page),
    stick = (await page.locator('.joystick').boundingBox())!;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: stick.x + stick.width * 0.82, y: stick.y + stick.height / 2 }],
  });
  try {
    await expect.poll(async () => (await state(page)).position.x).toBeGreaterThan(initial.position.x + 0.8);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
  const stopped = await state(page);
  await page.mouse.move(300, 400);
  await page.mouse.down();
  const beforeOrbit = (await state(page)).camera.yaw;
  await page.mouse.move(100, 400, { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await state(page)).camera.yaw - beforeOrbit).toBeGreaterThan(1);
  expect((await state(page)).position.x).toBeCloseTo(stopped.position.x, 1);
  await page.getByRole('button', { name: 'Nhảy', exact: true }).click();
  await expect
    .poll(async () => (await state(page)).position.y, { intervals: [30] })
    .toBeGreaterThan(0.25);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await axis(page, 'x', 0);
  await axis(page, 'z', -9.35);
  const prompt = page.locator('.interaction-prompt');
  await expect(prompt).toContainText('UEFA Europa League');
  await prompt.tap();
  await expect(page.getByRole('heading', { name: 'UEFA Europa League' })).toBeVisible();
  await museumShot(page, '06-mobile-exhibit');
  await page.getByRole('button', { name: 'Tiếp tục tham quan' }).tap();
  await walk(page, 's', (s) => s.map === 'united');
  expect(errors).toEqual([]);
  await context.close();
});
