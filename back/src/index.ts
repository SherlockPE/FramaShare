import Fastify from 'fastify'
import cors from '@fastify/cors'

const server = Fastify({
  logger: true
})

server.register(cors, {
  origin: '*' // Configure this appropriately for production
})

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
