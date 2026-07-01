import { useTranslation } from "react-i18next";
import "./Team.css";

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626"];

function avatarColor(email = "") {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(first, last) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export default function Team({ collaborators = [] }) {
  const { t } = useTranslation();

  const sub = collaborators.length === 0
    ? t("team.sub_none")
    : collaborators.length === 1
      ? t("team.sub_one")
      : t("team.sub_many", { count: collaborators.length });

  return (
    <div className="pai-view">
      <div className="pai-team__header">
        <div>
          <div className="pai-team__title">{t("team.title")}</div>
          <div className="pai-team__sub">{sub}</div>
        </div>
      </div>

      {collaborators.length === 0 ? (
        <div className="pai-card pai-team__empty">
          <div className="pai-team__empty-icon">👥</div>
          <div className="pai-team__empty-title">{t("team.empty_title")}</div>
          <div className="pai-team__empty-sub">{t("team.empty_sub")}</div>
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
                <div className="pai-team-card__position">{u.role ?? t("team.role_fallback")}</div>
                <div className="pai-team-card__email">{u.email}</div>

                <div className="pai-team-card__footer">
                  <span className="pai-chip" style={{
                    color:      u.is_active ? "#059669" : "#64748B",
                    background: u.is_active ? "#ECFDF5" : "#F1F5F9",
                  }}>
                    {u.is_active ? t("team.active") : t("team.inactive")}
                  </span>

                  <span className="pai-chip pai-team-card__tasks-chip">
                    {t("team.tasks_in_common", { count: u.shared_tasks_count })}
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
