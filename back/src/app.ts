import Fastify from 'fastify';
import type { FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.routes.js';
import { fileRoutes } from './routes/files.routes.js';
import { prisma } from './lib/prisma.js';

export async function createServer() {
  const origin = new URL(process.env.APP_ORIGIN || 'http://localhost:5173').origin;
  const fileSize = Number(process.env.MAX_FILE_SIZE || 100000000);
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > 100000000) throw Error('MAX_FILE_SIZE must be between 1 and 100000000 bytes.');
  if (process.env.NODE_ENV === 'production' && (!process.env.DATABASE_URL || !process.env.STORAGE_PATH || !process.env.APP_ORIGIN || !origin.startsWith('https://'))) throw Error('Production requires DATABASE_URL, STORAGE_PATH and an HTTPS APP_ORIGIN.');
  const server = Fastify({ logger: process.env.NODE_ENV !== 'test', bodyLimit: 20000 });
  await server.register(cookie);
  await server.register(multipart, { limits: { files: 1, fields: 4, parts: 5, fileSize, fieldSize: 10000 } });
  await server.register(rateLimit, { global: true, max: 120, timeWindow: '1 minute' });
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
  server.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  server.addHook('onClose', async () => { await prisma.$disconnect(); });
  return server;
}
