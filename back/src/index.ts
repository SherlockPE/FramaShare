import Fastify from 'fastify'
import cors from '@fastify/cors'

import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { authRoutes } from './routes/auth.routes.js';

const server = Fastify({
  logger: true
})

server.register(cors, {
  origin: ['http://localhost:5173'], // Restrict in production, but allow frontend
  credentials: true
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
