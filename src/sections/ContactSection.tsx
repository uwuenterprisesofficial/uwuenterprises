import { useState } from 'react';
import PillButton from '../components/PillButton';
import { SectionTag } from '../components/SectionHeader';
import { CONTACT_EMAIL } from '../data';

export default function ContactSection() {
  const [email, setEmail] = useState('');
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Anfrage von ${email || 'einer neuen Person'}`)}`;

  return (
    <section id="contact" className="scene scene--left">
      <div className="panel">
        <SectionTag kana="お手紙">Kontakt</SectionTag>
        <h2 className="title">Bereit fürs <span className="hl">Rampenlicht?</span></h2>
        <p className="lead">
          Ob du Femboy, Cosplayer, Creator oder Brand bist — schreib uns einen Brief.
          Wir freuen uns auf dich!
        </p>
        <div className="mail-form">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de" aria-label="Deine E-Mail"
          />
          <PillButton href={href}>Schreib uns 💌</PillButton>
        </div>
        <p className="mail-addr">{CONTACT_EMAIL}</p>
        <p className="hint">Oder klick den Brief über dem Dach</p>
      </div>
    </section>
  );
}
