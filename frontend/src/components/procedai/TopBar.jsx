import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./TopBar.css";

function BellIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

const LANGUAGES = [
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "lt", flag: "🇱🇹", label: "Lietuvių" },
];

export default function TopBar({ userInfo, unreadCount, isProcedureDetail = false }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
    setLangMenuOpen(false);
  };

  const PATH_TITLES = {
    "/dashboard":     { key: "nav.dashboard",     greeting: true },
    "/procedures":    { key: "nav.procedures",    greeting: false },
    "/tasks":         { key: "nav.tasks",         greeting: false },
    "/documents":     { key: "nav.documents",     greeting: false },
    "/team":          { key: "nav.team",          greeting: false },
    "/notifications": { key: "nav.notifications", greeting: false },
    "/settings":      { key: "nav.settings",      greeting: false },
    "/users":         { key: "nav.users",         greeting: false },
  };

  const cv = isProcedureDetail
    ? { title: t("topbar.procedure_detail"), greeting: false }
    : (() => {
        const entry = PATH_TITLES[pathname] || PATH_TITLES["/dashboard"];
        return { title: t(entry.key), greeting: entry.greeting };
      })();

  const displayName = userInfo
    ? [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || userInfo.email
    : "User";
  const initials = userInfo
    ? ((userInfo.first_name?.[0] || "") + (userInfo.last_name?.[0] || "")).toUpperCase() || userInfo.email?.[0]?.toUpperCase() || "U"
    : "U";

  return (
    <header className="pai-topbar">
      <div className="pai-topbar__left">
        <div className="pai-topbar__title">{cv.title}</div>
        {cv.greeting && (
          <div className="pai-topbar__sub">{t("topbar.greeting")}{`${displayName.split(" ")[0]}! :)`}</div>
        )}
      </div>

      <div className="pai-topbar__right">
        <div className="pai-topbar__notif-wrap" onClick={() => navigate("/notifications")}>
          <button className="pai-topbar__notif-btn"><BellIcon /></button>
          {unreadCount > 0 && <span className="pai-topbar__notif-dot">{unreadCount}</span>}
        </div>

        <div className="pai-topbar__lang-wrap">
          <button
            className="pai-topbar__lang-btn"
            onClick={() => setLangMenuOpen(o => !o)}
            title={t("topbar.change_language")}
          >
            {currentLang.flag}
          </button>
          {langMenuOpen && (
            <>
              <div className="pai-topbar__lang-backdrop" onClick={() => setLangMenuOpen(false)} />
              <div className="pai-topbar__lang-menu">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`pai-topbar__lang-option${lang.code === i18n.language ? " pai-topbar__lang-option--active" : ""}`}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    <span>{lang.flag}</span> {lang.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="pai-topbar__avatar" onClick={() => navigate("/settings")}>{initials}</div>
      </div>
    </header>
  );
}
