import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from '@playwright/test';

test('Blender GLBs render and the original player can traverse the vertical slice', async ({
  baseURL,
}) => {
  await promisify(execFile)(process.execPath, ['scripts/blender-visual-qa.mjs', 'after'], {
    env: { ...process.env, FFC_QA_URL: new URL('/playtest', baseURL).href },
    timeout: 170000,
  });
});
