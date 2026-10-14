/**
 * src/data/index.ts
 * All static site content. Edit here — no component changes needed.
 */

import type { Talent, Service, Stat, AboutFeature, Studio, Product } from '../types';

/** Builds gallery tiles from /talents/<folder>/ (profile.jpg, 01.jpg, 02.jpg …). */
function gallery(folder: string, name: string, count: number, puzzleAt: number[] = []): Talent['gallery'] {
  return Array.from({ length: count }, (_, i) => ({
    src: `/talents/${folder}/${i === 0 ? 'profile' : String(i).padStart(2, '0')}.jpg`,
    alt: `${name} – Foto ${i + 1}`,
    ...(puzzleAt.includes(i) ? { puzzle: true } : {}),
  }));
}

export const TALENTS: Talent[] = [
  {
    id: 1,
    slug: 'feuergummi-tobi',
    name: 'Feuergummi Tobi',
    blurImages: true, // pictures stay blurred until Tobi gives permission
    category: 'Content Creator · Model',
    tags: ['Streaming', 'Gaming', 'IRL', 'Content', 'Model', 'Fotografie'],
    featured: true,
    socials: {
      twitch:    'https://twitch.tv/',
      tiktok:    'https://tiktok.com/',
      instagram: 'https://instagram.com/',
    },
    image: '/talents/feuergummi-tobi/profile.jpg',
    thumb: '/talents/feuergummi-tobi/thumb.jpg',
    bio: 'Feuergummi Tobi ist Content Creator, Model und Performer aus Deutschland. Mit einem unverwechselbaren Look und einer authentischen Energie bringt er vor der Kamera und auf dem Stream eine Präsenz mit, die im Gedächtnis bleibt.',
    longBio: [
      'Feuergummi Tobi begann seine kreative Karriere im Streaming, bevor er sein Spektrum auf Fotografie und visuelles Storytelling ausweitete. Sein Stil verbindet dunkle Ästhetik mit echter Persönlichkeit — kantig, authentisch, unverwechselbar.',
      'Als Model arbeitet Tobi eng mit Fotografen zusammen, um Projekte zu schaffen, die über klassische Portraits hinausgehen. Licht, Komposition und Ausdruck sind sein Handwerk.',
      'Auf seinen Streaming-Kanälen begeistert er seine Community mit Gaming-Content, IRL-Streams und ehrlichen Einblicken in seinen Alltag. Wer Tobi kennt, bleibt.',
    ],
    stats: [
      { label: 'Plattformen', value: '3+' },
      { label: 'Stil',        value: 'Dark Aesthetic' },
      { label: 'Sprache',     value: 'DE' },
    ],
    bookingEmail: 'tobi@uwuenterprises.de',
    gallery: gallery('feuergummi-tobi', 'Feuergummi Tobi', 6, [5]),
  },
  {
    id: 2,
    slug: 'angel',
    name: 'Angel',
    category: 'Cosplayer · Content Creator',
    tags: ['Cosplay', 'Pastell', 'Kawaii', 'Magical Girl', 'Wigs', 'Conventions'],
    featured: true,
    socials: {},
    image: '/talents/angel/profile.jpg',
    thumb: '/talents/angel/thumb.jpg',
    bio: 'Angel bringt Pastell, Schleifen und eine gehörige Portion Himmelsglanz auf jede Convention. Zwischen Magical-Girl-Looks, Perücken in allen Farben und Flügeln im Schnee ist jedes Outfit ein kleiner eigener Auftritt.',
    longBio: [
      'Angel lebt Cosplay und Kawaii-Mode: von Madoka-inspirierten Pink-Looks mit großen Schleifen über blau-violette Pastell-Outfits bis zu Silberhaar und Hasenohren. Kein Look gleicht dem anderen — und alle sind bis ins Detail durchgestylt.',
      'Auf Conventions ist Angel kaum zu übersehen: Plüschfiguren im Arm, Accessoires, Ketten und Haarschmuck passend zum Charakter. Genau diese Liebe zum Detail macht die Fotos so lebendig.',
      'Für Brands, Events und Shootings bringt Angel eine verspielte, farbenfrohe Ästhetik mit, die Aufmerksamkeit garantiert.',
    ],
    stats: [
      { label: 'Fokus', value: 'Cosplay' },
      { label: 'Stil',  value: 'Pastell & Kawaii' },
      { label: 'Looks', value: '5+' },
    ],
    bookingEmail: 'angel@uwuenterprises.de',
    gallery: gallery('angel', 'Angel', 6),
  },
  {
    id: 3,
    slug: 'freiloslp',
    name: 'FreilosLP',
    tagline: 'Ritter einsamer Herzen',
    category: 'Cosplayer · Creator',
    tags: ['Cosplay', 'Rüstung', 'Fantasy', 'Pen & Paper', 'Gaming', 'IRL'],
    featured: true,
    socials: {},
    image: '/talents/freiloslp/profile.jpg',
    thumb: '/talents/freiloslp/thumb.jpg',
    bio: 'FreilosLP ist der "Ritter einsamer Herzen" — in Kettenhemd und Topfhelm, mit Würfeln im Gras und einem Trinkpäckchen in der Hand. Fantasy-Cosplay mit einem Augenzwinkern.',
    longBio: [
      'Wo andere Glitzer tragen, trägt FreilosLP Kettenhemd: goldene Schulterpanzer, Topfhelm und Lederzeug machen aus jedem Convention-Rasen eine Burg. Dazu gehören natürlich auch riesige Würfel für den nächsten Pen-&-Paper-Abend.',
      'Abseits der Rüstung zeigt FreilosLP die unverstellte Seite: Gaming-Setups, Alltagsmomente und jede Menge Humor. Authentisch, nahbar und immer für einen Spruch gut.',
      'Als "Ritter einsamer Herzen" ist FreilosLP die perfekte Mischung aus Fantasy-Epik und Community-Wärme — ideal für Kooperationen im Gaming-, Fantasy- und Rollenspiel-Umfeld.',
    ],
    stats: [
      { label: 'Fokus', value: 'Fantasy-Cosplay' },
      { label: 'Titel', value: 'Ritter' },
      { label: 'Setup', value: 'Gaming & P&P' },
    ],
    bookingEmail: 'freilos@uwuenterprises.de',
    gallery: gallery('freiloslp', 'FreilosLP', 7),
  },
  {
    id: 4,
    slug: 'lucy',
    name: 'Lucy',
    category: 'Cosplayer · Model',
    tags: ['Cosplay', 'Steins;Gate', 'Wig Styling', 'Shooting', 'Dark Fantasy'],
    featured: true,
    socials: {},
    image: '/talents/lucy/profile.jpg',
    thumb: '/talents/lucy/thumb.jpg',
    bio: 'Lucy überzeugt mit detailgetreuen Cosplays und cineastischen Shootings — vom Kurisu-Look aus Steins;Gate bis zu mondbeschienenen Fantasy-Szenen.',
    longBio: [
      'Lucys Kurisu-Cosplay sitzt von der langen Burgunder-Perücke bis zur pinken Krawatte: Labcoat, Lederhose und Strumpfhose, dazu die richtige Pose — man erkennt den Charakter sofort.',
      'Neben Convention-Looks arbeitet Lucy an inszenierten Shootings: Silberhaar vor riesigem violettem Mond, dramatisches Licht, Bildbearbeitung mit Fantasy-Atmosphäre.',
      'Ob Convention, Fotoproduktion oder Brand-Kooperation: Lucy bringt Charakterstärke und Handwerk mit.',
    ],
    stats: [
      { label: 'Fokus',     value: 'Cosplay' },
      { label: 'Signature', value: 'Kurisu' },
      { label: 'Shootings', value: 'Fantasy' },
    ],
    bookingEmail: 'lucy@uwuenterprises.de',
    gallery: gallery('lucy', 'Lucy', 4, [3]),
  },
  {
    id: 5,
    slug: 'tiff',
    name: 'Tiff',
    category: 'Content Creator · Looks-Maxer',
    tags: ['Looks Maxing', 'Beyblade', 'IRL', 'Humor', 'Streetwear'],
    featured: true,
    socials: {},
    image: '/talents/tiff/profile.jpg',
    thumb: '/talents/tiff/thumb.jpg',
    bio: 'Leute wenn ihr schon eure Erfolge auf Insta bestaunen lassen wollt, dann bitte so! Das ist looks maxing master class.',
    longBio: [
      'Tiff zeigt, wie man sich in Szene setzt: mit Selbstironie, einem Auge für starke Looks und ganz viel Persönlichkeit — vom Selfie mit Dinosaurier bis zum Siegerfoto vom Beyblade Battle Night.',
      'Authentisch, witzig und immer für einen Auftritt zu haben: perfekt für Kooperationen, bei denen Humor und Style zusammenkommen.',
    ],
    stats: [
      { label: 'Skill',   value: 'Looks Maxing' },
      { label: 'Beyblade', value: 'Platz 3' },
      { label: 'Fotos',   value: '7' },
    ],
    bookingEmail: 'tiff@uwuenterprises.de',
    gallery: gallery('tiff', 'Tiff', 7),
  },
];

export const SERVICES: Service[] = [
  { num: '01', icon: '🎮', title: 'Talent Booking',       desc: 'Events, Livestreams, Collabs — buche unsere Talents für dein Projekt oder deine Veranstaltung.' },
  { num: '02', icon: '📱', title: 'Influencer Marketing', desc: 'Authentische Markenkommunikation durch unsere Creators auf TikTok, Twitch, Instagram und mehr.' },
  { num: '03', icon: '🚀', title: 'Talent Development',   desc: 'Wir entdecken und fördern neue Talente — von Setup-Beratung bis zur vollständigen Karriereplanung.' },
  { num: '04', icon: '🤝', title: 'Brand Partnerships',   desc: 'Langfristige Partnerschaften zwischen Brands und Creators, die wirklich zueinander passen.' },
  { num: '05', icon: '🎬', title: 'Content Production',   desc: 'Unterstützung bei der Content-Erstellung, von Konzept bis Schnitt — professionell und kreativ.' },
  { num: '06', icon: '💬', title: 'Community Management', desc: 'Aufbau und Pflege einer loyalen Community rund um unsere Talents auf allen Plattformen.' },
];

export const STATS: Stat[] = [
  { num: '4',    label: 'Aktive Talents' },
  { num: '∞',   label: 'Potenzial'      },
  { num: '100%', label: 'Authentisch'   },
  { num: 'DE',   label: 'Headquarter'  },
];

export const ABOUT_FEATURES: AboutFeature[] = [
  { icon: '🎯', title: 'Talent Management', desc: 'Vollständiges Management von Karriere, Deals und öffentlichem Auftritt.' },
  { icon: '💼', title: 'Brand Deals',       desc: 'Wir verhandeln Kooperationen und Sponsorings mit Premium-Brands.' },
  { icon: '✨', title: 'Content Strategy',  desc: 'Strategische Beratung für nachhaltiges Wachstum auf allen Plattformen.' },
];

export const STUDIO: Studio = {
  headline: 'Das Studio',
  sub: 'Unser hauseigenes Fotostudio steht unseren Talents und ausgewählten externen Projekten zur Verfügung — professionell ausgestattet, atmosphärisch gestaltet.',
  features: [
    { icon: '💡', title: 'Professionelles Licht-Setup', desc: 'Studioblitze, Dauerlicht und RGB-Akzente für jede Ästhetik.' },
    { icon: '🎨', title: 'Verschiedene Hintergründe',   desc: 'Seamless-Papier, Texturen und individuell gestaltbare Sets.' },
    { icon: '📷', title: 'Equipment vor Ort',           desc: 'Hochwertige Kamera- und Objektivauswahl für jeden Anlass.' },
    { icon: '🖥️', title: 'Post-Production',             desc: 'Professionelle Bildbearbeitung und Retusche inklusive.' },
  ],
  bookingNote: 'Studio-Buchungen auf Anfrage — nur für UwU-Talents und ausgewählte Kooperationen.',
};

export const CONTACT_EMAIL = 'contact@uwuenterprises.de' as const;

export const PRODUCTS: Product[] = [
  {
    id: 'moody',
    name: 'Moody',
    kind: 'Web-Plattform',
    tagline: 'Moodboard & Community-Plattform für Cosplay-Shootings',
    desc: 'Moody bringt Cosplayer, Fotografen und Creator zusammen: Ideen sammeln, Looks und Posen im Moodboard planen, Shootings gemeinsam organisieren — und sich mit der Community austauschen.',
    url: 'https://moody.uwuenterprises.de',
    features: [
      { icon: '🎨', title: 'Moodboards',            desc: 'Looks, Posen, Locations und Farbpaletten an einem Ort sammeln.' },
      { icon: '🤝', title: 'Shooting-Kollaboration', desc: 'Shootings gemeinsam planen — Cosplayer und Fotografen auf einer Seite.' },
      { icon: '💬', title: 'Community',              desc: 'Austausch, Inspiration und neue Kontakte in der Szene.' },
    ],
  },
];
