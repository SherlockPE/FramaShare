import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

test('all formats, anonymous claim, concurrent limits, revocation, moderation and retention', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  const database = new URL(process.env.TEST_DATABASE_URL); assert.ok(database.pathname.endsWith('_test'));
  process.env.DATABASE_URL = database.href; process.env.NODE_ENV = 'test'; process.env.APP_ORIGIN = 'http://localhost:5173'; process.env.TEST_RATE_LIMIT_MAX = '500';
  process.env.STORAGE_PATH = await mkdtemp(path.resolve('../.runtime/sharing-'));
  const { createServer } = await import('../dist/app.js'); const { prisma } = await import('../dist/lib/prisma.js');
  let server = await createServer(); const users = [], documents = [];
  const send = (method, url, payload, cookie = '', extra = {}) => server.inject({ method, url, payload, headers: { origin: process.env.APP_ORIGIN, cookie, ...extra } });
  const cookieOf = r => r.headers['set-cookie']?.split(';')[0] || '';
  const pdf = Buffer.from('%PDF-1.7\n%%EOF\n');
  const png = await (await import('sharp')).default({ create: { width: 2, height: 2, channels: 3, background: '#669966' } }).png().toBuffer();
  const upload = (cookie, files) => {
    const boundary = 'test-boundary';
    const chunks = [Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nStored publication\r\n`)];
    for (const [name, content] of files) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: application/octet-stream\r\n\r\n`), content, Buffer.from('\r\n'));
    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    return send('POST', '/api/files/upload', Buffer.concat(chunks), cookie, { 'content-type': `multipart/form-data; boundary=${boundary}` });
  };
  try {
    const owner = await send('POST', '/api/auth/register', { name: 'Owner', email: `share-${crypto.randomUUID()}@example.com`, password: 'correct-password' });
    assert.equal(owner.statusCode, 201, owner.body); users.push(owner.json().user.id); const cookie = cookieOf(owner);
    assert.equal((await send('GET', '/api/admin/state', undefined, cookie)).statusCode, 403);
    const result = await upload(cookie, [['book.pdf', pdf]]); assert.equal(result.statusCode, 201, result.body); const d = result.json(); documents.push(d.id);
    const makeLink = async (settings = {}) => {
      const response = await send('POST', `/api/files/${d.id}/links`, { name: 'Readers', ...settings }, cookie); assert.equal(response.statusCode, 200, response.body); return response.json();
    };
    const l = await makeLink({ limit: 1, password: 'read-password', allowDownload: false });
    assert.equal((await send('GET', `/api/share/${l.token}/file`)).statusCode, 401);
    assert.equal((await send('POST', `/api/share/${l.token}/session`, { password: 'wrong' })).statusCode, 403);
    const simultaneous = await Promise.all([1,2].map(() => send('POST', `/api/share/${l.token}/session`, { password: 'read-password' })));
    assert.deepEqual(simultaneous.map(r => r.statusCode).sort(), [200,409]); const recipient = cookieOf(simultaneous.find(r => r.statusCode === 200));
    assert.equal((await send('POST', `/api/share/${l.token}/session`, {}, recipient)).statusCode, 200);
    assert.equal((await send('GET', `/api/share/${l.token}/file`, undefined, recipient)).statusCode, 200);
    assert.equal((await send('GET', `/api/share/${l.token}/download`, undefined, recipient)).statusCode, 403);
    assert.equal(await prisma.session.count({ where: { linkId: l.id } }), 1);
    await send('PATCH', `/api/files/${d.id}/links/${l.id}`, { name: l.name, revoked: true }, cookie);
    assert.equal((await send('GET', `/api/share/${l.token}/file`, undefined, recipient)).statusCode, 410);
    const expiring = await makeLink(); const entered = await send('POST', `/api/share/${expiring.token}/session`, {});
    await prisma.link.update({ where: { id: expiring.id }, data: { expiresAt: new Date(Date.now()-1000) } });
    assert.equal((await send('GET', `/api/share/${expiring.token}/file`, undefined, cookieOf(entered))).statusCode, 410);
    for (const kind of ['fixed','encrypted','traversal','bomb']) {
      const rejected = await upload(cookie, [[`${kind}.epub`, await readFile(`tests/fixtures/${kind}.epub`)]]); assert.equal(rejected.statusCode, 400, rejected.body);
    }
    assert.equal((await upload(cookie, [['broken.epub', Buffer.from('broken')]])).statusCode, 400);
    for (const kind of ['valid','hostile']) {
      const uploaded = await upload(cookie, [[`${kind}.epub`, await readFile(`tests/fixtures/${kind}.epub`)]]); assert.equal(uploaded.statusCode, 201, uploaded.body);
      const e = uploaded.json(); documents.push(e.id); assert.equal(e.format, 'epub');
      const content = await send('GET', e.source + '?content=1', undefined, cookie); assert.equal(content.statusCode, 200);
      assert.equal(content.json().chapters.length, 2); assert.match(content.json().chapters[0].html, /Persistent EPUB content/);
      if (kind === 'valid') { assert.equal(content.json().chapters[0].title, 'From EPUB contents'); assert.match(content.json().chapters[0].html, /data:image\/png;base64/); }
      assert.doesNotMatch(content.body, /<script|onclick|attacker.invalid|<iframe|<style/);
    }
    const albumResponse = await upload(cookie, [['one.png',png],['two.png',png]]); assert.equal(albumResponse.statusCode, 201, albumResponse.body);
    const album = albumResponse.json(); documents.push(album.id); assert.equal(album.format, 'album'); assert.equal(album.images.length,2);
    const images = album.images.slice().reverse().map(i => ({ id: i.id, caption: 'Caption', alt: 'Accessible image' }));
    assert.equal((await send('PATCH', `/api/files/${album.id}`, { title: 'Album', description: '', images }, cookie)).statusCode, 200);
    const shared = [];
    for (const id of documents) {
      const response = await send('POST', `/api/files/${id}/links`, { name: 'Restart reader' }, cookie);
      assert.equal(response.statusCode,200,response.body);
      const link = response.json(); const session = await send('POST', `/api/share/${link.token}/session`, {});
      assert.equal(session.statusCode,200,session.body);
      shared.push({id,link,cookie:cookieOf(session)});
    }
    await server.close(); server = await createServer();
    for (const item of shared) {
      const d = await prisma.document.findUniqueOrThrow({where:{id:item.id}});
      const source = `/api/share/${item.link.token}/file` + (d.format==='epub'?'?content=1':'');
      assert.equal((await send('GET',source,undefined,item.cookie)).statusCode,200);
      assert.equal((await send('GET',source,undefined,`read_${item.link.id}=${'a'.repeat(64)}`)).statusCode,401);
    }

    const restored = (await send('GET','/api/files',undefined,cookie)).json().documents.find(i=>i.id===album.id);
    assert.equal(restored.images[0].id,images[0].id); assert.equal(restored.images[0].alt,'Accessible image');
    assert.deepEqual((await send('GET',restored.images[0].src,undefined,cookie)).rawPayload,png);
    const anonymousResponse = await upload('', [['anon.pdf',pdf]]); assert.equal(anonymousResponse.statusCode,201,anonymousResponse.body);
    const anonymous = anonymousResponse.json(); documents.push(anonymous.id); assert.equal(anonymous.manageToken.length,64);
    assert.equal((await send('GET',anonymous.source)).statusCode,401);
    assert.equal((await send('GET',`/api/manage/${anonymous.manageToken}`)).statusCode,200);
    await prisma.user.update({where:{id:users[0]},data:{quota:0}});
    assert.equal((await send('POST',`/api/manage/${anonymous.manageToken}/claim`,undefined,cookie)).statusCode,409);
    await prisma.user.update({where:{id:users[0]},data:{quota:1000000000}});
    const claims = await Promise.all([1,2].map(()=>send('POST',`/api/manage/${anonymous.manageToken}/claim`,undefined,cookie)));
    assert.deepEqual(claims.map(r=>r.statusCode).sort(),[200,404]);
    assert.equal((await send('GET',`/api/manage/${anonymous.manageToken}`)).statusCode,404);
    const quotaClaim = [];
    for (const name of ['quota-a.pdf','quota-b.pdf']) { const d = (await upload('',[[name,pdf]])).json(); quotaClaim.push(d); documents.push(d.id); }
    const used = await prisma.document.aggregate({where:{userId:users[0],status:{notIn:['deleted','removed']}},_sum:{size:true}});
    await prisma.user.update({where:{id:users[0]},data:{quota:(used._sum.size||0)+pdf.length}});
    const limitedClaims = await Promise.all(quotaClaim.map(d=>send('POST',`/api/manage/${d.manageToken}/claim`,undefined,cookie)));
    assert.deepEqual(limitedClaims.map(r=>r.statusCode).sort(),[200,409]);
    await prisma.user.update({where:{id:users[0]},data:{quota:1000000000}});
    const retained = (await upload('', [['expire.pdf',pdf]])).json(); documents.push(retained.id);
    await prisma.document.update({where:{id:retained.id},data:{deleteAt:new Date(Date.now()-1000)}});
    assert.equal((await send('GET',`/api/manage/${retained.manageToken}`)).statusCode,404);
    const before = (await readdir(process.env.STORAGE_PATH)).length; await server.runCleanup();
    assert.equal((await readdir(process.env.STORAGE_PATH)).length,before-1);
    assert.equal((await prisma.document.findUnique({where:{id:retained.id}})).status,'deleted');
    const { storageService } = await import('../dist/services/storage.service.js');
    const orphan = crypto.randomUUID(); await storageService.saveFile((await import('node:stream')).Readable.from([pdf]),orphan);
    await (await import('node:fs/promises')).utimes(storageService.filePath(orphan),new Date(0),new Date(0));
    await server.runCleanup(); assert.equal((await readdir(process.env.STORAGE_PATH)).includes(orphan),false);

    await send('POST','/api/reports',{documentId:d.id,reason:'Other',description:'Review this'});
    await prisma.user.update({where:{id:users[0]},data:{role:'admin'}});
    assert.equal((await send('GET','/api/admin/state',undefined,cookie)).statusCode,200);
    assert.equal((await send('DELETE',`/api/admin/publications/${d.id}`,undefined,cookie)).statusCode,204);
    assert.equal((await send('GET',d.source,undefined,cookie)).statusCode,404);
    assert.equal((await send('GET',`/api/share/${l.token}/file`,undefined,recipient)).statusCode,410);
    assert.equal((await prisma.report.findFirst({where:{documentId:d.id}})).decision,'Publication removed');
  } finally {
    await prisma.report.deleteMany({where:{documentId:{in:documents}}});
    await prisma.session.deleteMany({where:{link:{documentId:{in:documents}}}});
    await prisma.link.deleteMany({where:{documentId:{in:documents}}});
    await prisma.document.deleteMany({where:{id:{in:documents}}}); await prisma.user.deleteMany({where:{id:{in:users}}});
    await server.close(); await rm(process.env.STORAGE_PATH,{recursive:true,force:true});
  }
});
