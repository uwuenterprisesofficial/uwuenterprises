import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SectionTag } from './SectionHeader';
import PuzzleGame from './PuzzleGame';
import Pic from './Pic';
import type { GalleryItem } from '../types';

interface TalentGalleryProps {
  gallery: GalleryItem[];
  talentName: string;
  /** pictures not approved yet → blurred */
  blur?: boolean;
}

const STORAGE_KEY = 'uwu-solved-puzzles';

function loadSolved(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/**
 * Masonry gallery: every photo keeps its own aspect ratio (nothing is cropped).
 * Locked photos are blurred until their puzzle is solved.
 */
export default function TalentGallery({ gallery, talentName, blur }: TalentGalleryProps) {
  const [solved, setSolved] = useState<Set<string>>(loadSolved);
  const [lightbox, setLightbox] = useState<string | null>(null); // src of the open photo
  const [puzzle, setPuzzle] = useState<GalleryItem | null>(null);

  const isLocked = useCallback((g: GalleryItem) => !!g.puzzle && !solved.has(g.src), [solved]);
  const viewable = useMemo(() => gallery.filter((g) => !isLocked(g)), [gallery, isLocked]);

  const markSolved = (src: string) => {
    setSolved((prev) => {
      const next = new Set(prev).add(src);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* private mode */ }
      return next;
    });
    setPuzzle(null);
    setLightbox(src);
  };

  // scroll lock while an overlay is open
  const overlayOpen = lightbox !== null || puzzle !== null;
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [overlayOpen]);

  if (!gallery.length) return null;

  return (
    <section className="panel gal-panel">
      <SectionTag kana="写真">Portfolio</SectionTag>
      <h2 className="title">Gallery</h2>

      <div className="gal">
        {gallery.map((item, i) => (
          <Tile
            key={item.src}
            item={item}
            index={i}
            locked={isLocked(item)}
            blur={blur}
            onOpen={() => (isLocked(item) ? setPuzzle(item) : setLightbox(item.src))}
          />
        ))}
      </div>

      <p className="note" style={{ textAlign: 'right' }}>{gallery.length} Fotos · {talentName}</p>

      {lightbox !== null && (
        <Lightbox items={viewable} startSrc={lightbox} blur={blur} onClose={() => setLightbox(null)} />
      )}
      {puzzle && (
        <PuzzleGame
          src={puzzle.src}
          alt={puzzle.alt}
          blur={blur}
          onClose={() => setPuzzle(null)}
          onSolved={() => markSolved(puzzle.src)}
        />
      )}
    </section>
  );
}

/* ── tile ─────────────────────────────────────────────────────────────────── */
function Tile({ item, index, locked, blur, onOpen }: { item: GalleryItem; index: number; locked: boolean; blur?: boolean; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      className={`gal-tile ${locked ? 'is-locked' : ''} ${loaded ? 'is-loaded' : ''}`}
      style={{ ['--tilt' as string]: `${((index % 3) - 1) * 0.8}deg` }}
      onClick={onOpen}
      aria-label={locked ? `${item.alt} – Puzzle lösen zum Freischalten` : `${item.alt} vergrößern`}
    >
      <Pic src={item.src} alt={locked ? '' : item.alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} blur={blur} />
      {locked ? (
        <span className="gal-lock">
          <b>🧩</b>
          <span>Puzzle lösen</span>
          <small>zum Freischalten</small>
        </span>
      ) : (
        <span className="gal-zoom" aria-hidden>🔍</span>
      )}
    </button>
  );
}

/* ── lightbox ─────────────────────────────────────────────────────────────── */
function Lightbox({ items, startSrc, blur, onClose }: { items: GalleryItem[]; startSrc: string; blur?: boolean; onClose: () => void }) {
  const [i, setI] = useState(Math.max(0, items.findIndex((g) => g.src === startSrc)));
  const n = items.length;
  const prev = useCallback(() => setI((x) => (x - 1 + n) % n), [n]);
  const next = useCallback(() => setI((x) => (x + 1) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  const [touchX, setTouchX] = useState<number | null>(null);

  const cur = items[i];
  if (!cur) return null;

  return createPortal(
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={cur.alt}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        setTouchX(null);
      }}
    >
      <button className="lb-close" onClick={onClose} aria-label="Schließen">✕</button>
      <figure className="lb-figure" key={cur.src}>
        <Pic src={cur.src} alt={cur.alt} blur={blur} />
      </figure>
      {n > 1 && (
        <>
          <button className="lb-nav lb-prev" onClick={prev} aria-label="Vorheriges Foto">‹</button>
          <button className="lb-nav lb-next" onClick={next} aria-label="Nächstes Foto">›</button>
          <div className="lb-strip">
            {items.map((g, k) => (
              <button key={g.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Foto ${k + 1}`}>
                <Pic src={g.src} alt="" blur={blur} />
              </button>
            ))}
          </div>
        </>
      )}
      <div className="lb-count">{i + 1} / {n}</div>
    </div>,
    document.body,
  );
}
