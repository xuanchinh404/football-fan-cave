import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { open, state } from '../helpers/world3d';
import type { Flight, Impact } from '../../packages/shared/store/physics';

const evidence = process.env.FFC_STORE_EVIDENCE;
const shot = async (page: Page, name: string) => {
  if (evidence) await page.screenshot({ path: resolve(evidence, name) });
};
test.skip(
  process.env.FFC_TEST_STORE !== '1',
  'Run with FFC_TEST_STORE=1 to apply the store migration in the test backend.',
);
test.setTimeout(210000);

async function player(browser: Browser, name: string, video = false) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(video && evidence
      ? { recordVideo: { dir: resolve(evidence, 'raw'), size: { width: 1200, height: 750 } } }
      : {}),
  });
  const page = await context.newPage();
  const flight: Flight[] = [],
    impact: Impact[] = [];
  page.on('websocket', (websocket) =>
    websocket.on('framereceived', ({ payload }) => {
      if (typeof payload !== 'string' || !payload.startsWith('42[')) return;
      const [event, data] = JSON.parse(payload.slice(2));
      if (event === 'store:flight') flight.push(data);
      if (event === 'store:impact') impact.push(data);
    }),
  );
  await open(page, true, name);
  await expect.poll(async () => (await state(page)).controllerRevision).toBeGreaterThan(0);
  return { page, context, flight, impact };
}

async function heading(page: Page, yaw: number, pitch?: number) {
  const { camera } = await state(page);
  const angle = Math.atan2(Math.sin(camera.yaw - yaw), Math.cos(camera.yaw - yaw));
  const dx = angle / 0.006;
  const dy = pitch === undefined ? 0 : (camera.pitch - pitch) / 0.005;
  await page.mouse.move(700, 530);
  await page.mouse.down();
  await page.mouse.move(700 + dx, 530 + dy, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => {
      const a = (await state(page)).camera.yaw - yaw;
      return Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
    })
    .toBeLessThan(0.08);
  await page.waitForTimeout(450);
}

function panel(page: Page) {
  return page.locator('.store-panel');
}
async function buy(page: Page, sku: string, price: string, quantity?: number) {
  await panel(page).getByRole('searchbox').fill(sku);
  if (quantity) await panel(page).getByRole('spinbutton').fill(String(quantity));
  await panel(page).getByRole('button', { name: price }).click();
}
async function closePanel(page: Page) {
  await panel(page).getByRole('button', { name: 'Đóng', exact: true }).click();
}
async function bag(page: Page) {
  await page.getByRole('button', { name: 'Mở túi đồ', exact: true }).click();
}
async function axis(page: Page, dimension: 'x' | 'z', target: number) {
  const start = (await state(page)).position[dimension];
  if (Math.abs(start - target) < 0.25) return;
  const forward = start < target;
  const key = dimension === 'x' ? (forward ? 'd' : 'a') : forward ? 's' : 'w';
  await page.keyboard.down(key);
  try {
    await expect
      .poll(
        async () => {
          const position = (await state(page)).position[dimension];
          return forward ? position >= target - 0.16 : position <= target + 0.16;
        },
        { timeout: 16000, intervals: [40] },
      )
      .toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
  await expect.poll(async () => (await state(page)).moving).toBe(false);
}
async function arena(page: Page, x: number, z: number) {
  await heading(page, 0);
  const initial = await state(page);
  if (initial.position.z > 20) {
    await axis(page, 'z', 22);
    await axis(page, 'x', -22);
    await axis(page, 'z', 12);
  }
  await axis(page, 'x', x);
  await axis(page, 'z', z);
}

test('walk to booth, buy, throw with two players, gift, place, wear and reconnect', async ({
  browser,
}) => {
  if (evidence) await mkdir(resolve(evidence, 'raw'), { recursive: true });
  const suffix = Date.now().toString(36).slice(-4);
  const senderName = `Fan Cà Chua ${suffix}`;
  const recipientName = `Fan Đồng Ý ${suffix}`;
  const a = await player(browser, senderName, true);
  let b: Awaited<ReturnType<typeof player>> | undefined;
  try {
    const page = a.page;
    const start = await state(page);
    await heading(page, 0);
    await axis(page, 'z', 16);
    await heading(page, Math.PI, 0.25);
    await shot(page, '01-shop-from-hall.png');
    await heading(page, 0);
    await axis(page, 'z', 22);
    await axis(page, 'x', -15);
    await axis(page, 'z', 31);
    const atBooth = await state(page);
    expect(atBooth.controllerRevision).toBe(start.controllerRevision);
    expect(atBooth.sessionId).toBe(start.sessionId);
    expect(atBooth.map).toBe('plaza');
    await heading(page, Math.PI, 0.16);
    await shot(page, '02-booth.png');
    await page.keyboard.press('f');
    await expect(
      panel(page).getByRole('heading', { name: 'Quầy Cà Khịa', exact: true }),
    ).toBeVisible();
    await expect(panel(page).locator('.store-balances')).toContainText('500 Xu');
    await panel(page).getByRole('searchbox').fill('P002');
    await panel(page).getByRole('spinbutton').fill('3');
    await shot(page, '03-purchase.png');
    await panel(page)
      .getByRole('button', { name: 'Mua · 90 Xu', exact: true })
      .dblclick({ delay: 30 });
    await expect(panel(page).locator('.store-balances')).toContainText('410 Xu');
    await panel(page).getByRole('combobox', { name: 'Chọn quầy' }).selectOption('');
    await panel(page).getByRole('searchbox').fill('');
    await expect(panel(page).locator('.store-tile')).toHaveCount(125);
    await buy(page, 'P036', 'Mua · 700 Xu');
    await expect(page.getByText('Bạn chưa đủ Xu hoặc KC.', { exact: true })).toBeVisible();
    await panel(page).getByRole('button', { name: 'Túi đồ', exact: true }).click();
    await panel(page).getByRole('searchbox').fill('P002');
    await expect(panel(page).locator('.store-tile')).toContainText('×3');
    await panel(page).getByRole('combobox', { name: 'Gán ô nhanh' }).selectOption('1');
    await shot(page, '04-inventory.png');
    await panel(page).getByRole('button', { name: 'Cầm trên tay' }).click();
    await expect(panel(page)).toHaveCount(0);
    await heading(page, Math.PI, 0.18);
    await shot(page, '05-holding-tomato.png');

    await arena(page, -31.55, 5.7);
    await heading(page, 0, 0.07);
    console.info('Practice throw', Date.now());
    await page.keyboard.press('q');
    await expect.poll(() => a.impact.at(-1)?.surface, { timeout: 12000 }).toBe('target');
    await heading(page, 1.18, 0.02);
    await page.keyboard.press('q');
    await expect.poll(() => a.impact.at(-1)?.surface, { timeout: 12000 }).toBe('wall');

    b = await player(browser, recipientName, true);
    await arena(b.page, -32.45, 2.9);
    await heading(b.page, -Math.PI / 2, 0.16);
    await b.page.getByRole('button', { name: 'Đồng ý nhận đồ ném' }).click();
    await page.getByRole('button', { name: 'Đồng ý nhận đồ ném' }).click();
    const me = (await state(page)).position;
    const friend = (await state(b.page)).position;
    const xDelta = friend.x - me.x + 0.43;
    await heading(page, Math.atan2(-xDelta, me.z - friend.z), 0.06);
    console.info('Avatar throw', Date.now());
    await page.keyboard.press('q');
    const targetId = (await state(b.page)).sessionId;
    await expect.poll(() => a.impact.at(-1)?.target).toBe(targetId);
    await expect.poll(() => b!.impact.at(-1)?.id).toBe(a.impact.at(-1)?.id);
    expect(b.flight.at(-1)?.id).toBe(a.flight.at(-1)?.id);
    await expect(page.getByRole('button', { name: 'Ném · Q', exact: true })).toHaveCount(0);

    await bag(page);
    await panel(page).getByRole('searchbox').fill('F03');
    await panel(page).getByRole('button', { name: 'Chọn người nhận' }).click();
    await panel(page)
      .getByRole('combobox', { name: 'Người nhận', exact: true })
      .selectOption({ label: recipientName });
    await panel(page).getByRole('button', { name: 'Xác nhận tặng 1 món' }).click();
    await expect(
      b.page.getByText(`${senderName} đã tặng bạn Hộp khăn giấy an ủi.`, { exact: true }),
    ).toBeVisible();
    await panel(page).getByRole('button', { name: 'Phòng riêng' }).click();
    await panel(page).getByRole('combobox', { name: 'Nội thất' }).selectOption('F19');
    await panel(page).getByRole('button', { name: 'Xoay 90°' }).click();
    await panel(page).getByRole('button', { name: 'Xác nhận đặt' }).click();
    await expect(panel(page).getByRole('button', { name: 'Thu hồi' })).toBeVisible();
    await shot(page, '07-private-room.png');
    await panel(page).getByRole('button', { name: 'Thu hồi' }).click();
    await closePanel(page);

    console.info('Jersey purchase', Date.now());
    await b.page.keyboard.press('k');
    await buy(b.page, 'P035', 'Mua · 500 Xu');
    await expect(panel(b.page).locator('.store-balances')).toContainText('0 Xu');
    await panel(b.page).getByRole('button', { name: 'Túi đồ', exact: true }).click();
    await panel(b.page).getByRole('button', { name: 'Trang bị', exact: true }).click();
    await expect(panel(b.page)).toHaveCount(0);
    await heading(b.page, Math.PI);
    await shot(b.page, '08-equipped-jersey.png');
    await b.page.reload();
    await expect(b.page.locator('.area-card')).toContainText('Realtime', { timeout: 30000 });
    await bag(b.page);
    await panel(b.page).getByRole('searchbox').fill('P035');
    await expect(panel(b.page).getByRole('button', { name: 'Tháo', exact: true })).toBeVisible();
    await expect(panel(b.page).locator('.store-balances')).toContainText('0 Xu');
    await expect.poll(async () => (await state(page)).fps).toBeGreaterThan(15);
  } finally {
    await a.context.close();
    await b?.context.close();
    if (evidence) {
      await a.page.video()?.saveAs(resolve(evidence, 'desktop-player-a.webm'));
      await b?.page.video()?.saveAs(resolve(evidence, 'desktop-player-b.webm'));
    }
  }
});

test('mobile catalogue and inventory remain usable', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await open(page, true, 'Fan Mobile');
    await bag(page);
    await expect(panel(page).getByRole('heading', { name: 'Túi Đồ' })).toBeVisible();
    await expect(panel(page).locator('.store-tile')).toHaveCount(25);
    await panel(page).getByRole('button', { name: 'Đổi sang tiếng Anh' }).tap();
    await panel(page).getByRole('button', { name: 'Shop', exact: true }).tap();
    await panel(page).getByRole('combobox', { name: 'Currency' }).selectOption('kc');
    await expect(panel(page).locator('.store-tile')).toHaveCount(29);
    await shot(page, '09-mobile.png');
    expect(await panel(page).evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
  } finally {
    await context.close();
  }
});

test('KC purchase, pet and accessories work with ten other players in the room', async ({
  browser,
}) => {
  const { io } = await import('socket.io-client');
  const authBase = `http://127.0.0.1:${process.env.FFC_TEST_AUTH_PORT || 3100}`;
  const apiBase = `http://127.0.0.1:${process.env.FFC_TEST_API_PORT || 3101}`;
  const suffix = Date.now().toString(36).slice(-4);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const bots: ReturnType<typeof io>[] = [];
  try {
    await open(page, true, `Fan Linh Vật ${suffix}`);
    await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const nickname = `QA ${suffix} ${index}`;
        const result = await fetch(`${authBase}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `${suffix}.${index}@test.invalid`,
            password: 'good-password',
          }),
        });
        const session = await result.json();
        await fetch(`${authBase}/rest/v1/profiles`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ nickname, favorite_team: 'united', avatar_key: 0 }),
        });
        const bot = io(apiBase, {
          auth: { accessToken: session.access_token },
          reconnection: false,
          transports: ['websocket'],
        });
        bots.push(bot);
        await new Promise<void>((resolve, reject) => {
          bot.once('connect_error', reject);
          bot.once('joined', () => resolve());
          bot.once('connect', () => bot.emit('join'));
        });
        // A single short, validated step is enough to separate the rigged avatars.
        const angle = (index * Math.PI) / 5;
        for (let step = 1; step <= 5; step++) {
          await new Promise((resolve) => setTimeout(resolve, 115));
          bot.emit('move', {
            x: 3000 + Math.cos(angle) * step * 22,
            y: 4080 + Math.sin(angle) * step * 22,
          });
        }
      }),
    );
    await expect.poll(async () => (await state(page)).remotes).toBeGreaterThanOrEqual(10);
    await page.keyboard.press('k');
    await buy(page, 'P070', 'Mua · 80 KC');
    await expect(panel(page).locator('.store-balances')).toContainText('20 KC');
    await panel(page).getByRole('button', { name: 'Túi đồ', exact: true }).click();
    await panel(page).getByRole('button', { name: 'Trang bị', exact: true }).click();
    await expect(panel(page)).toHaveCount(0);
    await heading(page, 0, 0.18);
    await axis(page, 'z', 25);
    await heading(page, Math.PI, 0.18);
    await shot(page, '10-pet.png');
    await bag(page);
    await panel(page).getByRole('searchbox').fill('P070');
    await panel(page).getByRole('button', { name: 'Tháo', exact: true }).click();
    await expect(panel(page).getByRole('button', { name: 'Trang bị', exact: true })).toBeVisible();
    await closePanel(page);

    await page.keyboard.press('k');
    await buy(page, 'P046', 'Mua · 350 Xu');
    await expect(panel(page).locator('.store-balances')).toContainText('150 Xu');
    await panel(page).getByRole('button', { name: 'Túi đồ', exact: true }).click();
    await panel(page).getByRole('button', { name: 'Trang bị', exact: true }).click();
    await expect(panel(page)).toHaveCount(0);
    await bag(page);
    await panel(page).getByRole('searchbox').fill('P046');
    await panel(page).getByRole('button', { name: 'Tháo', exact: true }).click();
    await expect(panel(page).getByRole('button', { name: 'Trang bị', exact: true })).toBeVisible();
    await closePanel(page);
    await page.getByRole('button', { name: 'Mở biểu cảm', exact: true }).click();
    await panel(page).getByRole('searchbox').fill('F04');
    await panel(page).getByRole('button', { name: 'Sử dụng', exact: true }).click();
    await expect(panel(page)).toHaveCount(0);

    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(600);
      samples.push((await state(page)).fps);
    }
    console.info('Ten remote avatars, FPS samples:', samples.join(', '));
    expect(Math.max(...samples)).toBeGreaterThan(15);
  } finally {
    bots.forEach((bot) => bot.disconnect());
    await context.close();
  }
});

test('a new player can sign out and sign in without receiving the starter grant twice', async ({
  page,
}) => {
  const email = `store-session-${Date.now()}@test.invalid`;
  async function signIn() {
    const form = page.locator('#login-panel');
    await form.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
    await form.getByLabel('Mật khẩu', { exact: true }).fill('good-password');
    await form.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  }
  await page.goto('/');
  await signIn();
  await page.getByPlaceholder('Anh em gọi bạn là gì?').fill('Fan Giữ Đồ');
  await page.getByRole('button', { name: 'Vào thế giới →', exact: true }).click();
  await expect(page.locator('.area-card')).toContainText('Realtime', { timeout: 30000 });
  await page
    .getByRole('button', { name: /Phố Cửa Hàng/ })
    .first()
    .click();
  await expect(panel(page).locator('.store-balances')).toContainText('500 Xu');
  await buy(page, 'P002', 'Mua · 30 Xu');
  await expect(panel(page).locator('.store-balances')).toContainText('470 Xu');
  await closePanel(page);
  await page.getByRole('button', { name: 'Hồ sơ & ví xu' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await signIn();
  await expect(page.locator('.area-card')).toContainText('Realtime', { timeout: 30000 });
  await bag(page);
  await panel(page).getByRole('searchbox').fill('P002');
  await expect(panel(page).locator('.store-tile')).toContainText('×1');
  await expect(panel(page).locator('.store-balances')).toContainText('470 Xu');
});
