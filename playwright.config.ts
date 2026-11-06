import { defineConfig } from '@playwright/test';
const apiPort = process.env.FFC_TEST_API_PORT || '3101';
const authPort = process.env.FFC_TEST_AUTH_PORT || '3100';
const webPort = process.env.FFC_TEST_WEB_PORT || '5174';
const api = `http://127.0.0.1:${apiPort}`;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  workers: 1,
  reporter: 'list',
  outputDir: process.env.FFC_TEST_RESULTS || 'test-results',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${webPort}`,
    headless: true,
    channel: 'chromium',
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: 'npx tsx tests/support/runtime.ts',
          url: `${api}/api/health`,
          timeout: 30000,
          reuseExistingServer: false,
        },
        {
          command: `npm run build -w apps/web && npm run preview -w apps/web -- --port ${webPort} --strictPort`,
          url: `http://localhost:${webPort}`,
          timeout: 30000,
          reuseExistingServer: false,
          env: {
            FFC_TEST: '1',
            FFC_TEST_BACKEND: api,
            FFC_TEST_DIR: process.env.FFC_TEST_DIR || 'dist-grand-test',
            VITE_SERVER_URL: '',
            VITE_WEBSOCKET_URL: '',
            VITE_SUPABASE_URL: `http://127.0.0.1:${authPort}`,
            VITE_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key',
          },
        },
      ],
});
