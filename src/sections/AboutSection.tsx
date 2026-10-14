import { ABOUT_FEATURES } from '../data';
import FeatureItem from '../components/FeatureItem';
import { SectionTag } from '../components/SectionHeader';

export default function AboutSection() {
  return (
    <section id="about" className="scene scene--left">
      <div className="panel">
        <SectionTag kana="衣装部屋">Über uns</SectionTag>
        <h2 className="title">Mehr als eine <span className="hl">Agency.</span></h2>
        <p className="lead">
          UwU Enterprises ist eine Kreativ-Agentur für Femboys, Cosplayer und weitere Creator.
          Wir glauben an authentischen Content, echte Persönlichkeiten und mutige Kreativität —
          und wir verbinden Brands mit Menschen, die wirklich begeistern.
        </p>
        <div className="features">
          {ABOUT_FEATURES.map((f) => <FeatureItem key={f.title} {...f} />)}
        </div>
        <p className="hint">Klick ein Kleidungsstück — die Figur zieht es sofort an</p>
      </div>
    </section>
  );
}
