import { PRIORITIES, COLUMNS, shortKey, formatDate } from "./constants";
import "./ListView.css";

export default function ListView({ procedures, boardStatus, boardPriority, onRowClick }) {
  return (
    <div className="hx-list">
      <div className="hx-list__header">
        <span>CHIAVE</span>
        <span>TITOLO</span>
        <span>PRIORITÀ</span>
        <span>STATO</span>
        <span>DATA</span>
      </div>

      {procedures.length === 0 && (
        <div className="hx-list__empty">Nessuna procedura trovata.</div>
      )}

      {procedures.map(p => {
        const prio = PRIORITIES[boardPriority[p.id] || "medium"];
        const col = COLUMNS.find(c => c.id === (boardStatus[p.id] || "todo"));
        return (
          <div key={p.id} className="hx-list__row" onClick={() => onRowClick(p.id)}>
            <span className="hx-list__key">{shortKey(p.id)}</span>
            <span className="hx-list__title">{p.title}</span>
            <span>
              <span className="hx-list__prio-badge" style={{ background: prio.bg, color: prio.color }}>
                {prio.label}
              </span>
            </span>
            <span className="hx-list__status-pill" style={{ background: col.soft, color: col.text }}>
              <span className="hx-list__status-dot" style={{ background: col.dot }} />
              {col.name}
            </span>
            <span className="hx-list__date">{formatDate(p.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}
