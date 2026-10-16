import { db, q, type ImageRow, type TalentRow } from './db.js';

export const SOCIAL_KEYS = ['twitch', 'tiktok', 'instagram', 'youtube', 'twitter'] as const;

const parse = <T>(s: string, fallback: T): T => {
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

const media = (talentId: number, file: string) => `/media/${talentId}/${file}`;

export interface TalentJson {
  id: number; slug: string; name: string; tagline?: string; category: string; tags: string[];
  featured: boolean; socials: Record<string, string>; image: string | null; thumb?: string;
  bio: string; longBio: string[]; stats: { label: string; value: string }[]; bookingEmail: string;
  gallery: { src: string; alt: string; puzzle?: boolean }[]; blurImages: boolean;
}

/** Shape the website consumes (see src/types). */
export function toPublic(t: TalentRow, images: ImageRow[]): TalentJson {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    ...(t.tagline ? { tagline: t.tagline } : {}),
    category: t.category,
    tags: parse(t.tags, []),
    featured: true,
    socials: parse(t.socials, {}),
    image: t.image_id ? media(t.id, `${t.image_id}.jpg`) : null,
    ...(t.image_id ? { thumb: media(t.id, `${t.image_id}.thumb.jpg`) } : {}),
    bio: t.bio,
    longBio: parse(t.long_bio, []),
    stats: parse(t.stats, []),
    bookingEmail: t.booking_email,
    gallery: images.map((i) => ({ src: media(t.id, `${i.id}.jpg`), alt: i.alt || `${t.name} – Foto`, ...(i.puzzle ? { puzzle: true } : {}) })),
    blurImages: !!t.blur_images,
  };
}

/** Everything the creator space needs (adds ids, flags and the real file names). */
export function toEditable(t: TalentRow, images: ImageRow[]) {
  const user = q.userOfTalent(t.id);
  return {
    ...toPublic(t, images),
    published: !!t.published,
    sortOrder: t.sort_order,
    account: user ? { username: user.username, email: user.email, active: !!user.active, mustChange: !!user.must_change } : null,
    gallery: images.map((i) => ({
      id: i.id, src: media(t.id, `${i.id}.jpg`), thumb: media(t.id, `${i.id}.jpg`), alt: i.alt, puzzle: !!i.puzzle,
    })),
  };
}

export function publishedTalents(): TalentJson[] {
  return q.allTalents().filter((t) => t.published).map((t) => toPublic(t, q.imagesOf(t.id)));
}

/* ── validation (manual, strict, never trusts the client) ── */
export class ValidationError extends Error {}

const str = (v: unknown, field: string, max: number, required = false): string => {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw new ValidationError(`${field}: Text erwartet.`);
  const s = v.trim();
  if (required && !s) throw new ValidationError(`${field} darf nicht leer sein.`);
  if (s.length > max) throw new ValidationError(`${field} ist zu lang (max. ${max} Zeichen).`);
  return s;
};

const list = (v: unknown, field: string, maxItems: number): unknown[] => {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new ValidationError(`${field}: Liste erwartet.`);
  if (v.length > maxItems) throw new ValidationError(`${field}: zu viele Einträge (max. ${maxItems}).`);
  return v;
};

export function validateSlug(v: unknown): string {
  const s = str(v, 'Slug', 40, true).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) || s.length < 2) throw new ValidationError('Slug: nur a-z, 0-9 und Bindestriche (mind. 2 Zeichen).');
  if (['new', 'edit', 'admin'].includes(s)) throw new ValidationError('Dieser Slug ist reserviert.');
  return s;
}

/** Optional private contact address of an account. */
export function validateOptionalEmail(v: unknown): string {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (!s) return '';
  if (s.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new ValidationError('E-Mail-Adresse ist ungültig.');
  return s;
}

export function slugify(name: string): string {
  const s = name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || 'talent';
}

export function validateUsername(v: unknown): string {
  const s = str(v, 'Benutzername', 32, true).toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(s)) throw new ValidationError('Benutzername: 3–32 Zeichen (a-z, 0-9, . _ -).');
  return s;
}

/** Content a talent may edit about their own page. */
export function validateContent(b: Record<string, unknown>) {
  const tags = list(b.tags, 'Tags', 12).map((t) => str(t, 'Tag', 30)).filter(Boolean);
  const longBio = list(b.longBio, 'Absätze', 8).map((p) => str(p, 'Absatz', 2000)).filter(Boolean);
  const stats = list(b.stats, 'Stats', 6)
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { label: str(o.label, 'Stat-Name', 30), value: str(o.value, 'Stat-Wert', 40) };
    })
    .filter((s) => s.label && s.value);

  const socialsIn = (b.socials ?? {}) as Record<string, unknown>;
  if (typeof socialsIn !== 'object' || Array.isArray(socialsIn)) throw new ValidationError('Socials: Objekt erwartet.');
  const socials: Record<string, string> = {};
  for (const k of SOCIAL_KEYS) {
    const v = str(socialsIn[k], `Link ${k}`, 200);
    if (!v) continue;
    let u: URL;
    try { u = new URL(v); } catch { throw new ValidationError(`Link ${k}: ungültige URL.`); }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new ValidationError(`Link ${k}: nur http(s)-Links.`);
    socials[k] = u.toString();
  }

  const email = str(b.bookingEmail, 'Booking-E-Mail', 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Booking-E-Mail: ungültige Adresse.');

  return {
    name: str(b.name, 'Name', 60, true),
    tagline: str(b.tagline, 'Untertitel', 80),
    category: str(b.category, 'Kategorie', 80),
    bio: str(b.bio, 'Kurzbeschreibung', 600),
    longBio, tags, stats, socials, email,
  };
}

export function saveContent(id: number, c: ReturnType<typeof validateContent>) {
  db.prepare(
    `UPDATE talents SET name=?, tagline=?, category=?, bio=?, long_bio=?, tags=?, socials=?, stats=?, booking_email=?, updated_at=datetime('now') WHERE id=?`,
  ).run(c.name, c.tagline, c.category, c.bio, JSON.stringify(c.longBio), JSON.stringify(c.tags), JSON.stringify(c.socials), JSON.stringify(c.stats), c.email, id);
}
