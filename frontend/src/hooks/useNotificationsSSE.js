import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { NOTIFICATION_RECEIVED } from "../redux/actions/notificationsActions";

const API_BASE = "http://localhost:8000";

export function useNotificationsSSE(token) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) return;

    const es = new EventSource(`${API_BASE}/api/notifications/stream?token=${token}`);

    es.onmessage = (e) => {
      try {
        const notification = JSON.parse(e.data);
        dispatch({ type: NOTIFICATION_RECEIVED, payload: notification });
      } catch {}
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [token, dispatch]);
}
