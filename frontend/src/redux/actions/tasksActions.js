const API_BASE = "http://localhost:8000";

const headers = (token, json = false) => ({
  Authorization: `Bearer ${token}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const TASKS_LOADING         = "TASKS_LOADING";
export const TASKS_SUCCESS         = "TASKS_SUCCESS";
export const TASK_ADD              = "TASK_ADD";
export const TASK_STATUS_UPDATE    = "TASK_STATUS_UPDATE";

export const fetchAllTasks = (token) => async (dispatch) => {
  dispatch({ type: TASKS_LOADING });
  const res = await fetch(`${API_BASE}/api/tasks/`, { headers: headers(token) });
  if (res.ok) {
    dispatch({ type: TASKS_SUCCESS, payload: await res.json() });
  }
};

export const createTask = (token, procedureId, title) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/tasks/procedures/${procedureId}/tasks`, {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify({ title }),
  });
  if (res.ok) {
    const task = await res.json();
    dispatch({ type: TASK_ADD, payload: task });
    return task;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore creazione task");
};

export const updateTaskStatus = (token, taskId, newStatus) => async (dispatch) => {
  dispatch({ type: TASK_STATUS_UPDATE, payload: { taskId, status: newStatus } });
  try {
    await fetch(`${API_BASE}/api/tasks/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: headers(token, true),
      body: JSON.stringify({ status: newStatus }),
    });
  } catch {
    dispatch(fetchAllTasks(token));
  }
};
