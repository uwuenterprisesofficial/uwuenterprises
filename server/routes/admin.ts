import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db, q, tx } from '../db.js';
import { removeTalentFiles } from '../media.js';
import { destroyUserSessions, hashPassword, passwordProblem } from '../security.js';
import { ValidationError, slugify, toEditable, validateOptionalEmail, validateSlug, validateUsername } from '../talents.js';

function requireManagement(req: FastifyRequest, reply: FastifyReply): boolean {
  if (!req.user) { reply.code(401).send({ error: 'Bitte melde dich an.' }); return false; }
  if (req.user.role !== 'management') { reply.code(403).send({ error: 'Nur für das Management.' }); return false; }
  if (req.user.must_change) { reply.code(403).send({ error: 'Bitte ändere zuerst dein Passwort.' }); return false; }
  return true;
}

const all = () => q.allTalents().map((t) => toEditable(t, q.imagesOf(t.id)));

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => { if (!requireManagement(req, reply)) return reply; });

  app.get('/talents', async () => all());

  /** new talent + their login (they must choose their own password at first login) */
  app.post<{ Body: { name?: unknown; slug?: unknown; username?: unknown; password?: unknown; category?: unknown; email?: unknown } }>('/talents', async (req, reply) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!name || name.length > 60) throw new ValidationError('Name: 1–60 Zeichen.');
      const slug = validateSlug(req.body?.slug ?? slugify(name));
      const username = validateUsername(req.body?.username);
      const problem = passwordProblem(req.body?.password);
      if (problem) throw new ValidationError(problem);
      const category = typeof req.body?.category === 'string' ? req.body.category.trim().slice(0, 80) : '';
      const email = validateOptionalEmail(req.body?.email);

      if (q.talentBySlug(slug)) throw new ValidationError('Dieser Slug ist schon vergeben.');
      if (q.userByName(username)) throw new ValidationError('Dieser Benutzername ist schon vergeben.');

      const hash = await hashPassword(req.body.password as string);
      const id = tx(() => {
        const order = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM talents').get() as { n: number }).n;
        const tid = Number(db.prepare('INSERT INTO talents (slug, name, category, sort_order) VALUES (?,?,?,?)').run(slug, name, category, order).lastInsertRowid);
        db.prepare("INSERT INTO users (username, password_hash, role, talent_id, must_change, email) VALUES (?, ?, 'talent', ?, 1, ?)").run(username, hash, tid, email);
        return tid;
      });
      return reply.code(201).send(toEditable(q.talentById(id)!, []));
    } catch (e) {
      if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });

  /** visibility, slug, account lock, picture-blur */
  app.put<{ Params: { id: string }; Body: { slug?: unknown; published?: unknown; accountActive?: unknown; blurImages?: unknown } }>(
    '/talents/:id/settings',
    async (req, reply) => {
      const id = Number(req.params.id);
      const t = q.talentById(id);
      if (!t) return reply.code(404).send({ error: 'Talent nicht gefunden.' });
      try {
        const b = req.body ?? {};
        tx(() => {
          if (b.slug !== undefined) {
            const slug = validateSlug(b.slug);
            const clash = q.talentBySlug(slug);
            if (clash && clash.id !== id) throw new ValidationError('Dieser Slug ist schon vergeben.');
            db.prepare('UPDATE talents SET slug = ? WHERE id = ?').run(slug, id);
          }
          if (typeof b.published === 'boolean') db.prepare('UPDATE talents SET published = ? WHERE id = ?').run(b.published ? 1 : 0, id);
          if (typeof b.blurImages === 'boolean') db.prepare('UPDATE talents SET blur_images = ? WHERE id = ?').run(b.blurImages ? 1 : 0, id);
          if (typeof b.accountActive === 'boolean') {
            const u = q.userOfTalent(id);
            if (u) {
              db.prepare('UPDATE users SET active = ? WHERE id = ?').run(b.accountActive ? 1 : 0, u.id);
              if (!b.accountActive) destroyUserSessions(u.id);
            }
          }
        });
      } catch (e) {
        if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
        throw e;
      }
      return toEditable(q.talentById(id)!, q.imagesOf(id));
    },
  );

  /** private contact address of the talent's account (used to mail the access data) */
  app.put<{ Params: { id: string }; Body: { email?: unknown } }>('/talents/:id/account-email', async (req, reply) => {
    const id = Number(req.params.id);
    const u = q.userOfTalent(id);
    if (!u) return reply.code(404).send({ error: 'Kein Account für dieses Talent.' });
    try {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(validateOptionalEmail(req.body?.email), u.id);
    } catch (e) {
      if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
      throw e;
    }
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  /** login for a talent that has none yet (e.g. the talents imported from the old site) */
  app.post<{ Params: { id: string }; Body: { username?: unknown; password?: unknown; email?: unknown } }>('/talents/:id/account', async (req, reply) => {
    const id = Number(req.params.id);
    if (!q.talentById(id)) return reply.code(404).send({ error: 'Talent nicht gefunden.' });
    try {
      if (q.userOfTalent(id)) throw new ValidationError('Dieses Talent hat schon einen Account.');
      const username = validateUsername(req.body?.username);
      const problem = passwordProblem(req.body?.password);
      if (problem) throw new ValidationError(problem);
      if (q.userByName(username)) throw new ValidationError('Dieser Benutzername ist schon vergeben.');
      const email = validateOptionalEmail(req.body?.email);
      db.prepare("INSERT INTO users (username, password_hash, role, talent_id, must_change, email) VALUES (?, ?, 'talent', ?, 1, ?)")
        .run(username, await hashPassword(req.body.password as string), id, email);
    } catch (e) {
      if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
      throw e;
    }
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  app.post<{ Params: { id: string }; Body: { password?: unknown } }>('/talents/:id/reset-password', async (req, reply) => {
    const id = Number(req.params.id);
    const u = q.userOfTalent(id);
    if (!u) return reply.code(404).send({ error: 'Kein Account für dieses Talent.' });
    const problem = passwordProblem(req.body?.password);
    if (problem) return reply.code(400).send({ error: problem });
    db.prepare('UPDATE users SET password_hash = ?, must_change = 1 WHERE id = ?').run(await hashPassword(req.body.password as string), u.id);
    destroyUserSessions(u.id);
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>('/talents/:id', async (req, reply) => {
    const id = Number(req.params.id);
    if (!q.talentById(id)) return reply.code(404).send({ error: 'Talent nicht gefunden.' });
    db.prepare('DELETE FROM talents WHERE id = ?').run(id); // cascades to images + user + sessions
    await removeTalentFiles(id);
    return { ok: true };
  });

  app.put<{ Body: { ids?: unknown } }>('/order', async (req, reply) => {
    const ids = req.body?.ids;
    const own = new Set(q.allTalents().map((t) => t.id));
    if (!Array.isArray(ids) || ids.length !== own.size || !ids.every((x) => typeof x === 'number' && own.has(x))) {
      return reply.code(400).send({ error: 'Ungültige Reihenfolge.' });
    }
    tx(() => ids.forEach((tid, i) => db.prepare('UPDATE talents SET sort_order = ? WHERE id = ?').run(i, tid)));
    return all();
  });

  /* ── management accounts ── */
  const managers = () =>
    (db.prepare("SELECT id, username, active, created_at FROM users WHERE role = 'management' ORDER BY id").all() as unknown as
      { id: number; username: string; active: number; created_at: string }[])
      .map((m) => ({ id: m.id, username: m.username, active: !!m.active, createdAt: m.created_at }));

  app.get('/managers', async () => managers());

  app.post<{ Body: { username?: unknown; password?: unknown } }>('/managers', async (req, reply) => {
    try {
      const username = validateUsername(req.body?.username);
      const problem = passwordProblem(req.body?.password);
      if (problem) throw new ValidationError(problem);
      if (q.userByName(username)) throw new ValidationError('Dieser Benutzername ist schon vergeben.');
      db.prepare("INSERT INTO users (username, password_hash, role, must_change) VALUES (?, ?, 'management', 1)")
        .run(username, await hashPassword(req.body.password as string));
      return reply.code(201).send(managers());
    } catch (e) {
      if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });

  app.patch<{ Params: { id: string }; Body: { active?: unknown } }>('/managers/:id', async (req, reply) => {
    const id = Number(req.params.id);
    const u = q.userById(id);
    if (!u || u.role !== 'management') return reply.code(404).send({ error: 'Account nicht gefunden.' });
    if (id === req.user!.id) return reply.code(400).send({ error: 'Du kannst deinen eigenen Account nicht sperren.' });
    if (typeof req.body?.active !== 'boolean') return reply.code(400).send({ error: 'active: true/false erwartet.' });
    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(req.body.active ? 1 : 0, id);
    if (!req.body.active) destroyUserSessions(id);
    return managers();
  });
}
