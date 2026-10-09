import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../dist/app.js';
assert.equal(process.env.NODE_ENV, 'test');
assert.ok(new URL(process.env.DATABASE_URL).pathname.endsWith('_test'));
const root = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = await createServer();
server.setNotFoundHandler(async (request, reply) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname.startsWith('/api/')) return reply.code(404).send();
  const file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(root)) return reply.code(404).send();
  try { return reply.type(types[path.extname(file)] || 'application/octet-stream').send(await readFile(file)); }
  catch { if (path.extname(file) && pathname !== '/') return reply.code(404).send(); return reply.type('text/html').send(await readFile(path.join(root, 'index.html'))); }
});
await server.listen({ host: '127.0.0.1', port: Number(process.env.PORT) });
console.log('browser-server-ready');
for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { void server.close(); });
