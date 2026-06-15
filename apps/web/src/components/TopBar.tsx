import isotipoBlanco from '../assets/isotipo-blanco.svg';

export type View = 'display' | 'register';

export function TopBar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src={isotipoBlanco} alt="DevOpsDays Lima" />
        <div className="brand-word">
          DevOps<span className="g">Days</span> Lima
          <em>Sorteo · 26 Sep 2026</em>
        </div>
      </div>

      <div className="view-switch" role="tablist">
        <button className={view === 'display' ? 'active' : ''} onClick={() => onChange('display')}>
          <span>🖥</span> Pantalla Sorteo
        </button>
        <button className={view === 'register' ? 'active' : ''} onClick={() => onChange('register')}>
          <span>📱</span> Vista Registro
        </button>
      </div>

      <div className="topbar-meta">
        <span className="dot" /> En vivo
      </div>
    </header>
  );
}
