import { test, expect } from '@playwright/test';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

test('a real API process restart preserves every format and recipient cookies', async ({ browser }) => {
  test.setTimeout(60000);
  const root = path.resolve('..');
  const database = new URL(process.env.TEST_DATABASE_URL!);
  expect(database.pathname.endsWith('_test')).toBe(true);
  const schema = 'restart_' + crypto.randomUUID().replaceAll('-', ''); database.searchParams.set('schema', schema);
  const storage = await mkdtemp(path.join(root, '.runtime/restart-'));
  const socket = createServer(); await new Promise<void>(resolve => socket.listen(0,'127.0.0.1',resolve));
  const port = (socket.address() as { port: number }).port; await new Promise<void>(resolve => socket.close(() => resolve()));
  const origin = `http://localhost:${port}`;
  const env = { ...process.env, DATABASE_URL: database.href, NODE_ENV: 'test', APP_ORIGIN: origin, STORAGE_PATH: storage, PORT: String(port), TEST_RATE_LIMIT_MAX: '500' };
  let child: ReturnType<typeof spawn> | undefined;
  const start = async () => {
    child = spawn(process.execPath, ['back/tests/browser-server.mjs'], { cwd: root, env, stdio: ['ignore','pipe','pipe'] });
    await new Promise<void>((resolve,reject) => {
      let output = ''; child!.stdout!.on('data',chunk=> { output += chunk; if(output.includes('browser-server-ready'))resolve(); });
      child!.stderr!.on('data',chunk=> { output += chunk; });
      child!.once('error',reject); child!.once('exit',code=>reject(Error(`Server startup failed ${code}: ${output}`)));
    });
  };
  const stop = async () => { if (child && child.exitCode === null) { const exited = once(child,'exit'); child.kill('SIGTERM'); await exited; } child = undefined; };
  const author = await browser.newContext(), recipient = await browser.newContext();
  const pages: { page: Awaited<ReturnType<typeof recipient.newPage>>; format: string }[] = [];
  try {
    await promisify(execFile)('pnpm',['--filter','back','exec','prisma','migrate','deploy'],{cwd:root,env});
    await start();
    const registered = await author.request.post(origin+'/api/auth/register',{headers:{origin},data:{name:'Restart author',email:`restart-${crypto.randomUUID()}@example.com`,password:'correct-password'}});
    expect(registered.status()).toBe(201);
    const pdf = await PDFDocument.create(); pdf.addPage().drawText('Actual process restart');
    for (const [format,files] of [
      ['pdf',[{name:'restart.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())}]],
      ['epub',[{name:'restart.epub',mimeType:'application/epub+zip',buffer:await readFile(path.join(root,'back/tests/fixtures/valid.epub'))}]],
      ['album',[{name:'restart.png',mimeType:'image/png',buffer:await readFile(path.join(root,'back/tests/fixtures/album.png'))}]],
    ] as const) {
      const boundary='restart-boundary'; const chunks=[Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nRestart ${format}\r\n`)];
      for(const file of files)chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`),file.buffer,Buffer.from('\r\n'));
      chunks.push(Buffer.from(`--${boundary}--\r\n`));
      const upload=await author.request.post(origin+'/api/files/upload',{headers:{origin,'content-type':`multipart/form-data; boundary=${boundary}`},data:Buffer.concat(chunks)});expect(upload.status()).toBe(201);
      const d=await upload.json(); const saved=await author.request.post(`${origin}/api/files/${d.id}/links`,{headers:{origin},data:{name:'Restart readers'}});expect(saved.status()).toBe(200);const link=await saved.json();
      const page=await recipient.newPage();await page.goto(`${origin}/share/${link.token}`);await page.getByRole('button',{name:'Start reading',exact:true}).click();pages.push({page,format});
      if(format==='pdf')await expect(page.locator('canvas').first()).toBeVisible();
      else if(format==='epub')await expect(page.getByText('Persistent EPUB content.',{exact:true})).toBeVisible();
      else await expect(page.locator('.album-reader img').last()).toBeVisible();
    }
    await stop(); await start();
    for(const {page,format} of pages){await page.reload();if(format==='pdf')await expect(page.locator('canvas').first()).toBeVisible();else if(format==='epub')await expect(page.getByText('Persistent EPUB content.',{exact:true})).toBeVisible();else await expect(page.locator('.album-reader img').last()).toBeVisible();}
    expect((await author.request.get(origin+'/api/files')).status()).toBe(200);
  } finally {
    await stop(); await author.close(); await recipient.close();
    const { PrismaClient } = await import('../../back/prisma/generated/client/index.js');
    const db=new PrismaClient({datasources:{db:{url:process.env.TEST_DATABASE_URL!}}});
    try { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await db.$disconnect(); }
    await rm(storage,{recursive:true,force:true});
  }
});
