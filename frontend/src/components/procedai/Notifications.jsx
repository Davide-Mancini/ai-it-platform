
import "./Notifications.css";

const TYPE_ICON = {
  task:      { path: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11", color: "#2563EB", bg: "#EFF6FF" },
  procedure: { path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#7C3AED", bg: "#F5F3FF" },
  comment:   { path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", color: "#059669", bg: "#ECFDF5" },
  system:    { path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "#64748B", bg: "#F1F5F9" },
};

function Icon({ path, size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

export default function Notifications({ notifications, onMarkAllRead }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="pai-view">
      <div className="pai-notif__header ">
        <div>
          <div className="pai-notif__title">Notifiche</div>
          <div className="pai-notif__sub">{unread} non lette</div>
        </div>
        {unread > 0 && (
          <button className="pai-btn pai-btn--ghost" onClick={onMarkAllRead} style={{ fontSize: 12 }}>
            Segna tutte come lette
          </button>
        )}
      </div>

      <div className="pai-card pai-notif__list">
        {notifications.map(n => {
          const ti = TYPE_ICON[n.type] || TYPE_ICON.system;
          return (
            <div key={n.id} className={`pai-notif-row${!n.read ? " pai-notif-row--unread" : ""}`}>
              <div className="pai-notif-row__icon" style={{ background: ti.bg, color: ti.color }}>
                <Icon path={ti.path} size={16} color={ti.color} />
              </div>
              <div className="pai-notif-row__body">
                <div className="pai-notif-row__title">{n.title}</div>
                <div className="pai-notif-row__msg">{n.message}</div>
                <div className="pai-notif-row__time">{n.time}</div>
              </div>
              {!n.read && <div className="pai-notif-row__dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
