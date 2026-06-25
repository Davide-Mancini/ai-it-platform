import "./Settings.css";

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

export default function Settings({ userInfo }) {
  const displayName = userInfo
    ? [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || userInfo.email
    : "Utente";
  const roleName = userInfo?.role?.name || userInfo?.role || "Utente";

  return (
    <div className="pai-view">
      <div className="pai-settings__title">Impostazioni</div>

      <div className="pai-settings__sections">
        {/* Profilo */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-title">Profilo</div>
          <SettingRow label="Nome" desc="Il tuo nome visualizzato nell'applicazione">
            <input className="pai-settings__input" value={displayName} readOnly />
          </SettingRow>
          <SettingRow label="Email" desc="L'indirizzo email associato al tuo account">
            <input className="pai-settings__input" value={userInfo?.email || "—"} readOnly />
          </SettingRow>
          <SettingRow label="Ruolo" desc="Il tuo ruolo nell'organizzazione">
            <span className="pai-chip" style={{ color: "#2563EB", background: "#EFF6FF" }}>{roleName}</span>
          </SettingRow>
        </div>

        {/* Notifiche */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-title">Notifiche</div>
          <SettingRow label="Notifiche email" desc="Ricevi aggiornamenti via email">
            <label className="pai-settings__toggle">
              <input type="checkbox" defaultChecked />
              <span className="pai-settings__toggle-slider" />
            </label>
          </SettingRow>
          <SettingRow label="Notifiche push" desc="Notifiche nel browser">
            <label className="pai-settings__toggle">
              <input type="checkbox" />
              <span className="pai-settings__toggle-slider" />
            </label>
          </SettingRow>
        </div>

        {/* Applicazione */}
        <div className="pai-card pai-settings__section">
          <div className="pai-settings__section-title">Applicazione</div>
          <SettingRow label="Versione" desc="Versione dell'applicazione">
            <span className="pai-chip" style={{ color: "#475569", background: "#F1F5F9" }}>1.0.0</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
