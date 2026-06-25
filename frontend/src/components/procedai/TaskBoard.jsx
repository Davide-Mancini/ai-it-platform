import { useState } from "react";
import "./TaskBoard.css";

const COLS = [
  { id: "pending",     label: "Da fare",    dot: "#94A3B8" },
  { id: "in_progress", label: "In corso",   dot: "#2563EB" },
  { id: "done",        label: "Completati", dot: "#059669" },
];

function TaskCard({ task, procedures, colId, onStatusChange }) {
  const proc = procedures.find(p => p.id === task.procedure_id);
  return (
    <div className="pai-task-card">
      <div className="pai-task-card__title">{task.title}</div>
      {proc && <div className="pai-task-card__proc">{proc.title}</div>}
      <div className="pai-task-card__footer">
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

function Column({ col, tasks, procedures, onStatusChange, draggedId, onDragStart, onDragEnd, onDrop, onAddClick }) {
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
            <TaskCard task={t} procedures={procedures} colId={col.id} onStatusChange={onStatusChange} />
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
  const [title, setTitle] = useState("");
  const [procId, setProcId] = useState(procedures[0]?.id || "");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) { setError("Il titolo è obbligatorio."); return; }
    if (!procId) { setError("Seleziona una procedura."); return; }
    onSubmit(title.trim(), procId);
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

          <div className="pai-field">
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
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
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

export default function TaskBoard({ tasks, procedures, onStatusChange, onCreateTask }) {
  const [draggedId, setDraggedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleDrop = (colId) => {
    if (draggedId) onStatusChange(draggedId, colId);
    setDraggedId(null);
  };

  const handleSubmit = async (title, procId) => {
    setCreateLoading(true);
    try {
      await onCreateTask(title, procId);
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
            draggedId={draggedId}
            onDragStart={setDraggedId}
            onDragEnd={() => setDraggedId(null)}
            onDrop={handleDrop}
            onAddClick={() => setShowCreate(true)}
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
