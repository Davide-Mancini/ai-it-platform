import "bootstrap/dist/css/bootstrap.min.css";
import "./style/auth.css";
import { useState, useEffect, useCallback } from "react";
import AuthPage from "./components/AuthPage";
import ProcedAIPage from "./components/ProcedAIPage";

const API_BASE = "http://localhost:8000";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("heximus_token"));
  const [userInfo, setUserInfo] = useState(null);

  const handleAuth = (accessToken) => {
    localStorage.setItem("heximus_token", accessToken);
    setToken(accessToken);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("heximus_token");
    setToken(null);
    setUserInfo(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        if (!cancelled) setUserInfo(null);
        return;
      }
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (r.ok) {
          const data = await r.json();
          if (!cancelled) setUserInfo(data);
        } else {
          if (!cancelled) handleLogout();
        }
      } catch {
        if (!cancelled) handleLogout();
      }
    })();
    return () => { cancelled = true; };
  }, [token, handleLogout]);


  const refreshUserInfo = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setUserInfo(await r.json());
    } catch { /* ignore */ }
  }, [token]);

  if (!token) return <AuthPage onAuth={handleAuth} />;

  return <ProcedAIPage token={token} onLogout={handleLogout} userInfo={userInfo} onProfileUpdate={refreshUserInfo} />;
}

export default App;
