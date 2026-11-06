import { defineConfig } from '@playwright/test';

const port = 5196;
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'playtest-offline.spec.ts',
  outputDir: '/tmp/football-playtest-offline-results',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 900 },
    channel: 'chromium',
    launchOptions: { args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] },
  },
  webServer: {
    command: `npm run dev -w apps/web -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    env: {
      FFC_TEST: 'offline',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_SERVER_URL: '',
      VITE_WEBSOCKET_URL: '',
    },
  },
});
