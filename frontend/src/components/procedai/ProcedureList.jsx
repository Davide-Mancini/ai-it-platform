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

export default function ProcedureList({ procedures, onProcedureClick, onCreateClick }) {
  const formatDate = (dt) => dt
    ? new Date(dt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="pai-view">
      {/* Toolbar */}
      <div className="pai-proc-list__toolbar">
        <div className="pai-proc-list__search-wrap">
          <svg className="pai-proc-list__search-icon" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input className="pai-proc-list__search" placeholder="Cerca procedure per titolo..." />
        </div>
        <button className="pai-btn pai-btn--primary" onClick={onCreateClick}>
          <Icon path="M12 5v14M5 12h14" size={15} color="white" />
          Nuova procedura
        </button>
      </div>

      {/* Grid */}
      {procedures.length === 0 ? (
        <div className="pai-proc-list__empty">
          <div className="pai-proc-list__empty-icon">
            <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={32} color="#CBD5E1" />
          </div>
          <div className="pai-proc-list__empty-title">Nessuna procedura</div>
          <div className="pai-proc-list__empty-sub">Crea la tua prima procedura per iniziare.</div>
          <button className="pai-btn pai-btn--primary" onClick={onCreateClick} style={{ marginTop: 16 }}>
            <Icon path="M12 5v14M5 12h14" size={15} color="white" />
            Crea procedura
          </button>
        </div>
      ) : (
        <div className="pai-proc-list__grid">
          {procedures.map(p => {
            const steps = p._steps || [];
            const done = steps.filter(s => s.status === "done").length;
            const total = steps.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={p.id}
                className="pai-card pai-proc-card"
                onClick={() => onProcedureClick(p.id)}
              >
                <div className="pai-proc-card__top">
                  <span className="pai-chip" style={{ color: "#475569", background: "#F1F5F9" }}>
                    Procedura
                  </span>
                  <span className="pai-chip" style={{
                    color: "#059669", background: "#ECFDF5",
                  }}>Attiva</span>
                </div>

                <div className="pai-proc-card__title">{p.title}</div>
                {p.description && (
                  <div className="pai-proc-card__desc">{p.description}</div>
                )}

                <div className="pai-proc-card__progress">
                  <div className="pai-proc-card__progress-header">
                    <span>{total > 0 ? `${done}/${total} steps completati` : "Nessuno step"}</span>
                    {total > 0 && <span className="pai-proc-card__pct">{pct}%</span>}
                  </div>
                  {total > 0 && (
                    <div className="pai-progress-track">
                      <div className="pai-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                <div className="pai-proc-card__footer">
                  <span className="pai-proc-card__date">{formatDate(p.created_at)}</span>
                  <span className="pai-proc-card__arrow">
                    <Icon path="M9 18l6-6-6-6" size={14} color="#94A3B8" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
