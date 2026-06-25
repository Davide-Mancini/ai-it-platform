import { shortKey, formatDate } from "./constants";
import "./BoardCard.css";

export default function BoardCard({ procedure, priority, isDragging, onDragStart, onDragEnd, onClick }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`hx-board-card-wrapper${isDragging ? " hx-board-card-wrapper--dragging" : ""}`}
    >
      <div className="hx-board-card">
        <div className="hx-board-card__header">
          <span className="hx-board-card__type-badge">Procedura</span>
          <span
            className="hx-board-card__prio-badge"
            style={{ background: priority.bg, color: priority.color }}
          >
            {priority.label}
          </span>
        </div>

        <div className="hx-board-card__title">{procedure.title}</div>

        {procedure.description && (
          <div className="hx-board-card__desc">{procedure.description}</div>
        )}

        <div className="hx-board-card__footer">
          <span className="hx-board-card__key">{shortKey(procedure.id)}</span>
          {procedure.created_at && (
            <span className="hx-board-card__date">{formatDate(procedure.created_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
