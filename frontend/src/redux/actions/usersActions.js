const API_BASE = "http://localhost:8000";

const headers = (token, json = false) => ({
  Authorization: `Bearer ${token}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const USERS_LOADING    = "USERS_LOADING";
export const USERS_SUCCESS    = "USERS_SUCCESS";
export const ROLES_SUCCESS    = "ROLES_SUCCESS";
export const USER_UPDATED     = "USER_UPDATED";

export const fetchUsers = (token) => async (dispatch) => {
  dispatch({ type: USERS_LOADING });
  const res = await fetch(`${API_BASE}/api/auth/users/`, { headers: headers(token) });
  if (res.ok) {
    dispatch({ type: USERS_SUCCESS, payload: await res.json() });
  }
};

export const fetchRoles = (token) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/auth/roles/`, { headers: headers(token) });
  if (res.ok) {
    dispatch({ type: ROLES_SUCCESS, payload: await res.json() });
  }
};

export const toggleUserActive = (token, userId, isActive) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/auth/users/${userId}/active`, {
    method: "PATCH",
    headers: headers(token, true),
    body: JSON.stringify({ is_active: isActive }),
  });
  if (res.ok) {
    const updated = await res.json();
    dispatch({ type: USER_UPDATED, payload: updated });
    return updated;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore durante l'aggiornamento");
};

export const updateUser = (token, userId, data) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
    method: "PATCH",
    headers: headers(token, true),
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const updated = await res.json();
    dispatch({ type: USER_UPDATED, payload: updated });
    return updated;
  }
  const err = await res.json().catch(() => ({}));
  throw new Error(err.detail || "Errore durante l'aggiornamento");
};
