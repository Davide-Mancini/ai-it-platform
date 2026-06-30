import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./TaskBoard.css";

const COLS = [
  { id: "pending",     label: "Da fare",    dot: "#94A3B8" },
  { id: "in_progress", label: "In corso",   dot: "#2563EB" },
  { id: "done",        label: "Completati", dot: "#059669" },
];

const PRIORITIES = [
  { id: "low",      label: "Basso",   color: "#64748B", bg: "#F1F5F9" },
  { id: "medium",   label: "Medio",   color: "#2563EB", bg: "#EFF6FF" },
  { id: "high",     label: "Alto",    color: "#D97706", bg: "#FEF3C7" },
  { id: "critical", label: "Critico", color: "#DC2626", bg: "#FEF2F2" },
];

function PriorityBadge({ priority, onChangePriority }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const cfg = PRIORITIES.find(p => p.id === priority) || PRIORITIES[0];

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
        title="Cambia priorità"
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
  return new Date(dateStr).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
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
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const assignedIds = new Set((task.assigned_users || []).map(u => u.id));
  const unassigned = users.filter(u => !assignedIds.has(u.id));

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
        title="Assegna utente"
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
            <div className="pai-assign-dropdown__empty">Tutti gli utenti sono già assegnati</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function TaskCard({ task, procedures, colId, onStatusChange, onPriorityChange, isAdmin, users, onAssignUser, onUnassignUser }) {
  const proc = procedures.find(p => p.id === task.procedure_id);
  return (
    <div className="pai-task-card">
      <div className="pai-task-card__title">{task.title}</div>

      <div className="pai-task-card__meta">
        <PriorityBadge
          priority={task.priority || "low"}
          onChangePriority={(p) => onPriorityChange(task.id, p)}
        />
        {task.created_at && (
          <span className="pai-task-card__date">{formatDate(task.created_at)}</span>
        )}
      </div>

      {proc && <div className="pai-task-card__proc">{proc.title}</div>}

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
        {colId !== "done" && (
          <button
            className={`pai-task-card__btn${colId === "in_progress" ? " pai-task-card__btn--done" : ""}`}
            onClick={() => onStatusChange(task.id, colId === "pending" ? "in_progress" : "done")}
          >
            {colId === "pending" ? "→ Inizia" : "✓ Done"}
          </button>
        )}
        {colId === "done" && (
          <button
            className="pai-task-card__btn pai-task-card__btn--undo"
            onClick={() => onStatusChange(task.id, "pending")}
          >
            ↩ Riapri
          </button>
        )}
      </div>
    </div>
  );
}

function Column({ col, tasks, procedures, onStatusChange, onPriorityChange, draggedId, onDragStart, onDragEnd, onDrop, onAddClick, isAdmin, users, onAssignUser, onUnassignUser }) {
  const [over, setOver] = useState(false);
  const colTasks = tasks.filter(t => t.status === col.id);

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
        {col.id === "pending" && (
          <button className="pai-kanban-col__add-btn" onClick={onAddClick} title="Nuovo task">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1={12} y1={5} x2={12} y2={19} /><line x1={5} y1={12} x2={19} y2={12} />
            </svg>
          </button>
        )}
      </div>

      <div className="pai-kanban-col__body">
        {colTasks.map(t => (
          <div
            key={t.id}
            draggable
            onDragStart={() => onDragStart(t.id)}
            onDragEnd={onDragEnd}
            className={`pai-task-card-wrap${draggedId === t.id ? " pai-task-card-wrap--dragging" : ""}`}
          >
            <TaskCard
              task={t}
              procedures={procedures}
              colId={col.id}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              isAdmin={isAdmin}
              users={users}
              onAssignUser={onAssignUser}
              onUnassignUser={onUnassignUser}
            />
          </div>
        ))}
        {colTasks.length === 0 && (
          <div className="pai-kanban-col__empty">Nessun task</div>
        )}
      </div>
    </div>
  );
}

function CreateTaskModal({ procedures, onClose, onSubmit, loading }) {
  const [title, setTitle]       = useState("");
  const [procId, setProcId]     = useState(procedures[0]?.id || "");
  const [priority, setPriority] = useState("low");
  const [error, setError]       = useState("");

  const handleSubmit = () => {
    if (!title.trim()) { setError("Il titolo è obbligatorio."); return; }
    if (!procId) { setError("Seleziona una procedura."); return; }
    onSubmit(title.trim(), procId, priority);
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-task-form" onClick={e => e.stopPropagation()}>
        <div className="pai-task-form__header">
          <div>
            <div className="pai-task-form__title">Nuovo task</div>
            <div className="pai-task-form__sub">Associa il task a una procedura esistente</div>
          </div>
          <button className="pai-task-form__close" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-task-form__body">
          <div className="pai-field">
            <label className="pai-field__label">TITOLO *</label>
            <input
              className="pai-field__input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Es. Inviare documentazione al cliente"
              autoFocus
            />
          </div>

          <div className="pai-task-form__row">
            <div className="pai-field" style={{ flex: 1 }}>
              <label className="pai-field__label">PRIORITÀ</label>
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
              <label className="pai-field__label">PROCEDURA *</label>
              <select
                className="pai-field__select"
                value={procId}
                onChange={e => setProcId(e.target.value)}
              >
                {procedures.length === 0 && (
                  <option value="">Nessuna procedura disponibile</option>
                )}
                {procedures.map(p => (
                  <option key={p.id} value={p.id} title={p.title}>
                    {p.title.length > 45 ? p.title.slice(0, 45) + "…" : p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="pai-task-form__error">{error}</div>}

          <div className="pai-task-form__actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
            <button className="pai-btn pai-btn--primary" onClick={handleSubmit} disabled={loading || procedures.length === 0}>
              {loading ? "Creazione…" : "Crea task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskBoard({ tasks, procedures, onStatusChange, onPriorityChange, onCreateTask, isAdmin, users, onAssignUser, onUnassignUser }) {
  const [draggedId, setDraggedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleDrop = (colId) => {
    if (draggedId) onStatusChange(draggedId, colId);
    setDraggedId(null);
  };

  const handleSubmit = async (title, procId, priority) => {
    setCreateLoading(true);
    try {
      await onCreateTask(title, procId, priority);
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
            users={users}
            onAssignUser={onAssignUser}
            onUnassignUser={onUnassignUser}
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
