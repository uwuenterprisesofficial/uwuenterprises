import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db, q, tx } from '../db.js';
import { removeImage, storeImage } from '../media.js';
import { ValidationError, saveContent, toEditable, validateContent } from '../talents.js';

const MAX_GALLERY = 40;

/** Management may edit every talent, a talent only their own page. */
export function authorize(req: FastifyRequest, reply: FastifyReply, talentId: number): boolean {
  const u = req.user;
  if (!u) { reply.code(401).send({ error: 'Bitte melde dich an.' }); return false; }
  if (u.must_change) { reply.code(403).send({ error: 'Bitte ändere zuerst dein Passwort.' }); return false; }
  if (u.role !== 'management' && u.talent_id !== talentId) { reply.code(403).send({ error: 'Keine Berechtigung.' }); return false; }
  if (!q.talentById(talentId)) { reply.code(404).send({ error: 'Talent nicht gefunden.' }); return false; }
  return true;
}

export async function talentRoutes(app: FastifyInstance) {
  type P = { Params: { id: string } };
  const idOf = (req: { params: { id: string } }) => Number(req.params.id);

  app.get<P>('/:id/edit', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  /** texts, tags, socials, stats — and the picture-permission switch */
  app.put<P & { Body: Record<string, unknown> }>('/:id', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    try {
      const c = validateContent(req.body ?? {});
      tx(() => {
        saveContent(id, c);
        if (typeof req.body.blurImages === 'boolean') {
          db.prepare('UPDATE talents SET blur_images = ? WHERE id = ?').run(req.body.blurImages ? 1 : 0, id);
        }
      });
    } catch (e) {
      if (e instanceof ValidationError) return reply.code(400).send({ error: e.message });
      throw e;
    }
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  /** the talent (or management) approves / withdraws permission to show the pictures */
  app.put<P & { Body: { blurImages?: unknown } }>('/:id/consent', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    if (typeof req.body?.blurImages !== 'boolean') return reply.code(400).send({ error: 'blurImages: true/false erwartet.' });
    db.prepare('UPDATE talents SET blur_images = ? WHERE id = ?').run(req.body.blurImages ? 1 : 0, id);
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  /* ── pictures ── */
  app.post<P>('/:id/profile-image', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: 'Keine Datei empfangen.' });
    let imageId: string;
    try { imageId = await storeImage(id, await file.toBuffer(), { thumb: true }); }
    catch { return reply.code(400).send({ error: 'Das ist kein gültiges Bild (JPG, PNG, WebP, HEIC …).' }); }

    const old = q.talentById(id)!.image_id;
    db.prepare("UPDATE talents SET image_id = ?, updated_at = datetime('now') WHERE id = ?").run(imageId, id);
    if (old) await removeImage(id, old);
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  app.delete<P>('/:id/profile-image', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    const old = q.talentById(id)!.image_id;
    db.prepare('UPDATE talents SET image_id = NULL WHERE id = ?').run(id);
    if (old) await removeImage(id, old);
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  app.post<P>('/:id/gallery', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    let count = q.imagesOf(id).length;
    const failed: string[] = [];
    for await (const part of req.files()) {
      if (count >= MAX_GALLERY) { failed.push(`${part.filename}: Galerie ist voll (max. ${MAX_GALLERY}).`); continue; }
      try {
        const imageId = await storeImage(id, await part.toBuffer());
        const order = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM images WHERE talent_id = ?').get(id) as { n: number }).n;
        db.prepare('INSERT INTO images (id, talent_id, alt, puzzle, sort_order) VALUES (?,?,?,?,?)').run(imageId, id, '', 0, order);
        count++;
      } catch {
        failed.push(`${part.filename}: kein gültiges Bild.`);
      }
    }
    return { ...toEditable(q.talentById(id)!, q.imagesOf(id)), failed };
  });

  type ImgP = { Params: { id: string; imgId: string } };

  app.patch<ImgP & { Body: { alt?: unknown; puzzle?: unknown } }>('/:id/gallery/:imgId', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    const img = q.imagesOf(id).find((i) => i.id === req.params.imgId);
    if (!img) return reply.code(404).send({ error: 'Bild nicht gefunden.' });
    const alt = typeof req.body?.alt === 'string' ? req.body.alt.trim().slice(0, 140) : img.alt;
    const puzzle = typeof req.body?.puzzle === 'boolean' ? (req.body.puzzle ? 1 : 0) : img.puzzle;
    db.prepare('UPDATE images SET alt = ?, puzzle = ? WHERE id = ?').run(alt, puzzle, img.id);
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  app.delete<ImgP>('/:id/gallery/:imgId', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    const img = q.imagesOf(id).find((i) => i.id === req.params.imgId);
    if (!img) return reply.code(404).send({ error: 'Bild nicht gefunden.' });
    db.prepare('DELETE FROM images WHERE id = ?').run(img.id);
    await removeImage(id, img.id);
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });

  app.put<P & { Body: { ids?: unknown } }>('/:id/gallery-order', async (req, reply) => {
    const id = idOf(req);
    if (!authorize(req, reply, id)) return;
    const ids = req.body?.ids;
    const own = new Set(q.imagesOf(id).map((i) => i.id));
    if (!Array.isArray(ids) || ids.length !== own.size || !ids.every((x) => typeof x === 'string' && own.has(x))) {
      return reply.code(400).send({ error: 'Ungültige Reihenfolge.' });
    }
    tx(() => ids.forEach((imgId, i) => db.prepare('UPDATE images SET sort_order = ? WHERE id = ?').run(i, imgId)));
    return toEditable(q.talentById(id)!, q.imagesOf(id));
  });
}
