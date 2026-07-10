import "bootstrap/dist/css/bootstrap.min.css";
import "./style/auth.css";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import ProcedAIPage from "./components/ProcedAIPage";
import { installSessionGuard } from "./api/sessionGuard";

const API_BASE = "http://localhost:8000";

function App() {
  const { pathname } = useLocation();
  // Il token vero e proprio vive solo in un cookie httpOnly (mai leggibile da JS):
  // qui teniamo solo "siamo autenticati?" (null = verifica in corso) + i dati utente.
  // "token" resta usato a valle come semplice flag/prop (molti componenti/redux
  // action lo usano solo per decidere se fare la fetch, non piu' per un header).
  const [authChecked, setAuthChecked] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Installato prima di qualunque altra fetch (deve stare prima dell'effect di
  // auth-check qui sotto): su un 401 non atteso, sloggo e mostro un avviso solo
  // se l'utente era effettivamente loggato (evita un falso "sessione scaduta"
  // al primissimo controllo /auth/me quando non si e' mai fatto login).
  useEffect(() => {
    installSessionGuard(() => {
      setUserInfo(prev => {
        if (prev) setSessionExpired(true);
        return null;
      });
    });
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
      if (r.ok) {
        setUserInfo(await r.json());
      } else {
        setUserInfo(null);
      }
    } catch {
      setUserInfo(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        if (cancelled) return;
        setUserInfo(r.ok ? await r.json() : null);
      } catch {
        if (!cancelled) setUserInfo(null);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAuth = () => { setSessionExpired(false); checkSession(); };

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    setUserInfo(null);
  }, []);

  // Il link nell'email di reset deve funzionare a prescindere dallo stato di
  // login (utente sloggato o con una vecchia sessione ancora attiva).
  if (pathname === "/reset-password") return <ResetPasswordPage />;

  if (!authChecked) return null;
  if (!userInfo) return <AuthPage onAuth={handleAuth} sessionExpired={sessionExpired} />;

  return <ProcedAIPage token={true} onLogout={handleLogout} userInfo={userInfo} onProfileUpdate={checkSession} />;
}

export default App;
