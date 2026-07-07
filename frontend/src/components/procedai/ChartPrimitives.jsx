import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, LabelList, ResponsiveContainer,
} from "recharts";
import { GRID_STROKE, AXIS_TICK } from "./chartUtils";
import "./ChartPrimitives.css";

export function ChartCard({ title, sub, children, empty }) {
  return (
    <div className="pai-card pai-chart-card">
      <div className="pai-dashboard__card-header">
        <span className="pai-dashboard__card-title">{title}</span>
        {sub && <span className="pai-chart-card__sub">{sub}</span>}
      </div>
      <div className="pai-chart-card__body">
        {empty ? <div className="pai-dashboard__empty">{empty}</div> : children}
      </div>
    </div>
  );
}

export function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, value, displayValue } = payload[0].payload;
  return (
    <div className="pai-chart-tooltip">
      <div className="pai-chart-tooltip__value">{displayValue ?? value}</div>
      <div className="pai-chart-tooltip__label">{label}</div>
    </div>
  );
}

export function AreaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { date, count } = payload[0].payload;
  return (
    <div className="pai-chart-tooltip">
      <div className="pai-chart-tooltip__value">{count}</div>
      <div className="pai-chart-tooltip__label">{date}</div>
    </div>
  );
}

export function HorizontalBarChart({ data }) {
  const longestLabel = Math.max(...data.map(d => d.label.length), 4);
  return (
    <ResponsiveContainer width="100%" height={data.length * 40 + 20}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 28, bottom: 4, left: 0 }}
        barSize={22}
        barCategoryGap={10}
      >
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
        <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={Math.min(longestLabel * 6.5 + 12, 120)}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: "#F8FAFC" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map(entry => <Cell key={entry.key} fill={entry.color} />)}
          <LabelList dataKey={(entry) => entry.displayValue ?? entry.value} position="right" style={{ fill: "#0F172A", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
