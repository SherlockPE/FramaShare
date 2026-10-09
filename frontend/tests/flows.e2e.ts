import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

test('real publication formats reach a separate recipient and survive refresh', async ({ browser, baseURL }) => {
  const author = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '192.0.2.20' } }), recipient = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '192.0.2.21' } });
  const page = await author.newPage();
  const origin = new URL(baseURL!).origin;
  try {
    const register = await author.request.post(baseURL + '/api/auth/register', { headers: { origin }, data: { name: 'Flow Author', email: `flow-${crypto.randomUUID()}@example.com`, password: 'correct-password' } });
    expect(register.status()).toBe(201);
    const pdf = await PDFDocument.create(); pdf.addPage().drawText('Shared durable PDF');
    const image = await readFile('../back/tests/fixtures/album.png');
    for (const [format, files] of [
      ['pdf', [{ name: 'flow.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) }]],
      ['epub', [{ name: 'flow.epub', mimeType: 'application/epub+zip', buffer: await readFile('../back/tests/fixtures/valid.epub') }]],
      ['album', [{ name: 'first.png', mimeType: 'image/png', buffer: image }, { name: 'second.png', mimeType: 'image/png', buffer: image }]],
    ] as const) {
      await page.goto(baseURL + '/upload');
      await page.locator('input[type=file]').setInputFiles([...files]);
      await page.getByLabel('Title', { exact: true }).fill('Shared ' + format);
      await page.getByRole('button', { name: 'Upload document', exact: true }).click();
      await expect(page).toHaveURL(/\/upload\/complete\//);
      const id = page.url().split('/').pop()!;
      await page.goto(`${baseURL}/app/documents/${id}/links`);
      await page.getByRole('button', { name: 'Create sharing link', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Link name').fill('Independent reader');
      if (format === 'pdf') { await dialog.getByLabel('Require a password').check(); await dialog.getByLabel('Password', { exact: true }).fill('protected'); }
      const created = page.waitForResponse(r => r.url().endsWith(`/api/files/${id}/links`) && r.request().method() === 'POST');
      await dialog.getByRole('button', { name: 'Create link', exact: true }).click();
      const response = await created; expect(response.status()).toBe(200); const link = await response.json();
      await page.goto(`${baseURL}/share/${link.token}?preview=1`);
      await page.getByRole('button', { name: 'Start reading', exact: true }).click();
      if (format === 'pdf') await expect(page.locator('canvas').first()).toBeVisible();
      else if (format === 'epub') await expect(page.getByText('Persistent EPUB content.', { exact: true })).toBeVisible();
      else await expect(page.locator('.album-reader img').last()).toBeVisible();
      const previewLinks = await author.request.get(`${baseURL}/api/files/${id}/links`);
      expect((await previewLinks.json()).links.find((l: { id: string }) => l.id === link.id).used).toBe(0);
      const reader = await recipient.newPage();
      await reader.goto(`${baseURL}/share/${link.token}`);
      if (format === 'pdf') { await expect(reader.getByLabel('Password', { exact: true })).toBeVisible(); await reader.getByLabel('Password', { exact: true }).fill('protected'); }
      else await expect(reader.getByRole('heading', { name: 'Shared ' + format, exact: true })).toBeVisible();
      await reader.getByRole('button', { name: 'Start reading', exact: true }).click();
      await expect(reader).toHaveURL(/\/read$/);
      if (format === 'pdf') await expect(reader.locator('canvas').first()).toBeVisible();
      else if (format === 'epub') {
        await expect(reader.getByText('Persistent EPUB content.', { exact: true })).toBeVisible();
        await reader.locator('body').press('ArrowRight');
        await expect(reader.getByText('Real second chapter.', { exact: true })).toBeVisible();
      } else await expect(reader.locator('.album-reader img').last()).toBeVisible();
      await reader.reload();
      if (format === 'pdf') await expect(reader.locator('canvas').first()).toBeVisible();
      else if (format === 'epub') await expect(reader.getByText('Persistent EPUB content.', { exact: true })).toBeVisible();
      else await expect(reader.locator('.album-reader img').last()).toBeVisible();
      const bytes = await recipient.request.get(`${baseURL}/api/share/${link.token}/file${format === "epub" ? "?content=1" : ""}`);
      expect(bytes.status()).toBe(200);
      await author.request.patch(`${baseURL}/api/files/${id}/links/${link.id}`, { headers: { origin }, data: { name: link.name, revoked: true } });
      expect((await recipient.request.get(`${baseURL}/api/share/${link.token}/file`)).status()).toBe(410);
      await reader.reload(); await expect(reader.getByText('Link unavailable', { exact: false }).first()).toBeVisible();
      await reader.close();
    }
    await page.goto(baseURL + '/app/library');
    expect(await page.evaluate(() => localStorage.getItem('framashare-prototype-v1'))).toBeNull();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  } finally {
    await author.request.delete(baseURL + '/api/auth/account', { headers: { origin } });
    await author.close(); await recipient.close();
  }
});

test('anonymous management works in a fresh browser and claim invalidates its token', async ({ browser, baseURL }) => {
  const anonymous = await browser.newContext(), manager = await browser.newContext();
  const page = await anonymous.newPage(), fresh = await manager.newPage();
  const origin = new URL(baseURL!).origin;
  let id = '', token = '';
  try {
    const pdf = await PDFDocument.create(); pdf.addPage().drawText('Anonymous publication');
    await page.goto(baseURL + '/upload');
    await page.locator('input[type=file]').setInputFiles({ name: 'anonymous.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
    await page.getByRole('button', { name: 'Upload document', exact: true }).click();
    await expect(page).toHaveURL(/\/upload\/complete\//); id = page.url().split('/').pop()!;
    const managementUrl = await page.locator('.url').first().innerText(); token = managementUrl.split('/').pop()!;
    await fresh.goto(managementUrl + '?edit=1');
    await fresh.getByLabel('Title', { exact: true }).fill('Anonymous edited');
    await fresh.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(fresh.getByRole('heading', { name: 'Anonymous edited', exact: true })).toBeVisible();
    await fresh.goto(managementUrl + '/read'); await expect(fresh.locator('canvas').first()).toBeVisible();
    const registered = await manager.request.post(baseURL + '/api/auth/register', { headers: { origin }, data: { name: 'Claim author', email: `claim-${crypto.randomUUID()}@example.com`, password: 'correct-password' } });
    expect(registered.status()).toBe(201);
    const claimed = await manager.request.post(`${baseURL}/api/manage/${token}/claim`, { headers: { origin } }); expect(claimed.status()).toBe(200);
    expect((await anonymous.request.get(`${baseURL}/api/manage/${token}`)).status()).toBe(404);
    await fresh.goto(baseURL + '/app/library'); await expect(fresh.getByText('Anonymous edited', { exact: true }).first()).toBeVisible();
  } finally {
    const deleted = await manager.request.delete(baseURL + '/api/auth/account', { headers: { origin } });
    if (deleted.status() !== 204 && id && token) await anonymous.request.delete(`${baseURL}/api/files/${id}`, { headers: { origin, 'x-manage-token': token } });
    await anonymous.close(); await manager.close();
  }
});

test('cancel waits for server cleanup and prevents a competing upload', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '192.0.2.40' } });
  const page = await context.newPage(); const origin = new URL(baseURL!).origin;
  let id = '', release!: () => void, received!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const uploaded = new Promise<void>(resolve => { received = resolve; });
  try {
    const registered = await context.request.post(baseURL+'/api/auth/register',{headers:{origin},data:{name:'Cancel author',email:`cancel-${crypto.randomUUID()}@example.com`,password:'correct-password'}});
    expect(registered.status()).toBe(201);
    await page.route('**/api/files/upload', async route => {
      const response = await route.fetch(); expect(response.status()).toBe(201); id = (await response.json()).id;
      received(); await held; await route.fulfill({ response });
    });
    const pdf = await PDFDocument.create(); pdf.addPage().drawText('Cancel while response is held');
    await page.goto(baseURL+'/upload'); await page.locator('input[type=file]').setInputFiles({name:'cancel.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
    await page.getByRole('button',{name:'Upload document',exact:true}).click(); await uploaded;
    await page.getByRole('button',{name:'Cancel upload',exact:true}).click();
    await expect(page.getByRole('button',{name:'Upload document',exact:true})).toBeDisabled();
    release();
    await expect.poll(async () => (await context.request.get(`${baseURL}/api/files/${id}`)).status()).toBe(404);
    await expect(page.getByRole('button',{name:'Upload document',exact:true})).toBeEnabled();
    expect((await context.request.get(baseURL+'/api/files')).ok()).toBe(true);
  } finally { release(); await context.request.delete(baseURL+'/api/auth/account',{headers:{origin}}); await context.close(); }
});
