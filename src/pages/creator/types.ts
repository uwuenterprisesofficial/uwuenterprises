import type { Talent } from '../../types';

/** What /api/talents/:id/edit returns (public fields + admin flags). */
export interface EditableTalent extends Omit<Talent, 'gallery' | 'featured'> {
  published: boolean;
  sortOrder: number;
  account: { username: string; email: string; active: boolean; mustChange: boolean } | null;
  gallery: { id: string; src: string; thumb: string; alt: string; puzzle: boolean }[];
}
