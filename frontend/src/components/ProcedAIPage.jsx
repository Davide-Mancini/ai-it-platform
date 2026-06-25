import { useState, useEffect, useCallback } from "react";
import { MOCK_NOTIFICATIONS } from "./procedai/constants";
import Sidebar       from "./procedai/Sidebar";
import TopBar        from "./procedai/TopBar";
import Dashboard     from "./procedai/Dashboard";
import ProcedureList from "./procedai/ProcedureList";
import ProcedureDetail from "./procedai/ProcedureDetail";
import TaskBoard     from "./procedai/TaskBoard";
import Documents     from "./procedai/Documents";
import Team          from "./procedai/Team";
import Notifications from "./procedai/Notifications";
import Settings      from "./procedai/Settings";
import CreateModal   from "./procedai/CreateModal";
import ManualForm    from "./procedai/ManualForm";
import AIChat        from "./procedai/AIChat";
import "./procedai/ProcedAIPage.css";

const API_BASE = "http://localhost:8000";

export default function ProcedAIPage({ token, onLogout, userInfo }) {
  // ── Navigation ─────────────────────────────────────────────────────────
  const [view, setView] = useState("dashboard");

  // ── Procedures ─────────────────────────────────────────────────────────
  const [procedures, setProcedures] = useState([]);
  const [loadingProc, setLoadingProc] = useState(true);
  const [selectedProcId, setSelectedProcId] = useState(null);

  // ── Steps (for selected procedure) ─────────────────────────────────────
  const [steps, setSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState(null);

  // ── Tasks ───────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // ── Documents ───────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // ── Notifications ───────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // ── Create flow ─────────────────────────────────────────────────────────
  const [showCreateChoice, setShowCreateChoice] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ title: "", description: "" });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  // ── AI chat ─────────────────────────────────────────────────────────────
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ── API helper ──────────────────────────────────────────────────────────
  const apiFetch = useCallback((path, opts = {}) =>
    fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    }), [token]);

  // ── Load procedures ─────────────────────────────────────────────────────
  const loadProcedures = useCallback(async () => {
    try {
      const res = await apiFetch("/api/procedures/");
      if (!res.ok) return;
      const data = await res.json();
      // Attach steps cache as _steps (populated lazily)
      setProcedures(prev => {
        const prevById = Object.fromEntries(prev.map(p => [p.id, p]));
        return data.map(p => ({ ...p, _steps: prevById[p.id]?._steps || [] }));
      });
    } finally {
      setLoadingProc(false);
    }
  }, [apiFetch]);

  // ── Load all tasks ──────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await apiFetch("/api/tasks/");
      if (res.ok) setTasks(await res.json());
    } finally {
      setLoadingTasks(false);
    }
  }, [apiFetch]);

  // ── Load documents ──────────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await apiFetch("/api/documents/documents");
      if (res.ok) setDocuments(await res.json());
    } finally {
      setLoadingDocs(false);
    }
  }, [apiFetch]);

  // ── Load steps for selected procedure ────────────────────────────────────
  const loadSteps = useCallback(async (procId) => {
    if (!procId) return;
    setLoadingSteps(true);
    setSteps([]);
    try {
      const res = await apiFetch(`/api/procedures/${procId}/steps`);
      if (res.ok) {
        const data = await res.json();
        setSteps(data);
        // Cache steps on the procedure object for dashboard progress bars
        setProcedures(prev => prev.map(p => p.id === procId ? { ...p, _steps: data } : p));
      }
    } finally {
      setLoadingSteps(false);
    }
  }, [apiFetch]);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiFetch("/api/procedures/");
      if (cancelled || !res.ok) return;
      const data = await res.json();
      setProcedures(data.map(p => ({ ...p, _steps: [] })));
      setLoadingProc(false);
    })();
    return () => { cancelled = true; };
  }, [apiFetch]);

  useEffect(() => {
    loadTasks();
    loadDocuments();
  }, [loadTasks, loadDocuments]);

  // ── Load steps when procedure selected ──────────────────────────────────
  useEffect(() => {
    if (selectedProcId) loadSteps(selectedProcId);
    else setSteps([]);
  }, [selectedProcId, loadSteps]);

  // ── Navigation helpers ──────────────────────────────────────────────────
  const handleViewChange = (v) => {
    setView(v);
    setSelectedProcId(null);
  };

  const handleProcedureClick = (id) => {
    setSelectedProcId(id);
    setView("procedure-detail");
  };

  const handleProcedureBack = () => {
    setSelectedProcId(null);
    setView("procedures");
  };

  // ── Create handlers ─────────────────────────────────────────────────────
  const openCreate = () => { setShowCreateChoice(true); setShowManual(false); };

  const handleChoiceManual = () => { setShowCreateChoice(false); setShowManual(true); };

  const handleChoiceAI = () => {
    setShowCreateChoice(false);
    if (aiMessages.length === 0) {
      setAiMessages([{
        role: "ai",
        text: "Ciao! Descrivimi la procedura che vuoi creare e la genererò con tutti gli step.\n\nEs: \"Onboarding nuovo cliente\", \"Deploy in produzione\", \"Gestione ticket critico\"",
      }]);
    }
    setAiChatOpen(true);
  };

  const closeModals = () => {
    setShowCreateChoice(false);
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
        setProcedures(prev => [{ ...newProc, _steps: [] }, ...prev]);
        closeModals();
        handleProcedureClick(newProc.id);
      } else {
        const err = await res.json().catch(() => ({}));
        setManualError(err.detail || "Errore durante la creazione.");
      }
    } finally {
      setManualLoading(false);
    }
  };

  // ── Step toggle ─────────────────────────────────────────────────────────
  const handleStepToggle = async (stepId, newStatus) => {
    setTogglingStepId(stepId);
    try {
      const res = await apiFetch(`/api/procedures/steps/${stepId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSteps(prev => prev.map(s => s.id === updated.id ? updated : s));
        setProcedures(prev => prev.map(p =>
          p.id === selectedProcId
            ? { ...p, _steps: (p._steps || []).map(s => s.id === updated.id ? updated : s) }
            : p
        ));
      }
    } finally {
      setTogglingStepId(null);
    }
  };

  // ── Create task ─────────────────────────────────────────────────────────
  const handleCreateTask = async (title, procedureId) => {
    const res = await apiFetch(`/api/tasks/procedures/${procedureId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Errore durante la creazione del task.");
    }
  };

  // ── Task status change ─────────────────────────────────────────────────
  const handleTaskStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await apiFetch(`/api/tasks/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      loadTasks(); // rollback
    }
  };

  // ── AI chat handlers ────────────────────────────────────────────────────
  const toggleAIChat = () => {
    if (!aiChatOpen && aiMessages.length === 0) {
      setAiMessages([{
        role: "ai",
        text: "Ciao! Descrivimi la procedura che vuoi creare e la genererò automaticamente.",
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
          text: err.detail || "Errore: verifica di avere il ruolo Admin o IT Manager.",
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
        setAiMessages(prev => [...prev, { role: "ai", text: "Procedura salvata! La trovi nella lista procedure." }]);
        await loadProcedures();
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

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;
  const selectedProc = procedures.find(p => p.id === selectedProcId);

  return (
    <div className="pai-root">
      <Sidebar
        view={view}
        onViewChange={handleViewChange}
        userInfo={userInfo}
        onLogout={onLogout}
        unreadCount={unreadCount}
      />

      <div className="pai-main">
        <TopBar
          view={view}
          userInfo={userInfo}
          unreadCount={unreadCount}
          onViewChange={handleViewChange}
        />

        <div className="pai-content">
          {view === "dashboard" && (
            <Dashboard
              procedures={procedures}
              tasks={tasks}
              onProcedureClick={handleProcedureClick}
              onViewChange={handleViewChange}
            />
          )}

          {view === "procedures" && (
            <ProcedureList
              procedures={procedures}
              onProcedureClick={handleProcedureClick}
              onCreateClick={openCreate}
            />
          )}

          {view === "procedure-detail" && selectedProc && (
            <ProcedureDetail
              procedure={selectedProc}
              steps={steps}
              tasks={tasks}
              loadingSteps={loadingSteps}
              togglingStepId={togglingStepId}
              onBack={handleProcedureBack}
              onStepToggle={handleStepToggle}
            />
          )}

          {view === "tasks" && (
            <TaskBoard
              tasks={tasks}
              procedures={procedures}
              onStatusChange={handleTaskStatusChange}
              onCreateTask={handleCreateTask}
            />
          )}

          {view === "documents" && (
            <Documents documents={documents} loading={loadingDocs} />
          )}

          {view === "team" && <Team />}

          {view === "notifications" && (
            <Notifications
              notifications={notifications}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}

          {view === "settings" && <Settings userInfo={userInfo} />}
        </div>
      </div>

      {/* Modals */}
      {showCreateChoice && (
        <CreateModal
          onManual={handleChoiceManual}
          onAI={handleChoiceAI}
          onClose={closeModals}
        />
      )}
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

      {/* AI Chat FAB */}
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
