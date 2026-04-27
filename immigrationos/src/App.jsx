import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const CASE_TYPES = {
  "Defesa de Remoção": { icon: "⚖️", color: "#E07070", steps: ["Consulta inicial e avaliação do caso","Revisão do Notice to Appear (NTA)","Cadastro no EOIR e agendamento","Identificar defesas disponíveis","Preparar Master Hearing","Coletar evidências e documentos","Preparar testemunhas","Individual Hearing - apresentação","Decisão do juiz","Recurso (se necessário)"] },
  "Asilo": { icon: "🛡️", color: "#E8A090", steps: ["Consulta inicial - avaliação de elegibilidade","Entrevista aprofundada com cliente","Preparar formulário I-589","Coletar evidências de perseguição","Reunir documentos de apoio","Protocolar I-589 (dentro de 1 ano)","Aguardar agendamento de entrevista","Preparar cliente para entrevista","Entrevista no USCIS / Corte","Decisão - aprovação ou negação","Recurso ao BIA (se necessário)"] },
  "Cancellation of Removal": { icon: "🔄", color: "#E8C490", steps: ["Avaliar elegibilidade","Documentar presença contínua de 10 anos","Reunir evidências de hardship","Preparar declarações de familiares","Protocolar resposta ao NTA","Preparar Motion para cancelamento","Individual Hearing","Decisão do juiz"] },
  "VAWA": { icon: "🌸", color: "#D4A0C8", steps: ["Consulta confidencial","Documentar abuso","Preparar declaração pessoal","Preparar formulário I-360","Protocolar I-360","Aguardar aprovação","Protocolar I-485","Entrevista USCIS","Aprovação do Green Card"] },
  "Visto U": { icon: "🔵", color: "#7EAED4", steps: ["Verificar elegibilidade","Obter certificação policial (I-918B)","Preparar I-918","Documentar crime e danos","Preparar declaração pessoal","Protocolar I-918","Aguardar aprovação","Aprovação visto U","Após 3 anos - Green Card"] },
  "Visto T": { icon: "🔷", color: "#7EBAD4", steps: ["Identificar vítima de tráfico","Contatar autoridades","Preparar I-914","Certificação (I-914B)","Documentar tráfico","Protocolar I-914","Aguardar decisão","Aprovação Visto T","Após 3 anos - Green Card"] },
  "Petição Familiar": { icon: "👨‍👩‍👧", color: "#A8C5A0", steps: ["Determinar categoria","Preparar I-130","Reunir documentos","Protocolar I-130","Aguardar aprovação","Verificar Visa Bulletin","Submeter ao NVC","Preparar DS-260","Entrevista consular","Emissão do visto","Entrada nos EUA"] },
  "Remoção de Condições": { icon: "💚", color: "#90C890", steps: ["Verificar prazo","Preparar I-751","Reunir evidências de casamento","Declaração conjunta","Protocolar I-751","Aguardar RFE","Entrevista USCIS","Aprovação Green Card permanente"] },
  "Reentry Permit / SB-1": { icon: "✈️", color: "#C8D4A0", steps: ["Avaliar situação","Determinar documento","Preparar I-131 ou DS-117","Reunir justificativas","Protocolar","Agendar entrevista","Aprovação"] },
  "EB-1": { icon: "⭐", color: "#D4C86E", steps: ["Avaliar elegibilidade","Mapear evidências","Coletar prêmios e publicações","Reunir cartas de especialistas","Preparar I-140","Protocolar I-140","Responder RFE","Aprovação I-140","Verificar Visa Bulletin","Protocolar I-485","Entrevista USCIS","Aprovação Green Card"] },
  "EB-2 NIW": { icon: "🎓", color: "#C8A96E", steps: ["Avaliar elegibilidade NIW","Definir endeavor nacional","Coletar evidências","Análise Dhanasar","Reunir cartas de especialistas","Preparar I-140","Protocolar I-140","Responder RFE","Aprovação I-140","Verificar Visa Bulletin","Protocolar I-485","Aprovação Green Card"] },
  "EB-3": { icon: "👷", color: "#B8A96E", steps: ["Verificar elegibilidade","Employer confirma vaga","Completar PERM","Aprovação PERM","Preparar I-140","Protocolar I-140","Aguardar Visa Bulletin","Protocolar I-485","Entrevista USCIS","Aprovação Green Card"] },
  "PERM": { icon: "📋", color: "#D4A870", steps: ["Requisitos mínimos do cargo","Prevailing wage (PWD)","Recrutamento obrigatório","Documentar entrevistas","Preparar ETA-9089","Protocolar no DOL","Aguardar processamento","Auditoria DOL","Aprovação PERM"] },
  "Visto O": { icon: "🏆", color: "#D4B86E", steps: ["Avaliar elegibilidade","Definir atividades","Carta do agente","Reunir evidências","Consulta de organização","Preparar I-129","Protocolar I-129","Aprovação e visto"] },
  "Visto L-1": { icon: "🏢", color: "#A090D4", steps: ["Verificar elegibilidade","Documentar relação entre empresas","Confirmar 1 ano de emprego","Preparar I-129","Reunir evidências","Protocolar I-129","Aprovação e visto","Extensão"] },
  "Visto H-1B": { icon: "💼", color: "#9090D4", steps: ["Verificar elegibilidade","Confirmar Prevailing Wage","Obter LCA","Registrar no lottery","Aguardar seleção","Preparar I-129","Protocolar I-129","Aprovação e visto"] },
  "Visto E-2": { icon: "💰", color: "#80C8A0", steps: ["Verificar país do tratado","Avaliar investimento","Estruturar empresa","Preparar business plan","Documentar investimento","Preparar DS-160","Entrevista consular","Aprovação E-2","Renovação"] },
  "Visto E-1": { icon: "🚢", color: "#70B8A0", steps: ["Verificar país do tratado","Documentar comércio","Confirmar 50% comércio","Preparar DS-160","Reunir evidências","Entrevista consular","Aprovação E-1","Renovação"] },
  "Cidadania Americana": { icon: "🇺🇸", color: "#C8A0A0", steps: ["Verificar elegibilidade","Verificar ausências","Verificar bom caráter","Preparar N-400","Reunir documentos","Protocolar N-400","Biometria","Entrevista","Teste inglês e civismo","Cerimônia"] },
  "Mudança de Status F-1": { icon: "🎒", color: "#A8C8D4", steps: ["Obter I-20","Verificar status atual","Preparar I-539","Documentos financeiros","Documentos da instituição","Protocolar I-539","Aguardar aprovação","Aprovação"] },
  "Extensão I-94": { icon: "📅", color: "#C8D4A8", steps: ["Verificar expiração","Identificar categoria","Preparar I-539 ou I-129","Reunir documentos","Protocolar","Aguardar aprovação","Atualizar I-94"] },
};

const CASE_TYPE_NAMES = Object.keys(CASE_TYPES);
const TODAY = new Date();
const daysUntil = (d) => Math.ceil((new Date(d) - TODAY) / 86400000);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const statusColors = { "Em Andamento": "#C8A96E", "Aguardando Cliente": "#7EAED4", "Aprovado": "#A8C5A0", "Em Revisão": "#E8A090", "Arquivado": "#6A5E52" };
const priorityColors = { Urgente: "#E07070", Alta: "#E8A090", Média: "#C8A96E", Baixa: "#A8C5A0" };

const inp = { background: "#0F0D0A", border: "1px solid #3A3028", borderRadius: 8, padding: "10px 14px", color: "#E8E0D5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };
const btn = { background: "#C8A96E", color: "#0F0D0A", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
const ghost = { background: "transparent", color: "#C8A96E", border: "1px solid #C8A96E44", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" };
const lbl = { fontSize: 11, color: "#6A5E52", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" };

const Avatar = ({ user, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: user?.color || "#C8A96E", color: "#1A1410", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>{user?.avatar || "?"}</div>
);
const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: "monospace", whiteSpace: "nowrap" }}>{label}</span>
);
const DaysLeft = ({ date }) => {
  if (!date) return null;
  const d = daysUntil(date);
  const c = d <= 7 ? "#E07070" : d <= 14 ? "#C8A96E" : "#A8C5A0";
  return <span style={{ color: c, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{d <= 0 ? "VENCIDO" : d === 1 ? "amanhã" : `${d}d`}</span>;
};

// ── WORKFLOW ──────────────────────────────────────────────────────────────────
function WorkflowTracker({ caseType, currentStep, onStepChange }) {
  const config = CASE_TYPES[caseType];
  if (!config) return null;
  const pct = Math.round(((currentStep + 1) / config.steps.length) * 100);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{config.icon}</span>
        <strong style={{ fontSize: 13, color: "#6A5E52", textTransform: "uppercase", letterSpacing: "0.08em" }}>{caseType}</strong>
        <span style={{ marginLeft: "auto", fontSize: 13, color: config.color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#2A2218", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", background: config.color, width: `${pct}%`, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      {config.steps.map((step, i) => {
        const done = i < currentStep, active = i === currentStep;
        return (
          <div key={i} onClick={() => onStepChange(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: active ? config.color + "18" : "transparent", border: active ? `1px solid ${config.color}44` : "1px solid transparent" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#A8C5A020" : active ? config.color + "33" : "#1E1A16", border: `2px solid ${done ? "#A8C5A0" : active ? config.color : "#2A2218"}`, fontSize: 11, color: done ? "#A8C5A0" : active ? config.color : "#4A3E32" }}>
              {done ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 13, color: active ? "#E8E0D5" : done ? "#4A4038" : "#8A7E72", textDecoration: done ? "line-through" : "none", flex: 1 }}>{step}</span>
            {active && <span style={{ fontSize: 10, color: config.color, fontWeight: 700 }}>ATUAL</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── NEW CASE MODAL — completely standalone so inputs never lose focus ──────────
function NewCaseModal({ users, onSave, onClose }) {
  const [clientName, setClientName] = useState("");
  const [alienNumber, setAlienNumber] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [usEntryDate, setUsEntryDate] = useState("");
  const [eadDate, setEadDate] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [caseType, setCaseType] = useState("EB-2 NIW");
  const [attorneyId, setAttorneyId] = useState("");
  const [priority, setPriority] = useState("Média");
  const [deadline, setDeadline] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const attorneys = users.filter(u => u.is_attorney);

  async function handleSave() {
    if (!clientName.trim()) { setError("Nome do cliente é obrigatório."); return; }
    if (!deadline) { setError("Prazo final é obrigatório."); return; }
    if (!attorneyId) { setError("Selecione um advogado responsável."); return; }
    setError(""); setSaving(true);
    await onSave({ clientName, alienNumber, dob, nationality, passportNumber, usEntryDate, eadDate, address, phone, email, caseType, attorneyId, priority, deadline, hearingDate });
    setSaving(false);
  }

  const row = { display: "flex", gap: 12, marginBottom: 12 };
  const col = { flex: 1 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0806ee", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#1A1410", border: "1px solid #3A3028", borderRadius: 16, padding: 28, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>Novo Processo</h2>
        <p style={{ margin: "0 0 22px", color: "#6A5E52", fontSize: 13 }}>Preencha os dados do processo e do cliente</p>

        <div style={{ fontSize: 11, color: "#C8A96E", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #2A2218" }}>Dados do Processo</div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Tipo de Processo *</label>
          <select value={caseType} onChange={e => setCaseType(e.target.value)} style={inp}>
            {CASE_TYPE_NAMES.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div style={row}>
          <div style={col}>
            <label style={lbl}>Advogado Responsável *</label>
            <select value={attorneyId} onChange={e => setAttorneyId(e.target.value)} style={inp}>
              <option value="">Selecionar...</option>
              {attorneys.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div style={col}>
            <label style={lbl}>Prioridade</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={inp}>
              {["Urgente","Alta","Média","Baixa"].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={row}>
          <div style={col}><label style={lbl}>Prazo Final *</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inp} /></div>
          <div style={col}><label style={lbl}>Data da Audiência</label><input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} style={inp} /></div>
        </div>

        <div style={{ fontSize: 11, color: "#C8A96E", textTransform: "uppercase", letterSpacing: "0.1em", margin: "20px 0 14px", paddingBottom: 8, borderBottom: "1px solid #2A2218" }}>Dados do Cliente</div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Nome Completo *</label>
          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome completo do cliente" style={inp} />
        </div>
        <div style={row}>
          <div style={col}><label style={lbl}>A# (Alien Number)</label><input type="text" value={alienNumber} onChange={e => setAlienNumber(e.target.value)} placeholder="A000-000-000" style={inp} /></div>
          <div style={col}><label style={lbl}>Data de Nascimento</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inp} /></div>
        </div>
        <div style={row}>
          <div style={col}><label style={lbl}>Nacionalidade</label><input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="Ex: Brasil" style={inp} /></div>
          <div style={col}><label style={lbl}>Número do Passaporte</label><input type="text" value={passportNumber} onChange={e => setPassportNumber(e.target.value)} placeholder="Ex: BR123456" style={inp} /></div>
        </div>
        <div style={row}>
          <div style={col}><label style={lbl}>Data de Entrada nos EUA</label><input type="date" value={usEntryDate} onChange={e => setUsEntryDate(e.target.value)} style={inp} /></div>
          <div style={col}><label style={lbl}>Elegibilidade EAD</label><input type="date" value={eadDate} onChange={e => setEadDate(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Endereço Completo</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, cidade, estado, ZIP" style={inp} />
        </div>
        <div style={row}>
          <div style={col}><label style={lbl}>Telefone</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(000) 000-0000" style={inp} /></div>
          <div style={col}><label style={lbl}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" style={inp} /></div>
        </div>

        {CASE_TYPES[caseType] && (
          <div style={{ background: "#0F0D0A", borderRadius: 8, padding: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#6A5E52", marginBottom: 4 }}>WORKFLOW — {CASE_TYPES[caseType].steps.length} ETAPAS AUTOMÁTICAS</div>
            <div style={{ fontSize: 12, color: "#6A5E52" }}>Início: {CASE_TYPES[caseType].steps[0]}</div>
          </div>
        )}

        {error && <div style={{ background: "#E0707022", border: "1px solid #E07070", borderRadius: 8, padding: "10px 14px", color: "#E07070", fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...btn, flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Criar Processo"}</button>
          <button style={{ ...ghost, flex: 1 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── TRANSFER MODAL ────────────────────────────────────────────────────────────
function TransferModal({ c, users, onTransfer, onClose }) {
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const attorneys = users.filter(u => u.is_attorney && u.id !== c.attorney_id);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0A0806ee", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1A1410", border: "1px solid #3A3028", borderRadius: 16, padding: 28, width: 440 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>Transferir Caso</h2>
        <p style={{ margin: "0 0 22px", color: "#6A5E52", fontSize: 13 }}>{c.client_name} · {c.case_type}</p>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Transferir para *</label>
          <select value={targetId} onChange={e => setTargetId(e.target.value)} style={inp}>
            <option value="">Selecionar advogado...</option>
            {attorneys.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Motivo *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Conflito de agenda, especialização..." style={{ ...inp, minHeight: 80, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...btn, flex: 1 }} onClick={() => targetId && reason && onTransfer(Number(targetId), reason)}>Confirmar</button>
          <button style={{ ...ghost, flex: 1 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [filterAtty, setFilterAtty] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  const loadAll = useCallback(async () => {
    setLoading(true); setConnError(null);
    const [u, c, t, n] = await Promise.all([
      supabase.from("users").select("*").order("id"),
      supabase.from("cases").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date"),
      supabase.from("notes").select("*").order("created_at"),
    ]);
    if (u.error) { setConnError(u.error.message); setLoading(false); return; }
    setUsers(u.data || []);
    setCases(c.data || []);
    setTasks(t.data || []);
    setNotes(n.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const sc = cases.find(c => c.id === selectedCaseId);
  const caseTasks = id => tasks.filter(t => t.case_id === id);
  const caseNotes = id => notes.filter(n => n.case_id === id);
  const pending = tasks.filter(t => !t.done).map(t => ({ ...t, clientName: cases.find(c => c.id === t.case_id)?.client_name, priority: cases.find(c => c.id === t.case_id)?.priority }));
  const urgent = cases.filter(c => c.deadline && daysUntil(c.deadline) <= 14 && !["Aprovado","Arquivado"].includes(c.status));
  const hearings = cases.filter(c => c.hearing_date).sort((a,b) => new Date(a.hearing_date)-new Date(b.hearing_date));
  const byUser = users.map(u => ({ user: u, tasks: pending.filter(t => t.assigned_to === u.id) }));
  const filtered = cases.filter(c => (!filterAtty || c.attorney_id === filterAtty) && (!filterStatus || c.status === filterStatus));

  const openCase = id => { setSelectedCaseId(id); setView("case"); setShowAddTask(false); setActiveTab("info"); };

  const addNote = async caseId => {
    if (!noteText.trim()) return;
    const content = `[${new Date().toLocaleDateString("pt-BR")}] ${noteText}`;
    const { error } = await supabase.from("notes").insert({ case_id: caseId, content, created_by: users[0]?.id });
    if (!error) { setNoteText(""); loadAll(); }
    else alert("Erro ao salvar nota: " + error.message);
  };

  const toggleTask = async (taskId, current) => {
    await supabase.from("tasks").update({ done: !current }).eq("id", taskId);
    setTasks(p => p.map(t => t.id === taskId ? { ...t, done: !current } : t));
  };

  const addTask = async caseId => {
    if (!taskTitle.trim() || !taskDue) return;
    const { error } = await supabase.from("tasks").insert({ case_id: caseId, title: taskTitle, assigned_to: Number(taskAssignee || users[0]?.id), done: false, due_date: taskDue });
    if (!error) { setTaskTitle(""); setTaskDue(""); setShowAddTask(false); loadAll(); }
    else alert("Erro: " + error.message);
  };

  const updateCase = async (caseId, patch) => {
    await supabase.from("cases").update(patch).eq("id", caseId);
    setCases(p => p.map(c => c.id === caseId ? { ...c, ...patch } : c));
  };

  const handleTransfer = async (toId, reason) => {
    if (!sc) return;
    const from = users.find(u => u.id === sc.attorney_id);
    const to = users.find(u => u.id === toId);
    const content = `[${new Date().toLocaleDateString("pt-BR")}] ⇄ Transferido de ${from?.name} para ${to?.name}. Motivo: ${reason}`;
    await supabase.from("cases").update({ attorney_id: toId }).eq("id", sc.id);
    await supabase.from("transfers").insert({ case_id: sc.id, from_attorney: sc.attorney_id, to_attorney: toId, reason });
    await supabase.from("notes").insert({ case_id: sc.id, content, created_by: users[0]?.id });
    setShowTransfer(false); loadAll();
  };

  const handleNewCase = async (f) => {
    const id = `C-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, "0")}`;
    const payload = {
      id, client_name: f.clientName.trim(), case_type: f.caseType,
      attorney_id: Number(f.attorneyId), status: "Em Andamento",
      priority: f.priority, deadline: f.deadline,
      hearing_date: f.hearingDate || null, current_step: 0,
      alien_number: f.alienNumber || null, dob: f.dob || null,
      nationality: f.nationality || null, passport_number: f.passportNumber || null,
      us_entry_date: f.usEntryDate || null, ead_eligibility_date: f.eadDate || null,
      address: f.address || null, phone: f.phone || null, email: f.email || null,
    };
    const { error } = await supabase.from("cases").insert(payload);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    await supabase.from("notes").insert({ case_id: id, content: `[${new Date().toLocaleDateString("pt-BR")}] Caso criado.`, created_by: users[0]?.id });
    setShowNewCase(false); loadAll();
  };

  const card = { background: "#1A1410", border: "1px solid #2A2218", borderRadius: 12, padding: 24 };
  const nav = a => ({ padding: "10px 20px", cursor: "pointer", background: a ? "#C8A96E18" : "transparent", borderLeft: a ? "3px solid #C8A96E" : "3px solid transparent", color: a ? "#C8A96E" : "#8A7E72", fontSize: 14, fontWeight: a ? 600 : 400, display: "flex", alignItems: "center", gap: 10 });
  const th = { textAlign: "left", padding: "11px 14px", color: "#6A5E52", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid #2A2218" };
  const td = { padding: "12px 14px", borderBottom: "1px solid #1E1A16", fontSize: 13, verticalAlign: "middle" };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0F0D0A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "sans-serif", color: "#E8E0D5" }}><div style={{ color: "#C8A96E", letterSpacing: "0.3em", fontSize: 12 }}>IMMIGRATIONOS</div><div style={{ color: "#6A5E52" }}>Carregando...</div></div>;
  if (connError) return <div style={{ minHeight: "100vh", background: "#0F0D0A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "sans-serif", color: "#E8E0D5", padding: 40 }}><div style={{ color: "#E07070", fontWeight: 700 }}>Erro de conexão</div><div style={{ color: "#8A7E72", textAlign: "center", fontSize: 13 }}>{connError}</div><button style={btn} onClick={loadAll}>Tentar novamente</button></div>;

  const Dashboard = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <div><h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Dashboard</h1><p style={{ color: "#6A5E52", margin: "4px 0 0", fontSize: 13 }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div>
        <button style={btn} onClick={() => setShowNewCase(true)}>+ Novo Processo</button>
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {[{ label: "Ativos", val: cases.filter(c => c.status === "Em Andamento").length, color: "#C8A96E" },{ label: "Tarefas Pend.", val: pending.length, color: "#7EAED4" },{ label: "Prazos ≤ 14d", val: urgent.length, color: "#E07070" },{ label: "Audiências", val: hearings.length, color: "#A8C5A0" },{ label: "Total", val: cases.length, color: "#6A5E52" }].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, padding: 16 }}><div style={{ fontSize: 30, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.val}</div><div style={{ fontSize: 10, color: "#6A5E52", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div></div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <div style={card}>
          <h3 style={{ margin: "0 0 18px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Tarefas por Membro da Equipe</h3>
          {byUser.map(({ user, tasks: ut }) => (
            <div key={user.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <Avatar user={user} size={24} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
                <Badge label={user.role} color="#4A3E32" />
                <span style={{ marginLeft: "auto", fontSize: 12, color: ut.length > 0 ? "#C8A96E" : "#3A3028" }}>{ut.length} pend.</span>
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
          <div style={card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>⚠️ Prazos Urgentes</h3>
            {urgent.length === 0 && <p style={{ color: "#3A3028", fontSize: 13 }}>Nenhum prazo urgente ✓</p>}
            {urgent.map(c => { const atty = users.find(u => u.id === c.attorney_id); return (
              <div key={c.id} onClick={() => openCase(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #2A2218", cursor: "pointer" }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.client_name}</div><div style={{ fontSize: 11, color: "#6A5E52" }}>{CASE_TYPES[c.case_type]?.icon} {c.case_type} · {atty?.name.split(" ")[0]}</div></div>
                <DaysLeft date={c.deadline} />
              </div>
            );})}
          </div>
          <div style={card}>
            <h3 style={{ margin: "0 0 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>🏛️ Audiências</h3>
            {hearings.length === 0 && <p style={{ color: "#3A3028", fontSize: 13 }}>Nenhuma audiência agendada.</p>}
            {hearings.map(c => (
              <div key={c.id} onClick={() => openCase(c.id)} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #2A2218", cursor: "pointer" }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.client_name}</div><div style={{ fontSize: 11, color: "#6A5E52" }}>{c.case_type}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#A8C5A0", fontFamily: "monospace" }}>{fmtDate(c.hearing_date)}</div><DaysLeft date={c.hearing_date} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const CasesList = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Processos <span style={{ fontSize: 15, color: "#6A5E52", fontWeight: 400 }}>({filtered.length})</span></h1>
        <button style={btn} onClick={() => setShowNewCase(true)}>+ Novo Processo</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <button style={{ ...ghost, ...(filterAtty === null ? { background: "#C8A96E22" } : {}), padding: "5px 11px", fontSize: 12 }} onClick={() => setFilterAtty(null)}>Todos</button>
        {users.filter(u => u.is_attorney).map(u => (
          <button key={u.id} style={{ ...ghost, ...(filterAtty === u.id ? { background: "#C8A96E22" } : {}), padding: "5px 11px", fontSize: 12 }} onClick={() => setFilterAtty(filterAtty === u.id ? null : u.id)}>{u.name.split(" ").slice(-1)[0]}</button>
        ))}
        <div style={{ width: 1, height: 18, background: "#2A2218" }} />
        {["Em Andamento","Aguardando Cliente","Em Revisão","Aprovado"].map(s => (
          <button key={s} style={{ ...ghost, ...(filterStatus === s ? { background: "#C8A96E22" } : {}), padding: "5px 11px", fontSize: 12 }} onClick={() => setFilterStatus(filterStatus === s ? null : s)}>{s}</button>
        ))}
      </div>
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["ID","Cliente","A#","Tipo","Advogado","Status","Prazo","Prog.","Tarefas"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c => {
              const atty = users.find(u => u.id === c.attorney_id);
              const cfg = CASE_TYPES[c.case_type];
              const pend = caseTasks(c.id).filter(t => !t.done).length;
              const pct = Math.round(((c.current_step + 1) / (cfg?.steps.length || 1)) * 100);
              return (
                <tr key={c.id} onClick={() => openCase(c.id)} style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "#1E1A16"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, color: "#6A5E52" }}>{c.id}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{c.client_name}</td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11, color: "#8A7E72" }}>{c.alien_number || "—"}</td>
                  <td style={td}><span style={{ display: "flex", alignItems: "center", gap: 5 }}><span>{cfg?.icon}</span><span style={{ fontSize: 12 }}>{c.case_type}</span></span></td>
                  <td style={td}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={atty} size={20} /><span style={{ fontSize: 12 }}>{atty?.name.split(" ").slice(-1)[0]}</span></div></td>
                  <td style={td}><Badge label={c.status} color={statusColors[c.status] || "#C8A96E"} /></td>
                  <td style={td}>{c.deadline ? <><div style={{ fontSize: 11, color: "#6A5E52" }}>{fmtDate(c.deadline)}</div><DaysLeft date={c.deadline} /></> : "—"}</td>
                  <td style={td}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 44, height: 4, background: "#2A2218", borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: cfg?.color || "#C8A96E", borderRadius: 2 }} /></div><span style={{ fontSize: 10, fontFamily: "monospace", color: "#6A5E52" }}>{pct}%</span></div></td>
                  <td style={{ ...td, fontFamily: "monospace" }}><span style={{ color: pend > 0 ? "#C8A96E" : "#A8C5A0" }}>{pend}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CaseDetail = ({ c }) => {
    const atty = users.find(u => u.id === c.attorney_id);
    const cfg = CASE_TYPES[c.case_type];
    const ct = caseTasks(c.id);
    const cn = caseNotes(c.id);
    const clientFields = [["A# (Alien Number)", c.alien_number],["Data de Nascimento", c.dob ? fmtDate(c.dob) : null],["Nacionalidade", c.nationality],["Passaporte", c.passport_number],["Entrada nos EUA", c.us_entry_date ? fmtDate(c.us_entry_date) : null],["Elegibilidade EAD", c.ead_eligibility_date ? fmtDate(c.ead_eligibility_date) : null],["Endereço", c.address],["Telefone", c.phone],["Email", c.email]].filter(([,v]) => v);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <button style={ghost} onClick={() => setView("cases")}>← Voltar</button>
          <span style={{ fontSize: 20 }}>{cfg?.icon}</span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{c.client_name}</h1>
          <Badge label={c.id} color="#4A3E32" />
          <Badge label={c.case_type} color={cfg?.color || "#C8A96E"} />
          <Badge label={c.status} color={statusColors[c.status] || "#C8A96E"} />
          <Badge label={c.priority} color={priorityColors[c.priority]} />
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <select style={{ ...inp, width: "auto", fontSize: 12, padding: "7px 10px" }} value={c.status} onChange={e => updateCase(c.id, { status: e.target.value })}>
              {["Em Andamento","Aguardando Cliente","Em Revisão","Aprovado","Arquivado"].map(s => <option key={s}>{s}</option>)}
            </select>
            <button style={{ ...ghost, fontSize: 12, padding: "7px 14px", borderColor: "#B08FD444", color: "#B08FD4" }} onClick={() => setShowTransfer(true)}>⇄ Transferir</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {[["info","📋 Processo"],["client","👤 Cliente"],["notes","📝 Notas"],["tasks","✅ Tarefas"],["workflow","🔄 Workflow"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...ghost, fontSize: 12, padding: "7px 14px", ...(activeTab === tab ? { background: "#C8A96E22", borderColor: "#C8A96E" } : {}) }}>{label}</button>
          ))}
        </div>
        {activeTab === "info" && <div style={card}>
          <h3 style={{ margin: "0 0 14px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Informações do Processo</h3>
          {[["Advogado", <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar user={atty} size={20} /><span>{atty?.name}</span></div>],["Prazo", c.deadline ? <><span style={{ fontSize: 12 }}>{fmtDate(c.deadline)}</span> <DaysLeft date={c.deadline} /></> : "—"],["Audiência", c.hearing_date ? <><span style={{ fontSize: 12 }}>{fmtDate(c.hearing_date)}</span> <DaysLeft date={c.hearing_date} /></> : "—"],["Aberto em", fmtDate(c.created_at)]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1E1A16", fontSize: 13 }}><span style={{ color: "#6A5E52" }}>{k}</span><span>{v}</span></div>
          ))}
        </div>}
        {activeTab === "client" && <div style={card}>
          <h3 style={{ margin: "0 0 14px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Dados do Cliente — {c.client_name}</h3>
          {clientFields.length === 0 && <p style={{ color: "#4A3E32", fontSize: 13 }}>Nenhum dado adicional cadastrado.</p>}
          {clientFields.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid #1E1A16", fontSize: 13 }}><span style={{ color: "#6A5E52", flexShrink: 0, marginRight: 12 }}>{k}</span><span style={{ textAlign: "right", wordBreak: "break-all" }}>{v}</span></div>
          ))}
        </div>}
        {activeTab === "notes" && <div style={card}>
          <h3 style={{ margin: "0 0 14px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Notas & Histórico</h3>
          <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 14 }}>
            {[...cn].reverse().map((n, i) => <div key={i} style={{ fontSize: 12, padding: "8px 12px", background: "#0F0D0A", borderRadius: 6, marginBottom: 6, lineHeight: 1.6, color: n.content.includes("Transferido") ? "#B08FD4" : "#B8B0A8" }}>{n.content}</div>)}
            {cn.length === 0 && <p style={{ color: "#4A3E32", fontSize: 13 }}>Nenhuma nota ainda.</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={inp} placeholder="Adicionar nota... (Enter para salvar)" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(c.id)} />
            <button style={btn} onClick={() => addNote(c.id)}>+</button>
          </div>
        </div>}
        {activeTab === "tasks" && <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6A5E52" }}>Tarefas ({ct.filter(t=>!t.done).length} pendentes)</h3>
            <button style={{ ...ghost, fontSize: 12, padding: "6px 12px" }} onClick={() => setShowAddTask(!showAddTask)}>+ Tarefa</button>
          </div>
          {showAddTask && <div style={{ background: "#0F0D0A", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...inp, flex: 2, minWidth: 180 }} placeholder="Título da tarefa..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
              <select style={{ ...inp, flex: 1, minWidth: 130 }} value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                <option value="">Responsável...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
              </select>
              <input type="date" style={{ ...inp, flex: 1, minWidth: 130 }} value={taskDue} onChange={e => setTaskDue(e.target.value)} />
              <button style={btn} onClick={() => addTask(c.id)}>Salvar</button>
            </div>
          </div>}
          {ct.length === 0 && !showAddTask && <p style={{ color: "#4A3E32", fontSize: 13 }}>Nenhuma tarefa ainda.</p>}
          {ct.map(task => { const tu = users.find(u => u.id === task.assigned_to); return (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1E1A16", opacity: task.done ? 0.4 : 1 }}>
              <div onClick={() => toggleTask(task.id, task.done)} style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${task.done ? "#A8C5A0" : "#2A2218"}`, background: task.done ? "#A8C5A020" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {task.done && <span style={{ color: "#A8C5A0", fontSize: 11 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: 13, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar user={tu} size={20} /><span style={{ fontSize: 12, color: "#8A7E72" }}>{tu?.name.split(" ")[0]}</span></div>
              {task.due_date && <DaysLeft date={task.due_date} />}
            </div>
          );})}
        </div>}
        {activeTab === "workflow" && <div style={card}>
          <WorkflowTracker caseType={c.case_type} currentStep={c.current_step || 0} onStepChange={step => updateCase(c.id, { current_step: step })} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={{ ...ghost, fontSize: 12 }} disabled={!c.current_step} onClick={() => updateCase(c.id, { current_step: Math.max(0, c.current_step - 1) })}>← Anterior</button>
            <button style={{ ...btn, fontSize: 12 }} disabled={(c.current_step||0) >= (CASE_TYPES[c.case_type]?.steps.length - 1)} onClick={() => updateCase(c.id, { current_step: Math.min(CASE_TYPES[c.case_type].steps.length - 1, (c.current_step||0) + 1) })}>Próxima Etapa →</button>
          </div>
        </div>}
      </div>
    );
  };

  const isCase = view === "case";
  return (
    <div style={{ minHeight: "100vh", background: "#0F0D0A", fontFamily: "'DM Sans',sans-serif", color: "#E8E0D5" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", top: 0, left: 0, width: 220, height: "100vh", background: "#1A1410", borderRight: "1px solid #2A2218", display: "flex", flexDirection: "column", padding: "24px 0", zIndex: 100 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #2A2218", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: "#C8A96E", letterSpacing: "0.2em", textTransform: "uppercase" }}>ImmigrationOS</div>
          <div style={{ fontSize: 11, color: "#4A3E32", marginTop: 2 }}>Case Management</div>
        </div>
        {[{ id: "dashboard", icon: "◈", label: "Dashboard" }, { id: "cases", icon: "◉", label: "Processos", count: cases.length }].map(item => (
          <div key={item.id} style={nav(view === item.id || (isCase && item.id === "cases"))} onClick={() => setView(item.id)}>
            <span>{item.icon}</span><span>{item.label}</span>
            {item.count !== undefined && <span style={{ marginLeft: "auto", background: "#2A2218", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{item.count}</span>}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 20px", borderTop: "1px solid #2A2218" }}>
          {users[0] && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar user={users[0]} size={28} /><div><div style={{ fontSize: 12, fontWeight: 600 }}>{users[0].name}</div><div style={{ fontSize: 10, color: "#6A5E52" }}>{users[0].role}</div></div></div>}
        </div>
      </div>
      <div style={{ marginLeft: 220, padding: "32px 40px", minHeight: "100vh" }}>
        {view === "dashboard" && <Dashboard />}
        {view === "cases" && <CasesList />}
        {isCase && sc && <CaseDetail c={cases.find(c => c.id === sc.id)} />}
      </div>
      {showNewCase && <NewCaseModal users={users} onSave={handleNewCase} onClose={() => setShowNewCase(false)} />}
      {showTransfer && sc && <TransferModal c={sc} users={users} onTransfer={handleTransfer} onClose={() => setShowTransfer(false)} />}
    </div>
  );
}
