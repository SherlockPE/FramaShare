# ----------------------------------------------------
# 1. Builder Stage
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install compilation tools needed for native addons (bcrypt) and openssl for Prisma
RUN apk add --no-cache python3 make g++ openssl

# Enable pnpm
RUN corepack enable pnpm

# Copy dependency definition
COPY package.json ./

# Configure pnpm to allow native build scripts and install all dependencies
RUN pnpm install --allow-build bcrypt --allow-build prisma --allow-build @prisma/engines --allow-build @prisma/client --allow-build esbuild

# Copy configuration and source files
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client
RUN pnpm exec prisma generate --schema=prisma/schema.prisma

# Build TypeScript to JavaScript (dist/)
RUN pnpm run build

# ----------------------------------------------------
# 2. Production Runner Stage
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime openssl for Prisma engine on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules, generated Prisma client, compiled JS and package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Run with non-privileged user for security
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
