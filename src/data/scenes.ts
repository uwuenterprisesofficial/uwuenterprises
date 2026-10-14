export interface SceneDef {
  id: string;
  label: string;
  kana: string;
  emoji: string;
}

/** Order matters: index = station index in the 3D world. */
export const SCENES: SceneDef[] = [
  { id: 'top',      label: 'Start',    kana: 'はじまり', emoji: '🐱' },
  { id: 'talents',  label: 'Talents',  kana: 'ステージ', emoji: '⭐' },
  { id: 'about',    label: 'Über uns', kana: '衣装部屋', emoji: '👗' },
  { id: 'studio',   label: 'Studio',   kana: '撮影所',   emoji: '📸' },
  { id: 'services', label: 'Services', kana: 'ガチャ',   emoji: '🎀' },
  { id: 'tools',    label: 'Tools',    kana: '道具',     emoji: '🧰' },
  { id: 'contact',  label: 'Kontakt',  kana: 'お手紙',   emoji: '💌' },
];
