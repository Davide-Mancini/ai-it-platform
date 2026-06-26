import { useState } from "react";
import "./Documents.css";

const EXT_COLOR = { pdf: "#DC2626", docx: "#2563EB", xlsx: "#059669" };

function formatDate(dt) {
  return dt ? new Date(dt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

function EditIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}

/* ── Modale lettura documento ──────────────────────────────────────────────── */
function DocModal({ doc, onClose }) {
  const ext = doc.file_type?.replace(".", "").toLowerCase() || "doc";
  const color = EXT_COLOR[ext] || "#475569";

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-doc-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-doc-modal__header">
          <div className="pai-doc-modal__header-left">
            <div className="pai-docs__ext-badge" style={{ color, background: `${color}14`, width: 42, height: 42, fontSize: 9, borderRadius: 10 }}>
              {ext.toUpperCase()}
            </div>
            <div>
              <div className="pai-doc-modal__title">{doc.title}</div>
              <div className="pai-doc-modal__meta">
                {ext.toUpperCase()} · Aggiornato il {formatDate(doc.updated_at || doc.created_at)}
              </div>
            </div>
          </div>
          <button className="pai-doc-modal__close" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>
        <div className="pai-doc-modal__body">
          {doc.content
            ? doc.content.split("\n").map((line, i) =>
                line.trim()
                  ? <p key={i} className="pai-doc-modal__paragraph">{line}</p>
                  : <div key={i} className="pai-doc-modal__spacer" />
              )
            : <p className="pai-doc-modal__empty">Nessun contenuto disponibile per questo documento.</p>
          }
        </div>
      </div>
    </div>
  );
}

/* ── Modale modifica documento ────────────────────────────────────────────── */
function EditModal({ doc, onClose, onSave }) {
  const [form, setForm] = useState({ title: doc.title, content: doc.content || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Il titolo è obbligatorio."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-doc-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-doc-edit-modal__header">
          <div>
            <div className="pai-doc-edit-modal__title">Modifica documento</div>
            <div className="pai-doc-edit-modal__sub">Aggiorna titolo e contenuto</div>
          </div>
          <button className="pai-doc-edit-modal__close" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>
        <div className="pai-doc-edit-modal__body">
          <div className="pai-field">
            <label className="pai-field__label">TITOLO *</label>
            <input
              className="pai-field__input"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="pai-field">
            <label className="pai-field__label">CONTENUTO</label>
            <textarea
              className="pai-field__textarea pai-doc-edit-modal__textarea"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={10}
            />
          </div>
          {error && <div className="pai-doc-edit-modal__error">{error}</div>}
          <div className="pai-doc-edit-modal__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
            <button className="pai-btn pai-btn--primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? "Salvataggio…" : "Salva modifiche"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modale conferma elimina ──────────────────────────────────────────────── */
function DeleteModal({ doc, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-doc-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-doc-delete-modal__icon">
          <TrashIcon size={22} />
        </div>
        <div className="pai-doc-delete-modal__title">Elimina documento</div>
        <div className="pai-doc-delete-modal__msg">
          Stai per eliminare <strong>"{doc.title}"</strong>.<br />
          Questa operazione è irreversibile.
        </div>
        <div className="pai-doc-delete-modal__actions">
          <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
          <button className="pai-doc-delete-modal__confirm" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Eliminazione…" : "Sì, elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principale ────────────────────────────────────────────────── */
export default function Documents({ documents, loading, isAdmin, onUpdateDocument, onDeleteDocument }) {
  const [selected, setSelected]   = useState(null);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [activeCat, setActiveCat] = useState("Tutte");

  const cats = ["Tutte", ...new Set(documents.map(d => d.file_type || "Altro").filter(Boolean))];
  const filtered = activeCat === "Tutte"
    ? documents
    : documents.filter(d => (d.file_type || "Altro") === activeCat);

  return (
    <div className="pai-view pai-docs">
      {/* Sidebar categorie */}
      <div className="pai-docs__sidebar">
        <div className="pai-card pai-docs__cats">
          <div className="pai-docs__cats-label">Categorie</div>
          {cats.map(cat => (
            <div
              key={cat}
              className={`pai-docs__cat-item${cat === activeCat ? " pai-docs__cat-item--active" : ""}`}
              onClick={() => setActiveCat(cat)}
            >
              <span>{cat}</span>
              <span className="pai-docs__cat-count">
                {cat === "Tutte" ? documents.length : documents.filter(d => (d.file_type || "Altro") === cat).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista documenti */}
      <div className="pai-docs__main">
        <div className="pai-card pai-docs__table">
          <div className="pai-docs__table-header">
            <span>Nome documento</span>
            <span className="pai-docs__col-type">Tipo</span>
            <span className="pai-docs__col-date">Aggiornato</span>
            <span>Azioni</span>
          </div>

          {loading && <div className="pai-docs__loading">Caricamento documenti…</div>}
          {!loading && filtered.length === 0 && <div className="pai-docs__empty">Nessun documento trovato.</div>}

          {filtered.map(doc => {
            const ext = doc.file_type?.replace(".", "").toLowerCase() || "doc";
            const color = EXT_COLOR[ext] || "#475569";
            return (
              <div key={doc.id} className="pai-docs__row" onClick={() => setSelected(doc)}>
                <div className="pai-docs__row-name">
                  <div className="pai-docs__ext-badge" style={{ color, background: `${color}14` }}>
                    {ext.toUpperCase()}
                  </div>
                  <div>
                    <div className="pai-docs__doc-title">{doc.title}</div>
                    <div className="pai-docs__doc-sub">{doc.content?.slice(0, 60) || "—"}</div>
                  </div>
                </div>
                <span className="pai-docs__row-type pai-docs__col-type">{ext.toUpperCase()}</span>
                <span className="pai-docs__row-date pai-docs__col-date">{formatDate(doc.updated_at || doc.created_at)}</span>

                {/* Azioni — stopPropagation per non aprire il modale di lettura */}
                <div className="pai-docs__row-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className={`pai-docs__action-btn${!isAdmin ? " pai-docs__action-btn--disabled" : ""}`}
                    title={isAdmin ? "Modifica" : "Solo gli amministratori possono modificare"}
                    onClick={() => isAdmin && setEditing(doc)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className={`pai-docs__action-btn pai-docs__action-btn--danger${!isAdmin ? " pai-docs__action-btn--disabled" : ""}`}
                    title={isAdmin ? "Elimina" : "Solo gli amministratori possono eliminare"}
                    onClick={() => isAdmin && setDeleting(doc)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <DocModal doc={selected} onClose={() => setSelected(null)} />}

      {editing && (
        <EditModal
          doc={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => onUpdateDocument(editing.id, data)}
        />
      )}

      {deleting && (
        <DeleteModal
          doc={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={async () => { await onDeleteDocument(deleting.id); setDeleting(null); }}
        />
      )}
    </div>
  );
}
