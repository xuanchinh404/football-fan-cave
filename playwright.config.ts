import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5174',
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
          url: 'http://127.0.0.1:3101/api/health',
          timeout: 30000,
          reuseExistingServer: false,
        },
        {
          command:
            'npm run build -w apps/web && npm run preview -w apps/web -- --port 5174 --strictPort',
          url: 'http://localhost:5174',
          timeout: 30000,
          reuseExistingServer: false,
          env: {
            FFC_TEST: '1',
            VITE_SERVER_URL: 'http://127.0.0.1:3101',
            VITE_SUPABASE_URL: 'http://127.0.0.1:3100',
            VITE_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key',
          },
        },
      ],
});
