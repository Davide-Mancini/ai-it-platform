import { useState } from "react";
import "./UsersPage.css";

function Avatar({ firstName, lastName }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  const colors = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="pai-users__avatar" style={{ background: color }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const map = {
    Admin:       { color: "#DC2626", bg: "#FEF2F2" },
    "IT Manager":{ color: "#7C3AED", bg: "#F5F3FF" },
    Utente:      { color: "#2563EB", bg: "#EFF6FF" },
  };
  const s = map[role] || { color: "#64748B", bg: "#F1F5F9" };
  return (
    <span className="pai-chip" style={{ color: s.color, background: s.bg, fontSize: 11 }}>
      {role}
    </span>
  );
}

function EditModal({ user, roles, onClose, onSave, saving, error }) {
  const [form, setForm] = useState({
    first_name:  user.first_name,
    last_name:   user.last_name,
    email:       user.email,
    role_id:     roles.find(r => r.name === user.role)?.id || "",
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-users__edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-users__edit-header">
          <div>
            <div className="pai-users__edit-title">Modifica utente</div>
            <div className="pai-users__edit-sub">{user.email}</div>
          </div>
          <button className="pai-users__close-btn" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-users__edit-body">
          <div className="pai-users__edit-row">
            <div className="pai-field">
              <label className="pai-field__label">NOME</label>
              <input className="pai-field__input" value={form.first_name} onChange={e => set("first_name", e.target.value)} />
            </div>
            <div className="pai-field">
              <label className="pai-field__label">COGNOME</label>
              <input className="pai-field__input" value={form.last_name} onChange={e => set("last_name", e.target.value)} />
            </div>
          </div>

          <div className="pai-field">
            <label className="pai-field__label">EMAIL</label>
            <input className="pai-field__input" value={form.email} onChange={e => set("email", e.target.value)} type="email" />
          </div>

          <div className="pai-field">
            <label className="pai-field__label">RUOLO</label>
            <select className="pai-field__select" value={form.role_id} onChange={e => set("role_id", e.target.value)}>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ""}</option>
              ))}
            </select>
          </div>

          {error && <div className="pai-users__edit-error">{error}</div>}

          <div className="pai-users__edit-actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>Annulla</button>
            <button className="pai-btn pai-btn--primary" onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Salvataggio…" : "Salva modifiche"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage({ users, roles, loading, onSave }) {
  const [search, setSearch]       = useState("");
  const [editingUser, setEditing] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q)  ||
      u.email.toLowerCase().includes(q)      ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSave = async (form) => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(editingUser.id, form);
      setEditing(null);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pai-view">
      {/* Toolbar */}
      <div className="pai-users__toolbar">
        <div>
          <div className="pai-users__title">Gestione utenti</div>
          <div className="pai-users__sub">{users.length} utenti registrati</div>
        </div>
        <div className="pai-users__search-wrap">
          <svg className="pai-users__search-icon" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
          <input
            className="pai-users__search"
            placeholder="Cerca per nome, email o ruolo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="pai-card pai-users__table-wrap">
        {loading ? (
          <div className="pai-users__loading">Caricamento utenti…</div>
        ) : filtered.length === 0 ? (
          <div className="pai-users__empty">Nessun utente trovato.</div>
        ) : (
          <table className="pai-users__table">
            <thead>
              <tr>
                <th>Utente</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="pai-users__user-cell">
                      <Avatar firstName={u.first_name} lastName={u.last_name} />
                      <div>
                        <div className="pai-users__name">{u.first_name} {u.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="pai-users__email">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className="pai-chip" style={{
                      color: u.is_active ? "#059669" : "#64748B",
                      background: u.is_active ? "#ECFDF5" : "#F1F5F9",
                      fontSize: 11,
                    }}>
                      {u.is_active ? "Attivo" : "Inattivo"}
                    </span>
                  </td>
                  <td>
                    <button className="pai-users__edit-btn" onClick={() => { setEditing(u); setSaveError(""); }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Modifica
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          roles={roles}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}
    </div>
  );
}
