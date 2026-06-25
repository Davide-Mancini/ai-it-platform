import { COLUMNS, PRIORITIES, PRIO_ORDER } from "./constants";
import "./Dashboard.css";

function StatCard({ label, value, sub, color }) {
  return (
    <div className="hx-stat-card">
      <div className="hx-stat-card__label">{label}</div>
      <div className="hx-stat-card__value" style={{ color }}>{value}</div>
      <div className="hx-stat-card__sub">{sub}</div>
    </div>
  );
}

export default function Dashboard({ procedures, boardStatus, boardPriority }) {
  const cnt = colId => procedures.filter(p => (boardStatus[p.id] || "todo") === colId).length;
  const total = procedures.length;
  const donePct = total ? Math.round(cnt("done") / total * 100) : 0;

  const prioCount = p => procedures.filter(proc => (boardPriority[proc.id] || "medium") === p).length;
  const maxPrio = Math.max(1, ...PRIO_ORDER.map(prioCount));

  return (
    <div className="hx-dashboard">
      {/* Stats row */}
      <div className="hx-dashboard__stats">
        <StatCard label="Procedure totali" value={total} sub="nel workspace" color="var(--text)" />
        <StatCard label="In corso" value={cnt("progress")} sub="in lavorazione" color="#3f6fd6" />
        <StatCard label="In revisione" value={cnt("review")} sub="da validare" color="#8b5fd0" />
        <StatCard label="Completate" value={cnt("done")} sub={`${donePct}% del totale`} color="#2f9d6b" />
      </div>

      <div className="hx-dashboard__charts">
        {/* Status chart */}
        <div className="hx-dashboard__card">
          <div className="hx-dashboard__card-title">Procedure per stato</div>
          <div className="hx-dashboard__bar-track">
            {COLUMNS.map(col => {
              const n = cnt(col.id);
              const pct = total ? n / total * 100 : 0;
              return (
                <div
                  key={col.id}
                  className="hx-dashboard__bar-segment"
                  style={{ width: pct + "%", background: col.dot }}
                />
              );
            })}
          </div>
          <div className="hx-dashboard__legend">
            {COLUMNS.map(col => (
              <div key={col.id} className="hx-dashboard__legend-row">
                <span className="hx-dashboard__legend-dot" style={{ background: col.dot }} />
                <span className="hx-dashboard__legend-name">{col.name}</span>
                <span className="hx-dashboard__legend-count">{cnt(col.id)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority chart */}
        <div className="hx-dashboard__card">
          <div className="hx-dashboard__card-title">Distribuzione priorità</div>
          <div className="hx-dashboard__prio-list">
            {PRIO_ORDER.map(p => {
              const o = PRIORITIES[p];
              const n = prioCount(p);
              return (
                <div key={p} className="hx-dashboard__prio-row">
                  <span className="hx-dashboard__prio-dot" style={{ background: o.color }} />
                  <span className="hx-dashboard__prio-name">{o.label}</span>
                  <div className="hx-dashboard__prio-track">
                    <div
                      className="hx-dashboard__prio-fill"
                      style={{ width: (n / maxPrio * 100) + "%", background: o.color }}
                    />
                  </div>
                  <span className="hx-dashboard__prio-count">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
