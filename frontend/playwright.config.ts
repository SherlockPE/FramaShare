import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
process.env.TMPDIR = fileURLToPath(new URL('../.runtime/playwright-tmp', import.meta.url));
mkdirSync(process.env.TMPDIR, { recursive: true });
export default defineConfig({
  testDir: 'tests', testMatch: ['owner-pdf.e2e.ts', 'flows.e2e.ts', 'admin.e2e.ts', 'restart.e2e.ts'], globalSetup: './tests/safety.setup.ts', workers: 1, fullyParallel: false, timeout: 45000,
  use: { baseURL: process.env.TEST_APP_URL || 'http://localhost:5173', headless: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'narrow', use: { viewport: { width: 320, height: 740 } } },
  ],
  reporter: 'list', outputDir: '../docs/verification/test-results',
});
