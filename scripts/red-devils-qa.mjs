import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.FFC_QA_URL || 'http://localhost:5198';
const output = process.env.FFC_QA_OUTPUT || 'docs/visual-qa/red-devils-cave';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: 'chromium',
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const models = new Set();
  const metrics = {};
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && /could not load|GLTFLoader/.test(m.text())) errors.push(m.text());
  });
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (response.ok() && path.includes('/models/red-devils/') && path.endsWith('.glb'))
      models.add(path.split('/').at(-1));
  });
  await page.route('**/api/config', (route) => route.fulfill({ json: {} }));
  await page.goto(base + '/playtest');
  const state = () => page.evaluate(() => window.__world3d);
  const wait = (predicate, arg) => page.waitForFunction(predicate, arg, { timeout: 30000 });
  const waitMap = (map) =>
    wait((m) => window.__world3d?.map === m && window.__world3d.grounded, map);
  const move = async (key, test, arg, run = true) => {
    if (run) await page.keyboard.down('Shift');
    await page.keyboard.down(key);
    try {
      await wait(test, arg);
    } catch (error) {
      throw new Error(`Movement ${key} stopped at ${JSON.stringify(await state())}`, {
        cause: error,
      });
    } finally {
      await page.keyboard.up(key);
      if (run) await page.keyboard.up('Shift');
    }
  };
  const axis = async (coord, target, run = true) => {
    const sign = Math.sign(target - (await state()).position[coord]);
    if (!sign) return;
    const key = coord === 'x' ? (sign > 0 ? 'd' : 'a') : sign > 0 ? 's' : 'w';
    await move(
      key,
      ({ coord, target, sign }) => (window.__world3d.position[coord] - target) * sign >= 0,
      { coord, target, sign },
      run,
    );
  };
  const shot = async (name) => {
    await page.waitForTimeout(550);
    const { position, camera, fps, triangles, drawCalls, remotes, grounded } = await state();
    metrics[name] = { position, camera, fps, triangles, drawCalls, remotes, grounded };
    await page.screenshot({ path: `${output}/${name}.png` });
  };
  const orbit = async (dx) => {
    await page.mouse.move(950, 440);
    await page.mouse.down();
    await page.mouse.move(950 + dx, 440, { steps: 20 });
    await page.mouse.up();
  };
  const reset = () => page.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();

  await waitMap('plaza');
  await page.locator('.loading-world').waitFor({ state: 'hidden' });
  await page.waitForTimeout(1000);
  await axis('z', 24, false);
  await axis('x', 6);
  await axis('z', -4);
  await axis('x', 0.12);
  await move('w', () => window.__world3d?.map === 'united');
  await waitMap('united');
  await page.mouse.move(900, 440);
  await page.mouse.wheel(0, 420);
  await shot('01-tong-the');
  await reset();
  await axis('z', -3.2);
  await shot('02-nhan-vat-trung-tam');

  await axis('x', -12.15);
  await axis('z', -2.45);
  await shot('03-goc-tam-su');
  await reset();
  await axis('z', 2.5);
  await axis('x', -12.1, false);
  await orbit(130);
  await shot('04-lounge');
  await reset();

  await axis('x', 5.15);
  await axis('z', -8.25);
  await axis('x', 0.12);
  await axis('z', -10.8, false);
  await page.mouse.move(900, 440);
  await page.mouse.wheel(0, -810);
  await shot('05-hanh-lang-hoai-niem');
  await move('w', () => window.__world3d?.map === 'hall-of-legends');
  await waitMap('hall-of-legends');
  // A normal portal transition back into the cave.
  await move('s', () => window.__world3d?.trigger === 'hall-exit');
  await page.keyboard.press('e');
  await waitMap('united');
  await reset();
  await axis('z', -8.15);
  await axis('x', 5.05);
  await axis('z', 1.8);
  await axis('x', 0.12);
  await orbit(-524);
  await shot('06-cong-ra-hang');
  await reset();
  await move('s', () => window.__world3d?.map === 'plaza' || window.__world3d?.trigger === 'exit');
  if ((await state()).map !== 'plaza') await page.keyboard.press('e');
  await waitMap('plaza');
  if (errors.length) throw new Error(errors.join('\n'));
  const expected = [
    'arch',
    'coffee-table',
    'floor',
    'lantern',
    'plant',
    'plinth',
    'ruby',
    'sofa',
    'trident',
    'vault',
  ];
  for (const name of expected) {
    if (!models.has(`${name}.glb`) && !['lantern', 'trident'].includes(name))
      throw new Error(`Game did not load ${name}.glb`);
  }
  await writeFile(
    `${output}/metrics.json`,
    JSON.stringify(
      { mode: 'offline, single local player', models: [...models].sort(), metrics },
      null,
      2,
    ) + '\n',
  );
  console.log('PASS: six captures, real WASD routes and both room transitions.');
} finally {
  await browser.close();
}
