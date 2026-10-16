import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { SectionTag } from '../../components/SectionHeader';
import { useAuth } from '../../state/auth';
import { loadTalents } from '../../state/talents';
import type { EditableTalent } from './types';

interface Manager { id: number; username: string; active: boolean; createdAt: string }

/** Access data that was just generated — the password is only known right now (the server stores a hash). */
interface Credential { talentId: number; name: string; username: string; password: string; email: string; kind: 'new' | 'reset' }

const randomPassword = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
};

const baseUsername = (slug: string) => {
  const u = slug.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return u.length >= 3 ? u.slice(0, 28) : `${u}-talent`;
};

/** Ready-written mail with the access data (opens in the mail client of whoever clicks it). */
function mailtoFor(c: Credential): string {
  const url = `${window.location.origin}/creator`;
  const intro = c.kind === 'new'
    ? 'für dich wurde ein Zugang zum Creator Space von UwU Enterprises angelegt. Dort kannst du deine Seite selbst bearbeiten: Texte, Tags, Links, Profilbild und Galerie.'
    : 'dein Zugang zum Creator Space von UwU Enterprises wurde zurückgesetzt.';
  const body = [
    `Hallo ${c.name},`,
    '',
    intro,
    '',
    `Login: ${url}`,
    `Benutzername: ${c.username}`,
    `Vorläufiges Passwort: ${c.password}`,
    '',
    'Beim ersten Login legst du dein eigenes Passwort fest. Bitte gib das vorläufige Passwort an niemanden weiter.',
    '',
    'Viele Grüße',
    'UwU Enterprises',
  ].join('\r\n');
  const subject = c.kind === 'new' ? 'Dein Zugang zum UwU Enterprises Creator Space' : 'Neues Passwort für den UwU Enterprises Creator Space';
  return `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const plainText = (c: Credential) => `${c.name}\nLogin: ${window.location.origin}/creator\nBenutzername: ${c.username}\nVorläufiges Passwort: ${c.password}`;

export default function AdminPanel() {
  const [talents, setTalents] = useState<EditableTalent[] | null>(null);
  const [error, setError] = useState('');
  const [creds, setCreds] = useState<Credential[]>([]);
  const [busy, setBusy] = useState(false);
  const [mail, setMail] = useState<{ enabled: boolean; from: string }>({ enabled: false, from: '' });
  const [sent, setSent] = useState<Record<number, { ok: boolean; text: string }>>({});

  const load = () => api.get<EditableTalent[]>('/api/admin/talents').then(setTalents).catch((e: Error) => setError(e.message));
  useEffect(() => { void load(); }, []);
  useEffect(() => { api.get<{ enabled: boolean; from: string }>('/api/admin/mail-status').then(setMail).catch(() => {}); }, []);

  const apply = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); await load(); void loadTalents(); }
    catch (e) { setError((e as Error).message); }
  };

  const settings = (t: EditableTalent, patch: Record<string, unknown>) =>
    apply(() => api.put(`/api/admin/talents/${t.id}/settings`, patch));

  const move = (i: number, d: -1 | 1) => {
    if (!talents) return;
    const ids = talents.map((t) => t.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void apply(() => api.put('/api/admin/order', { ids }));
  };

  /** creates an account (random temporary password) for a talent that has none */
  const makeAccount = async (t: EditableTalent): Promise<Credential> => {
    const password = randomPassword();
    let username = baseUsername(t.slug);
    for (let n = 2; ; n++) {
      try {
        await api.post(`/api/admin/talents/${t.id}/account`, { username, password });
        return { talentId: t.id, name: t.name, username, password, email: '', kind: 'new' };
      } catch (e) {
        if (!/schon vergeben/.test((e as Error).message) || n > 20) throw e;
        username = `${baseUsername(t.slug).slice(0, 26)}${n}`;
      }
    }
  };

  const createAccount = (t: EditableTalent) =>
    apply(async () => { const c = await makeAccount(t); setCreds((old) => [c, ...old.filter((x) => x.talentId !== t.id)]); });

  const withoutAccount = (talents ?? []).filter((t) => !t.account);

  const createAllAccounts = async () => {
    if (!withoutAccount.length) return;
    if (!window.confirm(`Für ${withoutAccount.length} Talent(s) ohne Account jetzt Zugänge anlegen?\n\n${withoutAccount.map((t) => t.name).join(', ')}`)) return;
    setBusy(true); setError('');
    const made: Credential[] = [];
    try { for (const t of withoutAccount) made.push(await makeAccount(t)); }
    catch (e) { setError((e as Error).message); }
    setCreds((old) => [...made, ...old.filter((x) => !made.some((m) => m.talentId === x.talentId))]);
    setBusy(false);
    await load(); void loadTalents();
  };

  /** mails the access data to the address stored on the account (SMTP) */
  const sendMail = async (c: Credential) => {
    setSent((o) => ({ ...o, [c.talentId]: { ok: true, text: 'sende …' } }));
    try {
      const r = await api.post<{ to: string }>(`/api/admin/talents/${c.talentId}/send-access`, { password: c.password, reset: c.kind === 'reset' });
      setSent((o) => ({ ...o, [c.talentId]: { ok: true, text: `✓ gesendet an ${r.to}` } }));
    } catch (e) {
      setSent((o) => ({ ...o, [c.talentId]: { ok: false, text: (e as Error).message } }));
    }
  };

  const sendAll = async () => {
    for (const c of creds) {
      const email = emailOf(c);
      if (!email || sent[c.talentId]?.text.startsWith('✓')) continue;
      await sendMail({ ...c, email });
    }
  };

  const resetPassword = (t: EditableTalent) => {
    if (!window.confirm(`Neues vorläufiges Passwort für ${t.name} erzeugen? Das alte Passwort und alle Sitzungen werden ungültig.`)) return;
    void apply(async () => {
      const password = randomPassword();
      await api.post(`/api/admin/talents/${t.id}/reset-password`, { password });
      setCreds((old) => [{ talentId: t.id, name: t.name, username: t.account?.username ?? '', password, email: t.account?.email ?? '', kind: 'reset' as const }, ...old.filter((x) => x.talentId !== t.id)]);
    });
  };

  const remove = (t: EditableTalent) => {
    if (!window.confirm(`„${t.name}“ samt Account und allen Bildern endgültig löschen?`)) return;
    void apply(() => api.del(`/api/admin/talents/${t.id}`));
  };

  const saveEmail = async (c: Credential, email: string): Promise<boolean> => {
    setCreds((old) => old.map((x) => (x.talentId === c.talentId ? { ...x, email } : x)));
    try { await api.put(`/api/admin/talents/${c.talentId}/account-email`, { email }); void load(); setError(''); return true; }
    catch (e) { setError((e as Error).message); return false; }
  };

  // keep the e-mail of the credential cards in sync with what is stored
  const emailOf = (c: Credential) => c.email || talents?.find((t) => t.id === c.talentId)?.account?.email || '';

  return (
    <>
      <section className="panel">
        <SectionTag kana="管理">Management</SectionTag>
        <h1 className="title">Talents <span className="hl">verwalten</span></h1>
        <p className="lead">Hier legst du Talents samt Zugang an, schaltest Seiten frei oder sperrst Accounts. Texte und Bilder pflegt jedes Talent selbst — du kannst aber jede Seite auch selbst bearbeiten.</p>
        {error && <p className="form-error" role="alert">{error}</p>}

        {withoutAccount.length > 0 && (
          <div className="consent warn">
            <div>
              <b>{withoutAccount.length} Talent(s) haben noch keinen Zugang</b>
              <p>{withoutAccount.map((t) => t.name).join(', ')}. Mit einem Klick bekommen alle einen Account mit vorläufigem Passwort — danach kannst du ihnen die Zugangsdaten per Mail schicken. Beim ersten Login legen sie ein eigenes Passwort fest.</p>
            </div>
            <button className="btn btn--sm" disabled={busy} onClick={() => void createAllAccounts()}>{busy ? 'Lege an …' : 'Accounts für alle anlegen'}</button>
          </div>
        )}

        {creds.length > 0 && (
          <div className="creds">
            <div className="creds-head">
              <h2 className="cs-h3" style={{ margin: 0 }}>Zugangsdaten zum Versenden</h2>
              <div className="btn-row">
                {mail.enabled && <button className="btn btn--sm" onClick={() => void sendAll()}>✉ Alle per Mail senden</button>}
                <button className="btn btn--ghost btn--sm" onClick={() => void navigator.clipboard?.writeText(creds.map(plainText).join('\n\n'))}>Alle kopieren</button>
                <button className="icon-btn" onClick={() => setCreds([])} aria-label="Schließen" title="Ausblenden">✕</button>
              </div>
            </div>
            <p className="note">⚠️ Die Passwörter sind nur jetzt sichtbar (auf dem Server wird nur ein Hash gespeichert). Trag die private E-Mail-Adresse ein und {mail.enabled ? `schick die Zugangsdaten direkt ab (Absender: ${mail.from}) oder nutze „Mail öffnen“` : 'klick auf „Mail öffnen“'} — die Nachricht ist fertig geschrieben.{!mail.enabled && ' (Automatischer Versand: SMTP_HOST und MAIL_FROM setzen.)'}</p>
            {creds.map((c) => (
              <CredentialRow key={c.talentId} c={{ ...c, email: emailOf(c) }} onEmail={(e) => saveEmail(c, e)} mailEnabled={mail.enabled}
                status={sent[c.talentId]} onSend={() => void sendMail({ ...c, email: emailOf(c) })} />
            ))}
          </div>
        )}

        <div className="admin-list">
          {!talents && <p className="muted">Lade …</p>}
          {talents?.map((t, i) => (
            <article key={t.id} className={`admin-row ${t.published ? '' : 'is-draft'}`}>
              <div className="admin-thumb">{t.thumb ?? t.image ? <img src={t.thumb ?? t.image ?? ''} alt="" /> : '?'}</div>
              <div className="admin-main">
                <h3>{t.name}</h3>
                <p className="muted">@{t.account?.username ?? '—'} · /talent/{t.slug}</p>
                <div className="pills">
                  <span className={`pill ${t.published ? 'ok' : 'warn'}`}>{t.published ? 'sichtbar' : 'Entwurf / versteckt'}</span>
                  <span className={`pill ${t.account?.active ? 'ok' : t.account ? 'bad' : 'warn'}`}>{t.account?.active ? 'Account aktiv' : t.account ? 'Account gesperrt' : 'noch kein Account'}</span>
                  <span className={`pill ${t.blurImages ? 'warn' : 'ok'}`}>{t.blurImages ? 'Bilder unscharf' : 'Bilder frei'}</span>
                  {t.account?.mustChange && <span className="pill warn">wartet auf ersten Login</span>}
                </div>
              </div>
              <div className="admin-actions">
                <label className="switch" title="Seite auf der Website anzeigen">
                  <input type="checkbox" checked={t.published} onChange={(e) => void settings(t, { published: e.target.checked })} /> Sichtbar
                </label>
                <label className="switch" title="Login erlauben">
                  <input type="checkbox" checked={!!t.account?.active} disabled={!t.account} onChange={(e) => void settings(t, { accountActive: e.target.checked })} /> Account aktiv
                </label>
                <label className="switch" title="Bilder öffentlich verwischen, bis das Talent zugestimmt hat">
                  <input type="checkbox" checked={t.blurImages} onChange={(e) => void settings(t, { blurImages: e.target.checked })} /> Bilder verwischen
                </label>
                <div className="btn-row">
                  <Link className="btn btn--sm" to={`/creator/talent/${t.id}`}>Bearbeiten</Link>
                  {t.account
                    ? <button className="btn btn--ghost btn--sm" onClick={() => resetPassword(t)}>🔑 Neues Passwort</button>
                    : <button className="btn btn--ghost btn--sm" onClick={() => void createAccount(t)}>👤 Account anlegen</button>}
                  <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Nach oben">↑</button>
                  <button className="icon-btn" disabled={i === talents.length - 1} onClick={() => move(i, 1)} title="Nach unten">↓</button>
                  <button className="icon-btn danger" onClick={() => remove(t)} title="Löschen">🗑</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CreateTalent onCreated={(t, password, email) => {
        setCreds((old) => [{ talentId: t.id, name: t.name, username: t.account?.username ?? '', password, email, kind: 'new' as const }, ...old]);
        void load(); void loadTalents();
      }} />
      <Managers />
    </>
  );
}

function CredentialRow({ c, onEmail, mailEnabled, status, onSend }: {
  c: Credential; onEmail: (email: string) => Promise<boolean>; mailEnabled: boolean;
  status?: { ok: boolean; text: string }; onSend: () => void;
}) {
  const [email, setEmail] = useState(c.email);
  useEffect(() => { setEmail(c.email); }, [c.email]);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /** make sure the address is stored first - the server mails to the stored address only */
  const send = async () => {
    if (valid && email.trim().toLowerCase() !== c.email && !(await onEmail(email.trim()))) return;
    onSend();
  };

  return (
    <div className="cred-row">
      <div className="cred-main">
        <b>{c.name}</b> <span className="pill warn">{c.kind === 'new' ? 'neuer Zugang' : 'Passwort zurückgesetzt'}</span>
        <p><code>{c.username}</code> · <code>{c.password}</code></p>
        {status && <p className={status.ok ? 'form-ok' : 'form-error'}>{status.text}</p>}
      </div>
      <input className="input" type="email" placeholder="private E-Mail-Adresse" value={email} maxLength={120}
        onChange={(e) => setEmail(e.target.value)} onBlur={() => { if (email !== c.email && (valid || !email)) void onEmail(email.trim()); }} />
      <div className="btn-row">
        {mailEnabled && <button className="btn btn--sm" disabled={!valid} title={valid ? '' : 'Erst eine gültige E-Mail-Adresse eintragen'} onClick={() => void send()}>✉ Per Mail senden</button>}
        <a className={`btn btn--sm ${mailEnabled ? 'btn--ghost' : ''}`} href={mailtoFor({ ...c, email: valid ? email.trim() : '' })}>Mail öffnen</a>
        <button className="btn btn--ghost btn--sm" onClick={() => void navigator.clipboard?.writeText(plainText(c))}>Kopieren</button>
      </div>
    </div>
  );
}

function CreateTalent({ onCreated }: { onCreated: (t: EditableTalent, password: string, email: string) => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(randomPassword);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const t = await api.post<EditableTalent>('/api/admin/talents', { name, username, password, email });
      onCreated(t, password, email.trim().toLowerCase());
      setName(''); setUsername(''); setEmail(''); setPassword(randomPassword());
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <form className="panel" onSubmit={submit}>
      <h2 className="cs-h">Neues Talent anlegen</h2>
      <p className="note">Das Talent startet als Entwurf (unsichtbar, Bilder verwischt) und befüllt seine Seite selbst. Die Zugangsdaten erscheinen oben zum Versenden.</p>
      <div className="grid2">
        <label className="field">Name
          <input className="input" value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">Benutzername
          <input className="input" value={username} maxLength={32} required placeholder={name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '') : ''}
            onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="field">Private E-Mail (optional, nicht öffentlich)
          <input className="input" type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">Vorläufiges Passwort
          <span className="inline">
            <input className="input" value={password} minLength={10} maxLength={200} required onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="icon-btn" title="Neu würfeln" onClick={() => setPassword(randomPassword())}>🎲</button>
          </span>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="btn-row"><button className="btn" disabled={busy}>Talent + Account anlegen ✨</button></div>
    </form>
  );
}

function Managers() {
  const { user } = useAuth();
  const [list, setList] = useState<Manager[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(randomPassword);
  const [error, setError] = useState('');
  const [made, setMade] = useState('');

  useEffect(() => { api.get<Manager[]>('/api/admin/managers').then(setList).catch(() => {}); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setMade('');
    try {
      setList(await api.post<Manager[]>('/api/admin/managers', { username, password }));
      setMade(`Account „${username}“ angelegt · vorläufiges Passwort: ${password}`);
      setUsername(''); setPassword(randomPassword());
    } catch (err) { setError((err as Error).message); }
  };
  const toggle = async (m: Manager) => {
    setError('');
    try { setList(await api.patch<Manager[]>(`/api/admin/managers/${m.id}`, { active: !m.active })); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <section className="panel">
      <h2 className="cs-h">Management-Accounts</h2>
      <ul className="mgr-list">
        {list.map((m) => (
          <li key={m.id}>
            <span><b>{m.username}</b> {m.id === user?.id && <small>(du)</small>}</span>
            <span className={`pill ${m.active ? 'ok' : 'bad'}`}>{m.active ? 'aktiv' : 'gesperrt'}</span>
            {m.id !== user?.id && <button className="btn btn--ghost btn--sm" onClick={() => void toggle(m)}>{m.active ? 'Sperren' : 'Entsperren'}</button>}
          </li>
        ))}
      </ul>
      <form onSubmit={create} className="grid3" style={{ marginTop: '1rem' }}>
        <label className="field">Benutzername
          <input className="input" value={username} maxLength={32} required onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="field">Vorläufiges Passwort
          <input className="input" value={password} minLength={10} required onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="field"><span>&nbsp;</span><button className="btn btn--sm">+ Management-Account</button></div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {made && <p className="form-ok"><code>{made}</code></p>}
    </section>
  );
}
