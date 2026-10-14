import { Link } from 'react-router-dom';
import PillButton from '../components/PillButton';

export default function NotFoundPage() {
  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="panel center-panel">
        <p className="tag">✦ 404 <span className="kana">迷子</span></p>
        <h1 className="title">Lost in the <span className="hl">Dreamland.</span></h1>
        <p className="lead">Diese Seite existiert nicht — aber das Roster schon.</p>
        <div className="btn-row">
          <Link to="/"><PillButton>Zurück zur Startseite</PillButton></Link>
        </div>
      </div>
    </div>
  );
}
