import { PRIORITIES } from "./constants";
import BoardCard from "./BoardCard";
import "./BoardColumn.css";

export default function BoardColumn({
  col,
  procs,
  isOver,
  draggedId,
  boardPriority,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onCardClick,
}) {
  return (
    <div className="hx-board-col">
      {/* Column header */}
      <div className="hx-board-col__header">
        <span className="hx-board-col__dot" style={{ background: col.dot }} />
        <span className="hx-board-col__name">{col.name}</span>
        <span className="hx-board-col__count" style={{ color: col.text }}>{procs.length}</span>
      </div>

      {/* Drop zone */}
      <div
        className={`hx-board-col__body${isOver ? " hx-board-col__body--over" : ""}`}
        onDragOver={e => { e.preventDefault(); onDragOver(col.id); }}
        onDrop={e => { e.preventDefault(); onDrop(col.id); }}
      >
        {procs.map(p => (
          <BoardCard
            key={p.id}
            procedure={p}
            priority={PRIORITIES[boardPriority[p.id] || "medium"]}
            isDragging={draggedId === p.id}
            onDragStart={() => onDragStart(p.id)}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick(p.id)}
          />
        ))}

        {procs.length === 0 && (
          <div className="hx-board-col__empty">Nessuna procedura</div>
        )}
      </div>
    </div>
  );
}
