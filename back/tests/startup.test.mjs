import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';

for (const host of [undefined, '127.0.0.2']) {
  test(`compiled backend starts on ${host ?? 'default loopback'}`, { timeout: 10000 }, async () => {
    const env = { ...process.env, PORT: '0' };
    if (host) env.HOST = host;
    else delete env.HOST;
    const child = spawn(process.execPath, ['dist/index.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    const exited = once(child, 'exit');
    try {
      const address = await new Promise((resolve, reject) => {
        let output = '';
        child.stdout.on('data', chunk => {
          output += chunk;
          const match = output.match(/Server listening at (http:\/\/[^"\s]+)/);
          if (match) resolve(match[1]);
        });
        child.once('error', reject);
        child.once('exit', code => reject(Error(`Backend exited before listening: ${code}`)));
      });
      assert.equal(new URL(address).hostname, host ?? '127.0.0.1');
      const response = await fetch(`${address}/api/health`);
      assert.equal(response.status, 200);
      const health = await response.json();
      assert.equal(health.status, 'ok');
      assert.ok(Number.isFinite(Date.parse(health.timestamp)));
    } finally {
      child.kill();
      await exited;
    }
  });
}
