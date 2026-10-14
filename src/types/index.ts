// src/types/index.ts
// Central type definitions shared across the app.

export interface GalleryItem {
  src: string;
  alt: string;
  /** If true, image is blurred until user solves the puzzle */
  puzzle?: boolean;
}

export interface TalentStat {
  label: string;
  value: string;
}

export interface TalentSocials {
  twitch?: string;
  tiktok?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

export interface Talent {
  id: number;
  slug: string;
  name: string;
  /** Optional epithet shown on the profile page */
  tagline?: string;
  /**
   * Creator has NOT approved their pictures yet: every picture is shown blurred
   * on the site, and the production build ships blurred files only.
   * Remove / set to false once permission is given.
   */
  blurImages?: boolean;
  category: string;
  tags: string[];
  featured: boolean;
  socials: TalentSocials;
  image: string | null;
  /** Small (~600px) version for cards and 3D textures */
  thumb?: string;
  bio: string;
  longBio: string[];
  stats: TalentStat[];
  bookingEmail: string;
  gallery: GalleryItem[];
}

export interface Service {
  num: string;
  icon: string;
  title: string;
  desc: string;
}

export interface Stat {
  num: string;
  label: string;
}

export interface AboutFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface StudioFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface Studio {
  headline: string;
  sub: string;
  features: StudioFeature[];
  bookingNote: string;
}

export interface Product {
  id: string;
  name: string;
  /** e.g. "Web-Plattform" */
  kind: string;
  tagline: string;
  desc: string;
  url: string;
  features: { icon: string; title: string; desc: string }[];
}
