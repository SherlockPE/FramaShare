import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer as netServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';

test('SMTP reset is single-use and revokes sessions; deletion retries after disk failure', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  assert.ok(url.pathname.endsWith('_test'));
  process.env.DATABASE_URL = url.href; process.env.NODE_ENV = 'test';
  process.env.APP_ORIGIN = 'http://localhost:5173';
  process.env.STORAGE_PATH = await mkdtemp(path.resolve('../.runtime/account-'));
  const messages = [];
  const smtp = netServer(socket => {
    socket.write('220 test receiver\r\n');
    let buffer = '', data = false, message = '';
    socket.on('data', chunk => {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, i); buffer = buffer.slice(i + 2);
        if (data) {
          if (line === '.') { messages.push(message); message = ''; data = false; socket.write('250 queued\r\n'); }
          else message += line + '\n';
        } else if (line.startsWith('EHLO')) socket.write('250 test\r\n');
        else if (line === 'DATA') { data = true; socket.write('354 send\r\n'); }
        else if (line === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
  process.env.SMTP_PORT = String(smtp.address().port);
  const { createServer } = await import('../dist/app.js');
  const { prisma } = await import('../dist/lib/prisma.js');
  const { storageService } = await import('../dist/services/storage.service.js');
  const server = await createServer();
  const send = (method, url, payload, cookie = '') => server.inject({ method, url, payload, headers: { origin: process.env.APP_ORIGIN, cookie } });
  let id;
  const savedDelete = storageService.deleteFile;
  try {
    const email = `lifecycle-${crypto.randomUUID()}@example.com`;
    const registered = await send('POST', '/api/auth/register', { email, name: 'Lifecycle', password: 'original-password' });
    assert.equal(registered.statusCode, 201, registered.body);
    id = registered.json().user.id;
    const cookie = registered.headers['set-cookie'].split(';')[0];
    assert.equal((await send('POST', '/api/auth/forgot-password', { email })).statusCode, 200);
    assert.equal(messages.length, 1);
    const token = messages[0].replace(/=\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).match(/token=([a-f0-9]{64})/)[1];
    const resets = await Promise.all([1, 2].map(() => send('POST', '/api/auth/reset-password', { token, newPassword: 'replacement-password' })));
    assert.deepEqual(resets.map(r => r.statusCode).sort(), [200, 400]);
    assert.equal((await send('GET', '/api/auth/me', undefined, cookie)).json().user, null);
    assert.equal(await prisma.passwordResetToken.count({ where: { userId: id } }), 0);
    const login = await send('POST', '/api/auth/login', { email, password: 'replacement-password' });
    assert.equal(login.statusCode, 200);
    const current = login.headers['set-cookie'].split(';')[0];
    await storageService.saveFile((await import('node:stream')).Readable.from(['%PDF-1.7\n%%EOF']), 'deletion.pdf');
    await prisma.document.create({ data: { userId: id, title: 'Delete', originalFilename: 'a.pdf', filename: 'deletion.pdf', mimeType: 'application/pdf', size: 15, status: 'ready' } });
    storageService.deleteFile = async () => { throw Error('Injected deletion failure'); };
    assert.equal((await send('DELETE', '/api/auth/account', undefined, current)).statusCode, 500);
    assert.equal((await send('GET', '/api/auth/me', undefined, current)).json().user, null);
    assert.equal((await prisma.user.findUnique({ where: { id } })).deleting, true);
    storageService.deleteFile = savedDelete;
    const { finishAccountDeletion } = await import('../dist/routes/auth.routes.js');
    await finishAccountDeletion(id);
    assert.equal(await prisma.user.findUnique({ where: { id } }), null);
    assert.equal(await prisma.document.count({ where: { userId: id } }), 0);
  } finally {
    storageService.deleteFile = savedDelete;
    if (id) { await prisma.document.deleteMany({ where: { userId: id } }); await prisma.user.deleteMany({ where: { id } }); }
    await server.close(); await new Promise(resolve => smtp.close(resolve));
    await rm(process.env.STORAGE_PATH, { recursive: true, force: true });
  }
});
