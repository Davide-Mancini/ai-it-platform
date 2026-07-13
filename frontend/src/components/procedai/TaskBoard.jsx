import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../../style/TaskBoard.css";

function getPriorities(t) {
  return [
    { id: "low",      label: t("tasks.priority_low"),      color: "#64748B", bg: "#F1F5F9" },
    { id: "medium",   label: t("tasks.priority_medium"),   color: "#2563EB", bg: "#EFF6FF" },
    { id: "high",     label: t("tasks.priority_high"),     color: "#D97706", bg: "#FEF3C7" },
    { id: "critical", label: t("tasks.priority_critical"), color: "#DC2626", bg: "#FEF2F2" },
  ];
}

function getCols(t) {
  return [
    { id: "pending",             label: t("tasks.col_pending"),             dot: "#94A3B8" },
    { id: "in_progress",         label: t("tasks.col_in_progress"),         dot: "#2563EB" },
    { id: "clarification_needed", label: t("tasks.col_clarification_needed"), dot: "#D97706" },
    { id: "done",                label: t("tasks.col_done"),                dot: "#059669" },
  ];
}

function slugifyFieldLabel(label, index) {
  const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug ? `field_${index}_${slug}` : `field_${index}`;
}

function PriorityBadge({ priority, onChangePriority, canManage = true }) {
  const { t } = useTranslation();
  const PRIORITIES = getPriorities(t);
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const cfg = PRIORITIES.find(p => p.id === priority) || PRIORITIES[0];

  if (!canManage) {
    return (
      <span className="pai-task-priority" style={{ color: cfg.color, background: cfg.bg }}>
        {cfg.label}
      </span>
    );
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <>
      <span
        ref={ref}
        className="pai-task-priority pai-task-priority--clickable"
        style={{ color: cfg.color, background: cfg.bg }}
        onClick={handleClick}
        title={t("tasks.change_priority")}
      >
        {cfg.label}
        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ marginLeft: 3 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>

      {open && createPortal(
        <div
          className="pai-priority-dropdown"
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          {PRIORITIES.map(p => (
            <div
              key={p.id}
              className={`pai-priority-dropdown__item${p.id === priority ? " pai-priority-dropdown__item--active" : ""}`}
              onClick={() => { onChangePriority(p.id); setOpen(false); }}
            >
              <span className="pai-priority-dropdown__dot" style={{ background: p.color }} />
              {p.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function UserAvatar({ user, onRemove }) {
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`pai-task-avatar${onRemove ? " pai-task-avatar--removable" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {initials}
      {hovered && (
        <div className="pai-task-avatar__tooltip">
          {user.first_name} {user.last_name}
        </div>
      )}
      {onRemove && (
        <button
          className="pai-task-avatar__remove"
          onClick={e => { e.stopPropagation(); onRemove(); }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function AssignDropdown({ task, users, onAssign }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const assignedIds = new Set((task.assigned_users || []).map(u => u.id));
  // Un customer non va assegnato come "responsabile interno": interagisce col task
  // tramite il flag requires_customer_input, non tramite l'assegnazione da workload
  const unassigned = users.filter(u => !assignedIds.has(u.id) && u.role !== "Customer");

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="pai-assign-wrap">
      <button
        ref={btnRef}
        className="pai-task-card__assign-btn"
        onClick={handleOpen}
        title={t("tasks.assign_user")}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
        </svg>
      </button>

      {open && createPortal(
        <div
          className="pai-assign-dropdown"
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          {unassigned.length > 0 ? (
            unassigned.map(u => (
              <div
                key={u.id}
                className="pai-assign-dropdown__item pai-assign-dropdown__item--add"
                onClick={() => { onAssign(task.id, u.id); setOpen(false); }}
              >
                {u.first_name} {u.last_name}
              </div>
            ))
          ) : (
            <div className="pai-assign-dropdown__empty">{t("tasks.all_assigned")}</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function TaskCard({ task, procedures, colId, onStatusChange, onPriorityChange, isAdmin, canManage = true, users, onAssignUser, onUnassignUser, onSubmitResponse }) {
  const { t } = useTranslation();
  const proc = procedures.find(p => p.id === task.procedure_id);
  const fields = (task.required_fields && task.required_fields.length > 0)
    ? task.required_fields
    : [{ key: "response", label: task.title }];
  const existingData = task.customer_response_data || {};
  const [responseDraft, setResponseDraft] = useState(
    Object.fromEntries(fields.map(f => [f.key, existingData[f.key] || ""]))
  );
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const hasExistingResponse = Object.keys(existingData).length > 0;
  const hasDraftContent = Object.values(responseDraft).some(v => v.trim());

  const handleSubmitResponse = async () => {
    if (!hasDraftContent || submittingResponse) return;
    setSubmittingResponse(true);
    try {
      const trimmed = Object.fromEntries(
        Object.entries(responseDraft).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])
      );
      await onSubmitResponse(task.id, trimmed);
    } finally {
      setSubmittingResponse(false);
    }
  };

  return (
    <div className="pai-task-card">
      <div className="pai-task-card__title">{task.title}</div>

      <div className="pai-task-card__meta">
        <PriorityBadge
          priority={task.priority || "low"}
          onChangePriority={(p) => onPriorityChange(task.id, p)}
          canManage={canManage}
        />
        {task.requires_customer_input && (
          <span className="pai-task-card__customer-flag" title={t("tasks.customer_flag_title")}>
            {t("tasks.customer_flag_label")}
          </span>
        )}
        {task.created_at && (
          <span className="pai-task-card__date">{formatDate(task.created_at)}</span>
        )}
      </div>

      {proc && <div className="pai-task-card__proc">{proc.title}</div>}

      {canManage && task.requires_customer_input && hasExistingResponse && (
        <div className="pai-task-card__customer-response">
          <div className="pai-task-card__customer-response-label">{t("tasks.customer_response_label")}</div>
          {fields.map(f => existingData[f.key] && (
            <div key={f.key} className="pai-task-card__customer-response-text">
              <strong>{f.label}:</strong> {existingData[f.key]}
            </div>
          ))}
        </div>
      )}

      {!canManage && task.requires_customer_input && (
        <div className="pai-task-card__customer-input" onClick={e => e.stopPropagation()}>
          {fields.map(f => (
            <div key={f.key} className="pai-task-card__customer-field">
              <label className="pai-task-card__customer-field-label">{f.label}</label>
              <textarea
                className="pai-task-card__customer-textarea"
                value={responseDraft[f.key] || ""}
                onChange={e => setResponseDraft(d => ({ ...d, [f.key]: e.target.value }))}
                placeholder={t("tasks.customer_input_placeholder")}
                rows={2}
              />
            </div>
          ))}
          <button
            className="pai-task-card__customer-submit"
            onClick={handleSubmitResponse}
            disabled={submittingResponse || !hasDraftContent}
          >
            {submittingResponse ? t("tasks.submitting") : (hasExistingResponse ? t("tasks.update_btn") : t("tasks.send_btn"))}
          </button>
        </div>
      )}

      {(task.assigned_users || []).length > 0 && (
        <div className="pai-task-card__avatars">
          {(task.assigned_users || []).map(u => (
            <UserAvatar
              key={u.id}
              user={u}
              onRemove={isAdmin ? () => onUnassignUser(task.id, u.id) : undefined}
            />
          ))}
        </div>
      )}

      <div className="pai-task-card__footer">
        {isAdmin && (
          <AssignDropdown
            task={task}
            users={users}
            onAssign={onAssignUser}
            onUnassign={onUnassignUser}
          />
        )}
        <div className="pai-task-card__spacer" />
        {canManage && task.requires_customer_input && (colId === "in_progress" || colId === "done") && (
          <button
            className="pai-task-card__btn pai-task-card__btn--clarify"
            onClick={() => onStatusChange(task.id, "clarification_needed")}
          >
            {t("tasks.request_clarification_btn")}
          </button>
        )}
        {colId === "pending" && (
          <button className="pai-task-card__btn" onClick={() => onStatusChange(task.id, "in_progress")}>
            {t("tasks.start_btn")}
          </button>
        )}
        {colId === "in_progress" && (
          <button className="pai-task-card__btn pai-task-card__btn--done" onClick={() => onStatusChange(task.id, "done")}>
            {t("tasks.done_btn")}
          </button>
        )}
        {colId === "clarification_needed" && canManage && (
          <button className="pai-task-card__btn" onClick={() => onStatusChange(task.id, "in_progress")}>
            {t("tasks.recheck_btn")}
          </button>
        )}
        {colId === "done" && (
          <button
            className="pai-task-card__btn pai-task-card__btn--undo"
            onClick={() => onStatusChange(task.id, "pending")}
          >
            {t("tasks.reopen_btn")}
          </button>
        )}
      </div>
    </div>
  );
}

function Column({ col, tasks, procedures, onStatusChange, onPriorityChange, draggedId, onDragStart, onDragEnd, onDrop, onAddClick, isAdmin, canManage = true, users, onAssignUser, onUnassignUser, onSubmitResponse }) {
  const { t } = useTranslation();
  const [over, setOver] = useState(false);
  const colTasks = tasks.filter(task => task.status === col.id);

  return (
    <div
      className={`pai-kanban-col${over ? " pai-kanban-col--over" : ""}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDrop(col.id); }}
    >
      <div className="pai-kanban-col__header">
        <div className="pai-kanban-col__header-left">
          <div className="pai-kanban-col__dot" style={{ background: col.dot }} />
          <span className="pai-kanban-col__label">{col.label}</span>
          <span className="pai-kanban-col__count">{colTasks.length}</span>
        </div>
        {col.id === "pending" && canManage && (
          <button className="pai-kanban-col__add-btn" onClick={onAddClick} title={t("tasks.create_title")}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
            </svg>
          </button>
        )}
      </div>

      <div className="pai-kanban-col__body">
        {colTasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onDragEnd={onDragEnd}
            className={`pai-task-card-wrap${draggedId === task.id ? " pai-task-card-wrap--dragging" : ""}`}
          >
            <TaskCard
              task={task}
              procedures={procedures}
              colId={col.id}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              isAdmin={isAdmin}
              canManage={canManage}
              users={users}
              onAssignUser={onAssignUser}
              onUnassignUser={onUnassignUser}
              onSubmitResponse={onSubmitResponse}
            />
          </div>
        ))}
        {colTasks.length === 0 && (
          <div className="pai-kanban-col__empty">{t("tasks.no_tasks_col")}</div>
        )}
      </div>
    </div>
  );
}

function CreateTaskModal({ procedures, onClose, onSubmit, loading }) {
  const { t } = useTranslation();
  const PRIORITIES = getPriorities(t);
  const [title, setTitle]       = useState("");
  const [procId, setProcId]     = useState(procedures[0]?.id || "");
  const [priority, setPriority] = useState("low");
  const [requiresCustomerInput, setRequiresCustomerInput] = useState(false);
  const [fieldLabels, setFieldLabels] = useState([]);
  const [error, setError]       = useState("");

  const selectedProc = procedures.find(p => p.id === procId);
  const hasLinkedCustomer = !!selectedProc?.customer_id;

  useEffect(() => {
    if (!hasLinkedCustomer) setRequiresCustomerInput(false);
  }, [hasLinkedCustomer]);

  const handleSubmit = () => {
    if (!title.trim()) { setError(t("tasks.err_title")); return; }
    if (!procId) { setError(t("tasks.err_procedure")); return; }
    const active = requiresCustomerInput && hasLinkedCustomer;
    const requiredFields = active
      ? fieldLabels
          .map((label, i) => label.trim() && { key: slugifyFieldLabel(label, i), label: label.trim() })
          .filter(Boolean)
      : [];
    onSubmit(title.trim(), procId, priority, active, requiredFields);
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-task-form" onClick={e => e.stopPropagation()}>
        <div className="pai-task-form__header">
          <div>
            <div className="pai-task-form__title">{t("tasks.create_title")}</div>
            <div className="pai-task-form__sub">{t("tasks.create_sub")}</div>
          </div>
          <button className="pai-task-form__close" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-task-form__body">
          <div className="pai-field">
            <label className="pai-field__label">{t("tasks.field_title")}</label>
            <input
              className="pai-field__input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
              placeholder={t("tasks.task_placeholder")}
              autoFocus
            />
          </div>

          <div className="pai-task-form__row">
            <div className="pai-field" style={{ flex: 1 }}>
              <label className="pai-field__label">{t("tasks.field_priority")}</label>
              <select
                className="pai-field__select"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="pai-field" style={{ flex: 2 }}>
              <label className="pai-field__label">{t("tasks.field_procedure")}</label>
              <select
                className="pai-field__select"
                value={procId}
                onChange={e => setProcId(e.target.value)}
              >
                {procedures.length === 0 && (
                  <option value="">{t("tasks.no_procedure")}</option>
                )}
                {procedures.map(p => (
                  <option key={p.id} value={p.id} title={p.title}>
                    {p.title.length > 45 ? p.title.slice(0, 45) + "…" : p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className={`pai-task-form__checkbox-row${!hasLinkedCustomer ? " pai-task-form__checkbox-row--disabled" : ""}`}>
            <input
              type="checkbox"
              checked={requiresCustomerInput}
              disabled={!hasLinkedCustomer}
              onChange={e => setRequiresCustomerInput(e.target.checked)}
            />
            {hasLinkedCustomer
              ? t("tasks.customer_input_hint_enabled")
              : t("tasks.customer_input_hint_disabled")}
          </label>

          {requiresCustomerInput && hasLinkedCustomer && (
            <div className="pai-task-form__fields">
              <label className="pai-field__label">{t("tasks.required_fields_label")}</label>
              {fieldLabels.map((label, i) => (
                <div key={i} className="pai-task-form__field-row">
                  <input
                    className="pai-field__input"
                    value={label}
                    onChange={e => setFieldLabels(fs => fs.map((f, idx) => idx === i ? e.target.value : f))}
                    placeholder={t("tasks.field_label_placeholder")}
                  />
                  <button
                    type="button"
                    className="pai-task-form__field-remove"
                    onClick={() => setFieldLabels(fs => fs.filter((_, idx) => idx !== i))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="pai-btn pai-btn--ghost pai-task-form__field-add"
                onClick={() => setFieldLabels(fs => [...fs, ""])}
              >
                {t("tasks.field_add")}
              </button>
            </div>
          )}

          {error && <div className="pai-task-form__error">{error}</div>}

          <div className="pai-task-form__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t("tasks.cancel")}</button>
            <button className="pai-btn pai-btn--primary" onClick={handleSubmit} disabled={loading || procedures.length === 0}>
              {loading ? t("tasks.creating") : t("tasks.create_btn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard({ tasks, procedures, onStatusChange, onPriorityChange, onCreateTask, isAdmin, canManage = true, users, onAssignUser, onUnassignUser, onSubmitResponse }) {
  const { t } = useTranslation();
  const COLS = getCols(t);
  const [draggedId, setDraggedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleDrop = (colId) => {
    if (draggedId) onStatusChange(draggedId, colId);
    setDraggedId(null);
  };

  const handleSubmit = async (title, procId, priority, requiresCustomerInput, requiredFields) => {
    setCreateLoading(true);
    try {
      await onCreateTask(title, procId, priority, requiresCustomerInput, requiredFields);
      setShowCreate(false);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <div className="pai-view pai-kanban">
        {COLS.map(col => (
          <Column
            key={col.id}
            col={col}
            tasks={tasks}
            procedures={procedures}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            draggedId={draggedId}
            onDragStart={setDraggedId}
            onDragEnd={() => setDraggedId(null)}
            onDrop={handleDrop}
            onAddClick={() => setShowCreate(true)}
            isAdmin={isAdmin}
            canManage={canManage}
            users={users}
            onAssignUser={onAssignUser}
            onUnassignUser={onUnassignUser}
            onSubmitResponse={onSubmitResponse}
          />
        ))}
      </div>

      {showCreate && (
        <CreateTaskModal
          procedures={procedures}
          onClose={() => setShowCreate(false)}
          onSubmit={handleSubmit}
          loading={createLoading}
        />
      )}
    </>
  );
}
