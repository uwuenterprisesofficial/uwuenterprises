import { STUDIO } from '../data';
import PillButton from '../components/PillButton';
import FeatureItem from '../components/FeatureItem';
import { SectionTag } from '../components/SectionHeader';

export default function StudioSection() {
  return (
    <section id="studio" className="scene scene--right">
      <div className="panel">
        <SectionTag kana="撮影所">Fotostudio</SectionTag>
        <h2 className="title">Das <span className="hl">Studio</span></h2>
        <figure className="studio-photo">
          <img src="/studio.jpg" alt="Unser Fotostudio mit Lichtstativen, Softbox und Hintergrund" loading="lazy" />
          <figcaption>Unser Studio ✦</figcaption>
        </figure>
        <p className="lead">{STUDIO.sub}</p>
        <div className="features features--grid">
          {STUDIO.features.map((f) => <FeatureItem key={f.title} {...f} />)}
        </div>
        <p className="note">{STUDIO.bookingNote}</p>
        <div className="btn-row" style={{ marginTop: '1.2rem' }}>
          <PillButton href="#contact" variant="outline">Studio buchen →</PillButton>
        </div>
        <p className="hint">Klick die Kamera: 📸 Foto knipsen</p>
      </div>
    </section>
  );
}
