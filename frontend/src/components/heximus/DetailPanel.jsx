import { COLUMNS, PRIORITIES, PRIO_ORDER, shortKey } from "./constants";
import "./DetailPanel.css";

function TaskItem({ task }) {
  const isDone = task.status === "done" || task.status === "completed";
  const isInProgress = task.status === "in_progress" || task.status === "progress";
  const dotColor = isDone ? "#5cc295" : isInProgress ? "#6aa0f5" : "#9aa7bd";
  return (
    <div className="hx-task-item">
      <span className="hx-task-item__dot" style={{ background: dotColor }} />
      <span className={`hx-task-item__title${isDone ? " hx-task-item__title--done" : ""}`}>
        {task.title}
      </span>
      <span className="hx-task-item__status">{task.status}</span>
    </div>
  );
}

export default function DetailPanel({
  procedure,
  tasks,
  loadingTasks,
  boardStatus,
  boardPriority,
  onClose,
  onStatusChange,
  onPriorityChange,
}) {
  const currentStatus = boardStatus[procedure.id] || "todo";
  const currentPriority = boardPriority[procedure.id] || "medium";

  return (
    <>
      <div className="hx-panel-overlay" onClick={onClose} />

      <div className="hx-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="hx-panel__header">
          <span className="hx-panel__key">{shortKey(procedure.id)}</span>
          <button className="hx-panel__close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="hx-panel__body">
          {/* Title */}
          <div className="hx-panel__title">{procedure.title}</div>

          {/* Status */}
          <section className="hx-panel__section">
            <div className="hx-panel__section-label">STATO</div>
            <div className="hx-panel__pills">
              {COLUMNS.map(col => (
                <button
                  key={col.id}
                  className={`hx-panel__status-pill${currentStatus === col.id ? " hx-panel__status-pill--active" : ""}`}
                  style={currentStatus === col.id
                    ? { borderColor: col.text, background: col.soft, color: col.text }
                    : {}
                  }
                  onClick={() => onStatusChange(col.id)}
                >
                  <span className="hx-panel__status-dot" style={{ background: col.dot }} />
                  {col.name}
                </button>
              ))}
            </div>
          </section>

          {/* Priority */}
          <section className="hx-panel__section">
            <div className="hx-panel__section-label">PRIORITÀ</div>
            <div className="hx-panel__pills">
              {PRIO_ORDER.map(p => {
                const o = PRIORITIES[p];
                const active = currentPriority === p;
                return (
                  <button
                    key={p}
                    className={`hx-panel__prio-pill${active ? " hx-panel__prio-pill--active" : ""}`}
                    style={active ? { borderColor: o.color, background: o.bg, color: o.color } : {}}
                    onClick={() => onPriorityChange(p)}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Description */}
          {procedure.description && (
            <section className="hx-panel__section">
              <div className="hx-panel__section-label">DESCRIZIONE</div>
              <div className="hx-panel__desc">{procedure.description}</div>
            </section>
          )}

          <div className="hx-panel__divider" />

          {/* Tasks */}
          <section className="hx-panel__section">
            <div className="hx-panel__section-label">
              ATTIVITÀ {loadingTasks ? "(caricamento…)" : `(${tasks.length})`}
            </div>
            {!loadingTasks && tasks.length === 0 && (
              <div className="hx-panel__empty-tasks">Nessuna attività per questa procedura.</div>
            )}
            <div className="hx-panel__task-list">
              {tasks.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          </section>

          <div className="hx-panel__meta">
            Creata il {procedure.created_at
              ? new Date(procedure.created_at).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" })
              : "—"
            }
          </div>
        </div>
      </div>
    </>
  );
}
