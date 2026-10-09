import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, tokenHash } from '../services/password.service.js';
import { instanceSettings } from '../services/settings.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { deletePublicationFiles } from './files.routes.js';
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
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
    const current = await tx.user.findUnique({ where: { id: user.id } });
    if (!current || current.deleting || current.passwordHash !== user.passwordHash) throw Object.assign(Error('Account changed. Sign in again.'), { statusCode: 401 });
    await tx.authSession.create({ data: { tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } });
  });
  reply.setCookie('session', token, { ...cookieOptions, maxAge: 7 * 86400 });
  return { user: accountInfo(user) };
}
export async function authRoutes(server: FastifyInstance) {
  server.decorateRequest('account', null);
  server.addHook('onRequest', async request => {
    const token = request.cookies.session;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
    const session = await prisma.authSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
    if (session && session.expiresAt > new Date() && !session.user.deleting) request.account = session.user;
  });
  server.post('/api/auth/register', { schema: bodySchema({ email, password, name }, ['email', 'password', 'name']), config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const body = request.body as { email: string; password: string; name: string };
    if (!body.name.trim()) return reply.code(400).send({ error: 'Enter your name.' });
    try {
      const user = await prisma.user.create({ data: { email: body.email.trim().toLowerCase(), name: body.name.trim(), quota: (await instanceSettings()).quotaMB * 1000000, passwordHash: await hashPassword(body.password) } });
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
    if (!user || user.deleting || !valid) return reply.code(401).send({ error: 'Invalid email or password.' });
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
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      return true;
    });
    if (!changed) return reply.code(400).send({ error: 'Current password is incorrect.' });
    reply.clearCookie('session', cookieOptions);
    return { success: true };
  });
  server.post('/api/auth/forgot-password', { schema: bodySchema({ email }, ['email']), config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async request => {
    const body = request.body as { email: string };
    const user = await prisma.user.findUnique({ where: { email: body.email.trim().toLowerCase() } });
    if (user && !user.deleting) {
      const token = randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({ data: { tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
      try {
        await sendPasswordResetEmail(user.email, `${new URL(process.env.APP_ORIGIN || 'http://localhost:5173').origin}/reset-password?token=${token}`);
      } catch (error) {
        await prisma.passwordResetToken.deleteMany({ where: { tokenHash: tokenHash(token) } });
        request.log.error({ err: error }, 'Password reset delivery failed');
      }
    }
    return { message: 'If the account exists, a reset link will be sent. Check your inbox.' };
  });
  server.post('/api/auth/reset-password', { schema: bodySchema({ token: { type: 'string', pattern: '^[a-f0-9]{64}$' }, newPassword: password }, ['token', 'newPassword']), config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const body = request.body as { token: string; newPassword: string };
    const hash = await hashPassword(body.newPassword);
    const changed = await prisma.$transaction(async tx => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash: tokenHash(body.token) } });
      if (!token) return false;
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${token.userId} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: token.userId } });
      if (!user || user.deleting) return false;
      const consumed = await tx.passwordResetToken.deleteMany({ where: { tokenHash: token.tokenHash, expiresAt: { gt: new Date() } } });
      if (!consumed.count) return false;
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
      await tx.authSession.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      return true;
    });
    if (!changed) return reply.code(400).send({ error: 'Invalid or expired reset link.' });
    reply.clearCookie('session', cookieOptions);
    return { success: true };
  });
  server.delete('/api/auth/account', { preHandler: requireAccount }, async (request, reply) => {
    const id = request.account!.id;
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${id} FOR UPDATE`;
      await tx.user.update({ where: { id }, data: { deleting: true } });
      await tx.document.updateMany({ where: { userId: id }, data: { status: 'deleting' } });
      await tx.authSession.deleteMany({ where: { userId: id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: id } });
    });
    await finishAccountDeletion(id);
    reply.clearCookie('session', cookieOptions);
    return reply.code(204).send();
  });

}

export async function finishAccountDeletion(id: string) {
  const documents = await prisma.document.findMany({ where: { userId: id } });
  for (const document of documents) await deletePublicationFiles(document);
  await prisma.$transaction(async tx => {
    await tx.session.deleteMany({ where: { link: { document: { userId: id } } } });
    await tx.link.deleteMany({ where: { document: { userId: id } } });
    await tx.document.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });
}
