import { createStore, useStore } from './store';
import type { Talent } from '../types';

export const talentsStore = createStore<{ loaded: boolean; list: Talent[] }>({ loaded: false, list: [] });

/** Loads the public talent list (only published talents come back from the API). */
export async function loadTalents() {
  try {
    const res = await fetch('/api/talents');
    const list = res.ok ? ((await res.json()) as Talent[]) : [];
    talentsStore.set({ loaded: true, list });
  } catch {
    talentsStore.set({ loaded: true, list: [] });
  }
}

export const useTalents = () => useStore(talentsStore);
