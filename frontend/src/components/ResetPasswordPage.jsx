import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Heximus_Logo_AI_Platform from "./assets/Heximus_Logo_AI_Platform_NoBG.png";
import { API_BASE } from "../config/api";

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      setError(t("auth.err_token_missing"));
      return;
    }
    if (!password || !confirmPassword) {
      setError(t("auth.err_all_fields"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.err_password_mismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.err_password_short"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || t("auth.err_reset_failed"));
      }
    } catch {
      setError(t("auth.err_network"));
    } finally {
      setLoading(false);
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
                <h2 className="h5 fw-semibold mb-1">{t("auth.reset_password_title")}</h2>

                {success ? (
                  <>
                    <div className="alert alert-success py-2 px-3 small mt-3 mb-3">
                      {t("auth.reset_password_success")}
                    </div>
                    <button
                      type="button"
                      className="btn w-100 auth-btn text-light"
                      style={{ backgroundColor: "#397BC0" }}
                      onClick={() => navigate("/")}
                    >
                      {t("auth.go_to_login")}
                    </button>
                  </>
                ) : !token ? (
                  <div className="alert alert-danger py-2 px-3 small mt-3">
                    {t("auth.err_token_missing")}
                  </div>
                ) : (
                  <>
                    <p className="text-muted small mb-3">{t("auth.reset_password_sub")}</p>
                    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                      <div className="mb-3">
                        <label className="form-label text-muted small fw-semibold">{t("auth.new_password_label")}</label>
                        <input
                          type="password"
                          className="form-control auth-input"
                          placeholder={t("auth.password_placeholder_min")}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label text-muted small fw-semibold">{t("auth.confirm_password_label")}</label>
                        <input
                          type="password"
                          className="form-control auth-input"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      {error && (
                        <div className="alert alert-danger py-2 px-3 small mb-3">{error}</div>
                      )}
                      <button
                        type="submit"
                        className="btn w-100 auth-btn text-light"
                        disabled={loading}
                        style={{ backgroundColor: "#397BC0" }}
                      >
                        {loading ? t("auth.reset_password_loading") : t("auth.reset_password_btn")}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
