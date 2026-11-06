import { test, expect } from '@playwright/test';

test('playtest starts and moves without Supabase configuration, including after reload', async ({
  page,
}) => {
  const errors: string[] = [];
  const socketRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('/socket.io/')) socketRequests.push(request.url());
  });
  await page.route('**/api/config', (route) => route.fulfill({ json: {} }));
  await page.goto('/playtest');

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await page.reload();
    const state = async () =>
      JSON.parse((await page.locator('canvas').getAttribute('data-world')) || '{}');
    await expect
      .poll(async () => (await state()).triangles, { timeout: 30000 })
      .toBeGreaterThan(100000);
    await expect(page.locator('.loading-world')).toHaveCount(0);
    await expect(page.locator('.area-card')).toContainText('Đại Sảnh Chung');
    const start = (await state()).position.z;
    await page.keyboard.down('w');
    try {
      await expect.poll(async () => (await state()).position.z).toBeLessThan(start - 1);
    } finally {
      await page.keyboard.up('w');
    }
    await expect.poll(async () => (await state()).moving).toBe(false);
    expect(errors).toEqual([]);
    expect(socketRequests).toEqual([]);
  }
});
