import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs/promises'
import sharp from 'sharp'
import { TALENTS } from './src/data'

/**
 * Talents with `blurImages: true` (src/data/index.ts) have not approved their
 * pictures yet. After the production build, every file in their image folders
 * is replaced by a heavily downscaled + blurred version, so the real photos are
 * never published — not even via "open image in new tab" or the network tab.
 */
function blurPrivatePictures(): Plugin {
  return {
    name: 'blur-private-pictures',
    apply: 'build',
    async closeBundle() {
      const dist = path.resolve(process.cwd(), 'dist')
      const folders = new Set<string>()
      for (const t of TALENTS) {
        if (!t.blurImages) continue
        const srcs = [t.image, t.thumb, ...t.gallery.map((g) => g.src)].filter((s): s is string => !!s)
        srcs.forEach((s) => folders.add(path.posix.dirname(s)))
      }
      for (const folder of folders) {
        const dir = path.join(dist, ...folder.split('/').filter(Boolean))
        let files: string[] = []
        try { files = await fs.readdir(dir) } catch { continue }
        for (const f of files.filter((n) => /\.(jpe?g|png|webp)$/i.test(n))) {
          const file = path.join(dir, f)
          const buf = await fs.readFile(file)
          const { width = 600, height = 800 } = await sharp(buf).metadata()
          const w = Math.min(width, 600)
          const h = Math.round((w * height) / width)
          // stage 1: throw the detail away for good (only colour blobs survive)
          const tiny = await sharp(buf).resize({ width: 10 }).toBuffer()
          // stage 2: scale back up smoothly (sharp only applies the last resize per pipeline)
          const out = await sharp(tiny)
            .resize({ width: w, height: h, fit: 'fill', kernel: 'cubic' })
            .blur(14)
            .jpeg({ quality: 70 })
            .toBuffer()
          await fs.writeFile(file, out)
        }
        console.log(`[blur-private-pictures] blurred ${files.length} file(s) in ${folder}`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), blurPrivatePictures()],
  resolve: {
    alias: { '@': '/src' },
  },
})
