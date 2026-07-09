const API_BASE = "http://localhost:8000";

export const REVIEW_FINDINGS_LOADING = "REVIEW_FINDINGS_LOADING";
export const REVIEW_FINDINGS_SUCCESS = "REVIEW_FINDINGS_SUCCESS";
export const REVIEW_FINDING_UPDATE   = "REVIEW_FINDING_UPDATE";
export const REVIEW_RUN_STARTED      = "REVIEW_RUN_STARTED";
export const REVIEW_RUN_UPDATE       = "REVIEW_RUN_UPDATE";
export const REVIEW_RUNS_SUCCESS     = "REVIEW_RUNS_SUCCESS";

export const fetchReviewFindings = (filters = {}, page = 1, pageSize = 20) => async (dispatch) => {
  dispatch({ type: REVIEW_FINDINGS_LOADING });
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);

  const res = await fetch(`${API_BASE}/api/procedure-review/findings?${params.toString()}`, {
    credentials: "include",
  });
  if (res.ok) {
    dispatch({ type: REVIEW_FINDINGS_SUCCESS, payload: await res.json() });
  }
};

export const fetchReviewRuns = (page = 1, pageSize = 5) => async (dispatch) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  const res = await fetch(`${API_BASE}/api/procedure-review/runs?${params.toString()}`, {
    credentials: "include",
  });
  if (res.ok) {
    dispatch({ type: REVIEW_RUNS_SUCCESS, payload: await res.json() });
  }
};

export const triggerReview = () => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedure-review/run`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante l'avvio della revisione");
  }
  const run = await res.json();
  // Normalizziamo su "id" (invece di "run_id") cosi' lo stato ha sempre la stessa
  // forma sia dopo il trigger (ReviewRunTriggerOut) sia dopo un refresh (ProcedureReviewRunOut).
  const normalized = { ...run, id: run.run_id };
  dispatch({ type: REVIEW_RUN_STARTED, payload: normalized });
  return normalized;
};

export const fetchRunStatus = (runId) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedure-review/runs/${runId}`, {
    credentials: "include",
  });
  if (res.ok) {
    const run = await res.json();
    dispatch({ type: REVIEW_RUN_UPDATE, payload: run });
    return run;
  }
};

export const acceptFinding = (findingId) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedure-review/findings/${findingId}/accept`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante l'applicazione della modifica");
  }
  dispatch({ type: REVIEW_FINDING_UPDATE, payload: { id: findingId, status: "accepted" } });
};

export const rejectFinding = (findingId) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/procedure-review/findings/${findingId}/reject`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante lo scarto della segnalazione");
  }
  const updated = await res.json();
  dispatch({ type: REVIEW_FINDING_UPDATE, payload: updated });
};
