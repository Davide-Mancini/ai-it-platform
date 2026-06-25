import { useState, useEffect, useCallback } from "react";
import { THEME, displayInitials } from "./heximus/constants";
import Sidebar from "./heximus/Sidebar";
import TopBar from "./heximus/TopBar";
import Board from "./heximus/Board";
import ListView from "./heximus/ListView";
import Dashboard from "./heximus/Dashboard";
import DetailPanel from "./heximus/DetailPanel";
import CreateModal from "./heximus/CreateModal";
import ManualForm from "./heximus/ManualForm";
import AIChat from "./heximus/AIChat";
import "./heximus/HeximusPage.css";

const API_BASE = "http://localhost:8000";

export default function HeximusPage({ token, onLogout, userInfo }) {
  // ── Procedures & board state ────────────────────────────────────────
  const [procedures, setProcedures] = useState([]);
  const [boardStatus, setBoardStatus] = useState({});   // id → "todo"|"progress"|"review"|"done"
  const [boardPriority, setBoardPriority] = useState({}); // id → "low"|"medium"|"high"|"urgent"
  const [loading, setLoading] = useState(true);

  // ── View / theme ────────────────────────────────────────────────────
  const [view, setView] = useState("board");
  const [variant, setVariant] = useState("soft");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // ── Detail panel ────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(null);
  const [panelTasks, setPanelTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // ── Drag & drop ─────────────────────────────────────────────────────
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // ── Create flow ─────────────────────────────────────────────────────
  const [showChoice, setShowChoice] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ title: "", description: "" });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  // ── AI chat ─────────────────────────────────────────────────────────
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────
  const apiFetch = useCallback((path, opts = {}) =>
    fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    }), [token]);

  const loadProcedures = async () => {
    try {
      const res = await apiFetch("/api/procedures/");
      if (res.ok) {
        const data = await res.json();
        setProcedures(data);
        setBoardStatus(prev => {
          const next = { ...prev };
          data.forEach(p => { if (!(p.id in next)) next[p.id] = "todo"; });
          return next;
        });
        setBoardPriority(prev => {
          const next = { ...prev };
          data.forEach(p => { if (!(p.id in next)) next[p.id] = "medium"; });
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Effects ─────────────────────────────────────────────────────────

  // Inline async IIFE avoids flagging an external setState-containing function
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/procedures/");
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProcedures(data);
        setBoardStatus(prev => {
          const next = { ...prev };
          data.forEach(p => { if (!(p.id in next)) next[p.id] = "todo"; });
          return next;
        });
        setBoardPriority(prev => {
          const next = { ...prev };
          data.forEach(p => { if (!(p.id in next)) next[p.id] = "medium"; });
          return next;
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiFetch]);

  // Load tasks when a procedure is selected; reset is handled by handleClosePanel
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const r = await apiFetch(`/api/tasks/procedures/${selectedId}/tasks`);
        const data = r.ok ? await r.json() : [];
        if (!cancelled) setPanelTasks(data);
      } catch {
        if (!cancelled) setPanelTasks([]);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    };
    fetchTasks();
    return () => { cancelled = true; };
  }, [selectedId, apiFetch]);

  // ── Create handlers ─────────────────────────────────────────────────
  const openCreate = () => { setShowChoice(true); setShowManual(false); };

  const handleChoiceManual = () => { setShowChoice(false); setShowManual(true); };

  const handleChoiceAI = () => {
    setShowChoice(false);
    if (aiMessages.length === 0) {
      setAiMessages([{
        role: "ai",
        text: "Ciao! Descrivimi la procedura che vuoi creare e la genererò automaticamente con tutti gli step necessari.\n\nEsempio: \"Crea una procedura per l'onboarding di un nuovo dipendente IT\"",
      }]);
    }
    setAiChatOpen(true);
  };

  const closeModals = () => {
    setShowChoice(false);
    setShowManual(false);
    setManualForm({ title: "", description: "" });
    setManualError("");
  };

  const createManual = async () => {
    if (!manualForm.title.trim()) { setManualError("Il titolo è obbligatorio."); return; }
    setManualLoading(true);
    setManualError("");
    try {
      const res = await apiFetch("/api/procedures/", {
        method: "POST",
        body: JSON.stringify({ title: manualForm.title, description: manualForm.description }),
      });
      if (res.ok) {
        const newProc = await res.json();
        setProcedures(prev => [newProc, ...prev]);
        setBoardStatus(prev => ({ ...prev, [newProc.id]: "todo" }));
        setBoardPriority(prev => ({ ...prev, [newProc.id]: "medium" }));
        closeModals();
        setSelectedId(newProc.id);
      } else {
        const err = await res.json().catch(() => ({}));
        setManualError(err.detail || "Errore durante la creazione.");
      }
    } finally {
      setManualLoading(false);
    }
  };

  // ── AI chat handlers ─────────────────────────────────────────────────
  const toggleAIChat = () => {
    if (!aiChatOpen && aiMessages.length === 0) {
      setAiMessages([{
        role: "ai",
        text: "Ciao! Descrivimi la procedura che vuoi creare e la genererò automaticamente con tutti gli step necessari.",
      }]);
    }
    setAiChatOpen(prev => !prev);
  };

  const sendAIMessage = async () => {
    const prompt = aiInput.trim();
    if (!prompt || aiLoading) return;
    setAiMessages(prev => [...prev, { role: "user", text: prompt }]);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await apiFetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const rec = await res.json();
        let out = {};
        try { out = JSON.parse(rec.output_text); } catch { /* ok */ }
        setAiMessages(prev => [...prev, {
          role: "ai",
          text: `Ho generato la procedura!\n\n**${out.title || "Nuova procedura"}**\n\n${out.description || ""}\n\nStep generati: ${out.tasks?.length || 0}`,
          recommendation: rec,
        }]);
      } else {
        const err = await res.json().catch(() => ({}));
        setAiMessages(prev => [...prev, {
          role: "ai", isError: true,
          text: err.detail || "Errore: impossibile generare la procedura. Verifica che il tuo ruolo sia Admin o IT Manager.",
        }]);
      }
    } catch {
      setAiMessages(prev => [...prev, { role: "ai", isError: true, text: "Errore di rete. Riprova." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const acceptRec = async (rec) => {
    try {
      const res = await apiFetch(`/api/ai/recommendations/${rec.id}/accept`, { method: "POST" });
      if (res.ok) {
        setAiMessages(prev => [...prev, { role: "ai", text: "Procedura accettata e salvata! La trovi nel board." }]);
        loadProcedures();
      } else {
        const err = await res.json().catch(() => ({}));
        setAiMessages(prev => [...prev, { role: "ai", isError: true, text: err.detail || "Errore durante l'accettazione." }]);
      }
    } catch {
      setAiMessages(prev => [...prev, { role: "ai", isError: true, text: "Errore di rete." }]);
    }
  };

  const rejectRec = async (rec) => {
    try {
      await apiFetch(`/api/ai/recommendations/${rec.id}/reject`, { method: "POST" });
      setAiMessages(prev => [...prev, { role: "ai", text: "Procedura scartata." }]);
    } catch { /* ok */ }
  };

  // ── Drag & drop handlers ─────────────────────────────────────────────
  const handleDragStart = (id) => setDraggedId(id);
  const handleDragEnd = () => { setDraggedId(null); setDragOverCol(null); };
  const handleDragOver = (colId) => { if (dragOverCol !== colId) setDragOverCol(colId); };
  const handleDrop = (colId) => {
    if (draggedId) setBoardStatus(prev => ({ ...prev, [draggedId]: colId }));
    handleDragEnd();
  };

  // ── Derived values ───────────────────────────────────────────────────
  const filtered = procedures.filter(p => {
    const q = search.trim().toLowerCase();
    const pf = priorityFilter;
    if (pf !== "all" && (boardPriority[p.id] || "medium") !== pf) return false;
    if (q && !p.title.toLowerCase().includes(q)) return false;
    return true;
  });

  const selectedProc = procedures.find(p => p.id === selectedId);
  const theme = THEME[variant];
  const initials = displayInitials(userInfo);
  const displayName = userInfo
    ? [userInfo.first_name, userInfo.last_name].filter(Boolean).join(" ") || userInfo.email
    : "Utente";
  const roleName = userInfo?.role?.name || userInfo?.role || "Utente";

  return (
    <div className="hx-root" style={theme}>
      <Sidebar
        view={view}
        onViewChange={setView}
        procedures={procedures}
        boardStatus={boardStatus}
        selectedId={selectedId}
        onSelectProcedure={setSelectedId}
        userInitials={initials}
        displayName={displayName}
        roleName={roleName}
        onLogout={onLogout}
        loading={loading}
      />

      <main className="hx-main">
        <TopBar
          view={view}
          search={search}
          onSearchChange={setSearch}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          variant={variant}
          onVariantChange={setVariant}
          onCreateClick={openCreate}
        />

        <div className="hx-content">
          {view === "board" && (
            <Board
              filtered={filtered}
              boardStatus={boardStatus}
              boardPriority={boardPriority}
              draggedId={draggedId}
              dragOverCol={dragOverCol}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onCardClick={setSelectedId}
            />
          )}
          {view === "list" && (
            <ListView
              procedures={filtered}
              boardStatus={boardStatus}
              boardPriority={boardPriority}
              onRowClick={setSelectedId}
            />
          )}
          {view === "dashboard" && (
            <Dashboard
              procedures={procedures}
              boardStatus={boardStatus}
              boardPriority={boardPriority}
            />
          )}
        </div>
      </main>

      {/* Detail panel */}
      {selectedProc && (
        <DetailPanel
          procedure={selectedProc}
          tasks={panelTasks}
          loadingTasks={loadingTasks}
          boardStatus={boardStatus}
          boardPriority={boardPriority}
          onClose={() => setSelectedId(null)}
          onStatusChange={status => setBoardStatus(prev => ({ ...prev, [selectedId]: status }))}
          onPriorityChange={priority => setBoardPriority(prev => ({ ...prev, [selectedId]: priority }))}
        />
      )}

      {/* Create choice */}
      {showChoice && (
        <CreateModal
          onManual={handleChoiceManual}
          onAI={handleChoiceAI}
          onClose={closeModals}
        />
      )}

      {/* Manual form */}
      {showManual && (
        <ManualForm
          form={manualForm}
          onChange={setManualForm}
          onSubmit={createManual}
          onClose={closeModals}
          loading={manualLoading}
          error={manualError}
        />
      )}

      {/* AI chat */}
      <AIChat
        isOpen={aiChatOpen}
        onToggle={toggleAIChat}
        messages={aiMessages}
        input={aiInput}
        onInputChange={setAiInput}
        onSend={sendAIMessage}
        loading={aiLoading}
        onAccept={acceptRec}
        onReject={rejectRec}
      />
    </div>
  );
}
