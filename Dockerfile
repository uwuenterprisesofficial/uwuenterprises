# syntax=docker/dockerfile:1

# ── 1) production dependencies only (fastify, sharp, ...) ───────────────────
# sharp MUST be a regular dependency (not a devDependency), otherwise it is missing here.
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── 2) build the website + compile the server ───────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# tsc -b && vite build && tsc -p server
RUN npm run build

# ── 3) runtime: one Node process serves the API and the built site ──────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    SERVER_PORT=3000 \
    DATA_DIR=/data \
    STATIC_DIR=/app/dist \
    SEED_DIR=/app/seed

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist
# initial pictures, imported once on the very first start (never served directly)
COPY --from=build /app/seed ./seed

# sqlite database + uploaded pictures live in the /data volume
RUN mkdir -p /data && chown -R node:node /data
VOLUME /data
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1

CMD ["node", "server/dist/index.js"]
