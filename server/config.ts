import path from 'node:path';

const env = process.env;

export const config = {
  port: Number(env.SERVER_PORT ?? 4010),
  /** sqlite database + uploaded pictures live here (mount a volume in production) */
  dataDir: path.resolve(env.DATA_DIR ?? './data'),
  /** built frontend (vite build output) */
  staticDir: path.resolve(env.STATIC_DIR ?? './dist'),
  /** initial pictures for the first start (see seed.ts) */
  seedDir: path.resolve(env.SEED_DIR ?? './seed'),
  /** first management account — only used while the user table is empty */
  adminUsername: (env.ADMIN_USERNAME ?? 'management').toLowerCase(),
  adminPassword: env.ADMIN_PASSWORD ?? '',
  sessionDays: 14,
  isProd: env.NODE_ENV === 'production',
} as const;

export const COOKIE = 'uwu_session';
