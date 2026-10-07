import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'.',testMatch:'admin.e2e.ts',fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:5173',headless:true},reporter:'list',outputDir:'../docs/verification/admin-test-results' });
