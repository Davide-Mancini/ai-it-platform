import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../style/UsersPage.css";
import { API_BASE as API_ORIGIN } from "../../config/api";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerDocumentsPage({ documents, loading, tasks, onUpload }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [taskId, setTaskId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const linkableTasks = (tasks || []).filter(tk => tk.requires_customer_input);

  const handleUpload = async () => {
    if (!title.trim() || !file || uploading) return;
    setUploading(true);
    setError("");
    try {
      await onUpload({ title: title.trim(), file, taskId: taskId || null });
      setTitle("");
      setFile(null);
      setTaskId("");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pai-view">
      <div className="pai-users__toolbar">
        <div>
          <div className="pai-users__title">{t("customer.documents_title")}</div>
          <div className="pai-users__sub">{documents.length}</div>
        </div>
      </div>

      <div className="pai-card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="pai-field">
          <label className="pai-field__label">{t("customer.field_title")}</label>
          <input
            className="pai-field__input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t("customer.field_title")}
          />
        </div>

        <div className="pai-task-form__row" style={{ marginTop: 12 }}>
          <div className="pai-field" style={{ flex: 1 }}>
            <label className="pai-field__label">{t("customer.field_file")}</label>
            <input
              className="pai-field__input"
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="pai-field" style={{ flex: 1 }}>
            <label className="pai-field__label">{t("customer.field_task_optional")}</label>
            <select className="pai-field__select" value={taskId} onChange={e => setTaskId(e.target.value)}>
              <option value="">—</option>
              {linkableTasks.map(tk => (
                <option key={tk.id} value={tk.id}>{tk.title}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="pai-users__edit-error">{error}</div>}

        <div className="pai-task-form__actions" style={{ marginTop: 16 }}>
          <button
            className="pai-btn pai-btn--primary"
            disabled={uploading || !title.trim() || !file}
            onClick={handleUpload}
          >
            {uploading ? t("customer.uploading") : t("customer.upload_btn")}
          </button>
        </div>
      </div>

      <div className="pai-card pai-users__table-wrap">
        {loading ? (
          <div className="pai-users__loading">…</div>
        ) : documents.length === 0 ? (
          <div className="pai-users__empty">{t("customer.no_documents")}</div>
        ) : (
          <table className="pai-users__table">
            <thead>
              <tr>
                <th>{t("customer.field_title")}</th>
                <th>{t("customer.linked_task")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map(d => {
                const linkedTask = linkableTasks.find(tk => tk.id === d.task_id);
                return (
                  <tr key={d.id}>
                    <td className="pai-users__name">{d.title}</td>
                    <td>{linkedTask ? linkedTask.title : "—"}</td>
                    <td>
                      {d.file_path && (
                        <a href={`${API_ORIGIN}${d.file_path}`} target="_blank" rel="noreferrer">
                          {formatDate(d.created_at)}
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
