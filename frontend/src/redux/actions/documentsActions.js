const API_BASE = "http://localhost:8000";

export const DOCUMENTS_LOADING = "DOCUMENTS_LOADING";
export const DOCUMENTS_SUCCESS = "DOCUMENTS_SUCCESS";
export const DOCUMENT_UPDATE   = "DOCUMENT_UPDATE";
export const DOCUMENT_REMOVE   = "DOCUMENT_REMOVE";

export const fetchDocuments = (token) => async (dispatch) => {
  dispatch({ type: DOCUMENTS_LOADING });
  const res = await fetch(`${API_BASE}/api/documents/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    dispatch({ type: DOCUMENTS_SUCCESS, payload: await res.json() });
  }
};

export const updateDocument = (token, id, data) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/documents/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

export const deleteDocument = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/documents/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante l'eliminazione");
  }
  dispatch({ type: DOCUMENT_REMOVE, payload: id });
};
