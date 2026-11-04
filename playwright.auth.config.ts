import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'auth.spec.ts',
  timeout: 45000,
  use: {
    baseURL: 'http://127.0.0.1:5184',
    headless: true,
    channel: 'chromium',
    launchOptions: { args: process.platform === 'darwin' ? ['--use-angle=metal'] : [] },
  },
  reporter: 'list',
  workers: 1,
});
