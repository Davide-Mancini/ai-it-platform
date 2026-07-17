import { useTranslation } from "react-i18next";
import Heximus_Logo_AI_Platform from "./assets/Heximus_Logo_AI_Platform_NoBG.png";

function PendingApprovalPage({ onLogout }) {
  const { t } = useTranslation();

  return (
    <div className="pai-logout-overlay">
      <div className="pai-logout-modal" style={{ width: 380 }}>
        <img src={Heximus_Logo_AI_Platform} alt="" style={{ width: 120, marginBottom: 4 }} />
        <div className="pai-logout-modal__title">{t("pending_approval.title")}</div>
        <div className="pai-logout-modal__msg">{t("pending_approval.message")}</div>
        <div className="pai-logout-modal__actions">
          <button
            className="pai-logout-modal__confirm"
            style={{ flex: "none", width: "100%", background: "#397BC0" }}
            onClick={onLogout}
          >
            {t("pending_approval.logout_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
