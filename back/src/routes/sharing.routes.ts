import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, tokenHash } from '../services/password.service.js';
import { instanceSettings } from '../services/settings.service.js';
import { accountInfo } from './auth.routes.js';
import { deletePublicationFiles, publicationSelect, publicationInfo, sendDocument } from './files.routes.js';
import { requireAccount } from './auth.routes.js';
import type { Document, Link } from '../../prisma/generated/client/index.js';
const fail = (message = 'Publication unavailable.', statusCode = 404) => Object.assign(Error(message), { statusCode });
const randomToken = () => randomBytes(32).toString('hex');
const valid = (d: Document) => d.status === 'ready' && (!d.deleteAt || d.deleteAt > new Date());
export async function managedDocument(request: FastifyRequest, id: string) {
  const d = await prisma.document.findUnique({ where: { id } });
  const manage = request.headers['x-manage-token'] || (request.query as { manage?: string }).manage;
  if (!request.account && !manage) throw fail('Sign in to continue.', 401);
  if (!d || (!request.account || d.userId !== request.account.id) && request.account?.role !== 'admin' && !(typeof manage === 'string' && d.manageHash === tokenHash(manage))) throw fail();
  if (d.deleteAt && d.deleteAt <= new Date()) throw fail();
  return d;
}
export const linkInfo = (l: Link, used: number) => ({ id: l.id, token: l.slug, documentId: l.documentId, name: l.name, password: l.password ? 'protected' : '', expiresAt: l.expiresAt?.getTime() ?? null, limit: l.maxSessions, used, allowDownload: l.allowDownload, revoked: l.isRevoked });
const linkBody = { type: 'object', additionalProperties: false, required: ['name'], properties: {
  name: { type: 'string', minLength: 1, maxLength: 120 }, password: { type: 'string', maxLength: 256 },
  expiresAt: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] }, limit: { anyOf: [{ type: 'integer', minimum: 1, maximum: 1000000 }, { type: 'null' }] }, allowDownload: { type: 'boolean' }, revoked: { type: 'boolean' },
} };
async function accessibleLink(token: string) {
  const l = await prisma.link.findUnique({ where: { slug: token }, include: { document: true, _count: { select: { sessions: true } } } });
  if (!l || l.isRevoked || l.expiresAt && l.expiresAt <= new Date() || !valid(l.document)) throw fail('Link unavailable.', 410);
  return l;
}
async function readSession(request: FastifyRequest, l: Link) {
  const token = request.cookies['read_' + l.id];
  if (!token) return null;
  return prisma.session.findFirst({ where: { linkId: l.id, tokenHash: tokenHash(token), expiresAt: { gt: new Date() } } });
}
export async function sharingRoutes(server: FastifyInstance) {
  server.get('/api/settings', async () => instanceSettings());
  server.get('/api/links', { preHandler: requireAccount }, async request => ({ links: (await prisma.link.findMany({ where: { document: { userId: request.account!.id } }, include: { _count: { select: { sessions: true } } } })).map(l => linkInfo(l, l._count.sessions)) }));
  server.get('/api/manage/:token', async request => {
    const { token } = request.params as { token: string };
    const d = await prisma.document.findUnique({ where: { manageHash: tokenHash(token) } });
    if (!d || !valid(d)) throw fail('Management link unavailable.');
    const info = publicationInfo(d);
    return { ...info, manageToken: token, source: `${info.source}?manage=${token}`, images: info.images.map(a => ({ ...a, src: `${a.src}&manage=${token}` })) };
  });
  server.post('/api/manage/:token/claim', { preHandler: requireAccount }, async request => {
    const { token } = request.params as { token: string };
    const d = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${request.account!.id} FOR UPDATE`;
      const owner = await tx.user.findUniqueOrThrow({ where: { id: request.account!.id } });
      if (owner.deleting) throw fail('Account unavailable.', 409);
      const candidate = await tx.document.findUnique({ where: { manageHash: tokenHash(token) } });
      if (!candidate) throw fail();
      await tx.$queryRaw`SELECT id FROM "Document" WHERE id = ${candidate.id} FOR UPDATE`;
      const d = await tx.document.findUnique({ where: { manageHash: tokenHash(token) } });
      if (!d || !valid(d) || d.userId) throw fail();
      const used = await tx.document.aggregate({ where: { userId: owner.id, status: { notIn: ['deleted', 'removed'] } }, _sum: { size: true } });
      if ((used._sum.size ?? 0) + d.size > owner.quota) throw fail('Storage limit reached.', 409);
      const claimed = await tx.document.updateMany({ where: { id: d.id, userId: null, manageHash: tokenHash(token), status: 'ready', deleteAt: { gt: new Date() } }, data: { userId: owner.id, manageHash: null, deleteAt: null, retentionDays: null } });
      if (!claimed.count) throw fail();
      return tx.document.findUniqueOrThrow({ where: { id: d.id } });
    });
    return publicationInfo(d);
  });
  server.get('/api/files/:id/links', async request => {
    const d = await managedDocument(request, (request.params as { id: string }).id);
    return { links: (await prisma.link.findMany({ where: { documentId: d.id }, include: { _count: { select: { sessions: true } } } })).map(l => linkInfo(l, l._count.sessions)) };
  });
  const save = async (request: FastifyRequest) => {
    const { id, linkId } = request.params as { id: string; linkId?: string };
    const d = await managedDocument(request, id);
    if (!valid(d)) throw fail();
    const b = request.body as { name: string; password?: string; expiresAt?: number | null; limit?: number | null; allowDownload?: boolean; revoked?: boolean };
    if (!b.name.trim() || b.expiresAt != null && b.expiresAt <= Date.now()) throw fail('Invalid link details.', 400);
    const data = { name: b.name.trim(), ...(b.password === undefined ? {} : { password: b.password ? await hashPassword(b.password) : null }), expiresAt: b.expiresAt ? new Date(b.expiresAt) : null, maxSessions: b.limit ?? null, allowDownload: b.allowDownload ?? true, isRevoked: b.revoked ?? false };
    if (linkId && !await prisma.link.findFirst({ where: { id: linkId, documentId: id } })) throw fail();
    const l = linkId ? await prisma.link.update({ where: { id: linkId }, data }) : await prisma.link.create({ data: { ...data, documentId: id, slug: randomToken() } });
    return linkInfo(l, await prisma.session.count({ where: { linkId: l.id } }));
  };
  server.post('/api/files/:id/links', { schema: { body: linkBody } }, save);
  server.patch('/api/files/:id/links/:linkId', { schema: { body: linkBody } }, save);
  server.get('/api/share/:token', async request => {
    const l = await accessibleLink((request.params as { token: string }).token);
    const active = await readSession(request, l);
    const info = publicationInfo(l.document);
    return { document: { ...info, source: `/api/share/${l.slug}/file`, images: info.images.map(a => ({ ...a, src: `/api/share/${l.slug}/file?image=${a.id}` })) }, link: linkInfo(l, l._count.sessions), session: active ? { id: active.id, token: l.slug, expiresAt: active.expiresAt!.getTime() } : null };
  });
  server.post('/api/share/:token/session', { schema: { body: { type: 'object', additionalProperties: false, properties: { password: { type: 'string', maxLength: 256 } } } }, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const l = await accessibleLink((request.params as { token: string }).token);
    const active = await readSession(request, l);
    if (active) return { id: active.id, token: l.slug, expiresAt: active.expiresAt!.getTime() };
    if (l.password && !await verifyPassword((request.body as { password?: string }).password || '', l.password)) throw fail('Incorrect password.', 403);
    const token = randomToken();
    const session = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Link" WHERE id = ${l.id} FOR UPDATE`;
      const current = await tx.link.findUniqueOrThrow({ where: { id: l.id }, include: { document: true, _count: { select: { sessions: true } } } });
      if (current.isRevoked || current.expiresAt && current.expiresAt <= new Date() || !valid(current.document) || current.password !== l.password) throw fail('Link unavailable.', 410);
      if (current.maxSessions !== null && current._count.sessions >= current.maxSessions) throw fail('Reading session limit reached.', 409);
      return tx.session.create({ data: { linkId: l.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 3600000) } });
    });
    reply.setCookie('read_' + l.id, token, { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 3600 });
    return { id: session.id, token: l.slug, expiresAt: session.expiresAt!.getTime() };
  });
  for (const action of ['file', 'download']) server.get(`/api/share/:token/${action}`, async (request, reply) => {
    const l = await accessibleLink((request.params as { token: string }).token);
    if (!await readSession(request, l)) throw fail('Start a reading session.', 401);
    if (action === 'file' && l.document.format === 'epub' && (request.query as { content?: string }).content !== '1') throw fail('Use the sanitized EPUB reader or the download route.', 403);
    if (action === 'download' && !l.allowDownload) throw fail('Downloads disabled.', 403);
    if (action === 'download') reply.header('Content-Disposition', 'attachment');
    return sendDocument(request, reply, l.document);
  });
  server.post('/api/reports', { schema: { body: { type: 'object', additionalProperties: false, required: ['documentId', 'reason', 'description'], properties: { documentId: { type: 'string', maxLength: 100 }, reason: { type: 'string', minLength: 1, maxLength: 120 }, description: { type: 'string', minLength: 1, maxLength: 5000 } } } }, config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async request => {
    const b = request.body as { documentId: string; reason: string; description: string };
    if (!b.reason.trim() || !b.description.trim() || !await prisma.document.findUnique({ where: { id: b.documentId } })) throw fail('Invalid report.', 400);
    return prisma.report.create({ data: b });
  });
  server.get('/api/admin/reports', async (request, reply) => {
    if (request.account?.role !== 'admin') return reply.code(403).send({ error: 'Administrator access required.' });
    return { reports: await prisma.report.findMany({ orderBy: { createdAt: 'desc' } }) };
  });
  const admin = async (request: FastifyRequest) => { if (request.account?.role !== 'admin') throw fail('Administrator access required.', 403); };
  server.get('/api/admin/state', { preHandler: admin }, async () => ({
    accounts: (await prisma.user.findMany()).map(accountInfo),
    documents: (await prisma.document.findMany({ select: publicationSelect })).map(publicationInfo),
    reports: (await prisma.report.findMany()).map(r => ({ ...r, createdAt: r.createdAt.getTime() })),
    settings: await instanceSettings(),
  }));
  server.patch('/api/admin/accounts/:id', { preHandler: admin, schema: { body: { type: 'object', additionalProperties: false, required: ['quota'], properties: { quota: { type: 'integer', minimum: 1000000, maximum: 2000000000 } } } } }, async request => {
    return accountInfo(await prisma.user.update({ where: { id: (request.params as { id: string }).id }, data: request.body as { quota: number } }));
  });
  server.patch('/api/admin/settings', { preHandler: admin, schema: { body: { type: 'object', additionalProperties: false, required: ['fileMB', 'albumMB', 'albumCount', 'quotaMB', 'retention', 'defaultRetention'], properties: {
    fileMB: { type: 'integer', minimum: 1, maximum: 100 }, albumMB: { type: 'integer', minimum: 1, maximum: 100 }, albumCount: { type: 'integer', minimum: 1, maximum: 50 }, quotaMB: { type: 'integer', minimum: 1, maximum: 2000 }, retention: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'integer', enum: [1, 7, 30] } }, defaultRetention: { type: 'integer', enum: [1, 7, 30] },
  } } } }, async request => {
    const value = request.body as Awaited<ReturnType<typeof instanceSettings>>;
    if (!value.retention.includes(value.defaultRetention)) throw fail('Choose an allowed default retention.', 400);
    await prisma.instanceSettings.upsert({ where: { id: 1 }, create: { id: 1, value }, update: { value } });
    return value;
  });
  server.post('/api/admin/reports/:id/dismiss', { preHandler: admin }, async request => prisma.report.update({ where: { id: (request.params as { id: string }).id }, data: { status: 'resolved', decision: 'Dismissed' } }));
  server.delete('/api/admin/publications/:id', { preHandler: admin }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const d = await prisma.$transaction(async tx => {
      const d = await tx.document.update({ where: { id }, data: { status: 'deleting', moderated: true, manageHash: null } });
      await tx.report.updateMany({ where: { documentId: id, status: 'open' }, data: { status: 'resolved', decision: 'Publication removed' } });
      return d;
    });
    await deletePublicationFiles(d);
    await prisma.document.update({ where: { id }, data: { status: 'removed' } });
    return reply.code(204).send();
  });

}
