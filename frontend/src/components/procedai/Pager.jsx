import { useTranslation } from "react-i18next";
import "../../style/Pager.css";

export default function Pager({ page, pageSize, total, onPageChange }) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pai-pager">
      <span className="pai-pager__range">
        {t("pager.range", { from, to, total })}
      </span>
      <div className="pai-pager__controls">
        <button
          className="pai-pager__btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          {t("pager.prev")}
        </button>
        <span className="pai-pager__page">{t("pager.page_of", { page, totalPages })}</span>
        <button
          className="pai-pager__btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          {t("pager.next")}
        </button>
      </div>
    </div>
  );
}
