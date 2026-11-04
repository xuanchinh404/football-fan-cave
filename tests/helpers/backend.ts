import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
export async function startTestBackend(authUrl: string, port: number) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'apps/server/src/index.ts'], {
    env: {
      ...process.env,
      PORT: String(port),
      SUPABASE_URL: authUrl,
      SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      SUPABASE_SERVICE_ROLE_KEY: '',
      CORS_ORIGINS: 'http://localhost:5174,http://127.0.0.1:5174,http://localhost:5184,http://127.0.0.1:5184',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (d) => (logs += d));
  child.stderr.on('data', (d) => (logs += d));
  for (let i = 0; i < 80; i++) {
    try {
      if (child.exitCode !== null) throw new Error(logs);
      if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return child;
    } catch {}
    if (child.exitCode !== null) throw new Error(logs);
    await setTimeout(100);
  }
  child.kill();
  throw new Error(`Test backend did not start: ${logs}`);
}
