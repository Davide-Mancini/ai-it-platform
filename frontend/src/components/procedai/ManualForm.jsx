import "./ManualForm.css";

export default function ManualForm({ form, onChange, onSubmit, onClose, loading, error }) {
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-manual-form" onClick={e => e.stopPropagation()}>
        <div className="pai-manual-form__header">
          <div>
            <div className="pai-manual-form__title">Nuova procedura</div>
            <div className="pai-manual-form__sub">Compila i campi per creare la procedura</div>
          </div>
          <button className="pai-manual-form__close" onClick={onClose}>
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-manual-form__body">
          <div className="pai-field">
            <label className="pai-field__label">TITOLO *</label>
            <input
              className="pai-field__input"
              value={form.title}
              onChange={e => onChange({ ...form, title: e.target.value })}
              placeholder="Es. Procedura di onboarding cliente"
              onKeyDown={e => { if (e.key === "Enter") onSubmit(); }}
              autoFocus
            />
          </div>

          <div className="pai-field">
            <label className="pai-field__label">DESCRIZIONE</label>
            <textarea
              className="pai-field__textarea"
              value={form.description}
              onChange={e => onChange({ ...form, description: e.target.value })}
              placeholder="Descrivi la procedura, i suoi obiettivi e il contesto…"
              rows={4}
            />
          </div>

          {error && <div className="pai-manual-form__error">{error}</div>}

          <div className="pai-manual-form__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
            <button className="pai-btn pai-btn--primary" onClick={onSubmit} disabled={loading}>
              {loading ? "Creazione…" : "Crea procedura"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
