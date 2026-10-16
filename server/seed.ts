import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { db, q, tx } from './db.js';
import { storeImage } from './media.js';
import { hashPassword } from './security.js';
import { randomBytes } from 'node:crypto';

/**
 * First start only:
 *  - imports the talents that used to be hard-coded in src/data (pictures from ./seed/talents/<folder>)
 *  - creates the first management account
 */
interface SeedTalent {
  folder: string; slug: string; name: string; tagline?: string; category: string; tags: string[];
  socials: Record<string, string>; bio: string; longBio: string[]; stats: { label: string; value: string }[];
  bookingEmail: string; blurImages?: boolean; puzzleAt?: number[];
  /** files in the folder: first one is the profile picture */
  files: string[];
}

const T: SeedTalent[] = [
  {
    folder: 'feuergummi-tobi', slug: 'feuergummi-tobi', name: 'Feuergummi Tobi', category: 'Content Creator · Model',
    tags: ['Streaming', 'Gaming', 'IRL', 'Content', 'Model', 'Fotografie'],
    socials: { twitch: 'https://twitch.tv/', tiktok: 'https://tiktok.com/', instagram: 'https://instagram.com/' },
    bio: 'Feuergummi Tobi ist Content Creator, Model und Performer aus Deutschland. Mit einem unverwechselbaren Look und einer authentischen Energie bringt er vor der Kamera und auf dem Stream eine Präsenz mit, die im Gedächtnis bleibt.',
    longBio: [
      'Feuergummi Tobi begann seine kreative Karriere im Streaming, bevor er sein Spektrum auf Fotografie und visuelles Storytelling ausweitete. Sein Stil verbindet dunkle Ästhetik mit echter Persönlichkeit — kantig, authentisch, unverwechselbar.',
      'Als Model arbeitet Tobi eng mit Fotografen zusammen, um Projekte zu schaffen, die über klassische Portraits hinausgehen. Licht, Komposition und Ausdruck sind sein Handwerk.',
      'Auf seinen Streaming-Kanälen begeistert er seine Community mit Gaming-Content, IRL-Streams und ehrlichen Einblicken in seinen Alltag. Wer Tobi kennt, bleibt.',
    ],
    stats: [{ label: 'Plattformen', value: '3+' }, { label: 'Stil', value: 'Dark Aesthetic' }, { label: 'Sprache', value: 'DE' }],
    bookingEmail: 'tobi@uwuenterprises.de', blurImages: true, puzzleAt: [5],
    files: ['profile.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg'],
  },
  {
    folder: 'angel', slug: 'angel', name: 'Angel', category: 'Cosplayer · Content Creator',
    tags: ['Cosplay', 'Pastell', 'Kawaii', 'Magical Girl', 'Wigs', 'Conventions'], socials: {},
    bio: 'Angel bringt Pastell, Schleifen und eine gehörige Portion Himmelsglanz auf jede Convention. Zwischen Magical-Girl-Looks, Perücken in allen Farben und Flügeln im Schnee ist jedes Outfit ein kleiner eigener Auftritt.',
    longBio: [
      'Angel lebt Cosplay und Kawaii-Mode: von Madoka-inspirierten Pink-Looks mit großen Schleifen über blau-violette Pastell-Outfits bis zu Silberhaar und Hasenohren. Kein Look gleicht dem anderen — und alle sind bis ins Detail durchgestylt.',
      'Auf Conventions ist Angel kaum zu übersehen: Plüschfiguren im Arm, Accessoires, Ketten und Haarschmuck passend zum Charakter. Genau diese Liebe zum Detail macht die Fotos so lebendig.',
      'Für Brands, Events und Shootings bringt Angel eine verspielte, farbenfrohe Ästhetik mit, die Aufmerksamkeit garantiert.',
    ],
    stats: [{ label: 'Fokus', value: 'Cosplay' }, { label: 'Stil', value: 'Pastell & Kawaii' }, { label: 'Looks', value: '5+' }],
    bookingEmail: 'angel@uwuenterprises.de', files: ['profile.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg'],
  },
  {
    folder: 'freiloslp', slug: 'freiloslp', name: 'FreilosLP', tagline: 'Ritter einsamer Herzen', category: 'Cosplayer · Creator',
    tags: ['Cosplay', 'Rüstung', 'Fantasy', 'Pen & Paper', 'Gaming', 'IRL'], socials: {},
    bio: 'FreilosLP ist der "Ritter einsamer Herzen" — in Kettenhemd und Topfhelm, mit Würfeln im Gras und einem Trinkpäckchen in der Hand. Fantasy-Cosplay mit einem Augenzwinkern.',
    longBio: [
      'Wo andere Glitzer tragen, trägt FreilosLP Kettenhemd: goldene Schulterpanzer, Topfhelm und Lederzeug machen aus jedem Convention-Rasen eine Burg. Dazu gehören natürlich auch riesige Würfel für den nächsten Pen-&-Paper-Abend.',
      'Abseits der Rüstung zeigt FreilosLP die unverstellte Seite: Gaming-Setups, Alltagsmomente und jede Menge Humor. Authentisch, nahbar und immer für einen Spruch gut.',
      'Als "Ritter einsamer Herzen" ist FreilosLP die perfekte Mischung aus Fantasy-Epik und Community-Wärme — ideal für Kooperationen im Gaming-, Fantasy- und Rollenspiel-Umfeld.',
    ],
    stats: [{ label: 'Fokus', value: 'Fantasy-Cosplay' }, { label: 'Titel', value: 'Ritter' }, { label: 'Setup', value: 'Gaming & P&P' }],
    bookingEmail: 'freilos@uwuenterprises.de', files: ['profile.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'],
  },
  {
    folder: 'lucy', slug: 'lucy', name: 'Lucy', category: 'Cosplayer · Model',
    tags: ['Cosplay', 'Steins;Gate', 'Wig Styling', 'Shooting', 'Dark Fantasy'], socials: {},
    bio: 'Lucy überzeugt mit detailgetreuen Cosplays und cineastischen Shootings — vom Kurisu-Look aus Steins;Gate bis zu mondbeschienenen Fantasy-Szenen.',
    longBio: [
      'Lucys Kurisu-Cosplay sitzt von der langen Burgunder-Perücke bis zur pinken Krawatte: Labcoat, Lederhose und Strumpfhose, dazu die richtige Pose — man erkennt den Charakter sofort.',
      'Neben Convention-Looks arbeitet Lucy an inszenierten Shootings: Silberhaar vor riesigem violettem Mond, dramatisches Licht, Bildbearbeitung mit Fantasy-Atmosphäre.',
      'Ob Convention, Fotoproduktion oder Brand-Kooperation: Lucy bringt Charakterstärke und Handwerk mit.',
    ],
    stats: [{ label: 'Fokus', value: 'Cosplay' }, { label: 'Signature', value: 'Kurisu' }, { label: 'Shootings', value: 'Fantasy' }],
    bookingEmail: 'lucy@uwuenterprises.de', puzzleAt: [3], files: ['profile.jpg', '01.jpg', '02.jpg', '03.jpg'],
  },
  {
    folder: 'tiff', slug: 'tiff', name: 'Tiff', category: 'Content Creator · Looks-Maxer',
    tags: ['Looks Maxing', 'Beyblade', 'IRL', 'Humor', 'Streetwear'], socials: {},
    bio: 'Leute wenn ihr schon eure Erfolge auf Insta bestaunen lassen wollt, dann bitte so! Das ist looks maxing master class.',
    longBio: [
      'Tiff zeigt, wie man sich in Szene setzt: mit Selbstironie, einem Auge für starke Looks und ganz viel Persönlichkeit — vom Selfie mit Dinosaurier bis zum Siegerfoto vom Beyblade Battle Night.',
      'Authentisch, witzig und immer für einen Auftritt zu haben: perfekt für Kooperationen, bei denen Humor und Style zusammenkommen.',
    ],
    stats: [{ label: 'Skill', value: 'Looks Maxing' }, { label: 'Beyblade', value: 'Platz 3' }, { label: 'Fotos', value: '7' }],
    bookingEmail: 'tiff@uwuenterprises.de', files: ['profile.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'],
  },
];

export async function seedIfEmpty() {
  const hasTalents = (db.prepare('SELECT COUNT(*) AS n FROM talents').get() as { n: number }).n > 0;
  const seeded = db.prepare("SELECT value FROM meta WHERE key = 'seeded'").get();
  if (!hasTalents && !seeded) {
    for (const [order, t] of T.entries()) {
      const dir = path.join(config.seedDir, 'talents', t.folder);
      const buffers: Buffer[] = [];
      try {
        for (const f of t.files) buffers.push(await fs.readFile(path.join(dir, f)));
      } catch {
        console.warn(`[seed] pictures for "${t.slug}" not found in ${dir} — importing without pictures`);
        buffers.length = 0;
      }
      const id = Number(
        db.prepare(
          `INSERT INTO talents (slug, name, tagline, category, bio, long_bio, tags, socials, stats, booking_email, blur_images, published, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?)`,
        ).run(t.slug, t.name, t.tagline ?? '', t.category, t.bio, JSON.stringify(t.longBio), JSON.stringify(t.tags),
          JSON.stringify(t.socials), JSON.stringify(t.stats), t.bookingEmail, t.blurImages ? 1 : 0, order).lastInsertRowid,
      );
      if (buffers.length) {
        const profile = await storeImage(id, buffers[0], { thumb: true });
        const ids: string[] = [];
        for (const b of buffers) ids.push(await storeImage(id, b));
        tx(() => {
          db.prepare('UPDATE talents SET image_id = ? WHERE id = ?').run(profile, id);
          ids.forEach((imgId, i) =>
            db.prepare('INSERT INTO images (id, talent_id, alt, puzzle, sort_order) VALUES (?,?,?,?,?)')
              .run(imgId, id, `${t.name} – Foto ${i + 1}`, t.puzzleAt?.includes(i) ? 1 : 0, i));
        });
      }
      console.log(`[seed] imported talent "${t.name}"`);
    }
    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')").run();
  }

  const users = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (users === 0) {
    const generated = !config.adminPassword;
    const password = config.adminPassword || randomBytes(9).toString('base64url');
    db.prepare("INSERT INTO users (username, password_hash, role, must_change) VALUES (?, ?, 'management', ?)")
      .run(config.adminUsername, await hashPassword(password), generated ? 1 : 0);
    console.log('\n──────────────────────────────────────────────');
    console.log(' First management account created');
    console.log(`   username: ${config.adminUsername}`);
    console.log(generated ? `   password: ${password}   (generated – you must change it at first login)` : '   password: (from ADMIN_PASSWORD)');
    console.log('──────────────────────────────────────────────\n');
  }
  void q;
}
