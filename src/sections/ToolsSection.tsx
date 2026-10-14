import { PRODUCTS } from '../data';
import FeatureItem from '../components/FeatureItem';
import { SectionTag } from '../components/SectionHeader';

export default function ToolsSection() {
  return (
    <section id="tools" className="scene scene--right">
      <div className="panel">
        <SectionTag kana="道具">Tools &amp; Products</SectionTag>
        <h2 className="title">Unser <span className="hl">Tool Lab</span></h2>

        {PRODUCTS.map((p) => (
          <article key={p.id} className="product">
            <div className="product-head">
              <span className="product-badge">{p.kind}</span>
              <h3>{p.name}</h3>
            </div>
            <p className="product-tag">{p.tagline}</p>
            <p>{p.desc}</p>
            <div className="features" style={{ marginTop: '1rem' }}>
              {p.features.map((f) => <FeatureItem key={f.title} {...f} />)}
            </div>
            <div className="btn-row" style={{ marginTop: '1.3rem' }}>
              <a className="btn" href={p.url} target="_blank" rel="noopener noreferrer">{p.name} öffnen ↗</a>
              <span className="product-url">{p.url.replace('https://', '')}</span>
            </div>
          </article>
        ))}
        <p className="hint">Klick das Moody-Fenster in der Szene</p>
      </div>
    </section>
  );
}
