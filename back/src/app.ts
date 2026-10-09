import path from 'node:path';
import { mkdir, stat, readdir } from 'node:fs/promises';
import Fastify from 'fastify';
import type { FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { authRoutes, finishAccountDeletion } from './routes/auth.routes.js';
import { sharingRoutes } from './routes/sharing.routes.js';
import { storageService } from './services/storage.service.js';
import { fileRoutes, deletePublicationFiles } from './routes/files.routes.js';
import { prisma } from './lib/prisma.js';

export async function createServer() {
  const origin = new URL(process.env.APP_ORIGIN || 'http://localhost:5173').origin;
  const fileSize = Number(process.env.MAX_FILE_SIZE || 100000000);
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > 100000000) throw Error('MAX_FILE_SIZE must be between 1 and 100000000 bytes.');
  if (process.env.NODE_ENV === 'production' && (!process.env.DATABASE_URL || !process.env.STORAGE_PATH || !process.env.APP_ORIGIN || !origin.startsWith('https://'))) throw Error('Production requires DATABASE_URL, STORAGE_PATH and an HTTPS APP_ORIGIN.');
  if (process.env.NODE_ENV === 'production' && (!process.env.SMTP_HOST || !process.env.FROM_EMAIL)) throw Error('Production requires SMTP_HOST and FROM_EMAIL.');
  if (process.env.NODE_ENV === 'production') {
    const database = new URL(process.env.DATABASE_URL!);
    if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw Error('DATABASE_URL must use PostgreSQL.');
    if (!path.isAbsolute(process.env.STORAGE_PATH!)) throw Error('Production STORAGE_PATH must be absolute.');
    await mkdir(process.env.STORAGE_PATH!, { recursive: true, mode: 0o700 });
    const storage = await stat(process.env.STORAGE_PATH!);
    if (!storage.isDirectory() || (storage.mode & 0o077) !== 0 || process.getuid && storage.uid !== process.getuid()) throw Error('Storage must be owned by the API account with mode 0700.');
    const smtpPort = Number(process.env.SMTP_PORT || 1025);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535 || !!process.env.SMTP_USER !== !!process.env.SMTP_PASS) throw Error('Invalid SMTP port or incomplete credentials.');
  }
  const server = Fastify({ requestTimeout: 900000, connectionTimeout: 120000, ajv: { customOptions: { removeAdditional: false } }, trustProxy: ['127.0.0.1', '::1'], logger: process.env.NODE_ENV === 'test' ? false : { serializers: { req: request => ({ method: request.method, url: request.url.split('?')[0]!.replace(/(\/(?:share|manage)\/)[^/]+/, '$1[redacted]'), hostname: request.hostname }) } }, bodyLimit: 20000 });
  await server.register(cookie);
  await server.register(multipart, { limits: { files: 50, fields: 5, parts: 55, fileSize, fieldSize: 10000 } });
  await server.register(rateLimit, { global: true, max: process.env.NODE_ENV === 'test' ? Number(process.env.TEST_RATE_LIMIT_MAX || 120) : 120, timeWindow: '1 minute' });
  server.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== origin) return reply.code(403).send({ error: 'Request origin is not allowed.' });
  });
  server.setErrorHandler<FastifyError>((error, request, reply) => {
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500;
    if (status === 500) request.log.error(error);
    reply.code(status).send({ error: status === 500 ? 'The request could not be completed. Please try again.' : error.message });
  });
  await authRoutes(server);
  await fileRoutes(server);
  await sharingRoutes(server);
  server.get('/api/health', async () => ({ status: 'ok', ...(process.env.NODE_ENV === 'test' ? { testDatabase: !!process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname.endsWith('_test') } : {}), timestamp: new Date().toISOString() }));
  let cleaning = false;
  const runCleanup = async () => {
    if (cleaning) return;
    cleaning = true;
    try {
      for (const user of await prisma.user.findMany({ where: { deleting: true }, select: { id: true } })) {
        try { await finishAccountDeletion(user.id); } catch (error) { server.log.error(error, 'Account cleanup failed; will retry'); }
      }
      for (const candidate of await prisma.document.findMany({ where: { OR: [{ deleteAt: { lte: new Date() }, userId: null, status: 'ready' }, { status: 'deleting' }] } })) {
        try {
        const d = await prisma.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM "Document" WHERE id = ${candidate.id} FOR UPDATE`;
          const current = await tx.document.findUnique({ where: { id: candidate.id } });
          if (!current || !(current.status === 'deleting' || current.status === 'ready' && !current.userId && current.deleteAt && current.deleteAt <= new Date())) return null;
          return tx.document.update({ where: { id: current.id }, data: { status: 'deleting', manageHash: null } });
        });
        if (!d) continue;
        await deletePublicationFiles(d);
        await prisma.document.update({ where: { id: d.id }, data: { status: d.moderated ? 'removed' : 'deleted' } });
        } catch (error) { server.log.error(error, 'Publication cleanup failed; will retry'); }
      }
      const documents = await prisma.document.findMany({ where: { status: { notIn: ['deleted', 'removed'] } }, select: { filename: true, assets: true } });
      const referenced = new Set(documents.flatMap(d => [d.filename, ...(d.assets as unknown as { key: string }[]).map(a => a.key)]));
      try {
        for (const name of await readdir(storageService.filePath(''))) {
          if (!/^[a-f0-9-]{36}(?:\.pdf)?$/.test(name) || referenced.has(name)) continue;
          const stats = await storageService.getFileStats(name);
          // ponytail: crash leftovers wait one hour, longer than the 15-minute request timeout.
          if (stats.isFile() && stats.mtimeMs < Date.now() - 3600000) await storageService.deleteFile(name);
        }
      } catch (error) { if ((error as { code?: string }).code !== 'ENOENT') throw error; }
      await prisma.authSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });
      await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    } catch (error) { server.log.error(error, 'Cleanup failed; will retry'); }
    finally { cleaning = false; }
  };
  server.decorate('runCleanup', runCleanup);
  const cleanup = setInterval(runCleanup, 60000);
  cleanup.unref();
  server.addHook('onClose', async () => { clearInterval(cleanup); });
  server.addHook('onClose', async () => { await prisma.$disconnect(); });
  return server;
}
