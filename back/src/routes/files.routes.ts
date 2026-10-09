import { instanceSettings } from '../services/settings.service.js';
import { parseEpub } from '../services/epub.service.js';
import { publicationLicense } from '../services/license.service.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Document } from '../../prisma/generated/client/index.js';
import { randomUUID, randomBytes } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { managedDocument } from './sharing.routes.js';
import { tokenHash } from '../services/password.service.js';
import { requireAccount } from './auth.routes.js';
import { storageService, byteRange } from '../services/storage.service.js';

export const publicationSelect = { id: true, title: true, description: true, license: true, attribution: true, format: true, size: true, userId: true, manageHash: true, deleteAt: true, status: true, createdAt: true, updatedAt: true, filename: true, originalFilename: true, mimeType: true, retentionDays: true, assets: true, moderated: true } as const;
export const publicationInfo = (d: Omit<Document, 'chapters'>) => ({
  id: d.id, title: d.title, description: d.description ?? '', license: d.license, attribution: d.attribution, format: d.format, size: d.size,
  ownerId: d.userId, manageToken: null, deleteAt: d.deleteAt?.getTime() ?? null, status: d.status,
  createdAt: d.createdAt.getTime(), updatedAt: d.updatedAt.getTime(),
  source: `/api/files/${d.id}`, images: (d.assets as unknown as Asset[]).map(a => ({ id: a.id, src: `/api/files/${d.id}?image=${a.id}`, caption: a.caption, alt: a.alt })), seed: false, position: 1,
});
export interface Asset { id: string; key: string; mime: string; caption: string; alt: string }
export async function deletePublicationFiles(d: Document) {
  for (const key of new Set([d.filename, ...(d.assets as unknown as Asset[]).map(a => a.key)])) await storageService.deleteFile(key);
}
const metadata = { type: 'object', additionalProperties: false, required: ['title', 'description'], properties: {
  images: { type: 'array', maxItems: 50, items: { type: 'object', additionalProperties: false, required: ['id', 'caption', 'alt'], properties: { id: { type: 'string', maxLength: 100 }, caption: { type: 'string', maxLength: 1000 }, alt: { type: 'string', maxLength: 1000 } } } },
  title: { type: 'string', minLength: 1, maxLength: 300 }, description: { type: 'string', maxLength: 10000 },
} };
export async function fileRoutes(server: FastifyInstance) {
  let activeUploads = 0;
  server.post('/api/files/upload', {}, async (request, reply) => {
    if (activeUploads >= 2) return reply.code(429).send({ error: 'Uploads busy. Please retry shortly.' });
    activeUploads++;
    try {
    const settings = await instanceSettings();
    const managementToken = request.account ? null : randomBytes(32).toString('hex');
    const keys: string[] = [];
    const assets: Asset[] = [];
    let format = '', mimeType = '', totalSize = 0;
    let chapters: { title: string; html: string }[] = [];
    const fields: Record<string, string> = {};
    let originalFilename = '';
    let written = false;
    try {
      for await (const part of request.parts()) {
        if (part.type === 'field') {
          if (!['title', 'description', 'license', 'attribution', 'retention'].includes(part.fieldname) || typeof part.value !== 'string' || part.valueTruncated || fields[part.fieldname] !== undefined) throw Object.assign(Error('Invalid publication details.'), { statusCode: 400 });
          fields[part.fieldname] = part.value;
        } else {
          if (part.fieldname !== 'file' || keys.length >= settings.albumCount) { part.file.resume(); throw Object.assign(Error('Choose up to 50 images or one PDF/EPUB.'), { statusCode: 400 }); }
          const key = randomUUID(); keys.push(key); written = true;
          await storageService.saveFile(part.file, key);
          if (part.file.truncated) throw Object.assign(Error('File exceeds the upload limit.'), { statusCode: 413 });
          const size = (await storageService.getFileStats(key)).size; totalSize += size;
          if (totalSize > Number(process.env.MAX_FILE_SIZE || 100000000) || totalSize > Math.max(settings.fileMB, settings.albumMB) * 1000000) throw Object.assign(Error('Publication exceeds upload limit.'), { statusCode: 413 });
          let imageType: string | null;
          try { imageType = await storageService.imageType(key); } catch { throw Object.assign(Error('Invalid image or more than 20 million pixels.'), { statusCode: 400 }); }
          if (imageType) {
            if (format && format !== 'album') throw Object.assign(Error('Do not mix publication formats.'), { statusCode: 400 });
            format = 'album'; mimeType = imageType;
            assets.push({ id: randomUUID(), key, mime: imageType, caption: '', alt: part.filename.slice(0, 1000) });
          } else {
            if (keys.length !== 1) throw Object.assign(Error('Choose one PDF or EPUB.'), { statusCode: 400 });
            if (part.filename.toLowerCase().endsWith('.pdf') && await storageService.isPdf(key)) { format = 'pdf'; mimeType = 'application/pdf'; }
            else if (part.filename.toLowerCase().endsWith('.epub')) { try { chapters = await parseEpub(storageService.filePath(key)); } catch { throw Object.assign(Error('Invalid or unsupported EPUB.'), { statusCode: 400 }); } format = 'epub'; mimeType = 'application/epub+zip'; }
            else throw Object.assign(Error('Unsupported or invalid publication file.'), { statusCode: 400 });
          }
          originalFilename = originalFilename || part.filename;
        }
      }
      const rights = publicationLicense(fields.license, fields.attribution);
      const title = fields.title?.trim();
      if (!written || !title || title.length > 300 || (fields.description?.length ?? 0) > 10000) throw Object.assign(Error('Provide a title and a valid PDF file.'), { statusCode: 400 });
      const size = totalSize;
      if (size > (format === 'album' ? settings.albumMB : settings.fileMB) * 1000000) throw Object.assign(Error('Publication exceeds configured limit.'), { statusCode: 413 });
      const retention = Number(fields.retention || settings.defaultRetention);
      if (!settings.retention.includes(retention)) throw Object.assign(Error('Invalid retention.'), { statusCode: 400 });
      const data = { ...rights, title, description: fields.description ?? '', originalFilename, filename: keys[0]!, mimeType, format, assets: assets as unknown as any[], chapters, size, status: 'ready' };
      const document = managementToken ? await prisma.document.create({ data: { ...data, manageHash: tokenHash(managementToken), retentionDays: retention, deleteAt: new Date(Date.now() + retention * 86400000) } }) : await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${request.account!.id} FOR UPDATE`;
        const owner = await tx.user.findUniqueOrThrow({ where: { id: request.account!.id } });
        const used = await tx.document.aggregate({ where: { userId: owner.id, status: { notIn: ['deleted', 'removed'] } }, _sum: { size: true } });
        if (owner.deleting) throw Object.assign(Error('Account is being deleted.'), { statusCode: 409 });
        if ((used._sum.size ?? 0) + size > owner.quota) return null;
        return tx.document.create({ data: { ...data, userId: owner.id } });
      });
      if (!document) throw Object.assign(Error('Storage limit reached. Remove a publication to continue.'), { statusCode: 409 });
      written = false;
      return reply.code(201).send({ ...publicationInfo(document), manageToken: managementToken });
    } finally {
      if (written) for (const key of keys) await storageService.deleteFile(key);
    }
    } finally { activeUploads--; }
  });
  server.get('/api/files', { preHandler: requireAccount }, async request => ({ documents: (await prisma.document.findMany({ select: publicationSelect, where: { userId: request.account!.id, status: { notIn: ['deleted', 'removed'] } }, orderBy: { createdAt: 'desc' } })).map(publicationInfo) }));
  server.get('/api/files/:id', async (request, reply) => {
    const document = await managedDocument(request, (request.params as { id: string }).id);
    if (document.status !== 'ready') return reply.code(404).send({ error: 'Publication unavailable.' });
    return sendDocument(request, reply, document);
  });
  server.patch('/api/files/:id', { schema: { body: metadata } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const document = await managedDocument(request, id);
    const body = request.body as { title: string; description: string; images?: { id: string; caption: string; alt: string }[] };
    if (!body.title.trim()) return reply.code(400).send({ error: 'Add a title.' });
    const assets = document.assets as unknown as Asset[];
    if (body.images && (document.format !== 'album' || body.images.length !== assets.length || new Set(body.images.map(a => a.id)).size !== assets.length || body.images.some(a => !assets.some(b => a.id === b.id)))) return reply.code(400).send({ error: 'Invalid album order.' });
    const changed = await prisma.document.updateMany({ where: { id, status: 'ready', userId: document.userId, manageHash: document.manageHash }, data: { title: body.title.trim(), description: body.description, ...(body.images ? { assets: body.images.map(a => ({ ...assets.find(b => b.id === a.id)!, caption: a.caption, alt: a.alt })) } : {}) } });
    if (!changed.count) return reply.code(404).send({ error: 'Publication unavailable.' });
    return publicationInfo(await prisma.document.findUniqueOrThrow({ where: { id } }));
  });
  server.delete('/api/files/:id', {}, async (request, reply) => {
    const { id } = request.params as { id: string };
    const authorized = await managedDocument(request, id);
    const document = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Document" WHERE id = ${id} FOR UPDATE`;
      const owned = await tx.document.findFirst({ where: { id, status: { notIn: ['deleted', 'removed'] } } });
      if (!owned || owned.userId !== authorized.userId || owned.manageHash !== authorized.manageHash) return null;
      // Keep a durable, retryable record if deleting the file or the final DB update fails.
      return tx.document.update({ where: { id }, data: { status: 'deleting' } });
    });
    if (!document) return reply.code(404).send({ error: 'Publication unavailable.' });
    await deletePublicationFiles(document);
    await prisma.document.update({ where: { id }, data: { status: 'deleted' } });
    return reply.code(204).send();
  });
}

export async function sendDocument(request: FastifyRequest, reply: FastifyReply, document: Document) {
    try {
      const query = request.query as { image?: string; content?: string };
      if (document.format === 'epub' && query.content === '1') return reply.send({ chapters: document.chapters });
      let key = document.filename, mime = document.mimeType;
      if (document.format === 'album') {
        const asset = (document.assets as unknown as Asset[]).find(a => a.id === query.image) ?? (!query.image ? (document.assets as unknown as Asset[])[0] : undefined);
        if (!asset) return reply.code(404).send({ error: 'Image unavailable.' });
        key = asset.key; mime = asset.mime;
      }
      const { size } = await storageService.getFileStats(key);
      const range = request.headers.range ? byteRange(request.headers.range, size) : undefined;
      reply.header('Cache-Control', 'private, no-store').header('X-Content-Type-Options', 'nosniff');
      if (range === null) return reply.code(416).header('Content-Range', `bytes */${size}`).send();
      reply.header('Accept-Ranges', 'bytes').type(mime);
      if (range) reply.code(206).header('Content-Range', `bytes ${range.start}-${range.end}/${size}`).header('Content-Length', range.end - range.start + 1);
      else reply.header('Content-Length', size);
      return reply.send(storageService.getFileStream(key, range));
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') return reply.code(404).send({ error: 'File unavailable.' });
      throw error;
    }
}
