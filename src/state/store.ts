import { useSyncExternalStore } from 'react';

/** Minimal external store so the 3D world and React UI can share state. */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => { listeners.delete(l); };
    },
  };
}

export type Store<T> = ReturnType<typeof createStore<T>>;

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Outfit = cosplay "skin" for the mascot + accent colour of the whole page. */
export interface Outfit {
  id: string;
  name: string;
  hair: number;
  ears: number;
  dress: number;
  bow: number;
  css: string;
}

export const OUTFITS: Outfit[] = [
  { id: 'neko',    name: 'Neko Pink',    hair: 0xffb3d9, ears: 0xffb3d9, dress: 0xffffff, bow: 0xff5fa2, css: '#ff6fae' },
  { id: 'magic',   name: 'Magical Boy',  hair: 0x9ad7ff, ears: 0x9ad7ff, dress: 0x4aa8ff, bow: 0x6cc4ff, css: '#6cc4ff' },
  { id: 'maid',    name: 'Maid Lilac',   hair: 0xd7b5ff, ears: 0x4a2f6b, dress: 0x3b2456, bow: 0xffffff, css: '#c08cff' },
  { id: 'kitsune', name: 'Mint Kitsune', hair: 0xfff7ea, ears: 0xfff7ea, dress: 0x8ff0d4, bow: 0xff6b6b, css: '#6ff0c8' },
  { id: 'angel',   name: 'Pastel Angel', hair: 0xfff1c9, ears: 0xfff1c9, dress: 0xcfe9ff, bow: 0xffa6d4, css: '#ffd35e' },
  { id: 'knight',  name: 'Herzensritter', hair: 0x8a5a44, ears: 0x8a5a44, dress: 0x3f7a58, bow: 0xffcf4d, css: '#f5a742' },
];

export const outfitStore = createStore<number>(0);
export const serviceStore = createStore<number>(0);
/** Label of the 3D object currently under the pointer (or null). */
export const hoverStore = createStore<string | null>(null);
/** Tiny toast announcements ("Outfit: Neko Pink"). */
export const toastStore = createStore<{ id: number; text: string } | null>(null);

let toastId = 0;
let toastTimer: number | undefined;
export function toast(text: string) {
  toastStore.set({ id: ++toastId, text });
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastStore.set(null), 2200);
}

export function setOutfit(i: number) {
  const n = ((i % OUTFITS.length) + OUTFITS.length) % OUTFITS.length;
  outfitStore.set(n);
  document.documentElement.style.setProperty('--accent', OUTFITS[n].css);
  toast(`Outfit · ${OUTFITS[n].name}`);
}

/** Camera flash (photo studio). */
const flashListeners = new Set<() => void>();
export const onFlash = (l: () => void) => { flashListeners.add(l); return () => { flashListeners.delete(l); }; };
export const fireFlash = () => flashListeners.forEach((l) => l());

/** Continuous 3D scene index (0 = hero … 5 = contact) the camera flies to. */
export const sceneStore = createStore<number>(0);
/** Section the user is currently in (for nav highlighting). */
export const activeSceneStore = createStore<number>(0);
