FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY apps/auth-service/package.json ./apps/auth-service/
COPY packages/logger/package.json ./packages/logger/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/auth-sdk/package.json ./packages/auth-sdk/
RUN npm ci --workspace=@app/auth-service

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx turbo run build --filter=@app/auth-service

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/auth-service/dist ./dist
COPY --from=builder /app/apps/auth-service/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
