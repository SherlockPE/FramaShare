import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests', testMatch: 'owner-pdf.e2e.ts', workers: 1, fullyParallel: false, timeout: 45000,
  use: { baseURL: process.env.TEST_APP_URL || 'http://localhost:5173', headless: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'narrow', use: { viewport: { width: 320, height: 740 } } },
  ],
  reporter: 'list', outputDir: '../docs/verification/test-results',
});
