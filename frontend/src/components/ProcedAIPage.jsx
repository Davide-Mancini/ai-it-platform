import { useState, useEffect } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchProcedures, createProcedure, fetchSteps, toggleStepStatus, acceptRecommendation, rejectRecommendation, updateProcedure, deleteProcedure } from "../redux/actions/proceduresActions";
import { fetchAllTasks, createTask, updateTaskStatus, updateTaskPriority, assignUserToTask, unassignUserFromTask } from "../redux/actions/tasksActions";
import { fetchDocuments, updateDocument, deleteDocument } from "../redux/actions/documentsActions";
import { fetchUsers, fetchRoles, updateUser, toggleUserActive } from "../redux/actions/usersActions";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications } from "../redux/actions/notificationsActions";
import { useNotificationsSSE } from "../hooks/useNotificationsSSE";

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

export default function ProcedAIPage({ token, onLogout, userInfo, onProfileUpdate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ── Stato Redux ─────────────────────────────────────────────────────────
  const { list: procedures, stepsById, loadingSteps, togglingStepId } = useSelector(s => s.procedures);
  const { list: tasks }       = useSelector(s => s.tasks);
  const { list: documents, loading: loadingDocs } = useSelector(s => s.documents);
  const { list: users, roles, loading: loadingUsers } = useSelector(s => s.users);
  const { list: notifications } = useSelector(s => s.notifications);

  useNotificationsSSE(token);

  // ── Stato UI locale ─────────────────────────────────────────────────────
  // Dettaglio procedura: approccio originale con stato locale
  const [selectedProcId, setSelectedProcId] = useState(null);

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

  const [recentActivity, setRecentActivity] = useState([]);
  const [collaborators, setCollaborators]   = useState([]);

  // Dati derivati per il dettaglio
  const selectedProc = selectedProcId ? procedures.find(p => p.id === selectedProcId) : null;
  const currentSteps = selectedProcId ? (stepsById[selectedProcId] || []) : [];

  // ── Caricamento iniziale ─────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchProcedures(token));
    dispatch(fetchAllTasks(token));
    dispatch(fetchDocuments(token));
    dispatch(fetchNotifications(token));
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/api/audit/recent?limit=10`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(setRecentActivity).catch(() => {});
    fetch(`${API_BASE}/api/team/collaborators`, { headers: h })
      .then(r => r.ok ? r.json() : []).then(setCollaborators).catch(() => {});
  }, [dispatch, token]);

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUsers(token));
      dispatch(fetchRoles(token));
    }
  }, [dispatch, token, isAdmin]);

  // Carica gli step quando si seleziona una procedura (approccio originale)
  useEffect(() => {
    if (selectedProcId) dispatch(fetchSteps(token, selectedProcId));
  }, [dispatch, token, selectedProcId]);

  // Carica gli step delle procedure recenti mostrate in dashboard
  useEffect(() => {
    procedures.slice(0, 5).forEach(p => {
      if (!stepsById[p.id]) dispatch(fetchSteps(token, p.id));
    });
  }, [dispatch, token, procedures]);

  // Reset selectedProcId quando si naviga fuori da /procedures
  useEffect(() => {
    if (pathname !== "/procedures") setSelectedProcId(null);
  }, [pathname]);

  // ── Navigazione ──────────────────────────────────────────────────────────
  const handleProcedureClick = (id) => {
    setSelectedProcId(id);
    navigate("/procedures");
  };

  const handleProcedureBack = () => {
    setSelectedProcId(null);
  };

  // ── Creazione procedura ──────────────────────────────────────────────────
  const openCreate = () => { setShowCreateChoice(true); setShowManual(false); };
  const handleChoiceManual = () => { setShowCreateChoice(false); setShowManual(true); };

  const handleChoiceAI = () => {
    setShowCreateChoice(false);
    if (aiMessages.length === 0) {
      setAiMessages([{ role: "ai", text: "Ciao! Descrivimi la procedura che vuoi creare e la genererò con tutti gli step.\n\nEs: \"Onboarding nuovo cliente\", \"Deploy in produzione\", \"Gestione ticket critico\"" }]);
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

  // ── Modifica / elimina procedura ─────────────────────────────────────────
  const handleEditProcedure   = async (id, form) => await dispatch(updateProcedure(token, id, form));
  const handleDeleteProcedure = async (id) => await dispatch(deleteProcedure(token, id));

  // ── Step toggle ──────────────────────────────────────────────────────────
  const handleStepToggle = (stepId, newStatus) => {
    dispatch(toggleStepStatus(token, stepId, newStatus, selectedProcId));
  };

  // ── Task ─────────────────────────────────────────────────────────────────
  const handleTaskStatusChange   = (taskId, newStatus)   => dispatch(updateTaskStatus(token, taskId, newStatus));
  const handleTaskPriorityChange = (taskId, newPriority) => dispatch(updateTaskPriority(token, taskId, newPriority));
  const handleCreateTask = async (title, procedureId, priority) => await dispatch(createTask(token, procedureId, title, priority));
  const handleAssignUser   = (taskId, userId) => dispatch(assignUserToTask(token, taskId, userId));
  const handleUnassignUser = (taskId, userId) => dispatch(unassignUserFromTask(token, taskId, userId));

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
        setAiMessages(prev => [...prev, { role: "ai", isError: true, text: err.detail || "Errore: verifica di avere il ruolo Admin o IT Manager." }]);
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

  // ── Refresh attività recente ─────────────────────────────────────────────
  const handleRefreshActivity = async () => {
    const r = await fetch(`${API_BASE}/api/audit/recent?limit=10`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setRecentActivity(await r.json());
  };

  // ── Gestione utenti ──────────────────────────────────────────────────────
  const handleSaveUser = async (userId, form) => await dispatch(updateUser(token, userId, form));
  const handleMarkNotificationRead     = (id) => dispatch(markNotificationRead(token, id));
  const handleMarkAllNotificationsRead = ()   => dispatch(markAllNotificationsRead(token));
  const handleDeleteNotification       = (id) => dispatch(deleteNotification(token, id));
  const handleDeleteAllNotifications   = ()   => dispatch(deleteAllNotifications(token));

  // ── Dati derivati ────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Rendering basato su URL (React Router) + stato per il dettaglio ──────
  const renderContent = () => {
    if (pathname === "/procedures") {
      // Dettaglio procedura: approccio originale con stato locale
      if (selectedProcId && selectedProc) {
        return (
          <ProcedureDetail
            procedure={selectedProc}
            steps={currentSteps}
            tasks={tasks}
            loadingSteps={loadingSteps}
            togglingStepId={togglingStepId}
            onBack={handleProcedureBack}
            onStepToggle={handleStepToggle}
          />
        );
      }
      return (
        <ProcedureList
          procedures={procedures}
          isAdmin={isAdmin}
          onProcedureClick={handleProcedureClick}
          onCreateClick={openCreate}
          onEditProcedure={handleEditProcedure}
          onDeleteProcedure={handleDeleteProcedure}
        />
      );
    }

    if (pathname === "/tasks") return (
      <TaskBoard
        tasks={tasks}
        procedures={procedures}
        onStatusChange={handleTaskStatusChange}
        onPriorityChange={handleTaskPriorityChange}
        onCreateTask={handleCreateTask}
        isAdmin={isAdmin}
        users={users}
        onAssignUser={handleAssignUser}
        onUnassignUser={handleUnassignUser}
      />
    );

    if (pathname === "/documents") return (
      <Documents
        documents={documents}
        loading={loadingDocs}
        isAdmin={isAdmin}
        token={token}
        onUpdateDocument={(id, data) => dispatch(updateDocument(token, id, data))}
        onDeleteDocument={(id) => dispatch(deleteDocument(token, id))}
      />
    );

    if (pathname === "/team") return <Team collaborators={collaborators} />;

    if (pathname === "/notifications") return (
      <Notifications
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDelete={handleDeleteNotification}
        onDeleteAll={handleDeleteAllNotifications}
      />
    );

    if (pathname === "/settings") return <Settings userInfo={userInfo} token={token} onProfileUpdate={onProfileUpdate} />;

    if (pathname === "/users" && isAdmin) return (
      <UsersPage
        users={users}
        roles={roles}
        loading={loadingUsers}
        onSave={handleSaveUser}
        onToggleActive={(userId, isActive) => dispatch(toggleUserActive(token, userId, isActive))}
        token={token}
      />
    );

    if (pathname === "/dashboard") return (
      <Dashboard
        procedures={procedures}
        tasks={tasks}
        stepsById={stepsById}
        recentActivity={recentActivity}
        notifications={notifications}
        onProcedureClick={handleProcedureClick}
        onViewChange={(v) => navigate(`/${v}`)}
        onRefreshActivity={handleRefreshActivity}
      />
    );

    return <Navigate to="/dashboard" replace />;
  };

  return (
    <div className="pai-root">
      <Sidebar userInfo={userInfo} onLogout={onLogout} unreadCount={unreadCount} />

      <div className="pai-main">
        <TopBar
          userInfo={userInfo}
          unreadCount={unreadCount}
          isProcedureDetail={pathname === "/procedures" && !!selectedProcId}
        />

        <div className="pai-content">
          {renderContent()}
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
