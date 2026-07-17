import { useState } from "react";
import "../../style/UsersPage.css";
import "../../style/CustomersPage.css";

function CustomerFormModal({ customer, onClose, onSave, saving, error }) {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    name:        customer?.name || "",
    vat_number:  customer?.vat_number || "",
    email:       customer?.email || "",
    notes:       customer?.notes || "",
    is_active:   customer?.is_active ?? true,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-users__edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-users__edit-header">
          <div>
            <div className="pai-users__edit-title">{isEdit ? "Modifica cliente" : "Nuovo cliente"}</div>
            <div className="pai-users__edit-sub">{isEdit ? customer.name : "Anagrafica azienda cliente"}</div>
          </div>
          <button className="pai-users__close-btn" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-users__edit-body">
          <div className="pai-field">
            <label className="pai-field__label">Nome azienda</label>
            <input className="pai-field__input" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>

          <div className="pai-users__edit-row">
            <div className="pai-field">
              <label className="pai-field__label">Partita IVA</label>
              <input className="pai-field__input" value={form.vat_number} onChange={e => set("vat_number", e.target.value)} />
            </div>
            <div className="pai-field">
              <label className="pai-field__label">Email</label>
              <input className="pai-field__input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
          </div>

          <div className="pai-field">
            <label className="pai-field__label">Note</label>
            <textarea
              className="pai-email-modal__textarea"
              style={{ minHeight: 80 }}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
            />
          </div>

          {isEdit && (
            <div className="pai-users__active-row">
              <div>
                <div className="pai-users__active-label">Stato cliente</div>
                <div className="pai-users__active-sub">
                  {form.is_active ? "Cliente attivo" : "Cliente disattivato"}
                </div>
              </div>
              <button
                type="button"
                className={`pai-users__toggle${form.is_active ? " pai-users__toggle--on" : ""}`}
                onClick={() => set("is_active", !form.is_active)}
              >
                <span className="pai-users__toggle-knob" />
              </button>
            </div>
          )}

          {error && <div className="pai-users__edit-error">{error}</div>}

          <div className="pai-users__edit-actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
            <button
              className="pai-btn pai-btn--primary"
              disabled={saving || !form.name.trim()}
              onClick={() => onSave(form)}
            >
              {saving ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteCustomerModal({ customer, onClose, onConfirm, deleting }) {
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-proc-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-proc-delete-modal__title">Eliminare questo cliente?</div>
        <div className="pai-proc-delete-modal__msg">
          Stai per eliminare <strong>"{customer.name}"</strong>. Le procedure collegate resteranno, ma perderanno il riferimento al cliente.
        </div>
        <div className="pai-proc-delete-modal__actions">
          <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
          <button className="pai-proc-delete-modal__confirm" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Eliminazione…" : "Elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage({ customers, loading, onCreate, onSave, onDelete }) {
  const [creating, setCreating]     = useState(false);
  const [editingCustomer, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [formError, setFormError]   = useState("");

  const handleSave = async (form) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingCustomer) {
        await onSave(editingCustomer.id, form);
        setEditing(null);
      } else {
        await onCreate(form);
        setCreating(false);
      }
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pai-view">
      <div className="pai-users__toolbar">
        <div>
          <div className="pai-users__title">Clienti</div>
          <div className="pai-users__sub">{customers.length} aziende registrate</div>
        </div>
        <div className="pai-users__toolbar-right">
          <button className="pai-users__send-btn" onClick={() => { setCreating(true); setFormError(""); }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
            </svg>
            Nuovo cliente
          </button>
        </div>
      </div>

      <div className="pai-card pai-users__table-wrap">
        {loading ? (
          <div className="pai-users__loading">Caricamento…</div>
        ) : customers.length === 0 ? (
          <div className="pai-users__empty">Nessun cliente registrato</div>
        ) : (
          <table className="pai-users__table">
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Partita IVA</th>
                <th>Email</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="pai-users__name">{c.name}</td>
                  <td>{c.vat_number || "—"}</td>
                  <td className="pai-users__email">{c.email || "—"}</td>
                  <td>
                    <span className="pai-chip" style={{
                      color: c.is_active ? "#059669" : "#FD2828",
                      background: c.is_active ? "#ECFDF5" : "#FDF2F2",
                      fontSize: 11,
                    }}>
                      {c.is_active ? "Attivo" : "Disattivo"}
                    </span>
                  </td>
                  <td className="pai-customers__actions">
                    <button className="pai-users__edit-btn" onClick={() => { setEditing(c); setFormError(""); }}>
                      Modifica
                    </button>
                    <button className="pai-customers__delete-btn" onClick={() => setDeleteTarget(c)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <CustomerFormModal
          onClose={() => setCreating(false)}
          onSave={handleSave}
          saving={saving}
          error={formError}
        />
      )}

      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
          error={formError}
        />
      )}

      {deleteTarget && (
        <DeleteCustomerModal
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
