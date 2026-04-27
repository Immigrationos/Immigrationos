import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ── CASE TYPES ────────────────────────────────────────────────────────────────
const CASE_TYPES = {
  "Asilo Afirmativo (USCIS)": { icon: "🛡️", color: "#E8A090", steps: ["Consulta inicial - avaliação de elegibilidade","Entrevista aprofundada com cliente","Preparar formulário I-589","Coletar evidências de perseguição","Reunir documentos de apoio","Protocolar I-589 no USCIS (dentro de 1 ano)","Aguardar agendamento de entrevista","Preparar cliente para entrevista USCIS","Entrevista no Asylum Office","Decisão - aprovação ou referral à corte","Aprovação do Asilo"] },
  "Asilo Defensivo (Corte)": { icon: "⚖️", color: "#E07070", steps: ["Consulta inicial e avaliação","Revisão do NTA","Cadastro no EOIR","Master Hearing - primeira audiência","Coletar evidências de perseguição","Preparar formulário I-589 para corte","Preparar testemunhas","Preparar cliente para Individual Hearing","Individual Hearing - apresentação do caso","Decisão do juiz de imigração","Recurso ao BIA (se necessário)","Recurso ao Circuit Court (se necessário)"] },
  "Defesa de Remoção": { icon: "🔰", color: "#E07070", steps: ["Consulta inicial e avaliação do caso","Revisão do Notice to Appear (NTA)","Cadastro no EOIR e agendamento","Identificar defesas disponíveis","Master Hearing - primeira audiência","Coletar evidências e documentos","Preparar testemunhas","Individual Hearing - apresentação","Decisão do juiz","Recurso ao BIA (se necessário)","Recurso ao Circuit Court (se necessário)"] },
  "Cancellation of Removal": { icon: "🔄", color: "#E8C490", steps: ["Avaliar elegibilidade (10 anos + bom caráter + hardship)","Documentar presença contínua de 10 anos","Reunir evidências de hardship excepcional","Preparar declarações de familiares","Master Hearing","Protocolar Motion para cancelamento","Preparar evidências para Individual Hearing","Individual Hearing","Decisão do juiz"] },
  "Bond Request": { icon: "🔓", color: "#F0C060", steps: ["Avaliar elegibilidade para bond","Coletar documentos de suporte","Preparar Motion for Bond Redetermination","Bond Hearing perante juiz","Decisão do bond","Pagamento e liberação (se aprovado)"] },
  "Habeas Petition": { icon: "📜", color: "#D4A0C8", steps: ["Avaliar cabimento do Habeas Corpus","Pesquisar fundamentos legais","Redigir petição de Habeas Corpus","Protocolar no District Court","Aguardar resposta do governo","Hearing perante District Court","Decisão"] },
  "Appeal ao BIA": { icon: "🏛️", color: "#A090D4", steps: ["Avaliar fundamentos do recurso","Notice of Appeal (dentro de 30 dias)","Solicitar transcrição da audiência","Redigir Brief do recorrente","Protocolar Brief no BIA","Brief de resposta do governo","Decisão do BIA","Recurso ao Circuit Court (se necessário)"] },
  "Motion to BIA": { icon: "📋", color: "#9090D4", steps: ["Identificar fundamento da motion","Redigir Motion (reconsideração ou reabrir)","Protocolar no BIA (dentro do prazo)","Aguardar resposta","Decisão do BIA"] },
  "VAWA": { icon: "🌸", color: "#D4A0C8", steps: ["Consulta confidencial - avaliação de segurança","Documentar abuso (policial, médico, declarações)","Preparar declaração pessoal","Preparar formulário I-360","Protocolar I-360 no VSC","Aguardar aprovação do I-360","Protocolar I-485 (se aplicável)","Entrevista USCIS","Aprovação do Green Card"] },
  "Visto U": { icon: "🔵", color: "#7EAED4", steps: ["Verificar elegibilidade (vítima de crime)","Obter certificação de autoridade policial (I-918B)","Preparar formulário I-918","Documentar o crime e danos sofridos","Preparar declaração pessoal","Protocolar I-918","Aguardar aprovação (fila de espera)","Aprovação e emissão do visto U","Após 3 anos - solicitar Green Card"] },
  "Visto T": { icon: "🔷", color: "#7EBAD4", steps: ["Identificar vítima de tráfico humano","Contatar autoridades se necessário","Preparar formulário I-914","Certificação de autoridade (I-914B)","Documentar tráfico e cooperação","Protocolar I-914","Aguardar decisão USCIS","Aprovação do Visto T","Após 3 anos - Green Card"] },
  "Petição Familiar": { icon: "👨‍👩‍👧", color: "#A8C5A0", steps: ["Determinar categoria de preferência","Preparar formulário I-130","Reunir documentos de relacionamento","Protocolar I-130 no USCIS","Aguardar aprovação do I-130","Verificar prioridade no Visa Bulletin","Submeter ao NVC (caso consular)","Preparar formulário DS-260","Entrevista consular","Emissão do visto imigrante","Entrada nos EUA e Green Card"] },
  "Remoção de Condições": { icon: "💚", color: "#90C890", steps: ["Verificar prazo (90 dias antes do aniversário de 2 anos)","Preparar formulário I-751","Reunir evidências de casamento genuíno","Preparar declaração conjunta","Protocolar I-751","Aguardar RFE (se houver)","Entrevista USCIS (se solicitada)","Aprovação e Green Card permanente"] },
  "Reentry Permit / SB-1": { icon: "✈️", color: "#C8D4A0", steps: ["Avaliar situação (tempo fora dos EUA)","Determinar tipo de documento","Preparar formulário I-131 ou DS-117","Reunir justificativas para ausência","Protocolar pedido","Agendar entrevista (se necessário)","Aprovação"] },
  "EB-1": { icon: "⭐", color: "#D4C86E", steps: ["Avaliar elegibilidade (EB-1A/B/C)","Mapear evidências de extraordinary ability","Coletar prêmios, publicações, citações","Reunir cartas de especialistas","Preparar petição I-140","Protocolar I-140","Responder RFE (se necessário)","Aprovação do I-140","Verificar prioridade (Visa Bulletin)","Protocolar I-485 ou processo consular","Entrevista USCIS","Aprovação Green Card"] },
  "EB-2 NIW": { icon: "🎓", color: "#C8A96E", steps: ["Avaliar elegibilidade NIW (Matter of Dhanasar)","Definir endeavor de importância nacional","Coletar evidências de contribuições","Preparar análise do teste Dhanasar","Reunir cartas de especialistas","Preparar petição I-140","Protocolar I-140","Responder RFE (se necessário)","Aprovação do I-140","Verificar prioridade (Visa Bulletin)","Protocolar I-485 ou processo consular","Aprovação Green Card"] },
  "EB-3": { icon: "👷", color: "#B8A96E", steps: ["Verificar elegibilidade","Employer confirma disponibilidade","Completar processo PERM","Aprovação do PERM","Preparar petição I-140","Protocolar I-140","Aguardar prioridade no Visa Bulletin","Protocolar I-485 ou processo consular","Entrevista USCIS","Aprovação Green Card"] },
  "PERM": { icon: "📋", color: "#D4A870", steps: ["Determinar requisitos mínimos do cargo","Realizar prevailing wage determination (PWD)","Conduzir recrutamento obrigatório (30-60 dias)","Documentar resultado das entrevistas","Preparar formulário ETA-9089","Protocolar no DOL","Aguardar processamento","Auditoria DOL (se solicitada)","Aprovação do PERM"] },
  "Visto O": { icon: "🏆", color: "#D4B86E", steps: ["Avaliar elegibilidade (extraordinary ability)","Definir atividades nos EUA","Obter carta do agente/consultor","Reunir evidências","Obter consulta de organização da área","Preparar petição I-129","Protocolar I-129","Aprovação e emissão do visto"] },
  "Visto L-1": { icon: "🏢", color: "#A090D4", steps: ["Verificar elegibilidade (L-1A/L-1B)","Documentar relação entre empresas","Confirmar 1 ano de emprego nos últimos 3","Preparar petição I-129 + L Supplement","Reunir evidências de cargo","Protocolar I-129","Aprovação e emissão do visto","Extensão (se necessário)"] },
  "Visto H-1B": { icon: "💼", color: "#9090D4", steps: ["Verificar elegibilidade (specialty occupation)","Confirmar Prevailing Wage","Obter LCA","Registrar no H-1B lottery","Aguardar seleção no lottery","Preparar petição I-129","Protocolar I-129","Aprovação e emissão do visto"] },
  "Visto E-2": { icon: "💰", color: "#80C8A0", steps: ["Verificar país do tratado","Avaliar investimento","Estruturar empresa nos EUA","Preparar business plan","Documentar investimento realizado","Preparar DS-160 / I-129E","Entrevista consular ou I-539","Aprovação do visto E-2","Renovação periódica"] },
  "Visto E-1": { icon: "🚢", color: "#70B8A0", steps: ["Verificar país do tratado","Documentar comércio substancial","Confirmar 50%+ do comércio entre os países","Preparar DS-160 / I-129E","Reunir evidências de comércio","Entrevista consular","Aprovação do visto E-1","Renovação periódica"] },
  "Cidadania Americana": { icon: "🇺🇸", color: "#C8A0A0", steps: ["Verificar elegibilidade (5 anos / 3 anos casado com cidadão)","Verificar ausências dos EUA","Verificar bom caráter moral","Preparar formulário N-400","Reunir documentos","Protocolar N-400","Biometria","Entrevista de naturalização","Teste de inglês e civismo","Cerimônia de naturalização"] },
  "Mudança de Status F-1": { icon: "🎒", color: "#A8C8D4", steps: ["Obter I-20 da instituição","Verificar status atual e elegibilidade","Preparar formulário I-539","Reunir documentos financeiros","Reunir documentos da instituição","Protocolar I-539","Aguardar aprovação","Aprovação e início dos estudos"] },
  "Extensão I-94": { icon: "📅", color: "#C8D4A8", steps: ["Verificar data de expiração do I-94","Identificar categoria de extensão","Preparar formulário I-539 ou I-129","Reunir documentos de suporte","Protocolar antes do vencimento","Aguardar aprovação","Atualizar I-94"] },
};

const CASE_TYPE_NAMES = Object.keys(CASE_TYPES);
const DEADLINE_TYPES = ["Protocolar formulário no USCIS","Call-up para protocolar evidências","Call-up para protocolar brief","Call-up para protocolar aplicação atualizada","Written Pleadings","Motion (especificar)","Prosecutorial Discretion","Master Hearing","Individual Hearing","Interview USCIS","Prazo de recurso ao BIA","Prazo de recurso ao Circuit Court","Outro prazo"];
const ROLES = ["Advogado(a)","Paralegal","Secretária","Estagiário(a)"];
const RELATIONSHIPS = ["Cônjuge","Filho(a)","Pai","Mãe","Irmão/Irmã","Avô/Avó","Neto(a)","Outro"];
const USER_COLORS = ["#C8A96E","#B08FD4","#7EAED4","#A8C5A0","#E8A090","#90C8D4","#D4A870","#C8A0A0"];

const TODAY = new Date();
const daysUntil = d => Math.ceil((new Date(d) - TODAY) / 86400000);
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const todayStr = () => new Date().toISOString().split("T")[0];
const statusColors = { "Em Andamento": "#C8A96E", "Aguardando Cliente": "#7EAED4", "Aprovado": "#A8C5A0", "Em Revisão": "#E8A090", "Encerrado": "#6A5E52", "Arquivado": "#4A3E32" };
const priorityColors = { Urgente: "#E07070", Alta: "#E8A090", Média: "#C8A96E", Baixa: "#A8C5A0" };

// ── STYLES ────────────────────────────────────────────────────────────────────
const I = { background: "#0F0D0A", border: "1px solid #3A3028", borderRadius: 8, padding: "10px 14px", color: "#E8E0D5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };
const B = (col="#C8A96E") => ({ background: col, color: col==="#C8A96E"?"#0F0D0A":"#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" });
const G = (col="#C8A96E") => ({ background: "transparent", color: col, border: `1px solid ${col}44`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" });
const L = { fontSize: 11, color: "#6A5E52", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" };
const CARD = { background: "#1A1410", border: "1px solid #2A2218", borderRadius: 12, padding: 24 };

const Avatar = ({ user, size=32 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:user?.color||"#C8A96E", color:"#1A1410", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.34, fontWeight:700, fontFamily:"monospace", flexShrink:0 }}>{user?.avatar||"?"}</div>
);
const Badge = ({ label, color }) => (
  <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600, fontFamily:"monospace", whiteSpace:"nowrap" }}>{label}</span>
);
const DaysLeft = ({ date }) => {
  if (!date) return null;
  const d = daysUntil(date);
  const c = d<=0?"#E07070":d<=7?"#E07070":d<=14?"#C8A96E":"#A8C5A0";
  return <span style={{ color:c, fontSize:12, fontFamily:"monospace", fontWeight:700 }}>{d<=0?"VENCIDO":d===1?"amanhã":`${d}d`}</span>;
};

// ── MODAL BASE ────────────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, children, maxWidth=560 }) => (
  <div style={{ position:"fixed", inset:0, background:"#0A0806ee", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:"#1A1410", border:"1px solid #3A3028", borderRadius:16, padding:28, width:"100%", maxWidth, maxHeight:"92vh", overflowY:"auto" }}>
      <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:800 }}>{title}</h2>
      {subtitle && <p style={{ margin:"0 0 20px", color:"#6A5E52", fontSize:13 }}>{subtitle}</p>}
      {children}
    </div>
  </div>
);

const Row = ({ children }) => <div style={{ display:"flex", gap:12, marginBottom:12 }}>{children}</div>;
const Col = ({ children, style={} }) => <div style={{ flex:1, ...style }}>{children}</div>;
const Field = ({ label, children }) => <div style={{ flex:1 }}><label style={L}>{label}</label>{children}</div>;
const SecTitle = ({ children }) => <div style={{ fontSize:11, color:"#C8A96E", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14, paddingBottom:8, borderBottom:"1px solid #2A2218" }}>{children}</div>;
const TabBtn = ({ active, onClick, children }) => <button onClick={onClick} style={{ ...G(active?"#C8A96E":"#6A5E52"), fontSize:12, padding:"7px 14px", ...(active?{background:"#C8A96E22",borderColor:"#C8A96E"}:{}) }}>{children}</button>;

// ── WORKFLOW TRACKER ──────────────────────────────────────────────────────────
function WorkflowTracker({ caseType, currentStep, assignments={}, users=[], onStepChange, onAssign, notes=[], onAddNote, currentUser }) {
  const config = CASE_TYPES[caseType];
  if (!config) return null;
  const pct = Math.round(((currentStep+1)/config.steps.length)*100);
  const [noteStep, setNoteStep] = useState(null);
  const [noteText, setNoteText] = useState("");

  const saveNote = async (step) => {
    if (!noteText.trim()) return;
    await onAddNote(`[Etapa ${step+1}] ${noteText}`);
    setNoteText(""); setNoteStep(null);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:18 }}>{config.icon}</span>
        <strong style={{ fontSize:13, color:"#6A5E52", textTransform:"uppercase", letterSpacing:"0.08em" }}>{caseType}</strong>
        <span style={{ marginLeft:"auto", fontSize:13, color:config.color, fontWeight:700 }}>{pct}% concluído</span>
      </div>
      <div style={{ height:6, background:"#2A2218", borderRadius:3, marginBottom:20, overflow:"hidden" }}>
        <div style={{ height:"100%", background:config.color, width:`${pct}%`, borderRadius:3, transition:"width 0.4s" }}/>
      </div>
      {config.steps.map((step, i) => {
        const done = i < currentStep, active = i === currentStep;
        const assignedUserId = assignments[i];
        const assignedUser = users.find(u => u.id === assignedUserId);
        const stepNotes = notes.filter(n => n.content.startsWith(`[Etapa ${i+1}]`));
        return (
          <div key={i} style={{ marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, background:active?config.color+"18":"transparent", border:active?`1px solid ${config.color}44`:"1px solid transparent" }}>
              <div onClick={() => onStepChange(i)} style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:done?"#A8C5A020":active?config.color+"33":"#1E1A16", border:`2px solid ${done?"#A8C5A0":active?config.color:"#2A2218"}`, fontSize:11, color:done?"#A8C5A0":active?config.color:"#4A3E32", cursor:"pointer" }}>
                {done?"✓":i+1}
              </div>
              <span onClick={() => onStepChange(i)} style={{ fontSize:13, color:active?"#E8E0D5":done?"#4A4038":"#8A7E72", textDecoration:done?"line-through":"none", flex:1, cursor:"pointer" }}>{step}</span>
              {assignedUser && <Avatar user={assignedUser} size={20}/>}
              <select value={assignedUserId||""} onChange={e => onAssign(i, e.target.value?Number(e.target.value):null)} style={{ background:"#0F0D0A", border:"1px solid #2A2218", borderRadius:6, padding:"3px 8px", color:"#8A7E72", fontSize:11, outline:"none" }}>
                <option value="">Assignar...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
              </select>
              <button onClick={() => setNoteStep(noteStep===i?null:i)} style={{ background:"transparent", border:"none", color:"#6A5E52", cursor:"pointer", fontSize:14, padding:"0 4px" }}>📝</button>
              {active && <span style={{ fontSize:10, color:config.color, fontWeight:700 }}>ATUAL</span>}
            </div>
            {stepNotes.length > 0 && (
              <div style={{ marginLeft:46, marginTop:4 }}>
                {stepNotes.map((n,ni) => <div key={ni} style={{ fontSize:11, color:"#8A7E72", padding:"4px 10px", background:"#0F0D0A", borderRadius:6, marginBottom:2, borderLeft:"2px solid #C8A96E44" }}>{n.content.replace(`[Etapa ${i+1}] `,"")}</div>)}
              </div>
            )}
            {noteStep === i && (
              <div style={{ marginLeft:46, marginTop:6, display:"flex", gap:8 }}>
                <input style={{ ...I, fontSize:12, padding:"7px 10px" }} placeholder="Nota sobre esta etapa..." value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key==="Enter"&&saveNote(i)} autoFocus/>
                <button style={{ ...B(), fontSize:12, padding:"7px 14px" }} onClick={() => saveNote(i)}>+</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── NEW/EDIT CASE MODAL ───────────────────────────────────────────────────────
function CaseFormModal({ users, initial={}, onSave, onClose, title="Novo Caso" }) {
  const [clientName, setClientName] = useState(initial.client_name||"");
  const [alienNumber, setAlienNumber] = useState(initial.alien_number||"");
  const [dob, setDob] = useState(initial.dob||"");
  const [nationality, setNationality] = useState(initial.nationality||"");
  const [passportNumber, setPassportNumber] = useState(initial.passport_number||"");
  const [usEntryDate, setUsEntryDate] = useState(initial.us_entry_date||"");
  const [eadDate, setEadDate] = useState(initial.ead_eligibility_date||"");
  const [address, setAddress] = useState(initial.address||"");
  const [phone, setPhone] = useState(initial.phone||"");
  const [email, setEmail] = useState(initial.email||"");
  const [caseType, setCaseType] = useState(initial.case_type||"EB-2 NIW");
  const [attorneyId, setAttorneyId] = useState(initial.attorney_id?String(initial.attorney_id):"");
  const [priority, setPriority] = useState(initial.priority||"Média");
  const [deadline, setDeadline] = useState(initial.deadline||"");
  const [hearingDate, setHearingDate] = useState(initial.hearing_date||"");
  const [masterHearing, setMasterHearing] = useState(initial.master_hearing_date||"");
  const [individualHearing, setIndividualHearing] = useState(initial.individual_hearing_date||"");
  const [interviewDate, setInterviewDate] = useState(initial.interview_date||"");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const attorneys = users.filter(u => u.is_attorney);

  useEffect(() => { if (attorneys.length===1 && !attorneyId) setAttorneyId(String(attorneys[0].id)); }, []);

  const handleSave = async () => {
    if (!clientName.trim()) { setError("❌ Nome do cliente é obrigatório."); return; }
    if (!attorneyId) { setError("❌ Selecione um advogado responsável."); return; }
    setError(""); setSaving(true);
    await onSave({ clientName, alienNumber, dob, nationality, passportNumber, usEntryDate, eadDate, address, phone, email, caseType, attorneyId, priority, deadline, hearingDate, masterHearing, individualHearing, interviewDate });
    setSaving(false);
  };

  return (
    <Modal title={title} onClose={onClose} maxWidth={660}>
      <SecTitle>Dados do Caso</SecTitle>
      <div style={{ marginBottom:12 }}>
        <label style={L}>Tipo de Caso *</label>
        <select value={caseType} onChange={e=>setCaseType(e.target.value)} style={I}>
          {CASE_TYPE_NAMES.map(v=><option key={v}>{v}</option>)}
        </select>
      </div>
      <Row>
        <Field label="Advogado Responsável *">
          <select value={attorneyId} onChange={e=>setAttorneyId(e.target.value)} style={I}>
            <option value="">Selecionar advogado...</option>
            {attorneys.map(u=><option key={u.id} value={String(u.id)}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Prioridade">
          <select value={priority} onChange={e=>setPriority(e.target.value)} style={I}>
            {["Urgente","Alta","Média","Baixa"].map(p=><option key={p}>{p}</option>)}
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Prazo Final (opcional)"><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={I}/></Field>
        <Field label="Master Hearing (opcional)"><input type="date" value={masterHearing} onChange={e=>setMasterHearing(e.target.value)} style={I}/></Field>
      </Row>
      <Row>
        <Field label="Individual Hearing (opcional)"><input type="date" value={individualHearing} onChange={e=>setIndividualHearing(e.target.value)} style={I}/></Field>
        <Field label="Interview USCIS (opcional)"><input type="date" value={interviewDate} onChange={e=>setInterviewDate(e.target.value)} style={I}/></Field>
      </Row>
      <div style={{ marginTop:20, marginBottom:14 }}><SecTitle>Dados do Cliente</SecTitle></div>
      <div style={{ marginBottom:12 }}>
        <label style={L}>Nome Completo *</label>
        <input type="text" value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Nome completo do cliente" style={I}/>
      </div>
      <Row>
        <Field label="A# (Alien Number)"><input type="text" value={alienNumber} onChange={e=>setAlienNumber(e.target.value)} placeholder="A000-000-000" style={I}/></Field>
        <Field label="Data de Nascimento"><input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={I}/></Field>
      </Row>
      <Row>
        <Field label="Nacionalidade"><input type="text" value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="Ex: Brasil" style={I}/></Field>
        <Field label="Número do Passaporte"><input type="text" value={passportNumber} onChange={e=>setPassportNumber(e.target.value)} placeholder="Ex: BR123456" style={I}/></Field>
      </Row>
      <Row>
        <Field label="Data de Entrada nos EUA"><input type="date" value={usEntryDate} onChange={e=>setUsEntryDate(e.target.value)} style={I}/></Field>
        <Field label="Elegibilidade EAD"><input type="date" value={eadDate} onChange={e=>setEadDate(e.target.value)} style={I}/></Field>
      </Row>
      <div style={{ marginBottom:12 }}>
        <label style={L}>Endereço Completo</label>
        <input type="text" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Rua, número, cidade, estado, ZIP" style={I}/>
      </div>
      <Row>
        <Field label="Telefone"><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(000) 000-0000" style={I}/></Field>
        <Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="cliente@email.com" style={I}/></Field>
      </Row>
      {error && <div style={{ background:"#E0707022", border:"1px solid #E07070", borderRadius:8, padding:"10px 14px", color:"#E07070", fontSize:13, marginBottom:14 }}>{error}</div>}
      <div style={{ display:"flex", gap:10 }}>
        <button style={{ ...B(), flex:1 }} onClick={handleSave} disabled={saving}>{saving?"Salvando...":"✓ Salvar Caso"}</button>
        <button style={{ ...G(), flex:1 }} onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
}

// ── ADD TEAM MEMBER MODAL ─────────────────────────────────────────────────────
function TeamMemberModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Paralegal");
  const [isAttorney, setIsAttorney] = useState(false);
  const [color, setColor] = useState(USER_COLORS[2]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setIsAttorney(role==="Advogado(a)"); }, [role]);

  const initials = name.split(" ").filter(Boolean).map(w=>w[0]).join("").substring(0,2).toUpperCase();

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    await onSave({ name, email, role, is_attorney: isAttorney, color, avatar: initials||"??" });
    setSaving(false);
  };

  return (
    <Modal title="Adicionar Membro da Equipe" onClose={onClose} maxWidth={440}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label style={L}>Nome Completo *</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nome completo" style={I}/></div>
        <div><label style={L}>Email *</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@escritorio.com" style={I}/></div>
        <div>
          <label style={L}>Função</label>
          <select value={role} onChange={e=>setRole(e.target.value)} style={I}>
            {ROLES.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={L}>Cor do Avatar</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {USER_COLORS.map(c=>(
              <div key={c} onClick={()=>setColor(c)} style={{ width:32, height:32, borderRadius:"50%", background:c, cursor:"pointer", border:color===c?"3px solid #fff":"3px solid transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#1A1410" }}>{initials||"?"}</div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button style={{ ...B(), flex:1 }} onClick={handleSave} disabled={saving}>{saving?"Salvando...":"Adicionar"}</button>
          <button style={{ ...G(), flex:1 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}

// ── FAMILY MODAL ──────────────────────────────────────────────────────────────
function FamilyModal({ onSave, onClose, initial={} }) {
  const [name, setName] = useState(initial.name||"");
  const [relationship, setRelationship] = useState(initial.relationship||"Cônjuge");
  const [dob, setDob] = useState(initial.dob||"");
  const [alienNumber, setAlienNumber] = useState(initial.alien_number||"");
  const [nationality, setNationality] = useState(initial.nationality||"");
  const [passportNumber, setPassportNumber] = useState(initial.passport_number||"");
  const [notes, setNotes] = useState(initial.notes||"");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={initial.id?"Editar Familiar":"Adicionar Familiar"} onClose={onClose} maxWidth={500}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div><label style={L}>Nome Completo *</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do familiar" style={I}/></div>
        <Row>
          <Field label="Parentesco"><select value={relationship} onChange={e=>setRelationship(e.target.value)} style={I}>{RELATIONSHIPS.map(r=><option key={r}>{r}</option>)}</select></Field>
          <Field label="Data de Nascimento"><input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={I}/></Field>
        </Row>
        <Row>
          <Field label="A# (Alien Number)"><input type="text" value={alienNumber} onChange={e=>setAlienNumber(e.target.value)} placeholder="A000-000-000" style={I}/></Field>
          <Field label="Nacionalidade"><input type="text" value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="Ex: Brasil" style={I}/></Field>
        </Row>
        <div><label style={L}>Número do Passaporte</label><input type="text" value={passportNumber} onChange={e=>setPassportNumber(e.target.value)} style={I}/></div>
        <div><label style={L}>Observações</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Informações adicionais..." style={{ ...I, minHeight:60, resize:"vertical" }}/></div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ ...B(), flex:1 }} onClick={async()=>{if(!name.trim())return;setSaving(true);await onSave({name,relationship,dob:dob||null,alien_number:alienNumber||null,nationality:nationality||null,passport_number:passportNumber||null,notes:notes||null});setSaving(false);}} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          <button style={{ ...G(), flex:1 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}

// ── DEADLINE MODAL ────────────────────────────────────────────────────────────
function DeadlineModal({ users, onSave, onClose, initial={} }) {
  const [type, setType] = useState(initial.deadline_type||DEADLINE_TYPES[0]);
  const [detail, setDetail] = useState(initial.deadline_detail||"");
  const [dueDate, setDueDate] = useState(initial.due_date||"");
  const [assignedTo, setAssignedTo] = useState(initial.assigned_to||"");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title="Prazo Urgente" onClose={onClose} maxWidth={480}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <label style={L}>Tipo de Prazo *</label>
          <select value={type} onChange={e=>setType(e.target.value)} style={I}>
            {DEADLINE_TYPES.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
        {(type==="Motion (especificar)"||type==="Outro prazo") && (
          <div><label style={L}>Detalhe</label><input type="text" value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Especifique..." style={I}/></div>
        )}
        <Row>
          <Field label="Data do Prazo *"><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={I}/></Field>
          <Field label="Responsável">
            <select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} style={I}>
              <option value="">Selecionar...</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
            </select>
          </Field>
        </Row>
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button style={{ ...B(), flex:1 }} onClick={async()=>{if(!dueDate)return;setSaving(true);await onSave({deadline_type:type,deadline_detail:detail||null,due_date:dueDate,assigned_to:assignedTo?Number(assignedTo):null,done:false});setSaving(false);}} disabled={saving}>{saving?"Salvando...":"Salvar Prazo"}</button>
          <button style={{ ...G(), flex:1 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}

// ── REPORTS MODAL ─────────────────────────────────────────────────────────────
function ReportsModal({ cases, users, tasks, deadlines, onClose, onOpenCase }) {
  const [reportType, setReportType] = useState("hearings");

  const upcoming = (arr, dateField) => arr.filter(c=>c[dateField]).sort((a,b)=>new Date(a[dateField])-new Date(b[dateField]));
  const masterHearings = upcoming(cases.filter(c=>c.master_hearing_date&&!["Encerrado","Arquivado"].includes(c.status)), "master_hearing_date");
  const individualHearings = upcoming(cases.filter(c=>c.individual_hearing_date&&!["Encerrado","Arquivado"].includes(c.status)), "individual_hearing_date");
  const interviews = upcoming(cases.filter(c=>c.interview_date&&!["Encerrado","Arquivado"].includes(c.status)), "interview_date");
  const urgentDeadlines = deadlines.filter(d=>!d.done&&d.due_date&&daysUntil(d.due_date)<=30).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date));

  const byStep = CASE_TYPE_NAMES.reduce((acc,type)=>{
    const cfg = CASE_TYPES[type];
    cfg.steps.forEach((step,i)=>{
      const matching = cases.filter(c=>c.case_type===type&&c.current_step===i&&!["Encerrado","Arquivado"].includes(c.status));
      if (matching.length>0) { if (!acc[step]) acc[step]=[]; acc[step].push(...matching.map(c=>({...c,stepLabel:step}))); }
    });
    return acc;
  },{});

  const CaseRow = ({ c }) => {
    const atty = users.find(u=>u.id===c.attorney_id);
    return (
      <div onClick={()=>{onOpenCase(c.id);onClose();}} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#0F0D0A", borderRadius:8, marginBottom:6, cursor:"pointer" }}>
        <span style={{ fontSize:16 }}>{CASE_TYPES[c.case_type]?.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>{c.client_name}</div>
          <div style={{ fontSize:11, color:"#6A5E52" }}>{c.case_type} · {atty?.name.split(" ")[0]}</div>
        </div>
        {c.master_hearing_date&&reportType==="hearings"&&<div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:"#7EAED4" }}>Master: {fmtDate(c.master_hearing_date)}</div><DaysLeft date={c.master_hearing_date}/></div>}
        {c.individual_hearing_date&&reportType==="hearings"&&<div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:"#E8A090" }}>Individual: {fmtDate(c.individual_hearing_date)}</div><DaysLeft date={c.individual_hearing_date}/></div>}
        {c.interview_date&&reportType==="hearings"&&<div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:"#A8C5A0" }}>Interview: {fmtDate(c.interview_date)}</div><DaysLeft date={c.interview_date}/></div>}
      </div>
    );
  };

  return (
    <Modal title="📊 Relatórios" onClose={onClose} maxWidth={700}>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[["hearings","🏛️ Audiências"],["deadlines","⚠️ Prazos"],["bystep","📋 Por Etapa"]].map(([k,l])=>(
          <TabBtn key={k} active={reportType===k} onClick={()=>setReportType(k)}>{l}</TabBtn>
        ))}
      </div>

      {reportType==="hearings" && (
        <div>
          {masterHearings.length>0&&<><div style={{ fontSize:12, color:"#7EAED4", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>Master Hearings</div>{masterHearings.map(c=><CaseRow key={c.id+"-m"} c={c}/>)}</>}
          {individualHearings.length>0&&<><div style={{ fontSize:12, color:"#E8A090", fontWeight:700, marginBottom:8, marginTop:16, textTransform:"uppercase", letterSpacing:"0.08em" }}>Individual Hearings</div>{individualHearings.map(c=><CaseRow key={c.id+"-i"} c={c}/>)}</>}
          {interviews.length>0&&<><div style={{ fontSize:12, color:"#A8C5A0", fontWeight:700, marginBottom:8, marginTop:16, textTransform:"uppercase", letterSpacing:"0.08em" }}>Interviews USCIS</div>{interviews.map(c=><CaseRow key={c.id+"-int"} c={c}/>)}</>}
          {masterHearings.length===0&&individualHearings.length===0&&interviews.length===0&&<p style={{ color:"#4A3E32" }}>Nenhuma audiência agendada.</p>}
        </div>
      )}

      {reportType==="deadlines" && (
        <div>
          {urgentDeadlines.length===0&&<p style={{ color:"#4A3E32" }}>Nenhum prazo urgente nos próximos 30 dias.</p>}
          {urgentDeadlines.map(d=>{
            const c = cases.find(x=>x.id===d.case_id);
            const u = users.find(x=>x.id===d.assigned_to);
            return (
              <div key={d.id} onClick={()=>{if(c){onOpenCase(c.id);onClose();}}} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#0F0D0A", borderRadius:8, marginBottom:6, cursor:"pointer" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{d.deadline_type}{d.deadline_detail?` — ${d.deadline_detail}`:""}</div>
                  <div style={{ fontSize:11, color:"#6A5E52" }}>{c?.client_name} · {c?.case_type}</div>
                </div>
                {u&&<Avatar user={u} size={22}/>}
                <DaysLeft date={d.due_date}/>
              </div>
            );
          })}
        </div>
      )}

      {reportType==="bystep" && (
        <div>
          {Object.keys(byStep).length===0&&<p style={{ color:"#4A3E32" }}>Nenhum caso ativo.</p>}
          {Object.entries(byStep).map(([step,stepCases])=>(
            <div key={step} style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#C8A96E", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>{step} ({stepCases.length})</div>
              {stepCases.map(c=><CaseRow key={c.id} c={c}/>)}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [family, setFamily] = useState([]);
  const [diary, setDiary] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [filterAtty, setFilterAtty] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [showNewCase, setShowNewCase] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editFamilyItem, setEditFamilyItem] = useState(null);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [diaryDate, setDiaryDate] = useState(todayStr());
  const [editNote, setEditNote] = useState(null);
  const [editDiary, setEditDiary] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  // Caroline is user 1 by convention — admin
  const currentUser = users[0];
  const isAdmin = true; // simplified — in future add real auth

  const loadAll = useCallback(async () => {
    setLoading(true); setConnError(null);
    const [u,c,t,n,f,d,dl] = await Promise.all([
      supabase.from("users").select("*").order("id"),
      supabase.from("cases").select("*").order("created_at",{ascending:false}),
      supabase.from("tasks").select("*").order("due_date"),
      supabase.from("notes").select("*").order("created_at"),
      supabase.from("family_members").select("*").order("created_at"),
      supabase.from("case_diary").select("*").order("entry_date",{ascending:false}),
      supabase.from("deadlines").select("*").order("due_date"),
    ]);
    if (u.error) { setConnError("Erro: "+u.error.message); setLoading(false); return; }
    setUsers(u.data||[]); setCases(c.data||[]); setTasks(t.data||[]);
    setNotes(n.data||[]); setFamily(f.data||[]); setDiary(d.data||[]);
    setDeadlines(dl.data||[]); setLoading(false);
  }, []);

  useEffect(()=>{loadAll();},[loadAll]);

  const sc = cases.find(c=>c.id===selectedCaseId);
  const caseTasks = id => tasks.filter(t=>t.case_id===id);
  const caseNotes = id => notes.filter(n=>n.case_id===id);
  const caseDiary = id => diary.filter(d=>d.case_id===id);
  const caseFamily = id => family.filter(f=>f.case_id===id);
  const caseDeadlines = id => deadlines.filter(d=>d.case_id===id);
  const pending = tasks.filter(t=>!t.done).map(t=>({...t,clientName:cases.find(c=>c.id===t.case_id)?.client_name,priority:cases.find(c=>c.id===t.case_id)?.priority}));
  const urgent = cases.filter(c=>c.deadline&&daysUntil(c.deadline)<=14&&!["Encerrado","Arquivado"].includes(c.status));
  const allHearings = cases.filter(c=>c.master_hearing_date||c.individual_hearing_date||c.interview_date).sort((a,b)=>new Date(a.master_hearing_date||a.individual_hearing_date||a.interview_date)-new Date(b.master_hearing_date||b.individual_hearing_date||b.interview_date));
  const byUser = users.map(u=>({user:u,tasks:pending.filter(t=>t.assigned_to===u.id)}));
  const filtered = cases.filter(c=>(!filterAtty||c.attorney_id===filterAtty)&&(!filterStatus||c.status===filterStatus));

  const openCase = id => { setSelectedCaseId(id); setView("case"); setShowAddTask(false); setActiveTab("info"); };

  const log = async (caseId, action, detail="") => {
    await supabase.from("audit_log").insert({ case_id:caseId, action, new_value:detail, done_by:currentUser?.id });
  };

  const addNote = async caseId => {
    if (!noteText.trim()) return;
    const content = `[${new Date().toLocaleDateString("pt-BR")}] ${noteText}`;
    const {error} = await supabase.from("notes").insert({case_id:caseId,content,created_by:currentUser?.id});
    if (!error) { await log(caseId,"Nota adicionada",content); setNoteText(""); loadAll(); }
    else alert("Erro: "+error.message);
  };

  const updateNote = async (noteId, content, caseId) => {
    await supabase.from("notes").update({content}).eq("id",noteId);
    await log(caseId,"Nota editada",content);
    setEditNote(null); loadAll();
  };

  const deleteNote = async (noteId, caseId) => {
    if (!window.confirm("Deletar esta nota?")) return;
    await supabase.from("notes").delete().eq("id",noteId);
    await log(caseId,"Nota deletada");
    loadAll();
  };

  const addDiaryEntry = async caseId => {
    if (!diaryText.trim()) return;
    const {error} = await supabase.from("case_diary").insert({case_id:caseId,entry_date:diaryDate,content:diaryText,created_by:currentUser?.id});
    if (!error) { await log(caseId,"Entrada no diário",diaryText); setDiaryText(""); loadAll(); }
    else alert("Erro: "+error.message);
  };

  const updateDiary = async (id, content, caseId) => {
    await supabase.from("case_diary").update({content}).eq("id",id);
    await log(caseId,"Diário editado",content);
    setEditDiary(null); loadAll();
  };

  const deleteDiary = async (id, caseId) => {
    if (!isAdmin) { alert("Somente Caroline pode deletar entradas do diário."); return; }
    if (!window.confirm("Deletar esta entrada do diário?")) return;
    await supabase.from("case_diary").delete().eq("id",id);
    await log(caseId,"Entrada do diário deletada");
    loadAll();
  };

  const toggleTask = async (taskId, current) => {
    await supabase.from("tasks").update({done:!current}).eq("id",taskId);
    setTasks(p=>p.map(t=>t.id===taskId?{...t,done:!current}:t));
  };

  const deleteTask = async (taskId, caseId) => {
    if (!window.confirm("Deletar esta tarefa?")) return;
    await supabase.from("tasks").delete().eq("id",taskId);
    await log(caseId,"Tarefa deletada");
    loadAll();
  };

  const addTask = async caseId => {
    if (!taskTitle.trim()||!taskDue) return;
    await supabase.from("tasks").insert({case_id:caseId,title:taskTitle,assigned_to:Number(taskAssignee||currentUser?.id),done:false,due_date:taskDue});
    setTaskTitle(""); setTaskDue(""); setTaskAssignee(""); setShowAddTask(false); loadAll();
  };

  const updateCase = async (caseId, patch) => {
    await supabase.from("cases").update(patch).eq("id",caseId);
    setCases(p=>p.map(c=>c.id===caseId?{...c,...patch}:c));
  };

  const assignWorkflowStep = async (caseId, step, userId) => {
    const c = cases.find(x=>x.id===caseId);
    const assignments = {...(c?.workflow_assignments||{})};
    if (userId) assignments[step]=userId; else delete assignments[step];
    await updateCase(caseId,{workflow_assignments:assignments});
  };

  const handleTransfer = async (toId, reason) => {
    if (!sc) return;
    const from = users.find(u=>u.id===sc.attorney_id);
    const to = users.find(u=>u.id===toId);
    const content = `[${new Date().toLocaleDateString("pt-BR")}] ⇄ Transferido de ${from?.name} para ${to?.name}. Motivo: ${reason}`;
    await supabase.from("cases").update({attorney_id:toId}).eq("id",sc.id);
    await supabase.from("transfers").insert({case_id:sc.id,from_attorney:sc.attorney_id,to_attorney:toId,reason});
    await supabase.from("notes").insert({case_id:sc.id,content,created_by:currentUser?.id});
    await log(sc.id,"Caso transferido",content);
    setShowTransfer(false); loadAll();
  };

  const handleNewCase = async f => {
    const id = `C-${new Date().getFullYear()}-${String(cases.length+1).padStart(3,"0")}`;
    const {error} = await supabase.from("cases").insert({
      id, client_name:f.clientName.trim(), case_type:f.caseType,
      attorney_id:Number(f.attorneyId), status:"Em Andamento", priority:f.priority,
      deadline:f.deadline||null, hearing_date:f.hearingDate||null,
      master_hearing_date:f.masterHearing||null, individual_hearing_date:f.individualHearing||null,
      interview_date:f.interviewDate||null, current_step:0,
      alien_number:f.alienNumber||null, dob:f.dob||null, nationality:f.nationality||null,
      passport_number:f.passportNumber||null, us_entry_date:f.usEntryDate||null,
      ead_eligibility_date:f.eadDate||null, address:f.address||null,
      phone:f.phone||null, email:f.email||null, workflow_assignments:{},
    });
    if (error) { alert("Erro ao salvar:\n"+error.message); return; }
    await supabase.from("notes").insert({case_id:id,content:`[${new Date().toLocaleDateString("pt-BR")}] Caso criado.`,created_by:currentUser?.id});
    setShowNewCase(false); loadAll();
  };

  const handleEditCase = async f => {
    if (!sc) return;
    const {error} = await supabase.from("cases").update({
      client_name:f.clientName.trim(), case_type:f.caseType,
      attorney_id:Number(f.attorneyId), priority:f.priority,
      deadline:f.deadline||null, hearing_date:f.hearingDate||null,
      master_hearing_date:f.masterHearing||null, individual_hearing_date:f.individualHearing||null,
      interview_date:f.interviewDate||null,
      alien_number:f.alienNumber||null, dob:f.dob||null, nationality:f.nationality||null,
      passport_number:f.passportNumber||null, us_entry_date:f.usEntryDate||null,
      ead_eligibility_date:f.eadDate||null, address:f.address||null,
      phone:f.phone||null, email:f.email||null,
    }).eq("id",sc.id);
    if (error) { alert("Erro: "+error.message); return; }
    await log(sc.id,"Caso editado");
    setShowEditCase(false); loadAll();
  };

  const closeCase = async caseId => {
    if (!window.confirm("Encerrar este caso? Ele ficará como Encerrado.")) return;
    await supabase.from("cases").update({status:"Encerrado",closed_at:new Date().toISOString()}).eq("id",caseId);
    await log(caseId,"Caso encerrado");
    loadAll();
  };

  const deleteCase = async caseId => {
    if (!isAdmin) { alert("Somente Caroline pode deletar casos."); return; }
    if (!window.confirm("ATENÇÃO: Deletar este caso permanentemente? Esta ação não pode ser desfeita.")) return;
    await supabase.from("notes").delete().eq("case_id",caseId);
    await supabase.from("tasks").delete().eq("case_id",caseId);
    await supabase.from("case_diary").delete().eq("case_id",caseId);
    await supabase.from("family_members").delete().eq("case_id",caseId);
    await supabase.from("deadlines").delete().eq("case_id",caseId);
    await supabase.from("cases").delete().eq("id",caseId);
    setView("cases"); loadAll();
  };

  const handleAddFamily = async data => {
    if (!sc) return;
    if (editFamilyItem?.id) {
      await supabase.from("family_members").update(data).eq("id",editFamilyItem.id);
      await log(sc.id,"Familiar editado",data.name);
    } else {
      await supabase.from("family_members").insert({case_id:sc.id,...data});
      await log(sc.id,"Familiar adicionado",data.name);
    }
    setShowFamilyModal(false); setEditFamilyItem(null); loadAll();
  };

  const deleteFamily = async (id,caseId) => {
    if (!window.confirm("Remover este familiar?")) return;
    await supabase.from("family_members").delete().eq("id",id);
    await log(caseId,"Familiar removido");
    loadAll();
  };

  const handleAddDeadline = async data => {
    if (!sc) return;
    await supabase.from("deadlines").insert({case_id:sc.id,...data});
    await log(sc.id,"Prazo adicionado",data.deadline_type);
    setShowDeadlineModal(false); loadAll();
  };

  const toggleDeadline = async (id,current) => {
    await supabase.from("deadlines").update({done:!current}).eq("id",id);
    setDeadlines(p=>p.map(d=>d.id===id?{...d,done:!current}:d));
  };

  const deleteDeadline = async (id,caseId) => {
    if (!window.confirm("Deletar este prazo?")) return;
    await supabase.from("deadlines").delete().eq("id",id);
    await log(caseId,"Prazo deletado");
    loadAll();
  };

  const handleAddTeamMember = async data => {
    await supabase.from("users").insert(data);
    setShowTeamModal(false); loadAll();
  };

  const deleteTeamMember = async id => {
    if (!isAdmin) { alert("Somente Caroline pode remover membros."); return; }
    if (!window.confirm("Remover este membro da equipe?")) return;
    await supabase.from("users").delete().eq("id",id);
    loadAll();
  };

  // ── STYLES ────────────────────────────────────────────────────────────────
  const navS = a => ({ padding:"10px 20px", cursor:"pointer", background:a?"#C8A96E18":"transparent", borderLeft:a?"3px solid #C8A96E":"3px solid transparent", color:a?"#C8A96E":"#8A7E72", fontSize:14, fontWeight:a?600:400, display:"flex", alignItems:"center", gap:10 });
  const th = { textAlign:"left", padding:"11px 14px", color:"#6A5E52", fontSize:11, fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", borderBottom:"1px solid #2A2218" };
  const td = { padding:"12px 14px", borderBottom:"1px solid #1E1A16", fontSize:13, verticalAlign:"middle" };

  if (loading) return <div style={{ minHeight:"100vh", background:"#0F0D0A", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"sans-serif", color:"#E8E0D5" }}><div style={{ color:"#C8A96E", letterSpacing:"0.3em", fontSize:12 }}>IMMIGRATIONOS</div><div style={{ color:"#6A5E52" }}>Carregando...</div></div>;
  if (connError) return <div style={{ minHeight:"100vh", background:"#0F0D0A", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"sans-serif", color:"#E8E0D5", padding:40 }}><div style={{ color:"#E07070", fontWeight:700 }}>Erro de conexão</div><div style={{ color:"#8A7E72", fontSize:13 }}>{connError}</div><button style={B()} onClick={loadAll}>Tentar novamente</button></div>;

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div><h1 style={{ fontSize:26, fontWeight:800, margin:0 }}>Dashboard</h1><p style={{ color:"#6A5E52", margin:"4px 0 0", fontSize:13 }}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p></div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={G()} onClick={()=>setShowReports(true)}>📊 Relatórios</button>
          <button style={B()} onClick={()=>setShowNewCase(true)}>+ Novo Caso</button>
        </div>
      </div>
      <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
        {[{label:"Casos Ativos",val:cases.filter(c=>c.status==="Em Andamento").length,color:"#C8A96E"},{label:"Tarefas Pend.",val:pending.length,color:"#7EAED4"},{label:"Prazos ≤ 14d",val:urgent.length,color:"#E07070"},{label:"Audiências",val:allHearings.length,color:"#A8C5A0"},{label:"Total de Casos",val:cases.length,color:"#6A5E52"}].map(s=>(
          <div key={s.label} style={{...CARD,flex:1,minWidth:120,padding:16}}><div style={{fontSize:30,fontWeight:800,color:s.color,fontFamily:"monospace"}}>{s.val}</div><div style={{fontSize:10,color:"#6A5E52",marginTop:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</div></div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:20 }}>
        <div style={CARD}>
          <h3 style={{margin:"0 0 18px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Tarefas por Membro da Equipe</h3>
          {byUser.map(({user,tasks:ut})=>(
            <div key={user.id} style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                <Avatar user={user} size={24}/><span style={{fontSize:13,fontWeight:600}}>{user.name}</span>
                <Badge label={user.role} color="#4A3E32"/>
                <span style={{marginLeft:"auto",fontSize:12,color:ut.length>0?"#C8A96E":"#3A3028"}}>{ut.length} pend.</span>
              </div>
              {ut.slice(0,3).map(t=>(
                <div key={t.id} onClick={()=>openCase(t.case_id)} style={{background:"#0F0D0A",borderRadius:6,padding:"7px 10px",marginBottom:3,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:priorityColors[t.priority]||"#C8A96E",flexShrink:0}}/>
                  <span style={{fontSize:12,flex:1,color:"#C0B8B0"}}>{t.title}</span>
                  <span style={{fontSize:11,color:"#4A3E32"}}>{t.clientName}</span>
                  {t.due_date&&<DaysLeft date={t.due_date}/>}
                </div>
              ))}
              {ut.length>3&&<div style={{fontSize:11,color:"#4A3E32",paddingLeft:10}}>+{ut.length-3} mais</div>}
              {ut.length===0&&<div style={{fontSize:12,color:"#2A2218",padding:"3px 10px"}}>Sem tarefas ✓</div>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div style={CARD}>
            <h3 style={{margin:"0 0 12px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>⚠️ Prazos Urgentes</h3>
            {urgent.length===0&&<p style={{color:"#3A3028",fontSize:13}}>Nenhum prazo urgente ✓</p>}
            {urgent.map(c=>{const atty=users.find(u=>u.id===c.attorney_id);return(
              <div key={c.id} onClick={()=>openCase(c.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #2A2218",cursor:"pointer"}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{c.client_name}</div><div style={{fontSize:11,color:"#6A5E52"}}>{CASE_TYPES[c.case_type]?.icon} {c.case_type} · {atty?.name.split(" ")[0]}</div></div>
                <DaysLeft date={c.deadline}/>
              </div>
            );})}
          </div>
          <div style={CARD}>
            <h3 style={{margin:"0 0 12px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>🏛️ Próximas Audiências</h3>
            {allHearings.length===0&&<p style={{color:"#3A3028",fontSize:13}}>Nenhuma audiência agendada.</p>}
            {allHearings.slice(0,5).map(c=>{
              const nextDate = c.master_hearing_date||c.individual_hearing_date||c.interview_date;
              const type = c.master_hearing_date?"Master":c.individual_hearing_date?"Individual":"Interview";
              return(
                <div key={c.id} onClick={()=>openCase(c.id)} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #2A2218",cursor:"pointer"}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{c.client_name}</div><div style={{fontSize:11,color:"#6A5E52"}}>{type} Hearing · {c.case_type}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#A8C5A0",fontFamily:"monospace"}}>{fmtDate(nextDate)}</div><DaysLeft date={nextDate}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ── CASES LIST ────────────────────────────────────────────────────────────
  const CasesList = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <h1 style={{fontSize:26,fontWeight:800,margin:0}}>Casos <span style={{fontSize:15,color:"#6A5E52",fontWeight:400}}>({filtered.length})</span></h1>
        <button style={B()} onClick={()=>setShowNewCase(true)}>+ Novo Caso</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <button style={{...G(),...(filterAtty===null?{background:"#C8A96E22"}:{}),padding:"5px 11px",fontSize:12}} onClick={()=>setFilterAtty(null)}>Todos</button>
        {users.filter(u=>u.is_attorney).map(u=>(
          <button key={u.id} style={{...G(),...(filterAtty===u.id?{background:"#C8A96E22"}:{}),padding:"5px 11px",fontSize:12}} onClick={()=>setFilterAtty(filterAtty===u.id?null:u.id)}>{u.name.split(" ").slice(-1)[0]}</button>
        ))}
        <div style={{width:1,height:18,background:"#2A2218"}}/>
        {["Em Andamento","Aguardando Cliente","Em Revisão","Aprovado","Encerrado"].map(s=>(
          <button key={s} style={{...G(),...(filterStatus===s?{background:"#C8A96E22"}:{}),padding:"5px 11px",fontSize:12}} onClick={()=>setFilterStatus(filterStatus===s?null:s)}>{s}</button>
        ))}
      </div>
      <div style={CARD}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["ID","Cliente","A#","Tipo","Advogado","Status","Prazo","Audiências","Prog."].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c=>{
              const atty=users.find(u=>u.id===c.attorney_id);
              const cfg=CASE_TYPES[c.case_type];
              const pct=Math.round(((c.current_step+1)/(cfg?.steps.length||1))*100);
              const nextHearing=c.master_hearing_date||c.individual_hearing_date||c.interview_date;
              return(
                <tr key={c.id} onClick={()=>openCase(c.id)} style={{cursor:"pointer",opacity:["Encerrado","Arquivado"].includes(c.status)?0.5:1}} onMouseEnter={e=>e.currentTarget.style.background="#1E1A16"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...td,fontFamily:"monospace",fontSize:11,color:"#6A5E52"}}>{c.id}</td>
                  <td style={{...td,fontWeight:600}}>{c.client_name}</td>
                  <td style={{...td,fontFamily:"monospace",fontSize:11,color:"#8A7E72"}}>{c.alien_number||"—"}</td>
                  <td style={td}><span style={{display:"flex",alignItems:"center",gap:5}}><span>{cfg?.icon}</span><span style={{fontSize:12}}>{c.case_type}</span></span></td>
                  <td style={td}><div style={{display:"flex",alignItems:"center",gap:6}}><Avatar user={atty} size={20}/><span style={{fontSize:12}}>{atty?.name.split(" ").slice(-1)[0]||"—"}</span></div></td>
                  <td style={td}><Badge label={c.status} color={statusColors[c.status]||"#C8A96E"}/></td>
                  <td style={td}>{c.deadline?<><div style={{fontSize:11,color:"#6A5E52"}}>{fmtDate(c.deadline)}</div><DaysLeft date={c.deadline}/></>:"—"}</td>
                  <td style={td}>{nextHearing?<><div style={{fontSize:11,color:"#A8C5A0"}}>{fmtDate(nextHearing)}</div><DaysLeft date={nextHearing}/></>:"—"}</td>
                  <td style={td}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:44,height:4,background:"#2A2218",borderRadius:2,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:cfg?.color||"#C8A96E",borderRadius:2}}/></div><span style={{fontSize:10,fontFamily:"monospace",color:"#6A5E52"}}>{pct}%</span></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── CASE DETAIL ───────────────────────────────────────────────────────────
  const CaseDetail = ({ c }) => {
    const atty = users.find(u=>u.id===c.attorney_id);
    const cfg = CASE_TYPES[c.case_type];
    const ct = caseTasks(c.id);
    const cn = caseNotes(c.id);
    const cd = caseDiary(c.id);
    const cf = caseFamily(c.id);
    const cdl = caseDeadlines(c.id);
    const diaryByDate = cd.reduce((acc,e)=>{if(!acc[e.entry_date])acc[e.entry_date]=[];acc[e.entry_date].push(e);return acc;},{});
    const clientFields = [["A# (Alien Number)",c.alien_number],["Data de Nascimento",c.dob?fmtDate(c.dob):null],["Nacionalidade",c.nationality],["Passaporte",c.passport_number],["Entrada nos EUA",c.us_entry_date?fmtDate(c.us_entry_date):null],["Elegibilidade EAD",c.ead_eligibility_date?fmtDate(c.ead_eligibility_date):null],["Endereço",c.address],["Telefone",c.phone],["Email",c.email]].filter(([,v])=>v);

    return (
      <div>
        {/* HEADER */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <button style={G()} onClick={()=>setView("cases")}>← Voltar</button>
          <span style={{fontSize:20}}>{cfg?.icon}</span>
          <h1 style={{margin:0,fontSize:20,fontWeight:800}}>{c.client_name}</h1>
          <Badge label={c.id} color="#4A3E32"/>
          <Badge label={c.case_type} color={cfg?.color||"#C8A96E"}/>
          <Badge label={c.status} color={statusColors[c.status]||"#C8A96E"}/>
          <Badge label={c.priority} color={priorityColors[c.priority]}/>
          <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap"}}>
            <select style={{...I,width:"auto",fontSize:12,padding:"7px 10px"}} value={c.status} onChange={e=>updateCase(c.id,{status:e.target.value})}>
              {["Em Andamento","Aguardando Cliente","Em Revisão","Aprovado","Encerrado","Arquivado"].map(s=><option key={s}>{s}</option>)}
            </select>
            <button style={{...G()}} onClick={()=>setShowEditCase(true)}>✏️ Editar</button>
            <button style={{...G("#B08FD4"),borderColor:"#B08FD444",color:"#B08FD4"}} onClick={()=>setShowTransfer(true)}>⇄ Transferir</button>
            {!["Encerrado","Arquivado"].includes(c.status)&&<button style={{...G("#E8A090"),borderColor:"#E8A09044",color:"#E8A090"}} onClick={()=>closeCase(c.id)}>🔒 Encerrar</button>}
            {isAdmin&&<button style={{...G("#E07070"),borderColor:"#E0707044",color:"#E07070"}} onClick={()=>deleteCase(c.id)}>🗑️ Deletar</button>}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
          {[["info","📋 Caso"],["client","👤 Cliente"],["family","👨‍👩‍👧 Familiares"+(cf.length>0?` (${cf.length})`:"")],["deadlines","⚠️ Prazos"+(cdl.filter(d=>!d.done).length>0?` (${cdl.filter(d=>!d.done).length})`:"")],["diary","📓 Diário"+(cd.length>0?` (${cd.length})`:"")],["notes","📝 Notas"],["tasks","✅ Tarefas"+(ct.filter(t=>!t.done).length>0?` (${ct.filter(t=>!t.done).length})`:"")],["workflow","🔄 Workflow"]].map(([tab,label])=>(
            <TabBtn key={tab} active={activeTab===tab} onClick={()=>setActiveTab(tab)}>{label}</TabBtn>
          ))}
        </div>

        {/* INFO */}
        {activeTab==="info"&&<div style={CARD}>
          <h3 style={{margin:"0 0 14px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Informações do Caso</h3>
          {[
            ["Advogado",<div style={{display:"flex",alignItems:"center",gap:8}}><Avatar user={atty} size={20}/><span>{atty?.name||"Não atribuído"}</span></div>],
            ["Prazo Final",c.deadline?<><span style={{fontSize:12}}>{fmtDate(c.deadline)}</span> <DaysLeft date={c.deadline}/>:</>:"—"],
            ["Master Hearing",c.master_hearing_date?<><span style={{fontSize:12}}>{fmtDate(c.master_hearing_date)}</span> <DaysLeft date={c.master_hearing_date}/>:</>:"—"],
            ["Individual Hearing",c.individual_hearing_date?<><span style={{fontSize:12}}>{fmtDate(c.individual_hearing_date)}</span> <DaysLeft date={c.individual_hearing_date}/>:</>:"—"],
            ["Interview USCIS",c.interview_date?<><span style={{fontSize:12}}>{fmtDate(c.interview_date)}</span> <DaysLeft date={c.interview_date}/>:</>:"—"],
            ["Aberto em",fmtDate(c.created_at)],
            ["Encerrado em",c.closed_at?fmtDate(c.closed_at):"—"],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #1E1A16",fontSize:13}}><span style={{color:"#6A5E52"}}>{k}</span><span>{v}</span></div>
          ))}
        </div>}

        {/* CLIENT */}
        {activeTab==="client"&&<div style={CARD}>
          <h3 style={{margin:"0 0 14px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Dados do Cliente</h3>
          {clientFields.length===0&&<p style={{color:"#4A3E32",fontSize:13}}>Nenhum dado adicional. Clique em Editar para adicionar.</p>}
          {clientFields.map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:"1px solid #1E1A16",fontSize:13}}><span style={{color:"#6A5E52",flexShrink:0,marginRight:12}}>{k}</span><span style={{textAlign:"right",wordBreak:"break-all"}}>{v}</span></div>
          ))}
          <button style={{...G(),marginTop:14,fontSize:12}} onClick={()=>setShowEditCase(true)}>✏️ Editar dados do cliente</button>
        </div>}

        {/* FAMILY */}
        {activeTab==="family"&&<div style={CARD}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Familiares no Caso</h3>
            <button style={{...G(),fontSize:12,padding:"6px 14px"}} onClick={()=>{setEditFamilyItem(null);setShowFamilyModal(true);}}>+ Adicionar Familiar</button>
          </div>
          {cf.length===0&&<p style={{color:"#4A3E32",fontSize:13}}>Nenhum familiar cadastrado.</p>}
          {cf.map(fm=>(
            <div key={fm.id} style={{background:"#0F0D0A",borderRadius:10,padding:16,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"#2A2218",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👤</div>
                  <div><div style={{fontSize:14,fontWeight:700}}>{fm.name}</div><Badge label={fm.relationship} color="#7EAED4"/></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setEditFamilyItem(fm);setShowFamilyModal(true);}} style={{background:"transparent",border:"none",color:"#C8A96E",cursor:"pointer",fontSize:14}}>✏️</button>
                  <button onClick={()=>deleteFamily(fm.id,c.id)} style={{background:"transparent",border:"none",color:"#E07070",cursor:"pointer",fontSize:14}}>🗑️</button>
                </div>
              </div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap",fontSize:12,color:"#8A7E72"}}>
                {fm.alien_number&&<span>A#: <span style={{color:"#E8E0D5"}}>{fm.alien_number}</span></span>}
                {fm.dob&&<span>Nasc.: <span style={{color:"#E8E0D5"}}>{fmtDate(fm.dob)}</span></span>}
                {fm.nationality&&<span>Nac.: <span style={{color:"#E8E0D5"}}>{fm.nationality}</span></span>}
                {fm.passport_number&&<span>Pass.: <span style={{color:"#E8E0D5"}}>{fm.passport_number}</span></span>}
              </div>
              {fm.notes&&<div style={{marginTop:8,fontSize:12,color:"#8A7E72",fontStyle:"italic"}}>{fm.notes}</div>}
            </div>
          ))}
        </div>}

        {/* DEADLINES */}
        {activeTab==="deadlines"&&<div style={CARD}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Prazos Urgentes</h3>
            <button style={{...G(),fontSize:12,padding:"6px 14px"}} onClick={()=>setShowDeadlineModal(true)}>+ Adicionar Prazo</button>
          </div>
          {cdl.length===0&&<p style={{color:"#4A3E32",fontSize:13}}>Nenhum prazo cadastrado.</p>}
          {cdl.map(d=>{const u=users.find(x=>x.id===d.assigned_to);return(
            <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #1E1A16",opacity:d.done?0.4:1}}>
              <div onClick={()=>toggleDeadline(d.id,d.done)} style={{width:20,height:20,borderRadius:4,border:`2px solid ${d.done?"#A8C5A0":"#E07070"}`,background:d.done?"#A8C5A020":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {d.done&&<span style={{color:"#A8C5A0",fontSize:11}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{d.deadline_type}{d.deadline_detail?` — ${d.deadline_detail}`:""}</div>
                <div style={{fontSize:11,color:"#6A5E52"}}>{fmtDate(d.due_date)}</div>
              </div>
              {u&&<Avatar user={u} size={22}/>}
              <DaysLeft date={d.due_date}/>
              <button onClick={()=>deleteDeadline(d.id,c.id)} style={{background:"transparent",border:"none",color:"#E07070",cursor:"pointer",fontSize:14,padding:"0 4px"}}>🗑️</button>
            </div>
          );})}
        </div>}

        {/* DIARY */}
        {activeTab==="diary"&&<div style={CARD}>
          <h3 style={{margin:"0 0 16px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>📓 Diário do Caso</h3>
          <div style={{background:"#0F0D0A",borderRadius:10,padding:16,marginBottom:20}}>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div><label style={L}>Data</label><input type="date" value={diaryDate} onChange={e=>setDiaryDate(e.target.value)} style={{...I,width:160}}/></div>
            </div>
            <label style={L}>Entrada</label>
            <textarea value={diaryText} onChange={e=>setDiaryText(e.target.value)} placeholder="Registre o que aconteceu nesta data..." style={{...I,minHeight:90,resize:"vertical",marginBottom:10}}/>
            <button style={B()} onClick={()=>addDiaryEntry(c.id)}>Salvar no Diário</button>
          </div>
          {Object.keys(diaryByDate).length===0&&<p style={{color:"#4A3E32",fontSize:13}}>Nenhuma entrada ainda.</p>}
          {Object.entries(diaryByDate).map(([date,entries])=>(
            <div key={date} style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{height:1,flex:1,background:"#2A2218"}}/>
                <span style={{fontSize:12,fontFamily:"monospace",color:"#C8A96E",fontWeight:700}}>{fmtDate(date)}</span>
                <div style={{height:1,flex:1,background:"#2A2218"}}/>
              </div>
              {entries.map(entry=>(
                <div key={entry.id} style={{marginBottom:8}}>
                  {editDiary?.id===entry.id?(
                    <div style={{display:"flex",gap:8}}>
                      <textarea value={editDiary.content} onChange={e=>setEditDiary({...editDiary,content:e.target.value})} style={{...I,flex:1,minHeight:70,resize:"vertical"}}/>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <button style={{...B(),fontSize:12,padding:"6px 12px"}} onClick={()=>updateDiary(entry.id,editDiary.content,c.id)}>✓</button>
                        <button style={{...G(),fontSize:12,padding:"6px 12px"}} onClick={()=>setEditDiary(null)}>✕</button>
                      </div>
                    </div>
                  ):(
                    <div style={{background:"#0F0D0A",borderRadius:8,padding:"12px 16px",lineHeight:1.7,fontSize:13,color:"#C8C0B5",borderLeft:"3px solid #C8A96E44",display:"flex",gap:10,alignItems:"flex-start"}}>
                      <span style={{flex:1}}>{entry.content}</span>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>setEditDiary({id:entry.id,content:entry.content})} style={{background:"transparent",border:"none",color:"#C8A96E",cursor:"pointer",fontSize:13}}>✏️</button>
                        {isAdmin&&<button onClick={()=>deleteDiary(entry.id,c.id)} style={{background:"transparent",border:"none",color:"#E07070",cursor:"pointer",fontSize:13}}>🗑️</button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>}

        {/* NOTES */}
        {activeTab==="notes"&&<div style={CARD}>
          <h3 style={{margin:"0 0 14px",fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Notas & Histórico</h3>
          <div style={{maxHeight:360,overflowY:"auto",marginBottom:14}}>
            {[...cn].reverse().map((n,i)=>(
              <div key={i} style={{marginBottom:8}}>
                {editNote?.id===n.id?(
                  <div style={{display:"flex",gap:8}}>
                    <textarea value={editNote.content} onChange={e=>setEditNote({...editNote,content:e.target.value})} style={{...I,flex:1,minHeight:60,resize:"vertical"}}/>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <button style={{...B(),fontSize:12,padding:"6px 12px"}} onClick={()=>updateNote(n.id,editNote.content,c.id)}>✓</button>
                      <button style={{...G(),fontSize:12,padding:"6px 12px"}} onClick={()=>setEditNote(null)}>✕</button>
                    </div>
                  </div>
                ):(
                  <div style={{fontSize:12,padding:"8px 12px",background:"#0F0D0A",borderRadius:6,lineHeight:1.6,color:n.content.includes("⇄")?"#B08FD4":"#B8B0A8",display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{flex:1}}>{n.content}</span>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>setEditNote({id:n.id,content:n.content})} style={{background:"transparent",border:"none",color:"#C8A96E",cursor:"pointer",fontSize:12}}>✏️</button>
                      {isAdmin&&<button onClick={()=>deleteNote(n.id,c.id)} style={{background:"transparent",border:"none",color:"#E07070",cursor:"pointer",fontSize:12}}>🗑️</button>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {cn.length===0&&<p style={{color:"#4A3E32",fontSize:13}}>Nenhuma nota ainda.</p>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input style={I} placeholder="Adicionar nota... (Enter para salvar)" value={noteText} onChange={e=>setNoteText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote(c.id)}/>
            <button style={B()} onClick={()=>addNote(c.id)}>+</button>
          </div>
        </div>}

        {/* TASKS */}
        {activeTab==="tasks"&&<div style={CARD}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 style={{margin:0,fontSize:12,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6A5E52"}}>Tarefas ({ct.filter(t=>!t.done).length} pendentes)</h3>
            <button style={{...G(),fontSize:12,padding:"6px 12px"}} onClick={()=>setShowAddTask(!showAddTask)}>+ Tarefa</button>
          </div>
          {showAddTask&&<div style={{background:"#0F0D0A",borderRadius:8,padding:12,marginBottom:12}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <input style={{...I,flex:2,minWidth:180}} placeholder="Título da tarefa..." value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/>
              <select style={{...I,flex:1,minWidth:130}} value={taskAssignee} onChange={e=>setTaskAssignee(e.target.value)}>
                <option value="">Responsável...</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
              </select>
              <input type="date" style={{...I,flex:1,minWidth:130}} value={taskDue} onChange={e=>setTaskDue(e.target.value)}/>
              <button style={B()} onClick={()=>addTask(c.id)}>Salvar</button>
            </div>
          </div>}
          {ct.length===0&&!showAddTask&&<p style={{color:"#4A3E32",fontSize:13}}>Nenhuma tarefa ainda.</p>}
          {ct.map(task=>{const tu=users.find(u=>u.id===task.assigned_to);return(
            <div key={task.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #1E1A16",opacity:task.done?0.4:1}}>
              <div onClick={()=>toggleTask(task.id,task.done)} style={{width:20,height:20,borderRadius:4,border:`2px solid ${task.done?"#A8C5A0":"#2A2218"}`,background:task.done?"#A8C5A020":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {task.done&&<span style={{color:"#A8C5A0",fontSize:11}}>✓</span>}
              </div>
              <span style={{flex:1,fontSize:13,textDecoration:task.done?"line-through":"none"}}>{task.title}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Avatar user={tu} size={20}/><span style={{fontSize:12,color:"#8A7E72"}}>{tu?.name.split(" ")[0]}</span></div>
              {task.due_date&&<DaysLeft date={task.due_date}/>}
              <button onClick={()=>deleteTask(task.id,c.id)} style={{background:"transparent",border:"none",color:"#E07070",cursor:"pointer",fontSize:14,padding:"0 4px"}}>🗑️</button>
            </div>
          );})}
        </div>}

        {/* WORKFLOW */}
        {activeTab==="workflow"&&<div style={CARD}>
          <WorkflowTracker
            caseType={c.case_type}
            currentStep={c.current_step||0}
            assignments={c.workflow_assignments||{}}
            users={users}
            notes={cn}
            currentUser={currentUser}
            onStepChange={step=>updateCase(c.id,{current_step:step})}
            onAssign={(step,userId)=>assignWorkflowStep(c.id,step,userId)}
            onAddNote={async text=>{
              const content=`[${new Date().toLocaleDateString("pt-BR")}] ${text}`;
              await supabase.from("notes").insert({case_id:c.id,content,created_by:currentUser?.id});
              await log(c.id,"Nota de workflow adicionada",content);
              loadAll();
            }}
          />
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button style={{...G(),fontSize:12}} disabled={!c.current_step} onClick={()=>updateCase(c.id,{current_step:Math.max(0,(c.current_step||0)-1)})}>← Etapa Anterior</button>
            <button style={{...B(),fontSize:12}} disabled={(c.current_step||0)>=(CASE_TYPES[c.case_type]?.steps.length-1)} onClick={()=>updateCase(c.id,{current_step:Math.min(CASE_TYPES[c.case_type].steps.length-1,(c.current_step||0)+1)})}>Próxima Etapa →</button>
          </div>
        </div>}
      </div>
    );
  };

  // ── TEAM VIEW ─────────────────────────────────────────────────────────────
  const TeamView = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <h1 style={{fontSize:26,fontWeight:800,margin:0}}>Equipe</h1>
        <button style={B()} onClick={()=>setShowTeamModal(true)}>+ Adicionar Membro</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {users.map(u=>(
          <div key={u.id} style={{...CARD,display:"flex",alignItems:"center",gap:16}}>
            <Avatar user={u} size={48}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700}}>{u.name}</div>
              <div style={{fontSize:12,color:"#6A5E52",marginBottom:6}}>{u.email}</div>
              <Badge label={u.role} color={u.is_attorney?"#C8A96E":"#7EAED4"}/>
            </div>
            {isAdmin&&u.id!==currentUser?.id&&(
              <button onClick={()=>deleteTeamMember(u.id)} style={{background:"transparent",border:"none",color:"#E07070",cursor:"pointer",fontSize:16}}>🗑️</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── TRANSFER MODAL ────────────────────────────────────────────────────────
  const TransferModal = () => {
    const [targetId, setTargetId] = useState("");
    const [reason, setReason] = useState("");
    if (!sc) return null;
    return (
      <Modal title="Transferir Caso" subtitle={`${sc.client_name} · ${sc.case_type}`} onClose={()=>setShowTransfer(false)} maxWidth={440}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={L}>Transferir para *</label>
            <select value={targetId} onChange={e=>setTargetId(e.target.value)} style={I}>
              <option value="">Selecionar advogado...</option>
              {users.filter(u=>u.is_attorney&&u.id!==sc.attorney_id).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div><label style={L}>Motivo *</label><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex: Conflito de agenda..." style={{...I,minHeight:80,resize:"vertical"}}/></div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...B(),flex:1}} onClick={()=>targetId&&reason&&handleTransfer(Number(targetId),reason)}>Confirmar</button>
            <button style={{...G(),flex:1}} onClick={()=>setShowTransfer(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    );
  };

  const isCase = view==="case";
  const navItems = [{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"cases",icon:"◉",label:"Casos",count:cases.length},{id:"team",icon:"◎",label:"Equipe",count:users.length}];

  return (
    <div style={{minHeight:"100vh",background:"#0F0D0A",fontFamily:"'DM Sans',sans-serif",color:"#E8E0D5"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      {/* SIDEBAR */}
      <div style={{position:"fixed",top:0,left:0,width:220,height:"100vh",background:"#1A1410",borderRight:"1px solid #2A2218",display:"flex",flexDirection:"column",padding:"24px 0",zIndex:100}}>
        <div style={{padding:"0 20px 20px",borderBottom:"1px solid #2A2218",marginBottom:10}}>
          <div style={{fontSize:11,fontFamily:"monospace",color:"#C8A96E",letterSpacing:"0.2em",textTransform:"uppercase"}}>ImmigrationOS</div>
          <div style={{fontSize:11,color:"#4A3E32",marginTop:2}}>Case Management</div>
        </div>
        {navItems.map(item=>(
          <div key={item.id} style={navS(view===item.id||(isCase&&item.id==="cases"))} onClick={()=>setView(item.id)}>
            <span>{item.icon}</span><span>{item.label}</span>
            {item.count!==undefined&&<span style={{marginLeft:"auto",background:"#2A2218",borderRadius:10,padding:"1px 7px",fontSize:11}}>{item.count}</span>}
          </div>
        ))}
        <div style={{marginTop:"auto",padding:"14px 20px",borderTop:"1px solid #2A2218"}}>
          {currentUser&&<div style={{display:"flex",alignItems:"center",gap:8}}><Avatar user={currentUser} size={28}/><div><div style={{fontSize:12,fontWeight:600}}>{currentUser.name}</div><div style={{fontSize:10,color:"#6A5E52"}}>{currentUser.role}</div></div></div>}
        </div>
      </div>
      {/* MAIN */}
      <div style={{marginLeft:220,padding:"32px 40px",minHeight:"100vh"}}>
        {view==="dashboard"&&<Dashboard/>}
        {view==="cases"&&<CasesList/>}
        {view==="team"&&<TeamView/>}
        {isCase&&sc&&<CaseDetail c={cases.find(c=>c.id===sc.id)}/>}
      </div>
      {/* MODALS */}
      {showNewCase&&<CaseFormModal users={users} onSave={handleNewCase} onClose={()=>setShowNewCase(false)} title="Novo Caso"/>}
      {showEditCase&&sc&&<CaseFormModal users={users} initial={sc} onSave={handleEditCase} onClose={()=>setShowEditCase(false)} title="Editar Caso"/>}
      {showTransfer&&<TransferModal/>}
      {showFamilyModal&&<FamilyModal initial={editFamilyItem||{}} onSave={handleAddFamily} onClose={()=>{setShowFamilyModal(false);setEditFamilyItem(null);}}/>}
      {showDeadlineModal&&<DeadlineModal users={users} onSave={handleAddDeadline} onClose={()=>setShowDeadlineModal(false)}/>}
      {showTeamModal&&<TeamMemberModal onSave={handleAddTeamMember} onClose={()=>setShowTeamModal(false)}/>}
      {showReports&&<ReportsModal cases={cases} users={users} tasks={tasks} deadlines={deadlines} onClose={()=>setShowReports(false)} onOpenCase={openCase}/>}
    </div>
  );
}
