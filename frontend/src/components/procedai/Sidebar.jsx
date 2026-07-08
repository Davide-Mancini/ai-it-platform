import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "./constants";
import "./Sidebar.css";
import Heximus_Logo_AI_Platform from "../assets/Heximus_Logo_AI_Platform.png"

function Icon({ path, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

export default function Sidebar({ userInfo, onLogout, unreadCount }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth <= 1024);
  const [showLogout, setShowLogout] = useState(false);

  const initials = userInfo
    ? ((userInfo.first_name?.[0] || "") + (userInfo.last_name?.[0] || "")).toUpperCase() || userInfo.email?.[0]?.toUpperCase() || "U"
    : "U";
  const displayName = userInfo
    ? [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || userInfo.email
    : t("sidebar.user_fallback");
  const roleName = userInfo?.role?.name || userInfo?.role || t("sidebar.role_fallback");
  const isCustomerRole = roleName === "Customer";
  const canManageCustomers = ["Admin", "IT Manager", "Sales"].includes(roleName);
  // Il ruolo Customer ha una navigazione ridotta: solo le proprie procedure/task,
  // niente sezioni interne (analytics, documenti, team)
  const CUSTOMER_ALLOWED_NAV = new Set(["dashboard", "procedures", "tasks", "notifications", "settings"]);
  const visibleNavItems = isCustomerRole
    ? NAV_ITEMS.filter(item => CUSTOMER_ALLOWED_NAV.has(item.id))
    : NAV_ITEMS;

  return (
    <aside className={`pai-sidebar${collapsed ? " pai-sidebar--collapsed" : ""}`}>
      {/* Logo + toggle */}
      <div className="pai-sidebar__logo">
        <Link to={"dashboard"}><img src={Heximus_Logo_AI_Platform} alt="" className="pai-sidebar__logo-icon" /></Link>
        <div className="pai-sidebar__logo-text">
          <div className="pai-sidebar__logo-name">Heximus</div>
          <div className="pai-sidebar__logo-sub">AI Platform</div>
        </div>
        <button
          className="pai-sidebar__toggle"
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          <svg
            width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="#475569" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform .3s", transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="pai-sidebar__nav">
        <div className="pai-sidebar__section-label">{t("sidebar.menu")}</div>
        {visibleNavItems.map(item => {
          const count = item.badge ? unreadCount : 0;
          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              className={({ isActive }) => `pai-sidebar__item${isActive ? " pai-sidebar__item--active" : ""}`}
              title={collapsed ? t(`nav.${item.id}`) : undefined}
            >
              <div className="pai-sidebar__item-icon">
                <Icon path={item.icon} size={17} />
                {count > 0 && collapsed && <span className="pai-sidebar__dot" />}
              </div>
              <span className="pai-sidebar__item-label">{t(`nav.${item.id}`)}</span>
              {count > 0 && !collapsed && (
                <span className="pai-sidebar__badge">{count}</span>
              )}
            </NavLink>
          );
        })}

        {/* Voci riservate: gestione utenti (admin) e clienti (admin/IT manager/sales) */}
        {(roleName === "Admin" || canManageCustomers) && (
          <>
            <div className="pai-sidebar__section-label" style={{ marginTop: 16 }}>{t("sidebar.admin")}</div>
            {roleName === "Admin" && (
              <NavLink
                to="/users"
                className={({ isActive }) => `pai-sidebar__item${isActive ? " pai-sidebar__item--active" : ""}`}
                title={collapsed ? t("nav.users") : undefined}
              >
                <div className="pai-sidebar__item-icon">
                  <Icon
                    path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    size={17}
                  />
                </div>
                <span className="pai-sidebar__item-label">{t("nav.users")}</span>
              </NavLink>
            )}
            {canManageCustomers && (
              <NavLink
                to="/customers"
                className={({ isActive }) => `pai-sidebar__item${isActive ? " pai-sidebar__item--active" : ""}`}
                title={collapsed ? "Clienti" : undefined}
              >
                <div className="pai-sidebar__item-icon">
                  <Icon
                    path="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01"
                    size={17}
                  />
                </div>
                <span className="pai-sidebar__item-label">Clienti</span>
              </NavLink>
            )}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="pai-sidebar__user">
        <div className="pai-sidebar__avatar">
          <div className="pai-sidebar__avatar-circle" title={collapsed ? displayName : undefined}>
            {initials}
          </div>
          <div className="pai-sidebar__online-dot" />
        </div>
        <div className="pai-sidebar__user-info">
          <div className="pai-sidebar__user-name">{displayName}</div>
          <div className="pai-sidebar__user-role">{roleName}</div>
        </div>
        <button className="pai-sidebar__logout" onClick={() => setShowLogout(true)} title={t("logout_modal.confirm")} >
          <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14} />
        </button>
      </div>

      {showLogout && (
        <div className="pai-logout-overlay" onClick={() => setShowLogout(false)}>
          <div className="pai-logout-modal" onClick={e => e.stopPropagation()}>
            <div className="pai-logout-modal__icon">
              <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={22} />
            </div>
            <div className="pai-logout-modal__title">{t("logout_modal.title")}</div>
            <div className="pai-logout-modal__msg">{t("logout_modal.message")}</div>
            <div className="pai-logout-modal__actions">
              <button className="pai-logout-modal__cancel" onClick={() => setShowLogout(false)}>{t("logout_modal.cancel")}</button>
              <button className="pai-logout-modal__confirm" onClick={onLogout}>{t("logout_modal.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
