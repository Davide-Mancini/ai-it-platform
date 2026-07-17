import { useState, useEffect } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { fetchProcedures, fetchProceduresBrowse, createProcedure, fetchSteps, toggleStepStatus, acceptRecommendation, rejectRecommendation, updateProcedure, deleteProcedure, PROCEDURES_RESET_STEPS } from "../redux/actions/proceduresActions";
import { fetchAllTasks, createTask, updateTaskStatus, updateTaskPriority, assignUserToTask, unassignUserFromTask, submitTaskCustomerResponse } from "../redux/actions/tasksActions";
import { fetchDocuments, updateDocument, deleteDocument, uploadDocument } from "../redux/actions/documentsActions";
import { fetchUsers, fetchUsersBrowse, fetchRoles, updateUser, toggleUserActive } from "../redux/actions/usersActions";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications } from "../redux/actions/notificationsActions";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "../redux/actions/customersActions";
import { fetchReviewFindings, fetchRunStatus, triggerReview, acceptFinding, rejectFinding } from "../redux/actions/procedureReviewActions";
import { useNotificationsSSE } from "../hooks/useNotificationsSSE";

import Sidebar         from "./procedai/Sidebar";
import TopBar          from "./procedai/TopBar";
import Dashboard       from "./procedai/Dashboard";
import Analytics       from "./procedai/Analytics";
import ProcedureList   from "./procedai/ProcedureList";
import ProcedureDetail from "./procedai/ProcedureDetail";
import TaskBoard       from "./procedai/TaskBoard";
import Documents       from "./procedai/Documents";
import Team            from "./procedai/Team";
import Notifications   from "./procedai/Notifications";
import Settings        from "./procedai/Settings";
import UsersPage       from "./procedai/UsersPage";
import AgentReview     from "./procedai/AgentReview";
import CustomersPage   from "./procedai/CustomersPage";
import CustomerDocumentsPage from "./procedai/CustomerDocumentsPage";
import CreateModal     from "./procedai/CreateModal";
import ManualForm      from "./procedai/ManualForm";
import AIChat          from "./procedai/AIChat";
import NotFoundPage    from "./procedai/NotFoundPage";
import "../style/ProcedAIPage.css";
import { API_BASE } from "../config/api";

const AI_PROMPT_MAX_LENGTH = 2000;

// Tutti i pathname gestiti da renderContent qui sotto. Un pathname che non è
// in questa lista è un URL inesistente/sbagliato -> pagina 404, non un
// redirect silenzioso alla dashboard (che invece resta il comportamento per
// un pathname valido ma senza i permessi richiesti, es. /users da non-admin).
const KNOWN_PATHS = [
  "/procedures", "/tasks", "/documents", "/my-documents", "/team",
  "/analytics", "/notifications", "/settings", "/users", "/agent-review",
  "/customers", "/dashboard",
];

export default function ProcedAIPage({ token, onLogout, userInfo, onProfileUpdate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  // ── Stato Redux ─────────────────────────────────────────────────────────
  const { list: procedures, stepsById, loadingSteps, togglingStepId, browse: proceduresBrowse } = useSelector(s => s.procedures);
  const { list: tasks }       = useSelector(s => s.tasks);
  const { list: documents, loading: loadingDocs } = useSelector(s => s.documents);
  const { list: users, roles, loading: loadingUsers, browse: usersBrowse } = useSelector(s => s.users);
  const { list: notifications } = useSelector(s => s.notifications);
  const { list: customers, loading: loadingCustomers } = useSelector(s => s.customers);
  const reviewBrowse = useSelector(s => s.procedureReview);

  useNotificationsSSE(token);

  // ── Stato UI locale ─────────────────────────────────────────────────────
  // Dettaglio procedura: approccio originale con stato locale
  const [selectedProcId, setSelectedProcId] = useState(null);

  // Create flow
  const [showCreateChoice, setShowCreateChoice] = useState(false);
  const [showManual, setShowManual]             = useState(false);
  const [manualForm, setManualForm]             = useState({ title: "", description: "", customer_id: null });
  const [manualLoading, setManualLoading]       = useState(false);
  const [manualError, setManualError]           = useState("");

  // AI chat
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput]       = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiCustomerId, setAiCustomerId] = useState(null);

  const isAdmin = userInfo?.role?.name === "Admin" || userInfo?.role === "Admin";
  const isITManager = userInfo?.role?.name === "IT Manager" || userInfo?.role === "IT Manager";
  const isSales = userInfo?.role?.name === "Sales" || userInfo?.role === "Sales";
  const isCustomer = userInfo?.role?.name === "Customer" || userInfo?.role === "Customer";
  const canManageCustomers = isAdmin || isITManager || isSales;
  const canViewAIStats = isAdmin || isITManager;
  const canReviewProcedures = isAdmin || isITManager;

  const [recentActivity, setRecentActivity] = useState([]);
  const [collaborators, setCollaborators]   = useState([]);
  const [actionStats, setActionStats] = useState([]);
  const [aiStats, setAiStats] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [resolutionStats, setResolutionStats] = useState(null);
  const [roleStats, setRoleStats] = useState([]);
  const [procLanguageStats, setProcLanguageStats] = useState([]);
  const [procTrendStats, setProcTrendStats] = useState([]);

  // Ricerca + paginazione server-side per le tabelle/griglie di ProcedureList e UsersPage
  const [procSearch, setProcSearch] = useState("");
  const [procPage, setProcPage]     = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage]     = useState(1);
  const [reviewStatus, setReviewStatus]     = useState("pending");
  const [reviewSeverity, setReviewSeverity] = useState("");
  const [reviewPage, setReviewPage]         = useState(1);

  // Dati derivati per il dettaglio
  const selectedProc = selectedProcId ? procedures.find(p => p.id === selectedProcId) : null;
  const currentSteps = selectedProcId ? (stepsById[selectedProcId] || []) : [];

  // ── Caricamento iniziale ─────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchDocuments(token));
    dispatch(fetchNotifications(token));
    dispatch(fetchCustomers(token));
    const opts = { credentials: "include" };
    fetch(`${API_BASE}/api/audit/recent?limit=10`, opts)
      .then(r => r.ok ? r.json() : []).then(setRecentActivity).catch(() => {});
    fetch(`${API_BASE}/api/team/collaborators`, opts)
      .then(r => r.ok ? r.json() : []).then(setCollaborators).catch(() => {});
    fetch(`${API_BASE}/api/audit/stats/actions?limit=6`, opts)
      .then(r => r.ok ? r.json() : []).then(setActionStats).catch(() => {});
    fetch(`${API_BASE}/api/tasks/stats/resolution-time`, opts)
      .then(r => r.ok ? r.json() : null).then(setResolutionStats).catch(() => {});
    fetch(`${API_BASE}/api/procedures/stats/by-language`, opts)
      .then(r => r.ok ? r.json() : []).then(setProcLanguageStats).catch(() => {});
    fetch(`${API_BASE}/api/procedures/stats/created-trend?days=14`, opts)
      .then(r => r.ok ? r.json() : []).then(setProcTrendStats).catch(() => {});
  }, [dispatch, token]);

  useEffect(() => {
    if (!canViewAIStats) return;
    fetch(`${API_BASE}/api/ai/recommendations/stats`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null).then(setAiStats).catch(() => {});
  }, [token, canViewAIStats]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${API_BASE}/api/auth/users/workload?limit=10`, { credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(setWorkload).catch(() => {});
    fetch(`${API_BASE}/api/auth/users/stats/roles`, { credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(setRoleStats).catch(() => {});
  }, [token, isAdmin]);

  // Ricerca + paginazione server-side per la griglia di ProcedureList (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchProceduresBrowse(token, i18n.language, { page: procPage, pageSize: 25, search: procSearch }));
    }, 350);
    return () => clearTimeout(t);
  }, [dispatch, token, i18n.language, procPage, procSearch]);

  // Ricerca + paginazione server-side per la tabella di UsersPage (debounced)
  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => {
      dispatch(fetchUsersBrowse(token, { page: userPage, pageSize: 25, search: userSearch }));
    }, 350);
    return () => clearTimeout(t);
  }, [dispatch, token, isAdmin, userPage, userSearch]);

  // Ricarica procedure, step e task quando cambia la lingua dell'interfaccia, cosi'
  // title/description arrivano tradotti nella nuova lingua invece di restare
  // nella cache della lingua precedente.
  useEffect(() => {
    dispatch({ type: PROCEDURES_RESET_STEPS });
    dispatch(fetchProcedures(token, i18n.language));
    dispatch(fetchAllTasks(token, i18n.language));
  }, [dispatch, token, i18n.language]);

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUsers(token));
      dispatch(fetchRoles(token));
    }
  }, [dispatch, token, isAdmin]);

  // Carica gli step quando si seleziona una procedura (approccio originale)
  useEffect(() => {
    if (selectedProcId) dispatch(fetchSteps(token, selectedProcId, i18n.language));
  }, [dispatch, token, selectedProcId, i18n.language]);

  // Carica gli step delle procedure recenti mostrate in dashboard
  useEffect(() => {
    procedures.slice(0, 5).forEach(p => {
      if (!stepsById[p.id]) dispatch(fetchSteps(token, p.id, i18n.language));
    });
  }, [dispatch, token, procedures, i18n.language]);

  // Reset selectedProcId quando si naviga fuori da /procedures
  useEffect(() => {
    if (pathname !== "/procedures") setSelectedProcId(null);
  }, [pathname]);

  // Segnalazioni dell'agente di revisione: caricate solo quando si visita la tab
  // dedicata (riservata ad Admin/IT Manager), e ricaricate al cambio di filtro/pagina.
  useEffect(() => {
    if (!canReviewProcedures || pathname !== "/agent-review") return;
    dispatch(fetchReviewFindings({ status: reviewStatus, severity: reviewSeverity }, reviewPage));
  }, [dispatch, canReviewProcedures, pathname, reviewStatus, reviewSeverity, reviewPage]);

  // ── Ricerca/paginazione procedure e utenti ──────────────────────────────
  const handleProcSearchChange = (value) => { setProcSearch(value); setProcPage(1); };
  const handleUserSearchChange = (value) => { setUserSearch(value); setUserPage(1); };

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

  const {t} = useTranslation();
  const handleChoiceAI = () => {
    setShowCreateChoice(false);
    if (aiMessages.length === 0) {
      setAiMessages([{ role: "ai", text: t("ai.welcome_message") }]);
    }
    setAiChatOpen(true);
  };

  const closeModals = () => {
    setShowCreateChoice(false);
    setShowManual(false);
    setManualForm({ title: "", description: "", customer_id: null });
    setManualError("");
  };

  const createManual = async () => {
    if (!manualForm.title.trim()) { setManualError("Il titolo è obbligatorio."); return; }
    setManualLoading(true);
    setManualError("");
    try {
      const newProc = await dispatch(createProcedure(token, { ...manualForm, language: i18n.language }));
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
  const handleTaskStatusChange   = (taskId, newStatus)   => dispatch(updateTaskStatus(token, taskId, newStatus, i18n.language));
  const handleTaskPriorityChange = (taskId, newPriority) => dispatch(updateTaskPriority(token, taskId, newPriority, i18n.language));
  const handleCreateTask = async (title, procedureId, priority, requiresCustomerInput, requiredFields) => await dispatch(createTask(token, procedureId, title, priority, requiresCustomerInput, requiredFields));
  const handleAssignUser   = (taskId, userId) => dispatch(assignUserToTask(token, taskId, userId));
  const handleUnassignUser = (taskId, userId) => dispatch(unassignUserFromTask(token, taskId, userId));
  const handleSubmitTaskResponse = async (taskId, responseText) => await dispatch(submitTaskCustomerResponse(token, taskId, responseText));

  // ── AI chat ──────────────────────────────────────────────────────────────
  const toggleAIChat = () => {
    if (!aiChatOpen && aiMessages.length === 0) {
      setAiMessages([{ role: "ai", text: t("ai.welcome_message") }]);
    }
    setAiChatOpen(prev => !prev);
  };

  const sendAIMessage = async () => {
    const prompt = aiInput.trim();
    if (!prompt || aiLoading) return;
    if (prompt.length > AI_PROMPT_MAX_LENGTH) {
      setAiMessages(prev => [...prev, { role: "ai", isError: true, text: t("ai.prompt_too_long", { max: AI_PROMPT_MAX_LENGTH }) }]);
      return;
    }
    setAiMessages(prev => [...prev, { role: "user", text: prompt }]);
    setAiInput("");
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: i18n.language, customer_id: aiCustomerId || null }),
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
      await dispatch(acceptRecommendation(token, rec, i18n.language));
      // acceptRecommendation aggiorna solo lo stato "fetchProcedures" (usato per
      // analytics/dropdown): la griglia in sezione Procedure usa invece la
      // paginazione server-side di fetchProceduresBrowse, che va rinfrescata a parte.
      dispatch(fetchProceduresBrowse(token, i18n.language, { page: procPage, pageSize: 25, search: procSearch }));
      setAiMessages(prev => [
        ...prev.map(m => m.recommendation === rec ? { ...m, recAccepted: true } : m),
        { role: "ai", text: "Procedura salvata! La trovi nella lista procedure." },
      ]);
    } catch (e) {
      setAiMessages(prev => [...prev, { role: "ai", isError: true, text: e.message }]);
    }
  };

  const rejectRec = async (rec) => {
    await dispatch(rejectRecommendation(token, rec));
    setAiMessages(prev => [
      ...prev.map(m => m.recommendation === rec ? { ...m, recRejected: true } : m),
      { role: "ai", text: "Procedura scartata." },
    ]);
  };

  // ── Refresh attività recente ─────────────────────────────────────────────
  const handleRefreshActivity = async () => {
    const r = await fetch(`${API_BASE}/api/audit/recent?limit=10`, { credentials: "include" });
    if (r.ok) setRecentActivity(await r.json());
  };

  // ── Refresh dati Analytics ───────────────────────────────────────────────
  const handleRefreshAnalytics = async () => {
    const opts = { credentials: "include" };
    await Promise.all([
      dispatch(fetchProcedures(token, i18n.language)),
      dispatch(fetchAllTasks(token, i18n.language)),
      fetch(`${API_BASE}/api/audit/stats/actions?limit=6`, opts)
        .then(r => r.ok ? r.json() : []).then(setActionStats).catch(() => {}),
      fetch(`${API_BASE}/api/tasks/stats/resolution-time`, opts)
        .then(r => r.ok ? r.json() : null).then(setResolutionStats).catch(() => {}),
      fetch(`${API_BASE}/api/procedures/stats/by-language`, opts)
        .then(r => r.ok ? r.json() : []).then(setProcLanguageStats).catch(() => {}),
      fetch(`${API_BASE}/api/procedures/stats/created-trend?days=14`, opts)
        .then(r => r.ok ? r.json() : []).then(setProcTrendStats).catch(() => {}),
      canViewAIStats
        ? fetch(`${API_BASE}/api/ai/recommendations/stats`, opts)
            .then(r => r.ok ? r.json() : null).then(setAiStats).catch(() => {})
        : Promise.resolve(),
    ]);
  };

  // ── Refresh grafici pagina Utenti ────────────────────────────────────────
  const handleRefreshUserCharts = async () => {
    const opts = { credentials: "include" };
    await Promise.all([
      fetch(`${API_BASE}/api/auth/users/workload?limit=10`, opts)
        .then(r => r.ok ? r.json() : []).then(setWorkload).catch(() => {}),
      fetch(`${API_BASE}/api/auth/users/stats/roles`, opts)
        .then(r => r.ok ? r.json() : []).then(setRoleStats).catch(() => {}),
    ]);
  };

  // ── Gestione utenti ──────────────────────────────────────────────────────
  const handleSaveUser = async (userId, form) => await dispatch(updateUser(token, userId, form));

  // ── Gestione clienti ─────────────────────────────────────────────────────
  const handleCreateCustomer = async (form) => await dispatch(createCustomer(token, form));
  const handleSaveCustomer   = async (id, form) => await dispatch(updateCustomer(token, id, form));
  const handleDeleteCustomer = async (id) => await dispatch(deleteCustomer(token, id));
  // ── Agente di revisione procedure ────────────────────────────────────────
  const handleReviewFilterChange = ({ status, severity }) => {
    setReviewStatus(status);
    setReviewSeverity(severity);
    setReviewPage(1);
  };
  const handleReviewRefresh = () => dispatch(fetchReviewFindings({ status: reviewStatus, severity: reviewSeverity }, reviewPage));
  const handleTriggerReview = async () => await dispatch(triggerReview());
  const handleCheckRunStatus = async (runId) => await dispatch(fetchRunStatus(runId));
  const handleAcceptFinding = async (id) => { await dispatch(acceptFinding(id)); handleReviewRefresh(); };
  const handleRejectFinding = async (id) => { await dispatch(rejectFinding(id)); };

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
          browse={proceduresBrowse}
          search={procSearch}
          onSearchChange={handleProcSearchChange}
          onPageChange={setProcPage}
          isAdmin={isAdmin}
          canCreate={!isCustomer}
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
        canManage={!isCustomer}
        users={users}
        onAssignUser={handleAssignUser}
        onUnassignUser={handleUnassignUser}
        onSubmitResponse={handleSubmitTaskResponse}
      />
    );

    if (pathname === "/documents") return (
      <Documents
        documents={documents}
        loading={loadingDocs}
        isAdmin={isAdmin}
        token={token}
        customers={customers}
        onUpdateDocument={(id, data) => dispatch(updateDocument(token, id, data))}
        onDeleteDocument={(id) => dispatch(deleteDocument(token, id))}
      />
    );

    if (pathname === "/my-documents" && isCustomer) return (
      <CustomerDocumentsPage
        documents={documents}
        loading={loadingDocs}
        tasks={tasks}
        onUpload={(data) => dispatch(uploadDocument(token, data))}
      />
    );

    if (pathname === "/team") return <Team collaborators={collaborators} />;

    if (pathname === "/analytics") return (
      <Analytics
        tasks={tasks}
        actionStats={actionStats}
        aiStats={aiStats}
        resolutionStats={resolutionStats}
        languageStats={procLanguageStats}
        trendStats={procTrendStats}
        onRefresh={handleRefreshAnalytics}
      />
    );

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
        customers={customers}
        loading={loadingUsers}
        onSave={handleSaveUser}
        onToggleActive={(userId, isActive) => dispatch(toggleUserActive(token, userId, isActive))}
        token={token}
        workload={workload}
        roleStats={roleStats}
        browse={usersBrowse}
        search={userSearch}
        onSearchChange={handleUserSearchChange}
        onPageChange={setUserPage}
        onRefreshCharts={handleRefreshUserCharts}
      />
    );

    if (pathname === "/agent-review" && canReviewProcedures) return (
      <AgentReview
        browse={reviewBrowse}
        lastRun={reviewBrowse.lastRun}
        statusFilter={reviewStatus}
        severityFilter={reviewSeverity}
        onFilterChange={handleReviewFilterChange}
        onPageChange={setReviewPage}
        onTrigger={handleTriggerReview}
        onCheckRunStatus={handleCheckRunStatus}
        onAccept={handleAcceptFinding}
        onReject={handleRejectFinding}
        onRefresh={handleReviewRefresh}
      />
    );

    if (pathname === "/customers" && canManageCustomers) return (
      <CustomersPage
        customers={customers}
        loading={loadingCustomers}
        onCreate={handleCreateCustomer}
        onSave={handleSaveCustomer}
        onDelete={handleDeleteCustomer}
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

    if (!KNOWN_PATHS.includes(pathname)) {
      return <NotFoundPage onBack={() => navigate("/dashboard")} />;
    }

    // Pathname valido ma senza i permessi richiesti (es. /users da non-admin):
    // redirect silenzioso alla dashboard, non un 404.
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
          customers={customers}
        />
      )}

      <AIChat
        isOpen={aiChatOpen}
        onToggle={toggleAIChat}
        messages={aiMessages}
        input={aiInput}
        onInputChange={setAiInput}
        maxLength={AI_PROMPT_MAX_LENGTH}
        onSend={sendAIMessage}
        loading={aiLoading}
        onAccept={acceptRec}
        onReject={rejectRec}
        customers={customers}
        selectedCustomerId={aiCustomerId}
        onCustomerChange={setAiCustomerId}
      />
    </div>
  );
}
