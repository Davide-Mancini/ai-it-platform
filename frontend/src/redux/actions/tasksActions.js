const API_BASE = "http://localhost:8000";

const headers = (token, json = false) => ({
  Authorization: `Bearer ${token}`,
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
  const res = await fetch(url, { headers: headers(token) });
  if (res.ok) {
    dispatch({ type: TASKS_SUCCESS, payload: await res.json() });
  }
};

export const createTask = (token, procedureId, title, priority = "low") => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/procedures/${procedureId}/tasks`, {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify({ title, priority }),
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
      headers: headers(token, true),
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
      headers: headers(token, true),
      body: JSON.stringify({ priority: newPriority }),
    });
  } catch {
    dispatch(fetchAllTasks(token, lang));
  }
};

export const assignUserToTask = (token, taskId, userId) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/assign`, {
    method: "POST",
    headers: headers(token, true),
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
    headers: headers(token),
  });
  if (res.ok) {
    const updatedTask = await res.json();
    dispatch({ type: TASK_ASSIGN_UPDATE, payload: updatedTask });
  } else {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore rimozione assegnazione");
  }
};
