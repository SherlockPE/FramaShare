import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { storageService } from '../services/storage.service.js';
import { prisma } from '../lib/prisma.js';

export const fileRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {

  server.post('/upload', async (request, reply) => {
    // Optionally check if user is authenticated
    let userId = null;
    try {
      await request.jwtVerify();
      const payload = request.user as any;
      userId = payload.id;
    } catch (err) {
      // Proceed as anonymous upload if not authenticated
    }

    const data = await request.file({ limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10) } });
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    try {
      const storageKey = await storageService.saveFile(data.file, {
        filename: data.filename,
        mimeType: data.mimetype
      });

      // Fetch accurate file size from disk after stream completes
      const stats = await storageService.getFileStats(storageKey);

      // Save to database
      const document = await prisma.document.create({
        data: {
          title: data.filename,
          originalFilename: data.filename,
          filename: storageKey,
          mimeType: data.mimetype,
          size: stats.size,
          userId: userId,
          status: 'ready'
        }
      });

      return reply.status(201).send({
        id: document.id,
        title: document.title,
        mimeType: document.mimeType,
        size: document.size
      });
    } catch (error: any) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to save file' });
    }
  });

  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return reply.status(404).send({ error: 'File not found' });
    }

    try {
      const stats = await storageService.getFileStats(document.filename);
      const totalSize = stats.size;

      // Handle Range requests for PDF byte-ranges and video streaming
      const rangeHeader = request.headers.range;
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0] as string, 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize) {
          reply.status(416).header('Content-Range', `bytes */${totalSize}`);
          return reply.send();
        }

        const chunkSize = (end - start) + 1;
        const stream = storageService.getFileStream(document.filename, { start, end });

        reply
          .status(206)
          .header('Content-Range', `bytes ${start}-${end}/${totalSize}`)
          .header('Accept-Ranges', 'bytes')
          .header('Content-Length', chunkSize)
          .header('Content-Type', document.mimeType);

        return reply.send(stream);
      } else {
        const stream = storageService.getFileStream(document.filename);
        
        reply
          .status(200)
          .header('Content-Length', totalSize)
          .header('Accept-Ranges', 'bytes')
          .header('Content-Type', document.mimeType);

        return reply.send(stream);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return reply.status(404).send({ error: 'Physical file not found in storage' });
      }
      server.log.error(error);
      return reply.status(500).send({ error: 'Error reading file' });
    }
  });

  server.delete('/:id', async (request, reply) => {
    // Only authenticated users can delete for now
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    
    const payload = request.user as any;
    const { id } = request.params as { id: string };

    const document = await prisma.document.findUnique({ where: { id } });
    
    if (!document) {
      return reply.status(404).send({ error: 'File not found' });
    }

    // Must be the owner to delete
    if (document.userId !== payload.id) {
      return reply.status(403).send({ error: 'Forbidden: You are not the owner' });
    }

    // Delete from storage and then from DB
    await storageService.deleteFile(document.filename);
    await prisma.document.delete({ where: { id } });

    return reply.status(204).send();
  });

  server.get('/', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const payload = request.user as any;
    
    const documents = await prisma.document.findMany({
      where: { userId: payload.id },
      orderBy: { createdAt: 'desc' }
    });
    
    return reply.send({ documents });
  });
};
