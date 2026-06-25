import { MOCK_TEAM } from "./constants";
import "./Team.css";

export default function Team() {
  return (
    <div className="pai-view">
      <div className="pai-team__header">
        <div>
          <div className="pai-team__title">Team</div>
          <div className="pai-team__sub">{MOCK_TEAM.length} membri · {MOCK_TEAM.filter(u => u.online).length} online</div>
        </div>
      </div>

      <div className="pai-team__grid">
        {MOCK_TEAM.map(u => (
          <div key={u.id} className="pai-card pai-team-card">
            <div className="pai-team-card__top">
              <div className="pai-team-card__avatar" style={{ background: u.color }}>
                {u.initials}
                {u.online && <div className="pai-team-card__online" />}
              </div>
            </div>
            <div className="pai-team-card__name">{u.name}</div>
            <div className="pai-team-card__position">{u.position}</div>
            <div className="pai-team-card__email">{u.email}</div>
            <div className="pai-team-card__status">
              <span className="pai-chip" style={{
                color: u.online ? "#059669" : "#64748B",
                background: u.online ? "#ECFDF5" : "#F1F5F9",
              }}>
                {u.online ? "● Online" : "Offline"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
