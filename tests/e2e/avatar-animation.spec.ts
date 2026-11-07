import { expect, test, type Page } from '@playwright/test';
import { open, state } from '../helpers/world3d';

test('the rigged avatar shares locomotion, jump and emotes with another player', async ({
  browser,
}, testInfo) => {
  const actorContext = await browser.newContext();
  const viewerContext = await browser.newContext();
  try {
    const actor = await actorContext.newPage();
    const viewer = await viewerContext.newPage();
    const rigLoaded = (page: Page) =>
      page.waitForResponse(
        (response) => response.url().endsWith('chibi-fan-07-rigged.glb') && response.ok(),
      );
    await Promise.all([rigLoaded(actor), open(actor, true, 'Rig Actor')]);
    await Promise.all([rigLoaded(viewer), open(viewer, true, 'Rig Viewer')]);
    const remote = () =>
      viewer.evaluate(() =>
        (window as any).__world3d?.remoteAnimations?.find(
          (player: { nickname: string }) => player.nickname === 'Rig Actor',
        ),
      );
    await expect.poll(async () => (await remote())?.clip).toBe('Idle');
    const start = (await state(actor)).position.z;
    await actor.keyboard.down('w');
    try {
      await expect.poll(async () => (await remote())?.clip).toBe('Walk');
      await expect.poll(async () => (await state(actor)).position.z).toBeLessThan(start - 1.7);
      await actor.keyboard.down('Shift');
      await expect.poll(async () => (await remote())?.clip).toBe('Run');
      await viewer.screenshot({ path: testInfo.outputPath('remote-run.png') });
    } finally {
      await actor.keyboard.up('Shift');
      await actor.keyboard.up('w');
    }
    await expect.poll(async () => (await remote())?.clip).toBe('Idle');
    await actor.keyboard.press('Space');
    await viewer.waitForFunction(() =>
      (window as any).__world3d?.remoteAnimations?.some(
        (player: { clip: string; airOffset: number }) =>
          player.clip === 'Jump' && player.airOffset > 0.12,
      ),
    );
    await expect.poll(async () => (await remote())?.clip).toBe('Idle');
    for (const [emoji, clip] of [
      ['❤️', 'Wave'],
      ['😂', 'Laugh'],
      ['🍅', 'Sad'],
    ]) {
      await actor.getByRole('button', { name: 'Biểu cảm', exact: true }).click();
      await actor.locator('.emoji-menu').getByRole('button', { name: emoji, exact: true }).click();
      await expect.poll(async () => (await remote())?.clip).toBe(clip);
      if (clip === 'Wave') {
        await viewer.waitForTimeout(420);
        await viewer.screenshot({ path: testInfo.outputPath('remote-wave.png') });
      }
      await expect.poll(async () => (await remote())?.clip).toBe('Idle');
    }
  } finally {
    await actorContext.close();
    await viewerContext.close();
  }
});
