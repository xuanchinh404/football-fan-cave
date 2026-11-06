import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const macBlender = '/Applications/Blender.app/Contents/MacOS/Blender';
const blender = process.env.BLENDER_BIN || (existsSync(macBlender) ? macBlender : 'blender');
const [mode = 'assets', ...args] = process.argv.slice(2);

function run(binary, options, env = process.env) {
  const result = spawnSync(binary, options, { cwd: root, stdio: 'inherit', env });
  if (result.error) throw new Error(`${binary}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status || 1);
}

if (!['assets', 'verify'].includes(mode)) throw new Error('Expected assets or verify');
run(
  blender,
  [
    '--background',
    '--factory-startup',
    '--threads',
    '8',
    '--python-exit-code',
    '1',
    '--python',
    'tools/blender/build_assets.py',
    '--',
    ...args,
  ],
  { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
);

if (mode === 'verify') {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npm, ['test']);
  run(npm, ['run', 'build']);
  const env = {
    ...process.env,
    FFC_TEST: 'offline',
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_PUBLISHABLE_KEY: '',
    VITE_SUPABASE_ANON_KEY: '',
    VITE_SERVER_URL: '',
    VITE_WEBSOCKET_URL: '',
  };
  // Let Playwright own the server lifecycle so it is cleaned up even on errors.
  run(npm, ['exec', '--', 'playwright', 'test', '--config', 'playwright.blender.config.ts'], env);
}
