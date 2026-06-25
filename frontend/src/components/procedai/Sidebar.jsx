import { NAV_ITEMS } from "./constants";
import "./Sidebar.css";

function Icon({ path, size = 17, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

export default function Sidebar({ view, onViewChange, userInfo, onLogout, unreadCount }) {
  const initials = userInfo
    ? ((userInfo.first_name?.[0] || "") + (userInfo.last_name?.[0] || "")).toUpperCase() || userInfo.email?.[0]?.toUpperCase() || "U"
    : "U";
  const displayName = userInfo
    ? [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || userInfo.email
    : "Utente";
  const roleName = userInfo?.role?.name || userInfo?.role || "Utente";

  const isActive = (id) =>
    view === id || (id === "procedures" && view === "procedure-detail");

  return (
    <aside className="pai-sidebar">
      {/* Logo */}
      <div className="pai-sidebar__logo">
        <div className="pai-sidebar__logo-icon">
          <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={19} color="white" />
        </div>
        <div>
          <div className="pai-sidebar__logo-name">ProcedAI</div>
          <div className="pai-sidebar__logo-sub">IT Procedures</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="pai-sidebar__nav">
        <div className="pai-sidebar__section-label">Menu</div>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.id);
          const count = item.badge ? unreadCount : 0;
          return (
            <div
              key={item.id}
              className={`pai-sidebar__item${active ? " pai-sidebar__item--active" : ""}`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon path={item.icon} size={17} color={active ? "white" : "#475569"} />
              <span className="pai-sidebar__item-label">{item.label}</span>
              {count > 0 && (
                <span className="pai-sidebar__badge">{count}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="pai-sidebar__user">
        <div className="pai-sidebar__avatar" style={{ position: "relative" }}>
          <div className="pai-sidebar__avatar-circle">{initials}</div>
          <div className="pai-sidebar__online-dot" />
        </div>
        <div className="pai-sidebar__user-info">
          <div className="pai-sidebar__user-name">{displayName}</div>
          <div className="pai-sidebar__user-role">{roleName}</div>
        </div>
        <button className="pai-sidebar__logout" onClick={onLogout} title="Logout">
          <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14} color="#475569" />
        </button>
      </div>
    </aside>
  );
}
