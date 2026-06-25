import "./CreateModal.css";

function SparkleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
      <path d="M19 2l.75 2.25L22 5l-2.25.75L19 8l-.75-2.25L16 5l2.25-.75L19 2z" />
    </svg>
  );
}
function PenIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ChoiceCard({ icon, title, desc, badge, onClick, accent }) {
  return (
    <div className="pai-choice-card" onClick={onClick} style={{ borderColor: accent ? "#E0E7FF" : "#E9EEF4" }}>
      <div className="pai-choice-card__icon" style={{ background: accent ? "#EEF2FF" : "#F8FAFC", color: accent ? "#6366F1" : "#475569" }}>
        {icon}
      </div>
      {badge && <span className="pai-choice-card__badge">{badge}</span>}
      <div className="pai-choice-card__title">{title}</div>
      <div className="pai-choice-card__desc">{desc}</div>
    </div>
  );
}

export default function CreateModal({ onManual, onAI, onClose }) {
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-create-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-create-modal__header">
          <div className="pai-create-modal__title">Nuova procedura</div>
          <div className="pai-create-modal__sub">Scegli come vuoi creare la procedura</div>
        </div>

        <div className="pai-create-modal__choices">
          <ChoiceCard
            icon={<PenIcon />}
            title="Crea manualmente"
            desc="Definisci titolo, descrizione e aggiunge gli step uno a uno."
            onClick={onManual}
          />
          <ChoiceCard
            icon={<SparkleIcon />}
            title="Genera con AI"
            desc="Descrivi la procedura in linguaggio naturale e l'AI la crea completa di step."
            badge="Gemini"
            accent
            onClick={onAI}
          />
        </div>
      </div>
    </div>
  );
}
