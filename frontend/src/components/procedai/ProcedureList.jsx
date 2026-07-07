import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Pager from "./Pager";
import "./ProcedureList.css";

function Icon({ path, size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

/* ── Kebab menu ──────────────────────────────────────────────────────────── */
function KebabMenu({ isAdmin, onEdit, onDelete }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="pai-proc-menu" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        className="pai-proc-menu__trigger"
        onClick={() => setOpen(v => !v)}
        title={t("procedures.options_title")}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <circle cx={12} cy={5}  r={1.5} />
          <circle cx={12} cy={12} r={1.5} />
          <circle cx={12} cy={19} r={1.5} />
        </svg>
      </button>

      {open && (
        <div className="pai-proc-menu__dropdown">
          <button
            className={`pai-proc-menu__item${!isAdmin ? " pai-proc-menu__item--disabled" : ""}`}
            onClick={() => { if (isAdmin) { setOpen(false); onEdit(); } }}
            disabled={!isAdmin}
            title={!isAdmin ? t("procedures.admin_only_edit") : undefined}
          >
            <Icon path="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={13} />
            {t("procedures.edit_menu")}
            {!isAdmin && <span className="pai-proc-menu__lock">🔒</span>}
          </button>
          <button
            className={`pai-proc-menu__item pai-proc-menu__item--danger${!isAdmin ? " pai-proc-menu__item--disabled" : ""}`}
            onClick={() => { if (isAdmin) { setOpen(false); onDelete(); } }}
            disabled={!isAdmin}
            title={!isAdmin ? t("procedures.admin_only_delete") : undefined}
          >
            <Icon path="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" size={13} />
            {t("procedures.delete_menu")}
            {!isAdmin && <span className="pai-proc-menu__lock">🔒</span>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Modale modifica ─────────────────────────────────────────────────────── */
function EditModal({ procedure, onClose, onSave, saving, error }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: procedure.title, description: procedure.description || "" });

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-proc-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-proc-edit-modal__header">
          <div>
            <div className="pai-proc-edit-modal__title">{t("procedures.edit_title")}</div>
            <div className="pai-proc-edit-modal__sub">{t("procedures.edit_sub")}</div>
          </div>
          <button className="pai-proc-edit-modal__close" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>
        <div className="pai-proc-edit-modal__body">
          <div className="pai-field">
            <label className="pai-field__label">{t("procedures.field_title")}</label>
            <input
              className="pai-field__input"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="pai-field">
            <label className="pai-field__label">{t("procedures.field_desc")}</label>
            <textarea
              className="pai-field__textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>
          {error && <div className="pai-proc-edit-modal__error">{error}</div>}
          <div className="pai-proc-edit-modal__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t("procedures.cancel")}</button>
            <button className="pai-btn pai-btn--primary" onClick={() => onSave(form)} disabled={saving || !form.title.trim()}>
              {saving ? t("procedures.saving") : t("procedures.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modale conferma elimina ─────────────────────────────────────────────── */
function DeleteModal({ procedure, onClose, onConfirm, deleting }) {
  const { t } = useTranslation();
  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-proc-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-proc-delete-modal__icon">
          <Icon path="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" size={22} color="#DC2626" />
        </div>
        <div className="pai-proc-delete-modal__title">{t("procedures.delete_title")}</div>
        <div className="pai-proc-delete-modal__msg">
          {t("procedures.delete_msg_part1")} <strong>"{procedure.title}"</strong>.<br />
          {t("procedures.delete_msg_part2")}
        </div>
        <div className="pai-proc-delete-modal__actions">
          <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t("procedures.cancel")}</button>
          <button className="pai-proc-delete-modal__confirm" onClick={onConfirm} disabled={deleting}>
            {deleting ? t("procedures.deleting") : t("procedures.delete_confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principale ───────────────────────────────────────────────── */
export default function ProcedureList({ browse, search, onSearchChange, onPageChange, isAdmin, onProcedureClick, onCreateClick, onEditProcedure, onDeleteProcedure }) {
  const { t } = useTranslation();
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState("");

  const filtered = browse.items;

  const formatDate = (dt) => dt
    ? new Date(dt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const handleSave = async (form) => {
    setSaving(true);
    setEditError("");
    try {
      await onEditProcedure(editTarget.id, form);
      setEditTarget(null);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteProcedure(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pai-view">
      {/* Toolbar */}
      <div className="pai-proc-list__toolbar">
        <div className="pai-proc-list__search-wrap">
          <svg className="pai-proc-list__search-icon" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            className="pai-proc-list__search"
            placeholder={t("procedures.search_placeholder")}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <button className="pai-btn pai-btn--primary" onClick={onCreateClick}>
          <Icon path="M12 5v14M5 12h14" size={15} color="white" />
          {t("procedures.new_btn")}
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="pai-proc-list__empty">
          <div className="pai-proc-list__empty-icon">
            <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={32} color="#CBD5E1" />
          </div>
          <div className="pai-proc-list__empty-title">{t("procedures.empty_title")}</div>
          <div className="pai-proc-list__empty-sub">{t("procedures.empty_sub")}</div>
          <button className="pai-btn pai-btn--primary" onClick={onCreateClick} style={{ marginTop: 16 }}>
            <Icon path="M12 5v14M5 12h14" size={15} color="white" />
            {t("procedures.create_btn")}
          </button>
        </div>
      ) : (
        <div className="pai-proc-list__grid">
          {filtered.map(p => (
            <div
              key={p.id}
              className="pai-card pai-proc-card"
              onClick={() => onProcedureClick(p.id)}
            >
              <div className="pai-proc-card__top">
                <span className="pai-chip" style={{ color: "#475569", background: "#F1F5F9" }}>{t("procedures.tag")}</span>
                <span className="pai-chip" style={{ color: "#059669", background: "#ECFDF5" }}>{t("procedures.tag_active")}</span>
                <div style={{ flex: 1 }} />
                <KebabMenu
                  isAdmin={isAdmin}
                  onEdit={() => { setEditTarget(p); setEditError(""); }}
                  onDelete={() => setDeleteTarget(p)}
                />
              </div>

              <div className="pai-proc-card__title">{p.title}</div>
              {p.description && <div className="pai-proc-card__desc">{p.description}</div>}

              <div className="pai-proc-card__footer">
                <span className="pai-proc-card__date">{formatDate(p.created_at)}</span>
                <span className="pai-proc-card__arrow">
                  <Icon path="M9 18l6-6-6-6" size={14} color="#94A3B8" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pager
          page={browse.page}
          pageSize={browse.pageSize}
          total={browse.total}
          onPageChange={onPageChange}
        />
      )}

      {editTarget && (
        <EditModal
          procedure={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
          saving={saving}
          error={editError}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          procedure={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
