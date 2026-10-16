import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { SectionTag } from '../../components/SectionHeader';
import { loadTalents } from '../../state/talents';
import type { EditableTalent } from './types';

const SOCIALS: [string, string][] = [
  ['twitch', 'Twitch'], ['tiktok', 'TikTok'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['twitter', 'X / Twitter'],
];

interface Draft {
  name: string; tagline: string; category: string; bio: string; bookingEmail: string;
  longBio: string[]; tags: string[]; socials: Record<string, string>; stats: { label: string; value: string }[];
}

const toDraft = (t: EditableTalent): Draft => ({
  name: t.name, tagline: t.tagline ?? '', category: t.category, bio: t.bio, bookingEmail: t.bookingEmail,
  longBio: t.longBio.length ? t.longBio : [''], tags: t.tags,
  socials: Object.fromEntries(SOCIALS.map(([k]) => [k, (t.socials as Record<string, string | undefined>)[k] ?? ''])),
  stats: t.stats,
});

export default function TalentEditor({ talentId, isManagement }: { talentId: number; isManagement?: boolean }) {
  const [data, setData] = useState<EditableTalent | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get<EditableTalent>(`/api/talents/${talentId}/edit`)
      .then((t) => { setData(t); setDraft(toDraft(t)); })
      .catch((e: Error) => setError(e.message));
  }, [talentId]);

  // warn before leaving with unsaved text
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (error && !data) return <div className="panel"><p className="form-error">{error}</p></div>;
  if (!data || !draft) return <div className="panel"><p className="lead">Lade …</p></div>;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft({ ...draft, [k]: v }); setDirty(true); setMsg(''); };

  /** picture changes come back as the full record; keep the text draft untouched */
  const applyImages = (t: EditableTalent) => { setData(t); void loadTalents(); };

  const save = async () => {
    setBusy(true); setError(''); setMsg('');
    try {
      const t = await api.put<EditableTalent>(`/api/talents/${talentId}`, draft);
      setData(t); setDraft(toDraft(t)); setDirty(false); setMsg('Gespeichert ✨');
      void loadTalents();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <section className="panel">
        <div className="cs-head">
          <div>
            <SectionTag kana="編集">{isManagement ? 'Talent bearbeiten' : 'Meine Seite'}</SectionTag>
            <h1 className="title" style={{ marginBottom: '0.4rem' }}>{data.name}</h1>
            <p className="muted">
              Status:&nbsp;
              <span className={`pill ${data.published ? 'ok' : 'warn'}`}>{data.published ? 'Auf der Website sichtbar' : 'Noch nicht veröffentlicht'}</span>
              {data.published && <> · <Link to={`/talent/${data.slug}`} target="_blank" rel="noopener">Seite ansehen ↗</Link></>}
            </p>
            {!data.published && <p className="note">Das Management schaltet deine Seite frei, sobald sie fertig ist.</p>}
          </div>
          {isManagement && <Link className="btn btn--ghost btn--sm" to="/creator">← Alle Talents</Link>}
        </div>
      </section>

      <section className="panel">
        <h2 className="cs-h">Basis</h2>
        <div className="grid2">
          <Field label="Name" value={draft.name} max={60} onChange={(v) => set('name', v)} />
          <Field label="Untertitel (optional)" hint='z. B. "Ritter einsamer Herzen"' value={draft.tagline} max={80} onChange={(v) => set('tagline', v)} />
          <Field label="Kategorie" hint="z. B. Cosplayer · Creator" value={draft.category} max={80} onChange={(v) => set('category', v)} />
          <Field label="Booking-E-Mail" type="email" value={draft.bookingEmail} max={120} onChange={(v) => set('bookingEmail', v)} />
        </div>
        <label className="field">Kurzbeschreibung <small>{draft.bio.length}/600</small>
          <textarea className="input" rows={3} maxLength={600} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
        </label>
      </section>

      <section className="panel">
        <h2 className="cs-h">Über mich</h2>
        <p className="note">Jeder Absatz erscheint auf deiner Seite unter „Wer ist …?“.</p>
        {draft.longBio.map((p, i) => (
          <div className="row-item" key={i}>
            <textarea className="input" rows={4} maxLength={2000} value={p}
              onChange={(e) => set('longBio', draft.longBio.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Absatz ${i + 1}`} />
            <button className="icon-btn" title="Absatz entfernen" onClick={() => set('longBio', draft.longBio.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {draft.longBio.length < 8 && <button className="btn btn--ghost btn--sm" onClick={() => set('longBio', [...draft.longBio, ''])}>+ Absatz</button>}
      </section>

      <section className="panel">
        <h2 className="cs-h">Tags</h2>
        <TagInput tags={draft.tags} onChange={(t) => set('tags', t)} />
      </section>

      <section className="panel">
        <h2 className="cs-h">Social Links</h2>
        <div className="grid2">
          {SOCIALS.map(([k, label]) => (
            <Field key={k} label={label} type="url" placeholder="https://…" value={draft.socials[k]} max={200}
              onChange={(v) => set('socials', { ...draft.socials, [k]: v })} />
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="cs-h">Facts (Stats)</h2>
        <p className="note">Kleine Karten auf deiner Seite, z. B. „Fokus – Cosplay“. Maximal 6.</p>
        {draft.stats.map((s, i) => (
          <div className="row-item" key={i}>
            <input className="input" placeholder="Name" maxLength={30} value={s.label}
              onChange={(e) => set('stats', draft.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className="input" placeholder="Wert" maxLength={40} value={s.value}
              onChange={(e) => set('stats', draft.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <button className="icon-btn" title="Entfernen" onClick={() => set('stats', draft.stats.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {draft.stats.length < 6 && <button className="btn btn--ghost btn--sm" onClick={() => set('stats', [...draft.stats, { label: '', value: '' }])}>+ Fact</button>}
      </section>

      <div className="savebar panel">
        <div>
          {error && <span className="form-error" role="alert">{error}</span>}
          {msg && <span className="form-ok">{msg}</span>}
          {!error && !msg && dirty && <span className="muted">Ungespeicherte Änderungen</span>}
        </div>
        <button className="btn" onClick={save} disabled={busy || !dirty}>{busy ? 'Speichern …' : 'Texte speichern 💾'}</button>
      </div>

      <Pictures data={data} onChange={applyImages} isManagement={!!isManagement} />
    </>
  );
}

/* ── small inputs ── */
function Field({ label, value, onChange, max, type = 'text', hint, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; max: number; type?: string; hint?: string; placeholder?: string;
}) {
  return (
    <label className="field">{label}
      <input className="input" type={type} maxLength={max} value={value} placeholder={placeholder ?? hint} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (v && !tags.includes(v) && tags.length < 12) onChange([...tags, v.slice(0, 30)]);
    setText('');
  };
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1));
  };
  return (
    <div className="tag-input">
      {tags.map((t) => <span key={t} className="chip-tag">{t}<button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`${t} entfernen`}>✕</button></span>)}
      <input className="input" value={text} maxLength={30} placeholder={tags.length >= 12 ? 'Maximum erreicht' : 'Tag eingeben + Enter'}
        disabled={tags.length >= 12} onChange={(e) => setText(e.target.value)} onKeyDown={key} onBlur={add} />
    </div>
  );
}

/* ── pictures ── */
function Pictures({ data, onChange, isManagement }: { data: EditableTalent; onChange: (t: EditableTalent) => void; isManagement: boolean }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const profileInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const id = data.id;

  const run = async (label: string, fn: () => Promise<EditableTalent & { failed?: string[] }>) => {
    setBusy(label); setError('');
    try {
      const res = await fn();
      onChange(res);
      if (res.failed?.length) setError(res.failed.join(' '));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(''); }
  };

  const uploadProfile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const form = new FormData(); form.append('file', f);
    void run('profile', () => api.upload(`/api/talents/${id}/profile-image`, form));
  };
  const uploadGallery = (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!files.length) return;
    const form = new FormData(); files.forEach((f) => form.append('file', f));
    void run('gallery', () => api.upload(`/api/talents/${id}/gallery`, form));
  };

  const move = (i: number, d: -1 | 1) => {
    const ids = data.gallery.map((g) => g.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void run('order', () => api.put(`/api/talents/${id}/gallery-order`, { ids }));
  };

  const setConsent = (approved: boolean) => {
    const url = isManagement ? `/api/admin/talents/${id}/settings` : `/api/talents/${id}/consent`;
    void run('consent', () => api.put(url, { blurImages: !approved }));
  };

  return (
    <section className="panel">
      <h2 className="cs-h">Bilder</h2>
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className={`consent ${data.blurImages ? 'warn' : 'ok'}`}>
        <div>
          <b>{data.blurImages ? '🔒 Deine Bilder sind auf der Website unscharf' : '✅ Deine Bilder werden öffentlich gezeigt'}</b>
          <p>
            {data.blurImages
              ? 'Besucher sehen nur eine verwischte Version. Die echten Bilder werden erst gezeigt, wenn du (oder das Management) sie freigibst.'
              : 'Du hast zugestimmt, dass deine Bilder öffentlich auf der Website erscheinen.'}
          </p>
        </div>
        <button className="btn btn--sm" disabled={busy === 'consent'} onClick={() => setConsent(!!data.blurImages)}>
          {data.blurImages ? 'Bilder freigeben' : 'Wieder verwischen'}
        </button>
      </div>

      <h3 className="cs-h3">Profilbild</h3>
      <div className="profile-pic">
        {data.image ? <img src={`${data.image}?v=${data.gallery.length}`} alt="Profilbild" /> : <div className="ph">Kein Bild</div>}
        <div className="btn-col">
          <input ref={profileInput} type="file" accept="image/*" hidden onChange={uploadProfile} />
          <button className="btn btn--sm" disabled={busy === 'profile'} onClick={() => profileInput.current?.click()}>
            {busy === 'profile' ? 'Lädt hoch …' : data.image ? 'Profilbild ersetzen' : 'Profilbild hochladen'}
          </button>
          {data.image && <button className="btn btn--ghost btn--sm" onClick={() => void run('profile', () => api.del(`/api/talents/${id}/profile-image`))}>Entfernen</button>}
          <p className="note">Hochkant (3:4) sieht am besten aus. Wird auf der Bühne, im Roster und auf deiner Seite genutzt.</p>
        </div>
      </div>

      <h3 className="cs-h3">Galerie <small>({data.gallery.length}/40)</small></h3>
      <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={uploadGallery} />
      <button className="btn btn--sm" disabled={busy === 'gallery'} onClick={() => galleryInput.current?.click()}>
        {busy === 'gallery' ? 'Lädt hoch …' : '+ Bilder hinzufügen'}
      </button>
      <p className="note">JPG, PNG, WebP oder HEIC, bis 15 MB pro Bild. Die Reihenfolge hier ist die Reihenfolge auf deiner Seite.</p>

      <div className="gal-edit">
        {data.gallery.map((g, i) => (
          <figure key={g.id}>
            <img src={g.src} alt={g.alt || `Bild ${i + 1}`} loading="lazy" />
            <input className="input" placeholder="Bildbeschreibung (Alt-Text)" defaultValue={g.alt} maxLength={140}
              onBlur={(e) => { if (e.target.value !== g.alt) void run('alt', () => api.patch(`/api/talents/${id}/gallery/${g.id}`, { alt: e.target.value })); }} />
            <label className="check">
              <input type="checkbox" checked={g.puzzle} onChange={(e) => void run('puzzle', () => api.patch(`/api/talents/${id}/gallery/${g.id}`, { puzzle: e.target.checked }))} />
              🧩 hinter Puzzle verstecken
            </label>
            <div className="gal-actions">
              <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Nach vorne">←</button>
              <button className="icon-btn" disabled={i === data.gallery.length - 1} onClick={() => move(i, 1)} title="Nach hinten">→</button>
              <button className="icon-btn danger" title="Bild löschen"
                onClick={() => { if (window.confirm('Dieses Bild wirklich löschen?')) void run('del', () => api.del(`/api/talents/${id}/gallery/${g.id}`)); }}>🗑</button>
            </div>
          </figure>
        ))}
        {!data.gallery.length && <p className="muted">Noch keine Bilder in der Galerie.</p>}
      </div>
    </section>
  );
}
