import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./AgentReview.css";
import { PRIORITY } from "./constants";
import Pager from "./Pager";

function SparkleIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
    </svg>
  );
}

const STATUS_TABS = ["pending", "accepted", "dismissed"];
const SEVERITIES = ["critical", "high", "medium", "low"];

function SeverityBadge({ severity }) {
  const s = PRIORITY[severity] || { color: "#64748B", bg: "#F1F5F9" };
  return (
    <span className="pai-chip" style={{ color: s.color, background: s.bg, fontSize: 11, textTransform: "uppercase" }}>
      {severity}
    </span>
  );
}

function ChangeRow({ change }) {
  const { t } = useTranslation();
  return (
    <div className="pai-review__change">
      <div className="pai-review__change-meta">
        {change.step_number != null && (
          <span className="pai-review__change-step">{t("agent_review.step_label", { number: change.step_number })}</span>
        )}
        <span className="pai-chip pai-review__change-field">{change.field}</span>
      </div>
      {change.current_value && (
        <div className="pai-review__change-current">{change.current_value}</div>
      )}
      <div className="pai-review__change-proposed">{change.proposed_value}</div>
    </div>
  );
}

function RunningIndicator() {
  const { t } = useTranslation();
  return (
    <div className="pai-review__running">
      <div className="pai-review__running-dots">
        <span /><span /><span />
      </div>
      <div className="pai-review__running-text">{t("agent_review.last_run_running")}</div>
    </div>
  );
}

function FindingCard({ finding, onAccept, onReject }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isPending = finding.status === "pending";

  const handleAction = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn(finding.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pai-card pai-review__card">
      <div className="pai-review__card-header">
        <div>
          <div className="pai-review__procedure">{finding.procedure_title}</div>
          <div className="pai-review__summary">{finding.summary}</div>
        </div>
        <div className="pai-review__badges">
          <SeverityBadge severity={finding.severity} />
          <span className="pai-chip">{finding.category}</span>
        </div>
      </div>

      <div className="pai-review__rationale">{finding.rationale}</div>

      {(finding.referenced_policy_titles?.length > 0 || finding.referenced_document_titles?.length > 0) && (
        <div className="pai-review__refs">
          {finding.referenced_policy_titles?.map(p => (
            <span key={`p-${p}`} className="pai-chip pai-review__ref">{p}</span>
          ))}
          {finding.referenced_document_titles?.map(d => (
            <span key={`d-${d}`} className="pai-chip pai-review__ref">{d}</span>
          ))}
        </div>
      )}

      {finding.proposed_changes?.length > 0 && (
        <>
          <button className="pai-review__toggle-changes" onClick={() => setExpanded(v => !v)}>
            {expanded ? t("agent_review.hide_changes") : t("agent_review.show_changes", { count: finding.proposed_changes.length })}
          </button>
          {expanded && (
            <div className="pai-review__changes">
              {finding.proposed_changes.map((c, i) => <ChangeRow key={i} change={c} />)}
            </div>
          )}
        </>
      )}

      {error && <div className="pai-review__error">{error}</div>}

      {isPending ? (
        <div className="pai-review__actions">
          <button className="pai-chat__accept" disabled={busy} onClick={() => handleAction(onAccept)}>
            ✓ {t("agent_review.accept_btn")}
          </button>
          <button className="pai-chat__reject" disabled={busy} onClick={() => handleAction(onReject)}>
            {t("agent_review.reject_btn")}
          </button>
        </div>
      ) : (
        <div className="pai-review__status-note">
          {finding.status === "accepted" ? t("agent_review.status_accepted") : t("agent_review.status_dismissed")}
        </div>
      )}
    </div>
  );
}

export default function AgentReview({ browse, lastRun, statusFilter, severityFilter, onFilterChange, onPageChange, onTrigger, onCheckRunStatus, onAccept, onReject, onRefresh }) {
  const { t } = useTranslation();
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState("");

  const isRunning = lastRun?.status === "running";

  // onCheckRunStatus/onRefresh sono ricreate ad ogni render di ProcedAIPage: teniamole
  // in un ref cosi' l'interval qui sotto chiama sempre la versione piu' recente invece
  // di restare "agganciato" a quella catturata quando e' partito il polling.
  const onCheckRunStatusRef = useRef(onCheckRunStatus);
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onCheckRunStatusRef.current = onCheckRunStatus;
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(async () => {
      const updated = await onCheckRunStatusRef.current(lastRun.id);
      if (updated && updated.status !== "running") {
        clearInterval(interval);
        onRefreshRef.current();
        // Refresh "di scorta" per coprire eventuali ritardi di visibilita' tra la
        // sessione DB del job in background e quella della richiesta successiva.
        setTimeout(() => onRefreshRef.current(), 1500);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, lastRun?.id]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerError("");
    try {
      await onTrigger();
    } catch (e) {
      setTriggerError(e.message);
    } finally {
      setTriggering(false);
    }
  };

  const handleAccept = async (id) => { await onAccept(id); };
  const handleReject = async (id) => { await onReject(id); };

  return (
    <div className="pai-view">
      <div className="pai-review__toolbar">
        <div>
          <div className="pai-review__title">
            <SparkleIcon /> {t("agent_review.title")}
          </div>
          <div className="pai-review__sub">
            {lastRun
              ? t(`agent_review.last_run_${lastRun.status}`, { count: lastRun.findings_count ?? 0 })
              : t("agent_review.no_run_yet")}
          </div>
        </div>
        <button className="pai-btn pai-btn--primary" onClick={handleTrigger} disabled={triggering || isRunning}>
          {isRunning ? t("agent_review.running_btn") : t("agent_review.run_now_btn")}
        </button>
      </div>

      {triggerError && <div className="pai-review__error">{triggerError}</div>}

      <div className="pai-review__filters">
        <div className="pai-review__tabs">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              className={`pai-review__tab${statusFilter === s ? " pai-review__tab--active" : ""}`}
              onClick={() => onFilterChange({ status: s, severity: severityFilter })}
            >
              {t(`agent_review.tab_${s}`)}
            </button>
          ))}
        </div>
        <select
          className="pai-field__select pai-review__severity-select"
          value={severityFilter}
          onChange={e => onFilterChange({ status: statusFilter, severity: e.target.value })}
        >
          <option value="">{t("agent_review.all_severities")}</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isRunning ? (
        <RunningIndicator />
      ) : browse.loading ? (
        <div className="pai-review__empty">{t("agent_review.loading")}</div>
      ) : browse.items.length === 0 ? (
        <div className="pai-review__empty">{t("agent_review.no_findings")}</div>
      ) : (
        <div className="pai-review__list">
          {browse.items.map(f => (
            <FindingCard key={f.id} finding={f} onAccept={handleAccept} onReject={handleReject} />
          ))}
        </div>
      )}

      {!isRunning && browse.items.length > 0 && (
        <Pager page={browse.page} pageSize={browse.pageSize} total={browse.total} onPageChange={onPageChange} />
      )}
    </div>
  );
}
