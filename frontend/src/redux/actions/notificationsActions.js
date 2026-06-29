const API_BASE = "http://localhost:8000";

const headers = (token) => ({ Authorization: `Bearer ${token}` });

export const NOTIFICATIONS_SUCCESS  = "NOTIFICATIONS_SUCCESS";
export const NOTIFICATION_RECEIVED  = "NOTIFICATION_RECEIVED";
export const NOTIFICATION_READ      = "NOTIFICATION_READ";
export const NOTIFICATIONS_ALL_READ = "NOTIFICATIONS_ALL_READ";

export const fetchNotifications = (token) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/notifications/`, { headers: headers(token) });
  if (res.ok) {
    dispatch({ type: NOTIFICATIONS_SUCCESS, payload: await res.json() });
  }
};

export const markNotificationRead = (token, id) => async (dispatch) => {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: headers(token),
  });
  if (res.ok) {
    dispatch({ type: NOTIFICATION_READ, payload: id });
  }
};

export const markAllNotificationsRead = (token) => async (dispatch) => {
  await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: headers(token),
  });
  dispatch({ type: NOTIFICATIONS_ALL_READ });
};
