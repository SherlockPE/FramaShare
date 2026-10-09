import { createServer } from './app.js';

try {
  const server = await createServer();
  await server.listen({ port: Number(process.env.PORT ?? 3000), host: process.env.HOST ?? '127.0.0.1' });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void server.close(); });
} catch (error) {
  console.error(error);
  process.exit(1);
}
