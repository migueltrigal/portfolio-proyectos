import { useState, useMemo, useCallback, useEffect, createContext, useContext } from "react";
import { LOGO_SRC } from "./logo.js";
import { loadAll, crearProyecto, editarProyecto, crearAvance, crearContrato, crearPago, subirFotoGithub } from "./api.js";

/* ─── Brand Tokens ─── */
const C = {
  navy: "#0E2841", teal: "#267B8A", orange: "#E97132", white: "#FFFFFF",
  bg: "#F4F6F8", cardBg: "#FFFFFF", border: "#DDE3EA", borderLight: "#EEF1F5",
  textPrimary: "#0E2841", textSecondary: "#4A5E74", textMuted: "#8899AB",
};
const font = "'Aptos', 'Segoe UI', -apple-system, sans-serif";

const AuthCtx = createContext({ isEditor: false });
const EDITOR_KEY = "innova2026";
function useAuth() { return useContext(AuthCtx); }

const PHASES = ["Ideación","Iniciación","Prototipado","Piloto","Implementación","Entrega","Seguimiento"];
const PHASE_INDEX = Object.fromEntries(PHASES.map((p, i) => [p, i]));
const STATUSES = ["En curso","En riesgo","Pausado","Completado","Cancelado"];
const STATUS_CONFIG = {
  "En curso":    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "●" },
  "En riesgo":   { color: C.orange, bg: "#FFF5EE", border: "#FDDCBE", icon: "▲" },
  "Pausado":     { color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", icon: "❚❚" },
  "Completado":  { color: C.teal, bg: "#EEF7F8", border: "#B8DDE2", icon: "✓" },
  "Cancelado":   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "✕" },
};

const fmt = n => "$" + n.toLocaleString("es-CO");
const fmtS = n => n == null ? "—" : "$" + (n >= 1e6 ? (n/1e6).toFixed(1)+"M" : (n/1e3).toFixed(0)+"K");
const fmtD = d => { if (!d) return "—"; const dt = new Date(d+"T12:00:00"); const m=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]; return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`; };
const sumPay = cs => cs.reduce((s,c) => s + c.payments.reduce((ss,p) => ss + p.amount, 0), 0);
const sumVal = cs => cs.reduce((s,c) => s + c.value, 0);

const inp = { width:"100%",padding:"10px 12px",borderRadius:6,fontSize:13,border:`1px solid ${C.border}`,fontFamily:font,fontWeight:500,color:C.textPrimary,background:C.white,outline:"none",boxSizing:"border-box" };
const lbl = { fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,display:"block",marginBottom:5 };
const btnP = { padding:"10px 24px",borderRadius:6,border:"none",cursor:"pointer",background:C.navy,color:C.white,fontWeight:700,fontSize:13,fontFamily:font };
const btnS = { padding:"10px 24px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,color:C.textSecondary,fontWeight:700,fontSize:13,fontFamily:font,cursor:"pointer" };

/* ─── Loading Spinner ─── */
function Spinner({ text = "Cargando..." }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60 }}>
      <div style={{ width:32,height:32,border:`3px solid ${C.borderLight}`,borderTop:`3px solid ${C.teal}`,borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
      <p style={{ marginTop:12,fontSize:13,color:C.textMuted,fontWeight:600 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
// Barra compacta para tarjetas: nombre legible + segmentos de progreso
function PhaseBar({phase}){
  const idx=PHASE_INDEX[phase]??0;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontSize:11,fontWeight:700,color:C.teal,background:"#EEF7F8",border:`1px solid #B8DDE2`,padding:"2px 9px",borderRadius:4,letterSpacing:"0.01em"}}>{phase}</span>
        <span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{idx+1}/{PHASES.length}</span>
      </div>
      <div style={{display:"flex",gap:2}}>
        {PHASES.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=idx?C.teal:C.borderLight}}/>)}
      </div>
    </div>
  );
}

// Stepper completo para la vista de detalle
function PhaseStepper({currentPhase}){
  const idx=PHASE_INDEX[currentPhase]??0;
  return(
    <div style={{display:"flex",alignItems:"flex-start",width:"100%"}}>
      {PHASES.map((p,i)=>{
        const done=i<idx,active=i===idx;
        return(
          <div key={p} style={{display:"flex",alignItems:"center",flex:i<PHASES.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
              <div style={{width:active?34:20,height:active?34:20,borderRadius:"50%",background:done||active?C.teal:"#E8ECF2",border:active?`3px solid ${C.teal}55`:"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:active?`0 0 0 5px ${C.teal}18`:"none",flexShrink:0,transition:"all 0.2s"}}>
                {done&&<span style={{color:C.white,fontSize:11,fontWeight:800}}>✓</span>}
                {active&&<span style={{color:C.white,fontSize:11,fontWeight:800}}>{i+1}</span>}
                {!done&&!active&&<span style={{color:"#94a3b8",fontSize:10,fontWeight:700}}>{i+1}</span>}
              </div>
              <span style={{fontSize:active?11:10,fontWeight:active?800:600,color:active?C.teal:done?"#267B8Aaa":C.textMuted,marginTop:6,whiteSpace:"nowrap",letterSpacing:active?"0.01em":0}}>{p}</span>
            </div>
            {i<PHASES.length-1&&<div style={{flex:1,height:2,minWidth:8,background:done?C.teal:"#E2E8F0",margin:"0 3px",marginBottom:22}}/>}
          </div>
        );
      })}
    </div>
  );
}

function Section({title,accent,action,children,style:sx}){return(<div style={{background:C.cardBg,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden",...sx}}>{title&&<div style={{padding:"13px 24px",borderBottom:`1px solid ${C.border}`,background:"#F7F9FB",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}>{accent&&<div style={{width:3,height:16,borderRadius:2,background:accent}}/>}<h3 style={{margin:0,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:C.textSecondary,fontFamily:font}}>{title}</h3></div>{action}</div>}{children}</div>);}

function Modal({title,onClose,children}){return(<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(14,40,65,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 24px 64px rgba(14,40,65,0.20)",width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto"}}><div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.white,zIndex:1,borderRadius:"12px 12px 0 0"}}><h2 style={{margin:0,fontSize:16,fontWeight:700,color:C.navy,fontFamily:font}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:C.textMuted,cursor:"pointer",padding:4,lineHeight:1}}>✕</button></div><div style={{padding:"20px 24px"}}>{children}</div></div></div>);}

/* ─── Photo Helpers ─── */
function PhotoField({ value, onChange, folder, label = "Foto" }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async e => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const url = await subirFotoGithub(file, folder);
      onChange(url);
    } catch (err) { alert("Error al subir foto: " + err.message); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <label style={lbl}>{label}</label>
      {value
        ? <div><img src={value} alt="foto" style={{ width:"100%",height:160,objectFit:"contain",background:C.bg,borderRadius:6,display:"block",border:`1px solid ${C.border}` }}/><label style={{ display:"inline-block",marginTop:6,fontSize:11,color:C.teal,cursor:uploading?"wait":"pointer",fontWeight:600 }}>{uploading?"Subiendo...":"📷 Cambiar foto"}<input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} disabled={uploading}/></label></div>
        : <label style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:90,borderRadius:6,background:C.bg,border:`1px dashed ${C.border}`,cursor:uploading?"wait":"pointer",color:C.textMuted,fontSize:12,fontWeight:600,gap:4 }}>{uploading?"Subiendo...":"📷 Seleccionar foto (opcional)"}<input type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} disabled={uploading}/></label>
      }
    </div>
  );
}

/* ─── Forms ─── */
function CreateProjectForm({onSave,onCancel}){const[f,sF]=useState({name:"",description:"",responsible:"",sede:"",startDate:"",estimatedEnd:"",budget:"",status:"En curso",phase:"Ideación",fotoPrincipal:""});const[saving,setSaving]=useState(false);const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.name&&f.responsible&&f.startDate&&!saving;
  const handleSave=async()=>{setSaving(true);try{await onSave({...f,budget:f.budget?Number(f.budget):null});}catch(e){alert("Error al crear: "+e.message);setSaving(false);}};
  return(<Modal title="Nuevo proyecto" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Nombre *</label><input style={inp} value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Ej: Automatización de riego"/></div><div><label style={lbl}>Descripción</label><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Responsable *</label><input style={inp} value={f.responsible} onChange={e=>s("responsible",e.target.value)}/></div><div><label style={lbl}>Sede</label><input style={inp} value={f.sede} onChange={e=>s("sede",e.target.value)} placeholder="Ej: Trigal Norte"/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Presupuesto (COP)</label><input style={inp} type="number" value={f.budget} onChange={e=>s("budget",e.target.value)} placeholder="Opcional"/></div><div/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Fecha inicio *</label><input style={inp} type="date" value={f.startDate} onChange={e=>s("startDate",e.target.value)}/></div><div><label style={lbl}>Fecha est. terminación</label><input style={inp} type="date" value={f.estimatedEnd} onChange={e=>s("estimatedEnd",e.target.value)}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Estado</label><select style={inp} value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div><div><label style={lbl}>Fase</label><select style={inp} value={f.phase} onChange={e=>s("phase",e.target.value)}>{PHASES.map(x=><option key={x}>{x}</option>)}</select></div></div><PhotoField value={f.fotoPrincipal} onChange={v=>s("fotoPrincipal",v)} folder="proyectos" label="Foto principal"/><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Crear"}</button></div></div></Modal>);}

function EditProjectForm({project:p,onSave,onCancel}){const[f,sF]=useState({name:p.name,description:p.description,responsible:p.responsible,sede:p.sede||"",estimatedEnd:p.estimatedEnd,budget:p.budget!=null?String(p.budget):"",status:p.status,phase:p.phase,fotoPrincipal:p.fotoPrincipal||""});const[saving,setSaving]=useState(false);const s=(k,v)=>sF(x=>({...x,[k]:v}));
  const handleSave=async()=>{setSaving(true);try{await onSave({...p,...f,budget:f.budget?Number(f.budget):null});}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(<Modal title="Editar proyecto" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Nombre</label><input style={inp} value={f.name} onChange={e=>s("name",e.target.value)}/></div><div><label style={lbl}>Descripción</label><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Responsable</label><input style={inp} value={f.responsible} onChange={e=>s("responsible",e.target.value)}/></div><div><label style={lbl}>Sede</label><input style={inp} value={f.sede} onChange={e=>s("sede",e.target.value)} placeholder="Ej: Trigal Norte"/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}><div><label style={lbl}>Presupuesto (COP)</label><input style={inp} type="number" value={f.budget} onChange={e=>s("budget",e.target.value)} placeholder="Opcional"/></div><div><label style={lbl}>Fecha est. fin</label><input style={inp} type="date" value={f.estimatedEnd} onChange={e=>s("estimatedEnd",e.target.value)}/></div><div/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Estado</label><select style={inp} value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div><div><label style={lbl}>Fase</label><select style={inp} value={f.phase} onChange={e=>s("phase",e.target.value)}>{PHASES.map(x=><option key={x}>{x}</option>)}</select></div></div><PhotoField value={f.fotoPrincipal} onChange={v=>s("fotoPrincipal",v)} folder="proyectos" label="Foto principal"/><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:saving?0.5:1}} onClick={handleSave}>{saving?"Guardando...":"Guardar"}</button></div></div></Modal>);}

function AddAdvanceForm({onSave,onCancel}){const[f,sF]=useState({title:"",description:"",nextStep:"",date:new Date().toISOString().split("T")[0],registeredBy:"",fotoEvidencia:""});const[saving,setSaving]=useState(false);const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.title&&f.nextStep&&f.date&&f.registeredBy&&!saving;
  const handleSave=async()=>{setSaving(true);try{await onSave(f);}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(<Modal title="Registrar avance" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Título *</label><input style={inp} value={f.title} onChange={e=>s("title",e.target.value)}/></div><div><label style={lbl}>Descripción</label><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></div><div><label style={lbl}>Próximo paso *</label><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={f.nextStep} onChange={e=>s("nextStep",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></div><div><label style={lbl}>Registrado por *</label><input style={inp} value={f.registeredBy} onChange={e=>s("registeredBy",e.target.value)}/></div></div><PhotoField value={f.fotoEvidencia} onChange={v=>s("fotoEvidencia",v)} folder="avances" label="Foto evidencia"/><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Guardar"}</button></div></div></Modal>);}

function AddContractForm({onSave,onCancel}){const[f,sF]=useState({provider:"",concept:"",value:""});const[saving,setSaving]=useState(false);const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.provider&&f.concept&&f.value&&!saving;
  const handleSave=async()=>{setSaving(true);try{await onSave({...f,value:Number(f.value)});}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(<Modal title="Nuevo contrato / ODS" onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div><label style={lbl}>Proveedor *</label><input style={inp} value={f.provider} onChange={e=>s("provider",e.target.value)}/></div><div><label style={lbl}>Concepto *</label><input style={inp} value={f.concept} onChange={e=>s("concept",e.target.value)}/></div><div><label style={lbl}>Valor (COP) *</label><input style={inp} type="number" value={f.value} onChange={e=>s("value",e.target.value)}/></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Crear"}</button></div></div></Modal>);}

function AddPaymentForm({contract,onSave,onCancel}){const[f,sF]=useState({amount:"",date:new Date().toISOString().split("T")[0],note:""});const[saving,setSaving]=useState(false);const s=(k,v)=>sF(p=>({...p,[k]:v}));const ok=f.amount&&f.date&&!saving;
  const handleSave=async()=>{setSaving(true);try{await onSave({...f,amount:Number(f.amount)});}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(<Modal title={`Pago — ${contract.provider}`} onClose={onCancel}><div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{padding:"12px 16px",background:"#F7F9FB",borderRadius:6,border:`1px solid ${C.borderLight}`}}><p style={{margin:"0 0 2px",...lbl}}>Contrato</p><p style={{margin:0,fontSize:13,fontWeight:700,color:C.navy}}>{contract.concept}</p><p style={{margin:"4px 0 0",fontSize:12,color:C.textSecondary}}>Valor: {fmt(contract.value)} · Pagado: {fmt(contract.payments.reduce((s,p)=>s+p.amount,0))}</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Monto (COP) *</label><input style={inp} type="number" value={f.amount} onChange={e=>s("amount",e.target.value)}/></div><div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></div></div><div><label style={lbl}>Nota</label><input style={inp} value={f.note} onChange={e=>s("note",e.target.value)} placeholder="Ej: Anticipo 50%"/></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><button style={btnS} onClick={onCancel}>Cancelar</button><button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Registrar"}</button></div></div></Modal>);}

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
  const sc=STATUS_CONFIG[p.status]||STATUS_CONFIG["En curso"];const paid=sumPay(p.contracts);const lastAdv=p.advances[0];const hasBudget=p.budget!=null;const budgetPct=hasBudget?Math.min((paid/p.budget)*100,100):0;
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
        <p style={{fontSize:11,color:C.textSecondary,margin:"0 0 2px",fontWeight:600}}>{p.responsible}</p>
        {p.sede&&<p style={{fontSize:10,color:C.textMuted,margin:0,fontWeight:600}}>📍 {p.sede}</p>}
      </div>
      <div style={{height:1,background:C.borderLight}}/>
      <div style={{padding:"12px 18px"}}><PhaseBar phase={p.phase}/></div>
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
  const{isEditor}=useAuth();const[tab,setTab]=useState("timeline");const sc=STATUS_CONFIG[p.status]||STATUS_CONFIG["En curso"];
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
            <p style={{fontSize:12,color:C.textSecondary,margin:"0 0 4px",fontWeight:600}}>Responsable: {p.responsible}</p>
            {p.sede&&<p style={{fontSize:11,color:C.textMuted,margin:"0 0 12px",fontWeight:600}}>📍 {p.sede}</p>}
            <p style={{fontSize:13,color:C.textPrimary,margin:0,lineHeight:1.6}}>{p.description}</p>
          </div>
          {p.fotoPrincipal&&
            <img src={p.fotoPrincipal} alt="foto principal" style={{width:200,height:160,objectFit:"contain",background:C.bg,borderRadius:8,flexShrink:0,display:"block",border:`1px solid ${C.border}`}}/>
          }
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
      {lastAdv&&<Section title="Próximo paso" accent={C.orange} style={{marginBottom:16}}><div style={{padding:"16px 24px",display:"flex",gap:14,alignItems:"flex-start"}}><div style={{width:30,height:30,borderRadius:6,flexShrink:0,background:"#FFF5EE",border:"1px solid #FDDCBE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.orange,fontWeight:800}}>→</div><p style={{fontSize:13,color:C.navy,margin:0,lineHeight:1.55,fontWeight:600}}>{lastAdv.nextStep}</p></div></Section>}
      <div style={{display:"flex",marginBottom:16,background:C.white,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        {[{key:"timeline",label:"Avances",count:p.advances.length},{key:"finance",label:"Contratos y pagos",count:p.contracts.length}].map((t,i)=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,padding:"12px 20px",borderRight:i===0?`1px solid ${C.border}`:"none",background:tab===t.key?C.navy:C.white,color:tab===t.key?C.white:C.textSecondary,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:font,border:"none",textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.label} · {t.count}</button>
        ))}
      </div>
      {tab==="timeline"&&<>{isEditor&&<button onClick={onAddAdvance} style={{...btnP,marginBottom:16,fontSize:12}}>+ Registrar avance</button>}
        <div style={{position:"relative",paddingLeft:30}}><div style={{position:"absolute",left:10,top:10,bottom:10,width:2,background:C.border}}/>
          {p.advances.map((adv,i)=>(
            <div key={adv.id} style={{position:"relative",marginBottom:16}}>
              <div style={{position:"absolute",left:-25,top:24,width:i===0?16:10,height:i===0?16:10,borderRadius:"50%",background:i===0?C.teal:"#C5CDD8",border:`3px solid ${C.bg}`,boxShadow:i===0?`0 0 0 3px ${C.teal}20`:"none",transform:i===0?"translate(-3px,-3px)":""}}/>
              <Section><div style={{padding:"10px 20px",background:i===0?"#EEF7F8":"#F7F9FB",borderBottom:`1px solid ${C.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,fontWeight:700,color:i===0?C.teal:C.textSecondary}}>{fmtD(adv.date)}</span><span style={{fontSize:10,color:C.textMuted,fontWeight:600}}>{adv.registeredBy}</span></div>
                <div style={{padding:"16px 20px"}}><h4 style={{fontSize:13,fontWeight:700,color:C.navy,margin:"0 0 8px",lineHeight:1.35}}>{adv.title}</h4><p style={{fontSize:12,color:C.textSecondary,margin:"0 0 14px",lineHeight:1.6}}>{adv.description}</p>{adv.fotoEvidencia&&<img src={adv.fotoEvidencia} alt="evidencia" style={{width:"100%",height:240,objectFit:"contain",background:C.bg,borderRadius:6,border:`1px solid ${C.border}`,display:"block"}}/>}</div>
                <div style={{padding:"12px 20px",background:"#F7F9FB",borderTop:`1px solid ${C.borderLight}`}}><p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.textMuted,margin:"0 0 3px"}}>Próximo paso</p><p style={{fontSize:11,color:C.textPrimary,margin:0,lineHeight:1.5,fontWeight:600}}>{adv.nextStep}</p></div>
              </Section>
            </div>
          ))}
          {p.advances.length===0&&<p style={{color:C.textMuted,fontSize:13,padding:"20px 0"}}>No hay avances.</p>}
        </div>
      </>}
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
  const[projects,setProjects]=useState([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);
  const[selId,setSelId]=useState(null);
  const[filter,setFilter]=useState("Todos");
  const[modal,setModal]=useState(null);
  const[payContract,setPayContract]=useState(null);
  const[isEditor,setIsEditor]=useState(false);

  // Load data from SharePoint
  const reload = useCallback(async () => {
    try {
      const data = await loadAll();
      setProjects(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const sel = projects.find(p => p.id === selId) || null;
  const filtered = useMemo(() => filter === "Todos" ? projects : projects.filter(p => p.status === filter), [filter, projects]);
  const stats = useMemo(() => ({ total: projects.length, risk: projects.filter(p => p.status === "En riesgo").length, budget: projects.reduce((s, p) => s + (p.budget || 0), 0), spent: projects.reduce((s, p) => s + sumPay(p.contracts), 0) }), [projects]);

  const handleCreateProject = useCallback(async (data) => {
    await crearProyecto(data);
    setModal(null);
    await reload();
  }, [reload]);

  const handleEditProject = useCallback(async (data) => {
    await editarProyecto(data);
    setModal(null);
    await reload();
  }, [reload]);

  const handleAddAdvance = useCallback(async (data) => {
    await crearAvance(selId, data);
    setModal(null);
    await reload();
  }, [selId, reload]);

  const handleAddContract = useCallback(async (data) => {
    await crearContrato(selId, data);
    setModal(null);
    await reload();
  }, [selId, reload]);

  const handleAddPayment = useCallback(async (data) => {
    await crearPago(payContract.id, data);
    setModal(null);
    setPayContract(null);
    await reload();
  }, [payContract, reload]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner text="Cargando portafolio..." />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <p style={{ fontSize: 16, color: "#dc2626", fontWeight: 700, marginBottom: 8 }}>Error al cargar datos</p>
        <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>{error}</p>
        <button onClick={() => { setLoading(true); setError(null); reload(); }} style={btnP}>Reintentar</button>
      </div>
    </div>
  );

  const content = sel ? (
    <ProjectDetail project={sel} onBack={() => { setSelId(null); setModal(null); }} onEdit={() => setModal("edit")} onAddAdvance={() => setModal("advance")} onAddContract={() => setModal("contract")} onAddPayment={c => { setPayContract(c); setModal("payment"); }} />
  ) : (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src={LOGO_SRC} alt="I+D" style={{ height: 48 }} />
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textMuted, margin: "0 0 2px" }}>Innovación y Transformación Digital</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: 0, letterSpacing: "-0.01em" }}>Portafolio de Proyectos</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AuthBar isEditor={isEditor} onLogin={() => setIsEditor(true)} onLogout={() => setIsEditor(false)} />
            {isEditor && <button onClick={() => setModal("create")} style={{ ...btnP, fontSize: 12 }}>+ Nuevo proyecto</button>}
          </div>
        </div>
        <div style={{ display: "flex", background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
          {[{ label: "Proyectos", value: stats.total }, { label: "En riesgo", value: stats.risk, accent: stats.risk > 0 ? C.orange : null }, { label: "Presupuesto total", value: fmtS(stats.budget) }, { label: "Total pagado", value: fmtS(stats.spent) }].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 18px", borderRight: i < 3 ? `1px solid ${C.borderLight}` : "none" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, margin: "0 0 2px" }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.accent || C.navy, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["Todos", ...STATUSES].map(f => { const a = filter === f; const cfg = f !== "Todos" ? STATUS_CONFIG[f] : null; return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${a ? C.navy : C.border}`, background: a ? C.navy : C.white, color: a ? C.white : C.textSecondary, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: font }}>{cfg ? cfg.icon + " " : ""}{f}</button>
          ); })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => setSelId(p.id)} />)}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 60, color: C.textMuted, fontSize: 13 }}>No hay proyectos{filter !== "Todos" ? ` con estado "${filter}"` : ""}</div>}
      <div style={{ display: "flex", height: 4, borderRadius: 2, marginTop: 32, overflow: "hidden" }}>
        <div style={{ flex: 3, background: C.navy }} /><div style={{ flex: 1, background: C.orange }} />
      </div>
    </div>
  );

  return (
    <AuthCtx.Provider value={{ isEditor }}>
      <div style={{ minHeight: "100vh", background: C.bg, padding: "22px 16px", fontFamily: font }}>
        {content}
        {modal === "create" && <CreateProjectForm onSave={handleCreateProject} onCancel={() => setModal(null)} />}
        {modal === "edit" && sel && <EditProjectForm project={sel} onSave={handleEditProject} onCancel={() => setModal(null)} />}
        {modal === "advance" && <AddAdvanceForm onSave={handleAddAdvance} onCancel={() => setModal(null)} />}
        {modal === "contract" && <AddContractForm onSave={handleAddContract} onCancel={() => setModal(null)} />}
        {modal === "payment" && payContract && <AddPaymentForm contract={payContract} onSave={handleAddPayment} onCancel={() => { setModal(null); setPayContract(null); }} />}
      </div>
    </AuthCtx.Provider>
  );
}
