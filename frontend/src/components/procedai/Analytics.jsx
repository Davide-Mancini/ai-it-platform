import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartCard, HorizontalBarChart, AreaTooltip } from "./ChartPrimitives";
import { GRID_STROKE, AXIS_STROKE, AXIS_TICK, humanizeAction } from "./chartUtils";
import { PRIORITY, LANGUAGES } from "./constants";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "../../style/Analytics.css";

function ProceduresTrendChart({ trendStats }) {
  const { t, i18n } = useTranslation();

  const total = trendStats.reduce((sum, d) => sum + d.count, 0);
  const buckets = trendStats.map(d => {
    const [y, m, day] = d.date.split("-").map(Number);
    const localDate = new Date(y, m - 1, day);
    return { key: d.date, date: localDate.toLocaleDateString(i18n.language, { day: "2-digit", month: "2-digit" }), count: d.count };
  });

  const empty = trendStats.length === 0 ? t("charts.no_data") : null;
  return (
    <ChartCard
      title={t("analytics.charts_procedures_trend")}
      sub={t("analytics.procedures_created_period", { count: total })}
      empty={empty}
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={buckets} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="date" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} interval={Math.ceil(buckets.length / 6)} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<AreaTooltip />} cursor={{ stroke: AXIS_STROKE, strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#2563EB"
            strokeWidth={2}
            fill="#2563EB"
            fillOpacity={0.1}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function AIAcceptanceChart({ aiStats }) {
  const { t } = useTranslation();
  if (!aiStats) return null;
  const total = aiStats.accepted + aiStats.rejected + aiStats.pending;
  const data = [
    { key: "accepted", label: t("analytics.ai_accepted"), value: aiStats.accepted, color: "#059669" },
    { key: "rejected", label: t("analytics.ai_rejected"), value: aiStats.rejected, color: "#DC2626" },
    { key: "pending", label: t("analytics.ai_pending"), value: aiStats.pending, color: "#D97706" },
  ];
  const empty = total === 0 ? t("charts.no_data") : null;
  return (
    <ChartCard title={t("analytics.charts_ai_acceptance")} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

function TopActionsChart({ actionStats }) {
  const { t } = useTranslation();
  const data = (actionStats || []).map(item => ({
    key: item.action,
    label: t(`dashboard.action_${item.action}`, humanizeAction(item.action)),
    value: item.count,
    color: "#7C3AED",
  }));
  const empty = data.length === 0 ? t("charts.no_data") : null;
  return (
    <ChartCard title={t("analytics.charts_top_actions")} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

function TaskPriorityChart({ tasks }) {
  const { t } = useTranslation();
  const order = ["critical", "high", "medium", "low"];
  const counts = Object.fromEntries(order.map(k => [k, 0]));
  tasks.forEach(task => {
    if (counts[task.priority] !== undefined) counts[task.priority] += 1;
    else counts.low += 1;
  });
  const data = order.map(key => ({
    key,
    label: t(`tasks.priority_${key}`),
    value: counts[key],
    color: PRIORITY[key].color,
  }));
  const empty = tasks.length === 0 ? t("dashboard.no_tasks") : null;
  return (
    <ChartCard title={t("analytics.charts_task_priority")} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

function ProceduresByLanguageChart({ languageStats }) {
  const { t } = useTranslation();
  const data = (languageStats || []).map(({ language, count }) => {
    const lang = LANGUAGES.find(l => l.code === language);
    return {
      key: language,
      label: lang ? `${lang.flag} ${lang.label}` : language.toUpperCase(),
      value: count,
      color: "#2563EB",
    };
  });
  const empty = data.length === 0 ? t("charts.no_data") : null;
  return (
    <ChartCard title={t("analytics.charts_procedures_language")} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

function ResolutionTimeChart({ resolutionStats }) {
  const { t } = useTranslation();
  if (!resolutionStats) return null;
  const { by_priority, overall_avg_hours, resolved_count } = resolutionStats;

  const useDays = (overall_avg_hours || 0) >= 48;
  const unit = t(useDays ? "analytics.unit_days" : "analytics.unit_hours");
  const toUnit = (hours) => Math.round((useDays ? hours / 24 : hours) * 10) / 10;

  const data = by_priority
    .filter(p => p.count > 0)
    .map(p => {
      const value = toUnit(p.avg_hours);
      return {
        key: p.priority,
        label: t(`tasks.priority_${p.priority}`),
        value,
        displayValue: `${value}${unit}`,
        color: PRIORITY[p.priority].color,
      };
    });

  const empty = resolved_count === 0 ? t("charts.no_data") : null;
  const sub = overall_avg_hours != null
    ? t("analytics.resolution_time_overall", { value: toUnit(overall_avg_hours), unit })
    : undefined;

  return (
    <ChartCard title={t("analytics.charts_resolution_time")} sub={sub} empty={empty}>
      <HorizontalBarChart data={data} />
    </ChartCard>
  );
}

export default function Analytics({ tasks = [], actionStats = [], aiStats = null, resolutionStats = null, languageStats = [], trendStats = [], onRefresh }) {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  };

  return (
    <div className="pai-view">
      <div className="pai-analytics__header">
        <div>
          <div className="pai-analytics__title">{t("analytics.title")}</div>
          <div className="pai-analytics__sub">{t("analytics.sub")}</div>
        </div>
        <button
          className={`pai-analytics__refresh-btn${refreshing ? " pai-analytics__refresh-btn--spinning" : ""}`}
          onClick={handleRefresh}
          title={t("analytics.refresh")}
          disabled={refreshing}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      <div className="pai-analytics__grid">
        <ProceduresTrendChart trendStats={trendStats} />
        <TaskPriorityChart tasks={tasks} />
        <ProceduresByLanguageChart languageStats={languageStats} />
        <ResolutionTimeChart resolutionStats={resolutionStats} />
        <AIAcceptanceChart aiStats={aiStats} />
        <TopActionsChart actionStats={actionStats} />
      </div>
    </div>
  );
}
