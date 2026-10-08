import Fastify from 'fastify'
import cors from '@fastify/cors'

import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { authRoutes } from './routes/auth.routes.js';
import { fileRoutes } from './routes/files.routes.js';

const server = Fastify({
  logger: true
})

server.register(cors, {
  origin: ['http://localhost:5173'], // Restrict in production, but allow frontend
  credentials: true
})

server.register(fastifyMultipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10)
  }
})

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super-secret-fallback',
  cookie: {
    cookieName: 'token',
    signed: false
  }
})

server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-fallback'
})

server.register(authRoutes, { prefix: '/api/auth' })
server.register(fileRoutes, { prefix: '/api/files' })

server.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' })
    server.log.info(`Server listening on http://localhost:3000`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
