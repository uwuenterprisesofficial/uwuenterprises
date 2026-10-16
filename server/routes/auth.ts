import type { FastifyInstance, FastifyRequest } from 'fastify';
import { COOKIE } from '../config.js';
import { db, q, type UserRow } from '../db.js';
import {
  clearFailures, createSession, destroySession, destroyUserSessions, hashPassword,
  passwordProblem, recordFailure, throttled, verifyPassword,
} from '../security.js';

export const publicUser = (u: UserRow) => ({
  id: u.id, username: u.username, role: u.role, talentId: u.talent_id, mustChange: !!u.must_change,
});

const cookieOpts = (req: FastifyRequest, maxAge?: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: req.protocol === 'https',
  ...(maxAge ? { maxAge } : {}),
});

// a real hash so unknown usernames cost the same time as wrong passwords
const DUMMY = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: { username?: unknown; password?: unknown } }>('/login', async (req, reply) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const ipKey = `ip:${req.ip}`, userKey = `u:${username}`;
    if (throttled(ipKey) || throttled(userKey)) {
      return reply.code(429).send({ error: 'Zu viele Versuche. Bitte warte ein paar Minuten.' });
    }

    const user = username ? q.userByName(username) : undefined;
    const ok = await verifyPassword(password.slice(0, 200), user?.password_hash ?? DUMMY);
    if (!user || !ok || !user.active) {
      recordFailure(ipKey); recordFailure(userKey);
      return reply.code(401).send({ error: 'Benutzername oder Passwort ist falsch (oder der Account ist gesperrt).' });
    }
    clearFailures(userKey);

    const { token, maxAge } = createSession(user.id);
    reply.setCookie(COOKIE, token, cookieOpts(req, maxAge));
    return { user: publicUser(user) };
  });

  app.post('/logout', async (req, reply) => {
    if (req.sessionToken) destroySession(req.sessionToken);
    reply.clearCookie(COOKIE, cookieOpts(req));
    return { ok: true };
  });

  app.get('/me', async (req) => ({ user: req.user ? publicUser(req.user) : null }));

  app.post<{ Body: { current?: unknown; next?: unknown } }>('/password', async (req, reply) => {
    const u = req.user;
    if (!u) return reply.code(401).send({ error: 'Nicht angemeldet.' });
    const { current, next } = req.body ?? {};
    if (typeof current !== 'string' || !(await verifyPassword(current, u.password_hash))) {
      return reply.code(400).send({ error: 'Das aktuelle Passwort ist falsch.' });
    }
    const problem = passwordProblem(next);
    if (problem) return reply.code(400).send({ error: problem });
    if (next === current) return reply.code(400).send({ error: 'Das neue Passwort muss anders sein.' });

    db.prepare('UPDATE users SET password_hash = ?, must_change = 0 WHERE id = ?').run(await hashPassword(next as string), u.id);
    destroyUserSessions(u.id, req.sessionToken); // log out all other devices
    return { ok: true };
  });
}
