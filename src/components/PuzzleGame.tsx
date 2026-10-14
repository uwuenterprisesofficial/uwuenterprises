import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PuzzleGameProps {
  src: string;
  alt: string;
  blur?: boolean;
  onClose: () => void;
  onSolved: () => void;
}

const COLS = 3;

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  do {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (a.every((v, i) => v === i));
  return a;
}

/**
 * Swap puzzle. The whole photo is used (nothing is cropped): the board takes
 * the photo's own aspect ratio. Click / tap two tiles to swap them, or drag one
 * tile onto another.
 */
export default function PuzzleGame({ src, alt, blur, onClose, onSolved }: PuzzleGameProps) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const rows = dims ? Math.min(5, Math.max(3, Math.round((COLS * dims.h) / dims.w))) : 4;
  const total = COLS * rows;

  const reset = useCallback(() => {
    setOrder(shuffled(total));
    setSelected(null);
    setMoves(0);
  }, [total]);

  useEffect(() => { if (dims) reset(); }, [dims, reset]);

  const solved = order.length > 0 && order.every((v, i) => v === i);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const swap = (a: number, b: number) => {
    setOrder((o) => {
      const n = [...o];
      [n[a], n[b]] = [n[b], n[a]];
      return n;
    });
    setMoves((m) => m + 1);
    setSelected(null);
  };

  const onDown = (pos: number) => {
    if (solved) return;
    dragFrom.current = pos;
    if (selected === null) setSelected(pos);
    else if (selected === pos) setSelected(null);
    else { swap(selected, pos); dragFrom.current = null; }
  };

  const onUp = (e: React.PointerEvent) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null || solved) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pos]') as HTMLElement | null;
    const to = el ? Number(el.dataset.pos) : null;
    if (to !== null && to !== from) swap(from, to);
  };

  const correct = useMemo(() => order.filter((v, i) => v === i).length, [order]);

  const ratio = dims ? dims.w / dims.h : 0.75;

  return createPortal(
    <div className="pz" role="dialog" aria-modal="true" aria-label="Puzzle" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pz-card">
        <header className="pz-head">
          <div>
            <p className="tag" style={{ marginBottom: '0.4rem' }}>🧩 Puzzle</p>
            <h3 className="pz-title">{solved ? 'Geschafft! ✨' : 'Löse das Puzzle'}</h3>
          </div>
          <button className="pz-x" onClick={onClose} aria-label="Schließen">✕</button>
        </header>

        <div className="pz-stats">
          <span><b>{correct}</b>/{total} richtig</span>
          <span><b>{moves}</b> Züge</span>
        </div>
        <div className="pz-bar"><i style={{ width: `${(correct / total) * 100}%` }} /></div>

        <div
          className={`pz-board ${solved ? 'is-solved' : ''} ${blur ? 'is-blur' : ''}`}
          style={{
            aspectRatio: `${ratio}`,
            width: `min(100%, calc(56vh * ${ratio}))`,
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
          onPointerUp={onUp}
          onPointerCancel={() => { dragFrom.current = null; }}
        >
          {order.map((tile, pos) => {
            const col = tile % COLS, row = Math.floor(tile / COLS);
            const right = tile === pos;
            return (
              <button
                key={pos}
                data-pos={pos}
                type="button"
                className={`pz-tile ${selected === pos ? 'sel' : ''} ${right ? 'ok' : ''}`}
                aria-label={`Teil ${pos + 1}`}
                onPointerDown={(e) => { e.preventDefault(); onDown(pos); }}
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: `${COLS * 100}% ${rows * 100}%`,
                  backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
                }}
              />
            );
          })}
          {peek && <img className="pz-peek" src={src} alt={alt} />}
          {solved && <div className="pz-confetti" aria-hidden>✦ ♡ ✦ ♡ ✦</div>}
        </div>

        <footer className="pz-actions">
          {solved ? (
            <button className="btn" onClick={onSolved}>Foto ansehen ✨</button>
          ) : (
            <>
              <button
                className="btn btn--ghost btn--sm"
                onPointerDown={() => setPeek(true)}
                onPointerUp={() => setPeek(false)}
                onPointerLeave={() => setPeek(false)}
              >👁 Vorschau (halten)</button>
              <button className="btn btn--outline btn--sm" onClick={reset}>🔀 Neu mischen</button>
            </>
          )}
        </footer>
        {!solved && <p className="note" style={{ textAlign: 'center', marginTop: '0.8rem' }}>Zwei Teile anklicken (oder ziehen), um sie zu tauschen.</p>}
      </div>
    </div>,
    document.body,
  );
}
