export const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",          icon: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" },
  { id: "procedures",   label: "Procedure",           icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" },
  { id: "tasks",        label: "Task Board",          icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { id: "documents",    label: "Documenti & Policy",  icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  { id: "team",         label: "Team",                icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { id: "notifications",label: "Notifiche",           icon: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0", badge: true },
  { id: "settings",     label: "Impostazioni",        icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

export const STEP_STATUS = {
  todo:       { label: "Da fare",  color: "#94A3B8", bg: "#F1F5F9", text: "#475569" },
  inprogress: { label: "In corso", color: "#2563EB", bg: "#EFF6FF", text: "#2563EB" },
  done:       { label: "Fatto",    color: "#059669", bg: "#ECFDF5", text: "#059669" },
};

export const TASK_STATUS = {
  pending:     { label: "Da fare",   color: "#94A3B8" },
  in_progress: { label: "In corso",  color: "#2563EB" },
  done:        { label: "Fatto",     color: "#059669" },
};

export const PRIORITY = {
  critical: { label: "Critico", color: "#DC2626", bg: "#FEF2F2" },
  high:     { label: "Alto",    color: "#D97706", bg: "#FFFBEB" },
  medium:   { label: "Medio",   color: "#CA8A04", bg: "#FEFCE8" },
  low:      { label: "Basso",   color: "#94A3B8", bg: "#F8FAFC" },
};

// Mock team data (no backend endpoint)
export const MOCK_TEAM = [
  { id: "t1", name: "Marco Rossi",   position: "IT Manager",        email: "marco@company.it",  color: "#2563EB", initials: "MR", online: true },
  { id: "t2", name: "Sara Bianchi",  position: "Support Specialist", email: "sara@company.it",   color: "#7C3AED", initials: "SB", online: true },
  { id: "t3", name: "Luca Verdi",    position: "DevOps Engineer",    email: "luca@company.it",   color: "#059669", initials: "LV", online: false },
  { id: "t4", name: "Anna Martini",  position: "Technical Writer",   email: "anna@company.it",   color: "#D97706", initials: "AM", online: true },
];

// Mock notifications (no backend endpoint)
export const MOCK_NOTIFICATIONS = [
  { id: 1, type: "task",      title: "Nuovo task assegnato",   message: "Ti è stato assegnato un nuovo task",                  time: "5 min fa",  read: false },
  { id: 2, type: "procedure", title: "Procedura aggiornata",   message: "Una procedura è stata modificata",                    time: "1 ora fa",  read: false },
  { id: 3, type: "comment",   title: "Nuovo commento",          message: "Hai ricevuto un commento su una procedura",           time: "3 ore fa",  read: false },
  { id: 4, type: "task",      title: "Task completato",          message: "Un task è stato contrassegnato come completato",      time: "5 ore fa",  read: true },
  { id: 5, type: "system",    title: "Report settimanale",       message: "Il report settimanale delle procedure è disponibile", time: "1 giorno fa", read: true },
];

export function stepNextStatus(current) {
  if (current === "todo") return "inprogress";
  if (current === "inprogress") return "done";
  return "todo";
}

export function procedureProgress(steps) {
  if (!steps || steps.length === 0) return { done: 0, total: 0, pct: 0 };
  const done = steps.filter(s => s.status === "done").length;
  return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
}

export function displayInitials(userInfo) {
  if (!userInfo) return "U";
  const f = userInfo.first_name?.[0] || "";
  const l = userInfo.last_name?.[0] || "";
  return (f + l).toUpperCase() || userInfo.email?.[0]?.toUpperCase() || "U";
}
