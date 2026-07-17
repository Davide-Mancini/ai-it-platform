import { API_BASE } from "../../config/api";

export const DOCUMENTS_LOADING = "DOCUMENTS_LOADING";
export const DOCUMENTS_SUCCESS = "DOCUMENTS_SUCCESS";
export const DOCUMENT_UPDATE   = "DOCUMENT_UPDATE";
export const DOCUMENT_REMOVE   = "DOCUMENT_REMOVE";
export const DOCUMENT_ADDED    = "DOCUMENT_ADDED";

export const fetchDocuments = (token) => async (dispatch) => {
  dispatch({ type: DOCUMENTS_LOADING });
  const res = await fetch(`${API_BASE}/api/documents/documents`, {
    credentials: "include",
  });
  if (res.ok) {
    dispatch({ type: DOCUMENTS_SUCCESS, payload: await res.json() });
  }
};

export const updateDocument = (token, id, data) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/documents/documents/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante la modifica");
  }
  const updated = await res.json();
  dispatch({ type: DOCUMENT_UPDATE, payload: updated });
  return updated;
};

export const uploadDocument = (token, { title, file, taskId }) => async (dispatch) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  if (taskId) formData.append("task_id", taskId);
  const res = await fetch(`${API_BASE}/api/documents/documents/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante il caricamento del documento");
  }
  const created = await res.json();
  dispatch({ type: DOCUMENT_ADDED, payload: created });
  return created;
};

export const deleteDocument = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/documents/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante l'eliminazione");
  }
  dispatch({ type: DOCUMENT_REMOVE, payload: id });
};
