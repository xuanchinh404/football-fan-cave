import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.env.FFC_QA_URL ?? 'http://localhost:5197';
const output = process.env.FFC_QA_SHOTS ?? 'docs/visual-qa/chibi-animation';
const browser = await chromium.launch({
  channel: 'chromium',
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
});
await mkdir(output, { recursive: true });
const errors = [];
const playerPage = async (options) => {
  const page = await browser.newPage(options);
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /ChibiFan|GLTFLoader|PropertyBinding/i.test(message.text()))
      errors.push(message.text());
  });
  await page.route('**/api/config', (route) => route.fulfill({ json: {} }));
  await page.route('**/socket.io/**', (route) => route.abort());
  return page;
};
const shot = (page, name) => page.screenshot({ path: `${output}/${name}.png` });
try {
  const lab = await playerPage({ viewport: { width: 1100, height: 850 } });
  const rig = lab.waitForResponse(
    (res) => res.url().endsWith('chibi-fan-07-rigged.glb') && res.ok(),
  );
  await lab.goto(`${url}/animation-test`);
  await rig;
  await lab.locator('canvas').waitFor({ state: 'visible' });
  const clips = lab.getByRole('group', { name: 'Animation clips' });
  for (const [name, delay] of [
    ['Walk', 230],
    ['Run', 155],
    ['Jump', 330],
    ['SitIdle', 650],
    ['Wave', 690],
    ['Cheer', 800],
  ]) {
    if (name === 'SitIdle') await lab.getByRole('slider', { name: 'Góc nhìn' }).press('PageUp');
    if (name === 'Wave') await lab.getByRole('slider', { name: 'Góc nhìn' }).press('PageDown');
    await clips.getByRole('button', { name, exact: true }).click();
    await lab.waitForTimeout(delay);
    await shot(lab, `lab-${name.toLowerCase()}`);
  }
  await clips.getByRole('button', { name: 'Idle', exact: true }).click();
  await lab.getByRole('button', { name: 'Cận mặt' }).click();
  for (const name of ['Tự động', 'Blink', 'Smile', 'Angry']) {
    await lab
      .getByRole('group', { name: 'Biểu cảm khuôn mặt' })
      .getByRole('button', { name, exact: true })
      .click();
    await lab.waitForTimeout(320);
    await shot(lab, `face-${name === 'Tự động' ? 'neutral' : name.toLowerCase()}`);
  }
  await lab.close();

  const page = await playerPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${url}/playtest`);
  await page.waitForFunction(() => window.__world3d?.grounded && window.__world3d?.triangles > 0);
  await page.mouse.move(880, 465);
  await page.mouse.wheel(0, -950);
  await page.keyboard.down('w');
  try {
    await page.waitForFunction(() => window.__world3d?.moving);
    await page.waitForTimeout(230);
    await shot(page, 'game-walk');
    await page.keyboard.down('Shift');
    await page.waitForTimeout(260);
    await shot(page, 'game-run');
  } finally {
    await page.keyboard.up('Shift');
    await page.keyboard.up('w');
  }
  await page.keyboard.press('Space');
  await page.waitForFunction(
    () => !window.__world3d?.grounded && window.__world3d?.position.y > 0.25,
  );
  await shot(page, 'game-jump');
  await page.waitForFunction(() => window.__world3d?.grounded);
  console.log(
    'Desktop diagnostics',
    await page.evaluate(() => {
      const { fps, drawCalls, triangles } = window.__world3d;
      return { fps, drawCalls, triangles };
    }),
  );
  async function walk(key, axis, target, sign) {
    await page.keyboard.down('Shift');
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(
        ({ axis, target, sign }) => (window.__world3d.position[axis] - target) * sign >= 0,
        { axis, target, sign },
        { timeout: 12000 },
      );
    } catch (error) {
      console.error(key, axis, target, await page.evaluate(() => window.__world3d));
      throw error;
    } finally {
      await page.keyboard.up(key);
      await page.keyboard.up('Shift');
    }
  }
  await walk('d', 'x', 6, 1);
  await walk('w', 'z', -4, -1);
  await walk('a', 'x', 0.1, -1);
  await walk('w', 'z', -27, -1);
  await page.keyboard.down('w');
  try {
    await page.waitForFunction(() => window.__world3d?.map === 'united');
  } finally {
    await page.keyboard.up('w');
  }
  await page.waitForFunction(() => window.__world3d?.grounded);
  await walk('a', 'x', -8.2, -1);
  await walk('w', 'z', -6.78, -1);
  await walk('a', 'x', -13.05, -1);
  await page.keyboard.down('w');
  await page.waitForTimeout(80);
  await page.keyboard.up('w');
  await page.waitForTimeout(250);
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__world3d?.seated, undefined, { timeout: 5000 });
  await page.mouse.move(910, 470);
  await page.mouse.down();
  await page.mouse.move(1160, 540, { steps: 14 });
  await page.mouse.up();
  await page.waitForTimeout(850);
  await shot(page, 'game-sit-mu');
  await page.keyboard.down('d');
  try {
    await page.waitForFunction(() => window.__world3d?.seated === false);
  } finally {
    await page.keyboard.up('d');
  }
  await page.close();
  const mobile = await playerPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(`${url}/playtest`);
  await mobile.waitForFunction(() => window.__world3d?.grounded);
  await mobile.waitForTimeout(700);
  await shot(mobile, 'game-mobile');
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
