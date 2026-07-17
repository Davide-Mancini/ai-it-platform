import "../../style/ManualForm.css";
import { useTranslation } from "react-i18next";
export default function ManualForm({ form, onChange, onSubmit, onClose, loading, error, customers = [] }) {
  const {t} = useTranslation();
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-manual-form" onClick={e => e.stopPropagation()}>
        <div className="pai-manual-form__header">
          <div>
            <div className="pai-manual-form__title">{t("procedures.modal_title")}</div>
            <div className="pai-manual-form__sub">{t("procedures.modal_sub2")}</div>
          </div>
          <button className="pai-manual-form__close" onClick={onClose}>
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-manual-form__body">
          <div className="pai-field">
            <label className="pai-field__label">{t("procedures.input_title")}</label>
            <input
              className="pai-field__input"
              value={form.title}
              onChange={e => onChange({ ...form, title: e.target.value })}
              placeholder={t("procedures.input_title_placeholder")}
              onKeyDown={e => { if (e.key === "Enter") onSubmit(); }}
              autoFocus
            />
          </div>

          <div className="pai-field">
            <label className="pai-field__label">{t("procedures.input_desc")}</label>
            <textarea
              className="pai-field__textarea"
              value={form.description}
              onChange={e => onChange({ ...form, description: e.target.value })}
              placeholder={t("procedures.input_desc_placeholder")}
              rows={4}
            />
          </div>

          {customers.length > 0 && (
            <div className="pai-field">
              <label className="pai-field__label">Cliente (opzionale)</label>
              <select
                className="pai-field__select"
                value={form.customer_id || ""}
                onChange={e => onChange({ ...form, customer_id: e.target.value || null })}
              >
                <option value="">Nessun cliente collegato</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="pai-manual-form__error">{error}</div>}

          <div className="pai-manual-form__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t("procedures.close_btn")}</button>
            <button className="pai-btn pai-btn--primary" onClick={onSubmit} disabled={loading}>
              {loading ? t("procedures.creating") : t("procedures.create_btn2")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
