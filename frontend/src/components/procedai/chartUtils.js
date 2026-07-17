export const GRID_STROKE = "#F1F5F9";
export const AXIS_STROKE = "#94A3B8";
export const AXIS_TICK = { fontSize: 11, fill: "#64748B" };

export function humanizeAction(action) {
  const words = action.replace(/_/g, " ").toLowerCase().split(" ").filter(Boolean);
  return words.map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}
