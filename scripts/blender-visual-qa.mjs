import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';

const phase = process.argv[2] ?? 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Expected before or after');
const url = process.env.FFC_QA_URL ?? 'http://localhost:5173/playtest';
const output = process.env.FFC_QA_SHOTS ?? 'docs/visual-qa/blender-overhaul';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: 'chromium',
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
});
const report = { cpu: cpus()[0].model, url };
const errors = [];
const models = new Set();
const state = (page) => page.evaluate(() => window.__world3d);

async function open(options) {
  const page = await browser.newPage(options);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (!path.includes('/models/')) return;
    if (!response.ok() && response.status() !== 304) errors.push(`${response.status()} ${path}`);
    if (path.startsWith('/models/blender/')) models.add(path.split('/').at(-1));
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && /Blender asset|WebGLProgram|GLTFLoader/.test(message.text()))
      errors.push(message.text());
  });
  await page.route('**/api/config', (route) => route.fulfill({ json: {} }));
  await page.route('**/socket.io/**', (route) => route.abort());
  await page.goto(url);
  await page.waitForFunction(
    () => window.__world3d?.grounded && window.__world3d?.triangles > 0,
    {},
    { timeout: 30000 },
  );
  return page;
}

async function move(page, key, axis, target, greater) {
  await page.keyboard.down('Shift');
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ axis, target, greater }) =>
        greater
          ? window.__world3d?.position[axis] >= target
          : window.__world3d?.position[axis] <= target,
      { axis, target, greater },
      { timeout: 15000 },
    );
  } finally {
    await page.keyboard.up(key);
    await page.keyboard.up('Shift');
  }
  await page.waitForFunction(() => !window.__world3d?.moving);
}

async function shot(page, label, sample = false) {
  const samples = [];
  await page.waitForTimeout(450);
  if (sample) {
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(250);
      samples.push((await state(page)).fps);
    }
  }
  const { position, camera, quality, drawCalls, triangles, view, geometries, textures } =
    await state(page);
  report[label] = {
    viewport: page.viewportSize(),
    position,
    camera,
    quality,
    drawCalls,
    triangles,
    geometries,
    textures,
    view,
  };
  if (samples.length) {
    report[label].fps = [...samples].sort((a, b) => a - b);
    report[label].gpu = await page.locator('canvas').evaluate((canvas) => {
      const gl = canvas.getContext('webgl2');
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return gl.getParameter(info?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
    });
  }
  await page.screenshot({ path: `${output}/${phase}-${label}.png` });
}

try {
  const desktop = await open({ viewport: { width: 1440, height: 900 } });
  await shot(desktop, 'desktop', true);
  // Head directly into the statue, then walk around it and climb the ramp using WASD.
  await move(desktop, 'w', 'z', 7.4, false);
  const previous = (await state(desktop)).collisions;
  await desktop.keyboard.down('w');
  try {
    await desktop.waitForFunction((previous) => window.__world3d?.collisions > previous, previous, {
      timeout: 7000,
    });
    await desktop.waitForTimeout(600);
    const { position } = await state(desktop);
    if (position.z < 6.35 || position.z > 6.85)
      throw new Error('Statue collider did not stop the avatar: ' + JSON.stringify(position));
  } finally {
    await desktop.keyboard.up('w');
  }
  await move(desktop, 'd', 'x', 5.4, true);
  await move(desktop, 'w', 'z', -4.5, false);
  await shot(desktop, 'approach');
  await move(desktop, 'a', 'x', 0.12, false);
  await shot(desktop, 'behind-statue');
  await move(desktop, 'w', 'z', -26, false);
  const landing = await state(desktop);
  if (landing.position.y < 6.8 || !landing.grounded) throw new Error('Stair landing failed');
  await shot(desktop, 'portal');
  // Fixed side orbit of ~66 degrees using the actual canvas pointer control.
  await desktop.mouse.move(600, 500);
  await desktop.mouse.down();
  await desktop.mouse.move(408, 500, { steps: 12 });
  await desktop.mouse.up();
  if (Math.abs((await state(desktop)).camera.yaw - 1.152) > 0.02)
    throw new Error('Side camera preset did not apply');
  await shot(desktop, 'side');
  await desktop.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  if (phase === 'after') {
    // Approach the masonry off the portal trigger's centreline.
    await move(desktop, 'd', 'x', 4.6, true);
    const beforeContact = (await state(desktop)).collisions;
    await desktop.keyboard.down('w');
    try {
      await desktop.waitForFunction(
        (count) => window.__world3d?.collisions > count,
        beforeContact,
        { timeout: 5500 },
      );
      await desktop.waitForTimeout(400);
      const { map, position } = await state(desktop);
      if (map !== 'plaza' || position.z < -30.7 || position.z > -29.9)
        throw new Error('Gateway pillar did not stop the avatar: ' + JSON.stringify(position));
    } finally {
      await desktop.keyboard.up('w');
    }
    await move(desktop, 's', 'z', -25.7, true);
    await move(desktop, 'a', 'x', 0.12, false);
  }
  await move(desktop, 's', 'z', -5, true);
  if ((await state(desktop)).position.y > 0.3) throw new Error('Stair descent failed');
  if (phase === 'after') {
    await move(desktop, 'a', 'x', -41, false);
    await move(desktop, 'w', 'z', -24, false);
    if ((await state(desktop)).position.y < 6.8) throw new Error('West bridge ascent failed');
    await shot(desktop, 'stone-bridge');
    await move(desktop, 's', 'z', -5, true);
    if ((await state(desktop)).position.y > 0.3) throw new Error('West bridge descent failed');
    await move(desktop, 'd', 'x', 0, true);
  }
  await move(desktop, 'w', 'z', -26, false);
  await desktop.keyboard.down('w');
  try {
    await desktop.waitForFunction(() => window.__world3d?.map === 'united', null, {
      timeout: 12000,
    });
  } finally {
    await desktop.keyboard.up('w');
  }
  await desktop.reload();
  await desktop.waitForFunction(
    () => window.__world3d?.map === 'plaza' && window.__world3d?.grounded,
  );
  await desktop.getByRole('button', { name: 'Góc nhìn từ trên cao', exact: true }).click();
  await shot(desktop, 'overhead');
  await desktop.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
  await desktop.getByRole('button', { name: 'Nhìn về cổng chính', exact: true }).click();
  await shot(desktop, 'reverse');
  if (phase === 'after') {
    await desktop.getByRole('button', { name: 'Góc nhìn mặc định', exact: true }).click();
    await desktop
      .locator('.grand-sidebar')
      .getByRole('button', { name: 'Cài đặt', exact: true })
      .click();
    await desktop.getByLabel('Chất lượng 3D').selectOption('high');
    await desktop.keyboard.press('Escape');
    await desktop.waitForFunction(() => window.__world3d?.quality === 'high');
    await shot(desktop, 'desktop-high', true);
  }
  await desktop.close();

  const mobile = await open({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await shot(mobile, 'mobile', true);
  if (phase === 'after') {
    const { assets } = JSON.parse(await readFile('assets/blender-manifest.json', 'utf8'));
    for (const { id } of assets) {
      if (!models.has(id + '.glb')) errors.push(`Expected Blender asset was never loaded: ${id}`);
    }
    report.models = [...models].sort();
  }
  if (errors.length) throw new Error(errors.join('\n'));
  report.route = {
    statueBlocked: true,
    stairsUp: true,
    stairsDown: true,
    unitedTransition: true,
    westBridge: phase === 'after' ? true : undefined,
    gatewayPillar: phase === 'after' ? true : undefined,
  };
  await writeFile(`${output}/${phase}-metrics.json`, JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser.close();
}
