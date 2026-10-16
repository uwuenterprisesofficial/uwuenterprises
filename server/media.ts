import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { config } from './config.js';

export const uploadsDir = path.join(config.dataDir, 'uploads');
export const talentDir = (talentId: number) => path.join(uploadsDir, String(talentId));
export const newImageId = () => randomBytes(8).toString('hex');

/** `<id>.jpg`, `<id>.thumb.jpg` and the irreversible `.blur.jpg` twins. */
export const FILE_RE = /^[a-f0-9]{16}(\.thumb)?(\.blur)?\.jpg$/;

export function blurName(file: string) {
  return file.replace(/\.jpg$/, '.blur.jpg').replace(/\.blur\.blur\.jpg$/, '.blur.jpg');
}

/** Irreversible blur: shrink to 10px (only colour blobs survive), scale back up, blur. */
async function blurred(buf: Buffer, w: number, h: number): Promise<Buffer> {
  const tiny = await sharp(buf).resize({ width: 10 }).toBuffer();
  return sharp(tiny).resize({ width: w, height: h, fit: 'fill', kernel: 'cubic' }).blur(14).jpeg({ quality: 70 }).toBuffer();
}

/**
 * Turns any uploaded picture into web-sized JPEGs (+ blurred twins).
 * Throws if the data is not a decodable image.
 */
export async function storeImage(talentId: number, input: Buffer, opts: { thumb?: boolean } = {}): Promise<string> {
  const id = newImageId();
  const dir = talentDir(talentId);
  await fs.mkdir(dir, { recursive: true });

  const base = sharp(input, { failOn: 'error', limitInputPixels: 80_000_000 }).rotate();
  const full = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, progressive: true }).toBuffer();
  const meta = await sharp(full).metadata();
  const w = Math.min(meta.width ?? 600, 600);
  const h = Math.round((w * (meta.height ?? 800)) / (meta.width ?? 600));

  await fs.writeFile(path.join(dir, `${id}.jpg`), full);
  await fs.writeFile(path.join(dir, `${id}.blur.jpg`), await blurred(full, w, h));

  if (opts.thumb) {
    const thumb = await sharp(full).resize({ width: 600, height: 800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 78, progressive: true }).toBuffer();
    const tm = await sharp(thumb).metadata();
    await fs.writeFile(path.join(dir, `${id}.thumb.jpg`), thumb);
    await fs.writeFile(path.join(dir, `${id}.thumb.blur.jpg`), await blurred(thumb, tm.width ?? 300, tm.height ?? 400));
  }
  return id;
}

export async function removeImage(talentId: number, id: string) {
  const dir = talentDir(talentId);
  await Promise.all(
    ['.jpg', '.blur.jpg', '.thumb.jpg', '.thumb.blur.jpg'].map((s) => fs.rm(path.join(dir, `${id}${s}`), { force: true })),
  );
}

export async function removeTalentFiles(talentId: number) {
  await fs.rm(talentDir(talentId), { recursive: true, force: true });
}
