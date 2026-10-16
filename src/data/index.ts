/**
 * src/data/index.ts
 * All static site content. Edit here — no component changes needed.
 */

import type { Service, Stat, AboutFeature, Studio, Product } from '../types';

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
