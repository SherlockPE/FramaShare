import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, chmod, rm } from 'node:fs/promises';
import path from 'node:path';
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

test('production enforces private storage and Secure cookies', { skip: !process.env.TEST_DATABASE_URL, timeout: 15000 }, async () => {
  assert.ok(new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test'));
  const storage = await mkdtemp(path.resolve('../.runtime/production-'));
  const env = { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, NODE_ENV: 'production', STORAGE_PATH: storage, APP_ORIGIN: 'https://framashare.example.org', SMTP_HOST: '127.0.0.1', FROM_EMAIL: 'test@example.com', PORT: '0' };
  let child, exited, cookie;
  try {
    await chmod(storage, 0o755);
    child = spawn(process.execPath, ['dist/index.js'], { env, stdio: ['ignore','pipe','pipe'] });
    let error = ''; child.stderr.on('data', chunk => { error += chunk; });
    assert.notEqual((await once(child, 'exit'))[0], 0); assert.match(error, /mode 0700/);
    await chmod(storage, 0o700);
    child = spawn(process.execPath, ['dist/index.js'], { env, stdio: ['ignore','pipe','pipe'] }); exited = once(child,'exit');
    const address = await new Promise((resolve,reject) => { let output = ''; child.stdout.on('data', chunk => { output += chunk; const match=output.match(/Server listening at (http:\/\/[^"\s]+)/); if(match)resolve(match[1]); }); child.once('error',reject); child.once('exit',code=>reject(Error(`Startup failed ${code}`))); });
    const registration = await fetch(address+'/api/auth/register',{method:'POST',headers:{origin:env.APP_ORIGIN,'content-type':'application/json'},body:JSON.stringify({name:'Secure cookie test',email:`secure-${crypto.randomUUID()}@example.com`,password:'correct-password'})});
    assert.equal(registration.status,201); cookie=registration.headers.get('set-cookie'); assert.match(cookie,/Secure/); assert.match(cookie,/HttpOnly/); assert.match(cookie,/SameSite=Lax/);
    const deleted=await fetch(address+'/api/auth/account',{method:'DELETE',headers:{origin:env.APP_ORIGIN,cookie:cookie.split(';')[0]}}); assert.equal(deleted.status,204);
  } finally { if(child?.exitCode===null){child.kill();await exited;} await rm(storage,{recursive:true,force:true}); }
});
