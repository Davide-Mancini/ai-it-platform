const API_BASE = "http://localhost:8000";

const headers = (token, json = false) => ({
  Authorization: `Bearer ${token}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const PROCEDURES_LOADING      = "PROCEDURES_LOADING";
export const PROCEDURES_SUCCESS      = "PROCEDURES_SUCCESS";
export const PROCEDURES_ERROR        = "PROCEDURES_ERROR";
export const PROCEDURE_ADD           = "PROCEDURE_ADD";
export const PROCEDURE_UPDATE        = "PROCEDURE_UPDATE";
export const PROCEDURE_REMOVE        = "PROCEDURE_REMOVE";
export const STEPS_LOADING           = "STEPS_LOADING";
export const STEPS_SUCCESS           = "STEPS_SUCCESS";
export const STEP_TOGGLE_START       = "STEP_TOGGLE_START";
export const STEP_TOGGLE_SUCCESS     = "STEP_TOGGLE_SUCCESS";
export const STEP_TOGGLE_DONE        = "STEP_TOGGLE_DONE";
export const PROCEDURES_RESET_STEPS  = "PROCEDURES_RESET_STEPS";
export const PROCEDURES_BROWSE_LOADING = "PROCEDURES_BROWSE_LOADING";
export const PROCEDURES_BROWSE_SUCCESS = "PROCEDURES_BROWSE_SUCCESS";

// Lista completa (non paginata) — usata da dropdown, dashboard, grafici e ovunque
// serva avere tutte le procedure disponibili lato client.
export const fetchProcedures = (token, lang) => async (dispatch) => {
  dispatch({ type: PROCEDURES_LOADING });
  try {
    const url = `${API_BASE}/api/procedures/${lang ? `?lang=${lang}` : ""}`;
    const res = await fetch(url, { headers: headers(token) });
    if (res.ok) {
      const data = await res.json();
      dispatch({ type: PROCEDURES_SUCCESS, payload: data.items });
    } else {
      dispatch({ type: PROCEDURES_ERROR, payload: "Errore caricamento procedure" });
    }
  } catch {
    dispatch({ type: PROCEDURES_ERROR, payload: "Errore di rete" });
  }
};

// Pagina singola con ricerca server-side — usata solo dalla griglia di ProcedureList.
export const fetchProceduresBrowse = (token, lang, { page = 1, pageSize = 25, search = "" } = {}) => async (dispatch) => {
  dispatch({ type: PROCEDURES_BROWSE_LOADING });
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (lang) params.set("lang", lang);
  if (search) params.set("search", search);
  const res = await fetch(`${API_BASE}/api/procedures/?${params.toString()}`, { headers: headers(token) });
  if (res.ok) {
    dispatch({ type: PROCEDURES_BROWSE_SUCCESS, payload: await res.json() });
  }
};

export const createProcedure = (token, { title, description, language }) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedures/`, {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify({ title, description, language }),
  });
  if (res.ok) {
    const newProc = await res.json();
    dispatch({ type: PROCEDURE_ADD, payload: newProc });
    return newProc;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore durante la creazione");
};

export const updateProcedure = (token, id, { title, description }) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedures/${id}`, {
    method: "PUT",
    headers: headers(token, true),
    body: JSON.stringify({ title, description }),
  });
  if (res.ok) {
    const updated = await res.json();
    dispatch({ type: PROCEDURE_UPDATE, payload: updated });
    return updated;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore durante la modifica");
};

export const deleteProcedure = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedures/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (res.ok) {
    dispatch({ type: PROCEDURE_REMOVE, payload: id });
    return;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore durante l'eliminazione");
};

export const fetchSteps = (token, procedureId, lang) => async (dispatch) => {
  dispatch({ type: STEPS_LOADING });
  const url = `${API_BASE}/api/procedures/${procedureId}/steps${lang ? `?lang=${lang}` : ""}`;
  const res = await fetch(url, {
    headers: headers(token),
  });
  if (res.ok) {
    dispatch({ type: STEPS_SUCCESS, payload: { procedureId, steps: await res.json() } });
  }
};

export const toggleStepStatus = (token, stepId, newStatus, procedureId) => async (dispatch) => {
  dispatch({ type: STEP_TOGGLE_START, payload: stepId });
  try {
    const res = await fetch(`${API_BASE}/api/procedures/steps/${stepId}/status`, {
      method: "PATCH",
      headers: headers(token, true),
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      dispatch({ type: STEP_TOGGLE_SUCCESS, payload: { step: await res.json(), procedureId } });
      return;
    }
  } finally {
    dispatch({ type: STEP_TOGGLE_DONE });
  }
};

export const acceptRecommendation = (token, rec, lang) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/ai/recommendations/${rec.id}/accept`, {
    method: "POST",
    headers: headers(token),
  });
  if (res.ok) {
    await dispatch(fetchProcedures(token, lang));
    return true;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore durante l'accettazione");
};

export const rejectRecommendation = (token, rec) => async () => {
  await fetch(`${API_BASE}/api/ai/recommendations/${rec.id}/reject`, {
    method: "POST",
    headers: headers(token),
  });
};
