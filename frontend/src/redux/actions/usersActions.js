import { API_BASE } from "../../config/api";

// Il token viaggia in un cookie httpOnly gestito dal browser: qui serve solo
// impostare Content-Type quando c'e' un body JSON.
const headers = (token, json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const USERS_LOADING    = "USERS_LOADING";
export const USERS_SUCCESS    = "USERS_SUCCESS";
export const ROLES_SUCCESS    = "ROLES_SUCCESS";
export const USER_UPDATED     = "USER_UPDATED";
export const USERS_BROWSE_LOADING = "USERS_BROWSE_LOADING";
export const USERS_BROWSE_SUCCESS = "USERS_BROWSE_SUCCESS";

// Lista completa (non paginata) — usata da dropdown assegnazione task, invio
// email massivo e ovunque serva avere tutti gli utenti disponibili lato client.
export const fetchUsers = (token) => async (dispatch) => {
  dispatch({ type: USERS_LOADING });
  const res = await fetch(`${API_BASE}/api/auth/users/`, { credentials: "include", headers: headers(token) });
  if (res.ok) {
    const data = await res.json();
    dispatch({ type: USERS_SUCCESS, payload: data.items });
  }
};

// Pagina singola con ricerca server-side — usata solo dalla tabella di UsersPage.
export const fetchUsersBrowse = (token, { page = 1, pageSize = 25, search = "" } = {}) => async (dispatch) => {
  dispatch({ type: USERS_BROWSE_LOADING });
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set("search", search);
  const res = await fetch(`${API_BASE}/api/auth/users/?${params.toString()}`, { credentials: "include", headers: headers(token) });
  if (res.ok) {
    dispatch({ type: USERS_BROWSE_SUCCESS, payload: await res.json() });
  }
};

export const fetchRoles = (token) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/auth/roles/`, { credentials: "include", headers: headers(token) });
  if (res.ok) {
    dispatch({ type: ROLES_SUCCESS, payload: await res.json() });
  }
};

export const toggleUserActive = (token, userId, isActive) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/auth/users/${userId}/active`, {
    method: "PATCH",
    credentials: "include", headers: headers(token, true),
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
    credentials: "include", headers: headers(token, true),
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
