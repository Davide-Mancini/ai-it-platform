import { useTranslation } from "react-i18next";
import "../../style/NotFoundPage.css";

export default function NotFoundPage({ onBack }) {
  const { t } = useTranslation();

  return (
    <div className="pai-view">
      <div className="pai-card pai-notfound">
        <div className="pai-notfound__code">404</div>
        <div className="pai-notfound__title">{t("not_found.title")}</div>
        <div className="pai-notfound__sub">{t("not_found.message")}</div>
        <button className="pai-notfound__btn" onClick={onBack}>
          {t("not_found.back_btn")}
        </button>
      </div>
    </div>
  );
}
