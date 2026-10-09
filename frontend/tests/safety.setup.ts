import { request, type FullConfig } from '@playwright/test';
export default async function setup(config: FullConfig) {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test')) throw Error('Browser tests require TEST_DATABASE_URL ending in _test.');
  const client = await request.newContext();
  try {
    const response = await client.get(String(config.projects[0]?.use.baseURL) + '/api/health');
    if (!(await response.json()).testDatabase) throw Error('The target API must run in test mode against a dedicated _test database.');
  } finally { await client.dispose(); }
}
