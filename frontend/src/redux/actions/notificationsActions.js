const API_BASE = "http://localhost:8000";

// Il token viaggia in un cookie httpOnly gestito dal browser, niente piu' header manuale.
const headers = () => ({});

export const NOTIFICATIONS_SUCCESS    = "NOTIFICATIONS_SUCCESS";
export const NOTIFICATION_RECEIVED    = "NOTIFICATION_RECEIVED";
export const NOTIFICATION_READ        = "NOTIFICATION_READ";
export const NOTIFICATIONS_ALL_READ   = "NOTIFICATIONS_ALL_READ";
export const NOTIFICATION_DELETED     = "NOTIFICATION_DELETED";
export const NOTIFICATIONS_ALL_DELETED = "NOTIFICATIONS_ALL_DELETED";

export const fetchNotifications = (token) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/notifications/`, { credentials: "include", headers: headers() });
  if (res.ok) {
    dispatch({ type: NOTIFICATIONS_SUCCESS, payload: await res.json() });
  }
};

export const markNotificationRead = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include", headers: headers(),
  });
  if (res.ok) {
    dispatch({ type: NOTIFICATION_READ, payload: id });
  }
};

export const markAllNotificationsRead = (token) => async (dispatch) => {
  await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    credentials: "include", headers: headers(),
  });
  dispatch({ type: NOTIFICATIONS_ALL_READ });
};

export const deleteNotification = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include", headers: headers(),
  });
  if (res.ok) {
    dispatch({ type: NOTIFICATION_DELETED, payload: id });
  }
};

export const deleteAllNotifications = (token) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/notifications/`, {
    method: "DELETE",
    credentials: "include", headers: headers(),
  });
  if (res.ok) {
    dispatch({ type: NOTIFICATIONS_ALL_DELETED });
  }
};
