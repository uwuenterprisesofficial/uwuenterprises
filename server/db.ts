import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

fs.mkdirSync(config.dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(config.dataDir, 'uwu.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS talents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  tagline       TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  long_bio      TEXT NOT NULL DEFAULT '[]',
  tags          TEXT NOT NULL DEFAULT '[]',
  socials       TEXT NOT NULL DEFAULT '{}',
  stats         TEXT NOT NULL DEFAULT '[]',
  booking_email TEXT NOT NULL DEFAULT '',
  image_id      TEXT,
  blur_images   INTEGER NOT NULL DEFAULT 1,
  published     INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS images (
  id         TEXT PRIMARY KEY,
  talent_id  INTEGER NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  alt        TEXT NOT NULL DEFAULT '',
  puzzle     INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('management', 'talent')),
  active        INTEGER NOT NULL DEFAULT 1,
  talent_id     INTEGER REFERENCES talents(id) ON DELETE CASCADE,
  must_change   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

// migration: private contact e-mail per account (never shown publicly)
if (!(db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).some((c) => c.name === 'email')) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''");
}

/** Runs `fn` in a transaction (rolls back on throw). */
export function tx<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/* ── row types ── */
export interface TalentRow {
  id: number; slug: string; name: string; tagline: string; category: string; bio: string;
  long_bio: string; tags: string; socials: string; stats: string; booking_email: string;
  image_id: string | null; blur_images: number; published: number; sort_order: number; updated_at: string;
}
export interface ImageRow { id: string; talent_id: number; alt: string; puzzle: number; sort_order: number }
export interface UserRow {
  id: number; username: string; password_hash: string; role: 'management' | 'talent';
  active: number; talent_id: number | null; must_change: number; created_at: string; email: string;
}

export const q = {
  talentById: (id: number) => db.prepare('SELECT * FROM talents WHERE id = ?').get(id) as TalentRow | undefined,
  talentBySlug: (slug: string) => db.prepare('SELECT * FROM talents WHERE slug = ?').get(slug) as TalentRow | undefined,
  allTalents: () => db.prepare('SELECT * FROM talents ORDER BY sort_order, id').all() as unknown as TalentRow[],
  imagesOf: (talentId: number) =>
    db.prepare('SELECT * FROM images WHERE talent_id = ? ORDER BY sort_order, rowid').all(talentId) as unknown as ImageRow[],
  userByName: (name: string) => db.prepare('SELECT * FROM users WHERE username = ?').get(name) as UserRow | undefined,
  userById: (id: number) => db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined,
  userOfTalent: (talentId: number) => db.prepare('SELECT * FROM users WHERE talent_id = ?').get(talentId) as UserRow | undefined,
};
