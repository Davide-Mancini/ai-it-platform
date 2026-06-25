import "./CreateModal.css";

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2M4.5 4.5l1.4 1.4M10.1 10.1l1.4 1.4M4.5 11.5l1.4-1.4M10.1 5.9l1.4-1.4" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function ChoiceCard({ icon, title, description, badge, onClick }) {
  return (
    <button className="hx-choice-card" onClick={onClick}>
      <div className="hx-choice-card__icon">{icon}</div>
      <div className="hx-choice-card__content">
        <div className="hx-choice-card__title">{title}</div>
        <div className="hx-choice-card__desc">{description}</div>
      </div>
      {badge && <span className="hx-choice-card__badge">{badge}</span>}
    </button>
  );
}

export default function CreateModal({ onManual, onAI, onClose }) {
  return (
    <>
      <div className="hx-modal-overlay" onClick={onClose} />
      <div className="hx-modal hx-create-modal" onClick={e => e.stopPropagation()}>
        <div className="hx-modal__header">
          <div className="hx-modal__title">Crea nuova procedura</div>
          <div className="hx-modal__subtitle">Scegli come creare la procedura</div>
        </div>
        <div className="hx-create-modal__choices">
          <ChoiceCard
            onClick={onManual}
            icon={
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                <line x1="5" y1="6" x2="11" y2="6" />
                <line x1="5" y1="9" x2="8" y2="9" />
              </svg>
            }
            title="Crea manualmente"
            description="Compila il modulo con titolo e descrizione della procedura"
          />
          <ChoiceCard
            onClick={onAI}
            icon={<SparkleIcon />}
            title="Genera con AI"
            description="Descrivi la procedura all'AI e lascia che la generi automaticamente con tutti gli step"
            badge="Gemini"
          />
        </div>
      </div>
    </>
  );
}
