import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from './config.js';
import { db, q, type UserRow } from './db.js';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const MIN_PASSWORD = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ── sessions: the cookie holds a random token, the database only its hash ── */
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function createSession(userId: number): { token: string; maxAge: number } {
  const token = randomBytes(32).toString('base64url');
  const maxAge = config.sessionDays * 24 * 3600;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), userId, Math.floor(Date.now() / 1000) + maxAge);
  return { token, maxAge };
}

/** Returns the (active) user behind a session token, or undefined. */
export function userForToken(token: string | undefined): UserRow | undefined {
  if (!token) return undefined;
  const row = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
    .get(sha256(token)) as { user_id: number; expires_at: number } | undefined;
  if (!row) return undefined;
  if (row.expires_at < Date.now() / 1000) {
    destroySession(token);
    return undefined;
  }
  const user = q.userById(row.user_id);
  return user && user.active ? user : undefined;
}

export function destroySession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function destroyUserSessions(userId: number, exceptToken?: string) {
  if (exceptToken) db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, sha256(exceptToken));
  else db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function purgeExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Math.floor(Date.now() / 1000));
}

/* ── tiny in-memory login throttle (per ip and per username) ── */
const attempts = new Map<string, { n: number; reset: number }>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 8;

export function throttled(key: string): boolean {
  const a = attempts.get(key);
  if (!a || a.reset < Date.now()) return false;
  return a.n >= LIMIT;
}
export function recordFailure(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.reset < now) attempts.set(key, { n: 1, reset: now + WINDOW });
  else a.n++;
}
export function clearFailures(key: string) { attempts.delete(key); }

/** Password checks shared by login-less flows (create / reset / change). */
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) return `Das Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.`;
  if (pw.length > 200) return 'Das Passwort ist zu lang.';
  return null;
}
