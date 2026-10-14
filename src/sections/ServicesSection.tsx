import { SERVICES } from '../data';
import PillButton from '../components/PillButton';
import { SectionTag } from '../components/SectionHeader';
import { serviceStore, useStore } from '../state/store';

export default function ServicesSection() {
  const active = useStore(serviceStore);
  const s = SERVICES[active];

  const pull = () => {
    let n = Math.floor(Math.random() * SERVICES.length);
    if (n === active) n = (n + 1) % SERVICES.length;
    serviceStore.set(n);
  };

  return (
    <section id="services" className="scene scene--left">
      <div className="panel">
        <SectionTag kana="ガチャ">Was wir bieten</SectionTag>
        <h2 className="title">Service <span className="hl">Gacha</span></h2>

        <div className="svc-card" key={s.num} aria-live="polite">
          <span className="svc-ico" aria-hidden>{s.icon}</span>
          <span className="svc-num">No. {s.num}</span>
          <h3>{s.title}</h3>
          <p>{s.desc}</p>
        </div>

        <div className="svc-chips">
          {SERVICES.map((x, i) => (
            <button key={x.num} className={`svc-chip ${i === active ? 'active' : ''}`} onClick={() => serviceStore.set(i)}>
              <i>{x.icon}</i>{x.title}
            </button>
          ))}
        </div>

        <PillButton onClick={pull}>🎰 Gacha ziehen</PillButton>
        <p className="hint">Oder klick die Kapseln im Automaten</p>
      </div>
    </section>
  );
}
