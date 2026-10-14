import { useEffect, useRef, useState } from 'react';
import { hoverStore, toastStore, onFlash, useStore } from '../state/store';

/** Small tooltip that names the 3D object under the (native) pointer. No lag. */
export function HoverLabel() {
  const label = useStore(hoverStore);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return <div ref={ref} className={`hover-label ${label ? 'on' : ''}`} aria-hidden>{label}</div>;
}

export function Toast() {
  const t = useStore(toastStore);
  return t ? <div key={t.id} className="toast" role="status">{t.text}</div> : null;
}

export function Flash() {
  const [n, setN] = useState(0);
  useEffect(() => onFlash(() => setN((x) => x + 1)), []);
  return n ? <div key={n} className="flash" aria-hidden="true" /> : null;
}
