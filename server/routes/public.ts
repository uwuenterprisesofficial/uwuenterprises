import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { q } from '../db.js';
import { FILE_RE, blurName, talentDir } from '../media.js';
import { publishedTalents } from '../talents.js';

export async function publicRoutes(app: FastifyInstance) {
  /** the talents shown on the website */
  app.get('/api/talents', async (_req, reply) => {
    reply.header('Cache-Control', 'no-cache');
    return publishedTalents();
  });

  /**
   * Pictures. If a talent has not approved their pictures yet (`blur_images`), everybody except
   * that talent and management only ever receives the irreversibly blurred twin.
   */
  app.get<{ Params: { talentId: string; file: string } }>('/media/:talentId/:file', async (req, reply) => {
    const id = Number(req.params.talentId);
    const file = req.params.file;
    if (!Number.isInteger(id) || !FILE_RE.test(file)) return reply.code(404).send();

    const t = q.talentById(id);
    if (!t) return reply.code(404).send();

    const u = req.user;
    const privileged = !!u && (u.role === 'management' || u.talent_id === t.id);
    // pictures of unpublished talents are only visible to the talent itself / management
    if (!t.published && !privileged) return reply.code(404).send();

    const protectedPics = !!t.blur_images && !privileged;
    const name = protectedPics ? blurName(file) : file;
    const full = path.join(talentDir(id), name);
    if (!fs.existsSync(full)) return reply.code(404).send();

    reply.header('Cache-Control', privileged || t.blur_images ? 'private, no-cache' : 'public, max-age=3600');
    reply.header('Content-Type', 'image/jpeg');
    return reply.send(fs.createReadStream(full));
  });
}
