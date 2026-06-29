import "./Team.css";

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"];

function avatarColor(email = "") {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(first, last) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export default function Team({ collaborators = [] }) {
  return (
    <div className="pai-view">
      <div className="pai-team__header">
        <div>
          <div className="pai-team__title">I miei collaboratori</div>
          <div className="pai-team__sub">
            {collaborators.length === 0
              ? "Nessun collaboratore ancora"
              : `${collaborators.length} ${collaborators.length === 1 ? "collaboratore" : "collaboratori"} con task in comune`}
          </div>
        </div>
      </div>

      {collaborators.length === 0 ? (
        <div className="pai-card pai-team__empty">
          <div className="pai-team__empty-icon">👥</div>
          <div className="pai-team__empty-title">Nessun collaboratore ancora</div>
          <div className="pai-team__empty-sub">
            I collaboratori appariranno qui quando assegnerai task ad altri utenti
            o verrai assegnato ai task di qualcuno.
          </div>
        </div>
      ) : (
        <div className="pai-team__grid">
          {collaborators.map(u => {
            const color = avatarColor(u.email);
            return (
              <div key={u.id} className="pai-card pai-team-card">
                <div className="pai-team-card__top">
                  <div className="pai-team-card__avatar" style={{ background: color }}>
                    {initials(u.first_name, u.last_name)}
                  </div>
                </div>

                <div className="pai-team-card__name">{u.first_name} {u.last_name}</div>
                <div className="pai-team-card__position">{u.role ?? "Utente"}</div>
                <div className="pai-team-card__email">{u.email}</div>

                <div className="pai-team-card__footer">
                  <span className="pai-chip" style={{
                    color:      u.is_active ? "#059669" : "#64748B",
                    background: u.is_active ? "#ECFDF5" : "#F1F5F9",
                  }}>
                    {u.is_active ? "Attivo" : "Inattivo"}
                  </span>

                  <span className="pai-chip pai-team-card__tasks-chip">
                    {u.shared_tasks_count} {u.shared_tasks_count === 1 ? "task" : "task"} in comune
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
