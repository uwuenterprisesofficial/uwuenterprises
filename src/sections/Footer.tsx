import { Link } from 'react-router-dom';
import { SCENES } from '../data/scenes';

export default function Footer() {
  return (
    <footer className="footer glass-pill">
      <Link to="/" className="brand">UwU <span style={{ color: 'var(--accent)' }}>Enterprises</span></Link>
      <nav aria-label="Footer Navigation">
        {SCENES.filter((s) => s.id !== 'top').map((s) => (
          <Link key={s.id} to={`/#${s.id}`}>{s.label}</Link>
        ))}
      </nav>
      <span>© {new Date().getFullYear()} UwU Enterprises ♡ · <Link to="/creator">Creator Space 🔑</Link></span>
    </footer>
  );
}
