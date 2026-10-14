import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SCENES } from '../data/scenes';
import { OUTFITS, outfitStore, activeSceneStore, setOutfit, useStore } from '../state/store';

export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const active = useStore(activeSceneStore);
  const outfit = OUTFITS[useStore(outfitStore)];
  const [open, setOpen] = useState(false);

  const link = (id: string, className: string | undefined, children: ReactNode) =>
    isHome
      ? <a href={`#${id}`} className={className} onClick={() => setOpen(false)}>{children}</a>
      : <Link to={`/#${id}`} className={className} onClick={() => setOpen(false)}>{children}</Link>;

  return (
    <>
      <header className="nav">
        <Link to="/" className="nav-logo glass-pill" aria-label="UwU Enterprises – Startseite">
          <img src="/logo.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span>UwU <b>Enterprises</b></span>
        </Link>

        <ul className={`nav-links glass-pill ${open ? 'open' : ''}`}>
          {SCENES.map((s, idx) => s.id === 'top' ? null : (
            <li key={s.id}>{link(s.id, active === idx ? 'active' : undefined, s.label)}</li>
          ))}
        </ul>

        <div className="nav-right">
          <button
            className="outfit-btn"
            onClick={() => setOutfit(outfitStore.get() + 1)}
            title="Outfit wechseln"
            aria-label={`Outfit wechseln (aktuell ${outfit.name})`}
          >
            <i /> <span className="name">{outfit.name}</span> ✨
          </button>
          <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menü" aria-expanded={open}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {isHome && (
        <nav className="dots" aria-label="Szenen">
          {SCENES.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={`dot ${active === i ? 'active' : ''}`} aria-label={s.label}>
              {s.emoji}
              <span>{s.label} · {s.kana}</span>
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
