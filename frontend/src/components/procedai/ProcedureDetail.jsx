import { STEP_STATUS, stepNextStatus } from "./constants";
import "./ProcedureDetail.css";
import { useTranslation } from "react-i18next";

function Icon({ path, size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}
function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StepBadge({ status }) {
  const { t } = useTranslation();
  const s = STEP_STATUS[status] || STEP_STATUS.todo;
  return (
    <span className="pai-chip" style={{ color: s.text, background: s.bg, fontSize: 11 }}>
      {t(s.labelKey)}
    </span>
  );
}

function StepRow({ step, index, total, onToggle, loading }) {
  const status = step.status || "todo";
  const isDone = status === "done";
  const isInProgress = status === "inprogress";
  const {t} = useTranslation();
  const circleStyle = {
    background: isDone ? "#059669" : isInProgress ? "#2563EB" : "#F1F5F9",
    color: (isDone || isInProgress) ? "white" : "#94A3B8",
    outline: isInProgress ? "3px solid #BFDBFE" : "none",
    outlineOffset: "1px",
  };
   
  return (
    <div className={`pai-step-row${isDone ? " pai-step-row--done" : ""}`}>
      {/* Timeline */}
      <div className="pai-step-row__timeline">
        <div className="pai-step-row__circle" style={circleStyle}>
          {isDone ? <CheckIcon size={14} /> : <span>{index + 1}</span>}
        </div>
        {index < total - 1 && <div className="pai-step-row__line" />}
      </div>

      {/* Content */}
      <div className="pai-step-row__body">
        <div className="pai-step-row__header">
          <div className={`pai-step-row__title${isDone ? " pai-step-row__title--done" : ""}`}>
            {step.title}
          </div>
          <StepBadge status={status} />
        </div>
        {step.description && (
          <div className="pai-step-row__desc">{step.description}</div>
        )}

        {/* Toggle button */}
        <button
          className={`pai-step-row__toggle${isDone ? " pai-step-row__toggle--undo" : ""}`}
          onClick={() => onToggle(step.id, stepNextStatus(status))}
          disabled={loading}
        >
          {isDone
            ? t("procedures.todo_step_btn")
            : isInProgress
              ? t("procedures.done_step_btn")
              : t("procedures.start_step_btn")}
        </button>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isDone = task.status === "done";
  return (
    <div className="pai-detail-task">
      <div className={`pai-detail-task__check${isDone ? " pai-detail-task__check--done" : ""}`}>
        {isDone && <CheckIcon size={8} />}
      </div>
      <div className={`pai-detail-task__title${isDone ? " pai-detail-task__title--done" : ""}`}>
        {task.title}
      </div>
      <span className="pai-chip" style={{
        color: isDone ? "#059669" : task.status === "in_progress" ? "#2563EB" : "#64748B",
        background: isDone ? "#ECFDF5" : task.status === "in_progress" ? "#EFF6FF" : "#F1F5F9",
        fontSize: 10,
      }}>
        {isDone ? "Done" : task.status === "in_progress" ? "In corso" : "Da fare"}
      </span>
    </div>
  );
}

export default function ProcedureDetail({
  procedure,
  steps,
  tasks,
  loadingSteps,
  togglingStepId,
  onBack,
  onStepToggle,
}) {
  const formatDate = (dt) => dt
    ? new Date(dt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const done = steps.filter(s => s.status === "done").length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const procTasks = tasks.filter(t => t.procedure_id === procedure.id);
  const {t} = useTranslation();

  return (
    <div className="pai-view">
      {/* Back */}
      <button className="pai-detail__back" onClick={onBack}>
        <Icon path="M19 12H5M12 19l-7-7 7-7" size={15} color="#64748B" />
        {t("procedures.back_to_procedures")}
      </button>

      <div className="pai-detail__layout">
        {/* Main column */}
        <div className="pai-detail__main">
          {/* Header card */}
          <div className="pai-card pai-detail__header-card">
            <div className="pai-detail__meta-chips">
              <span className="pai-chip" style={{ color: "#475569", background: "#F1F5F9" }}>{t("procedures.name")}</span>
              <span className="pai-chip" style={{ color: "#059669", background: "#ECFDF5" }}>{t("procedures.tag_active")}</span>
            </div>
            <h1 className="pai-detail__title">{procedure.title}</h1>
            {procedure.description && (
              <p className="pai-detail__desc">{procedure.description}</p>
            )}
            <div className="pai-detail__stats-row">
              <div className="pai-detail__stat">
                <div className="pai-detail__stat-label">{t("procedures.create_on")}</div>
                <div className="pai-detail__stat-value">{formatDate(procedure.created_at)}</div>
              </div>
              <div className="pai-detail__stat">
                <div className="pai-detail__stat-label">{t("procedures.total_steps")}</div>
                <div className="pai-detail__stat-value">{total || "—"}</div>
              </div>
              <div className="pai-detail__stat">
                <div className="pai-detail__stat-label">{t("procedures.complete")}</div>
                <div className="pai-detail__stat-value">{done}</div>
              </div>
              <div className="pai-detail__stat">
                <div className="pai-detail__stat-label">{t("procedures.progress")}</div>
                <div className="pai-detail__stat-value">{total > 0 ? `${pct}%` : "—"}</div>
              </div>
            </div>
            {total > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="pai-progress-track">
                  <div className="pai-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Steps card */}
          <div className="pai-card pai-detail__steps-card">
            <div className="pai-detail__steps-header">
              <div className="pai-detail__steps-title">
                {t("procedures.procedure_steps")}
                {loadingSteps && <span className="pai-detail__steps-loading">{t("procedures.loading")}</span>}
              </div>
            </div>

            {!loadingSteps && total === 0 && (
              <div className="pai-detail__steps-empty">
                <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" size={28} color="#CBD5E1" />
                <div className="pai-detail__steps-empty-text">
                  {t("procedures.no_steps")}
                  <br />
                  <small>{t("procedures.generate_ai")}</small>
                </div>
              </div>
            )}

            <div className="pai-detail__steps-list">
              {steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  index={i}
                  total={total}
                  onToggle={onStepToggle}
                  loading={togglingStepId === step.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="pai-detail__sidebar">
          <div className="pai-card pai-detail__tasks-card">
            <div className="pai-detail__tasks-header">
              <span className="pai-detail__tasks-title">{t("procedures.correlated_tasks")}</span>
            </div>
            {procTasks.length === 0 ? (
              <div className="pai-detail__tasks-empty">{t("procedures.no_tasks")}</div>
            ) : (
              <div className="pai-detail__tasks-list">
                {procTasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
