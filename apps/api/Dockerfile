# syntax=docker/dockerfile:1
# Imagen de la API (NestJS) para Railway. Contexto de build = raíz del monorepo.

# ---------- build ----------
FROM node:24-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
# Copiamos todo el workspace (el .dockerignore excluye node_modules, apps/web, etc.)
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @sortea2/shared build \
  && pnpm --filter @sortea2/api exec prisma generate \
  && pnpm --filter @sortea2/api build

# ---------- runtime ----------
FROM node:24-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/api
# Railway inyecta PORT; la app lo lee en configuration.ts
EXPOSE 3000
# Aplica migraciones pendientes (usa DIRECT_URL) y arranca
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
