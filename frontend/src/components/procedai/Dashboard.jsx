import { useState } from "react";
import "./Dashboard.css";

const ACTION_LABELS = {
  "PROCEDURE CREATED": "ha creato una nuova procedura",
  "PROCEDURE UPDATED": "ha modificato una procedura",
  "PROCEDURE DELETED": "ha eliminato una procedura",
  "TASK CREATED":      "ha creato un nuovo task",
  "TASK UPDATED":      "ha aggiornato un task",
  "LOGIN":        "ha effettuato l'accesso",
  "AI_RECOMMENDATION_ACCEPTED":        "ha accettato una raccomandazione AI",
};

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)    return "Adesso";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
  return `${Math.floor(diff / 86400)} giorni fa`;
}

function actorInitials(entry) {
  if (entry.user_first_name && entry.user_last_name)
    return `${entry.user_first_name[0]}${entry.user_last_name[0]}`.toUpperCase();
  if (entry.user_email) return entry.user_email[0].toUpperCase();
  return "?";
}

function actorName(entry) {
  if (entry.user_first_name) return entry.user_first_name + " " + entry.user_last_name;
  if (entry.user_email) return entry.user_email.split("@")[0];
  return "Utente";
}

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"];
function avatarColor(entry) {
  const key = entry.user_email || entry.id;
  return AVATAR_COLORS[key.charCodeAt(0) % AVATAR_COLORS.length];
}

function Icon({ path, size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

function StatCard({ label, value, sub, iconPath, color, bg }) {
  return (
    <div className="pai-card pai-stat-card">
      <div className="pai-stat-card__icon" style={{ background: bg, color }}>
        <Icon path={iconPath} size={19} color={color} />
      </div>
      <div className="pai-stat-card__value">{value}</div>
      <div className="pai-stat-card__label">{label}</div>
      <div className="pai-stat-card__sub">{sub}</div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Dashboard({ procedures, tasks, stepsById = {}, recentActivity = [], notifications = [], onProcedureClick, onViewChange, onRefreshActivity }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshActivity = async () => {
    if (!onRefreshActivity || refreshing) return;
    setRefreshing(true);
    try { await onRefreshActivity(); } finally { setRefreshing(false); }
  };

  const activeProcedures = procedures.filter(p => p._status === "active" || !p._status);
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const unread = notifications.filter(n => !n.is_read).length;

  const STATS = [
    {
      label: "Procedure Attive", value: activeProcedures.length, sub: `${procedures.length} totali`,
      iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      color: "#2563EB", bg: "#EFF6FF",
    },
    {
      label: "Task Aperti", value: openTasks, sub: `${doneTasks} completati`,
      iconPath: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
      color: "#D97706", bg: "#FFFBEB",
    },
    {
      label: "Task totali", value: tasks.length, sub: "su tutte le procedure",
      iconPath: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
      color: "#7C3AED", bg: "#F5F3FF",
    },
    {
      label: "Notifiche", value: unread, sub: "non lette",
      iconPath: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
      color: "#059669", bg: "#ECFDF5",
    },
  ];

  return (
    <div className="pai-view">
      {/* Stats */}
      <div className="pai-dashboard__stats">
        {STATS.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Bottom grid */}
      <div className="pai-dashboard__grid">
        {/* Recent procedures */}
        <div className="pai-card pai-dashboard__recent-procedures">
          <div className="pai-dashboard__card-header">
            <span className="pai-dashboard__card-title">Procedure recenti</span>
            <button className="pai-dashboard__link" onClick={() => onViewChange("procedures")}>
              Vedi tutte →
            </button>
          </div>
          {procedures.length === 0 && (
            <div className="pai-dashboard__empty">Nessuna procedura. Creane una!</div>
          )}
          {procedures.slice(0, 5).map(p => {
            const steps = stepsById[p.id] || [];
            const done = steps.filter(s => s.status === "done").length;
            const total = steps.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={p.id}
                className="pai-dashboard__proc-row"
                onClick={() => onProcedureClick(p.id)}
              >
                <div className="pai-dashboard__proc-name">{p.title}</div>
                <div className="pai-progress-track">
                  <div className="pai-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="pai-dashboard__proc-meta">
                  {total > 0 ? `${done}/${total} steps completati` : "Nessuno step"}
                </div>
              </div>
            );
          })}
        </div>

        {/* My tasks */}
        <div className="pai-card pai-dashboard__my-tasks">
          <div className="pai-dashboard__card-header">
            <span className="pai-dashboard__card-title">Task recenti</span>
            <button className="pai-dashboard__link" onClick={() => onViewChange("tasks")}>
              Kanban →
            </button>
          </div>
          {tasks.length === 0 && <div className="pai-dashboard__empty">Nessun task trovato.</div>}
          {tasks.slice(0, 6).map(t => (
            <div key={t.id} className="pai-dashboard__task-row">
              <div
                className={`pai-dashboard__task-check${t.status === "done" ? " pai-dashboard__task-check--done" : ""}`}
              >
                {t.status === "done" && <CheckIcon />}
              </div>
              <div className={`pai-dashboard__task-title${t.status === "done" ? " pai-dashboard__task-title--done" : ""}`}>
                {t.title}
              </div>
              <span
                className="pai-chip"
                style={{
                  color: t.status === "done" ? "#059669" : t.status === "in_progress" ? "#2563EB" : "#64748B",
                  background: t.status === "done" ? "#ECFDF5" : t.status === "in_progress" ? "#EFF6FF" : "#F1F5F9",
                  fontSize: 10,
                }}
              >
                {t.status === "done" ? "Done" : t.status === "in_progress" ? "In corso" : "Da fare"}
              </span>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="pai-card pai-dashboard__activity">
          <div className="pai-dashboard__card-title" style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Attività recente</span>
            <button
              className={`pai-dashboard__refresh-btn${refreshing ? " pai-dashboard__refresh-btn--spinning" : ""}`}
              onClick={handleRefreshActivity}
              title="Aggiorna attività"
              disabled={refreshing}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          {recentActivity.length === 0 && (
            <div className="pai-dashboard__empty">Nessuna attività recente.</div>
          )}
          {recentActivity.map(a => (
            <div key={a.id} className="pai-dashboard__act-row">
              <div className="pai-dashboard__act-avatar" style={{ background: avatarColor(a) }}>
                {actorInitials(a)}
              </div>
              <div className="pai-dashboard__act-text">
                <span className="pai-dashboard__act-name">{actorName(a)} </span> <br />
                <span className="pai-dashboard__act-action">{ACTION_LABELS[a.action] || a.action.toLowerCase()}</span>
                <div className="pai-dashboard__act-time">{relativeTime(a.created_at)}</div>
              </div>
            </div>
          )).slice(0,-5)}
        </div>
      </div>
    </div>
  );
}
