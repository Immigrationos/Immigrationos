import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ── CASE TYPES & WORKFLOWS ────────────────────────────────────────────────────
const CASE_TYPES = {
  "Defesa de Remoção": { icon: "⚖️", color: "#E07070", steps: ["Consulta inicial e avaliação do caso","Revisão do Notice to Appear (NTA)","Cadastro no EOIR e agendamento","Identificar defesas disponíveis","Preparar Master Hearing","Coletar evidências e documentos","Preparar testemunhas","Individual Hearing - apresentação","Decisão do juiz","Recurso (se necessário)"] },
  "Asilo": { icon: "🛡️", color: "#E8A090", steps: ["Consulta inicial - avaliação de elegibilidade","Entrevista aprofundada com cliente","Preparar formulário I-589","Coletar evidências de perseguição","Reunir documentos de apoio","Protocolar I-589 (dentro de 1 ano)","Aguardar agendamento de entrevista","Preparar cliente para entrevista","Entrevista no USCIS / Corte","Decisão - aprovação ou negação","Recurso ao BIA (se necessário)"] },
  "Cancellation of Removal": { icon: "🔄", color: "#E8C490", steps: ["Avaliar elegibilidade (10 anos + bom caráter + hardship)","Documentar presença contínua de 10 anos","Reunir evidências de hardship excepcional","Preparar declarações de familiares","Protocolar resposta ao NTA","Preparar Motion para cancelamento","Individual Hearing","Decisão do juiz de imigração"] },
  "VAWA": { icon: "🌸", color: "#D4A0C8", steps: ["Consulta confidencial - avaliação de segurança","Documentar abuso (policial, médico, declarações)","Preparar declaração pessoal","Preparar formulário I-360","Protocolar I-360 no VSC","Aguardar aprovação do I-360","Protocolar I-485 (se aplicável)","Entrevista USCIS","Aprovação do Green Card"] },
  "Visto U": { icon: "🔵", color: "#7EAED4", steps: ["Verificar elegibilidade (vítima de crime)","Obter certificação de autoridade policial (I-918B)","Preparar formulário I-918","Documentar o crime e danos sofridos","Preparar declaração pessoal","Protocolar I-918","Aguardar aprovação (fila de espera)","Aprovação e emissão do visto U","Após 3 anos - solicitar Green Card"] },
  "Visto T": { icon: "🔷", color: "#7EBAD4", steps: ["Identificar vítima de tráfico humano","Contatar autoridades se necessário","Preparar formulário I-914","Certificação de autoridade (I-914B) se disponível","Documentar tráfico e cooperação","Protocolar I-914","Aguardar decisão USCIS","Aprovação do Visto T","Após 3 anos - Green Card"] },
  "Petição Familiar": { icon: "👨‍👩‍👧", color: "#A8C5A0", steps: ["Determinar categoria de preferência","Preparar formulário I-130","Reunir documentos de relacionamento","Protocolar I-130 no USCIS","Aguardar aprovação do I-130","Verificar prioridade no Visa Bulletin","Submeter ao NVC (caso consular)","Preparar formulário DS-260","Entrevista consular","Emissão do visto imigrante","Entrada nos EUA e Green Card"] },
  "Remoção de Condições": { icon: "💚", color: "#90C890", steps: ["Verificar prazo (90 dias antes do aniversário de 2 anos)","Preparar formulário I-751","Reunir evidências de casamento genuíno","Preparar declaração conjunta","Protocolar I-751","Aguardar RFE (se houver)","Entrevista USCIS (se solicitada)","Aprovação e Green Card permanente"] },
  "Reentry Permit / SB-1": { icon: "✈️", color: "#C8D4A0", steps: ["Avaliar situação (tempo fora dos EUA)","Determinar tipo de documento necessário","Preparar formulário I-131 ou DS-117","Reunir justificativas para ausência prolongada","Protocolar pedido","Agendar entrevista (se necessário)","Aprovação"] },
  "EB-1": { icon: "⭐", color: "#D4C86E", steps: ["Avaliar elegibilidade (critérios EB-1A/B/C)","Mapear evidências de extraordinary ability","Coletar prêmios, publicações, citações","Reunir cartas de especialistas","Preparar petição I-140","Protocolar I-140 (premium ou regular)","Responder RFE (se necessário)","Aprovação do I-140","Verificar prioridade (Visa Bulletin)","Protocolar I-485 ou processo consular","Entrevista USCIS","Aprovação Green Card"] },
  "EB-2 NIW": { icon: "🎓", color: "#C8A96E", steps: ["Avaliar elegibilidade NIW (Matter of Dhanasar)","Definir endeavor de importância nacional","Coletar evidências de contribuições substanciais","Preparar análise do teste Dhanasar","Reunir cartas de especialistas","Preparar petição I-140","Protocolar I-140","Responder RFE (se necessário)","Aprovação do I-140","Verificar prioridade (Visa Bulletin)","Protocolar I-485 ou processo consular","Aprovação Green Card"] },
  "EB-3": { icon: "👷", color: "#B8A96E", steps: ["Verificar elegibilidade (skilled/unskilled/professional)","Employer confirma disponibilidade","Completar processo PERM (se necessário)","Aprovação do PERM","Preparar petição I-140","Protocolar I-140","Aguardar prioridade no Visa Bulletin","Protocolar I-485 ou processo consular","Entrevista USCIS","Aprovação Green Card"] },
  "PERM": { icon: "📋", color: "#D4A870", steps: ["Determinar requisitos mínimos do cargo","Realizar prevailing wage determination (PWD)","Conduzir recrutamento obrigatório (30-60 dias)","Documentar resultado das entrevistas","Preparar formulário ETA-9089","Protocolar no DOL","Aguardar processamento (4-6 meses)","Auditoria DOL (se solicitada)","Aprovação do PERM"] },
  "Visto O": { icon: "🏆", color: "#D4B86E", steps: ["Avaliar elegibilidade (extraordinary ability)","Definir atividades nos EUA","Obter carta do agente/consultor","Reunir evidências de extraordinary ability","Obter consulta de organização da área","Preparar petição I-129","Protocolar I-129","Aprovação e emissão do visto"] },
  "Visto L-1": { icon: "🏢", color: "#A090D4", steps: ["Verificar elegibilidade (L-1A gerencial / L-1B especializado)","Documentar relação entre empresas","Confirmar 1 ano de emprego nos últimos 3","Preparar petição I-129 + L Supplement","Reunir evidências de cargo gerencial/especializado","Protocolar I-129","Aprovação e emissão do visto","Extensão (se necessário)"] },
  "Visto H-1B": { icon: "💼", color: "#9090D4", steps: ["Verificar elegibilidade (specialty occupation)","Confirmar Prevailing Wage","Obter LCA (Labor Condition Application)","Registrar no H-1B lottery (abril)","Aguardar seleção no lottery","Preparar petição I-129","Protocolar I-129 (após 1 de abril)","Aprovação e emissão do visto"] },
  "Visto E-2": { icon: "💰", color: "#80C8A0", steps: ["Verificar país do tratado","Avaliar investimento (substancial e real)","Estruturar empresa nos EUA","Preparar business plan detalhado","Documentar investimento realizado","Preparar DS-160 / I-129E","Entrevista consular ou I-539","Aprovação do visto E-2","Renovação periódica"] },
  "Visto E-1": { icon: "🚢", color: "#70B8A0", steps: ["Verificar país do tratado","Documentar comércio substancial","Confirmar 50%+ do comércio entre os países","Preparar DS-160 / I-129E","Reunir evidências de comércio contínuo","Entrevista consular","Aprovação do visto E-1","Renovação periódica"] },
  "Cidadania Americana": { icon: "🇺🇸", color: "#C8A0A0", steps: ["Verificar elegibilidade (5 anos / 3 anos casado com cidadão)","Verificar ausências dos EUA","Verificar bom caráter moral","Preparar formulário N-400","Reunir documentos necessários","Protocolar N-400","Biometria","Entrevista de naturalização","Teste de inglês e civismo","Cerimônia de naturalização"] },
  "Mudança de Status F-1": { icon: "🎒", color: "#A8C8D4", steps: ["Obter I-20 da instituição de ensino","Verificar status atual e elegibilidade","Preparar formulário I-539","Reunir documentos financeiros","Reunir documentos da instituição","Protocolar I-539","Aguardar aprovação","Aprovação e início dos estudos"] },
  "Extensão I-94": { icon: "📅", color: "#C8D4A8", steps: ["Verificar data de expiração do I-94","Identificar categoria de extensão","Preparar formulário I-539 ou I-129","Reunir documentos de suporte","Protocolar antes do vencimento","Aguardar aprovação","Atualizar I-94"] },
};

const CASE_TYPE_NAMES = Object.keys(CASE_TYPES);
const TODAY = new Date();
const daysUntil = (d) => Math.ceil((new Date(d) - TODAY) / 86400000);
const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR");
const statusColors = { "Em Andamento": "#C8A96E", "Aguardando Cliente": "#7EAED4", "Aprovado": "#A8C5A0", "Em Revisão": "#E8A090", "Arquivado": "#6A5E52" };
const priorityColors = { Urgente: "#E07070", Alta: "#E8A090", Média: "#C8A96E", Baixa: "#A8C5A0" };

const Avatar = ({ user, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: user?.color || "#C8A96E", color: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{user?.avatar || "?"}</div>
);
const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono',monospace", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</span>
);
const DaysLeft = ({ date }) => {
  const d = daysUntil(date);
  const c = d <= 7 ? "#E07070" : d <= 14 ? "#C8A96E" : "#A8C5A0";
  return <span style={{ color: c, fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{d <= 0 ? "VENCIDO" : d === 1 ? "amanhã" : `${d}d`}</span>;
};

const WorkflowTracker = ({ caseType, currentStep, onStepChange }) => {
  const config = CASE_TYPES[caseType];
  if (!config) return null;
  const pct = Math.round(((currentStep + 1) / config.steps.length) * 100);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{config.icon}</span>
        <h3 style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Workflow — {caseType}</h3>
        <span style={{ marginLeft: "auto", fontSize: 12, color: config.color, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{pct}% concluído</span>
      </div>
      <div style={{ height: 4, background: "#2A2218", borderRadius: 2, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", background: config.color, width: `${pct}%`, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {config.steps.map((step, i) => {
          const done = i < currentStep, active = i === currentStep;
          return (
            <div key={i} onClick={() => onStepChange(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: active ? config.color + "18" : "transparent", border: active ? `1px solid ${config.color}44` : "1px solid transparent", transition: "all 0.15s" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#A8C5A020" : active ? config.color + "33" : "#1E1A16", border: `2px solid ${done ? "#A8C5A0" : active ? config.color : "#2A2218"}`, fontSize: 10, color: done ? "#A8C5A0" : active ? config.color : "#4A3E32" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 13, color: active ? "#E8E0D5" : done ? "#4A4038" : "#8A7E72", textDecoration: done ? "line-through" : "none", flex: 1 }}>{step}</span>
              {active && <span style={{ fontSize: 10, color: config.color, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>ATUAL</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TransferModal = ({ c, users, onTransfer, onClose }) => {
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const attorneys = users.filter(u => u.is_attorney && u.id !== c.attorney_id);
  const si = { background: "#0F0D0A", border: "1px solid #2A2218", borderRadius: 8, padding: "10px 14px", color: "#E8E0D5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0806ee", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1A1410", border: "1px solid #3A3028", borderRadius: 16, padding: 28, width: 440 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>Transferir Caso</h2>
        <p style={{ margin: "0 0 22px", color: "#6A5E52", fontSize: 13 }}>{c.client_name} · {c.case_type}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "#6A5E52", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Transferir para *</label>
            <select style={si} value={targetId} onChange={e => setTargetId(e.target.value)}>
              <option value="">Selecionar advogado...</option>
              {attorneys.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#6A5E52", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Motivo *</label>
            <textarea style={{ ...si, minHeight: 80, resize: "vertical" }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Conflito de agenda, especialização, férias..." />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ flex: 1, background: "#C8A96E", color: "#0F0D0A", border: "none", borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onClick={() => targetId && reason && onTransfer(Number(targetId), reason)}>Confirmar</button>
            <button style={{ flex: 1, background: "transparent", color: "#C8A96E", border: "1px solid #C8A96E44", borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [filterAtty, setFilterAtty] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskInput, setTaskInput] = useState({ title: "", assigned_to: 1, due_date: "" });
  const [saving, setSaving] = useState(false);
  const [newCase, setNewCase] = useState({ client_name: "", case_type: "EB-2 NIW", attorney_id: 1, deadline: "", priority: "Média", hearing_date: "" });

  // ── LOAD DATA FROM SUPABASE ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [u, c, t, n] = await Promise.all([
      supabase.from("users").select("*").order("id"),
      supabase.from("cases").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date"),
      supabase.from("notes").select("*").order("created_at"),
    ]);
    if (u.data) setUsers(u.data);
    if (c.data) setCases(c.data);
    if (t.data) setTasks(t.data);
    if (n.data) setNotes(n.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const caseTasks = (caseId) => tasks.filter(t => t.case_id === caseId);
  const caseNotes = (caseId) => notes.filter(n => n.case_id === caseId);
  const pendingTasks = tasks.filter(t => !t.done).map(t => ({ ...t, clientName: cases.find(c => c.id === t.case_id)?.client_name, priority: cases.find(c => c.id === t.case_id)?.priority }));
  const urgentCases = cases.filter(c => c.deadline && daysUntil(c.deadline) <= 14 && !["Aprovado","Arquivado"].includes(c.status));
  const hearings = cases.filter(c => c.hearing_date).sort((a,b) => new Date(a.hearing_date)-new Date(b.hearing_date));
  const tasksByUser = users.map(u => ({ user: u, tasks: pendingTasks.filter(t => t.assigned_to === u.id) }));
  const filteredCases = cases.filter(c => (!filterAtty || c.attorney_id === filterAtty) && (!filterStatus || c.status === filterStatus));

  const openCase = (id) => { setSelectedCaseId(id); setView("case"); setShowAddTask(false); };

  // ── SUPABASE MUTATIONS ──────────────────────────────────────────────────────
  const addNote = async (caseId) => {
    if (!newNote.trim()) return;
    const d = new Date().toLocaleDateString("pt-BR");
    const content = `[${d}] ${newNote}`;
    await supabase.from("notes").insert({ case_id: caseId, content, created_by: users[0]?.id });
    setNewNote("");
    loadAll();
  };

  const toggleTask = async (taskId, current) => {
    await supabase.from("tasks").update({ done: !current }).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !current } : t));
  };

  const addTask = async (caseId) => {
    if (!taskInput.title || !taskInput.due_date) return;
    setSaving(true);
    await supabase.from("tasks").insert({ case_id: caseId, title: taskInput.title, assigned_to: Number(taskInput.assigned_to), done: false, due_date: taskInput.due_date });
    setTaskInput({ title: "", assigned_to: 1, due_date: "" });
    setShowAddTask(false);
    setSaving(false);
    loadAll();
  };

  const updateCaseField = async (caseId, patch) => {
    await supabase.from("cases").update(patch).eq("id", caseId);
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, ...patch } : c));
  };

  const handleTransfer = async (toId, reason) => {
    if (!selectedCase) return;
    const from = users.find(u => u.id === selectedCase.attorney_id);
    const to = users.find(u => u.id === toId);
    const d = new Date().toLocaleDateString("pt-BR");
    const content = `[${d}] ⇄ Caso transferido de ${from.name} para ${to.name}. Motivo: ${reason}`;
    await supabase.from("cases").update({ attorney_id: toId }).eq("id", selectedCase.id);
    await supabase.from("transfers").insert({ case_id: selectedCase.id, from_attorney: selectedCase.attorney_id, to_attorney: toId, reason });
    await supabase.from("notes").insert({ case_id: selectedCase.id, content, created_by: users[0]?.id });
    setShowTransfer(false);
    loadAll();
  };

  const addNewCase = async () => {
    if (!newCase.client_name || !newCase.deadline) return;
    setSaving(true);
    const id = `C-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, "0")}`;
    await supabase.from("cases").insert({ id, client_name: newCase.client_name, case_type: newCase.case_type, attorney_id: Number(newCase.attorney_id), status: "Em Andamento", priority: newCase.priority, deadline: newCase.deadline, hearing_date: newCase.hearing_date || null, current_step: 0 });
    await supabase.from("notes").insert({ case_id: id, content: `[${new Date().toLocaleDateString("pt-BR")}] Caso criado.`, created_by: users[0]?.id });
    setShowNewCase(false);
    setNewCase({ client_name: "", case_type: "EB-2 NIW", attorney_id: 1, deadline: "", priority: "Média", hearing_date: "" });
    setSaving(false);
    loadAll();
  };

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const S = {
    app: { minHeight: "100vh", background: "#0F0D0A", fontFamily: "'DM Sans',sans-serif", color: "#E8E0D5" },
    sidebar: { position: "fixed", top: 0, left: 0, width: 220, height: "100vh", background: "#1A1410", borderRight: "1px solid #2A2218", display: "flex", flexDirection: "column", padding: "24px 0", zIndex: 100 },
    main: { marginLeft: 220, padding: "32px 40px", minHeight: "100vh" },
    card: { background: "#1A1410", border: "1px solid #2A2218", borderRadius: 12, padding: 24 },
    inp: { background: "#0F0D0A", border: "1px solid #2A2218", borderRadius: 8, padding: "10px 14px", color: "#E8E0D5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
    btn: { background: "#C8A96E", color: "#0F0D0A", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
    ghost: { background: "transparent", color: "#C8A96E", border: "1px solid #C8A96E44", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
    th: { textAlign: "left", padding: "11px 14px", color: "#6A5E52", fontSize: 11, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid #2A2218" },
    td: { padding: "12px 14px", borderBottom: "1px solid #1E1A16", fontSize: 13, verticalAlign: "middle" },
    nav: (a) => ({ padding: "10px 20px", cursor: "pointer", background: a ? "#C8A96E18" : "transparent", borderLeft: a ? "3px solid #C8A96E" : "3px solid transparent", color: a ? "#C8A96E" : "#8A7E72", fontSize: 14, fontWeight: a ? 600 : 400, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }),
    lbl: { fontSize: 11, color: "#6A5E52", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" },
  };

  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#C8A96E", letterSpacing: "0.3em" }}>IMMIGRATIONOS</div>
      <div style={{ color: "#6A5E52", fontSize: 13 }}>Carregando dados...</div>
    </div>
  );

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#6A5E52", margin: "4px 0 0", fontSize: 13 }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button style={S.btn} onClick={() => setShowNewCase(true)}>+ Novo Processo</button>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Casos Ativos", val: cases.filter(c => c.status === "Em Andamento").length, color: "#C8A96E" },
          { label: "Tarefas Pendentes", val: pendingTasks.length, color: "#7EAED4" },
          { label: "Prazos ≤ 14d", val: urgentCases.length, color: "#E07070" },
          { label: "Audiências", val: hearings.length, color: "#A8C5A0" },
          { label: "Total de Casos", val: cases.length, color: "#6A5E52" },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, flex: 1, padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "'DM Mono',monospace" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#6A5E52", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <div style={S.card}>
          <h3 style={{ margin: "0 0 18px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Tarefas por Membro da Equipe</h3>
          {tasksByUser.map(({ user, tasks: ut }) => (
            <div key={user.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <Avatar user={user} size={24} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
                <Badge label={user.role} color="#4A3E32" />
                <span style={{ marginLeft: "auto", fontFamily: "'DM Mono',monospace", fontSize: 12, color: ut.length > 0 ? "#C8A96E" : "#3A3028" }}>{ut.length} pend.</span>
              </div>
              {ut.slice(0, 3).map(t => (
                <div key={t.id} onClick={() => openCase(t.case_id)} style={{ background: "#0F0D0A", borderRadius: 6, padding: "7px 10px", marginBottom: 3, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: priorityColors[t.priority] || "#C8A96E", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1, color: "#C0B8B0" }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: "#4A3E32" }}>{t.clientName}</span>
                  {t.due_date && <DaysLeft date={t.due_date} />}
                </div>
              ))}
              {ut.length > 3 && <div style={{ fontSize: 11, color: "#4A3E32", paddingLeft: 10 }}>+{ut.length - 3} mais</div>}
              {ut.length === 0 && <div style={{ fontSize: 12, color: "#2A2218", padding: "3px 10px" }}>Sem tarefas ✓</div>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>⚠️ Prazos Urgentes</h3>
            {urgentCases.length === 0 && <p style={{ color: "#3A3028", fontSize: 13 }}>Nenhum prazo urgente ✓</p>}
            {urgentCases.map(c => {
              const atty = users.find(u => u.id === c.attorney_id);
              return (
                <div key={c.id} onClick={() => openCase(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #2A2218", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.client_name}</div>
                    <div style={{ fontSize: 11, color: "#6A5E52" }}>{CASE_TYPES[c.case_type]?.icon} {c.case_type} · {atty?.name.split(" ")[0]}</div>
                  </div>
                  <DaysLeft date={c.deadline} />
                </div>
              );
            })}
          </div>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>🏛️ Audiências</h3>
            {hearings.length === 0 && <p style={{ color: "#3A3028", fontSize: 13 }}>Nenhuma audiência agendada.</p>}
            {hearings.map(c => (
              <div key={c.id} onClick={() => openCase(c.id)} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #2A2218", cursor: "pointer" }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.client_name}</div><div style={{ fontSize: 11, color: "#6A5E52" }}>{c.case_type}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#A8C5A0", fontFamily: "'DM Mono',monospace" }}>{fmtDate(c.hearing_date)}</div>
                  <DaysLeft date={c.hearing_date} />
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>📊 Por Tipo</h3>
            {Object.entries(cases.reduce((a, c) => { a[c.case_type] = (a[c.case_type] || 0) + 1; return a; }, {})).sort((a,b)=>b[1]-a[1]).map(([type, count]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <span style={{ fontSize: 13 }}>{CASE_TYPES[type]?.icon || "📁"}</span>
                <span style={{ fontSize: 12, flex: 1, color: "#A8A098" }}>{type}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: CASE_TYPES[type]?.color || "#C8A96E" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── CASES LIST ──────────────────────────────────────────────────────────────
  const CasesList = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Processos <span style={{ fontSize: 15, color: "#6A5E52", fontWeight: 400 }}>({filteredCases.length})</span></h1>
        <button style={S.btn} onClick={() => setShowNewCase(true)}>+ Novo Processo</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#6A5E52", textTransform: "uppercase", letterSpacing: "0.08em" }}>Advogado:</span>
        <button style={{ ...S.ghost, ...(filterAtty === null ? { background: "#C8A96E22" } : {}), padding: "5px 11px", fontSize: 12 }} onClick={() => setFilterAtty(null)}>Todos</button>
        {users.filter(u => u.is_attorney).map(u => (
          <button key={u.id} style={{ ...S.ghost, ...(filterAtty === u.id ? { background: "#C8A96E22" } : {}), padding: "5px 11px", fontSize: 12 }} onClick={() => setFilterAtty(filterAtty === u.id ? null : u.id)}>{u.name.split(" ").slice(-1)[0]}</button>
        ))}
        <div style={{ width: 1, height: 18, background: "#2A2218" }} />
        <span style={{ fontSize: 11, color: "#6A5E52", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status:</span>
        {["Em Andamento","Aguardando Cliente","Em Revisão","Aprovado"].map(s => (
          <button key={s} style={{ ...S.ghost, ...(filterStatus === s ? { background: "#C8A96E22" } : {}), padding: "5px 11px", fontSize: 12 }} onClick={() => setFilterStatus(filterStatus === s ? null : s)}>{s}</button>
        ))}
      </div>
      <div style={S.card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["ID","Cliente","Tipo","Advogado","Status","Prior.","Prazo","Progresso","Tarefas"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filteredCases.map(c => {
              const atty = users.find(u => u.id === c.attorney_id);
              const cfg = CASE_TYPES[c.case_type];
              const pending = caseTasks(c.id).filter(t => !t.done).length;
              const pct = Math.round(((c.current_step + 1) / (cfg?.steps.length || 1)) * 100);
              return (
                <tr key={c.id} onClick={() => openCase(c.id)} style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#1E1A16"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...S.td, fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#6A5E52" }}>{c.id}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{c.client_name}</td>
                  <td style={S.td}><span style={{ display: "flex", alignItems: "center", gap: 5 }}><span>{cfg?.icon}</span><span style={{ fontSize: 12 }}>{c.case_type}</span></span></td>
                  <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={atty} size={20} /><span style={{ fontSize: 12 }}>{atty?.name.split(" ").slice(-1)[0]}</span></div></td>
                  <td style={S.td}><Badge label={c.status} color={statusColors[c.status] || "#C8A96E"} /></td>
                  <td style={S.td}><Badge label={c.priority} color={priorityColors[c.priority]} /></td>
                  <td style={S.td}>{c.deadline ? <><div style={{ fontSize: 11, color: "#6A5E52" }}>{fmtDate(c.deadline)}</div><DaysLeft date={c.deadline} /></> : "—"}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 48, height: 4, background: "#2A2218", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: cfg?.color || "#C8A96E", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#6A5E52" }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, fontFamily: "'DM Mono',monospace" }}><span style={{ color: pending > 0 ? "#C8A96E" : "#A8C5A0" }}>{pending}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── CASE DETAIL ─────────────────────────────────────────────────────────────
  const CaseDetail = ({ c }) => {
    const atty = users.find(u => u.id === c.attorney_id);
    const cfg = CASE_TYPES[c.case_type];
    const ct = caseTasks(c.id);
    const cn = caseNotes(c.id);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
          <button style={S.ghost} onClick={() => setView("cases")}>← Voltar</button>
          <span style={{ fontSize: 20 }}>{cfg?.icon}</span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{c.client_name}</h1>
          <Badge label={c.id} color="#4A3E32" />
          <Badge label={c.case_type} color={cfg?.color || "#C8A96E"} />
          <Badge label={c.status} color={statusColors[c.status] || "#C8A96E"} />
          <Badge label={c.priority} color={priorityColors[c.priority]} />
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <select style={{ ...S.inp, width: "auto", fontSize: 12, padding: "7px 10px" }} value={c.status} onChange={e => updateCaseField(c.id, { status: e.target.value })}>
              {["Em Andamento","Aguardando Cliente","Em Revisão","Aprovado","Arquivado"].map(s => <option key={s}>{s}</option>)}
            </select>
            <button style={{ ...S.ghost, fontSize: 12, padding: "7px 14px", borderColor: "#B08FD444", color: "#B08FD4" }} onClick={() => setShowTransfer(true)}>⇄ Transferir</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Informações</h3>
            {[
              ["Advogado", <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar user={atty} size={20} /><span>{atty?.name}</span></div>],
              ["Prazo", c.deadline ? <><span style={{ fontSize: 12 }}>{fmtDate(c.deadline)}</span>  <DaysLeft date={c.deadline} /></> : "—"],
              ["Audiência", c.hearing_date ? <><span style={{ fontSize: 12 }}>{fmtDate(c.hearing_date)}</span>  <DaysLeft date={c.hearing_date} /></> : "—"],
              ["Aberto em", fmtDate(c.created_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1E1A16", fontSize: 13 }}>
                <span style={{ color: "#6A5E52" }}>{k}</span><span>{v}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Notas & Histórico</h3>
            <div style={{ maxHeight: 170, overflowY: "auto", marginBottom: 10 }}>
              {[...cn].reverse().map((n, i) => (
                <div key={i} style={{ fontSize: 12, padding: "7px 10px", background: "#0F0D0A", borderRadius: 6, marginBottom: 4, lineHeight: 1.5, color: n.content.includes("transferido") ? "#B08FD4" : "#B8B0A8" }}>{n.content}</div>
              ))}
              {cn.length === 0 && <p style={{ color: "#4A3E32", fontSize: 13 }}>Nenhuma nota.</p>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={S.inp} placeholder="Adicionar nota..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(c.id)} />
              <button style={S.btn} onClick={() => addNote(c.id)}>+</button>
            </div>
          </div>
        </div>
        <div style={{ ...S.card, marginBottom: 18 }}>
          <WorkflowTracker caseType={c.case_type} currentStep={c.current_step || 0} onStepChange={(step) => updateCaseField(c.id, { current_step: step })} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={{ ...S.ghost, fontSize: 12 }} disabled={c.current_step === 0} onClick={() => updateCaseField(c.id, { current_step: Math.max(0, c.current_step - 1) })}>← Anterior</button>
            <button style={{ ...S.btn, fontSize: 12 }} disabled={(c.current_step || 0) >= (CASE_TYPES[c.case_type]?.steps.length - 1)} onClick={() => updateCaseField(c.id, { current_step: Math.min(CASE_TYPES[c.case_type].steps.length - 1, (c.current_step || 0) + 1) })}>Próxima Etapa →</button>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Tarefas ({ct.filter(t=>!t.done).length} pendentes)</h3>
            <button style={{ ...S.ghost, fontSize: 12, padding: "6px 12px" }} onClick={() => setShowAddTask(!showAddTask)}>+ Tarefa</button>
          </div>
          {showAddTask && (
            <div style={{ background: "#0F0D0A", borderRadius: 8, padding: 12, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...S.inp, flex: 2, minWidth: 180 }} placeholder="Título..." value={taskInput.title} onChange={e => setTaskInput(p => ({ ...p, title: e.target.value }))} />
              <select style={{ ...S.inp, flex: 1, minWidth: 130 }} value={taskInput.assigned_to} onChange={e => setTaskInput(p => ({ ...p, assigned_to: e.target.value }))}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
              </select>
              <input type="date" style={{ ...S.inp, flex: 1, minWidth: 130 }} value={taskInput.due_date} onChange={e => setTaskInput(p => ({ ...p, due_date: e.target.value }))} />
              <button style={S.btn} onClick={() => addTask(c.id)} disabled={saving}>{saving ? "..." : "Salvar"}</button>
            </div>
          )}
          {ct.length === 0 && !showAddTask && <p style={{ color: "#4A3E32", fontSize: 13 }}>Nenhuma tarefa ainda.</p>}
          {ct.map(task => {
            const tu = users.find(u => u.id === task.assigned_to);
            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1E1A16", opacity: task.done ? 0.4 : 1 }}>
                <div onClick={() => toggleTask(task.id, task.done)} style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${task.done ? "#A8C5A0" : "#2A2218"}`, background: task.done ? "#A8C5A020" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {task.done && <span style={{ color: "#A8C5A0", fontSize: 11 }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: 13, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={tu} size={20} /><span style={{ fontSize: 12, color: "#8A7E72" }}>{tu?.name.split(" ")[0]}</span></div>
                {task.due_date && <DaysLeft date={task.due_date} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── NEW CASE MODAL ──────────────────────────────────────────────────────────
  const NewCaseModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "#0A0806ee", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...S.card, width: 520, border: "1px solid #3A3028", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>Novo Processo</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div><label style={S.lbl}>Nome do Cliente *</label><input style={S.inp} value={newCase.client_name} onChange={e => setNewCase(p => ({ ...p, client_name: e.target.value }))} placeholder="Nome completo" /></div>
          <div><label style={S.lbl}>Tipo de Processo *</label>
            <select style={S.inp} value={newCase.case_type} onChange={e => setNewCase(p => ({ ...p, case_type: e.target.value }))}>
              {CASE_TYPE_NAMES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><label style={S.lbl}>Advogado Responsável</label>
              <select style={S.inp} value={newCase.attorney_id} onChange={e => setNewCase(p => ({ ...p, attorney_id: e.target.value }))}>
                {users.filter(u => u.is_attorney).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}><label style={S.lbl}>Prioridade</label>
              <select style={S.inp} value={newCase.priority} onChange={e => setNewCase(p => ({ ...p, priority: e.target.value }))}>
                {["Urgente","Alta","Média","Baixa"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><label style={S.lbl}>Prazo Final *</label><input type="date" style={S.inp} value={newCase.deadline} onChange={e => setNewCase(p => ({ ...p, deadline: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><label style={S.lbl}>Data Audiência</label><input type="date" style={S.inp} value={newCase.hearing_date} onChange={e => setNewCase(p => ({ ...p, hearing_date: e.target.value }))} /></div>
          </div>
          {newCase.case_type && CASE_TYPES[newCase.case_type] && (
            <div style={{ background: "#0F0D0A", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#6A5E52", marginBottom: 4, letterSpacing: "0.08em" }}>WORKFLOW AUTOMÁTICO — {CASE_TYPES[newCase.case_type].steps.length} ETAPAS</div>
              <div style={{ fontSize: 12, color: "#6A5E52" }}>Começa em: {CASE_TYPES[newCase.case_type].steps[0]}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button style={{ ...S.btn, flex: 1 }} onClick={addNewCase} disabled={saving}>{saving ? "Salvando..." : "Criar Processo"}</button>
            <button style={{ ...S.ghost, flex: 1 }} onClick={() => setShowNewCase(false)}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );

  const isCase = view === "case";
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={S.sidebar}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #2A2218", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#C8A96E", letterSpacing: "0.2em", textTransform: "uppercase" }}>ImmigrationOS</div>
          <div style={{ fontSize: 11, color: "#4A3E32", marginTop: 2 }}>Case Management</div>
        </div>
        {[{ id: "dashboard", icon: "◈", label: "Dashboard" }, { id: "cases", icon: "◉", label: "Processos", count: cases.length }].map(item => (
          <div key={item.id} style={S.nav(view === item.id || (isCase && item.id === "cases"))} onClick={() => setView(item.id)}>
            <span style={{ fontFamily: "'DM Mono',monospace" }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.count !== undefined && <span style={{ marginLeft: "auto", background: "#2A2218", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{item.count}</span>}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 20px", borderTop: "1px solid #2A2218" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {users[0] && <><Avatar user={users[0]} size={28} />
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>{users[0].name}</div><div style={{ fontSize: 10, color: "#6A5E52" }}>{users[0].role}</div></div></>}
          </div>
        </div>
      </div>
      <div style={S.main}>
        {view === "dashboard" && <Dashboard />}
        {view === "cases" && <CasesList />}
        {isCase && selectedCase && <CaseDetail c={cases.find(c => c.id === selectedCase.id)} />}
      </div>
      {showNewCase && <NewCaseModal />}
      {showTransfer && selectedCase && <TransferModal c={selectedCase} users={users} onTransfer={handleTransfer} onClose={() => setShowTransfer(false)} />}
    </div>
  );
}
