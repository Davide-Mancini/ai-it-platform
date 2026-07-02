import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./Documents.css";

const API_BASE  = "http://localhost:8000";
const ALL_CAT   = "__all__";
const EXT_COLOR = { pdf: "#DC2626", docx: "#2563EB", xlsx: "#059669", txt: "#475569" };

const CATEGORY_COLORS = [
  { bg: "#EFF6FF", color: "#2563EB" },
  { bg: "#F0FDF4", color: "#16A34A" },
  { bg: "#FEF3C7", color: "#D97706" },
  { bg: "#FDF4FF", color: "#9333EA" },
  { bg: "#FFF1F2", color: "#E11D48" },
];
function catColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}

function formatDate(dt) {
  return dt ? new Date(dt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "—";
}

/* ── Icons ──────────────────────────────────────────────────────────────────── */
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
function ShieldIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
    </svg>
  );
}
function FileIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
    </svg>
  );
}

/* ── Document view modal ─────────────────────────────────────────────────────── */
function DocModal({ doc, onClose }) {
  const { t } = useTranslation();
  const ext   = doc.file_type?.replace(".", "").toLowerCase() || "doc";
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
              <div className="pai-doc-modal__meta">{ext.toUpperCase()} · {t("documents.updated_on")} {formatDate(doc.updated_at || doc.created_at)}</div>
            </div>
          </div>
          <button className="pai-doc-modal__close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="pai-doc-modal__body">
          {doc.content
            ? doc.content.split("\n").map((line, i) =>
                line.trim() ? <p key={i} className="pai-doc-modal__paragraph">{line}</p> : <div key={i} className="pai-doc-modal__spacer" />
              )
            : <p className="pai-doc-modal__empty">{t("documents.no_content")}</p>
          }
        </div>
      </div>
    </div>
  );
}

function EditModal({ doc, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm]     = useState({ title: doc.title, content: doc.content || "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const handleSave = async () => {
    if (!form.title.trim()) { setError(t("documents.err_title")); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-doc-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-doc-edit-modal__header">
          <div>
            <div className="pai-doc-edit-modal__title">{t("documents.edit_title")}</div>
            <div className="pai-doc-edit-modal__sub">{t("documents.edit_sub")}</div>
          </div>
          <button className="pai-doc-edit-modal__close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="pai-doc-edit-modal__body">
          <div className="pai-field">
            <label className="pai-field__label">{t("documents.field_title")}</label>
            <input className="pai-field__input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="pai-field">
            <label className="pai-field__label">{t("documents.field_content")}</label>
            <textarea className="pai-field__textarea pai-doc-edit-modal__textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} />
          </div>
          {error && <div className="pai-doc-edit-modal__error">{error}</div>}
          <div className="pai-doc-edit-modal__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t("documents.cancel")}</button>
            <button className="pai-btn pai-btn--primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? t("documents.saving") : t("documents.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ doc, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const handleConfirm = async () => { setDeleting(true); try { await onConfirm(); } finally { setDeleting(false); } };
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-doc-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-doc-delete-modal__icon"><TrashIcon size={22} /></div>
        <div className="pai-doc-delete-modal__title">{t("documents.delete_title")}</div>
        <div className="pai-doc-delete-modal__msg">
          {t("procedures.delete_msg_part1")} <strong>"{doc.title}"</strong>.<br />{t("documents.delete_msg_irreversible")}
        </div>
        <div className="pai-doc-delete-modal__actions">
          <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t("documents.cancel")}</button>
          <button className="pai-doc-delete-modal__confirm" onClick={handleConfirm} disabled={deleting}>
            {deleting ? t("documents.deleting") : t("documents.delete_confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create policy modal ─────────────────────────────────────────────────────── */
function CreatePolicyModal({ token, documents, onClose, onCreated }) {
  const { t } = useTranslation();
  const [form, setForm]         = useState({ title: "", description: "", category: "", document_id: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [docSearch, setDocSearch] = useState("");

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(docSearch.toLowerCase())
  );
  const selectedDoc = documents.find(d => d.id === form.document_id);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setError(t("documents.err_policy_fields")); return;
    }
    if (!form.document_id) {
      setError(t("documents.err_policy_doc")); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/policy/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:       form.title.trim(),
          description: form.description.trim(),
          category:    form.category.trim(),
          document_id: form.document_id,
        }),
      });
      if (res.ok) {
        onCreated(await res.json());
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || t("documents.err_policy_create"));
      }
    } catch {
      setError(t("documents.err_network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-policy-form" onClick={e => e.stopPropagation()}>
        <div className="pai-policy-form__header">
          <div>
            <div className="pai-policy-form__title">{t("documents.create_policy_title")}</div>
            <div className="pai-policy-form__sub">{t("documents.create_policy_sub")}</div>
          </div>
          <button className="pai-doc-edit-modal__close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="pai-policy-form__body">
          <div className="pai-task-form__row">
            <div className="pai-field" style={{ flex: 2 }}>
              <label className="pai-field__label">{t("documents.field_title")}</label>
              <input
                className="pai-field__input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Es. Policy GDPR"
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="pai-field" style={{ flex: 1 }}>
              <label className="pai-field__label">{t("documents.field_category")}</label>
              <input
                className="pai-field__input"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Es. Privacy"
                disabled={loading}
              />
            </div>
          </div>

          <div className="pai-field">
            <label className="pai-field__label">{t("documents.field_description")}</label>
            <textarea
              className="pai-field__textarea"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              disabled={loading}
              placeholder="Breve descrizione della policy…"
            />
          </div>

          {/* Document selector */}
          <div className="pai-field">
            <label className="pai-field__label">{t("documents.field_linked_doc")}</label>

            {selectedDoc ? (
              <div className="pai-policy-form__selected-doc">
                <div className="pai-policy-form__selected-doc-left">
                  <FileIcon size={14} />
                  <span className="pai-policy-form__selected-doc-title">{selectedDoc.title}</span>
                  <span className="pai-policy-form__selected-doc-type">
                    {selectedDoc.file_type?.replace(".", "").toUpperCase() || "DOC"}
                  </span>
                </div>
                <button
                  className="pai-policy-form__deselect"
                  onClick={() => setForm(f => ({ ...f, document_id: "" }))}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <>
                <input
                  className="pai-field__input"
                  placeholder={t("documents.doc_search_placeholder")}
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                  disabled={loading}
                />
                <div className="pai-policy-form__doc-list">
                  {filteredDocs.length === 0 && (
                    <div className="pai-policy-form__doc-empty">
                      {documents.length === 0
                        ? t("documents.doc_no_docs")
                        : t("documents.doc_no_results")}
                    </div>
                  )}
                  {filteredDocs.map(doc => {
                    const ext   = doc.file_type?.replace(".", "").toLowerCase() || "doc";
                    const color = EXT_COLOR[ext] || "#475569";
                    return (
                      <div
                        key={doc.id}
                        className="pai-policy-form__doc-item"
                        onClick={() => { setForm(f => ({ ...f, document_id: doc.id })); setDocSearch(""); }}
                      >
                        <div className="pai-docs__ext-badge" style={{ color, background: `${color}14`, width: 28, height: 28, fontSize: 7.5, borderRadius: 6, flexShrink: 0 }}>
                          {ext.toUpperCase()}
                        </div>
                        <div className="pai-policy-form__doc-item-body">
                          <span className="pai-policy-form__doc-item-title">{doc.title}</span>
                          {doc.content && (
                            <span className="pai-policy-form__doc-item-preview">
                              {doc.content.slice(0, 80)}…
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {error && <div className="pai-task-form__error">{error}</div>}

          <div className="pai-task-form__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose} disabled={loading}>{t("documents.cancel")}</button>
            <button className="pai-btn pai-btn--primary" onClick={handleSubmit} disabled={loading}>
              {loading ? t("documents.creating") : t("documents.create_policy_btn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Policy detail modal ─────────────────────────────────────────────────────── */
function PolicyModal({ policy, linkedDoc, onClose }) {
  const { t } = useTranslation();
  const cc = catColor(policy.category);
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-doc-modal pai-policy-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-doc-modal__header">
          <div className="pai-doc-modal__header-left">
            <div className="pai-policy-modal__icon">
              <ShieldIcon />
            </div>
            <div>
              <div className="pai-doc-modal__title">{policy.title}</div>
              <div className="pai-doc-modal__meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pai-policy-row__cat" style={{ color: cc.color, background: cc.bg, fontSize: 10 }}>
                  {policy.category}
                </span>
                <span>·</span>
                <span className={`pai-policy-row__status${policy.is_active ? " pai-policy-row__status--active" : ""}`} style={{ fontSize: 10 }}>
                  {policy.is_active ? t("documents.policy_active") : t("documents.policy_inactive")}
                </span>
                <span>·</span>
                <span>{t("documents.policy_created_on")} {formatDate(policy.created_at)}</span>
              </div>
            </div>
          </div>
          <button className="pai-doc-modal__close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="pai-doc-modal__body">
          <div className="pai-policy-modal__section">
            <div className="pai-policy-modal__section-label">{t("documents.policy_description")}</div>
            <p className="pai-doc-modal__paragraph">{policy.description}</p>
          </div>

          <div className="pai-policy-modal__section">
            <div className="pai-policy-modal__section-label">{t("documents.policy_linked_doc")}</div>
            {linkedDoc ? (
              <>
                <div className="pai-policy-modal__doc-header">
                  {(() => {
                    const ext   = linkedDoc.file_type?.replace(".", "").toLowerCase() || "doc";
                    const color = EXT_COLOR[ext] || "#475569";
                    return (
                      <div className="pai-docs__ext-badge" style={{ color, background: `${color}14`, width: 32, height: 32, fontSize: 7.5, borderRadius: 7 }}>
                        {ext.toUpperCase()}
                      </div>
                    );
                  })()}
                  <div>
                    <div className="pai-policy-modal__doc-title">{linkedDoc.title}</div>
                    <div className="pai-policy-modal__doc-meta">{t("documents.updated_on")} {formatDate(linkedDoc.updated_at || linkedDoc.created_at)}</div>
                  </div>
                </div>
                {linkedDoc.content ? (
                  <div className="pai-policy-modal__doc-content">
                    {linkedDoc.content.split("\n").map((line, i) =>
                      line.trim()
                        ? <p key={i} className="pai-doc-modal__paragraph">{line}</p>
                        : <div key={i} className="pai-doc-modal__spacer" />
                    )}
                  </div>
                ) : (
                  <p className="pai-doc-modal__empty" style={{ textAlign: "left", padding: "12px 0 0" }}>
                    {t("documents.policy_no_doc_content")}
                  </p>
                )}
              </>
            ) : (
              <p className="pai-doc-modal__empty" style={{ textAlign: "left", padding: "12px 0 0" }}>
                {t("documents.policy_no_linked_doc")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Policy row ──────────────────────────────────────────────────────────────── */
function PolicyRow({ policy, documents, onSelect }) {
  const { t } = useTranslation();
  const cc        = catColor(policy.category);
  const linkedDoc = documents.find(d => d.id === policy.document_id);
  return (
    <div className="pai-policy-row" onClick={() => onSelect(policy, linkedDoc)} style={{ cursor: "pointer" }}>
      <div className="pai-policy-row__body">
        <div className="pai-policy-row__title">{policy.title}</div>
        <div className="pai-policy-row__desc">{policy.description}</div>
      </div>
      <span className="pai-policy-row__cat" style={{ color: cc.color, background: cc.bg }}>
        {policy.category}
      </span>
      <div className="pai-policy-row__doc">
        {linkedDoc
          ? <span className="pai-policy-row__doc-badge">
              <FileIcon />
              {linkedDoc.title.length > 32 ? linkedDoc.title.slice(0, 32) + "…" : linkedDoc.title}
            </span>
          : <span className="pai-policy-row__doc-badge pai-policy-row__doc-badge--none">{t("documents.policy_no_doc")}</span>
        }
      </div>
      <span className="pai-policy-row__date text-center">{formatDate(policy.created_at)}</span>
      <span className={`pai-policy-row__status${policy.is_active ? " pai-policy-row__status--active" : ""}`}>
        {policy.is_active ? t("documents.policy_active") : t("documents.policy_inactive")}
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function Documents({ documents, loading, isAdmin, token, onUpdateDocument, onDeleteDocument }) {
  const { t } = useTranslation();
  const [tab, setTab]       = useState("documents");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeCat, setActiveCat] = useState(ALL_CAT);

  const [policies, setPolicies]         = useState([]);
  const [loadingPolicies, setLoadingP]  = useState(true);
  const [showCreatePolicy, setShowCP]   = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null); // { policy, linkedDoc }

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/policy/?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setPolicies(data))
      .catch(() => {})
      .finally(() => setLoadingP(false));
  }, [token]);

  const ALL_LABEL = t("documents.all_categories");
  const cats     = [ALL_CAT, ...new Set(documents.map(d => d.file_type || "Altro").filter(Boolean))];
  const filtered = activeCat === ALL_CAT ? documents : documents.filter(d => (d.file_type || "Altro") === activeCat);

  return (
    <div className="pai-view pai-docs-wrapper">

      {/* ── Tab bar ── */}
      <div className="pai-docs-tabs">
        <button
          className={`pai-docs-tab${tab === "documents" ? " pai-docs-tab--active" : ""}`}
          onClick={() => setTab("documents")}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          {t("documents.tab_docs")}
          <span className="pai-docs-tab__count">{documents.length}</span>
        </button>
        <button
          className={`pai-docs-tab${tab === "policies" ? " pai-docs-tab--active" : ""}`}
          onClick={() => setTab("policies")}
        >
          <ShieldIcon />
          <span style={{ marginLeft: 6 }}>{t("documents.tab_policies")}</span>
          <span className="pai-docs-tab__count">{policies.length}</span>
        </button>
      </div>

      {/* ── Documenti tab ── */}
      {tab === "documents" && (
        <div className="pai-docs">
          <div className="pai-docs__sidebar">
            <div className="pai-card pai-docs__cats">
              <div className="pai-docs__cats-label">{t("documents.categories")}</div>
              {cats.map(cat => (
                <div
                  key={cat}
                  className={`pai-docs__cat-item${cat === activeCat ? " pai-docs__cat-item--active" : ""}`}
                  onClick={() => setActiveCat(cat)}
                >
                  <span>{cat === ALL_CAT ? ALL_LABEL : cat}</span>
                  <span className="pai-docs__cat-count">
                    {cat === ALL_CAT ? documents.length : documents.filter(d => (d.file_type || "Altro") === cat).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pai-docs__main">
            <div className="pai-card pai-docs__table">
              <div className="pai-docs__table-header">
                <span>{t("documents.col_name")}</span>
                <span className="pai-docs__col-type">{t("documents.col_type")}</span>
                <span className="pai-docs__col-date">{t("documents.col_updated")}</span>
                <span>{t("documents.col_actions")}</span>
              </div>
              {loading && <div className="pai-docs__loading">{t("documents.loading")}</div>}
              {!loading && filtered.length === 0 && <div className="pai-docs__empty">{t("documents.empty")}</div>}
              {filtered.map(doc => {
                const ext   = doc.file_type?.replace(".", "").toLowerCase() || "doc";
                const color = EXT_COLOR[ext] || "#475569";
                return (
                  <div key={doc.id} className="pai-docs__row" onClick={() => setSelected(doc)}>
                    <div className="pai-docs__row-name">
                      <div className="pai-docs__ext-badge" style={{ color, background: `${color}14` }}>{ext.toUpperCase()}</div>
                      <div>
                        <div className="pai-docs__doc-title">{doc.title}</div>
                        <div className="pai-docs__doc-sub">{doc.content?.slice(0, 60) || "—"}</div>
                      </div>
                    </div>
                    <span className="pai-docs__row-type pai-docs__col-type">{ext.toUpperCase()}</span>
                    <span className="pai-docs__row-date pai-docs__col-date">{formatDate(doc.updated_at || doc.created_at)}</span>
                    <div className="pai-docs__row-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className={`pai-docs__action-btn${!isAdmin ? " pai-docs__action-btn--disabled" : ""}`}
                        title={isAdmin ? t("common.edit") : t("documents.admin_only_edit")}
                        onClick={() => isAdmin && setEditing(doc)}
                      ><EditIcon /></button>
                      <button
                        className={`pai-docs__action-btn pai-docs__action-btn--danger${!isAdmin ? " pai-docs__action-btn--disabled" : ""}`}
                        title={isAdmin ? t("common.delete") : t("documents.admin_only_delete")}
                        onClick={() => isAdmin && setDeleting(doc)}
                      ><TrashIcon /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Policy tab ── */}
      {tab === "policies" && (
        <div className="pai-docs">
          <div className="pai-docs__main" style={{ width: "100%" }}>
            <div className="pai-card pai-docs__table">
              <div className="pai-policy-list-header">
                <div className="pai-policy-list-header__left">
                  <ShieldIcon />
                  <span>{t("documents.policy_list_title")}</span>
                  <span className="pai-kanban-col__count" style={{ marginLeft: 6 }}>{policies.length}</span>
                </div>
                {isAdmin && (
                  <button className="pai-btn pai-btn--primary pai-btn--sm" onClick={() => setShowCP(true)}>
                    <PlusIcon /> {t("documents.policy_new_btn")}
                  </button>
                )}
              </div>

              <div className="pai-policy-table-header">
                <span>{t("documents.policy_col_title")}</span>
                <span className="text-center">{t("documents.policy_col_category")}</span>
                <span className="text-center">{t("documents.policy_col_doc")}</span>
                <span className="text-center">{t("documents.policy_col_date")}</span>
                <span className="text-center">{t("documents.policy_col_status")}</span>
              </div>

              {loadingPolicies && <div className="pai-docs__loading">{t("documents.policy_loading")}</div>}
              {!loadingPolicies && policies.length === 0 && (
                <div className="pai-docs__empty">
                  {isAdmin ? t("documents.policy_empty_admin") : t("documents.policy_empty")}
                </div>
              )}
              {policies.map(p => (
                <PolicyRow
                  key={p.id}
                  policy={p}
                  documents={documents}
                  onSelect={(pol, doc) => setSelectedPolicy({ policy: pol, linkedDoc: doc })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

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
      {showCreatePolicy && (
        <CreatePolicyModal
          token={token}
          documents={documents}
          onClose={() => setShowCP(false)}
          onCreated={(policy) => setPolicies(prev => [policy, ...prev])}
        />
      )}
      {selectedPolicy && (
        <PolicyModal
          policy={selectedPolicy.policy}
          linkedDoc={selectedPolicy.linkedDoc}
          onClose={() => setSelectedPolicy(null)}
        />
      )}
    </div>
  );
}
