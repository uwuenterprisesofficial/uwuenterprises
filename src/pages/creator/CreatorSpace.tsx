import { FormEvent, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { login, logout, useAuth } from '../../state/auth';
import { SectionTag } from '../../components/SectionHeader';
import TalentEditor from './TalentEditor';
import AdminPanel from './AdminPanel';

/** /creator/*  — login, then the talent editor (talents) or the admin panel (management). */
export default function CreatorSpace() {
  const { loading, user } = useAuth();

  useEffect(() => {
    document.title = 'Creator Space — UwU Enterprises';
    return () => { document.title = 'UwU Enterprises'; };
  }, []);

  if (loading) return <div className="page" />;
  if (!user) return <Login />;
  if (user.mustChange) return <Shell><ChangePassword forced /></Shell>;

  return (
    <Shell>
      <Routes>
        <Route index element={user.role === 'management' ? <AdminPanel /> : <TalentEditor talentId={user.talentId!} />} />
        {user.role === 'management' && <Route path="talent/:id" element={<EditRoute />} />}
        <Route path="password" element={<ChangePassword />} />
        <Route path="*" element={<Missing />} />
      </Routes>
    </Shell>
  );
}

function EditRoute() {
  const { id } = useParams();
  return <TalentEditor talentId={Number(id)} isManagement />;
}

function Missing() {
  return <div className="panel"><h2 className="title">Nicht gefunden</h2><Link to="/creator" className="btn">Zurück</Link></div>;
}

/* ── frame with the user bar ── */
function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="page cs">
      <header className="panel cs-bar">
        <div>
          <SectionTag kana="作業場">Creator Space</SectionTag>
          <p className="cs-who">
            Angemeldet als <b>{user?.username}</b> · {user?.role === 'management' ? 'Management' : 'Talent'}
          </p>
        </div>
        <nav className="cs-actions">
          {/* plain anchor = full reload, so the 3D scene picks up freshly saved data */}
          <a className="btn btn--ghost btn--sm" href="/">🌐 Zur Website</a>
          {!user?.mustChange && <Link className="btn btn--ghost btn--sm" to="/creator">🏠 Übersicht</Link>}
          {!user?.mustChange && <Link className="btn btn--ghost btn--sm" to="/creator/password">🔑 Passwort</Link>}
          <button className="btn btn--outline btn--sm" onClick={() => { void logout().then(() => navigate('/creator')); }}>Abmelden</button>
        </nav>
      </header>
      {children}
    </div>
  );
}

/* ── login ── */
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(username, password); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <form className="panel center-panel login" onSubmit={submit}>
        <SectionTag kana="ログイン">Creator Space</SectionTag>
        <h1 className="title">Willkommen <span className="hl">zurück!</span></h1>
        <p className="lead">Melde dich an, um deine Seite zu bearbeiten.</p>
        <label className="field">Benutzername
          <input className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
        </label>
        <label className="field">Passwort
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="btn-row">
          <button className="btn" disabled={busy}>{busy ? 'Moment …' : 'Anmelden ✨'}</button>
          <a className="btn btn--ghost" href="/">← Website</a>
        </div>
        <p className="note">Noch keinen Zugang? Das Management legt Accounts für Talents an.</p>
      </form>
    </div>
  );
}

/* ── change password (forced after first login / reset) ── */
function ChangePassword({ forced }: { forced?: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (next !== repeat) { setError('Die beiden neuen Passwörter stimmen nicht überein.'); return; }
    try {
      await api.post('/api/auth/password', { current, next });
      setDone(true);
      setTimeout(() => window.location.assign('/creator'), 900);
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <form className="panel center-panel login" onSubmit={submit}>
      <h2 className="title">{forced ? <>Wähle dein <span className="hl">Passwort</span></> : <>Passwort <span className="hl">ändern</span></>}</h2>
      {forced && <p className="lead">Das Passwort vom Management ist nur vorläufig. Bitte lege jetzt dein eigenes fest (mind. 10 Zeichen).</p>}
      <label className="field">Aktuelles Passwort
        <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </label>
      <label className="field">Neues Passwort
        <input className="input" type="password" autoComplete="new-password" minLength={10} value={next} onChange={(e) => setNext(e.target.value)} required />
      </label>
      <label className="field">Neues Passwort wiederholen
        <input className="input" type="password" autoComplete="new-password" minLength={10} value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {done && <p className="form-ok">Gespeichert ✨</p>}
      <div className="btn-row"><button className="btn">Speichern</button></div>
    </form>
  );
}
