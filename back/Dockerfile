FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY back/package.json ./back/package.json
RUN pnpm install --frozen-lockfile --filter back...

COPY back/prisma ./back/prisma
COPY back/tsconfig.json ./back/tsconfig.json
COPY back/src ./back/src
RUN pnpm --filter back exec prisma generate && pnpm --filter back run build

WORKDIR /app/back
ENV HOST=0.0.0.0
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
