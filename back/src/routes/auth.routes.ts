import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, tokenHash } from '../services/password.service.js';
import type { User } from '../../prisma/generated/client/index.js';

declare module 'fastify' { interface FastifyRequest { account: User | null } }
const cookieOptions = { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
export const accountInfo = (user: User) => ({ id: user.id, name: user.name, email: user.email, role: user.role, quota: user.quota });
export async function requireAccount(request: FastifyRequest, reply: FastifyReply) {
  if (!request.account) return reply.code(401).send({ error: 'Sign in to continue.' });
}
const email = { type: 'string', format: 'email', maxLength: 254 };
const password = { type: 'string', minLength: 8, maxLength: 256 };
const name = { type: 'string', minLength: 1, maxLength: 120 };
const bodySchema = (properties: object, required: string[]) => ({ body: { type: 'object', additionalProperties: false, properties, required } });
async function createSession(user: User, reply: FastifyReply) {
  const token = randomBytes(32).toString('hex');
  await prisma.authSession.create({ data: { tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
  reply.setCookie('session', token, { ...cookieOptions, maxAge: 7 * 86400 });
  return { user: accountInfo(user) };
}
export async function authRoutes(server: FastifyInstance) {
  server.decorateRequest('account', null);
  server.addHook('onRequest', async request => {
    const token = request.cookies.session;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
    const session = await prisma.authSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
    if (session && session.expiresAt > new Date()) request.account = session.user;
  });
  server.post('/api/auth/register', { schema: bodySchema({ email, password, name }, ['email', 'password', 'name']), config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = request.body as { email: string; password: string; name: string };
    if (!body.name.trim()) return reply.code(400).send({ error: 'Enter your name.' });
    try {
      const user = await prisma.user.create({ data: { email: body.email.trim().toLowerCase(), name: body.name.trim(), passwordHash: await hashPassword(body.password) } });
      return reply.code(201).send(await createSession(user, reply));
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') return reply.code(409).send({ error: 'Email is already in use.' });
      throw error;
    }
  });
  server.post('/api/auth/login', { schema: bodySchema({ email, password }, ['email', 'password']), config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = request.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email: body.email.trim().toLowerCase() } });
    // The same expensive check applies to missing accounts to avoid an easy timing oracle.
    const valid = await verifyPassword(body.password, user?.passwordHash ?? `scrypt:131072:${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if (!user || !valid) return reply.code(401).send({ error: 'Invalid email or password.' });
    return createSession(user, reply);
  });
  server.get('/api/auth/me', async request => ({ user: request.account ? accountInfo(request.account) : null }));
  server.post('/api/auth/logout', async (request, reply) => {
    if (request.cookies.session) await prisma.authSession.deleteMany({ where: { tokenHash: tokenHash(request.cookies.session) } });
    reply.clearCookie('session', cookieOptions);
    return { success: true };
  });
  server.patch('/api/auth/profile', { preHandler: requireAccount, schema: bodySchema({ name, email }, ['name', 'email']) }, async (request, reply) => {
    const body = request.body as { name: string; email: string };
    if (!body.name.trim()) return reply.code(400).send({ error: 'Enter your name.' });
    try {
      return { user: accountInfo(await prisma.user.update({ where: { id: request.account!.id }, data: { name: body.name.trim(), email: body.email.trim().toLowerCase() } })) };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') return reply.code(409).send({ error: 'Email is already in use.' });
      throw error;
    }
  });
  server.post('/api/auth/password', { preHandler: requireAccount, schema: bodySchema({ oldPassword: password, newPassword: password }, ['oldPassword', 'newPassword']) }, async (request, reply) => {
    const body = request.body as { oldPassword: string; newPassword: string };
    const hash = await hashPassword(body.newPassword);
    const changed = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${request.account!.id} FOR UPDATE`;
      const user = await tx.user.findUniqueOrThrow({ where: { id: request.account!.id } });
      if (!await verifyPassword(body.oldPassword, user.passwordHash)) return false;
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
      await tx.authSession.deleteMany({ where: { userId: user.id } });
      return true;
    });
    if (!changed) return reply.code(400).send({ error: 'Current password is incorrect.' });
    reply.clearCookie('session', cookieOptions);
    return { success: true };
  });
}
