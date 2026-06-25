import { COLUMNS } from "./constants";
import "./Sidebar.css";

const NAV_ITEMS = [
  {
    id: "board",
    label: "Board",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="5" height="5" rx="1.3" />
        <rect x="9" y="2" width="5" height="5" rx="1.3" />
        <rect x="2" y="9" width="5" height="5" rx="1.3" />
        <rect x="9" y="9" width="5" height="5" rx="1.3" />
      </svg>
    ),
  },
  {
    id: "list",
    label: "Backlog",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="2.5" y1="4" x2="13.5" y2="4" />
        <line x1="2.5" y1="8" x2="13.5" y2="8" />
        <line x1="2.5" y1="12" x2="13.5" y2="12" />
      </svg>
    ),
  },
  {
    id: "dashboard",
    label: "Panoramica",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <line x1="3" y1="13.5" x2="3" y2="9" />
        <line x1="8" y1="13.5" x2="8" y2="3.5" />
        <line x1="13" y1="13.5" x2="13" y2="6.5" />
      </svg>
    ),
  },
];

export default function Sidebar({
  view,
  onViewChange,
  procedures,
  boardStatus,
  selectedId,
  onSelectProcedure,
  userInitials,
  displayName,
  roleName,
  onLogout,
  loading,
}) {
  return (
    <aside className="hx-sidebar">
      {/* Logo */}
      <div className="hx-sidebar__logo">
        <div className="hx-sidebar__logo-icon">H</div>
        <div className="hx-sidebar__logo-text">
          <span className="hx-sidebar__app-name">Heximus</span>
          <span className="hx-sidebar__workspace">AI IT Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hx-sidebar__nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`hx-sidebar__nav-btn${view === item.id ? " hx-sidebar__nav-btn--active" : ""}`}
            onClick={() => onViewChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hx-sidebar__divider" />

      {/* Procedure list */}
      <div className="hx-sidebar__section-label">PROCEDURE</div>
      <div className="hx-sidebar__project-list">
        {loading && (
          <div className="hx-sidebar__project-empty">Caricamento…</div>
        )}
        {!loading && procedures.length === 0 && (
          <div className="hx-sidebar__project-empty">Nessuna procedura.</div>
        )}
        {!loading && procedures.slice(0, 10).map(p => {
          const col = COLUMNS.find(c => c.id === (boardStatus[p.id] || "todo"));
          const active = selectedId === p.id;
          return (
            <div
              key={p.id}
              className={`hx-sidebar__project-item${active ? " hx-sidebar__project-item--active" : ""}`}
              onClick={() => onSelectProcedure(p.id)}
            >
              <span className="hx-sidebar__project-dot" style={{ background: col?.dot }} />
              <span className="hx-sidebar__project-title">{p.title}</span>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* User */}
      <div className="hx-sidebar__user">
        <div className="hx-sidebar__user-avatar">{userInitials}</div>
        <div className="hx-sidebar__user-info">
          <span className="hx-sidebar__user-name">{displayName}</span>
          <span className="hx-sidebar__user-role">{roleName}</span>
        </div>
        <button className="hx-sidebar__logout" onClick={onLogout} title="Esci">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M10 8H3m5-4 4 4-4 4" />
            <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
