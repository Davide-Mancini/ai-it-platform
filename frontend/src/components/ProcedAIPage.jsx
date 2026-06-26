import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MOCK_NOTIFICATIONS } from "./procedai/constants";

import { fetchProcedures, createProcedure, fetchSteps, toggleStepStatus, acceptRecommendation, rejectRecommendation, updateProcedure, deleteProcedure } from "../redux/actions/proceduresActions";
import { fetchAllTasks, createTask, updateTaskStatus } from "../redux/actions/tasksActions";
import { fetchDocuments, updateDocument, deleteDocument } from "../redux/actions/documentsActions";
import { fetchUsers, fetchRoles, updateUser, toggleUserActive } from "../redux/actions/usersActions";

import Sidebar         from "./procedai/Sidebar";
import TopBar          from "./procedai/TopBar";
import Dashboard       from "./procedai/Dashboard";
import ProcedureList   from "./procedai/ProcedureList";
import ProcedureDetail from "./procedai/ProcedureDetail";
import TaskBoard       from "./procedai/TaskBoard";
import Documents       from "./procedai/Documents";
import Team            from "./procedai/Team";
import Notifications   from "./procedai/Notifications";
import Settings        from "./procedai/Settings";
import UsersPage       from "./procedai/UsersPage";
import CreateModal     from "./procedai/CreateModal";
import ManualForm      from "./procedai/ManualForm";
import AIChat          from "./procedai/AIChat";
import "./procedai/ProcedAIPage.css";

const API_BASE = "http://localhost:8000";

export default function ProcedAIPage({ token, onLogout, userInfo }) {
  const dispatch = useDispatch();

  // ── Stato Redux ─────────────────────────────────────────────────────────
  const { list: procedures, loading: loadingProc, stepsById, loadingSteps, togglingStepId } = useSelector(s => s.procedures);
  const { list: tasks,      loading: loadingTasks }  = useSelector(s => s.tasks);
  const { list: documents,  loading: loadingDocs  }  = useSelector(s => s.documents);
  const { list: users,      roles, loading: loadingUsers } = useSelector(s => s.users);

  // ── Stato UI locale ─────────────────────────────────────────────────────
  const [view, setView]                     = useState("dashboard");
  const [selectedProcId, setSelectedProcId] = useState(null);
  const [notifications, setNotifications]   = useState(MOCK_NOTIFICATIONS);

  // Create flow
  const [showCreateChoice, setShowCreateChoice] = useState(false);
  const [showManual, setShowManual]             = useState(false);
  const [manualForm, setManualForm]             = useState({ title: "", description: "" });
  const [manualLoading, setManualLoading]       = useState(false);
  const [manualError, setManualError]           = useState("");

  // AI chat
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput]       = useState("");
  const [aiLoading, setAiLoading]   = useState(false);

  const isAdmin = userInfo?.role?.name === "Admin" || userInfo?.role === "Admin";

  // ── Caricamento iniziale ─────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchProcedures(token));
    dispatch(fetchAllTasks(token));
    dispatch(fetchDocuments(token));
  }, [dispatch, token]);

  // Carica utenti e ruoli solo per admin
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUsers(token));
      dispatch(fetchRoles(token));
    }
  }, [dispatch, token, isAdmin]);

  // ── Carica gli step quando si seleziona una procedura ───────────────────
  useEffect(() => {
    if (selectedProcId) dispatch(fetchSteps(token, selectedProcId));
  }, [dispatch, token, selectedProcId]);

  // ── Navigazione ──────────────────────────────────────────────────────────
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

  // ── Creazione procedura ──────────────────────────────────────────────────
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
      const newProc = await dispatch(createProcedure(token, manualForm));
      closeModals();
      handleProcedureClick(newProc.id);
    } catch (e) {
      setManualError(e.message);
    } finally {
      setManualLoading(false);
    }
  };

  // ── Modifica / elimina procedura (admin) ────────────────────────────────
  const handleEditProcedure = async (id, form) => {
    await dispatch(updateProcedure(token, id, form));
  };

  const handleDeleteProcedure = async (id) => {
    await dispatch(deleteProcedure(token, id));
  };

  // ── Step toggle ──────────────────────────────────────────────────────────
  const handleStepToggle = (stepId, newStatus) => {
    dispatch(toggleStepStatus(token, stepId, newStatus, selectedProcId));
  };

  // ── Task ─────────────────────────────────────────────────────────────────
  const handleTaskStatusChange = (taskId, newStatus) => {
    dispatch(updateTaskStatus(token, taskId, newStatus));
  };

  const handleCreateTask = async (title, procedureId) => {
    await dispatch(createTask(token, procedureId, title));
  };

  // ── AI chat ──────────────────────────────────────────────────────────────
  const toggleAIChat = () => {
    if (!aiChatOpen && aiMessages.length === 0) {
      setAiMessages([{ role: "ai", text: "Ciao! Descrivimi la procedura che vuoi creare e la genererò automaticamente." }]);
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
      const res = await fetch(`${API_BASE}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      await dispatch(acceptRecommendation(token, rec));
      setAiMessages(prev => [...prev, { role: "ai", text: "Procedura salvata! La trovi nella lista procedure." }]);
    } catch (e) {
      setAiMessages(prev => [...prev, { role: "ai", isError: true, text: e.message }]);
    }
  };

  const rejectRec = async (rec) => {
    await dispatch(rejectRecommendation(token, rec));
    setAiMessages(prev => [...prev, { role: "ai", text: "Procedura scartata." }]);
  };

  // ── Gestione utenti (admin) ──────────────────────────────────────────────
  const handleSaveUser = async (userId, form) => {
    await dispatch(updateUser(token, userId, form));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ── Dati derivati ────────────────────────────────────────────────────────
  const unreadCount  = notifications.filter(n => !n.read).length;
  const selectedProc = procedures.find(p => p.id === selectedProcId);
  const currentSteps = stepsById[selectedProcId] || [];

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
              stepsById={stepsById}
              onProcedureClick={handleProcedureClick}
              onViewChange={handleViewChange}
            />
          )}

          {view === "procedures" && (
            <ProcedureList
              procedures={procedures}
              isAdmin={isAdmin}
              onProcedureClick={handleProcedureClick}
              onCreateClick={openCreate}
              onEditProcedure={handleEditProcedure}
              onDeleteProcedure={handleDeleteProcedure}
            />
          )}

          {view === "procedure-detail" && selectedProc && (
            <ProcedureDetail
              procedure={selectedProc}
              steps={currentSteps}
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
            <Documents
              documents={documents}
              loading={loadingDocs}
              isAdmin={isAdmin}
              onUpdateDocument={(id, data) => dispatch(updateDocument(token, id, data))}
              onDeleteDocument={(id) => dispatch(deleteDocument(token, id))}
            />
          )}

          {view === "team" && <Team />}

          {view === "notifications" && (
            <Notifications
              notifications={notifications}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}

          {view === "settings" && <Settings userInfo={userInfo} />}

          {view === "users" && isAdmin && (
            <UsersPage
              users={users}
              roles={roles}
              loading={loadingUsers}
              onSave={handleSaveUser}
              onToggleActive={(userId, isActive) => dispatch(toggleUserActive(token, userId, isActive))}
            />
          )}
        </div>
      </div>

      {showCreateChoice && (
        <CreateModal onManual={handleChoiceManual} onAI={handleChoiceAI} onClose={closeModals} />
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
