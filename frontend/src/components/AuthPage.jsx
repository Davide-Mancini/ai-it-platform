import { useState } from "react";
import { useDispatch } from "react-redux";
import newUserAction from "../redux/actions/newUserAction";

const API_BASE = "http://localhost:8000";

function AuthPage({ onAuth }) {
  const [activeTab, setActiveTab] = useState("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerData, setRegisterData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setLoginError("Inserisci email e password.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginData.email);
      formData.append("password", loginData.password);

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onAuth(data.access_token);
      } else {
        const err = await res.json().catch(() => ({}));
        setLoginError(err.detail || "Credenziali non valide. Riprova.");
      }
    } catch {
      setLoginError("Errore di rete. Verifica che il server sia avviato.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.first_name || !registerData.last_name || !registerData.email || !registerData.password) {
      setRegisterError("Compila tutti i campi obbligatori.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Le password non coincidono.");
      return;
    }
    if (registerData.password.length < 8) {
      setRegisterError("La password deve avere almeno 8 caratteri.");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    try {
      dispatch(newUserAction(registerData.first_name, registerData.last_name, registerData.email, registerData.password));

      const res = await fetch(`${API_BASE}/api/auth/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      if (res.ok) {
        setActiveTab("login");
        setLoginData({ email: registerData.email, password: "" });
        setRegisterData({ first_name: "", last_name: "", email: "", password: "", confirmPassword: "" });
        setRegisterError("");
      } else {
        const err = await res.json().catch(() => ({}));
        setRegisterError(err.detail || "Errore durante la registrazione.");
      }
    } catch {
      setRegisterError("Errore di rete. Verifica che il server sia avviato.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">

            <div className="text-center mb-4">
              <div className="auth-logo mb-3">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#0d6efd" />
                  <path d="M14 24h6l4-10 4 20 4-10h6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-white fw-bold mb-1">Heximus</h4>
              <p className="text-white-50 small mb-0">AI IT Platform — Accedi o crea un account</p>
            </div>

            <div className="card auth-card border-0">
              <div className="card-body p-4">

                <ul className="nav nav-pills nav-fill mb-4 auth-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                      onClick={() => { setActiveTab("login"); setLoginError(""); }}
                    >
                      Accedi
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "register" ? "active" : ""}`}
                      onClick={() => { setActiveTab("register"); setRegisterError(""); }}
                    >
                      Registrati
                    </button>
                  </li>
                </ul>

                {/* ─── LOGIN ─── */}
                {activeTab === "login" && (
                  <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">EMAIL</label>
                      <input
                        type="email"
                        className="form-control auth-input"
                        placeholder="mario.rossi@esempio.it"
                        value={loginData.email}
                        onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">PASSWORD</label>
                      <input
                        type="password"
                        className="form-control auth-input"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                      />
                    </div>
                    {loginError && (
                      <div className="alert alert-danger py-2 px-3 small mb-3">{loginError}</div>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 auth-btn"
                      disabled={loginLoading}
                    >
                      {loginLoading ? "Accesso in corso…" : "Accedi"}
                    </button>
                    <p className="text-center text-muted small mt-3 mb-0">
                      Non hai un account?{" "}
                      <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setActiveTab("register")}>
                        Registrati
                      </button>
                    </p>
                  </form>
                )}

                {/* ─── REGISTER ─── */}
                {activeTab === "register" && (
                  <form onSubmit={e => { e.preventDefault(); handleRegister(); }}>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label text-muted small fw-semibold">NOME</label>
                        <input
                          type="text"
                          className="form-control auth-input"
                          placeholder="Mario"
                          value={registerData.first_name}
                          onChange={e => setRegisterData({ ...registerData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label text-muted small fw-semibold">COGNOME</label>
                        <input
                          type="text"
                          className="form-control auth-input"
                          placeholder="Rossi"
                          value={registerData.last_name}
                          onChange={e => setRegisterData({ ...registerData, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">EMAIL</label>
                      <input
                        type="email"
                        className="form-control auth-input"
                        placeholder="mario.rossi@esempio.it"
                        value={registerData.email}
                        onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">PASSWORD</label>
                      <input
                        type="password"
                        className="form-control auth-input"
                        placeholder="Minimo 8 caratteri"
                        value={registerData.password}
                        onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label text-muted small fw-semibold">CONFERMA PASSWORD</label>
                      <input
                        type="password"
                        className="form-control auth-input"
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      />
                    </div>
                    {registerError && (
                      <div className="alert alert-danger py-2 px-3 small mb-3">{registerError}</div>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 auth-btn"
                      disabled={registerLoading}
                    >
                      {registerLoading ? "Registrazione…" : "Crea Account"}
                    </button>
                    <p className="text-center text-muted small mt-3 mb-0">
                      Hai già un account?{" "}
                      <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setActiveTab("login")}>
                        Accedi
                      </button>
                    </p>
                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
