import { publicationLicense } from '../services/license.service.js';
import type { FastifyInstance } from 'fastify';
import type { Document } from '../../prisma/generated/client/index.js';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { requireAccount } from './auth.routes.js';
import { storageService, byteRange } from '../services/storage.service.js';

export const publicationInfo = (d: Document) => ({
  id: d.id, title: d.title, description: d.description ?? '', license: d.license, attribution: d.attribution, format: 'pdf', size: d.size,
  ownerId: d.userId, manageToken: null, deleteAt: null, status: d.status,
  createdAt: d.createdAt.getTime(), updatedAt: d.updatedAt.getTime(),
  source: `/api/files/${d.id}`, images: [], seed: false, position: 1,
});
const metadata = { type: 'object', additionalProperties: false, required: ['title', 'description'], properties: {
  title: { type: 'string', minLength: 1, maxLength: 300 }, description: { type: 'string', maxLength: 10000 },
} };
export async function fileRoutes(server: FastifyInstance) {
  server.post('/api/files/upload', { preHandler: requireAccount }, async (request, reply) => {
    const key = randomUUID() + '.pdf';
    const fields: Record<string, string> = {};
    let originalFilename = '';
    let written = false;
    try {
      for await (const part of request.parts()) {
        if (part.type === 'field') {
          if (!['title', 'description', 'license', 'attribution'].includes(part.fieldname) || typeof part.value !== 'string' || part.valueTruncated || fields[part.fieldname] !== undefined) throw Object.assign(Error('Invalid publication details.'), { statusCode: 400 });
          fields[part.fieldname] = part.value;
        } else {
          if (part.fieldname !== 'file' || !part.filename.toLowerCase().endsWith('.pdf')) {
            part.file.resume();
            throw Object.assign(Error('Choose one PDF file.'), { statusCode: 400 });
          }
          written = true;
          await storageService.saveFile(part.file, key);
          if (part.file.truncated) throw Object.assign(Error('File exceeds the upload limit.'), { statusCode: 413 });
          originalFilename = part.filename;
        }
      }
      const rights = publicationLicense(fields.license, fields.attribution);
      const title = fields.title?.trim();
      if (!written || !title || title.length > 300 || (fields.description?.length ?? 0) > 10000 || !await storageService.isPdf(key)) throw Object.assign(Error('Provide a title and a valid PDF file.'), { statusCode: 400 });
      const { size } = await storageService.getFileStats(key);
      const document = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${request.account!.id} FOR UPDATE`;
        const owner = await tx.user.findUniqueOrThrow({ where: { id: request.account!.id } });
        const used = await tx.document.aggregate({ where: { userId: owner.id, status: { notIn: ['deleted', 'removed'] } }, _sum: { size: true } });
        if ((used._sum.size ?? 0) + size > owner.quota) return null;
        return tx.document.create({ data: { ...rights, title, description: fields.description ?? '', originalFilename, filename: key, mimeType: 'application/pdf', size, userId: owner.id, status: 'ready' } });
      });
      if (!document) throw Object.assign(Error('Storage limit reached. Remove a publication to continue.'), { statusCode: 409 });
      written = false;
      return reply.code(201).send(publicationInfo(document));
    } finally {
      if (written) await storageService.deleteFile(key);
    }
  });
  server.get('/api/files', { preHandler: requireAccount }, async request => ({ documents: (await prisma.document.findMany({ where: { userId: request.account!.id, status: { notIn: ['deleted', 'removed'] } }, orderBy: { createdAt: 'desc' } })).map(publicationInfo) }));
  server.get('/api/files/:id', { preHandler: requireAccount }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const document = await prisma.document.findFirst({ where: { id, userId: request.account!.id, status: 'ready' } });
    if (!document) return reply.code(404).send({ error: 'Publication unavailable.' });
    try {
      const { size } = await storageService.getFileStats(document.filename);
      const range = request.headers.range ? byteRange(request.headers.range, size) : undefined;
      reply.header('Cache-Control', 'private, no-store').header('X-Content-Type-Options', 'nosniff');
      if (range === null) return reply.code(416).header('Content-Range', `bytes */${size}`).send();
      reply.header('Accept-Ranges', 'bytes').type(document.mimeType);
      if (range) reply.code(206).header('Content-Range', `bytes ${range.start}-${range.end}/${size}`).header('Content-Length', range.end - range.start + 1);
      else reply.header('Content-Length', size);
      return reply.send(storageService.getFileStream(document.filename, range));
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') return reply.code(404).send({ error: 'File unavailable.' });
      throw error;
    }
  });
  server.patch('/api/files/:id', { preHandler: requireAccount, schema: { body: metadata } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { title: string; description: string };
    if (!body.title.trim()) return reply.code(400).send({ error: 'Add a title.' });
    const changed = await prisma.document.updateMany({ where: { id, userId: request.account!.id, status: 'ready' }, data: { title: body.title.trim(), description: body.description } });
    if (!changed.count) return reply.code(404).send({ error: 'Publication unavailable.' });
    return publicationInfo(await prisma.document.findUniqueOrThrow({ where: { id } }));
  });
  server.delete('/api/files/:id', { preHandler: requireAccount }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const document = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${request.account!.id} FOR UPDATE`;
      const owned = await tx.document.findFirst({ where: { id, userId: request.account!.id, status: { notIn: ['deleted', 'removed'] } } });
      if (!owned) return null;
      // Keep a durable, retryable record if deleting the file or the final DB update fails.
      return tx.document.update({ where: { id }, data: { status: 'deleting' } });
    });
    if (!document) return reply.code(404).send({ error: 'Publication unavailable.' });
    await storageService.deleteFile(document.filename);
    await prisma.document.update({ where: { id }, data: { status: 'deleted' } });
    return reply.code(204).send();
  });
}
