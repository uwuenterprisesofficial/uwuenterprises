import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { COOKIE, config } from './config.js';
import { db, type UserRow } from './db.js';
import { purgeExpiredSessions, userForToken } from './security.js';
import { seedIfEmpty } from './seed.js';
import { authRoutes } from './routes/auth.js';
import { publicRoutes } from './routes/public.js';
import { talentRoutes } from './routes/talents.js';
import { adminRoutes } from './routes/admin.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: UserRow | null;
    sessionToken: string | undefined;
  }
}

const app = Fastify({ logger: { level: config.isProd ? 'info' : 'warn' }, trustProxy: true, bodyLimit: 256 * 1024 });

await app.register(fastifyCookie);
await app.register(fastifyMultipart, { limits: { fileSize: 15 * 1024 * 1024, files: 20, fields: 10 } });

app.decorateRequest('user', null);
app.decorateRequest('sessionToken', undefined);

/* who is calling? */
app.addHook('onRequest', async (req) => {
  req.sessionToken = req.cookies[COOKIE];
  req.user = userForToken(req.sessionToken) ?? null;
});

/* CSRF: state-changing requests must come from our own origin (cookies are SameSite=Lax as well) */
app.addHook('preHandler', async (req, reply) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host;
  let ok = false;
  try { ok = !!origin && new URL(origin).host === host; } catch { ok = false; }
  if (!ok) return reply.code(403).send({ error: 'Ungültige Herkunft der Anfrage.' });
});

app.addHook('onSend', async (_req, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('X-Frame-Options', 'SAMEORIGIN');
});

app.get('/healthz', async () => 'ok');

await app.register(publicRoutes);
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(talentRoutes, { prefix: '/api/talents' });
await app.register(adminRoutes, { prefix: '/api/admin' });

/* ── the built website (single-page app) ── */
if (fs.existsSync(config.staticDir)) {
  await app.register(fastifyStatic, { root: config.staticDir, wildcard: false, index: ['index.html'] });
  app.setNotFoundHandler((req, reply) => {
    const path0 = req.url.split('?')[0];
    if (req.method !== 'GET' || path0.startsWith('/api/') || path0.startsWith('/media/') || /\.[a-z0-9]{2,5}$/i.test(path0)) {
      return reply.code(404).send({ error: 'Nicht gefunden.' });
    }
    return reply.type('text/html').header('Cache-Control', 'no-cache').send(fs.readFileSync(path.join(config.staticDir, 'index.html')));
  });
}

app.setErrorHandler((err: Error & { statusCode?: number; code?: string }, _req, reply) => {
  if (err.code === 'FST_REQ_FILE_TOO_LARGE') return reply.code(413).send({ error: 'Datei zu groß (max. 15 MB).' });
  if ((err.statusCode ?? 500) < 500) return reply.code(err.statusCode ?? 400).send({ error: err.message });
  app.log.error(err);
  return reply.code(500).send({ error: 'Interner Fehler.' });
});

await seedIfEmpty();
purgeExpiredSessions();
setInterval(purgeExpiredSessions, 6 * 3600 * 1000).unref();

await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`UwU server listening on :${config.port}  (data: ${config.dataDir})`);

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => { void app.close().then(() => { db.close(); process.exit(0); }); });
}
