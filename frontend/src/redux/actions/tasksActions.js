const API_BASE = "http://localhost:8000";

// Il token viaggia in un cookie httpOnly gestito dal browser: qui serve solo
// impostare Content-Type quando c'e' un body JSON. "token" resta come parametro
// per non toccare tutti i punti di chiamata, ma non viene piu' usato per l'header.
const headers = (token, json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const TASKS_LOADING        = "TASKS_LOADING";
export const TASKS_SUCCESS        = "TASKS_SUCCESS";
export const TASK_ADD             = "TASK_ADD";
export const TASK_STATUS_UPDATE   = "TASK_STATUS_UPDATE";
export const TASK_PRIORITY_UPDATE = "TASK_PRIORITY_UPDATE";
export const TASK_ASSIGN_UPDATE   = "TASK_ASSIGN_UPDATE";

export const fetchAllTasks = (token, lang) => async (dispatch) => {
  dispatch({ type: TASKS_LOADING });
  const url = `${API_BASE}/api/tasks/${lang ? `?lang=${lang}` : ""}`;
  const res = await fetch(url, { credentials: "include", headers: headers(token) });
  if (res.ok) {
    dispatch({ type: TASKS_SUCCESS, payload: await res.json() });
  }
};

export const createTask = (token, procedureId, title, priority = "low", requiresCustomerInput = false) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/procedures/${procedureId}/tasks`, {
    method: "POST",
    credentials: "include", headers: headers(token, true),
    body: JSON.stringify({ title, priority, requires_customer_input: requiresCustomerInput }),
  });
  if (res.ok) {
    const task = await res.json();
    dispatch({ type: TASK_ADD, payload: task });
    return task;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore creazione task");
};

export const updateTaskStatus = (token, taskId, newStatus, lang) => async (dispatch) => {
  dispatch({ type: TASK_STATUS_UPDATE, payload: { taskId, status: newStatus } });
  try {
    await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/status`, {
      method: "PATCH",
      credentials: "include", headers: headers(token, true),
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    dispatch(fetchAllTasks(token, lang));
  }
};

export const updateTaskPriority = (token, taskId, newPriority, lang) => async (dispatch) => {
  dispatch({ type: TASK_PRIORITY_UPDATE, payload: { taskId, priority: newPriority } });
  try {
    await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/priority`, {
      method: "PATCH",
      credentials: "include", headers: headers(token, true),
      body: JSON.stringify({ priority: newPriority }),
    });
  } catch {
    dispatch(fetchAllTasks(token, lang));
  }
};

export const submitTaskCustomerResponse = (token, taskId, customerResponse) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/customer-response`, {
    method: "PATCH",
    credentials: "include", headers: headers(token, true),
    body: JSON.stringify({ customer_response: customerResponse }),
  });
  if (res.ok) {
    const updatedTask = await res.json();
    dispatch({ type: TASK_ASSIGN_UPDATE, payload: updatedTask });
    return updatedTask;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore invio dati");
};

export const assignUserToTask = (token, taskId, userId) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/assign`, {
    method: "POST",
    credentials: "include", headers: headers(token, true),
    body: JSON.stringify({ user_id: userId }),
  });
  if (res.ok) {
    const updatedTask = await res.json();
    dispatch({ type: TASK_ASSIGN_UPDATE, payload: updatedTask });
  } else {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore assegnazione task");
  }
};

export const unassignUserFromTask = (token, taskId, userId) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/assign/${userId}`, {
    method: "DELETE",
    credentials: "include", headers: headers(token),
  });
  if (res.ok) {
    const updatedTask = await res.json();
    dispatch({ type: TASK_ASSIGN_UPDATE, payload: updatedTask });
  } else {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore rimozione assegnazione");
  }
};
