import { useState } from "react";
import { C, font, PHASES, STATUSES, fmt, inp, lbl, btnP, btnS } from "./tokens.js";
import { useAuth } from "./context.js";
import { subirFotoGithub } from "./api.js";

function Modal({title,onClose,children}){
  const{isMobile}=useAuth();
  const ph=isMobile?"14px 16px":"18px 24px",pb=isMobile?"16px 16px":"20px 24px";
  return(<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(14,40,65,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?8:16}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 24px 64px rgba(14,40,65,0.20)",width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto"}}><div style={{padding:ph,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.white,zIndex:1,borderRadius:"12px 12px 0 0"}}><h2 style={{margin:0,fontSize:16,fontWeight:700,color:C.navy,fontFamily:font}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:C.textMuted,cursor:"pointer",padding:4,lineHeight:1}}>✕</button></div><div style={{padding:pb}}>{children}</div></div></div>);
}

function PhotoField({ value, onChange, folder, label = "Foto", id }) {
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
      <p style={{...lbl, margin: 0, marginBottom: 5}}>{label}</p>
      {value
        ? <div><img src={value} alt="foto" style={{ width:"100%",height:160,objectFit:"contain",background:C.bg,borderRadius:6,display:"block",border:`1px solid ${C.border}` }}/><label htmlFor={id} style={{ display:"inline-block",marginTop:6,fontSize:11,color:C.teal,cursor:uploading?"wait":"pointer",fontWeight:600 }}>{uploading?"Subiendo...":"📷 Cambiar foto"}<input id={id} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} disabled={uploading}/></label></div>
        : <label htmlFor={id} style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:90,borderRadius:6,background:C.bg,border:`1px dashed ${C.border}`,cursor:uploading?"wait":"pointer",color:C.textMuted,fontSize:12,fontWeight:600,gap:4 }}>{uploading?"Subiendo...":"📷 Seleccionar foto (opcional)"}<input id={id} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} disabled={uploading}/></label>
      }
    </div>
  );
}

function F({id, label, children}) {
  return (
    <div>
      <label htmlFor={id} style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function CreateProjectForm({onSave,onCancel}){
  const[f,sF]=useState({name:"",description:"",responsible:"",sede:"",linkBrightIdea:"",startDate:"",estimatedEnd:"",budget:"",status:"En curso",phase:"Ideación",fotoPrincipal:""});
  const[saving,setSaving]=useState(false);
  const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const ok=f.name&&f.responsible&&f.startDate&&!saving;
  const{isMobile}=useAuth();const g1=isMobile?"1fr":"1fr 1fr";
  const handleSave=async()=>{setSaving(true);try{await onSave({...f,budget:f.budget?Number(f.budget):null});}catch(e){alert("Error al crear: "+e.message);setSaving(false);}};
  return(
    <Modal title="Nuevo proyecto" onClose={onCancel}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <F id="cp-name" label="Nombre *"><input id="cp-name" style={inp} value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Ej: Automatización de riego"/></F>
        <F id="cp-desc" label="Descripción"><textarea id="cp-desc" style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></F>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="cp-responsible" label="Responsable *"><input id="cp-responsible" style={inp} value={f.responsible} onChange={e=>s("responsible",e.target.value)}/></F>
          <F id="cp-sede" label="Sede"><input id="cp-sede" style={inp} value={f.sede} onChange={e=>s("sede",e.target.value)} placeholder="Ej: Aguas Claras"/></F>
        </div>
        <F id="cp-link" label="Link BrightIdea"><input id="cp-link" style={inp} type="url" value={f.linkBrightIdea} onChange={e=>s("linkBrightIdea",e.target.value)} placeholder="https://..."/></F>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="cp-budget" label="Presupuesto (COP)"><input id="cp-budget" style={inp} type="number" value={f.budget} onChange={e=>s("budget",e.target.value)} placeholder="Opcional"/></F>
          <div/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="cp-start" label="Fecha inicio *"><input id="cp-start" style={inp} type="date" value={f.startDate} onChange={e=>s("startDate",e.target.value)}/></F>
          <F id="cp-end" label="Fecha est. terminación"><input id="cp-end" style={inp} type="date" value={f.estimatedEnd} onChange={e=>s("estimatedEnd",e.target.value)}/></F>
        </div>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="cp-status" label="Estado"><select id="cp-status" style={inp} value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></F>
          <F id="cp-phase" label="Fase"><select id="cp-phase" style={inp} value={f.phase} onChange={e=>s("phase",e.target.value)}>{PHASES.map(x=><option key={x}>{x}</option>)}</select></F>
        </div>
        <PhotoField id="cp-foto" value={f.fotoPrincipal} onChange={v=>s("fotoPrincipal",v)} folder="proyectos" label="Foto principal"/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button style={btnS} onClick={onCancel}>Cancelar</button>
          <button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Crear"}</button>
        </div>
      </div>
    </Modal>
  );
}

function EditProjectForm({project:p,onSave,onCancel}){
  const[f,sF]=useState({name:p.name,description:p.description,responsible:p.responsible,sede:p.sede||"",linkBrightIdea:p.linkBrightIdea||"",estimatedEnd:p.estimatedEnd,budget:p.budget!=null?String(p.budget):"",status:p.status,phase:p.phase,fotoPrincipal:p.fotoPrincipal||""});
  const[saving,setSaving]=useState(false);
  const s=(k,v)=>sF(x=>({...x,[k]:v}));
  const{isMobile}=useAuth();const g1=isMobile?"1fr":"1fr 1fr";
  const handleSave=async()=>{setSaving(true);try{await onSave({...p,...f,budget:f.budget?Number(f.budget):null});}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(
    <Modal title="Editar proyecto" onClose={onCancel}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <F id="ep-name" label="Nombre"><input id="ep-name" style={inp} value={f.name} onChange={e=>s("name",e.target.value)}/></F>
        <F id="ep-desc" label="Descripción"><textarea id="ep-desc" style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></F>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="ep-responsible" label="Responsable"><input id="ep-responsible" style={inp} value={f.responsible} onChange={e=>s("responsible",e.target.value)}/></F>
          <F id="ep-sede" label="Sede"><input id="ep-sede" style={inp} value={f.sede} onChange={e=>s("sede",e.target.value)} placeholder="Ej: Aguas Claras"/></F>
        </div>
        <F id="ep-link" label="Link BrightIdea"><input id="ep-link" style={inp} type="url" value={f.linkBrightIdea} onChange={e=>s("linkBrightIdea",e.target.value)} placeholder="https://..."/></F>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="ep-budget" label="Presupuesto (COP)"><input id="ep-budget" style={inp} type="number" value={f.budget} onChange={e=>s("budget",e.target.value)} placeholder="Opcional"/></F>
          <F id="ep-end" label="Fecha est. fin"><input id="ep-end" style={inp} type="date" value={f.estimatedEnd} onChange={e=>s("estimatedEnd",e.target.value)}/></F>
        </div>
        <div style={{display:"grid",gridTemplateColumns:g1,gap:12}}>
          <F id="ep-status" label="Estado"><select id="ep-status" style={inp} value={f.status} onChange={e=>s("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></F>
          <F id="ep-phase" label="Fase"><select id="ep-phase" style={inp} value={f.phase} onChange={e=>s("phase",e.target.value)}>{PHASES.map(x=><option key={x}>{x}</option>)}</select></F>
        </div>
        <PhotoField id="ep-foto" value={f.fotoPrincipal} onChange={v=>s("fotoPrincipal",v)} folder="proyectos" label="Foto principal"/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button style={btnS} onClick={onCancel}>Cancelar</button>
          <button style={{...btnP,opacity:saving?0.5:1}} onClick={handleSave}>{saving?"Guardando...":"Guardar"}</button>
        </div>
      </div>
    </Modal>
  );
}

function AddAdvanceForm({onSave,onCancel}){
  const[f,sF]=useState({title:"",description:"",nextStep:"",date:new Date().toISOString().split("T")[0],registeredBy:"",fotoEvidencia:""});
  const[saving,setSaving]=useState(false);
  const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const ok=f.title&&f.nextStep&&f.date&&f.registeredBy&&!saving;
  const{isMobile}=useAuth();
  const handleSave=async()=>{setSaving(true);try{await onSave(f);}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(
    <Modal title="Registrar avance" onClose={onCancel}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <F id="av-title" label="Título *"><input id="av-title" style={inp} value={f.title} onChange={e=>s("title",e.target.value)}/></F>
        <F id="av-desc" label="Descripción"><textarea id="av-desc" style={{...inp,minHeight:80,resize:"vertical"}} value={f.description} onChange={e=>s("description",e.target.value)}/></F>
        <F id="av-next" label="Próximo paso *"><textarea id="av-next" style={{...inp,minHeight:60,resize:"vertical"}} value={f.nextStep} onChange={e=>s("nextStep",e.target.value)}/></F>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
          <F id="av-date" label="Fecha *"><input id="av-date" style={inp} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></F>
          <F id="av-by" label="Registrado por *"><input id="av-by" style={inp} value={f.registeredBy} onChange={e=>s("registeredBy",e.target.value)}/></F>
        </div>
        <PhotoField id="av-foto" value={f.fotoEvidencia} onChange={v=>s("fotoEvidencia",v)} folder="avances" label="Foto evidencia"/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button style={btnS} onClick={onCancel}>Cancelar</button>
          <button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Guardar"}</button>
        </div>
      </div>
    </Modal>
  );
}

function AddContractForm({onSave,onCancel}){
  const[f,sF]=useState({provider:"",concept:"",value:""});
  const[saving,setSaving]=useState(false);
  const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const ok=f.provider&&f.concept&&f.value&&!saving;
  const handleSave=async()=>{setSaving(true);try{await onSave({...f,value:Number(f.value)});}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(
    <Modal title="Nuevo contrato / ODS" onClose={onCancel}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <F id="ct-provider" label="Proveedor *"><input id="ct-provider" style={inp} value={f.provider} onChange={e=>s("provider",e.target.value)}/></F>
        <F id="ct-concept" label="Concepto *"><input id="ct-concept" style={inp} value={f.concept} onChange={e=>s("concept",e.target.value)}/></F>
        <F id="ct-value" label="Valor (COP) *"><input id="ct-value" style={inp} type="number" value={f.value} onChange={e=>s("value",e.target.value)}/></F>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button style={btnS} onClick={onCancel}>Cancelar</button>
          <button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Crear"}</button>
        </div>
      </div>
    </Modal>
  );
}

function AddPaymentForm({contract,onSave,onCancel}){
  const[f,sF]=useState({amount:"",date:new Date().toISOString().split("T")[0],note:""});
  const[saving,setSaving]=useState(false);
  const s=(k,v)=>sF(p=>({...p,[k]:v}));
  const ok=f.amount&&f.date&&!saving;
  const handleSave=async()=>{setSaving(true);try{await onSave({...f,amount:Number(f.amount)});}catch(e){alert("Error: "+e.message);setSaving(false);}};
  return(
    <Modal title={`Pago — ${contract.provider}`} onClose={onCancel}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{padding:"12px 16px",background:"#F7F9FB",borderRadius:6,border:`1px solid ${C.borderLight}`}}>
          <p style={{margin:"0 0 2px",...lbl}}>Contrato</p>
          <p style={{margin:0,fontSize:13,fontWeight:700,color:C.navy}}>{contract.concept}</p>
          <p style={{margin:"4px 0 0",fontSize:12,color:C.textSecondary}}>Valor: {fmt(contract.value)} · Pagado: {fmt(contract.payments.reduce((s,p)=>s+p.amount,0))}</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <F id="pay-amount" label="Monto (COP) *"><input id="pay-amount" style={inp} type="number" value={f.amount} onChange={e=>s("amount",e.target.value)}/></F>
          <F id="pay-date" label="Fecha *"><input id="pay-date" style={inp} type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></F>
        </div>
        <F id="pay-note" label="Nota"><input id="pay-note" style={inp} value={f.note} onChange={e=>s("note",e.target.value)} placeholder="Ej: Anticipo 50%"/></F>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button style={btnS} onClick={onCancel}>Cancelar</button>
          <button style={{...btnP,opacity:ok?1:0.5,pointerEvents:ok?"auto":"none"}} onClick={handleSave}>{saving?"Guardando...":"Registrar"}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ModalRenderer({ modal, sel, payContract, onCreateProject, onEditProject, onAddAdvance, onAddContract, onAddPayment, onCancel, onCancelPayment }) {
  if (modal === "create")                   return <CreateProjectForm  onSave={onCreateProject} onCancel={onCancel} />;
  if (modal === "edit"    && sel)           return <EditProjectForm    project={sel}            onSave={onEditProject} onCancel={onCancel} />;
  if (modal === "advance")                  return <AddAdvanceForm     onSave={onAddAdvance}    onCancel={onCancel} />;
  if (modal === "contract")                 return <AddContractForm    onSave={onAddContract}   onCancel={onCancel} />;
  if (modal === "payment" && payContract)   return <AddPaymentForm     contract={payContract}   onSave={onAddPayment} onCancel={onCancelPayment} />;
  return null;
}
