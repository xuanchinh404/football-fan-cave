import { expect, type Page } from '@playwright/test';
const authBase = `http://127.0.0.1:${process.env.FFC_TEST_AUTH_PORT || 3100}`;
export type State = {
  map: string;
  position: { x: number; y: number; z: number };
  worldPosition: { x: number; y: number; z: number };
  controllerRevision: number;
  sessionId: string;
  corrections: number;
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
  cameraHit?: number;
  gates?: Record<string, 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING'>;
};
export async function state(page: Page): Promise<State> {
  return page.evaluate(() => (window as any).__world3d || {});
}
export async function loginFixture(page: Page, name: string) {
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
export async function open(page: Page, live = true, name = 'Fan QA') {
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
export async function hold(page: Page, key: string, ms: number) {
  await page.keyboard.down(key);
  try {
    await page.waitForTimeout(ms);
  } finally {
    await page.keyboard.up(key);
  }
}
export async function walk(
  page: Page,
  key: string,
  condition: (s: State) => boolean,
  timeout = 20000,
) {
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
export async function axis(page: Page, key: 'x' | 'z', target: number) {
  const p = (await state(page)).position,
    forward = p[key] < target;
  await walk(page, key === 'x' ? (forward ? 'd' : 'a') : forward ? 's' : 'w', (s) =>
    forward ? s.position[key] >= target : s.position[key] <= target,
  );
}
export async function toAvenue(page: Page) {
  await axis(page, 'x', 6);
  await axis(page, 'z', -3.8);
  await axis(page, 'x', 0);
  await axis(page, 'z', -24);
  expect((await state(page)).position.y).toBeGreaterThan(6.8);
}
