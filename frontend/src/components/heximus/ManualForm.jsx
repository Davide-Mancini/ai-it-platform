import "./ManualForm.css";

export default function ManualForm({ form, onChange, onSubmit, onClose, loading, error }) {
  return (
    <>
      <div className="hx-modal-overlay" onClick={onClose} />
      <div className="hx-modal hx-manual-form" onClick={e => e.stopPropagation()}>
        <div className="hx-modal__header hx-manual-form__header">
          <div>
            <div className="hx-modal__title">Nuova procedura</div>
            <div className="hx-modal__subtitle">Compila i campi per creare la procedura</div>
          </div>
          <button className="hx-manual-form__close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="hx-manual-form__body">
          <div className="hx-form-field">
            <label className="hx-form-field__label">TITOLO *</label>
            <input
              className="hx-form-field__input"
              value={form.title}
              onChange={e => onChange({ ...form, title: e.target.value })}
              placeholder="Es. Procedura di backup settimanale"
              onKeyDown={e => { if (e.key === "Enter") onSubmit(); }}
            />
          </div>

          <div className="hx-form-field">
            <label className="hx-form-field__label">DESCRIZIONE</label>
            <textarea
              className="hx-form-field__textarea"
              value={form.description}
              onChange={e => onChange({ ...form, description: e.target.value })}
              placeholder="Descrivi la procedura, i suoi obiettivi e il contesto…"
              rows={4}
            />
          </div>

          {error && <div className="hx-manual-form__error">{error}</div>}

          <div className="hx-manual-form__actions">
            <button className="hx-btn hx-btn--ghost" onClick={onClose}>Annulla</button>
            <button className="hx-btn hx-btn--primary" onClick={onSubmit} disabled={loading}>
              {loading ? "Creazione…" : "Crea procedura"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
