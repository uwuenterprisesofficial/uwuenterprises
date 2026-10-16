import { Link } from 'react-router-dom';
import { useTalents } from '../state/talents';
import PillButton from '../components/PillButton';
import { SectionTag } from '../components/SectionHeader';
import Pic from '../components/Pic';
import type { Talent } from '../types';

export default function TalentsSection() {
  const { list } = useTalents();
  return (
    <section id="talents" className="scene scene--right">
      <div className="panel">
        <SectionTag kana="ステージ">Unsere Talents</SectionTag>
        <h2 className="title">Das <span className="hl">Roster</span></h2>
        <p className="lead">
          Femboys, Cosplayer und Creator — jede Person ein eigener Charakter.
          Betritt die Bühne und lern sie kennen.
        </p>

        <div className="roster">
          {list.map((t) => <Row key={t.id} talent={t} />)}
        </div>

        <div className="btn-row">
          <PillButton href="#contact" variant="outline">Talent werden →</PillButton>
        </div>
        <p className="hint">Klick einen Bilderrahmen auf der Bühne</p>
      </div>
    </section>
  );
}

function Row({ talent }: { talent: Talent }) {
  const inner = (
    <>
      <div className="roster-thumb">
        {talent.thumb ?? talent.image ? <Pic src={talent.thumb ?? talent.image ?? ''} alt="" loading="lazy" blur={talent.blurImages} /> : '?'}
      </div>
      <div>
        <div className="roster-name">{talent.name}</div>
        <div className="roster-cat">{talent.category}</div>
      </div>
      <span className="roster-go">{talent.featured ? 'Profil →' : 'Bald ✦'}</span>
    </>
  );
  return talent.featured
    ? <Link to={`/talent/${talent.slug}`} className="roster-row">{inner}</Link>
    : <div className="roster-row is-soon">{inner}</div>;
}
