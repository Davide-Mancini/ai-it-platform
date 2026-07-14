import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../style/Notifications.css";

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

function TrashIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block" }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function relativeTime(isoString, t) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)    return t("time.now");
  if (diff < 3600)  return t("time.minutes_ago", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("time.hours_ago",   { count: Math.floor(diff / 3600) });
  return t("time.days_ago", { count: Math.floor(diff / 86400) });
}

export default function Notifications({ notifications, onMarkRead, onMarkAllRead, onDelete, onDeleteAll }) {
  const { t } = useTranslation();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const unread = notifications.filter(n => !n.is_read).length;

  const handleDeleteAll = () => {
    if (confirmDeleteAll) {
      onDeleteAll();
      setConfirmDeleteAll(false);
    } else {
      setConfirmDeleteAll(true);
      setTimeout(() => setConfirmDeleteAll(false), 3000);
    }
  };

  return (
    <div className="pai-view">
      <div className="pai-notif__header">
        <div>
          <div className="pai-notif__title">{t("notifications.title")}</div>
          <div className="pai-notif__sub">{t("notifications.unread", { count: unread })}</div>
        </div>
        {notifications.length > 0 && (
          <div className="pai-notif__actions">
            {unread > 0 && (
              <button className="pai-btn pai-btn--ghost" onClick={onMarkAllRead} style={{ fontSize: 12 }}>
                {t("notifications.mark_read")}
              </button>
            )}
            <button
              className={`pai-btn pai-notif__delete-all-btn${confirmDeleteAll ? " pai-notif__delete-all-btn--confirm" : ""}`}
              onClick={handleDeleteAll}
              title={t("notifications.delete_one_title")}
            >
              <TrashIcon size={13} />
              {confirmDeleteAll ? t("notifications.delete_confirm") : t("notifications.delete_all")}
            </button>
          </div>
        )}
      </div>

      <div className="pai-card pai-notif__list">
        {notifications.length === 0 && (
          <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
            {t("notifications.empty")}
          </div>
        )}
        {notifications.map(n => {
          const ti = TYPE_ICON[n.type] || TYPE_ICON.system;
          return (
            <div
              key={n.id}
              className={`pai-notif-row${!n.is_read ? " pai-notif-row--unread" : ""}`}
              onClick={() => !n.is_read && onMarkRead(n.id)}
              style={{ cursor: !n.is_read ? "pointer" : "default" }}
            >
              <div className="pai-notif-row__icon" style={{ background: ti.bg, color: ti.color }}>
                <Icon path={ti.path} size={16} color={ti.color} />
              </div>
              <div className="pai-notif-row__body">
                <div className="pai-notif-row__title">{n.title}</div>
                <div className="pai-notif-row__msg">{n.message}</div>
                <div className="pai-notif-row__time">{relativeTime(n.created_at, t)}</div>
              </div>
              {!n.is_read && <div className="pai-notif-row__dot my-auto" />}
              <button
                className="pai-notif-row__delete my-auto"
                onClick={e => { e.stopPropagation(); onDelete(n.id); }}
                title={t("notifications.delete_one_title")}
              >
                <TrashIcon size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
