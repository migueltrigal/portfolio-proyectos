import { useState, useMemo, useCallback, createContext, useContext } from "react";
import { LOGO_SRC } from "./logo.js";

/* ─── Brand Tokens ─── */
const C = {
  navy: "#0E2841",
  teal: "#267B8A",
  orange: "#E97132",
  gold: "#F5C518",
  white: "#FFFFFF",
  bg: "#F4F6F8",
  cardBg: "#FFFFFF",
  border: "#DDE3EA",
  borderLight: "#EEF1F5",
  textPrimary: "#0E2841",
  textSecondary: "#4A5E74",
  textMuted: "#8899AB",
};

const font = "'Aptos', 'Segoe UI', -apple-system, sans-serif";

/* ─── Auth Context ─── */
const AuthCtx = createContext({ isEditor: false });
const EDITOR_KEY = "innova2026";
function useAuth() { return useContext(AuthCtx); }

const PHASES = ["Ideación","Iniciación","Prototipado","Piloto","Implementación","Entrega","Seguimiento"];
const PHASE_INDEX = Object.fromEntries(PHASES.map((p, i) => [p, i]));
const STATUSES = ["En curso","En riesgo","Pausado","Completado"];
const STATUS_CONFIG = {
  "En curso":   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "●" },
  "En riesgo":  { color: C.orange, bg: "#FFF5EE", border: "#FDDCBE", icon: "▲" },
  "Pausado":    { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", icon: "❚❚" },
  "Completado": { color: C.teal, bg: "#EEF7F8", border: "#B8DDE2", icon: "✓" },
};

const INIT = [
  {
    id: 1, name: "Reto TSA — Seguridad en Alturas",
    description: "Desafío de innovación abierta para mejorar la seguridad en trabajo en alturas en operaciones de invernadero.",
    responsible: "Miguel Ángel", startDate: "2025-11-15", estimatedEnd: "2026-06-30",
    budget: 45000000, status: "En curso", phase: "Prototipado",
    advances: [
      { id: 1, date: "2026-04-10", title: "Cierre de convocatoria — 12 propuestas recibidas", description: "Se cerró la fase de recepción con 12 equipos de 4 universidades y 3 startups. Se conformó el comité evaluador.", nextStep: "Evaluar propuestas con rúbrica y seleccionar 3 finalistas para prototipado (abril 18).", registeredBy: "Miguel Ángel" },
      { id: 2, date: "2026-03-15", title: "Lanzamiento público del reto", description: "Brief publicado en LinkedIn, 6 universidades contactadas, 2 webinars con 85 asistentes.", nextStep: "Monitorear inscripciones hasta cierre.", registeredBy: "Miguel Ángel" },
      { id: 3, date: "2026-02-01", title: "Brief finalizado y aprobado", description: "Documento con criterios, premios, cronograma. Aprobado por Gerencia y HSEQ.", nextStep: "Diseñar piezas de comunicación.", registeredBy: "Miguel Ángel" },
    ],
    contracts: [
      { id: 101, provider: "Estudio Creativo SAS", concept: "Diseño piezas gráficas y pauta digital", value: 3700000, payments: [{ id: 1001, date: "2026-03-10", amount: 1200000, note: "Anticipo diseño" },{ id: 1002, date: "2026-03-14", amount: 2500000, note: "Pauta LinkedIn y Facebook" }]},
      { id: 102, provider: "Zoom", concept: "Plataforma webinar (1 mes)", value: 180000, payments: [{ id: 1003, date: "2026-03-15", amount: 180000, note: "Pago único" }]},
      { id: 103, provider: "Catering Express", concept: "Refrigerios comité evaluador", value: 200000, payments: [{ id: 1004, date: "2026-04-05", amount: 95000, note: "Primera sesión" }]},
    ],
  },
  {
    id: 2, name: "Optimización Esqueje Crisantemo",
    description: "Eliminar errores en producción de esquejes y reducir tiempos de empaque. Meta: cero-defectos y -20% packing.",
    responsible: "Laura Gómez", startDate: "2026-01-10", estimatedEnd: "2026-08-30",
    budget: 28000000, status: "En curso", phase: "Piloto",
    advances: [
      { id: 1, date: "2026-04-08", title: "Piloto nuevo layout mesa #3", description: "Separadores por variedad y verificación visual. -12% tiempo, 0 errores en 3 días.", nextStep: "Correr piloto 2 semanas para validar consistencia.", registeredBy: "Laura Gómez" },
      { id: 2, date: "2026-03-01", title: "Diagnóstico de errores completado", description: "450 registros: 68% confusión variedades, 22% conteo incorrecto.", nextStep: "Diseñar 3 prototipos anti-error.", registeredBy: "Laura Gómez" },
    ],
    contracts: [{ id: 201, provider: "Ferretería Industrial", concept: "Materiales prototipo y señalización", value: 1000000, payments: [{ id: 2001, date: "2026-02-15", amount: 340000, note: "Separadores" },{ id: 2002, date: "2026-03-20", amount: 520000, note: "Señalización visual" }]}],
  },
  {
    id: 3, name: "Automatización Riego Invernadero B4",
    description: "Sistema de riego automatizado con sensores IoT en invernadero B4 como piloto.",
    responsible: "Andrés Mejía", startDate: "2025-09-01", estimatedEnd: "2026-03-30",
    budget: 62000000, status: "En riesgo", phase: "Implementación",
    advances: [
      { id: 1, date: "2026-03-28", title: "Retraso en controladores", description: "Proveedor con 6 semanas de retraso. Evaluando alternativas nacionales.", nextStep: "Reunión Electrosistemas abril 2.", registeredBy: "Andrés Mejía" },
      { id: 2, date: "2026-03-10", title: "Sensores instalados 100%", description: "48 sensores en 12 camas, calibrados y transmitiendo.", nextStep: "Instalar controladores.", registeredBy: "Andrés Mejía" },
    ],
    contracts: [
      { id: 301, provider: "AgroSensors Ltda", concept: "48 sensores + gateway LoRaWAN", value: 14000000, payments: [{ id: 3001, date: "2025-10-15", amount: 8400000, note: "Sensores" },{ id: 3002, date: "2025-11-20", amount: 4200000, note: "Gateway + 4G" }]},
      { id: 302, provider: "ElectroInstalaciones", concept: "Cableado e instalación", value: 10000000, payments: [{ id: 3003, date: "2026-01-10", amount: 6800000, note: "Cableado" },{ id: 3004, date: "2026-02-28", amount: 3200000, note: "Mano de obra" }]},
      { id: 303, provider: "ControlTech Import", concept: "Controladores de válvulas", value: 24000000, payments: [{ id: 3005, date: "2026-03-05", amount: 12000000, note: "Anticipo 50%" }]},
    ],
  },
  {
    id: 4, name: "App Registro Fitosanitario",
    description: "App móvil para reemplazar registros fitosanitarios en papel.",
    responsible: "Miguel Ángel", startDate: "2026-02-15", estimatedEnd: "",
    budget: null, status: "En curso", phase: "Iniciación",
    advances: [{ id: 1, date: "2026-04-01", title: "Wireframes aprobados", description: "Presentados a 4 jefes de finca. Feedback incorporado.", nextStep: "Iniciar desarrollo MVP con modo offline.", registeredBy: "Miguel Ángel" }],
    contracts: [{ id: 401, provider: "Figma Inc.", concept: "Licencia Figma (mensual)", value: 225000, payments: [{ id: 4001, date: "2026-03-01", amount: 75000, note: "Marzo" },{ id: 4002, date: "2026-04-01", amount: 75000, note: "Abril" }]}],
  },
  {
    id: 5, name: "Rediseño Cuarto Frío Finca Principal",
    description: "Rediseño layout y refrigeración para +30% capacidad y mejor uniformidad térmica.",
    responsible: "Carlos Rodríguez", startDate: "2025-08-01", estimatedEnd: "2026-02-28",
    budget: 95000000, status: "Completado", phase: "Seguimiento",
    advances: [
      { id: 1, date: "2026-02-25", title: "Entregado — capacidad +34%", description: "+34% capacidad, variación <0.5°C.", nextStep: "Monitoreo 3 meses.", registeredBy: "Carlos Rodríguez" },
      { id: 2, date: "2026-01-30", title: "Refrigeración instalada", description: "3 evaporadores + control digital. Arranque OK.", nextStep: "Pruebas de estrés 1 semana.", registeredBy: "Carlos Rodríguez" },
    ],
    contracts: [
      { id: 501, provider: "Ing. Térmicos", concept: "Diseño ingeniería", value: 8500000, payments: [{ id: 5001, date: "2025-09-10", amount: 8500000, note: "Pago único" }]},
      { id: 502, provider: "ConstruFrío SAS", concept: "Obra civil", value: 22000000, payments: [{ id: 5002, date: "2025-10-20", amount: 22000000, note: "Pago único" }]},
      { id: 503, provider: "RefriEquipos", concept: "Evaporadores + control + instalación", value: 55000000, payments: [{ id: 5003, date: "2025-12-15", amount: 35000000, note: "Evaporadores" },{ id: 5004, date: "2026-01-10", amount: 6800000, note: "Control digital" },{ id: 5005, date: "2026-01-25", amount: 12500000, note: "Instalación" }]},
      { id: 504, provider: "Metálicas JR", concept: "Estanterías", value: 8200000, payments: [{ id: 5006, date: "2026-02-15", amount: 8200000, note: "Pago único" }]},
    ],
  },
];

const fmt = n => "$" + n.toLocaleString("es-CO");
const fmtS = n => n == null ? "—" : "$" + (n >= 1e6 ? (n/1e6).toFixed(1)+"M" : (n/1e3).toFixed(0)+"K");
const fmtD = d => { if (!d) return "—"; const dt = new Date(d+"T12:00:00"); const m=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]; return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`; };
const sumPay = cs => cs.reduce((s,c) => s + c.payments.reduce((ss,p) => ss + p.amount, 0), 0);
const sumVal = cs => cs.reduce((s,c) => s + c.value, 0);

const inp = { width:"100%",padding:"10px 12px",borderRadius:6,fontSize:13,border:`1px solid ${C.border}`,fontFamily:font,fontWeight:500,color:C.textPrimary,background:C.white,outline:"none",boxSizing:"border-box" };
const lbl = { fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,display:"block",marginBottom:5 };
const btnP = { padding:"10px 24px",borderRadius:6,border:"none",cursor:"pointer",background:C.navy,color:C.white,fontWeight:700,fontSize:13,fontFamily:font };
const btnS = { padding:"10px 24px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,color:C.textSecondary,fontWeight:700,fontSize:13,fontFamily:font,cursor:"pointer" };

/* ─── Auth Bar ─── */
function AuthBar({ isEditor, onLogin, onLogout }) {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  if (isEditor) return (
    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
      <span style={{ fontSize:10,fontWeight:700,color:"#16a34a",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"4px 10px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>● Editor</span>
      <button onClick={onLogout} style={{ background:"none",border:"none",fontSize:11,color:C.textMuted,cursor:"pointer",fontFamily:font,fontWeight:600,textDecoration:"underline" }}>Salir</button>
    </div>
  );
  if (show) return (
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      <input type="password" placeholder="Clave" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>{if(e.key==="Enter"){if(pw===EDITOR_KEY){onLogin();setShow(false);setPw("");}else setErr(true);}}} style={{...inp,width:130,padding:"6px 10px",fontSize:12,borderColor:err?"#dc2626":C.border}} autoFocus/>
      <button onClick={()=>{if(pw===EDITOR_KEY){onLogin();setShow(false);setPw("");}else setErr(true);}} style={{...btnP,padding:"6px 14px",fontSize:11}}>Entrar</button>
      <button onClick={()=>{setShow(false);setPw("");setErr(false);}} style={{background:"none",border:"none",fontSize:16,color:C.textMuted,cursor:"pointer",lineHeight:1}}>✕</button>
    </div>
  );
  return <button onClick={()=>setShow(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",fontSize:10,fontWeight:700,color:C.textMuted,cursor:"pointer",fontFamily:font}}>🔑 Acceso editor</button>;
}

/* ─── Shared ─── */
function PhaseStepper({currentPhase,compact=false}){
  const idx=PHASE_INDEX[currentPhase]??0;
  if(compact) return(
    <div style={{display:"flex",alignItems:"center",gap:3}}>
      {PHASES.map((p,i)=>(
        <div key={p} title={p} style={{width:i===idx?"auto":8,height:8,borderRadius:i===idx?4:"50%",padding:i===idx?"0 8px":0,background:i<=idx?C.teal:"#D1D9E6",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {i===idx&&<span style={{fontSize:9,fontWeight:700,color:C.white,whiteSpace:"nowrap"}}>{p}</span>}
        </div>
      ))}
    </div>
  );
  return(
    <div style={{display:"flex",alignItems:"center",width:"100%"}}>
      {PHASES.map((p,i)=>{const done=i<idx,active=i===idx;return(
        <div key={p} style={{display:"flex",alignItems:"center",flex:i<PHASES.length-1?1:"none"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
            <div style={{width:active?28:16,height:active?28:16,borderRadius:"50%",background:done||active?C.teal:"#E8ECF2",border:active?`3px solid ${C.teal}44`:"none",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?`0 0 0 4px ${C.teal}15`:"none"}}>
              {done&&<span style={{color:C.white,fontSize:9,fontWeight:800}}>✓</span>}
              {active&&<span style={{color:C.white,fontSize:8,fontWeight:800}}>{i+1}</span>}
              {!done&&!active&&<span style={{color:"#94a3b8",fontSize:7,fontWeight:700}}>{i+1}</span>}
            </div>
            <span style={{fontSize:8,fontWeight:active?800:600,color:done||active?C.teal:C.textMuted,marginTop:4,whiteSpace:"nowrap"}}>{p}</span>
          </div>
          {i<PHASES.length-1&&<div style={{flex:1,height:2,minWidth:6,background:done?C.teal:"#E2E8F0",margin:"0 2px",marginBottom:16}}/>}
        </div>
      );})}
    </div>
  );
}

function Section({title,accent,action,children,style:sx}){return(
  <div style={{background:C.cardBg,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden",...sx}}>
    {title&&<div style={{padding:"13px 24px",borderBottom:`1px solid ${C.border}`,background:"#F7F9FB",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {accent&&<div style={{width:3,height:16,borderRadius:2,background:accent}}/>}
        <h3 style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textSecondary,fontFamily:font}}>{title}</h3>
      </div>{action}
    </div>}{children}
  </div>
);}

function Modal({title,onClose,children}){return(
  <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(14,40,65,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 24px 64px rgba(14,40,65,0.20)",width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto"}}>
      <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.white,zIndex:1,borderRadius:"12px 12px 0 0"}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700,color:C.navy,fontFamily:font}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:C.textMuted,cursor:"pointer",padding:4,lineHeight:1}}>✕</button>
      </div>
      <div style={{padding:"20px 24px"}}>{children}</div>
    </div>
  </div>
);}

/* ─── Forms (compact) ─── */
function CreateProjectForm({onSave,onCancel}){const[f,sF]=useState({name:"",description:"",responsible:"",startDate:"",estimatedEnd:"",budget:"",status:"En curso",phase:"Ideación"});const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.name&&f.responsible&&f.startDate;return(<Modal title="Nuevo proyecto" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Nombre *</label><input style={inp} value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Ej: Automatización de riego"/></div><div><label style={lbl}>Descripción</label><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Responsable *</label><input style={inp} value={f.responsible} onChange={e=>s("responsible",e.target.value)}/></div><div><label style={lbl}>Presupuesto (COP)</label><input style={inp} type="number" value={f.budget} onChange={e=>s("budget",e.target.value)} placeholder="Opcional"/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Fecha inicio *</label><input style={inp} type="date" value={f.startDate} onChange={e=>s("startDate",e.target.value)}/></div><div><label style={lbl}>Fecha est. terminación</label><input style={inp} type="date" value={f.estimatedEnd} onChange={e=>s("estimatedEnd",e.target.value)}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Estado</label><select style={inp} value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div><div><label style={lbl}>Fase</label><select style={inp} value={f.phase} onChange={e=>s("phase",e.target.value)}>{PHASES.map(x=><option key={x}>{x}</option>)}</select></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={()=>onSave({id:Date.now(),name:f.name,description:f.description,responsible:f.responsible,startDate:f.startDate,estimatedEnd:f.estimatedEnd||"",budget:f.budget?Number(f.budget):null,status:f.status,phase:f.phase,advances:[],contracts:[]})}>Crear</button></div></div></Modal>);}

function EditProjectForm({project:p,onSave,onCancel}){const[f,sF]=useState({name:p.name,description:p.description,responsible:p.responsible,estimatedEnd:p.estimatedEnd,budget:p.budget!=null?String(p.budget):"",status:p.status,phase:p.phase});const s=(k,v)=>sF(x=>({...x,[k]:v}));return(<Modal title="Editar proyecto" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Nombre</label><input style={inp} value={f.name} onChange={e=>s("name",e.target.value)}/></div><div><label style={lbl}>Descripción</label><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Responsable</label><input style={inp} value={f.responsible} onChange={e=>s("responsible",e.target.value)}/></div><div><label style={lbl}>Presupuesto (COP)</label><input style={inp} type="number" value={f.budget} onChange={e=>s("budget",e.target.value)} placeholder="Opcional"/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}><div><label style={lbl}>Fecha est. fin</label><input style={inp} type="date" value={f.estimatedEnd} onChange={e=>s("estimatedEnd",e.target.value)}/></div><div><label style={lbl}>Estado</label><select style={inp} value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div><div><label style={lbl}>Fase</label><select style={inp} value={f.phase} onChange={e=>s("phase",e.target.value)}>{PHASES.map(x=><option key={x}>{x}</option>)}</select></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={btnP} onClick={()=>onSave({...p,...f,budget:f.budget?Number(f.budget):null})}>Guardar</button></div></div></Modal>);}

function AddAdvanceForm({onSave,onCancel}){const[f,sF]=useState({title:"",description:"",nextStep:"",date:new Date().toISOString().split("T")[0],registeredBy:""});const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.title&&f.nextStep&&f.date&&f.registeredBy;return(<Modal title="Registrar avance" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Título *</label><input style={inp} value={f.title} onChange={e=>s("title",e.target.value)}/></div><div><label style={lbl}>Descripción</label><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></div><div><label style={lbl}>Próximo paso *</label><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={f.nextStep} onChange={e=>s("nextStep",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></div><div><label style={lbl}>Registrado por *</label><input style={inp} value={f.registeredBy} onChange={e=>s("registeredBy",e.target.value)}/></div></div><div style={{padding:"14px 16px",background:C.bg,borderRadius:6,border:`1px dashed ${C.border}`,textAlign:"center",color:C.textMuted,fontSize:12,fontWeight:600}}>📷 Foto evidencia (próximamente)</div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={()=>onSave({id:Date.now(),...f})}>Guardar</button></div></div></Modal>);}

function AddContractForm({onSave,onCancel}){const[f,sF]=useState({provider:"",concept:"",value:""});const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.provider&&f.concept&&f.value;return(<Modal title="Nuevo contrato / ODS" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Proveedor *</label><input style={inp} value={f.provider} onChange={e=>s("provider",e.target.value)}/></div><div><label style={lbl}>Concepto *</label><input style={inp} value={f.concept} onChange={e=>s("concept",e.target.value)}/></div><div><label style={lbl}>Valor (COP) *</label><input style={inp} type="number" value={f.value} onChange={e=>s("value",e.target.value)}/></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={()=>onSave({id:Date.now(),provider:f.provider,concept:f.concept,value:Number(f.value),payments:[]})}>Crear</button></div></div></Modal>);}

function AddPaymentForm({contract,onSave,onCancel}){const[f,sF]=useState({amount:"",date:new Date().toISOString().split("T")[0],note:""});const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.amount&&f.date;return(<Modal title={`Pago — ${contract.provider}`} onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{padding:"12px 16px",background:"#F7F9FB",borderRadius:6,border:`1px solid ${C.borderLight}`}}><p style={{margin:"0 0 2px",...lbl}}>Contrato</p><p style={{margin:0,fontSize:13,fontWeight:700,color:C.navy}}>{contract.concept}</p><p style={{margin:"4px 0 0",fontSize:12,color:C.textSecondary}}>Valor: {fmt(contract.value)} · Pagado: {fmt(contract.payments.reduce((s,p)=>s+p.amount,0))}</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Monto (COP) *</label><input style={inp} type="number" value={f.amount} onChange={e=>s("amount",e.target.value)}/></div><div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></div></div><div><label style={lbl}>Nota</label><input style={inp} value={f.note} onChange={e=>s("note",e.target.value)} placeholder="Ej: Anticipo 50%"/></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={()=>onSave({id:Date.now(),amount:Number(f.amount),date:f.date,note:f.note})}>Registrar</button></div></div></Modal>);}

/* ─── Contract Block ─── */
function ContractBlock({contract,onAddPayment}){
  const{isEditor}=useAuth();const paid=contract.payments.reduce((s,p)=>s+p.amount,0);const pct=Math.min((paid/contract.value)*100,100);const pending=contract.value-paid;const[open,setOpen]=useState(false);
  return(
    <div style={{border:`1px solid ${C.borderLight}`,borderRadius:8,overflow:"hidden",marginBottom:10}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",background:open?"#F7F9FB":C.white}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:C.navy}}>{contract.provider}</span><span style={{fontSize:10,color:C.textMuted}}>·</span><span style={{fontSize:11,color:C.textSecondary,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{contract.concept}</span></div>
          <div style={{display:"flex",gap:16,fontSize:11,fontWeight:700,flexWrap:"wrap"}}><span style={{color:C.textSecondary}}>Valor: {fmt(contract.value)}</span><span style={{color:C.teal}}>Pagado: {fmt(paid)}</span><span style={{color:pending>0?C.orange:"#16a34a"}}>Pendiente: {fmt(pending)}</span></div>
          <div style={{height:4,background:C.borderLight,borderRadius:3,marginTop:8}}><div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:pct>=100?"#16a34a":C.teal}}/></div>
        </div>
        <span style={{fontSize:16,color:C.textMuted,marginLeft:12,transform:open?"rotate(180deg)":"",transition:"transform 0.2s"}}>▾</span>
      </div>
      {open&&<div style={{borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 120px",padding:"8px 18px",background:"#F7F9FB",borderBottom:`1px solid ${C.borderLight}`}}>
          {["Fecha","Nota","Monto"].map((h,i)=><span key={h} style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textMuted,textAlign:i===2?"right":"left"}}>{h}</span>)}
        </div>
        {contract.payments.map(pay=>(
          <div key={pay.id} style={{display:"grid",gridTemplateColumns:"100px 1fr 120px",padding:"10px 18px",borderBottom:`1px solid ${C.bg}`,alignItems:"center"}}>
            <span style={{fontSize:11,color:C.textSecondary,fontWeight:600}}>{fmtD(pay.date)}</span>
            <span style={{fontSize:12,color:C.textPrimary,fontWeight:500}}>{pay.note||"—"}</span>
            <span style={{fontSize:12,fontWeight:700,color:C.navy,textAlign:"right"}}>{fmt(pay.amount)}</span>
          </div>
        ))}
        {contract.payments.length===0&&<p style={{padding:16,textAlign:"center",color:C.textMuted,fontSize:12}}>Sin pagos.</p>}
        {isEditor&&<div style={{padding:"10px 18px",background:"#F7F9FB",borderTop:`1px solid ${C.borderLight}`}}><button onClick={e=>{e.stopPropagation();onAddPayment(contract);}} style={{...btnP,fontSize:11,padding:"7px 16px",background:C.teal}}>+ Registrar pago</button></div>}
      </div>}
    </div>
  );
}

/* ─── Card ─── */
function ProjectCard({project:p,onClick}){
  const sc=STATUS_CONFIG[p.status];const paid=sumPay(p.contracts);const lastAdv=p.advances[0];const hasBudget=p.budget!=null;const budgetPct=hasBudget?Math.min((paid/p.budget)*100,100):0;
  return(
    <div onClick={onClick} style={{background:C.cardBg,borderRadius:10,cursor:"pointer",border:`1px solid ${C.border}`,overflow:"hidden",transition:"all 0.3s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 36px ${C.navy}18`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
      <div style={{height:4,background:sc.color}}/>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,padding:"3px 9px",borderRadius:4}}>{sc.icon} {p.status}</span>
          <span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{lastAdv?fmtD(lastAdv.date):"Sin avances"}</span>
        </div>
        <h3 style={{fontSize:14,fontWeight:700,color:C.navy,margin:"0 0 3px",lineHeight:1.3}}>{p.name}</h3>
        <p style={{fontSize:11,color:C.textSecondary,margin:0,fontWeight:600}}>{p.responsible}</p>
      </div>
      <div style={{height:1,background:C.borderLight}}/>
      <div style={{padding:"12px 18px"}}><PhaseStepper currentPhase={p.phase} compact/></div>
      <div style={{height:1,background:C.borderLight}}/>
      <div style={{padding:"12px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700,color:C.textSecondary,marginBottom:5}}><span>{fmtS(paid)} pagado</span><span>{hasBudget?`de ${fmtS(p.budget)}`:`${p.contracts.length} contratos`}</span></div>
        {hasBudget&&<div style={{height:4,background:C.borderLight,borderRadius:3}}><div style={{height:"100%",borderRadius:3,width:`${budgetPct}%`,background:budgetPct>90?"#dc2626":budgetPct>70?C.orange:C.teal}}/></div>}
      </div>
      <div style={{height:1,background:C.borderLight}}/>
      {lastAdv&&<div style={{padding:"12px 18px 16px"}}><p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>Próximo paso</p><p style={{fontSize:11,color:C.textPrimary,margin:0,lineHeight:1.5,fontWeight:500,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{lastAdv.nextStep}</p></div>}
    </div>
  );
}

/* ─── Detail ─── */
function ProjectDetail({project:p,onBack,onEdit,onAddAdvance,onAddContract,onAddPayment}){
  const{isEditor}=useAuth();const[tab,setTab]=useState("timeline");const sc=STATUS_CONFIG[p.status];
  const paid=sumPay(p.contracts);const contracted=sumVal(p.contracts);const lastAdv=p.advances[0];const hasBudget=p.budget!=null;
  return(
    <div style={{maxWidth:840,margin:"0 auto"}}>
      <button onClick={onBack} style={{...btnS,fontSize:12,padding:"8px 18px",marginBottom:16}}>← Proyectos</button>
      <Section title="Información general" accent={sc.color} action={isEditor?<button onClick={onEdit} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:700,color:C.textSecondary,cursor:"pointer",fontFamily:font}}>✎ Editar</button>:null} style={{marginBottom:16}}>
        <div style={{padding:"24px 24px 0"}}><div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:250}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,padding:"4px 10px",borderRadius:4}}>{sc.icon} {p.status}</span>
              <span style={{fontSize:10,fontWeight:700,color:C.teal,background:"#EEF7F8",padding:"4px 10px",borderRadius:4,textTransform:"uppercase"}}>Fase: {p.phase}</span>
            </div>
            <h1 style={{fontSize:21,fontWeight:700,color:C.navy,margin:"0 0 6px",lineHeight:1.25}}>{p.name}</h1>
            <p style={{fontSize:12,color:C.textSecondary,margin:"0 0 12px",fontWeight:600}}>Responsable: {p.responsible}</p>
            <p style={{fontSize:13,color:C.textPrimary,margin:0,lineHeight:1.6}}>{p.description}</p>
          </div>
          <div style={{width:160,height:120,borderRadius:6,flexShrink:0,background:C.bg,border:`1px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:C.textMuted,fontSize:11,fontWeight:700,textAlign:"center",padding:12}}>📷<br/>Foto principal</div>
        </div></div>
        <div style={{height:1,background:C.borderLight,margin:"22px 0 0"}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))"}}>
          {[{label:"Inicio",value:fmtD(p.startDate)},{label:"Fin estimado",value:fmtD(p.estimatedEnd)},...(hasBudget?[{label:"Presupuesto",value:fmtS(p.budget)}]:[]),{label:"Contratado",value:fmtS(contracted)},{label:"Pagado",value:fmtS(paid),accent:hasBudget&&paid>p.budget?"#dc2626":null},{label:"Últ. actualización",value:lastAdv?fmtD(lastAdv.date):"—"}].map((s,i)=>(
            <div key={i} style={{padding:"14px 18px",borderRight:`1px solid ${C.borderLight}`,borderBottom:`1px solid ${C.borderLight}`}}>
              <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>{s.label}</p>
              <p style={{fontSize:16,fontWeight:700,color:s.accent||C.navy,margin:0}}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{padding:"18px 24px"}}><PhaseStepper currentPhase={p.phase}/></div>
      </Section>
      {lastAdv&&<Section title="Próximo paso" accent={C.orange} style={{marginBottom:16}}><div style={{padding:"16px 24px",display:"flex",gap:14,alignItems:"flex-start"}}><div style={{width:30,height:30,borderRadius:6,flexShrink:0,background:"#FFF5EE",border:`1px solid #FDDCBE`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.orange,fontWeight:800}}>→</div><p style={{fontSize:13,color:C.navy,margin:0,lineHeight:1.55,fontWeight:600}}>{lastAdv.nextStep}</p></div></Section>}
      {/* Tabs */}
      <div style={{display:"flex",marginBottom:16,background:C.white,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        {[{key:"timeline",label:"Avances",count:p.advances.length},{key:"finance",label:"Contratos y pagos",count:p.contracts.length}].map((t,i)=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,padding:"12px 20px",borderRight:i===0?`1px solid ${C.border}`:"none",background:tab===t.key?C.navy:C.white,color:tab===t.key?C.white:C.textSecondary,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:font,border:"none",textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.label} · {t.count}</button>
        ))}
      </div>
      {/* Timeline */}
      {tab==="timeline"&&<>{isEditor&&<button onClick={onAddAdvance} style={{...btnP,marginBottom:16,fontSize:12}}>+ Registrar avance</button>}
        <div style={{position:"relative",paddingLeft:30}}><div style={{position:"absolute",left:10,top:10,bottom:10,width:2,background:C.border}}/>
          {p.advances.map((adv,i)=>(
            <div key={adv.id} style={{position:"relative",marginBottom:16}}>
              <div style={{position:"absolute",left:-25,top:24,width:i===0?16:10,height:i===0?16:10,borderRadius:"50%",background:i===0?C.teal:"#C5CDD8",border:`3px solid ${C.bg}`,boxShadow:i===0?`0 0 0 3px ${C.teal}20`:"none",transform:i===0?"translate(-3px,-3px)":""}}/>
              <Section><div style={{padding:"10px 20px",background:i===0?"#EEF7F8":"#F7F9FB",borderBottom:`1px solid ${C.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,fontWeight:700,color:i===0?C.teal:C.textSecondary}}>{fmtD(adv.date)}</span><span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{adv.registeredBy}</span></div>
                <div style={{padding:"16px 20px"}}><h4 style={{fontSize:13,fontWeight:700,color:C.navy,margin:"0 0 8px",lineHeight:1.35}}>{adv.title}</h4><p style={{fontSize:12,color:C.textSecondary,margin:"0 0 14px",lineHeight:1.6}}>{adv.description}</p><div style={{width:"100%",height:130,borderRadius:6,background:C.bg,border:`1px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:C.textMuted,fontSize:11,fontWeight:700}}>📷 Foto evidencia</div></div>
                <div style={{padding:"12px 20px",background:"#F7F9FB",borderTop:`1px solid ${C.borderLight}`}}><p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>Próximo paso</p><p style={{fontSize:11,color:C.textPrimary,margin:0,lineHeight:1.5,fontWeight:600}}>{adv.nextStep}</p></div>
              </Section>
            </div>
          ))}
          {p.advances.length===0&&<p style={{color:C.textMuted,fontSize:13,padding:"20px 0"}}>No hay avances.</p>}
        </div>
      </>}
      {/* Finance */}
      {tab==="finance"&&<>
        <Section title="Resumen financiero" accent={C.teal} style={{marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:hasBudget?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr"}}>
            {[...(hasBudget?[{label:"Presupuesto",value:fmt(p.budget),color:C.navy}]:[]),{label:"Contratado",value:fmt(contracted),color:C.textSecondary},{label:"Pagado",value:fmt(paid),color:C.teal},{label:"Pendiente",value:fmt(contracted-paid),color:contracted-paid>0?C.orange:"#16a34a"}].map((s,i,arr)=>(
              <div key={i} style={{padding:"16px 20px",textAlign:"center",borderRight:i<arr.length-1?`1px solid ${C.borderLight}`:"none"}}>
                <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>{s.label}</p>
                <p style={{fontSize:17,fontWeight:700,color:s.color,margin:0}}>{s.value}</p>
              </div>
            ))}
          </div>
          {hasBudget&&<div style={{padding:"12px 20px",borderTop:`1px solid ${C.borderLight}`}}>
            <div style={{display:"flex",gap:4,marginBottom:4}}>
              <div style={{height:6,borderRadius:3,background:C.teal,flex:`${paid/p.budget*100} 0 0`}}/>
              <div style={{height:6,borderRadius:3,background:`${C.teal}44`,flex:`${(contracted-paid)/p.budget*100} 0 0`}}/>
              <div style={{height:6,borderRadius:3,background:C.borderLight,flex:`${Math.max(p.budget-contracted,0)/p.budget*100} 0 0`}}/>
            </div>
            <div style={{display:"flex",gap:16,fontSize:10,fontWeight:600,color:C.textSecondary}}>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:C.teal,marginRight:4,verticalAlign:"middle"}}/>Pagado</span>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:`${C.teal}44`,marginRight:4,verticalAlign:"middle"}}/>Contratado</span>
              <span><span style={{display:"inline-block",width:8,height:8,borderRadius:2,background:C.borderLight,marginRight:4,verticalAlign:"middle"}}/>Disponible</span>
            </div>
          </div>}
        </Section>
        {isEditor&&<button onClick={onAddContract} style={{...btnP,marginBottom:16,fontSize:12,background:C.teal}}>+ Nuevo contrato / ODS</button>}
        {p.contracts.map(c=><ContractBlock key={c.id} contract={c} onAddPayment={onAddPayment}/>)}
        {p.contracts.length===0&&<p style={{color:C.textMuted,fontSize:13,textAlign:"center",padding:20}}>No hay contratos.</p>}
      </>}
    </div>
  );
}

/* ─── App ─── */
export default function App(){
  const[projects,setProjects]=useState(INIT);const[selId,setSelId]=useState(null);const[filter,setFilter]=useState("Todos");const[modal,setModal]=useState(null);const[payContract,setPayContract]=useState(null);const[isEditor,setIsEditor]=useState(false);
  const sel=projects.find(p=>p.id===selId)||null;
  const filtered=useMemo(()=>filter==="Todos"?projects:projects.filter(p=>p.status===filter),[filter,projects]);
  const stats=useMemo(()=>({total:projects.length,risk:projects.filter(p=>p.status==="En riesgo").length,budget:projects.reduce((s,p)=>s+(p.budget||0),0),spent:projects.reduce((s,p)=>s+sumPay(p.contracts),0)}),[projects]);
  const updateProj=useCallback(u=>{setProjects(ps=>ps.map(p=>p.id===u.id?u:p));setModal(null);},[]);
  const addAdvance=useCallback(a=>{setProjects(ps=>ps.map(p=>p.id===selId?{...p,advances:[a,...p.advances]}:p));setModal(null);},[selId]);
  const addContract=useCallback(c=>{setProjects(ps=>ps.map(p=>p.id===selId?{...p,contracts:[...p.contracts,c]}:p));setModal(null);},[selId]);
  const addPayment=useCallback((cId,pay)=>{setProjects(ps=>ps.map(p=>p.id===selId?{...p,contracts:p.contracts.map(c=>c.id===cId?{...c,payments:[...c.payments,pay]}:c)}:p));setModal(null);setPayContract(null);},[selId]);

  const content=sel?(
    <ProjectDetail project={sel} onBack={()=>{setSelId(null);setModal(null);}} onEdit={()=>setModal("edit")} onAddAdvance={()=>setModal("advance")} onAddContract={()=>setModal("contract")} onAddPayment={c=>{setPayContract(c);setModal("payment");}}/>
  ):(
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <img src={LOGO_SRC} alt="I+D" style={{height:48}}/>
            <div>
              <p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:C.textMuted,margin:"0 0 2px"}}>Innovación y Transformación Digital</p>
              <h1 style={{fontSize:22,fontWeight:700,color:C.navy,margin:0,letterSpacing:"-0.01em"}}>Portafolio de Proyectos</h1>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <AuthBar isEditor={isEditor} onLogin={()=>setIsEditor(true)} onLogout={()=>setIsEditor(false)}/>
            {isEditor&&<button onClick={()=>setModal("create")} style={{...btnP,fontSize:12}}>+ Nuevo proyecto</button>}
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"flex",background:C.white,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:16}}>
          {[{label:"Proyectos",value:stats.total},{label:"En riesgo",value:stats.risk,accent:stats.risk>0?C.orange:null},{label:"Presupuesto total",value:fmtS(stats.budget)},{label:"Total pagado",value:fmtS(stats.spent)}].map((s,i)=>(
            <div key={i} style={{flex:1,padding:"14px 18px",borderRight:i<3?`1px solid ${C.borderLight}`:"none"}}>
              <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 2px"}}>{s.label}</p>
              <p style={{fontSize:20,fontWeight:700,color:s.accent||C.navy,margin:0}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["Todos","En curso","En riesgo","Pausado","Completado"].map(f=>{const a=filter===f;const cfg=f!=="Todos"?STATUS_CONFIG[f]:null;return(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${a?C.navy:C.border}`,background:a?C.navy:C.white,color:a?C.white:C.textSecondary,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:font}}>{cfg?cfg.icon+" ":""}{f}</button>
          );})}
        </div>
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:14}}>
        {filtered.map(p=><ProjectCard key={p.id} project={p} onClick={()=>setSelId(p.id)}/>)}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:60,color:C.textMuted,fontSize:13}}>No hay proyectos con estado "{filter}"</div>}

      {/* Bottom accent bar */}
      <div style={{display:"flex",height:4,borderRadius:2,marginTop:32,overflow:"hidden"}}>
        <div style={{flex:3,background:C.navy}}/><div style={{flex:1,background:C.orange}}/>
      </div>
    </div>
  );

  return(
    <AuthCtx.Provider value={{isEditor}}>
      <div style={{minHeight:"100vh",background:C.bg,padding:"22px 16px",fontFamily:font}}>
        {content}
        {modal==="create"&&<CreateProjectForm onSave={p=>{setProjects(ps=>[...ps,p]);setModal(null);}} onCancel={()=>setModal(null)}/>}
        {modal==="edit"&&sel&&<EditProjectForm project={sel} onSave={updateProj} onCancel={()=>setModal(null)}/>}
        {modal==="advance"&&<AddAdvanceForm onSave={addAdvance} onCancel={()=>setModal(null)}/>}
        {modal==="contract"&&<AddContractForm onSave={addContract} onCancel={()=>setModal(null)}/>}
        {modal==="payment"&&payContract&&<AddPaymentForm contract={payContract} onSave={pay=>addPayment(payContract.id,pay)} onCancel={()=>{setModal(null);setPayContract(null);}}/>}
      </div>
    </AuthCtx.Provider>
  );
}
