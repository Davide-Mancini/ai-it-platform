import { useState } from "react";
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
  const roleName = userInfo?.role?.name || userInfo?.role || "Utente";

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
      setError("Tutti i campi sono obbligatori.");
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
        setError(data.detail || "Errore durante il salvataggio.");
      }
    } catch {
      setError("Errore di rete. Riprova.");
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
      <div className="pai-settings__title">Impostazioni</div>

      <div className="pai-settings__sections">
        {/* Profilo */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">Profilo</div>
            {!editing && (
              <button className="pai-settings__edit-btn" onClick={startEdit}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifica
              </button>
            )}
          </div>

          {success && (
            <div className="pai-settings__success">Profilo aggiornato con successo.</div>
          )}
          {error && (
            <div className="pai-settings__error">{error}</div>
          )}

          <SettingRow label="Nome" desc="Il tuo nome">
            {editing
              ? <input {...field("first_name")} placeholder="Nome" />
              : <input className="pai-settings__input" value={userInfo?.first_name || "—"} readOnly />
            }
          </SettingRow>

          <SettingRow label="Cognome" desc="Il tuo cognome">
            {editing
              ? <input {...field("last_name")} placeholder="Cognome" />
              : <input className="pai-settings__input" value={userInfo?.last_name || "—"} readOnly />
            }
          </SettingRow>

          <SettingRow label="Email" desc="L'indirizzo email associato al tuo account">
            {editing
              ? <input {...field("email")} type="email" placeholder="email@esempio.com" />
              : <input className="pai-settings__input" value={userInfo?.email || "—"} readOnly />
            }
          </SettingRow>

          <SettingRow label="Ruolo" desc="Il tuo ruolo nell'organizzazione">
            <span className="pai-chip" style={{ color: "#2563EB", background: "#EFF6FF" }}>{roleName}</span>
          </SettingRow>

          {editing && (
            <div className="pai-settings__form-actions">
              <button className="pai-btn pai-btn--ghost" onClick={cancelEdit} disabled={saving}>
                Annulla
              </button>
              <button className="pai-btn pai-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
            </div>
          )}
        </div>

        {/* Notifiche */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">Notifiche</div>
          </div>
          <SettingRow label="Notifiche email" desc="Ricevi aggiornamenti via email">
            <label
              className="pai-settings__toggle pai-settings__toggle--locked"
              title="Le notifiche email non possono essere disattivate"
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
              Non è possibile disattivare le notifiche email: tutte le comunicazioni ufficiali verranno inviate esclusivamente tramite posta elettronica.
            </div>
          )}
          <SettingRow
            label="Notifiche push"
            desc={
              !("serviceWorker" in navigator) || !("PushManager" in window)
                ? "Non supportate da questo browser"
                : "Notifiche native anche a tab chiusa"
            }
          >
            <label
              className={`pai-settings__toggle${push.loading ? " pai-settings__toggle--locked" : ""}`}
              title={
                !("serviceWorker" in navigator) || !("PushManager" in window)
                  ? "Il tuo browser non supporta le notifiche push"
                  : push.loading
                    ? "Caricamento…"
                    : push.enabled ? "Clicca per disattivare" : "Clicca per attivare"
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

        {/* Applicazione */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-header">
            <div className="pai-settings__section-title">Applicazione</div>
          </div>
          <SettingRow label="Versione" desc="Versione dell'applicazione">
            <span className="pai-chip" style={{ color: "#475569", background: "#F1F5F9" }}>1.0.0</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
