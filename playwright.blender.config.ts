import { defineConfig } from '@playwright/test';
import offline from './playwright.offline.config';

export default defineConfig({
  ...offline,
  testMatch: 'blender-visual.spec.ts',
  outputDir: '/tmp/football-blender-results',
  timeout: 180000,
});
