import path from 'node:path';
import { test, expect } from '@playwright/test';

test('admin UI and API deny an ordinary account and ignore forged local role', async ({ page, request, baseURL }) => {
  await page.goto(baseURL + '/');
  await page.evaluate(() => localStorage.setItem('framashare-prototype-v1', JSON.stringify({ currentUserId: 'admin', accounts: [{ id: 'admin', role: 'admin' }] })));
  await page.goto(baseURL + '/admin/reports');
  await expect(page).toHaveURL(baseURL + '/');
  expect((await request.get(baseURL + '/api/admin/state')).status()).toBe(403);
  expect((await request.get(baseURL + '/@fs' + path.resolve('../back/tests/fixtures/valid.epub'))).status()).toBe(403);
  await page.goto(baseURL + '/overview'); await expect(page).toHaveURL(baseURL + '/');
});

test('administrator dismisses a durable report through the real API', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '192.0.2.30' } }); const page = await context.newPage();
  const origin = new URL(baseURL!).origin;
  const { PrismaClient } = await import('../../back/prisma/generated/client/index.js');
  const db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL! } } });
  let userId = '';
  try {
    const registration = await context.request.post(baseURL + '/api/auth/register', { headers: { origin }, data: { name: 'Test moderator', email: `moderator-${crypto.randomUUID()}@example.com`, password: 'correct-password' } });
    expect(registration.status()).toBe(201); userId = (await registration.json()).user.id;
    const pdf = Buffer.from('%PDF-1.7\n%%EOF\n');
    const uploaded = await context.request.post(baseURL + '/api/files/upload', { headers: { origin }, multipart: { title: 'Moderation publication', file: { name: 'moderation.pdf', mimeType: 'application/pdf', buffer: pdf } } });
    expect(uploaded.status()).toBe(201); const publication = await uploaded.json();
    const reported = await context.request.post(baseURL + '/api/reports', { headers: { origin }, data: { documentId: publication.id, reason: 'Other', description: 'Durable concern for review' } });
    expect(reported.status()).toBe(200); const report = await reported.json();
    await db.user.update({ where: { id: userId }, data: { role: 'admin' } });
    await page.goto(`${baseURL}/admin/reports/${report.id}`);
    await expect(page.getByText('Durable concern for review')).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss report', exact: true }).click();
    await expect(page.getByText('Dismissed', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByText('Dismissed', { exact: true })).toBeVisible();
    expect((await db.report.findUnique({ where: { id: report.id } }))?.status).toBe('resolved');
  } finally {
    await context.request.delete(baseURL + '/api/auth/account', { headers: { origin } });
    await db.$disconnect(); await context.close();
  }
});
