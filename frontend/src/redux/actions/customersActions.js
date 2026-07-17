import { API_BASE } from "../../config/api";

// Il token viaggia in un cookie httpOnly gestito dal browser: qui serve solo
// impostare Content-Type quando c'e' un body JSON.
const headers = (token, json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const CUSTOMERS_LOADING = "CUSTOMERS_LOADING";
export const CUSTOMERS_SUCCESS = "CUSTOMERS_SUCCESS";
export const CUSTOMER_ADDED    = "CUSTOMER_ADDED";
export const CUSTOMER_UPDATED  = "CUSTOMER_UPDATED";
export const CUSTOMER_REMOVED  = "CUSTOMER_REMOVED";

export const fetchCustomers = (token) => async (dispatch) => {
  dispatch({ type: CUSTOMERS_LOADING });
  const res = await fetch(`${API_BASE}/api/customers/`, { credentials: "include", headers: headers(token) });
  if (res.ok) {
    dispatch({ type: CUSTOMERS_SUCCESS, payload: await res.json() });
  }
};

export const createCustomer = (token, data) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/customers/`, {
    method: "POST",
    credentials: "include", headers: headers(token, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante la creazione del cliente");
  }
  const created = await res.json();
  dispatch({ type: CUSTOMER_ADDED, payload: created });
  return created;
};

export const updateCustomer = (token, id, data) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/customers/${id}`, {
    method: "PATCH",
    credentials: "include", headers: headers(token, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante la modifica del cliente");
  }
  const updated = await res.json();
  dispatch({ type: CUSTOMER_UPDATED, payload: updated });
  return updated;
};

export const deleteCustomer = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/customers/${id}`, {
    method: "DELETE",
    credentials: "include", headers: headers(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Errore durante l'eliminazione del cliente");
  }
  dispatch({ type: CUSTOMER_REMOVED, payload: id });
};
