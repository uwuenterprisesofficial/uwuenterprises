import PillButton from '../components/PillButton';
import { STATS } from '../data';

const RIBBON = ['FEMBOYS', 'COSPLAY', 'CREATORS', 'STREAMING', 'MODELS', 'UWU'];

export default function HeroSection() {
  const items = [...RIBBON, ...RIBBON, ...RIBBON, ...RIBBON];
  return (
    <section id="top" className="scene scene--left scene--hero">
      <div className="hero-copy">
        <p className="tag">✦ Femboy · Cosplay · Creator Agency <span className="kana">Est. 2024</span></p>
        <h1 className="hero-h1">
          UwU<br /><em>Enter</em>prises
          <small>~ where talent gets dressed up ~</small>
        </h1>
        <p className="lead">
          Wir repräsentieren Femboys, Cosplayer und Creator im deutschsprachigen Raum —
          entdecken, fördern und bringen sie ins Rampenlicht.
        </p>
        <div className="btn-row">
          <PillButton href="#talents">Unsere Talents</PillButton>
          <PillButton href="#contact" variant="ghost">Talent werden</PillButton>
        </div>
        <div className="chips" aria-label="Fakten">
          {STATS.map((s) => <span key={s.label} className="chip"><b>{s.num}</b>{s.label}</span>)}
        </div>
        <p className="hint">Klick die Figur: neues Outfit · Scroll: weiterfliegen</p>
      </div>

      <div className="scroll-cue" aria-hidden><span>Scroll</span><i>↓</i></div>
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {items.map((t, i) => <span key={i}>{t} ✦</span>)}
          {items.map((t, i) => <span key={`b${i}`}>{t} ✦</span>)}
        </div>
      </div>
    </section>
  );
}
