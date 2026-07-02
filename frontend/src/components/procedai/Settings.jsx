import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import "./Settings.css";
import { usePushNotifications } from "../../hooks/usePushNotifications";

const API_BASE = "http://localhost:8000";

function SettingRow({ label, desc, children }) {
  return (
    <div className="pai-settings__row">
      <div>
        <div className="pai-settings__row-label">{label}</div>
        {desc && <div className="pai-settings__row-desc">{desc}</div>}
      </div>
      <div className="pai-settings__row-control">{children}</div>
    </div>
  );
}

export default function Settings({ userInfo, token, onProfileUpdate }) {
  const { t } = useTranslation();
  const roleName = userInfo?.role?.name || userInfo?.role || t("sidebar.role_fallback");

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [emailToggleError, setEmailToggleError] = useState(false);
  const push = usePushNotifications(token);
  const [form, setForm] = useState({
    first_name: userInfo?.first_name || "",
    last_name:  userInfo?.last_name  || "",
    email:      userInfo?.email      || "",
  });

  const startEdit = () => {
    setForm({
      first_name: userInfo?.first_name || "",
      last_name:  userInfo?.last_name  || "",
      email:      userInfo?.email      || "",
    });
    setError("");
    setSuccess(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError(t("settings.err_all_fields"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (onProfileUpdate) await onProfileUpdate();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || t("settings.err_save"));
      }
    } catch {
      setError(t("settings.err_network"));
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
    className: "pai-settings__input pai-settings__input--edit",
    disabled: saving,
  });

  return (
    <div className="pai-view d-flex flex-column align-items-center">
      <div className="pai-settings__title">{t("settings.title")}</div>

      <div className="pai-settings__sections">
        {/* Profilo */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">{t("settings.profile_section")}</div>
            {!editing && (
              <button className="pai-settings__edit-btn" onClick={startEdit}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {t("settings.edit_btn")}
              </button>
            )}
          </div>

          {success && (
            <div className="pai-settings__success">{t("settings.success")}</div>
          )}
          {error && (
            <div className="pai-settings__error">{error}</div>
          )}

          <SettingRow label={t("settings.first_name_label")} desc={t("settings.first_name_desc")}>
            {editing
              ? <input {...field("first_name")} placeholder={t("settings.first_name_placeholder")} />
              : <input className="pai-settings__input" value={userInfo?.first_name || "—"} readOnly />
            }
          </SettingRow>

          <SettingRow label={t("settings.last_name_label")} desc={t("settings.last_name_desc")}>
            {editing
              ? <input {...field("last_name")} placeholder={t("settings.last_name_placeholder")} />
              : <input className="pai-settings__input" value={userInfo?.last_name || "—"} readOnly />
            }
          </SettingRow>

          <SettingRow label={t("settings.email_label")} desc={t("settings.email_desc")}>
            {editing
              ? <input {...field("email")} type="email" placeholder={t("settings.email_placeholder")} />
              : <input className="pai-settings__input" value={userInfo?.email || "—"} readOnly />
            }
          </SettingRow>

          <SettingRow label={t("settings.role_label")} desc={t("settings.role_desc")}>
            <span className="pai-chip" style={{ color: "#2563EB", background: "#EFF6FF" }}>{roleName}</span>
          </SettingRow>

          {editing && (
            <div className="pai-settings__form-actions">
              <button className="pai-btn pai-btn--ghost" onClick={cancelEdit} disabled={saving}>
                {t("settings.cancel")}
              </button>
              <button className="pai-btn pai-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
            </div>
          )}
        </div>

        {/* Notifiche */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">{t("settings.notifications_section")}</div>
          </div>
          <SettingRow label={t("settings.email_notif_label")} desc={t("settings.email_notif_desc")}>
            <label
              className="pai-settings__toggle pai-settings__toggle--locked"
              title={t("settings.email_notif_locked_title")}
            >
              <input
                type="checkbox"
                checked={true}
                onChange={() => {
                  setEmailToggleError(true);
                  setTimeout(() => setEmailToggleError(false), 5000);
                }}
              />
              <span className="pai-settings__toggle-slider" />
            </label>
          </SettingRow>
          {emailToggleError && (
            <div className="pai-settings__error" style={{ marginTop: -4 }}>
              {t("settings.email_notif_err")}
            </div>
          )}
          <SettingRow
            label={t("settings.push_notif_label")}
            desc={
              !("serviceWorker" in navigator) || !("PushManager" in window)
                ? t("settings.push_not_supported")
                : t("settings.push_notif_desc")
            }
          >
            <label
              className={`pai-settings__toggle${push.loading ? " pai-settings__toggle--locked" : ""}`}
              title={
                !("serviceWorker" in navigator) || !("PushManager" in window)
                  ? t("settings.push_browser_title")
                  : push.loading
                    ? t("settings.push_loading_title")
                    : push.enabled ? t("settings.push_disable_title") : t("settings.push_enable_title")
              }
            >
              <input
                type="checkbox"
                checked={push.enabled}
                disabled={push.loading || !("serviceWorker" in navigator) || !("PushManager" in window)}
                onChange={() => push.enabled ? push.disable() : push.enable()}
              />
              <span className="pai-settings__toggle-slider" />
            </label>
          </SettingRow>
          {push.error && (
            <div className="pai-settings__error" style={{ marginTop: -4 }}>
              {push.error}
            </div>
          )}
        </div>

        {/* Lingua */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">{t("settings.language_section")}</div>
          </div>
          <SettingRow label={t("settings.language_label")} desc={t("settings.language_desc")}>
            <div className="pai-settings__lang-switcher">
              {[
                { code: "it", label: "🇮🇹 Italiano" },
                { code: "en", label: "🇬🇧 English" },
                { code: "lt", label: "🇱🇹 Lietuvių" },
              ].map(lang => (
                <button
                  key={lang.code}
                  className={`pai-settings__lang-btn${i18n.language === lang.code ? " pai-settings__lang-btn--active" : ""}`}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    localStorage.setItem("lang", lang.code);
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* Applicazione */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">{t("settings.app_section")}</div>
          </div>
          <SettingRow label={t("settings.version_label")} desc={t("settings.version_desc")}>
            <span className="pai-chip" style={{ color: "#475569", background: "#F1F5F9" }}>1.0.0</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
