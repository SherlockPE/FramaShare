import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { hashPassword, verifyPassword } from '../dist/services/password.service.js';
import { byteRange } from '../dist/services/storage.service.js';

test('password hashes and strict single byte ranges', async () => {
  const hash = await hashPassword('correct-password');
  assert.ok(await verifyPassword('correct-password', hash));
  assert.equal(await verifyPassword('wrong-password', hash), false);
  assert.equal(await verifyPassword('wrong-password', 'invalid'), false);
  for (const range of ['bytes=-0', 'bytes=5-4', 'bytes=10-', 'bytes=a-1', 'bytes=0-1,3-4', 'bytes=-', 'items=0-1', 'bytes=9007199254740993-', 'bytes=-9007199254740993']) assert.equal(byteRange(range, 10), null, range);
  assert.deepEqual(byteRange('bytes=-3', 10), { start: 7, end: 9 });
  assert.deepEqual(byteRange('bytes=2-', 10), { start: 2, end: 9 });
  assert.deepEqual(byteRange('bytes=2-100', 10), { start: 2, end: 9 });
});

test('persistent accounts and private PDFs with independent clients', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  const database = new URL(process.env.TEST_DATABASE_URL);
  assert.ok(database.pathname.endsWith('_test'), 'Use a dedicated database whose name ends in _test');
  process.env.DATABASE_URL = database.href;
  process.env.NODE_ENV = 'test';
  process.env.APP_ORIGIN = 'http://localhost:5173';
  process.env.MAX_FILE_SIZE = '1000';
  process.env.STORAGE_PATH = await mkdtemp(path.resolve('../.runtime/owner-pdf-'));
  const { createServer } = await import('../dist/app.js');
  const { prisma } = await import('../dist/lib/prisma.js');
  const { storageService } = await import('../dist/services/storage.service.js');
  let server = await createServer();
  const accountIds = [];
  const origin = process.env.APP_ORIGIN;
  const send = (method, url, payload, cookie = '', requestOrigin = origin) => server.inject({ method, url, payload, headers: { cookie, origin: requestOrigin } });
  const cookieOf = r => r.headers['set-cookie'].split(';')[0];
  const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
  function upload(cookie, content = pdf, title = 'Private handbook', rights = {}) {
    const boundary = 'framashare-boundary';
    const extraFields = Object.entries(rights).map(([name, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`).join('');
    const payload = Buffer.concat([
      Buffer.from(extraFields),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n${title}\r\n--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nPersistent description\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="handbook.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      content, Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return server.inject({ method: 'POST', url: '/api/files/upload', payload, headers: { cookie, origin, 'content-type': `multipart/form-data; boundary=${boundary}` } });
  }
  try {
    const email = `owner-${crypto.randomUUID()}@example.com`;
    const register = await send('POST', '/api/auth/register', { name: 'Owner', email, password: 'correct-password' });
    assert.equal(register.statusCode, 201, register.body);
    const owner = register.json().user;
    accountIds.push(owner.id);
    assert.equal(owner.role, 'author');
    assert.equal(register.json().user.passwordHash, undefined);
    assert.match(register.headers['set-cookie'], /HttpOnly/);
    const firstCookie = cookieOf(register);
    assert.equal((await send('POST', '/api/auth/login', { email, password: 'wrong-password' })).statusCode, 401);
    assert.equal((await send('POST', '/api/auth/logout', undefined, firstCookie, 'https://attacker.invalid')).statusCode, 403);
    assert.equal((await send('POST', '/api/auth/register', { email: 'fake@example.com', name: 'Fake', password: 'correct-password', role: 'admin' })).statusCode, 400);
    assert.equal((await upload(firstCookie, Buffer.from('fake PDF'))).statusCode, 400);
    assert.equal((await upload(firstCookie, Buffer.alloc(1001))).statusCode, 413);
    assert.deepEqual(await readdir(process.env.STORAGE_PATH), []);
    assert.equal((await upload(firstCookie, pdf, 'Invalid license', { license: 'unknown' })).statusCode, 400);
    assert.equal((await upload(firstCookie, pdf, 'Missing credit', { license: 'CC-BY-4.0', attribution: '  ' })).statusCode, 400);
    assert.deepEqual(await readdir(process.env.STORAGE_PATH), []);
    const stored = await upload(firstCookie, pdf, 'Private handbook', { license: 'CC-BY-SA-4.0', attribution: '  Handbook collective  ' });
    assert.equal(stored.statusCode, 201, stored.body);
    const document = stored.json();
    assert.equal(document.title, 'Private handbook');
    assert.equal(document.description, 'Persistent description');
    assert.equal(document.ownerId, owner.id);
    assert.equal(document.license, 'CC-BY-SA-4.0');
    assert.equal(document.attribution, 'Handbook collective');
    assert.equal((await send('GET', document.source)).statusCode, 401);
    assert.equal((await send('GET', document.source, undefined, 'session=' + 'a'.repeat(64))).statusCode, 401);
    const outsider = await send('POST', '/api/auth/register', { name: 'Other', email: `other-${crypto.randomUUID()}@example.com`, password: 'correct-password' });
    accountIds.push(outsider.json().user.id);
    const outsiderCookie = cookieOf(outsider);
    assert.equal((await send('GET', document.source, undefined, outsiderCookie)).statusCode, 404);
    assert.equal((await send('DELETE', document.source, undefined, outsiderCookie)).statusCode, 404);
    assert.equal((await send('PATCH', document.source, { title: 'Stolen', description: '' }, outsiderCookie)).statusCode, 404);
    assert.deepEqual((await send('GET', '/api/files', undefined, outsiderCookie)).json().documents, []);
    const full = await send('GET', document.source, undefined, firstCookie);
    assert.deepEqual(full.rawPayload, pdf);
    assert.equal(full.headers['cache-control'], 'private, no-store');
    const range = await server.inject({ url: document.source, headers: { cookie: firstCookie, range: 'bytes=-6' } });
    assert.equal(range.statusCode, 206); assert.deepEqual(range.rawPayload, pdf.subarray(-6));
    const invalid = await server.inject({ url: document.source, headers: { cookie: firstCookie, range: 'bytes=5-2' } });
    assert.equal(invalid.statusCode, 416);
    assert.equal(invalid.headers['content-range'], `bytes */${pdf.length}`);
    const second = await send('POST', '/api/auth/login', { email, password: 'correct-password' });
    const secondCookie = cookieOf(second);
    await server.close(); server = await createServer();
    assert.deepEqual((await send('GET', '/api/files', undefined, secondCookie)).json().documents.map(d => d.id), [document.id]);
    assert.deepEqual((await send('GET', document.source, undefined, secondCookie)).rawPayload, pdf);
    assert.equal((await send('PATCH', document.source, { title: 'New title', description: 'Still here' }, secondCookie)).statusCode, 200);
    const restored = (await send('GET', '/api/files', undefined, secondCookie)).json().documents[0];
    assert.equal(restored.description, 'Still here');
    assert.equal(restored.license, 'CC-BY-SA-4.0');
    assert.equal(restored.attribution, 'Handbook collective');
    await send('POST', '/api/auth/logout', undefined, firstCookie);
    assert.equal((await send('GET', document.source, undefined, firstCookie)).statusCode, 401);
    assert.equal((await send('GET', document.source, undefined, secondCookie)).statusCode, 200);
    const savedDelete = storageService.deleteFile;
    storageService.deleteFile = async () => { throw Error('Injected disk failure'); };
    assert.equal((await send('DELETE', document.source, undefined, secondCookie)).statusCode, 500);
    storageService.deleteFile = savedDelete;
    assert.equal((await send('GET', document.source, undefined, secondCookie)).statusCode, 404);
    assert.equal((await readdir(process.env.STORAGE_PATH)).length, 1);
    await prisma.user.update({ where: { id: owner.id }, data: { quota: pdf.length * 2 } });
    const parallel = await Promise.all([upload(secondCookie), upload(secondCookie)]);
    assert.deepEqual(parallel.map(r => r.statusCode).sort(), [201, 409]);
    assert.equal(parallel.find(r => r.statusCode === 201).json().license, 'unspecified');
    assert.equal((await readdir(process.env.STORAGE_PATH)).length, 2);
    const savedCreate = prisma.$transaction;
    prisma.$transaction = async () => { throw Error('Injected DB failure'); };
    assert.equal((await upload(secondCookie)).statusCode, 500);
    prisma.$transaction = savedCreate;
    assert.equal((await readdir(process.env.STORAGE_PATH)).length, 2);
    const savedWrite = storageService.saveFile;
    try {
      storageService.saveFile = async (stream, key) => { await savedWrite(stream, key); throw Error('Injected write failure'); };
      assert.equal((await upload(secondCookie)).statusCode,500);
      assert.equal((await readdir(process.env.STORAGE_PATH)).length,2);
    } finally { storageService.saveFile = savedWrite; }
    assert.equal((await send('POST', '/api/auth/password', { oldPassword: 'incorrect-password', newPassword: 'replacement-password' }, secondCookie)).statusCode, 400);
    assert.equal((await send('POST', '/api/auth/password', { oldPassword: 'correct-password', newPassword: 'replacement-password' }, secondCookie)).statusCode, 200);
    assert.equal((await send('GET', document.source, undefined, secondCookie)).statusCode, 401);
    const finalLogin = await send('POST', '/api/auth/login', { email, password: 'replacement-password' });
    const finalCookie = cookieOf(finalLogin);
    assert.equal((await send('DELETE', document.source, undefined, finalCookie)).statusCode, 204);
    assert.equal((await send('GET', document.source, undefined, finalCookie)).statusCode, 404);
    assert.equal((await readdir(process.env.STORAGE_PATH)).length, 1);
    const attempts = [];
    for (let i=0;i<11;i++) attempts.push(await server.inject({method:'POST',url:'/api/auth/login',payload:{email:'invalid',password:''},headers:{origin,'x-forwarded-for':'192.0.2.99'}}));
    assert.equal(attempts.at(-1).statusCode,429);
    assert.ok(Number(attempts.at(-1).headers['retry-after'])>0);
  } finally {
    await prisma.document.deleteMany({ where: { userId: { in: accountIds } } });
    await prisma.user.deleteMany({ where: { id: { in: accountIds } } });
    await server.close();
    await rm(process.env.STORAGE_PATH, { recursive: true, force: true });
  }
});
