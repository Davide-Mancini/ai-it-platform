export const THEME = {
  soft: {
    "--app-bg": "#f5f6fa", "--sidebar-bg": "#ffffff", "--surface": "#ffffff",
    "--col-bg": "#eef0f6", "--border": "#e7e9f1",
    "--text": "#2a2e3c", "--text-muted": "#8b91a4", "--text-soft": "#aab0c0",
    "--radius": "14px", "--radius-sm": "9px", "--radius-lg": "18px",
    "--accent": "#88a9f6", "--accent-text": "#4670d8", "--accent-soft": "#ecf1fe",
    "--hover": "#f3f5fb",
    "--card-shadow": "0 1px 2px rgba(30,34,56,.05), 0 4px 12px rgba(30,34,56,.05)",
    "--board-gap": "16px", "--card-pad": "14px", "--col-gap": "10px",
  },
  playful: {
    "--app-bg": "#faf6fc", "--sidebar-bg": "#ffffff", "--surface": "#ffffff",
    "--col-bg": "#f4ecfa", "--border": "#efe5f5",
    "--text": "#322c3d", "--text-muted": "#998aa9", "--text-soft": "#b6a9c4",
    "--radius": "22px", "--radius-sm": "14px", "--radius-lg": "26px",
    "--accent": "#c6a3ef", "--accent-text": "#8a58cf", "--accent-soft": "#f4ecfc",
    "--hover": "#f7f1fb",
    "--card-shadow": "0 3px 8px rgba(124,92,168,.10), 0 8px 22px rgba(124,92,168,.07)",
    "--board-gap": "18px", "--card-pad": "16px", "--col-gap": "13px",
  },
  crisp: {
    "--app-bg": "#ffffff", "--sidebar-bg": "#fcfcfd", "--surface": "#ffffff",
    "--col-bg": "#fafbfc", "--border": "#e6e8ec",
    "--text": "#1b1e26", "--text-muted": "#868b97", "--text-soft": "#a6abb5",
    "--radius": "8px", "--radius-sm": "6px", "--radius-lg": "10px",
    "--accent": "#5b8def", "--accent-text": "#356fe0", "--accent-soft": "#eef3fd",
    "--hover": "#f5f6f8",
    "--card-shadow": "none",
    "--board-gap": "14px", "--card-pad": "13px", "--col-gap": "8px",
  },
};

export const COLUMNS = [
  { id: "todo",     name: "Da fare",      dot: "#9aa7bd", soft: "#eef1f6", text: "#5d6577" },
  { id: "progress", name: "In corso",     dot: "#6aa0f5", soft: "#e9f1ff", text: "#3f6fd6" },
  { id: "review",  name: "In revisione", dot: "#b48af0", soft: "#f3ecfd", text: "#8b5fd0" },
  { id: "done",    name: "Fatto",        dot: "#5cc295", soft: "#e6f6ee", text: "#2f9d6b" },
];

export const PRIORITIES = {
  low:    { id: "low",    label: "Bassa",   color: "#3f9d72", bg: "#e7f6ee" },
  medium: { id: "medium", label: "Media",   color: "#4079cf", bg: "#e9f1fe" },
  high:   { id: "high",   label: "Alta",    color: "#cf8a36", bg: "#fbf1de" },
  urgent: { id: "urgent", label: "Urgente", color: "#d4607a", bg: "#fbe9ee" },
};

export const PRIO_ORDER = ["urgent", "high", "medium", "low"];

export function shortKey(uuid) {
  return "PR-" + uuid.slice(0, 6).toUpperCase();
}

export function displayInitials(info) {
  if (!info) return "U";
  const parts = [info.first_name, info.last_name].filter(Boolean);
  return parts.map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT");
}
