import { useState } from "react";
import "./UsersPage.css";
import { useTranslation } from "react-i18next";
import { ChartCard, HorizontalBarChart } from "./ChartPrimitives";
import { ROLE_COLORS } from "./constants";
import Pager from "./Pager";


const API_BASE = "http://localhost:8000";

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
  const s = ROLE_COLORS[role] || { color: "#64748B", bg: "#F1F5F9" };
  return (
    <span className="pai-chip" style={{ color: s.color, background: s.bg, fontSize: 11 }}>
      {role}
    </span>
  );
}

function SendEmailModal({ users, onClose }) {
  const { t } = useTranslation();
  const [mode, setMode]               = useState("all"); // "all" | "role" | "select"
  const [selectedRoles, setRoles]     = useState(new Set());
  const [selected, setSelected]       = useState(new Set());
  const [subject, setSubject]         = useState("");
  const [body, setBody]               = useState("");
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  const roleColors = ROLE_COLORS;

  const roleGroups = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const availableRoles = Object.keys(roleGroups).sort();

  const toggleRole = (role) =>
    setRoles(prev => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });

  const toggleUser = (id) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const usersForRoles = users.filter(u => selectedRoles.has(u.role));

  const recipientCount =
    mode === "all"    ? users.length :
    mode === "role"   ? usersForRoles.length :
    selected.size;

  const resolvedUserIds =
    mode === "all"    ? null :
    mode === "role"   ? usersForRoles.map(u => u.id) :
    [...selected];

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Oggetto e corpo del messaggio sono obbligatori.");
      return;
    }
    if (mode === "select" && selected.size === 0) {
      setError("Seleziona almeno un destinatario.");
      return;
    }
    if (mode === "role" && selectedRoles.size === 0) {
      setError("Seleziona almeno un ruolo.");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        subject: subject.trim(),
        body_html: body.trim().split("\n").map(l => `<p style="margin:0 0 10px 0">${l}</p>`).join(""),
        user_ids: resolvedUserIds,
      };
      const res = await fetch(`${API_BASE}/api/auth/send-bulk-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(`Email inviata a ${data.sent} destinatar${data.sent === 1 ? "io" : "i"}.${data.failed > 0 ? ` ${data.failed} falliti.` : ""}`);
        setSubject("");
        setBody("");
        setSelected(new Set());
        setRoles(new Set());
      } else {
        setError(data.detail || "Errore durante l'invio.");
      }
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-email-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-users__edit-header">
          <div>
            <div className="pai-users__edit-title">{t("users.email_modal_title")}</div>
            <div className="pai-users__edit-sub">{t("users.email_modal_sub")}</div>
          </div>
          <button className="pai-users__close-btn" onClick={onClose}>
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <line x1={4} y1={4} x2={12} y2={12} /><line x1={12} y1={4} x2={4} y2={12} />
            </svg>
          </button>
        </div>

        <div className="pai-email-modal__body">
          <div className="pai-field">
            <label className="pai-field__label text-black">{t("users.email_subject")}</label>
            <input
              className="pai-field__input"
              placeholder={t("users.email_subject_placeholder")}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="pai-field">
            <label className="pai-field__label text-black">{t("users.email_body")}</label>
            <textarea
              className="pai-email-modal__textarea"
              placeholder={t("users.email_body_placeholder")}
              value={body}
              onChange={e => setBody(e.target.value)}
              disabled={sending}
            />
          </div>

          <div>
            <div className="pai-email-modal__recipients-label text-black">{t("users.email_recipients")}</div>
            <div className="pai-email-modal__mode">
              <button
                className={`pai-email-modal__mode-btn${mode === "all" ? " pai-email-modal__mode-btn--active" : ""}`}
                onClick={() => setMode("all")}
              >
                {t('users.all')} ({users.length})
              </button>
              <button
                className={`pai-email-modal__mode-btn${mode === "role" ? " pai-email-modal__mode-btn--active" : ""}`}
                onClick={() => setMode("role")}
              >
                {t('users.by_role')}
              </button>
              <button
                className={`pai-email-modal__mode-btn${mode === "select" ? " pai-email-modal__mode-btn--active" : ""}`}
                onClick={() => setMode("select")}
              >
                {t('users.select_users')}
              </button>
            </div>

            {mode === "role" && (
              <div className="pai-email-modal__role-grid">
                {availableRoles.map(role => {
                  const c = roleColors[role] || { color: "#64748B", bg: "#F1F5F9" };
                  const active = selectedRoles.has(role);
                  return (
                    <button
                      key={role}
                      className={`pai-email-modal__role-chip${active ? " pai-email-modal__role-chip--active" : ""}`}
                      style={active ? { borderColor: c.color, color: c.color, background: c.bg } : {}}
                      onClick={() => toggleRole(role)}
                    >
                      {active && (
                        <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                      {role}
                      <span className="pai-email-modal__role-count">{roleGroups[role]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {mode === "select" && (
              <div className="pai-email-modal__user-list">
                {users.map(u => (
                  <label key={u.id} className="pai-email-modal__user-item">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleUser(u.id)}
                    />
                    <span className="pai-email-modal__user-name">{u.first_name} {u.last_name}</span>
                    <span className="pai-email-modal__user-role">{u.role}</span>
                    <span className="pai-email-modal__user-email">{u.email}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="pai-email-modal__counter">
              {recipientCount} {recipientCount === 1 ? t('users.recipients_count_singular') : t('users.recipients_count_plural')}
            </div>
          </div>

          {error   && <div className="pai-users__edit-error">{error}</div>}
          {success && <div className="pai-email-modal__success">{success}</div>}

          <div className="pai-users__edit-actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose} disabled={sending}>{t('users.btn_close')}</button>
            <button className="pai-btn pai-btn--primary" onClick={handleSend} disabled={sending || recipientCount === 0}>
              {sending ? "Invio in corso…" : (recipientCount === 1 ? t('users.btn_send_singular', { count: recipientCount }) : t('users.btn_send_plural', { count: recipientCount }))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, roles, customers = [], onClose, onSave, onToggleActive, saving, error }) {
  const { t} = useTranslation();
  const [form, setForm] = useState({
    first_name:  user.first_name,
    last_name:   user.last_name,
    email:       user.email,
    role_id:     roles.find(r => r.name === user.role)?.id || "",
    customer_id: user.customer_id || "",
  });
  const [toggling, setToggling] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const selectedRoleName = roles.find(r => r.id === form.role_id)?.name;
  const isCustomerRole = selectedRoleName === "Customer";

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggleActive(user.id, !user.is_active); }
    finally { setToggling(false); }
  };

  return (
    <div className="pai-overlay" onClick={onClose}>
      <div className="pai-modal-box pai-users__edit-modal" onClick={e => e.stopPropagation()}>
        <div className="pai-users__edit-header">
          <div>
            <div className="pai-users__edit-title">{t('users.modal_title')}</div>
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
              <label className="pai-field__label">{t('users.modal_edit_name')}</label>
              <input className="pai-field__input" value={form.first_name} onChange={e => set("first_name", e.target.value)} />
            </div>
            <div className="pai-field">
              <label className="pai-field__label">{t('users.modal_edit_surname')}</label>
              <input className="pai-field__input" value={form.last_name} onChange={e => set("last_name", e.target.value)} />
            </div>
          </div>

          <div className="pai-field">
            <label className="pai-field__label">{t('users.modal_edit_email')}</label>
            <input className="pai-field__input" value={form.email} onChange={e => set("email", e.target.value)} type="email" />
          </div>

          <div className="pai-field">
            <label className="pai-field__label">{t('users.modal_edit_role')}</label>
            <select className="pai-field__select" value={form.role_id} onChange={e => set("role_id", e.target.value)}>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ""}</option>
              ))}
            </select>
          </div>

          {isCustomerRole && (
            <div className="pai-field">
              <label className="pai-field__label">Azienda cliente</label>
              <select className="pai-field__select" value={form.customer_id} onChange={e => set("customer_id", e.target.value)}>
                <option value="">Seleziona un'azienda…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle stato account */}
          <div className="pai-users__active-row">
            <div>
              <div className="pai-users__active-label">{t('users.modal_edit_status')}</div>
              <div className="pai-users__active-sub">
                {user.is_active ? t('users.modal_edit_status_sub') : t('users.modal_edit_status_sub_inactive')}
              </div>
            </div>
            <button
              className={`pai-users__toggle${user.is_active ? " pai-users__toggle--on" : ""}`}
              onClick={handleToggle}
              disabled={toggling}
              title={user.is_active ? t('users.modal_edit_status_sub_active') : t('users.modal_edit_status_sub_inactive_title')}
            >
              <span className="pai-users__toggle-knob" />
            </button>
          </div>

          {error && <div className="pai-users__edit-error">{error}</div>}

          <div className="pai-users__edit-actions">
            <button className="pai-btn pai-btn--ghost" onClick={onClose}>{t('users.modal_edit_btn_close')}</button>
            <button
              className="pai-btn pai-btn--primary"
              onClick={() => onSave(form)}
              disabled={saving || (isCustomerRole && !form.customer_id)}
            >
              {saving ? t('users.modal_edit_btn_saving') : t('users.modal_edit_btn_save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkloadChart({ workload }) {
  const { t } = useTranslation();
  const data = (workload || [])
    .filter(w => w.open_tasks > 0)
    .map(w => ({
      key: w.user_id,
      label: `${w.first_name} ${w.last_name?.[0] || ""}.`,
      value: w.open_tasks,
      color: "#D97706",
    }));
  const empty = data.length === 0 ? t("charts.no_data") : null;
  return (
    <ChartCard title={t("users.workload_title")} sub={t("users.workload_sub")} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

function UserRolesChart({ roleStats }) {
  const { t } = useTranslation();
  const data = (roleStats || []).map(({ role, count }) => ({
    key: role,
    label: role,
    value: count,
    color: (ROLE_COLORS[role] || {}).color || "#64748B",
  }));
  const empty = data.length === 0 ? t("charts.no_data") : null;
  return (
    <ChartCard title={t("users.roles_title")} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

export default function UsersPage({ users, roles, customers = [], onSave, onToggleActive, token, workload = [], roleStats = [], browse, search, onSearchChange, onPageChange, onRefreshCharts }) {
  const { t } = useTranslation();
  const [editingUser, setEditing] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [refreshingCharts, setRefreshingCharts] = useState(false);

  const filtered = browse.items;

  const handleRefreshCharts = async () => {
    if (!onRefreshCharts || refreshingCharts) return;
    setRefreshingCharts(true);
    try { await onRefreshCharts(); } finally { setRefreshingCharts(false); }
  };

  const handleSave = async (form) => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(editingUser.id, { ...form, customer_id: form.customer_id || null });
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
          <div className="pai-users__title">{t("users.title") }</div>
          <div className="pai-users__sub">{t("users.users_registered", { count: browse.total })}</div>
        </div>
        <div className="pai-users__toolbar-right">
          <div className="pai-users__search-wrap">
            <svg className="pai-users__search-icon" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
            </svg>
            <input
              className="pai-users__search"
              placeholder={t("users.search_placeholder")}
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
          <button className="pai-users__send-btn" onClick={() => setShowEmail(true)}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {t("users.send_email_btn")}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="pai-users__charts-header">
        <button
          className={`pai-users__refresh-btn${refreshingCharts ? " pai-users__refresh-btn--spinning" : ""}`}
          onClick={handleRefreshCharts}
          title={t("users.refresh_charts")}
          disabled={refreshingCharts}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>
      <div className="pai-users__chart-row">
        <WorkloadChart workload={workload} />
        <UserRolesChart roleStats={roleStats} />
      </div>

      {/* Table */}
      <div className="pai-card pai-users__table-wrap">
        {browse.loading ? (
          <div className="pai-users__loading">{t("users.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="pai-users__empty">{t("users.no_users")}</div>
        ) : (
          <table className="pai-users__table">
            <thead>
              <tr>
                <th>{t("users.col_user")}</th>
                <th>{t("users.col_email")}</th>
                <th>{t("users.col_role")}</th>
                <th>{t("users.col_status")}</th>
                <th>{t("users.col_actions")}</th>
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
                      color: u.is_active ? "#059669" : "#FD2828",
                      background: u.is_active ? "#ECFDF5" : "#FDF2F2",
                      fontSize: 11,
                    }}>
                      {u.is_active ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td>
                    <button className="pai-users__edit-btn" onClick={() => { setEditing(u); setSaveError(""); }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {t("users.edit_btn")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 0 && (
          <Pager
            page={browse.page}
            pageSize={browse.pageSize}
            total={browse.total}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          roles={roles}
          customers={customers}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onToggleActive={onToggleActive}
          saving={saving}
          error={saveError}
        />
      )}

      {showEmail && (
        <SendEmailModal
          users={users}
          token={token}
          onClose={() => setShowEmail(false)}
        />
      )}
    </div>
  );
}
