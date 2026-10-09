import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('backup requires stopped API and restore refuses a live database', () => {
  const env = { ...process.env, DATABASE_URL: 'postgresql://localhost/live', STORAGE_PATH: '/unused' };
  delete env.API_STOPPED;
  const running = spawnSync(process.execPath, ['../scripts/backup.mjs', 'backup', '/unused-backup'], { env, encoding: 'utf8' });
  assert.notEqual(running.status, 0); assert.match(running.stderr, /Stop the API first/);
  const live = spawnSync(process.execPath, ['../scripts/backup.mjs', 'restore', '/unused-backup'], { env: { ...env, API_STOPPED: '1' }, encoding: 'utf8' });
  assert.notEqual(live.status, 0); assert.match(live.stderr, /dedicated empty _test database/);
});
