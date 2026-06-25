import { COLUMNS } from "./constants";
import BoardColumn from "./BoardColumn";
import "./Board.css";

export default function Board({
  filtered,
  boardStatus,
  boardPriority,
  draggedId,
  dragOverCol,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onCardClick,
}) {
  return (
    <div className="hx-board">
      {COLUMNS.map(col => {
        const procs = filtered.filter(p => (boardStatus[p.id] || "todo") === col.id);
        return (
          <BoardColumn
            key={col.id}
            col={col}
            procs={procs}
            isOver={dragOverCol === col.id}
            draggedId={draggedId}
            boardPriority={boardPriority}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onCardClick={onCardClick}
          />
        );
      })}
    </div>
  );
}
