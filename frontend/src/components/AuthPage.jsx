import { useState } from "react";
import { useTranslation } from "react-i18next";
import Heximus_Logo_AI_Platform from "./assets/Heximus_Logo_AI_Platform_NoBG.png"

const API_BASE = "http://localhost:8000";

function AuthPage({ onAuth }) {
  const { t } = useTranslation();
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

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setLoginError(t("auth.err_email_password"));
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
        credentials: "include",
      });

      if (res.ok) {
        onAuth();
      } else {
        const err = await res.json().catch(() => ({}));
        setLoginError(err.detail || t("auth.err_invalid_credentials"));
      }
    } catch {
      setLoginError(t("auth.err_network"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setForgotError(t("auth.err_email_password"));
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        setForgotSent(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setForgotError(err.detail || t("auth.err_network"));
      }
    } catch {
      setForgotError(t("auth.err_network"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.first_name || !registerData.last_name || !registerData.email || !registerData.password) {
      setRegisterError(t("auth.err_all_fields"));
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError(t("auth.err_password_mismatch"));
      return;
    }
    if (registerData.password.length < 8) {
      setRegisterError(t("auth.err_password_short"));
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    try {
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
        setRegisterError(err.detail || t("auth.err_register_failed"));
      }
    } catch {
      setRegisterError(t("auth.err_network"));
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="auth-wrapper pt-0">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">

            <div className="text-center">
              <div className="auth-logo">
                <img src={Heximus_Logo_AI_Platform} alt="" className=" w-100" />
              </div>
            </div>

            <div className="card auth-card border-0">
              <div className="card-body p-4">

                <ul className="nav nav-pills nav-fill mb-4 auth-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "login" ? "active" : ""}`}
                      onClick={() => { setActiveTab("login"); setLoginError(""); }}
                    >
                      {t("auth.login_tab")}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "register" ? "active" : ""}`}
                      onClick={() => { setActiveTab("register"); setRegisterError(""); }}
                    >
                      {t("auth.register_tab")}
                    </button>
                  </li>
                </ul>

                {/* ─── LOGIN ─── */}
                {activeTab === "login" && (
                  <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">{t("auth.email_label")}</label>
                      <input
                        type="email"
                        className="form-control auth-input"
                        placeholder={t("auth.email_placeholder")}
                        value={loginData.email}
                        onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">{t("auth.password_label")}</label>
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
                      className="btn w-100 auth-btn text-light"
                      disabled={loginLoading}
                      style={{ backgroundColor: "#397BC0" }}
                    >
                      {loginLoading ? t("auth.login_loading") : t("auth.login_btn")}
                    </button>
                    <div className="text-center mt-2">
                      <button
                        type="button"
                        style={{ color: "#397BC0" }}
                        className="btn btn-link btn-sm p-0"
                        onClick={() => { setActiveTab("forgot"); setForgotError(""); setForgotSent(false); }}
                      >
                        {t("auth.forgot_password_link")}
                      </button>
                    </div>
                    <div className="d-flex justify-content-center align-items-center mt-2">
                      <p className="text-center text-muted small mb-0 me-1">
                        {t("auth.no_account")}{" "}
                      </p>
                      <button type="button" style={{ color: "#397BC0" }} className="btn btn-link btn-sm p-0" onClick={() => setActiveTab("register")}>
                        {t("auth.register_tab")}
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── FORGOT PASSWORD ─── */}
                {activeTab === "forgot" && (
                  <div>
                    <h2 className="h5 fw-semibold mb-1">{t("auth.forgot_password_title")}</h2>
                    <p className="text-muted small mb-3">{t("auth.forgot_password_sub")}</p>
                    {forgotSent ? (
                      <div className="alert alert-success py-2 px-3 small mb-3">
                        {t("auth.forgot_password_success")}
                      </div>
                    ) : (
                      <form onSubmit={e => { e.preventDefault(); handleForgotPassword(); }}>
                        <div className="mb-3">
                          <label className="form-label text-muted small fw-semibold">{t("auth.email_label")}</label>
                          <input
                            type="email"
                            className="form-control auth-input"
                            placeholder={t("auth.email_placeholder")}
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            autoFocus
                          />
                        </div>
                        {forgotError && (
                          <div className="alert alert-danger py-2 px-3 small mb-3">{forgotError}</div>
                        )}
                        <button
                          type="submit"
                          className="btn w-100 auth-btn text-light"
                          disabled={forgotLoading}
                          style={{ backgroundColor: "#397BC0" }}
                        >
                          {forgotLoading ? t("auth.forgot_password_loading") : t("auth.forgot_password_btn")}
                        </button>
                      </form>
                    )}
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        style={{ color: "#397BC0" }}
                        className="btn btn-link btn-sm p-0"
                        onClick={() => { setActiveTab("login"); setForgotSent(false); }}
                      >
                        {t("auth.back_to_login")}
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── REGISTER ─── */}
                {activeTab === "register" && (
                  <form onSubmit={e => { e.preventDefault(); handleRegister(); }}>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label text-muted small fw-semibold">{t("auth.first_name_label")}</label>
                        <input
                          type="text"
                          className="form-control auth-input"
                          placeholder= {t("auth.name_placeholder")}
                          value={registerData.first_name}
                          onChange={e => setRegisterData({ ...registerData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label text-muted small fw-semibold">{t("auth.last_name_label")}</label>
                        <input
                          type="text"
                          className="form-control auth-input"
                          placeholder={t("auth.surname_placeholder")}
                          value={registerData.last_name}
                          onChange={e => setRegisterData({ ...registerData, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">{t("auth.email_label")}</label>
                      <input
                        type="email"
                        className="form-control auth-input"
                        placeholder={t("auth.email_placeholder")}
                        value={registerData.email}
                        onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-semibold">{t("auth.password_label")}</label>
                      <input
                        type="password"
                        className="form-control auth-input"
                        placeholder={t("auth.password_placeholder_min")}
                        value={registerData.password}
                        onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label text-muted small fw-semibold">{t("auth.confirm_password_label")}</label>
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
                      style={{ backgroundColor: "#397BC0" }}
                    >
                      {registerLoading ? t("auth.register_loading") : t("auth.register_btn")}
                    </button>
                    <div className="d-flex justify-content-center align-items-center mt-3">
                      <p className="text-center text-muted small me-1 mb-0">
                        {t("auth.have_account")}{" "}
                      </p>
                      <button type="button" style={{ color: "#397BC0" }} className="btn btn-link btn-sm p-0" onClick={() => setActiveTab("login")}>
                        {t("auth.login_tab")}
                      </button>
                    </div>
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
