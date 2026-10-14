import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { TALENTS } from '../data';
import TalentSocials from '../components/TalentSocials';
import PillButton from '../components/PillButton';
import { SectionTag } from '../components/SectionHeader';
import TalentGallery from '../components/TalentGallery';
import Pic from '../components/Pic';
import type { Talent, TalentStat } from '../types';

export default function TalentPage() {
  const { slug } = useParams<{ slug: string }>();
  const talent = TALENTS.find((t) => t.slug === slug);

  useEffect(() => {
    if (talent) document.title = `${talent.name} — UwU Enterprises`;
    return () => { document.title = 'UwU Enterprises'; };
  }, [talent]);

  if (!talent?.featured) return <NotFound />;

  return (
    <div className="page">
      <Hero talent={talent} />
      <Bio talent={talent} />
      <TalentGallery gallery={talent.gallery} talentName={talent.name} blur={talent.blurImages} />
      {talent.stats.length > 0 && <Stats stats={talent.stats} />}
      <Booking talent={talent} />
    </div>
  );
}

function Hero({ talent }: { talent: Talent }) {
  return (
    <div className="panel t-hero">
      <div>
        <Link to="/#talents" className="btn btn--ghost btn--sm back-link">← Zurück zum Roster</Link>
        <SectionTag kana="タレント">UwU Enterprises — Talent</SectionTag>
        <h1 className="t-name">{talent.name}</h1>
        {talent.tagline && <p className="t-tagline">„{talent.tagline}“</p>}
        <p className="t-cat">{talent.category}</p>
        <p className="lead">{talent.bio}</p>
        <div className="tags">{talent.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <PillButton href={`mailto:${talent.bookingEmail}`}>Jetzt buchen 💌</PillButton>
          <TalentSocials socials={talent.socials} />
        </div>
      </div>

      <figure className="t-photo">
        <span className="badge">⭐ Featured</span>
        {talent.image ? <Pic src={talent.image} alt={talent.name} blur={talent.blurImages} /> : <div className="ph" />}
        {talent.blurImages && <span className="consent-note">🔒 Bilder folgen nach Freigabe</span>}
        <figcaption>{talent.name}</figcaption>
      </figure>
    </div>
  );
}

function Bio({ talent }: { talent: Talent }) {
  if (!talent.longBio.length) return null;
  return (
    <div className="panel bio-cols">
      <div>
        <SectionTag kana="自己紹介">Über</SectionTag>
        <h2 className="title">Wer ist<br /><span className="hl">{talent.name.split(' ')[0]}?</span></h2>
      </div>
      <div>
        {talent.longBio.map((para, i) => <p key={i} className="lead" style={{ marginBottom: 0 }}>{para}</p>)}
      </div>
    </div>
  );
}

function Stats({ stats }: { stats: TalentStat[] }) {
  return (
    <div className="stat-row">
      {stats.map((s) => <div key={s.label} className="stat-card"><b>{s.value}</b><span>{s.label}</span></div>)}
    </div>
  );
}

function Booking({ talent }: { talent: Talent }) {
  const first = talent.name.split(' ')[0];
  return (
    <div className="panel cta center-panel">
      <SectionTag kana="お仕事">Zusammenarbeit</SectionTag>
      <h2 className="title">Interesse an <span className="hl">{first}?</span></h2>
      <p className="lead">Für Booking-Anfragen, Kooperationen und Brand Deals — meld dich direkt bei uns.</p>
      <div className="btn-row">
        <PillButton href={`mailto:${talent.bookingEmail}?subject=${encodeURIComponent(`Booking Anfrage — ${talent.name}`)}`}>
          Booking anfragen
        </PillButton>
        <Link to="/#contact"><PillButton variant="ghost">Zur Agentur →</PillButton></Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="panel center-panel">
        <p className="tag">✦ 404</p>
        <h1 className="title">Nicht <span className="hl">gefunden.</span></h1>
        <p className="lead">Dieses Talent existiert (noch) nicht.</p>
        <div className="btn-row"><Link to="/"><PillButton>Zurück zur Startseite</PillButton></Link></div>
      </div>
    </div>
  );
}
