import "./TopBar.css";

const TITLES = {
  dashboard:        { t: "Dashboard",           s: "Buongiorno 👋" },
  procedures:       { t: "Procedure",           s: null },
  "procedure-detail": { t: "Dettaglio Procedura", s: null },
  tasks:            { t: "Task Board",          s: null },
  documents:        { t: "Documenti & Policy",  s: null },
  team:             { t: "Team",               s: null },
  notifications:    { t: "Notifiche",          s: null },
  settings:         { t: "Impostazioni",       s: null },
};

function SearchIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export default function TopBar({ view, userInfo, unreadCount, onViewChange }) {
  const cv = TITLES[view] || TITLES.dashboard;
  const displayName = userInfo
    ? [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || userInfo.email
    : "Utente";
  const initials = userInfo
    ? ((userInfo.first_name?.[0] || "") + (userInfo.last_name?.[0] || "")).toUpperCase() || userInfo.email?.[0]?.toUpperCase() || "U"
    : "U";

  return (
    <header className="pai-topbar">
      <div className="pai-topbar__left">
        <div className="pai-topbar__title">{cv.t}</div>
        {cv.s && <div className="pai-topbar__sub">{cv.s.replace("👋", `${displayName.split(" ")[0]} 👋`)}</div>}
      </div>

      <div className="pai-topbar__right">
        <div className="pai-topbar__search">
          <SearchIcon />
          <input className="pai-topbar__search-input" type="text" placeholder="Cerca..." />
        </div>

        <div className="pai-topbar__notif-wrap" onClick={() => onViewChange("notifications")}>
          <button className="pai-topbar__notif-btn"><BellIcon /></button>
          {unreadCount > 0 && <span className="pai-topbar__notif-dot">{unreadCount}</span>}
        </div>

        <div className="pai-topbar__avatar">{initials}</div>
      </div>
    </header>
  );
}
