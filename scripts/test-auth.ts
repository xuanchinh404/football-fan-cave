import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { startAuthFixture } from '../tests/helpers/auth-fixture';
import { startTestBackend } from '../tests/helpers/backend';
const fixture = await startAuthFixture(55441);
let backend: ChildProcess | undefined, vite: ChildProcess | undefined;
try {
  backend = await startTestBackend(fixture.url, 3111);
  vite = spawn(
    process.execPath,
    [
      new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname,
      '--host',
      '127.0.0.1',
      '--port',
      '5184',
      '--strictPort',
    ],
    {
      cwd: 'apps/web',
      env: {
        ...process.env,
        FFC_TEST: 'auth',
        FFC_TEST_BACKEND: 'http://127.0.0.1:3111',
        VITE_SUPABASE_URL: fixture.url,
        VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
        VITE_WEBSOCKET_URL: 'http://127.0.0.1:3111',
        VITE_BACKEND_URL: 'http://127.0.0.1:3111',
      },
      stdio: 'inherit',
    },
  );
  // Resolve root Vite executable instead of workspace-relative path.
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5184')).ok) break;
    } catch {}
    if (vite.exitCode !== null) throw new Error('Vite failed');
    await setTimeout(100);
  }
  const test = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.auth.config.ts'],
    { stdio: 'inherit' },
  );
  process.exitCode = await new Promise<number>((resolve) =>
    test.on('exit', (code) => resolve(code || 0)),
  );
} finally {
  vite?.kill();
  backend?.kill();
  await fixture.close();
}
